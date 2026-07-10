const splitCommaList = (value = '') => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const readCliFlag = (flag) => {
  const args = process.argv.slice(2);
  const equalsPrefix = `${ flag }=`;

  for (let index = 0; index < args.length; index++) {
    if (args[index].startsWith(equalsPrefix)) {
      return args[index].slice(equalsPrefix.length);
    }

    if (args[index] === flag) {
      return args[index + 1];
    }
  }
};

const getApiDirs = (options = {}) => {
  if (options.api_dirs) {
    return options.api_dirs;
  }

  const fromCli = readCliFlag('--api_dirs');
  if (fromCli) {
    return splitCommaList(fromCli);
  }

  if (process.env.MINERAL_API_DIRS) {
    return splitCommaList(process.env.MINERAL_API_DIRS);
  }

  return [];
};

module.exports = {
  splitCommaList,
  readCliFlag,
  getApiDirs,
};
