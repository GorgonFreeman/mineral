const crypto = require('crypto');

const { BASE_URL, B2_API_VERSION_PATH } = require('../backblaze/backblaze.constants');
const { resolveCreds } = require('../pipelineSteps');
const {
  appendUrlToBase,
  credsFromPayload,
  customFetch,
  FetchClient,
  fetchClientCommonSteps,
  objHasAny,
} = require('../utils');

const bucketIdentifierValidator = (bucketIdentifier) => {
  return objHasAny(bucketIdentifier, [
    'bucketId',
    'bucketName',
  ]);
};

const sessionCacheKeyForCredsPayload = (credsPayload) => {
  if (credsPayload?.credsPath) {
    return credsPayload.credsPath;
  }

  return JSON.stringify(credsPayload);
};

const backblazeSessionsByKey = new Map();

const getBackblazeSession = async (credsPayload) => {
  const cacheKey = sessionCacheKeyForCredsPayload(credsPayload);

  if (backblazeSessionsByKey.has(cacheKey)) {
    return {
      ok: true,
      data: backblazeSessionsByKey.get(cacheKey),
    };
  }

  const creds = await credsFromPayload(credsPayload);
  const { APP_ID, API_KEY } = creds ?? {};

  if (!APP_ID || !API_KEY) {
    return {
      ok: false,
      error: {
        code: 'MISSING_BACKBLAZE_CREDS',
        message: 'backblaze creds require APP_ID and API_KEY',
      },
    };
  }

  const basicToken = Buffer
    .from(`${ APP_ID }:${ API_KEY }`)
    .toString('base64');

  const authorizeResponse = await customFetch(
    `${ BASE_URL }${ B2_API_VERSION_PATH }/b2_authorize_account`,
    {
      method: 'get',
      headers: {
        Authorization: `Basic ${ basicToken }`,
      },
    },
  );

  if (!authorizeResponse.ok) {
    return authorizeResponse;
  }

  const {
    accountId,
    authorizationToken,
    apiUrl,
    downloadUrl,
  } = authorizeResponse.data ?? {};

  if (!accountId || !authorizationToken || !apiUrl) {
    return {
      ok: false,
      error: {
        code: 'INVALID_AUTHORIZE_RESPONSE',
        message: 'b2_authorize_account response missing accountId, authorizationToken, or apiUrl',
      },
    };
  }

  const session = {
    accountId,
    authorizationToken,
    apiUrl,
    downloadUrl,
  };

  backblazeSessionsByKey.set(cacheKey, session);

  return {
    ok: true,
    data: session,
  };
};

const attachBackblazeSession = async (state) => {
  const { context } = state;
  const { credsPayload, session } = context;

  if (session) {
    return {};
  }

  const sessionResponse = await getBackblazeSession(credsPayload);

  if (!sessionResponse.ok) {
    return {
      breakChain: true,
      response: sessionResponse,
    };
  }

  return {
    context: {
      ...context,
      session: sessionResponse.data,
    },
  };
};

const useBackblazeApiUrl = async (state) => {
  const { requestPayload, context } = state;
  const { session } = context;

  return {
    requestPayload: {
      ...requestPayload,
      url: appendUrlToBase(session.apiUrl, requestPayload.url),
    },
  };
};

const useBackblazeAuthorizationHeader = async (state) => {
  const { requestPayload, context } = state;
  const { session } = context;

  return {
    requestPayload: {
      ...requestPayload,
      headers: {
        Authorization: session.authorizationToken,
        ...requestPayload.headers,
      },
    },
  };
};

const backblazeClient = new FetchClient({
  pipeline: [
    resolveCreds,
    attachBackblazeSession,
    useBackblazeAuthorizationHeader,
    useBackblazeApiUrl,
    'fetch',
    fetchClientCommonSteps.exitEarlyOnNotOk,
    fetchClientCommonSteps.digToPath,
  ],
});

const publicFileUrlForBucketName = ({
  downloadUrl,
  bucketName,
  fileName,
}) => {
  if (!downloadUrl || !bucketName || !fileName) {
    return null;
  }

  const encodedFileName = encodeURIComponent(fileName)
    .replace(/%2F/g, '/');

  return `${ downloadUrl }/file/${ bucketName }/${ encodedFileName }`;
};

const sha1HexForBuffer = (buffer) => {
  return crypto
    .createHash('sha1')
    .update(buffer)
    .digest('hex');
};

const backblazeUploadFileBytes = async ({
  credsPayload,
  session,
  bucketId,
  fileName,
  fileBytes,
  contentType = 'b2/x-auto',
}) => {
  let resolvedSession = session;

  if (!resolvedSession) {
    const sessionResponse = await getBackblazeSession(credsPayload);

    if (!sessionResponse.ok) {
      return sessionResponse;
    }

    ({ data: resolvedSession } = sessionResponse);
  }

  const uploadUrlResponse = await backblazeClient.fetch({
    requestPayload: {
      method: 'post',
      url: `${ B2_API_VERSION_PATH }/b2_get_upload_url`,
      body: { bucketId },
    },
    context: {
      credsPayload,
      session: resolvedSession,
    },
  });

  if (!uploadUrlResponse.ok) {
    return uploadUrlResponse;
  }

  const {
    uploadUrl,
    authorizationToken: uploadAuthorizationToken,
  } = uploadUrlResponse.data ?? {};

  if (!uploadUrl || !uploadAuthorizationToken) {
    return {
      ok: false,
      error: {
        code: 'INVALID_UPLOAD_URL_RESPONSE',
        message: 'b2_get_upload_url response missing uploadUrl or authorizationToken',
      },
    };
  }

  const contentSha1 = sha1HexForBuffer(fileBytes);

  return customFetch(uploadUrl, {
    method: 'post',
    headers: {
      Authorization: uploadAuthorizationToken,
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'X-Bz-Content-Sha1': contentSha1,
      'Content-Type': contentType,
    },
    body: fileBytes,
  });
};

const resolveBucketIdFromIdentifier = async (
  credsPayload,
  bucketIdentifier,
  {
    fetchClient,
  } = {},
) => {
  const {
    bucketId,
    bucketName,
  } = bucketIdentifier;

  if (bucketId) {
    return {
      ok: true,
      data: bucketId,
    };
  }

  if (!bucketName) {
    return {
      ok: false,
      error: {
        code: 'BUCKET_NOT_FOUND',
        message: 'Provide bucketId or bucketName',
      },
    };
  }

  const { backblazeBucketsGet } = require('../backblaze/backblazeBucketsGet');

  const bucketsResponse = await backblazeBucketsGet(credsPayload, {
    bucketName,
    fetchClient,
  });

  if (!bucketsResponse.ok) {
    return bucketsResponse;
  }

  const bucket = bucketsResponse.data?.find(
    (candidate) => candidate.bucketName === bucketName,
  );

  if (!bucket?.bucketId) {
    return {
      ok: false,
      error: {
        code: 'BUCKET_NOT_FOUND',
        message: `Bucket ${ bucketName } not found`,
      },
    };
  }

  return {
    ok: true,
    data: bucket.bucketId,
  };
};

module.exports = {
  backblazeClient,
  bucketIdentifierValidator,
  getBackblazeSession,
  publicFileUrlForBucketName,
  backblazeUploadFileBytes,
  resolveBucketIdFromIdentifier,
};
