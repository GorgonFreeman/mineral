const readline = require('readline');
const { toAbsolutePath, setWorkspace } = require('../api/workspace');
const { getApiDirs, readCliFlag } = require('../cli');
const { loadHandlers } = require('../server');
const { readHostingYml, getCredsJsonForDeploy, getHostedApiKeyForDeploy, resolveHostedHandlersForDeploy, functionUsesWrapper } = require('../hosting.utils');
const { writeHostedJs } = require('./generateHosted');
const { execCommand } = require('./execCommand');
const { formatSetEnvVarsForGcloud, shellQuoteSingle } = require('./setEnvVarsGcloud');

const GCLOUD_NODEJS_MAX_MAJOR = 24;

const gcloudRuntimeFromCurrentNode = () => {
  const localMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
  const effective = Number.isNaN(localMajor) ? GCLOUD_NODEJS_MAX_MAJOR : localMajor;
  const major = Math.min(effective, GCLOUD_NODEJS_MAX_MAJOR);
  return `nodejs${ major }`;
};

const getHostConfig = (options = {}) => ({
  workspace: toAbsolutePath(
    options.workspace
      ?? readCliFlag('--workspace')
      ?? process.env.MINERAL_WORKSPACE
      ?? process.cwd(),
  ),
  api_dirs: getApiDirs(options),
});

const chooseOption = async (prompt, options) => new Promise((resolve) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(prompt);
  options.forEach((option, index) => {
    console.log(`  ${ index + 1 }. ${ option }`);
  });

  rl.question('> ', (answer) => {
    rl.close();
    const choice = Number(answer) - 1;
    resolve(options[choice] ?? options[0]);
  });
});

const anyHostedEntryUsesWrapper = (hostedEntries, wrapperName) => (
  hostedEntries.some((hostedEntry) => hostedEntry.wrappers?.includes(wrapperName))
);

const getDeployArgs = () => {
  const args = process.argv.slice(2);
  const deployArgs = [];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === '--workspace' || arg === '--api_dirs') {
      index++;
      continue;
    }

    if (arg.startsWith('--workspace=') || arg.startsWith('--api_dirs=')) {
      continue;
    }

    deployArgs.push(arg);
  }

  return deployArgs;
};

const handlerByRouteName = (handlers) => {
  const byName = new Map();

  for (const handler of handlers.values()) {
    byName.set(handler.routeName, handler);
  }

  return byName;
};

const deployFunction = async ({
  functionName,
  functionConfig,
  googleCloudInfo,
  workspace,
  credsJson,
  hostedApiKey,
}) => {
  const config = {
    ...googleCloudInfo,
    ...functionConfig,
  };

  let {
    project,
    region,
    trigger = 'http',
    runtime = gcloudRuntimeFromCurrentNode(),
    allow_unauthenticated: allowUnauthenticated = true,
    gen2 = true,
    set_env_vars: extraSetEnvVars,
    entry_point: entryPoint,
    schedules,
    groups,
    wrappers,
    source,
    ...gcloudArgs
  } = config;

  const resolvedEntryPoint = entryPoint || functionName;
  const envParts = [
    'HOSTED=true',
    `CREDS=${ credsJson }`,
  ];

  if (hostedApiKey) {
    envParts.push(`HOSTED_API_KEY=${ hostedApiKey }`);
  }

  if (extraSetEnvVars) {
    envParts.push(extraSetEnvVars);
  }

  const rawSetEnvVars = envParts.join(',');
  const setEnvVarsForGcloud = formatSetEnvVarsForGcloud(rawSetEnvVars);

  const deployCommand = [
    `gcloud functions deploy ${ functionName }`,
    `--project ${ project }`,
    `--region ${ region }`,
    `--source ${ shellQuoteSingle(workspace) }`,
    `--entry-point ${ resolvedEntryPoint }`,
    `--trigger-${ trigger }`,
    `--runtime ${ runtime }`,
    `--set-env-vars ${ shellQuoteSingle(setEnvVarsForGcloud) }`,
    ...(allowUnauthenticated ? ['--allow-unauthenticated'] : []),
    ...(gen2 ? ['--gen2'] : []),
    ...Object.entries(gcloudArgs).map(([key, value]) => `--${ key.replaceAll('_', '-') } ${ value }`),
  ].join(' ');

  console.log(deployCommand);

  try {
    await execCommand(deployCommand);
  } catch (error) {
    console.error(`Error deploying function ${ functionName }:`, error);
    return;
  }

  if (!schedules?.length) {
    return;
  }

  const requiresHostedApiKey = functionUsesWrapper(functionConfig, 'requireHostedApiKey');

  for (const schedule of schedules) {
    const {
      name: jobName,
      schedule: jobSchedule,
      http_method: jobHttpMethod = 'POST',
      headers: jobHeaders = '',
      message_body: jobMessageBody,
      ...schedulerArgs
    } = schedule;

    let schedulerHeaders = jobHeaders;
    if (requiresHostedApiKey && hostedApiKey) {
      schedulerHeaders = schedulerHeaders ? `${ schedulerHeaders },` : '';
      schedulerHeaders += `x-api-key=${ hostedApiKey }`;
    }

    try {
      const checkCommand = `gcloud scheduler jobs describe ${ jobName } --project=${ project } --location=${ region } 2>/dev/null || echo "NOT_FOUND"`;
      const checkResult = await execCommand(checkCommand);
      const jobExists = !checkResult.stdout.includes('NOT_FOUND');

      const schedulerCommand = [
        jobExists ? `gcloud scheduler jobs update http ${ jobName }` : `gcloud scheduler jobs create http ${ jobName }`,
        `--schedule="${ jobSchedule }"`,
        `--uri="https://${ region }-${ project }.cloudfunctions.net/${ functionName }"`,
        `--http-method=${ jobHttpMethod }`,
        `--project=${ project }`,
        `--location=${ region }`,
        jobExists ? `--update-headers ${ schedulerHeaders }` : `--headers ${ schedulerHeaders }`,
        ...(jobMessageBody ? [`--message-body '${ jobMessageBody }'`] : []),
        ...Object.entries(schedulerArgs).map(([key, value]) => `--${ key.replaceAll('_', '-') } ${ value }`),
      ].join(' ');

      console.log(schedulerCommand);
      await execCommand(schedulerCommand);
    } catch (error) {
      console.error(`Error handling scheduler job ${ jobName }:`, error);
    }
  }
};

