const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const mineralRoot = path.join(__dirname, '..');
const packageJsonPath = path.join(mineralRoot, 'package.json');

const readPackageJson = () => JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const writePackageJson = (packageJson) => {
  fs.writeFileSync(packageJsonPath, `${ JSON.stringify(packageJson, null, 2) }\n`);
};

const bumpPatch = (version) => {
  const [major, minor, patch] = version.split('.').map((part) => Number(part) || 0);
  return [major, minor, patch + 1].join('.');
};

const getPublishedVersion = () => {
  try {
    return execSync('npm view @foxtware/mineral version', {
      cwd: mineralRoot,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
};

const ensureLoggedIn = () => {
  try {
    execSync('npm whoami', {
      cwd: mineralRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch {
    throw new Error('Not logged in to npm. Run `npm login` with an account that can publish @foxtware/mineral.');
  }
};

const askWithDefault = async (question, defaultAnswer) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve) => {
    rl.question(`${ question } [${ defaultAnswer }] `, resolve);
  });

  rl.close();
  return answer.trim() || defaultAnswer;
};

const publish = async () => {
  ensureLoggedIn();

  const packageJson = readPackageJson();
  const localVersion = packageJson.version;
  const publishedVersion = getPublishedVersion();

  let version = localVersion;

  if (localVersion === publishedVersion) {
    const suggestedVersion = bumpPatch(localVersion);
    version = await askWithDefault('What version should we use?', suggestedVersion);

    packageJson.version = version;
    writePackageJson(packageJson);
  }

  execSync('npm publish', {
    cwd: mineralRoot,
    stdio: 'inherit',
  });

  console.log(`Published @foxtware/mineral@${ version }`);
};

publish().catch((error) => {
  console.error(error);
  process.exit(1);
});
