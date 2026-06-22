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
  - [Examples](docs/response-examples.md)
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
Mineral gets pushed to from a larger repo that can also contain private functions. Mineral should be strictly useful stuff for the public, and can be used standalone, but needs to be instantiated for serving, setting stuff like which creds file to use. This allows it to be used as part of another repo in the same HTTP/curl way as by itself. In the serve functions, allow it to operate from a different directory, finding .hosting.yml, .creds.yml, etc. within it.
