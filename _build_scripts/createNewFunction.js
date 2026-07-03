const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { askQuestion, capitaliseString } = require('../api/utils');

const apiDirectory = path.join(__dirname, '../api');
const rootExampleJsPath = path.join(apiDirectory, '_example.js');

const excludedDirs = new Set([
  'node_modules',
]);

const printHelp = () => {
  console.log(`
Usage:
  npm run new
  npm run new -- --dir <apiSubdir> --name <name> [--template <exampleTemplate>] [--commit]

Options:
  --dir, -d       api subdirectory (e.g. peoplevox, shopify)
  --name, -n      function name suffix (e.g. orderGet → peoplevoxOrderGet)
  --template, -t  example template to copy (default: _example.js in dir, else api/_example.js)
                  examples: _example.js, getsingle, _example.getsingle.js
  --commit        auto-commit the stub after creation
  --help, -h      show this help

Examples:
  npm run new -- --dir peoplevox --name orderGet
  npm run new -- --dir peoplevox --name orderGet --template _example.js
  npm run new -- --dir shopify --name pageGet --template getsingle
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

const sortExampleFiles = (exampleFiles) => {
  return [...exampleFiles].sort((a, b) => {
    if (a.displayName === '_example.js') return -1;
    if (b.displayName === '_example.js') return 1;
    return a.displayName.localeCompare(b.displayName);
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

const resolveTemplateFromArg = async (exampleFiles, templateArg, dir) => {
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

const getDirs = async () => {
  const dirents = await fs.readdir(apiDirectory, { withFileTypes: true });
  return dirents
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => name[0] !== '_' && name[0] !== '.')
    .filter(name => !excludedDirs.has(name));
};

const buildFuncName = (dir, name) => {
  const hasUnderscore = dir?.includes('_');
  const separator = hasUnderscore ? '_' : '';
  const formattedName = hasUnderscore ? name : capitaliseString(name);
  return dir ? `${ dir }${ separator }${ formattedName }` : name;
};

const selectDirInteractive = async (dirs) => {
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

const selectTemplateInteractive = async (exampleFiles, dir) => {
  if (exampleFiles.length === 0) {
    await fs.access(rootExampleJsPath);
    console.log('\nUsing template: api/_example.js');
    return rootExampleJsPath;
  }

  if (exampleFiles.length === 1) {
    console.log(`\nUsing template: ${ exampleFiles[0].displayName }`);
    return exampleFiles[0].fullPath;
  }

  console.log(`\nFound ${ exampleFiles.length } template(s) in api/${ dir }:`);
  const templateIndex = await askQuestion(`Which template would you like to use? (press enter for _example.js) \n${
    exampleFiles.map((file, index) => {
      return `[${ index + 1 }] ${ file.displayName }`;
    }).join('\n')
  }\n`);

  if (!templateIndex || templateIndex.trim() === '') {
    const defaultFile = exampleFiles.find(file => file.displayName === '_example.js');
    if (defaultFile) {
      return defaultFile.fullPath;
    }

    await fs.access(rootExampleJsPath);
    console.log('\nUsing template: api/_example.js');
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

  const script = await scriptFileContents(funcName, selectedTemplate);
  await fs.writeFile(outputPath, script);

  console.log(`\nCreated ${ outputPath }`);

  if (shouldAutoCommit) {
    gitCommitAll(`${ funcName } stub`);
  }

  return outputPath;
};

const createNewFunction = async () => {
  const cliArgs = parseCliArgs(process.argv.slice(2));

  if (cliArgs.help) {
    printHelp();
    return;
  }

  const dirs = await getDirs();
  const nonInteractive = Boolean(cliArgs.dir || cliArgs.name);

  if (nonInteractive) {
    if (!cliArgs.dir || !cliArgs.name) {
      console.error('Non-interactive mode requires both --dir and --name.');
      printHelp();
      process.exitCode = 1;
      return;
    }

    if (!dirs.includes(cliArgs.dir)) {
      console.error(`Invalid --dir "${ cliArgs.dir }". Available: ${ dirs.join(', ') }`);
      process.exitCode = 1;
      return;
    }

    const exampleFiles = sortExampleFiles(await findExampleFiles(path.join(apiDirectory, cliArgs.dir)));

    try {
      const selectedTemplate = await resolveTemplateFromArg(exampleFiles, cliArgs.template, cliArgs.dir);
      console.log(`Using template: ${ path.relative(path.join(__dirname, '..'), selectedTemplate) }`);

      await writeNewFunction({
        dir: cliArgs.dir,
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
    const exampleFiles = sortExampleFiles(await findExampleFiles(path.join(apiDirectory, dir)));
    const selectedTemplate = await selectTemplateInteractive(exampleFiles, dir);
    const name = await selectNameInteractive(dir);

    await writeNewFunction({
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
