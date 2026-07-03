const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { askQuestion, capitaliseString } = require('../api/utils');

const apiDirectory = path.join(__dirname, '../api');
const rootExampleJsPath = path.join(apiDirectory, '_example.js');

const excludedDirs = new Set([
  'node_modules',
]);

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

const scriptFileContents = async (name, dir, selectedTemplate) => {
  let exampleFileContents;

  if (selectedTemplate) {
    exampleFileContents = await fs.readFile(selectedTemplate, 'utf-8');
  } else {
    try {
      exampleFileContents = await fs.readFile(path.join(apiDirectory, dir, '_example.js'), 'utf-8');
    } catch (err) {
      console.warn('Falling back to default api/_example.js');
      exampleFileContents = await fs.readFile(rootExampleJsPath, 'utf-8');
    }
  }

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

const createNewFunction = async () => {
  const dirs = await getDirs();

  const dirIndex = await askQuestion(`Where does your new function live? \n${
    dirs.map((dir, index) => {
      return `[${ index + 1 }] ${ dir }`;
    }).join('\n')
  }\n`);
  const dir = dirs[dirIndex - 1];

  if (!dir) {
    console.error(`${ dirIndex } not a valid option.`);
    return;
  }

  const exampleFiles = await findExampleFiles(path.join(apiDirectory, dir));
  let selectedTemplate = null;

  if (exampleFiles.length > 0) {
    exampleFiles.sort((a, b) => {
      if (a.displayName === '_example.js') return -1;
      if (b.displayName === '_example.js') return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    if (exampleFiles.length === 1) {
      selectedTemplate = exampleFiles[0].fullPath;
      console.log(`\nUsing template: ${ exampleFiles[0].displayName }`);
    } else {
      console.log(`\nFound ${ exampleFiles.length } template(s) in api/${ dir }:`);
      const templateIndex = await askQuestion(`Which template would you like to use? (press enter for _example.js) \n${
        exampleFiles.map((file, index) => {
          return `[${ index + 1 }] ${ file.displayName }`;
        }).join('\n')
      }\n`);

      let selectedFile;
      if (!templateIndex || templateIndex.trim() === '') {
        selectedFile = exampleFiles.find(file => file.displayName === '_example.js');
      } else {
        selectedFile = exampleFiles[templateIndex - 1];
      }

      if (selectedFile) {
        selectedTemplate = selectedFile.fullPath;
      } else if (!templateIndex || templateIndex.trim() === '') {
        try {
          await fs.access(rootExampleJsPath);
          selectedTemplate = rootExampleJsPath;
          console.log('\nUsing template: api/_example.js');
        } catch {
          console.error('No _example.js template in this folder or at api/_example.js.');
          return;
        }
      } else {
        console.error(`${ templateIndex } not a valid option.`);
        return;
      }
    }
  }

  const promptSuffix = dir?.includes('_') ? `${ dir }_` : dir;
  const name = await askQuestion(`What do you want to call it? ${ promptSuffix }`);

  if (!name) {
    console.error('Error getting script name');
    return;
  }

  try {
    const hasUnderscore = dir?.includes('_');
    const separator = hasUnderscore ? '_' : '';
    const formattedName = hasUnderscore ? name : capitaliseString(name);
    const funcName = dir ? `${ dir }${ separator }${ formattedName }` : name;
    const outputPath = path.join(apiDirectory, dir, `${ funcName }.js`);

    try {
      await fs.access(outputPath);
      console.error(`File already exists: ${ outputPath }`);
      return;
    } catch {
      // file does not exist — good
    }

    const script = await scriptFileContents(funcName, dir, selectedTemplate);
    await fs.writeFile(outputPath, script);

    console.log(`\nCreated ${ outputPath }`);

    const shouldAutoCommit = process.env.AUTO_COMMIT_STUBS === 'true' || process.argv.includes('commit');
    if (shouldAutoCommit) {
      gitCommitAll(`${ funcName } stub`);
    }
  } catch (err) {
    console.error(err);
  }
};

createNewFunction();
