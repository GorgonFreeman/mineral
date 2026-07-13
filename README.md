# mineral

The [bedrock](https://github.com/GorgonFreeman/bedrock) middleware, refactored for compatibility with other projects and more consistent standards.

## Problems with bedrock

- **Inconsistent response format**
  - `success: true` vs `success: false` for calls that succeed but return no data
  - No distinction between technical failures and valid business errors
  - Mixed use of `error` vs `errors` in responses
- **Portability** — `.creds.yml` and related structures resist reuse outside the repo
- **Auth** — helpers can fail without retrying, especially when using creds from Upstash
- **Architecture** — boundaries between core and private functions could be firmer

## The plan

- **The response format to rule them all**
  ```typescript
  interface Response {
    ok: boolean
    data?: unknown
    error?: {
      code: string
      message: string
      details?: unknown
    }
    meta?: {
      page?: number
      pageSize?: number
      total?: number
      [key: string]: unknown
    }
    results?: Response[]
  }
  ```
  - `ok` — `true` if the intent executed; `false` otherwise
  - `data` — any info returned
  - `error` — when present, multiple errors go in `error.details`
  - `meta` — pagination, total items, etc.
  - `results` — array of responses from a queue or batch of calls
  - [Examples](_docs/standard_response_examples.md)
- **BYO Creds**
  ```
  {
    credsPath,
    shopifyCredsPath,
    credsObject,
    credsProvider, // function that returns a credsObject
  }
  ```
- **Monorepo structure**
Mineral gets pushed to from a larger repo that can also contain private functions. Mineral should be strictly useful stuff for the public, and can be used standalone, but needs to be instantiated for serving, setting stuff like which creds file to use. This allows it to be used as part of another repo in the same HTTP/curl way as by itself. Pass `--workspace` to locate `.creds.yml` and `--api_dirs` to serve additional function directories.

For cloud deploy, workspaces use `hosting/.hosting.yml` and `npm run host` (same `--workspace` / `--api_dirs` flags as dev/serve). See `hosting/.hosting.yml.sample`.

## What the thang do
- Server makes functions available from the api/ route, where an export matches the filename. Run `npm run serve`, and they're all curlable.
- .creds.yml is copied into .env when deploying, so creds can be accessed while hosted. Locally, it reads from the file directly.
- Cloud deploy reads `hosting/.hosting.yml` for per-function config — `before_wrappers` / `after_wrappers` like `requireHostedApiKey`, `max_instances`, schedules — and deploys each function to Google Cloud.