# mineral

An everything middleware, centred around easy-to-bring credentials and instantly useful curl commands. Now importable into your project.

## How to get mineralling

1. From your project, install mineral: `npm i @foxtware/mineral`.
2. Set up a `.creds.yml` in your project directory, based on mineral's `.creds.yml.sample`. Add the credentials for the platform you want to use.
3. Add the `dev` command to your project's `package.json`:
```
"dev": "node --watch --watch-path=./api --watch-path=./.creds.yml --watch-path=./.env --watch-path=./hosting node_modules/@foxtware/mineral/server.js --workspace . --api_dirs api"
```
4. Run `npm run dev` to start a server.
5. Use an example curl command from the file whose function you want to use, with the creds path you set up.

## Key ideas
### The response format to rule them all

All functions should return data in this format.

```typescript
  interface Response {
    ok: boolean
    data?: unknown
    error?: {
      code: string
      message: string
      details?: unknown
    }
    meta?: {
      page?: number
      pageSize?: number
      total?: number
      [key: string]: unknown
    }
    results?: Response[]
  }
```
- `ok` — `true` if the intent executed; `false` otherwise
- `data` — any info returned
- `error` — when present, multiple errors go in `error.details`
- `meta` — pagination, total items, etc.
- `results` — array of responses from a queue or batch of calls
- [Examples](_docs/standard_response_examples.md)

### BYO creds

Each function accepts an object like this, supplying auth info for each platform it contacts:

```
{
  credsPath,
  credsObject,
  credsProvider, // function that returns a credsObject
}
```

You can set up a `.creds.yml` in your workspace directory and refer to it using `credsPath` > `platform.account`, or supply credentials inline using `credsObject`.

### Monorepo context

Mineral gets pushed to from a larger repo. Private functions are contained in a sibling project, which imports mineral to power all of the core functionalities, and layers certain business logic on top - e.g. known creds paths. 

Mineral is strictly core functionalities, useful for anyone.

Pass `--workspace` to locate `.creds.yml` and `--api_dirs` to serve additional function directories.

### Hosting

For cloud deploy, workspaces use `hosting/.hosting.yml` and `npm run host` (same `--workspace` / `--api_dirs` flags as dev/serve). See `hosting/.hosting.yml.sample`. 

In the hosting YML, you can use wrappers which are additional layers to your hosted function. For instance, you may want to require an API key in requests to your middleware while it's live, or, require a hash in the headers that matches a hash of the body. 

The decoupled nature of these desires to what the function actually does and their broad application is why they're implemented in the hosting config itself, rather than in a custom instance of the function.

### AI use

Not gonna lie, I have absolutely composed some of these platforms with AI. Some of them may not work, some may not stick closely to the core principles, some may use awkward auth methods - some error payloads are definitely not optimised. However, know that I have hand-coded precursors to this repo, that do largely the same thing, and that any additions benefit (or suffer) from the structure that is laid out in the earlier platforms.

### Function arguments shape

- Bound arguments, if they exist, are first
- Mandatory inputs are passed as separate arguments
- Optional inputs are passed in one 'options' object on the end, which falls back to `{}` if not supplied

This looks like:
```
const attack = (name, damage, accuracy, pp, type, { effects } = {}) => {
```
where 'effects' is optional and the others are mandatory.

This documents what options are available, and allows invocations to only supply meaningful inputs.
