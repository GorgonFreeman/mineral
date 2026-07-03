const xml2js = require('xml2js');
const readline = require('readline');
const fs = require('fs').promises;
const yaml = require('yaml');

const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

const objHasAny = (obj, keys) => {
  return keys.some((key) => obj[key] !== undefined);
};

const capitaliseString = (value) => `${ value[0].toUpperCase() }${ value.slice(1) }`;

const credsByPath = (credsPath, credsObject) => {
  const pathNodes = pathAsArray(credsPath);

  let creds = {};
  let credsEdge;

  for (const node of pathNodes) {
    
    credsEdge = (credsEdge ? credsEdge : credsObject)[node];

    if (!credsEdge) {
      return creds;
    }

    const nonStructuralCreds = Object.fromEntries(
      Object.entries(credsEdge).filter(([key]) => {
        return key === key.toUpperCase();
      })
    );

    creds = {
      ...creds,
      ...nonStructuralCreds,
    };
  }

  return creds;
};

const credsFromPayload = async (credsPayload) => {
  const {
    credsPath,
    credsObject,
    credsProvider,
  } = credsPayload;

  if (credsObject) {
    return credsObject;
  }

  if (credsPath) {
    // Get creds from .creds.yml. 
    const credsText = await fs.readFile('.creds.yml', 'utf8');
    const credsYmlAsObject = yaml.parse(credsText);
    return credsByPath(credsPath, credsYmlAsObject);
  }

  return false;
};

const xmlResponseParser = (parserOptions = {}) => {
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    ignoreAttrs: true,
    ...parserOptions,
  });

  return async (response) => {
    const text = await response.text();
    return parser.parseStringPromise(text);
  };
};

const getResponseParser = (contentType) => {
  if (contentType.includes('application/json')) return (res) => res.json();
  if (contentType.includes('text/xml')) return xmlResponseParser();
  if (contentType.includes('application/soap+xml')) return (res) => res.text();
  if (contentType.includes('application/octet-stream')) return (res) => res.arrayBuffer();
  return (res) => res.text(); // safe default
};

const customFetch = async (url, {
  method = 'get',
  headers = {},
  params,
  body,
  responseParser,

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
        ...body 
          ? { body: typeof body === 'string' 
              ? body 
              : JSON.stringify(body) 
          } : {},
      });

      const responseContentType = response.headers.get('content-type');
      console.log(responseContentType);

      if (!responseParser) {
        responseParser = getResponseParser(responseContentType);
      }

      const parsedResponse = await responseParser(response);
      logDeep({ parsedResponse });

      if (response.ok) {
        return {
          ok: true,
          data: parsedResponse,
        };
      }

      const { status } = response;
      const { data } = parsedResponse;
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
    if (output == null) {
      return undefined;
    }
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

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const stripGraphqlEdgesAndNodes = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripGraphqlEdgesAndNodes);
  }

  if (!isObject(value)) {
    return value;
  }

  if (Array.isArray(value.edges)) {
    return value.edges.map((edge) => stripGraphqlEdgesAndNodes(edge?.node));
  }

  const output = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    output[key] = stripGraphqlEdgesAndNodes(nestedValue);
  }
  return output;
};

const collapseDataOnlyWrappers = (value) => {
  if (Array.isArray(value)) {
    return value.map(collapseDataOnlyWrappers);
  }

  if (!isObject(value)) {
    return value;
  }

  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === 'data') {
    return collapseDataOnlyWrappers(value.data);
  }

  const output = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    output[key] = collapseDataOnlyWrappers(nestedValue);
  }
  return output;
};

const objectMergeEntries = (object, updates) => {
  const output = { ...object };

  for (const [key, value] of Object.entries(updates)) {
    if (value === null) {
      delete output[key];
      continue;
    }

    if (!isObject(value)) {
      output[key] = value;
      continue;
    }

    output[key] = {
      ...(output[key] ?? {}),
      ...value,
    };
  }

  return output;
};

class Chain {
  constructor(steps = [], { outputHandler = objectMergeEntries } = {}) {
    this.steps = steps;
    this.outputHandler = outputHandler;
  }

  addSteps(steps) {
    this.steps.push(...steps);
    return this;
  }

  getSteps() {
    return this.steps;
  }

