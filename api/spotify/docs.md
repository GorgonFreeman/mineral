# Spotify

- [Web API](https://developer.spotify.com/documentation/web-api)
- [API reference](https://developer.spotify.com/documentation/web-api/reference)
- [Authorization](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [API calls](https://developer.spotify.com/documentation/web-api/concepts/api-calls)

REST JSON at `https://api.spotify.com/v1/...` with OAuth 2 bearer access tokens (`Authorization: Bearer`). Catalog and user endpoints use standard GET/POST/PUT/DELETE; many list responses are offset/limit paginated (`items`, `next`, `total`). User-scoped routes (playlists, library, player) need appropriate OAuth scopes; client-credentials tokens only cover public catalog data.
