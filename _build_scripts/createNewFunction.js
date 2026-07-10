const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { askQuestion, capitaliseString } = require('../api/utils');

const mineralRoot = path.join(__dirname, '..');
const mineralApiDirectory = path.join(mineralRoot, 'api');
const rootExampleJsPath = path.join(mineralApiDirectory, '_example.js');

const excludedDirs = new Set([
  'node_modules',
]);

const normalizePath = (dirPath) => dirPath.replace(/\/$/, '');

const isMineralCwd = () => normalizePath(process.cwd()) === normalizePath(mineralRoot);

const getContext = () => {
  const inMineral = isMineralCwd();

  return {
    inMineral,
    apiDirectory: inMineral ? mineralApiDirectory : path.join(process.cwd(), 'api'),
    mineralApiDirectory,
  };
};

const printHelp = (context) => {
  const templateHelp = context.inMineral
    ? `example template to copy (default: _example.js in dir, else api/_example.js)
                  examples: _example.js, getsingle, _example.getsingle.js`
    : `mineral example template to copy (default: _example.js)
                  examples: _example.js, shopify/_example.js, shopify/getsingle`;

  console.log(`
Usage:
  npm run new
  npm run new -- --dir <apiSubdir> --name <name> [--template <exampleTemplate>] [--commit]

Options:
  --dir, -d       api subdirectory (e.g. peoplevox, shopify). Omit for flat api/ dirs.
  --name, -n      function name suffix (e.g. orderGet → peoplevoxOrderGet)
  --template, -t  ${ templateHelp }
  --commit        auto-commit the stub after creation
  --help, -h      show this help

Examples:
  npm run new -- --dir peoplevox --name orderGet
  npm run new -- --dir shopify --name pageGet --template getsingle
  npm run new -- --name geodeBye --template shopify/_example.js
`);
};

const parseCliArgs = (argv) => {
  const args = {
    dir: null,
    name: null,
    template: null,
    commit: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === 'commit') {
      args.commit = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    if (arg === '--commit') {
      args.commit = true;
      continue;
    }

    if (arg === '--dir' || arg === '-d') {
      args.dir = argv[++i];
      continue;
    }

    if (arg === '--name' || arg === '-n') {
      args.name = argv[++i];
      continue;
    }

    if (arg === '--template' || arg === '-t') {
      args.template = argv[++i];
      continue;
    }

    if (arg.startsWith('--dir=')) {
      args.dir = arg.slice('--dir='.length);
      continue;
    }

    if (arg.startsWith('--name=')) {
      args.name = arg.slice('--name='.length);
      continue;
    }

    if (arg.startsWith('--template=')) {
      args.template = arg.slice('--template='.length);
      continue;
    }
  }

  return args;
};

const gitCommitAll = (message) => {
  console.log('Committing in background (2 second delay)...');

  const commitProcess = spawn('sh', ['-c', `sleep 2 && git add . && git commit -m '${ message }'`], {
    detached: true,
    stdio: 'ignore',
  });

  commitProcess.unref();
};

const findExampleFiles = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    const exampleFiles = files.filter(file => file.startsWith('_example'));

    return exampleFiles.map(file => {
      const match = file.match(/^_example(?:\.(.+))?\.js$/);
      if (match) {
        return {
          filename: file,
          displayName: match[1] || '_example.js',
          fullPath: path.join(dirPath, file),
        };
      }
      return null;
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
};

const collectMineralExampleFiles = async (dirPath, relativePrefix = '') => {
  const results = [];
  const localExamples = await findExampleFiles(dirPath);

  for (const file of localExamples) {
    const relativePath = relativePrefix ? `${ relativePrefix }/${ file.filename }` : file.filename;

    results.push({
      ...file,
      relativePath,
      displayName: relativePath,
    });
  }

  let childDirs = [];

  try {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    childDirs = dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => name[0] !== '_' && name[0] !== '.')
      .filter(name => !excludedDirs.has(name));
  } catch (err) {
    return results;
  }

  for (const childDir of childDirs) {
    const childPrefix = relativePrefix ? `${ relativePrefix }/${ childDir }` : childDir;
    const childResults = await collectMineralExampleFiles(path.join(dirPath, childDir), childPrefix);
    results.push(...childResults);
  }

  return results;
};

const sortExampleFiles = (exampleFiles) => {
  return [...exampleFiles].sort((a, b) => {
    const aKey = a.relativePath || a.displayName;
    const bKey = b.relativePath || b.displayName;

    if (aKey === '_example.js') return -1;
    if (bKey === '_example.js') return 1;

    return aKey.localeCompare(bKey);
  });
};

const normalizeTemplateArg = (templateArg) => {
  if (!templateArg) {
    return null;
  }

  if (templateArg.endsWith('.js')) {
    return templateArg;
  }

  if (templateArg.startsWith('_example')) {
    return `${ templateArg }.js`;
  }

  return `_example.${ templateArg }.js`;
};

