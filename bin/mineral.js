#!/usr/bin/env node

const command = process.argv[2];

if (command === 'host') {
  const { deployFromHostingYml } = require('../_deploy_scripts/deployFromHostingYml');
  deployFromHostingYml().catch((error) => {
    console.error(error);
    process.exit(1);
  });
  return;
}

const { startServer } = require('../server');

startServer();
