const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getRedisInstance } = require('../upstash/upstash.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['key'],
]);

const upstashExists = async (
  credsPayload,
  key,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({ credsPayload, key });
  if (rejectResponse) {
    return rejectResponse;
  }

  const redis = await getRedisInstance(credsPayload);

  try {
    const result = await redis.exists(key);
    return {
      ok: true,
      data: result === 1,
    };
  } catch (error) {
    console.error('upstashExists error', error);
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
  upstashExists,
  funcApiConfig,
};