const findWorkspaceTemplate = (exampleFiles, templateArg) => {
  if (!templateArg) {
    const defaultTemplate = exampleFiles.find(file => file.relativePath === '_example.js');
    if (defaultTemplate) {
      return defaultTemplate;
    }

    if (exampleFiles.length === 0) {
      throw new Error('No mineral example templates found');
    }

    return exampleFiles[0];
  }

  const directMatch = exampleFiles.find(file => file.relativePath === templateArg);
  if (directMatch) {
    return directMatch;
  }

  const normalizedFilename = normalizeTemplateArg(templateArg);
  const filenameMatches = exampleFiles.filter(file => file.filename === normalizedFilename);

  if (templateArg.includes('/')) {
    const [ prefix, suffix ] = templateArg.split('/');
    const normalizedSuffix = normalizeTemplateArg(suffix);
    const prefixedMatch = exampleFiles.find(file => file.relativePath === `${ prefix }/${ normalizedSuffix }`);

    if (prefixedMatch) {
      return prefixedMatch;
    }
  }

  if (filenameMatches.length === 1) {
    return filenameMatches[0];
  }

  const suffixMatches = exampleFiles.filter(file => file.relativePath.endsWith(`/${ normalizedFilename }`));

  if (suffixMatches.length === 1) {
    return suffixMatches[0];
  }

  if (suffixMatches.length > 1) {
    throw new Error(
      `Ambiguous template "${ templateArg }". Use one of: ${ suffixMatches.map(file => file.relativePath).join(', ') }`,
    );
  }

  throw new Error(`Template not found: ${ templateArg }`);
};

const resolveTemplateFromArg = async ({
  exampleFiles,
  templateArg,
  dir,
  inMineral,
}) => {
  if (!inMineral) {
    const selectedTemplate = findWorkspaceTemplate(exampleFiles, templateArg);
    return selectedTemplate.fullPath;
  }

  if (!templateArg) {
    const defaultInDir = exampleFiles.find(file => file.displayName === '_example.js');
    if (defaultInDir) {
      return defaultInDir.fullPath;
    }

    await fs.access(rootExampleJsPath);
    return rootExampleJsPath;
  }

  const normalizedFilename = normalizeTemplateArg(templateArg);

  const matchInDir = exampleFiles.find(file => {
    return file.filename === normalizedFilename
      || file.displayName === templateArg
      || file.displayName === normalizedFilename;
  });

  if (matchInDir) {
    return matchInDir.fullPath;
  }

  if (normalizedFilename === '_example.js') {
    await fs.access(rootExampleJsPath);
    return rootExampleJsPath;
  }

  throw new Error(`Template not found: ${ templateArg } (looked for ${ normalizedFilename } in api/${ dir })`);
};

const scriptFileContents = async (name, selectedTemplate) => {
  const exampleFileContents = await fs.readFile(selectedTemplate, 'utf-8');
  return exampleFileContents.replace(/FUNC/g, name);
};

const getDirs = async (targetApiDirectory) => {
  try {
    const dirents = await fs.readdir(targetApiDirectory, { withFileTypes: true });
    return dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .filter(name => name[0] !== '_' && name[0] !== '.')
      .filter(name => !excludedDirs.has(name));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }

    throw err;
  }
};

const normalizeDirArg = (dirArg) => {
  if (!dirArg || dirArg === '.' || dirArg === 'api') {
    return '';
  }

  return dirArg;
};

const resolveDirArg = ({ dirArg, dirs, inMineral, name }) => {
  const normalizedDir = normalizeDirArg(dirArg);

  if (dirs.includes(normalizedDir)) {
    return normalizedDir;
  }

  if (!inMineral && dirs.length === 0 && normalizedDir === '') {
    return '';
  }

  if (!inMineral && !dirArg && name) {
    return '';
  }

  if (inMineral && !dirArg) {
    return null;
  }

  return normalizedDir;
};

const buildFuncName = (dir, name) => {
  const hasUnderscore = dir?.includes('_');
  const separator = hasUnderscore ? '_' : '';
  const formattedName = hasUnderscore ? name : capitaliseString(name);
  return dir ? `${ dir }${ separator }${ formattedName }` : name;
};

const selectDirInteractive = async (dirs) => {
  if (dirs.length === 0) {
    console.log('\nCreating in api/');
    return '';
  }

  const dirIndex = await askQuestion(`Where does your new function live? \n${
    dirs.map((dir, index) => {
      return `[${ index + 1 }] ${ dir }`;
    }).join('\n')
  }\n`);

  const dir = dirs[dirIndex - 1];

  if (!dir) {
    throw new Error(`${ dirIndex } not a valid option.`);
  }

  return dir;
};

const getExampleFilesForContext = async ({ context, dir }) => {
  if (context.inMineral) {
    return sortExampleFiles(await findExampleFiles(path.join(context.apiDirectory, dir)));
  }

  return sortExampleFiles(await collectMineralExampleFiles(context.mineralApiDirectory));
};

