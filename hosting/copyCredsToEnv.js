const fs = require('fs');
const yaml = require('yaml');

const getValueAtCredsPath = (creds, pathParts) => {
  let current = creds;

  for (const pathPart of pathParts) {
    if (current == null || typeof current !== 'object' || !(pathPart in current)) {
      return undefined;
    }

    current = current[pathPart];
  }

  return current;
};

const setValueAtCredsPath = (target, pathParts, value) => {
  let current = target;

  for (let index = 0; index < pathParts.length - 1; index++) {
    const pathPart = pathParts[index];

    if (!(pathPart in current) || typeof current[pathPart] !== 'object' || current[pathPart] === null) {
      current[pathPart] = {};
    }

    current = current[pathPart];
  }

  current[pathParts[pathParts.length - 1]] = value;
};

const filterCredsByPaths = (creds, includeCredsPaths) => {
  const filteredCreds = {};

  for (const credsPath of includeCredsPaths) {
    if (typeof credsPath !== 'string' || !credsPath.trim()) {
      throw new Error(`Invalid include_creds_paths entry: ${ credsPath }`);
    }

    const pathParts = credsPath.split('.');
    const value = getValueAtCredsPath(creds, pathParts);

    if (value === undefined) {
      throw new Error(`Missing creds path "${ credsPath }" in .creds.yml`);
    }

    setValueAtCredsPath(filteredCreds, pathParts, value);
  }

  return filteredCreds;
};

const copyCredsToEnv = (workspace, options = {}) => {
  const { includeCredsPaths } = options;
  const normalisedWorkspace = workspace.replace(/\/$/, '');
  const credsPath = `${ normalisedWorkspace }/.creds.yml`;
  const envPath = `${ normalisedWorkspace }/.env`;

  if (!fs.existsSync(credsPath)) {
    throw new Error(`Missing .creds.yml in workspace: ${ workspace }`);
  }

  const credsText = fs.readFileSync(credsPath, 'utf8');
  const credsFromYml = yaml.parse(credsText);
  const credsForEnv = includeCredsPaths?.length
    ? filterCredsByPaths(credsFromYml, includeCredsPaths)
    : credsFromYml;
  const newCredsLine = `CREDS=${ JSON.stringify(credsForEnv) }`;

  let envFileContents = '';
  if (fs.existsSync(envPath)) {
    envFileContents = fs.readFileSync(envPath, 'utf8');
  }

  if (!envFileContents) {
    fs.writeFileSync(envPath, `${ newCredsLine }\n`);
    return;
  }

  if (/^CREDS=/m.test(envFileContents)) {
    const updatedFileContents = envFileContents.replace(/^CREDS=.*$/m, newCredsLine);

    if (updatedFileContents !== envFileContents) {
      fs.writeFileSync(envPath, updatedFileContents);
    }

    return;
  }

  fs.appendFileSync(envPath, `\n\n${ newCredsLine }\n`);
};

if (require.main === module) {
  const workspace = process.argv[2] || process.cwd();
  copyCredsToEnv(workspace);
  console.log('Copied CREDS from .creds.yml to .env');
}

module.exports = {
  copyCredsToEnv,
  filterCredsByPaths,
};
