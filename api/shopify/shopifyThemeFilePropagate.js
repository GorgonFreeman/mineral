// https://shopify.dev/docs/api/admin-graphql/latest/queries/theme
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/themeFilesUpsert
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/fileCreate

const { credsValidator } = require('../validators');
const { ArgsWarden, wait } = require('../utils');
const { shopifyThemeFileGet } = require('./shopifyThemeFileGet');
const { shopifyThemeFilesUpsert } = require('./shopifyThemeFilesUpsert');
const { shopifyFilesGet } = require('./shopifyFilesGet');
const { shopifyFileCreate } = require('./shopifyFileCreate');

const argsWarden = new ArgsWarden([
  ['fromCredsPayload', credsValidator],
  ['toCredsPayload', credsValidator],
  ['fromThemeId'],
  ['toThemeId'],
  ['filepath'],
]);

const fileLookupAttrs = `
  id
  alt
  fileStatus
  preview {
    image {
      url
    }
  }
  ... on MediaImage {
    image {
      url
    }
  }
  ... on GenericFile {
    url
  }
  ... on Video {
    originalSource {
      url
    }
  }
`.trim();

const ASSET_LINK_REGEX = /shopify:\/\/shop_(?:images|videos|files)\/[^"'\\\s]+|https?:\/\/cdn\.shopify\.com\/[^"'\\\s]+/g;

const themeFileTextContent = (themeFile) => {
  const body = themeFile?.body;
  if (!body) {
    return null;
  }
  if (body.content != null) {
    return body.content;
  }
  if (body.contentBase64 != null) {
    return Buffer.from(body.contentBase64, 'base64').toString('utf8');
  }
  return null;
};

const filenameFromAssetLink = (assetLink) => {
  const withoutQuery = assetLink.split('?')[0];
  return decodeURIComponent(withoutQuery.split('/').pop());
};

const schemeFromAssetLink = (assetLink) => {
  const shopifySchemeMatch = assetLink.match(/^shopify:\/\/(shop_(?:images|videos|files))\//);
  if (shopifySchemeMatch) {
    return shopifySchemeMatch[1];
  }

  const filename = filenameFromAssetLink(assetLink).toLowerCase();
  if (/\.(mp4|mov|webm|m4v)$/.test(filename)) {
    return 'shop_videos';
  }
  if (/\.(pdf|txt|csv|json|zip|xml)$/.test(filename)) {
    return 'shop_files';
  }
  return 'shop_images';
};

const shopifyAssetUrl = (scheme, filename) => `shopify://${ scheme }/${ filename }`;

const fileSourceUrl = (file) => (
  file?.image?.url
  || file?.url
  || file?.originalSource?.url
  || file?.preview?.image?.url
  || null
);

const destinationUrlForAsset = (assetLink, filename, file) => {
  if (assetLink.startsWith('shopify://')) {
    return shopifyAssetUrl(schemeFromAssetLink(assetLink), filename);
  }

  return fileSourceUrl(file) || shopifyAssetUrl(schemeFromAssetLink(assetLink), filename);
};

const findFileByFilename = async (
  credsPayload,
  filename,
  {
    apiVersion,
  } = {},
) => {
  const response = await shopifyFilesGet(credsPayload, {
    apiVersion,
    attrs: fileLookupAttrs,
    queries: [`filename:"${ filename }"`],
    limit: 10,
  });

  if (!response.ok) {
    return response;
  }

  const files = response.data || [];
  const exactMatch = files.find((file) => {
    const sourceUrl = fileSourceUrl(file);
    if (!sourceUrl) {
      return false;
    }
    return filenameFromAssetLink(sourceUrl) === filename;
  });

  return {
    ok: true,
    data: exactMatch || files[0] || null,
  };
};

const waitForFileReady = async (
  credsPayload,
  filename,
  {
    apiVersion,
    attempts = 8,
    intervalMs = 1500,
  } = {},
) => {
  let file = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) {
      await wait(intervalMs);
    }

    const lookupResponse = await findFileByFilename(credsPayload, filename, { apiVersion });
    if (!lookupResponse.ok) {
      return lookupResponse;
    }

    file = lookupResponse.data;
    if (file?.fileStatus === 'READY' && fileSourceUrl(file)) {
      return {
        ok: true,
        data: file,
      };
    }

    if (file?.fileStatus === 'FAILED') {
      return {
        ok: false,
        error: {
          code: 'FILE_PROCESSING_FAILED',
          message: `Uploaded file "${ filename }" failed processing.`,
          details: file,
        },
      };
    }
  }

  return {
    ok: true,
    data: file,
  };
};