const formatTemplateLabel = (file, { inMineral }) => {
  if (inMineral) {
    return file.displayName;
  }

  return file.relativePath;
};

const selectTemplateInteractive = async ({ exampleFiles, dir, inMineral }) => {
  if (exampleFiles.length === 0) {
    await fs.access(rootExampleJsPath);
    console.log('\nUsing template: _example.js');
    return rootExampleJsPath;
  }

  if (exampleFiles.length === 1) {
    console.log(`\nUsing template: ${ formatTemplateLabel(exampleFiles[0], { inMineral }) }`);
    return exampleFiles[0].fullPath;
  }

  const templateScope = inMineral ? `in api/${ dir }` : 'from mineral';
  console.log(`\nFound ${ exampleFiles.length } template(s) ${ templateScope }:`);

  const templateIndex = await askQuestion(`Which template would you like to use? (press enter for _example.js) \n${
    exampleFiles.map((file, index) => {
      return `[${ index + 1 }] ${ formatTemplateLabel(file, { inMineral }) }`;
    }).join('\n')
  }\n`);

  if (!templateIndex || templateIndex.trim() === '') {
    const defaultFile = exampleFiles.find(file => (
      file.relativePath === '_example.js' || file.displayName === '_example.js'
    ));

    if (defaultFile) {
      return defaultFile.fullPath;
    }

    await fs.access(rootExampleJsPath);
    console.log('\nUsing template: _example.js');
    return rootExampleJsPath;
  }

  const selectedFile = exampleFiles[templateIndex - 1];
  if (!selectedFile) {
    throw new Error(`${ templateIndex } not a valid option.`);
  }

  return selectedFile.fullPath;
};

const selectNameInteractive = async (dir) => {
  const promptSuffix = dir?.includes('_') ? `${ dir }_` : dir;
  const name = await askQuestion(`What do you want to call it? ${ promptSuffix }`);

  if (!name) {
    throw new Error('Error getting script name');
  }

  return name;
};

const writeNewFunction = async ({
  apiDirectory,
  dir,
  name,
  selectedTemplate,
  shouldAutoCommit,
}) => {
  const funcName = buildFuncName(dir, name);
  const outputPath = path.join(apiDirectory, dir, `${ funcName }.js`);

  try {
    await fs.access(outputPath);
    throw new Error(`File already exists: ${ outputPath }`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const script = await scriptFileContents(funcName, selectedTemplate);
  await fs.writeFile(outputPath, script);

  console.log(`\nCreated ${ outputPath }`);

  if (shouldAutoCommit) {
    gitCommitAll(`${ funcName } stub`);
  }

  return outputPath;
};

const createNewFunction = async () => {
  const context = getContext();
  const cliArgs = parseCliArgs(process.argv.slice(2));

  if (cliArgs.help) {
    printHelp(context);
    return;
  }

  const dirs = await getDirs(context.apiDirectory);
  const nonInteractive = Boolean(cliArgs.dir || cliArgs.name);

  if (nonInteractive) {
    if (!cliArgs.name) {
      console.error('Non-interactive mode requires --name.');
      printHelp(context);
      process.exitCode = 1;
      return;
    }

    const dir = resolveDirArg({
      dirArg: cliArgs.dir,
      dirs,
      inMineral: context.inMineral,
      name: cliArgs.name,
    });

    if (dir === null || (!dirs.includes(dir) && !(dir === '' && dirs.length === 0 && !context.inMineral))) {
      const availableDirs = dirs.length ? dirs.join(', ') : 'api/ (flat)';
      console.error(`Invalid --dir "${ cliArgs.dir }". Available: ${ availableDirs }`);
      process.exitCode = 1;
      return;
    }

    const exampleFiles = await getExampleFilesForContext({ context, dir });

    try {
      const selectedTemplate = await resolveTemplateFromArg({
        exampleFiles,
        templateArg: cliArgs.template,
        dir,
        inMineral: context.inMineral,
      });

      const templateLabel = path.relative(mineralRoot, selectedTemplate);
      console.log(`Using template: ${ templateLabel }`);

      await writeNewFunction({
        apiDirectory: context.apiDirectory,
        dir,
        name: cliArgs.name,
        selectedTemplate,
        shouldAutoCommit: process.env.AUTO_COMMIT_STUBS === 'true' || cliArgs.commit,
      });
    } catch (err) {
      console.error(err.message || err);
      process.exitCode = 1;
    }

    return;
  }

  try {
    const dir = await selectDirInteractive(dirs);
    const exampleFiles = await getExampleFilesForContext({ context, dir });
    const selectedTemplate = await selectTemplateInteractive({
      exampleFiles,
      dir,
      inMineral: context.inMineral,
    });
    const name = await selectNameInteractive(dir);

    await writeNewFunction({
      apiDirectory: context.apiDirectory,
      dir,
      name,
      selectedTemplate,
      shouldAutoCommit: process.env.AUTO_COMMIT_STUBS === 'true' || cliArgs.commit,
    });
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  }
};

createNewFunction();
