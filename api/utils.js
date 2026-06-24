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

const objectDigNodeAtPath = (obj, path, { returnOmitted = false } = {}) => {
  let nodes = pathAsArray(path);

  let desired = obj;
  let omitted;
  let omittedEdge;

  for (const node of nodes) {
    const { 
      [node]: value, 
      ...rest
    } = desired;
    desired = value;
    
    if (returnOmitted) {
      if (omittedEdge) {
        omittedEdge[node] = rest || {};
        omittedEdge = omittedEdge[node];
      } else {
        omitted = { ...rest };
        omittedEdge = omitted;
      }
    }
  }

  if (!returnOmitted) {
    return desired;
  }

  return {
    desired,
    omitted,
  };
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

  async run(input) {
    let output = input;
    for (const step of this.steps) {
      output = await step(output);
    }
    return output;
  }
}

class FetchClient {
  constructor({
    context, // necessary data for the preparer to use
    clientPreparer, // a function that reads context, and updates stuff like auth headers
    
    url, // requests will be appended to the end
    headers = {}, // merged with the headers for each request
    
    requestPreparer, // a function that updates responses before sending
    responseInterpreter, // a function that transforms responses to report back
  } = {}) {
    this.context = context;
    this.clientPreparer = clientPreparer; // typeof Chain
    this.url = url;
    this.headers = headers;
    this.requestPreparer = requestPreparer; // typeof Chain
    this.responseInterpreter = responseInterpreter; // typeof Chain
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

    const {
      url: fetchClientUrl,
      headers: fetchClientHeaders,
      responseInterpreter: fetchClientResponseInterpreter,
    } = this;

    let constructedUrl = '';
    if (fetchClientUrl) {
      constructedUrl = fetchClientUrl;
      if (url) {
        // Remove fetchClientUrl from url if it's there
        if (url.startsWith(fetchClientUrl)) {
          url = url.slice(fetchClientUrl.length);
        }
        
        // Remove trailing and leading slashes
        constructedUrl = constructedUrl.replace(/\/$/, '');
        url = url.replace(/^\//, '');

        constructedUrl += '/';
      }
    }
    if (url) {
      constructedUrl += url;
    }

    logDeep({ constructedUrl });
    await askQuestion('?');

    // Supplement headers with fetchClientHeaders
    const constructedHeaders = {
      ...(fetchClientHeaders ?? {}),
      ...(headers ?? {}),
    };
    logDeep({ constructedHeaders });
    await askQuestion('?');
    
    let requestPayload = {
      url: constructedUrl,
      ...(method ? { method } : {}),
      ...(headers ? { headers: constructedHeaders } : {}),
      ...(params ? { params } : {}),
      ...(body ? { body } : {}),
    };
    logDeep({ requestPayload });
    await askQuestion('?');

    if (this.requestPreparer) {
      if (typeof this.requestPreparer === 'Chain') {
        requestPayload = await this.requestPreparer.run(requestPayload);
      } else {
        requestPayload = await this.requestPreparer(requestPayload);
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
      if (typeof usedResponseInterpreter === 'Chain') {
        response = await usedResponseInterpreter.run(response);
      } else {
        response = await usedResponseInterpreter(response);
      }
    }
    logDeep({ response });
    await askQuestion('?');

    return response;
  }
}

module.exports = {
  wait,
  objHasAny,
  credsFromPayload,
  customFetch,
  logDeep,
  askQuestion,
  pathAsArray,
  objectDigNodeAtPath,
  FetchClient,
};