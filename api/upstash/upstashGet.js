const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { getRedisInstance } = require('../upstash/upstash.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['key'],
]);

const upstashGet = async (
  credsPayload,
  key,
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    key,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const redis = await getRedisInstance(credsPayload);

  try {
    const result = await redis.get(key);
    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    console.error('upstashGet error', error);
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
  upstashGet,
  funcApiConfig,
};
