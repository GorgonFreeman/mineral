# Response examples

Examples of the [mineral response format](../README.md#the-plan).

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
