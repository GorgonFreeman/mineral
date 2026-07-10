function splitSetEnvVarsPairs(combined) {
  const segments = combined.split(/,(?=[A-Za-z_][A-Za-z0-9_]*=)/);
  return segments.map((segment) => {
    const eq = segment.indexOf('=');
    if (eq === -1) {
      throw new Error(`Invalid set_env_vars segment (no =): ${ segment }`);
    }

    return {
      key: segment.slice(0, eq).trim(),
      value: segment.slice(eq + 1),
    };
  });
}

function pickDelimiter(pairs) {
  const blob = pairs.map((pair) => `${ pair.key }=${ pair.value }`).join('');

  for (let count = 3; count < 64; count++) {
    const delimiter = '#'.repeat(count);
    if (!blob.includes(delimiter)) {
      return delimiter;
    }
  }

  throw new Error('Could not find a delimiter for gcloud --set-env-vars');
}

function formatSetEnvVarsForGcloud(combined) {
  const pairs = splitSetEnvVarsPairs(combined);
  if (pairs.length === 0) {
    return combined;
  }

  const needsDelimiter = pairs.length > 1 || pairs.some((pair) => pair.value.includes(','));
  if (!needsDelimiter) {
    return combined;
  }

  const delimiter = pickDelimiter(pairs);
  return `^${ delimiter }^${ pairs.map((pair) => `${ pair.key }=${ pair.value }`).join(delimiter) }`;
}

function shellQuoteSingle(value) {
  return `'${ String(value).replace(/'/g, `'\\''`) }'`;
}

module.exports = {
  formatSetEnvVarsForGcloud,
  shellQuoteSingle,
};
