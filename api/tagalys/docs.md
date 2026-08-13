# Tagalys

- [Storefront API (v2)](https://tagalys.notion.site/Storefront-API-v2-20eacdd38c2080d58d3fd0cf6f24e435)

Region-specific HTTPS origins (`https://api-r{n}.tagalys.com`) with REST-style JSON under `/v2`. Storefront reads use GET; analytics ingest uses `POST /v2/analytics/events` with a JSON body. Browser requests authenticate with the `shop_id` query param (the shop’s `*.myshopify.com` domain). Server-side integrations should also pass `storefront_api_key`.

Endpoints: `GET /v2/collections/:collection_id`, `GET /v2/search`, `GET /v2/search_suggestions`, `GET /v2/popular_searches`, `GET /v2/recommendations/:recommendation_id`, `POST /v2/analytics/events`. Collections and search support pagination (`page`, `per_page`, capped at 10,000 products), sorting (`sort`, `include[]=sort_options`), filtering (`filter[...]`, `include[]=filters`), and scope (`scope[...]`). Use `include[]=products` or `include[]=product_ids` to control product payloads. Optional request context on collections, search, and recommendations: `country`, `language`, `segment_tag`. Errors return JSON with `error.type`, `error.code`, and `error.message`.
