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
- Usually when making a function that gets multiples of a resource, it should be implemented as a Getter, with a paginator and digester. If done in this way, export platformThingGet and platformThingGetter, using the .bind() syntax seen in other Get functions.
- When making functions that act on single resources, consider using actionSingleOrMultiple to allow a queue of actions.
- When altering .yml files, preserve whitespace formatting.

## API clients
- Base URLs for platform clients should live in `{platform}.constants.js`, not creds, if they are static for all users of the API.
- Don't explicitly set `Content-Type: application/json` on the client — `customFetch` already adds it when there is a request body.

## Usual structure of a platform API client
This is the usual structure, but it can be altered per platform, if required. If there is no good reason to deviate, this is how a platform should look.
- Functions live in `/api/[platform]`
- If `docs.md` exists, it is a minimal link to native API documentation and a brief description of its structure. It is not concerned with our implementation and does not need to be updated.
- Creds are supported by path from `.creds.yml`. `.creds.yml.sample` documents the structure of the required creds.
- A customised FetchClient called `[platform]Client` exists in `[platform].utils.js`, which handles API requests. It implements a base URL, and resolves `credsPayload` into `context.creds` for future steps.
- All functions require a `credsPayload` argument to tell them which credentials to use. They relate per instance.
- `[platform].constants.js` contains any max pagination limits, default API version, base url (if not changing per instance).
- `[platform]Get.js` is a generic function which gets resources in a paginated way. It implements Getter, and all `[platform]ResourceGet.js` functions export both `platformResourceGet` and `platformResourceGetter`, using the "bind" export style.
- Each endpoint of the platform's API is supported as a separate function within the platform directory. Functions are named `[platform]NounVerb.js`, e.g. `shopifyPageDelete`.
- Endpoints should return the unwrapped data inside the standard response format, e.g. `data: { ...resource }`. Not e.g. `data: { product/data/result: { ...resource } }`.
- Each function creates and exports an `ArgsWarden`. Inside, mandatory arguments are validated. At minimum, all mandatory arguments should be a singleton, which falls back to a generic "value provided" validator. Anything that is not mandatory should be an option, included in the optional "options" argument which is commonly destructured in the function definition.
- For functions which act on a single resource, e.g. `shopifyPageGet`, `actionSingleOrMultiple` is implemented as an enhancement to allow acting on multiple items in a one-by-one fashion.
- `fetchClient` is implemented as an option, allowing implementations outside mineral core to use their own pipeline in making requests. This may include caching auth or utilising other platforms in the pipeline.

## Doing things
- If you are being asked to do something that involves using a platform, use this repo's functionality as your first option.
  - Try using curl commands based on the example curl commands documented in comments on the function files.
  - If the server is not running, start one with `npm run dev` or `npm run serve`.
- Where an API functionality is not currently implemented, but fits this repo's mission, create functions for yourself to use, then use those.
