const { Redis } = require('@upstash/redis');
const { credsFromPayload } = require('../utils');

const UPSTASH_INSTANCES = new Map();

const getRedisCacheKey = (credsPayload) => JSON.stringify(credsPayload);

const getRedisInstance = async (credsPayload) => {
  const key = getRedisCacheKey(credsPayload);

  if (UPSTASH_INSTANCES.has(key)) {
    return UPSTASH_INSTANCES.get(key);
  }

  const creds = await credsFromPayload(credsPayload);
  const {
    BASE_URL,
    TOKEN,
  } = creds;

  if (!BASE_URL || !TOKEN) {
    throw new Error('Missing Upstash creds');
  }

  const redis = new Redis({
    url: BASE_URL,
    token: TOKEN,
  });

  UPSTASH_INSTANCES.set(key, redis);
  return redis;
};

module.exports = {
  getRedisInstance,
};
