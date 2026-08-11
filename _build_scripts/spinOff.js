#!/usr/bin/env node
// spinOff — scaffolds a new Mineral workspace by copying mineral's own
// structure into a target directory, then running `npm run dev` there.
// It is deliberately unopinionated: it only copies the files mineral ships
// (samples, gitignore, api/_example.js, hosting files) and writes a minimal
// package.json named after the directory. No bespoke templates.
//
// Usage:
//   npm run spin_off -- <targetDir> [options]
//   mineral spin_off <targetDir> [options]
//
//   <targetDir>   directory to scaffold (default: current directory)
//
// Options:
//   --name, -n <name>   name for package.json / Hello handler (default: from dir name)
//   --force, -f         overwrite files that already exist
//   --no-install        skip npm install
//   --no-dev            skip running npm run dev (implies --no-install)
//   --help, -h          show help

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const MINERAL_ROOT = path.join(__dirname, '..');
const MINERAL_VERSION = require('../package.json').version;

// --- What a new workspace needs ----------------------------------------------

// Folders to create.
const DIRECTORIES = [
  'api',
  'hosting',
];

// Structure files mineral ships, copied verbatim (same relative path in both).
const FILES_TO_COPY = [
  '.env.sample',
  '.creds.yml.sample',
  '.gitignore',
  '.gcloudignore',
  'api/_example.js',
  'hosting/.hosting.yml.sample',
  'hosting/wrappers.js',
];

// The .sample files are also copied to their real, git-ignored names so the
// workspace runs out of the box.
const SAMPLE_DUPLICATES = [
  ['.env.sample', '.env'],
  ['.creds.yml.sample', '.creds.yml'],
  ['hosting/.hosting.yml.sample', 'hosting/.hosting.yml'],
];

// --- Workspace-specific files (no mineral equivalent) ------------------------

// package.json is the one file that can't be copied — it must be named after
// the directory. Scripts point at the installed @foxtware/mineral.
const packageJson = (name) => JSON.stringify({
  name,
  version: '0.0.1',
  private: true,
  description: 'Private Mineral workspace.',
  type: 'commonjs',
  main: 'hosting/hosted.js',
  scripts: {
    new: 'node node_modules/@foxtware/mineral/_build_scripts/createNewFunction.js',
    dev: 'node --watch --watch-path=./api --watch-path=./.creds.yml --watch-path=./.env --watch-path=./hosting node_modules/@foxtware/mineral/server.js --workspace . --api_dirs api',
    hosting_preview: 'node --watch --watch-path=./api --watch-path=./hosting/.hosting.yml --watch-path=./hosting/wrappers.js --watch-path=./.creds.yml --watch-path=./.env node_modules/@foxtware/mineral/bin/mineral.js hosting_preview --workspace . --api_dirs api',
    tunnel: 'ngrok http http://localhost:8000',
    serve: 'PORT=8100 mineral --workspace . --api_dirs api',
    host: 'mineral host --workspace . --api_dirs api',
  },
  dependencies: {
    '@foxtware/mineral': `^${ MINERAL_VERSION }`,
  },
  devDependencies: {
    ngrok: '^5.0.0-beta.2',
  },
}, null, 2) + '\n';

// A tiny Hello handler so the route list isn't empty on first boot.
const helloHandler = (name) => (
`const ${ name }Hi = async () => {
  console.log('hi');
  return {
    ok: true,
  };
};

module.exports = {
  ${ name }Hi,
};

/*
curl -X POST "http://localhost:8000/${ name }Hi"
*/
`
);

// --- Small helpers -----------------------------------------------------------

const printHelp = () => {
  console.log(`
Usage:
  npm run spin_off -- <targetDir> [options]
  mineral spin_off <targetDir> [options]

Spins off a new Mineral workspace by copying mineral's structure (samples,
.gitignore, api/_example.js, hosting files) into <targetDir> and running
"npm run dev" there.

Arguments:
  <targetDir>   directory to scaffold. Defaults to the current directory.

Options:
  --name, -n <name>   name for package.json / Hello handler (default: from dir name)
  --force, -f         overwrite files that already exist
  --no-install        skip npm install
  --no-dev            skip running npm run dev (implies --no-install)
  --help, -h          show this help

Examples:
  npm run spin_off -- myworkspace
  mineral spin_off .     # when already cd'd into an empty target dir
`);
};

