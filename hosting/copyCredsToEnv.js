const fs = require('fs');
const yaml = require('yaml');

const copyCredsToEnv = (workspace) => {
  const normalizedWorkspace = workspace.replace(/\/$/, '');
  const credsPath = `${ normalizedWorkspace }/.creds.yml`;
  const envPath = `${ normalizedWorkspace }/.env`;

  if (!fs.existsSync(credsPath)) {
    throw new Error(`Missing .creds.yml in workspace: ${ workspace }`);
  }

  const credsText = fs.readFileSync(credsPath, 'utf8');
  const credsFromYml = yaml.parse(credsText);
  const newCredsLine = `CREDS=${ JSON.stringify(credsFromYml) }`;

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
};
