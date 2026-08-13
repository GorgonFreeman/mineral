# Tagalys

- [Custom integration API (V1)](https://static.tagalys.com/docs/api/custom-integration/)
- [Front-end API](https://www.tagalys.com/docs/api/front-end/#tagalys-front-end-api)
- [Support: custom platform integration](https://support.tagalys.com/how-can-i-install-tagalys-to-my-custom-built-ecommerce-platform)
- [Integration overview](https://support.tagalys.com/integration)

Region-specific HTTPS origins (`https://api-r{n}.tagalys.com`) with versioned POST JSON under `/v1` (and FormData for product feeds). Every call includes an `identification` object (`client_code`, `api_key`, `store_id`; optional `currency` on front-end calls). Use the private key for configuration and product sync; use the public key for storefront search, merchandising pages, recommendations, and analytics.
