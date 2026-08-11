#!/usr/bin/env node

const command = process.argv[2];

if (command === 'host') {
  const { deployFromHostingYml } = require('../hosting/deployFromHostingYml');
  deployFromHostingYml().catch((error) => {
    console.error(error);
    process.exit(1);
  });
  return;
}

if (command === 'hosting_preview') {
  const { startHostingPreview } = require('../hosting/hostingPreview');
  startHostingPreview();
  return;
}

if (command === 'spin_off') {
  const { spinOff } = require('../_build_scripts/spinOff');
  spinOff().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
  return;
}

const { startServer } = require('../server');

startServer();
