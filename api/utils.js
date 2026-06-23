const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

const objHasAny = (obj, keys) => {
  return keys.some((key) => obj[key] !== undefined);
};

const credsFromPayload = (credsPayload) => {
  const {
    credsPath,
    credsObject,
    credsProvider,
  } = credsPayload;

  if (credsObject) {
    return credsObject;
  }

  return false;
};

const customFetch = async (url, {
  method = 'get',
  headers = {},
  params,
  body,

  verbose,
  omitRequestId = false,
} = {}) => {

  if (!omitRequestId && !headers['x-request-id']) {
    headers['x-request-id'] = String(Date.now());
  }

  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (params) {
    const search = new URLSearchParams(params);
    url += (url.includes('?') ? '&' : '?') + search.toString();
  }

  let cooldown = 3000;
  let retryAttempt = 0;
  const maxRetries = 5;
  const retryStatuses = new Set([408, 429, 500, 502, 503, 504]);

  while (true) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        ...body ? { body: JSON.stringify(body) } : {},
      });

      if (response.ok) {
        return {
          ok: true,
          data: await response[responseType](),
        };
      }

      const { status } = response;
      const data = await response[responseType]().catch(() => null);
      verbose && console.error(status, data);

      if (retryStatuses.has(status)) {
        if (retryAttempt >= maxRetries) {
          console.log('Ran out of retries');
          return { 
            ok: false, 
            error: {
              code: 'RETRIES_EXHAUSTED',
              details: data,
            },
          };
        }

        retryAttempt++;
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : cooldown;
        verbose && console.log(`Retry attempt #${ retryAttempt }, waiting ${ waitTime }`);
        await wait(waitTime);
        cooldown += cooldown;
        continue;
      }

      return { 
        ok: false, 
        error: {
          details: data,
        },
      };

    } catch (error) {
      verbose && console.error(error);
      return { 
        ok: false, 
        error: {
          details: error,
        },
      };
    }
  }
};

module.exports = {
  wait,
  objHasAny,
  credsFromPayload,
  customFetch,
};