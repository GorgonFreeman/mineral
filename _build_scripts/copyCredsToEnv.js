const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');

const mineralRoot = path.join(__dirname, '..');
const credsYmlPath = path.join(mineralRoot, '.creds.yml');
const envPath = path.join(mineralRoot, '.env');

(async () => {
  const credsText = await fs.readFile(credsYmlPath, 'utf8');
  const credsFromYml = yaml.parse(credsText);
  const credsJsonString = JSON.stringify(credsFromYml);
  const newCredsLine = `CREDS=${ credsJsonString }`;

  let envFileContents = '';
  try {
    envFileContents = await fs.readFile(envPath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (!envFileContents) {
    await fs.writeFile(envPath, `${ newCredsLine }\n`);
    console.log('Created .env with CREDS');
    return;
  }

  if (/^CREDS=/m.test(envFileContents)) {
    const updatedFileContents = envFileContents.replace(/^CREDS=.*$/m, newCredsLine);

    if (updatedFileContents === envFileContents) {
      console.log('CREDS already up to date');
      return;
    }

    await fs.writeFile(envPath, updatedFileContents);
    console.log('Updated CREDS in .env');
    return;
  }

  await fs.appendFile(envPath, `\n\n${ newCredsLine }\n`);
  console.log('Appended CREDS to .env');
})();