  async run(state, { inspect = false, outputHandler = this.outputHandler } = {}) {
    for (const step of this.steps) {
      const updates = await step(state) || {};

      inspect && logDeep({ updates });
      inspect && await askQuestion('?');

      state = outputHandler(state, updates);

      inspect && logDeep({ state });
      inspect && await askQuestion('?');

      if (updates.breakChain) {
        return state;
      }
    }

    return state;
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
    inspect = false,
  } = {}) {

    let mergedContext = {
      ...(this.context ?? {}),
      ...(context ?? {}),
    };
    inspect && logDeep({ mergedContext });
    inspect && await askQuestion('?');

    let requestPayload = {
      url,
      ...(method ? { method } : {}),
      ...(headers ? { headers } : {}),
      ...(params ? { params } : {}),
      ...(body ? { body } : {}),
    };
    inspect && logDeep({ requestPayload });
    inspect && await askQuestion('?');

    if (this.requestPreparer) {
      if (this.requestPreparer.run) {
        ({ requestPayload, context: mergedContext } = await this.requestPreparer.run(
          { requestPayload, context: mergedContext },
          { inspect },
        ));
      } else {
        const result = await this.requestPreparer(requestPayload, mergedContext);
        if (result) {
          requestPayload = result;
        }
      }
    }
    inspect && logDeep({ requestPayload, mergedContext });
    inspect && await askQuestion('?');

    let response = await customFetch(
      requestPayload.url,
      requestPayload,
    );
    inspect && logDeep({ response });
    inspect && await askQuestion('?');
    
    const usedResponseInterpreter = responseInterpreter || this.responseInterpreter;
    if (usedResponseInterpreter) {
      if (usedResponseInterpreter.run) {
        ({ response, context: mergedContext } = await usedResponseInterpreter.run(
          { response, context: mergedContext },
          { inspect },
        ));
      } else {
        response = await usedResponseInterpreter(response, mergedContext);
      }
    }
    inspect && logDeep({ response });
    inspect && await askQuestion('?');

    return response;
  }
}

const fetchClientCommonSteps = {
  stripEdgesAndNodes: async (state) => {
    const { response } = state;

    if (!response?.ok || !response?.data) {
      return {};
    }

    return {
      response: {
        data: stripGraphqlEdgesAndNodes(response.data),
      },
    };
  },
  collapseDataWithOneValue: async (state) => {
    const { response } = state;

    if (!response?.ok || !response?.data) {
      return {};
    }

    return {
      response: {
        data: collapseDataOnlyWrappers(response.data),
      },
    };
  },
  inspect: async (state) => {
    logDeep({ state });
    await askQuestion('?');
    return {};
  },
  exitEarlyOnNotOk: async (state) => {
    const { response } = state;

    if (!response?.ok) {
      return { breakChain: true };
    }

    return {};
  },
  exitEarlyOnGraphqlErrors: async (state) => {
    const { response } = state;
    const errors = response?.data?.errors;

    if (!Array.isArray(errors) || !errors.length) {
      return {};
    }

    const message = errors
      .map((error) => error?.message)
      .filter(Boolean)
      .join('; ');

    return {
      response: {
        ok: false,
        error: {
          code: 'GRAPHQL_ERROR',
          message: message || 'GraphQL request failed',
          details: errors,
        },
      },
      breakChain: true,
    };
  },
  digToPath: async (state) => {
    const { response, context } = state;
    const { resultPath } = context;
    const { data } = response;

    if (!data || !resultPath) {
      return {};
    }

    const resultPathNodes = pathAsArray(resultPath);
    const dataAtPath = objectDigNodeAtPath(data, resultPathNodes);

    if (!dataAtPath) {
      return {
        response: {
          ok: false,
          error: {
            code: 'DIG_FAILED',
            message: `Data not found at path ${ resultPath }`,
          },
        },
        breakChain: true,
      };
    }

    return {
      response: {
        data: dataAtPath,
      },
    };
  },
};

const valueProvided = (value) => value !== undefined && value !== null;

const validateArgs = async (validatorsByArg, args) => {
  const rejectArgsMessages = [];

  for (const argName of Object.keys(args)) {
    const validator = validatorsByArg[argName] || valueProvided;
    const valid = await validator(args[argName], args);

    if (!valid) {
      rejectArgsMessages.push(`Invalid '${ argName }'`);
    }
  }

  return rejectArgsMessages;
};

const responseIfRejectingArgs = async (...validateArgsParams) => {
  const rejectArgsMessages = await validateArgs(...validateArgsParams);

  if (rejectArgsMessages.length > 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_ARGS',
        message: rejectArgsMessages.join('; '),
        ...(rejectArgsMessages.length > 1 ? { details: rejectArgsMessages } : {}),
      },
    };
  }

  return false;
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

