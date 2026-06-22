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

### Examples

```typescript
// Fetch product by ID — found
{ ok: true, data: { id: ... } }

// Fetch product by ID — not found
{
  ok: false,
  error: {
    code: "NOT_FOUND",
    message: "Product sku-999 does not exist",
  },
}

// Fetch collection — results
{
  ok: true,
  data: [ { id: "sku-001" }, { id: "sku-002" } ],
  meta: { total: 2 },
}

// Fetch collection — none found
{
  ok: true,
  data: [],
  meta: { total: 0 },
}

// Delete product — success
{
  ok: true,
}

// Mutate single product — validation failure
{
  ok: false,
  errors: [
    { code: "INVALID_PRICE", message: "Price cannot be negative", field: "price" },
  ],
}

// Batch mutate — mixed results
{
  ok: false,
  results: [
    { ok: true, id: "sku-001", data: { id: "sku-001", price: "49.95" } },
    {
      ok: false,
      id: "sku-002",
      errors: [
        { code: "INVALID_PRICE", message: "Price cannot be negative", field: "price" },
      ],
    },
  ],
  meta: { total: 2, succeeded: 1, failed: 1 },
}
```

