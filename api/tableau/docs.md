# Tableau

- [Developer documentation](https://www.tableau.com/developer/learning/tableau-rest-api)
- [REST API](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_concepts_fundamentals.htm)
- [REST API reference](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref.htm)
- [Authentication](https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_concepts_auth.htm)

Server/site-scoped HTTPS JSON (or XML) API at `https://{server}/api/{api-version}/sites/{site-id}/...` for managing users, groups, workbooks, data sources, and other resources, authenticated via a short-lived session token obtained by signing in with a personal access token, username/password, or JWT rather than a single static API key.