const everyIfArray = (func, value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return false;
    }

    // Validators should always return truthy values, right?
    return value.map(func).every(i => i);
  }
  return func(value);
};

const timeMs = {
  seconds: (number) => number * 1000,
  minutes: (number) => number * 1000 * 60,
  hours: (number) => number * 1000 * 60 * 60,
  days: (number) => number * 1000 * 60 * 60 * 24,
  weeks: (number) => number * 1000 * 60 * 60 * 24 * 7,
  monthsish: (number) => number * 1000 * 60 * 60 * 24 * 30,
  yearsish: (number) => number * 1000 * 60 * 60 * 24 * 365,
};

const responseArrayToResponse = (responses, { flatten = false } = {}) => {
  if (responses.length === 1) {
    return responses[0];
  }

  const succeeded = responses.filter(r => r?.ok).length;
  const failed = responses.length - succeeded;

  const response = {
    ok: failed === 0,
    results: responses,
    meta: {
      total: responses.length,
      succeeded,
      failed,
    },
  };

  if (flatten) {
    const data = responses
      .map(r => r?.data)
      .filter(d => d !== undefined);

    if (data.length) {
      response.data = data.flat();
    }
  }

  return response;
};

class Operation {
  constructor(func, { args = [], options = {} } = {}) {
    this.func = func;
    this.args = args;
    this.options = options;
  }

  async run() {
    return this.func(...this.args, this.options);
  }
}

class OperationQueue {
  constructor(operations) {

    if (operations && operations.some(op => !(op instanceof Operation))) {
      throw new Error('OperationQueue only takes Operations');
    }

    this.queue = operations || [];
  }

  add(operation) {
    if (!(operation instanceof Operation)) {
      throw new Error('OperationQueue only takes Operations');
    }

    this.queue.push(operation);
  }

  async run({
    interval = false,
    verbose = true,
  } = {}) {

    // Run at interval
    if (interval) {
      const results = new Array(this.queue.length);
      let completedCount = 0;

      // For each operation, run it without awaiting, and await the interval
      for (const [i, op] of this.queue.entries()) {
        (async () => {
          const result = await op.run();
          // Preserve result order
          results[i] = result;
          completedCount++;

          if (verbose) {
            console.log(`${ completedCount } / ${ this.queue.length }`);
          }
        })();

        await wait(interval);
      }

      // Wait for all operations to complete
      while (completedCount < this.queue.length) {
        await wait(timeMs.seconds(1));
      }

      this.queue.length = 0;
      return results;
    }

    // Run in sequence
    const results = [];
    for (const op of this.queue) {
      const result = await op.run();
      results.push(result);
      if (verbose) {
        console.log(`${ results.length } / ${ this.queue.length }`);
      }
    }

    this.queue.length = 0;
    return results;
  }
}

const arraysToCartesianProduct = (arrayOfMixed) => {
  return arrayOfMixed
    .map(ensureArray)
    .reduce((acc, curr) => {
      return acc.flatMap(a => curr.map(b => [...a, b]));
    }, [[]]);
};

const actionSingleOrMultiple = async (input, func, buildOpArgs, { queueRunOptions = {} } = {}) => {

  /* How different inputs are handled:
  1. Single input
  Pass directly to args builder function, and return result.
  2. Single array
  Action one operation per value in the array.
  3. Array of arrays
  Action all permutations of all values in the arrays.
  */

  // #1: Single input
  // Pass directly to args builder function, and return result.
  if (!Array.isArray(input)) {
    return new Operation(func, buildOpArgs(input)).run();
  }

  let queue;

  const argsBuilderArgsCount = buildOpArgs.length;
  if (argsBuilderArgsCount <= 1) {
    // #2: One input, as array
    // Action one operation per value in the array.
    queue = new OperationQueue(input.map(inputItem => new Operation(
      func,
      buildOpArgs(inputItem),
    )));
  } else {
    // #3: Multiple inputs
    // Action all combinations of all values in the arrays.
    const combinations = arraysToCartesianProduct(input);
    queue = new OperationQueue(combinations.map(combo => new Operation(
      func,
      buildOpArgs(...combo),
    )));
  }

  const queueResponses = await queue.run(queueRunOptions);
  return responseArrayToResponse(queueResponses);
};

module.exports = {
  wait,
  timeMs,
  objHasAny,
  capitaliseString,
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
  responseIfRejectingArgs,
  ensureArray,
  everyIfArray,
  responseArrayToResponse,
  Operation,
  OperationQueue,
  actionSingleOrMultiple,
};