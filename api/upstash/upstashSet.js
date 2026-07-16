const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getRedisInstance } = require('../upstash/upstash.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['key'],
  ['value'],
]);

const upstashSet = async (
  credsPayload,
  key,
  value,
  {
    ex,
    nx,
    xx,
    ...upstashSetOptions
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    key,
    value,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const redis = await getRedisInstance(credsPayload);

  try {
    const result = await redis.set(key, value, {
      ...(ex !== undefined && { ex }),
      ...(nx !== undefined && { nx }),
      ...(xx !== undefined && { xx }),
      ...upstashSetOptions,
    });

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    console.error('upstashSet error', error);
    return {
      ok: false,
      error: {
        message: error.message,
      },
    };
  }
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  upstashSet,
  funcApiConfig,
};
