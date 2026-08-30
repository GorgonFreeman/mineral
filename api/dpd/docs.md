# DPD

- [DPD UK technology and API information](https://dpd.co.uk/content/about_dpd/technology.jsp)
- [DPD API documentation](https://www.dpd.com/wp-content/uploads/sites/235/2023/04/DPD-API-documentation-v1-2-1.pdf)

DPD API access is account-managed. DPD UK credentials authenticate against `https://api.dpd.co.uk/user/?action=login`, returning a `geoSession` token. The tracking client uses that session with the DPD network tracking endpoint. DPD Local accounts can use the same client with their account-specific `BASE_URL`.
