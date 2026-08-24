# Fast Simon

- [API Documentation](https://docs.fastsimon.com/api/api-doc.html)
- [Serving API – full text search](https://docs.fastsimon.com/api/api-doc.html#tag/Serving-API/operation/fulltextProducts)
- [SDK docs](https://docs.fastsimon.com/sdk)

Public Serving API over HTTPS at `https://api.fastsimon.com`. Search and collection reads are unauthenticated beyond the store identifiers: every request carries `UUID` and `store_id` as query parameters (values from the Fast Simon dashboard after install). Admin / merchandising endpoints additionally require an API key and the `X-Site-UUID` / `X-Store-ID` headers.

Core serving flow:

1. `GET /load` – returns site config including `cdn_cache_key` (required on subsequent product requests).
2. `GET /full_text_search` – full-text product search with optional facets, sorting, narrowing filters, and pagination (`page_num`).

Product results land under `data.items`; facets under `data.facets`. When `facets_required=1` and `data.facets_completed` is false, repeat the request with `facets_required=2` to finish facet computation. JSONP is supported via a `callback` query param; this client uses plain JSON.
