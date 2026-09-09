const fs = require('fs');
const dotenv = require('dotenv');

let workspace = process.cwd();

// Turn ".", "geode", or "/full/path" into an absolute directory.
const toAbsolutePath = (dir) => {
  if (!dir || dir === '.') {
    return process.cwd();
  }

  if (dir.startsWith('/')) {
    return dir;
  }

  return `${ process.cwd() }/${ dir }`;
};

const getWorkspace = () => workspace;

const setWorkspace = (dir) => {
  workspace = toAbsolutePath(dir);
  process.env.MINERAL_WORKSPACE = workspace;
};

const loadWorkspaceEnv = () => {
  const envFile = `${ workspace }/.env`;
  if (!fs.existsSync(envFile)) {
    return;
  }

  dotenv.config({
    path: envFile,
    override: true,
    quiet: true,
  });
};

module.exports = {
  getWorkspace,
  setWorkspace,
  loadWorkspaceEnv,
  toAbsolutePath,
};
