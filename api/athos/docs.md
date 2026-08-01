# Athos (SearchSpring)

- [API overview](https://docs.athoscommerce.com/reference/overview)
- [Search API](https://docs.athoscommerce.com/reference/get-search-results)
- [Searchspring → Athos migration guide](https://docs.athoscommerce.com/docs/migration-guide-athos)

Versioned GET-centric REST JSON on per-site hosts (`https://{siteId}.a.athoscommerce.net/v1`, plus a separate personalization base for recommendations); storefront calls use `siteId` in the subdomain (no API key on the client), while the Indexing API uses HTTP Basic Auth (`siteId` + `secretKey`).

Legacy Searchspring URLs used `https://{siteId}.a.searchspring.io/api/...` — see the migration guide for 1:1 path mapping.