const deployFromHostingYml = async (options = {}) => {
  const config = getHostConfig(options);
  setWorkspace(config.workspace);

  const hostingConfig = readHostingYml(config.workspace);
  const {
    google_cloud_info: googleCloudInfo,
    functions = {},
    groups = {},
  } = hostingConfig;

  if (!googleCloudInfo?.project || !googleCloudInfo?.region) {
    throw new Error('.hosting.yml requires google_cloud_info.project and google_cloud_info.region');
  }

  const handlers = loadHandlers({
    ...config,
    host_mode: true,
  });
  const handlersByName = handlerByRouteName(handlers);
  const hostedHandlers = resolveHostedHandlersForDeploy({
    functions,
    workspace: config.workspace,
    handlersByName,
  });

  if (anyHostedEntryUsesWrapper(hostedHandlers, 'requireHostedApiKey')) {
    const hostedApiKey = getHostedApiKeyForDeploy(config.workspace);
    if (!hostedApiKey) {
      throw new Error('HOSTED_API_KEY is required in workspace .env when using requireHostedApiKey wrapper');
    }
  }

  writeHostedJs({
    workspace: config.workspace,
    hostedHandlers,
  });

  const credsJson = getCredsJsonForDeploy(config.workspace);
  const hostedApiKey = getHostedApiKeyForDeploy(config.workspace);
  const deployArgs = getDeployArgs();

  const deployOne = async (functionName) => {
    if (!functions[functionName]) {
      console.log(`Function ${ functionName } not found in .hosting.yml, skipping`);
      return;
    }

    await deployFunction({
      functionName,
      functionConfig: functions[functionName],
      googleCloudInfo,
      workspace: config.workspace,
      credsJson,
      hostedApiKey,
    });
  };

  if (deployArgs.includes('group')) {
    const groupNames = Object.keys(groups);
    if (!groupNames.length) {
      console.log('No groups defined in .hosting.yml');
      return;
    }

    const selectedGroup = await chooseOption('Which group would you like to deploy?', groupNames);
    for (const functionName of groups[selectedGroup] || []) {
      await deployOne(functionName);
    }
    return;
  }

  if (deployArgs.includes('function')) {
    const functionNames = Object.keys(functions);
    if (!functionNames.length) {
      console.log('No functions defined in .hosting.yml');
      return;
    }

    const selectedFunction = await chooseOption('Which function would you like to deploy?', functionNames);
    await deployOne(selectedFunction);
    return;
  }

  if (deployArgs.includes('all')) {
    for (const functionName of Object.keys(functions)) {
      await deployOne(functionName);
    }
    return;
  }

  console.log(`
Usage (from workspace repo):
  npm run host --workspace . --api_dirs api all
  npm run host --workspace . --api_dirs api function
  npm run host --workspace . --api_dirs api group
`);
};

if (require.main === module) {
  deployFromHostingYml().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  deployFromHostingYml,
  getHostConfig,
};

/*
  Deploy everything:
  npm run host all

  Deploy a single function:
  npm run host function

  Deploy a group of functions:
  npm run host group
*/
