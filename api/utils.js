const readline = require('readline');

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
  responseType = 'json',

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

      const parsedResponse = await response[responseType]();
      logDeep({ parsedResponse });

      if (response.ok) {
        return {
          ok: true,
          data: parsedResponse,
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

const logDeep = (...args) => {
  for (const arg of args) {
    console.dir(arg, { depth: null });
  }
};

const askQuestion = async (
  query,
  {
    defaultAnswer,
    validate,
    invalidMessage = 'Invalid input, try again.',
  } = {},
) => {
  const prompt = defaultAnswer !== undefined
    ? `${ query }(default: ${ defaultAnswer }) `
    : query;

  while (true) {
    const answer = await new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      let settled = false;

      const finish = (value) => {
        if (settled) return;
        settled = true;
        rl.close();
        resolve(value);
      };

      rl.on('close', () => {
        if (settled) return;
        settled = true;
        if (defaultAnswer !== undefined) {
          resolve(defaultAnswer);
        } else {
          reject(new Error('Input closed'));
        }
      });

      rl.question(prompt, (response) => {
        finish(response === '' && defaultAnswer !== undefined ? defaultAnswer : response);
      });
    });

    if (!validate || validate(answer)) {
      return answer;
    }

    console.log(invalidMessage);
  }
};

const pathAsArray = (path) => {
  let nodes = Array.isArray(path) 
    ? path.map(node => {
      try {
        return node.split('.');
      } catch (err) {
        return null;
      }
    }) 
    : path.split('.');
  nodes = nodes.flat().filter(n => n);
  return nodes;
};

const objectDigNodeAtPath = (obj, path) => {
  let nodes = pathAsArray(path);
  console.log(nodes);

  let output = obj;
  for (const node of nodes) {
    output = output[node];
  }
  return output;
};

const appendUrlToBase = (baseUrl, url) => {
  if (!baseUrl) {
    return url;
  }

  if (!url) {
    return baseUrl;
  }

  // Remove baseUrl from url if it's there
  if (url.startsWith(baseUrl)) {
    url = url.slice(baseUrl.length);
  }

  // Remove trailing and leading slashes
  baseUrl = baseUrl.replace(/\/$/, '');
  url = url.replace(/^\//, '');

  return `${ baseUrl }/${ url }`;
};

class Chain {
  constructor(steps = []) {
    this.steps = steps;
  }

  addSteps(steps) {
    this.steps.push(...steps);
    return this;
  }

  getSteps() {
    return this.steps;
  }

  async run(input, context) {
    let output = input;
    for (const step of this.steps) {
      output = await step(output, context);

      const { breakChain, ...brokeOutput } = step;
      if (breakChain) {
        return brokeOutput;
      }
    }
    return output;
  }
}

class FetchClient {
  constructor({
    context, // necessary data for preparer and interpreters to refer to    
    requestPreparer, // a function that updates requests before sending
    responseInterpreter, // a function that transforms responses to report back
  } = {}) {
    this.context = context;
    this.requestPreparer = requestPreparer; // can be a Chain
    this.responseInterpreter = responseInterpreter; // can be a Chain  
  }

  async fetch({
    url,

    // customAxios payload
    method,
    headers,
    params,
    body,
    
    responseInterpreter,

    context = {},
  } = {}) {

    const mergedContext = {
      ...(this.context ?? {}),
      ...(context ?? {}),
    };
    logDeep({ mergedContext });
    await askQuestion('?');

    let requestPayload = {
      url,
      ...(method ? { method } : {}),
      ...(headers ? { headers } : {}),
      ...(params ? { params } : {}),
      ...(body ? { body } : {}),
    };
    logDeep({ requestPayload });
    await askQuestion('?');

    if (this.requestPreparer) {
      if (this.requestPreparer instanceof Chain) {
        requestPayload = await this.requestPreparer.run(requestPayload, mergedContext);
      } else {
        requestPayload = await this.requestPreparer(requestPayload, mergedContext);
      }
    }
    logDeep({ requestPayload });
    await askQuestion('?');

    let response = await customFetch(
      requestPayload.url,
      requestPayload,
    );
    logDeep({ response });
    await askQuestion('?');
    
    const usedResponseInterpreter = responseInterpreter || this.responseInterpreter;
    if (usedResponseInterpreter) {
      if (usedResponseInterpreter instanceof Chain) {
        response = await usedResponseInterpreter.run(response, mergedContext);
      } else {
        response = await usedResponseInterpreter(response, mergedContext);
      }
    }
    logDeep({ response });
    await askQuestion('?');

    return response;
  }
}

const fetchClientCommonSteps = {
  inspect: async (input, context) => {
    logDeep({ input, context });
    await askQuestion('?');
    return input;
  },
  exitEarlyOnNotOk: async (input, context) => {
    if (!input.ok) {
      return {
        ...input,
        breakChain: true,
      };
    }
    return input;
  },
  digToPath: async (response, context) => {
    const { resultPath } = context;
    const { data } = response;

    if (!data || !resultPath) {
      return response;
    }

    const resultPathNodes = pathAsArray(resultPath);
    const { dataAtPath } = objectDigNodeAtPath(data, resultPathNodes);

    if (!dataAtPath) {
      return {
        ...response,
        error: {
          code: 'DIG_FAILED',
          message: `Data not found at path ${ resultPath }`,
        },
        breakChain: true,
      };
    }

    return {
      ...response,
      data: dataAtPath,      
    };
  },
};

module.exports = {
  wait,
  objHasAny,
  credsFromPayload,
  customFetch,
  logDeep,
  askQuestion,
  pathAsArray,
  objectDigNodeAtPath,
  appendUrlToBase,
  Chain,
  FetchClient,
  fetchClientCommonSteps,
};