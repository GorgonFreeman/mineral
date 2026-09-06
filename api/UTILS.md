# Mineral utils landmarks

Cheat sheet for [`utils.js`](utils.js). Prefer this over cold-grepping the file. Exports are listed near the bottom of `utils.js` (`module.exports`).

## Validation and args

| Export | Use when |
|--------|----------|
| `ArgsWarden` | Validate required function args. Do **not** list `options` in `argNames` — `funcApi` appends body `options` after named args. |
| `credsFromPayload` | Resolve `{ credsPath }` / `{ credsObject }` / `{ credsProvider }` into creds. |
| `valueProvided` | Default ArgsWarden singleton validator (“anything truthy/present”). |
| `objHasAny` / `objHasAll` | Object-shape validators (e.g. product identifier has `productId` or `handle`). |

## Queues and batching

| Export | Use when |
|--------|----------|
| `Processor` | Drain a mutable pile with concurrency. Constructor options include `canFinish` (default `true`), `maxInFlightRequests`, `logFlavourText`, `onDone`. Set `this.canFinish = false` (or pass `canFinish: false`) to keep waiting when the pile is empty until you flip it true — useful when producers still fill the pile. |
| `oneTrickProcessor` | Fire-and-forget: pile of arg arrays → `func(...args)` via a `Processor`. |
| `actionSingleOrMultiple` | Single resource action that also accepts an array (or cartesian product of arrays) via `OperationQueue`. |
| `Operation` / `OperationQueue` | Lower-level queue primitives behind `actionSingleOrMultiple`. |
| `Getter` | Paginated list fetch: `paginator` + `digester`; export both `platformThingGet` and `platformThingGetter` with `.bind`-style wrappers. Call `getter.end()` to stop paging early. `run({ verbose })` defaults to quiet when `HOSTED`. |
| `FakeGetter` | Wrap a one-shot fetch (e.g. Peoplevox report) so it emits `items` / `done` like a `Getter`. |
| `ThresholdActioner` | Call an action once N `increment()` calls have happened (e.g. unlock a tagger after processors finish). |
| `MultiDex` | Index items by multiple primary keys and merge partial records (useful for cross-store joins). |

## Shopify ids

| Export | Use when |
|--------|----------|
| `gidToId` | Strip `gid://shopify/.../123` → `"123"`. Prefer numeric **id** inputs on mineral functions; use **gid** only when the GraphQL API requires it. |

## HTTP client

| Export | Use when |
|--------|----------|
| `FetchClient` | Platform HTTP client base (pipeline steps, base URL, auth). |
| `customFetch` | Shared fetch used inside clients; already sets `Content-Type: application/json` when there is a body — don’t set it again. |
| `fetchClient` option | Many handlers accept `fetchClient` in `options` so geode (or tests) can inject a wrapped client. |

## Diff / inspect (sweeps)

| Export | Use when |
|--------|----------|
| `surveyObject` | Summarise / compare object fields for assess steps. |
| `diffObjects` | Field-level diffs between source and target. |
| `logDeep` | Deep console dump (local inspect). |
| `askQuestion` | Interactive confirm when `!HOSTED`. |

## Small helpers often needed

`ensureArray`, `arrayToChunks`, `groupObjectsByFields`, `arrayPartition`, `wait`, `timeMs`, `responseArrayToResponse`, `responseResultsByOutcome`, `normalise`, `objectDigNodeAtPath`.
