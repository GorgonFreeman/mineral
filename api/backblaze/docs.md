# Backblaze B2

- [B2 Native API](https://www.backblaze.com/apidocs/introduction-to-the-b2-native-api)
- [Authorize account](https://www.backblaze.com/apidocs/b2-authorize-account)

REST JSON. Application keys authenticate via HTTP Basic on `b2_authorize_account` at `https://api.backblazeb2.com`; the response supplies an account-specific `apiUrl` and bearer token for other `b2_*` calls. Uploads use a dedicated upload URL and token from `b2_get_upload_url`, not the account authorization token.
