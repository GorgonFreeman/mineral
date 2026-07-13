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

const { startServer } = require('../server');

startServer();