const resolveAssetOnToStore = async (
  fromCredsPayload,
  toCredsPayload,
  assetLink,
  {
    apiVersion,
  } = {},
) => {
  const filename = filenameFromAssetLink(assetLink);

  const toFileResponse = await findFileByFilename(toCredsPayload, filename, { apiVersion });
  if (!toFileResponse.ok) {
    return toFileResponse;
  }

  if (toFileResponse.data) {
    return {
      ok: true,
      data: {
        fromUrl: assetLink,
        toUrl: destinationUrlForAsset(assetLink, filename, toFileResponse.data),
        filename,
        uploaded: false,
        file: toFileResponse.data,
      },
    };
  }

  let originalSource = assetLink.startsWith('http') ? assetLink : null;

  if (!originalSource) {
    const fromFileResponse = await findFileByFilename(fromCredsPayload, filename, { apiVersion });
    if (!fromFileResponse.ok) {
      return fromFileResponse;
    }
    if (!fromFileResponse.data) {
      return {
        ok: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: `Asset "${ filename }" not found in Files on the from store.`,
          details: { assetLink, filename },
        },
      };
    }
    originalSource = fileSourceUrl(fromFileResponse.data);
    if (!originalSource) {
      return {
        ok: false,
        error: {
          code: 'ASSET_URL_MISSING',
          message: `No downloadable URL for asset "${ filename }" on the from store.`,
          details: { assetLink, filename, file: fromFileResponse.data },
        },
      };
    }
  }

  const createResponse = await shopifyFileCreate(
    toCredsPayload,
    {
      filename,
      originalSource,
    },
    { apiVersion },
  );

  if (!createResponse.ok) {
    return createResponse;
  }

  const readyResponse = await waitForFileReady(toCredsPayload, filename, { apiVersion });
  if (!readyResponse.ok) {
    return readyResponse;
  }

  const createdFile = readyResponse.data
    || (
      Array.isArray(createResponse.data?.files)
        ? createResponse.data.files[0]
        : createResponse.data?.files
    );

  return {
    ok: true,
    data: {
      fromUrl: assetLink,
      toUrl: destinationUrlForAsset(assetLink, filename, createdFile),
      filename,
      uploaded: true,
      originalSource,
      file: createdFile,
    },
  };
};

const shopifyThemeFilePropagate = async (
  fromCredsPayload,
  toCredsPayload,
  fromThemeId,
  toThemeId,
  filepath,
  {
    apiVersion,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    fromCredsPayload,
    toCredsPayload,
    fromThemeId,
    toThemeId,
    filepath,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  const fromFileResponse = await shopifyThemeFileGet(
    fromCredsPayload,
    fromThemeId,
    filepath,
    { apiVersion },
  );
  if (!fromFileResponse.ok) {
    return fromFileResponse;
  }

  const fromThemeFile = fromFileResponse.data.find((file) => file?.filename === filepath)
    || fromFileResponse.data[0];

  if (!fromThemeFile) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `Theme file "${ filepath }" not found on from theme.`,
        details: { fromThemeId, filepath },
      },
    };
  }

  const content = themeFileTextContent(fromThemeFile);
  if (content == null) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_BODY',
        message: `Theme file "${ filepath }" has no text body to propagate.`,
        details: fromThemeFile,
      },
    };
  }

  const assetLinks = [...new Set(content.match(ASSET_LINK_REGEX) || [])];
  const assetMappings = [];

  for (const assetLink of assetLinks) {
    const resolveResponse = await resolveAssetOnToStore(
      fromCredsPayload,
      toCredsPayload,
      assetLink,
      { apiVersion },
    );
    if (!resolveResponse.ok) {
      return resolveResponse;
    }
    assetMappings.push(resolveResponse.data);
  }

  let translatedContent = content;
  for (const { fromUrl, toUrl } of assetMappings) {
    if (fromUrl === toUrl) {
      continue;
    }
    translatedContent = translatedContent.split(fromUrl).join(toUrl);
  }

  const upsertResponse = await shopifyThemeFilesUpsert(
    toCredsPayload,
    toThemeId,
    {
      filename: filepath,
      body: {
        type: 'TEXT',
        value: translatedContent,
      },
    },
    { apiVersion },
  );

  if (!upsertResponse.ok) {
    return upsertResponse;
  }

  return {
    ok: true,
    data: {
      filepath,
      fromThemeId,
      toThemeId,
      assetMappings: assetMappings.map(({ fromUrl, toUrl, filename, uploaded }) => ({
        fromUrl,
        toUrl,
        filename,
        uploaded,
      })),
      upsert: upsertResponse.data,
    },
  };
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  shopifyThemeFilePropagate,
  funcApiConfig,
};

/*
curl -X POST "http://localhost:8000/shopifyThemeFilePropagate" \
  -H "Content-Type: application/json" \
  -d '{
    "fromCredsPayload": { "credsPath": "shopify.au" },
    "toCredsPayload": { "credsPath": "shopify.us" },
    "fromThemeId": "1234",
    "toThemeId": "5678",
    "filepath": "templates/page.sign_up_beauty.json"
  }'
*/
