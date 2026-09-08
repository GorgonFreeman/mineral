// https://linear.app/developers/graphql

const { ArgsWarden } = require('../utils');
const { credsValidator } = require('../validators');
const { linearClient } = require('../linear/linear.utils');

const argsWarden = new ArgsWarden([
  ['credsPayload', credsValidator],
  ['filename'],
  ['contentType'],
  ['size', (size) => Number.isInteger(size) && size > 0],
]);

const linearFileUpload = async (
  credsPayload,
  filename,
  contentType,
  size,
  {
    metaData,
    makePublic,
    inspect = false,
    fetchClient = linearClient,
  } = {},
) => {

  const rejectResponse = await argsWarden.responseIfRejectingArgs({
    credsPayload,
    filename,
    contentType,
    size,
  });
  if (rejectResponse) {
    return rejectResponse;
  }

  return fetchClient.fetch({
    requestPayload: {
      body: {
        query: `
          mutation FileUpload(
            $filename: String!
            $contentType: String!
            $size: Int!
            $metaData: JSON
            $makePublic: Boolean
          ) {
            fileUpload(
              filename: $filename
              contentType: $contentType
              size: $size
              metaData: $metaData
              makePublic: $makePublic
            ) {
              success
              uploadFile {
                filename
                contentType
                size
                uploadUrl
                assetUrl
                headers {
                  key
                  value
                }
              }
            }
          }
        `,
        variables: {
          filename,
          contentType,
          size,
          metaData,
          makePublic,
        },
      },
    },
    context: {
      credsPayload,
      resultPath: 'data.fileUpload',
    },
    inspect,
  });
};

const funcApiConfig = {
  argsWarden,
};

module.exports = {
  linearFileUpload,
  funcApiConfig,
};

/*
  Returns a pre-signed `uploadUrl` to PUT the file to, plus the `headers` that
  the PUT must carry. `assetUrl` is the resulting Linear-hosted URL, suitable
  for linearAttachmentCreate or embedding in comment markdown.
*/

/*
curl -X POST "http://localhost:8000/linearFileUpload" \
  -H "Content-Type: application/json" \
  -d '{
    "credsPayload": { "credsPath": "linear" },
    "filename": "assets.zip",
    "contentType": "application/zip",
    "size": 12345
  }'
*/
