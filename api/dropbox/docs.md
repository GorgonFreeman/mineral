# Dropbox

- [HTTP documentation](https://www.dropbox.com/developers/documentation/http/documentation)
- [OAuth guide](https://www.dropbox.com/developers/reference/oauth-guide)
- [API explorer](https://www.dropbox.com/developers/explorer)

RPC JSON over HTTPS at `https://api.dropboxapi.com/2/...` (most methods are POST with a JSON body). Content upload/download uses `https://content.dropboxapi.com/2/...` with arguments in the `Dropbox-API-Arg` header and binary body or response. Auth is OAuth 2 bearer access token (`Authorization: Bearer`). Paths are rooted at `""` (app or full Dropbox root depending on app permission); folder listing uses cursor pagination via `list_folder` / `list_folder/continue`.
