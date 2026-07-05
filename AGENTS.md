# Mineral — agent instructions

Notes for AI assistants working in this directory. **Read this file at the start of mineral tasks** and follow anything here that isn't overridden by the user in chat.

## Misc
- When working in shopify, refer to gids (gid://shopify/Page/12345678) explicitly as "gids", and use "id" to refer to the number itself (12345678). "id" may still be required for use of the GraphQL API but semantically we should make this distinction.
- funcApiConfig should not list `options` in `argNames` — it is optional. When present on the request body, `funcApi` appends it after the named args.
- When implementing API functions that mirror official functions, include a link to the documentation at the top of the file as a comment.
- Don't add to this file unless asked.
- Use snake_case for package.json commands, with colon if appropriate.
- Use newlines and trailing commas where appropriate to minimise future diffs, e.g. in function args.