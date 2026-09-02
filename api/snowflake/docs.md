# Snowflake

- [Developer documentation](https://docs.snowflake.com/en/developer-guide)
- [SQL API](https://docs.snowflake.com/en/developer-guide/sql-api/index)
- [SQL API reference](https://docs.snowflake.com/en/developer-guide/sql-api/reference)
- [Snowflake REST APIs](https://docs.snowflake.com/en/developer-guide/snowflake-rest-api)
- [Authenticating](https://docs.snowflake.com/en/developer-guide/sql-api/authenticating)

Account-scoped HTTPS JSON APIs at `https://{account_identifier}.snowflakecomputing.com`:

- **SQL API** (`/api/v2/statements`) — submit SQL, poll handles, cancel runs, partitioned result sets
- **REST APIs** (`/api/v2/databases`, schemas, tables, users, …) — manage and list account objects with `showLimit` / `fromName` pagination

Auth: OAuth access token, programmatic access token, or key-pair JWT. Optional OAuth client + refresh token can mint access tokens without Upstash.
