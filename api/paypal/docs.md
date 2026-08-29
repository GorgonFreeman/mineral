# PayPal

- [REST API overview](https://developer.paypal.com/api/rest/)
- [Authentication](https://developer.paypal.com/api/rest/authentication/)
- [Orders v2](https://developer.paypal.com/docs/api/orders/v2/)
- [Payments v2](https://developer.paypal.com/docs/api/payments/v2/)
- [Transaction Search](https://developer.paypal.com/docs/api/transaction-search/v1/)
- [Identity / userinfo](https://developer.paypal.com/docs/api/identity/v1/)

REST JSON under `https://api-m.paypal.com` (live) or `https://api-m.sandbox.paypal.com` (sandbox). OAuth 2.0 client-credentials: exchange `CLIENT_ID` + `CLIENT_SECRET` for a short-lived bearer token via `POST /v1/oauth2/token`, then send `Authorization: Bearer <token>` on every call.

Create a REST app under [Developer Dashboard → Apps & Credentials](https://developer.paypal.com/dashboard/applications). Toggle Sandbox vs Live for the matching client id/secret. Personal (first-party) apps can call Orders, Payments, Transaction Search, and Balances for the account that owns the app; some identity scopes need additional app configuration.

Transaction Search and Balances typically need the reporting scopes enabled on the app. Tokens expire (~hours); this client caches and refreshes them automatically.
