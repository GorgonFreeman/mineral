const { HOSTED } = require('../api/constants');

const requireHostedApiKey = async (req) => {
  if (!HOSTED) {
    return;
  }

  if (req.headers['x-api-key'] !== process.env.HOSTED_API_KEY) {
    return {
      ok: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
        statusCode: 401,
      },
    };
  }
};

const allowCrossOriginCallsAndHandleOptions = async (req, res) => {
  const { origin } = req.headers;

  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-wf-token, x-wf-value, x-wf-app');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return { handled: true };
  }
};

module.exports = {
  requireHostedApiKey,
  allowCrossOriginCallsAndHandleOptions,
};
