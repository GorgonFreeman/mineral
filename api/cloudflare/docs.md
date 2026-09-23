# Cloudflare

- [API documentation](https://developers.cloudflare.com/api/)
- [API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Single Redirects (Rulesets)](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/)

REST JSON at `https://api.cloudflare.com/client/v4`. Authenticate with an API token (`Authorization: Bearer <API_TOKEN>`). Successful responses use `{ success, result, errors, messages }`; list endpoints may include `result_info` for pagination. Zone Single Redirects live in the `http_request_dynamic_redirect` phase ruleset.
