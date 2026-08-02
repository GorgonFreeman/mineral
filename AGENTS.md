# Mineral — agent instructions

Notes for AI assistants working in this directory. **Read this file at the start of mineral tasks** and follow anything here that isn't overridden by the user in chat.

## Misc
- When working in shopify, refer to gids (gid://shopify/Page/12345678) explicitly as "gids", and use "id" to refer to the number itself (12345678). "id" may still be required for use of the GraphQL API but semantically we should make this distinction.
- funcApiConfig should not list `options` in `argNames` — it is optional. When present on the request body, `funcApi` appends it after the named args.
- When implementing API functions that mirror official functions, include a link to the documentation at the top of the file as a comment.
- Don't add to this file unless asked.
- Use snake_case for package.json commands, with colon if appropriate.
- Use newlines and trailing commas where appropriate to minimise future diffs, e.g. in function args.
- If you make a new .env or .creds.yml variable, update the correlating .sample file.
- In Shopify, don't normalise and take gids as inputs if you can just take the id - the non-gid number - instead.
- Use trailing commas wherever possible, for future git diff readability.
- Each platform gets its own directory, within which {platform}.constants.js holds constant values like a fixed API base URL or the max objects an API will return per page, docs.md links to documentation and briefly describes the API shape and auth, {platform}.utils.js provides a FetchClient to perform http requests, and the other files are mostly flat functions like {platform}ThingDo.js. If needed, {platform}Get.js can provide a paginated get function for reuse in e.g. {platform}ThingsGet.js.
- Do not deviate from the project's existing patterns unless you ask the user first. This includes nested structures, use of libraries, and layout of functions.
- Refer to _example.js files for reference on how functions are laid out, e.g. use of argsWarden.
- If other functions in the platform use fetchClient as passed through options, support it as well.
- skim an existing platform of the same shape before considering inventing a new pattern.
- docs.md in each platform should not describe the details of our implementation, handlers or anything relating to Mineral. It is for describing the platform's API itself and does not change based on what we do with it. It should also be brief.

## API clients
- Base URLs for platform clients should live in `{platform}.constants.js`, not creds, if they are static for all users of the API.
- Don't explicitly set `Content-Type: application/json` on the client — `customFetch` already adds it when there is a request body.