const parseArgs = (argv) => {
  const args = {
    target: null,
    name: null,
    force: false,
    install: true,
    dev: true,
    help: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === 'spinoff') {
      continue; // subcommand token when invoked via bin/mineral.js
    }
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (arg === '--force' || arg === '-f') {
      args.force = true;
      continue;
    }
    if (arg === '--no-install') {
      args.install = false;
      continue;
    }
    if (arg === '--no-dev') {
      args.dev = false;
      args.install = false;
      continue;
    }
    if (arg === '--name' || arg === '-n') {
      args.name = argv[++i];
      continue;
    }
    if (arg.startsWith('--name=')) {
      args.name = arg.slice('--name='.length);
      continue;
    }
    if (arg.startsWith('-')) {
      args.help = true;
      console.error(`Unknown option: ${ arg }`);
      continue;
    }
    positional.push(arg);
  }

  if (args.target === null) {
    args.target = positional[0] || process.cwd();
  }

  return args;
};

const toCamelCase = (input) => input
  .replace(/[^a-zA-Z0-9]+/g, ' ')
  .trim()
  .split(' ')
  .filter(Boolean)
  .map((word, index) => (
    index === 0
      ? word.toLowerCase()
      : `${ word[0].toUpperCase() }${ word.slice(1).toLowerCase() }`
  ))
  .join('');

const isValidIdentifier = (value) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value);

const deriveName = (dirName) => {
  const name = toCamelCase(dirName);
  if (!name || !isValidIdentifier(name)) {
    throw new Error(`Could not make a valid name from "${ dirName }". Use --name <name>.`);
  }
  return name;
};
const writeFile = (target, relativePath, contents, { force }) => {
  const absolutePath = path.join(target, relativePath);
  if (!force && fs.existsSync(absolutePath)) {
    console.log(`  - ${ relativePath }  (exists, kept)`);
    return;
  }
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  console.log(`  + ${ relativePath }`);
};

const copyFile = (relativePath, target, { force }) => {
  const from = path.join(MINERAL_ROOT, relativePath);
  const to = path.join(target, relativePath);
  if (!force && fs.existsSync(to)) {
    console.log(`  - ${ relativePath }  (exists, kept)`);
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`  + ${ relativePath }  (copied from mineral)`);
};

const runInDir = (command, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd, stdio: 'inherit' });
  child.on('close', (code) => {
    if (code === 0) {
      resolve();
    } else {
      reject(new Error(`"${ command } ${ args.join(' ') }" exited with code ${ code }`));
    }
  });
  child.on('error', reject);
});

// `npm run dev` is a long-running watch server — stay attached to it.
const runDev = (cwd) => new Promise((resolve) => {
  const child = spawn('npm', ['run', 'dev'], { cwd, stdio: 'inherit' });
  child.on('close', resolve);
  child.on('error', (error) => {
    console.error(`Failed to start npm run dev: ${ error.message }`);
    resolve();
  });
});

// --- Main --------------------------------------------------------------------

const spinOff = async (argv = process.argv.slice(2)) => {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }

  const target = path.resolve(args.target);
  const name = args.name || deriveName(path.basename(target));

  console.log(`\nSpinning off "${ name }" into ${ target }\n`);

  // 1. Create the target directory itself if it doesn't exist yet.
  fs.mkdirSync(target, { recursive: true });
  console.log(`  (directory ready) ${ target }`);

  // 2. Create the folders.
  console.log('Folders:');
  for (const dir of DIRECTORIES) {
    fs.mkdirSync(path.join(target, dir), { recursive: true });
    console.log(`  + ${ dir }/`);
  }

  // 3. Copy mineral's structure.
  console.log('\nStructure (copied from mineral):');
  for (const relativePath of FILES_TO_COPY) {
    copyFile(relativePath, target, { force: args.force });
  }

  // 4. Workspace-specific files.
  console.log('\nGenerated:');
  writeFile(target, 'package.json', packageJson(name), { force: args.force });
  writeFile(target, path.join('api', `${ name }Hi.js`), helloHandler(name), { force: args.force });

  // 5. Duplicate samples to their real, git-ignored names.
  console.log('\nSamples -> real files:');
  for (const [from, to] of SAMPLE_DUPLICATES) {
    const fromPath = path.join(target, from);
    const toPath = path.join(target, to);
    if (!fs.existsSync(fromPath) || fs.existsSync(toPath)) {
      continue;
    }
    fs.copyFileSync(fromPath, toPath);
    console.log(`  + ${ to }  (copied from ${ from })`);
  }

  if (!args.install) {
    console.log('\nSkipped npm install / npm run dev.\n');
    return;
  }

  // 5. Get up and running.
  console.log('\nInstalling dependencies...\n');
  await runInDir('npm', ['install'], target);

  console.log('\nStarting "npm run dev"...\n');
  await runDev(target);
};

module.exports = {
  spinOff,
  deriveName,
};

if (require.main === module) {
  spinOff().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

