# DevPanel Application MCP

MVP MCP server for **planning, reviewing, approving, and executing DevPanel application changes**.

The core rule is simple:

> The model may inspect and plan freely. It may not mutate DevPanel until a human has reviewed and approved the exact immutable plan.

## MVP scope

Read:
- whoami (DevPanel profile of the currently authenticated bearer/session)
- list applications
- get application
- get application activities
- get activity logs
- list backups

Plan-only:
- create application
- activate application (deploy to K8s)
- deactivate application (undeploy/pause)
- create manual backup
- restore backup
- delete application
- delete project (blocked if the project still has applications -- delete those first)
- delete workspace (blocked if the workspace still has projects -- delete those first)
- enable/disable code server (VSCode) on a deployed application (see caveat below)
- enable/disable phpMyAdmin on a deployed application (see caveat below)

Execute:
- `devpanel_approve_and_execute_plan(planId)` -- the only MCP tool allowed to mutate DevPanel

## Approval priority

1. **Form Elicitation** -- native approve/decline dialog inside the MCP client
2. **URL Elicitation** -- client prompts user to open a review URL
3. **External approval URL** -- model returns a URL for the user to open in a browser

Set `APPROVAL_MODE` to control which method is used:

```env
APPROVAL_MODE=auto     # capability negotiation (default)
APPROVAL_MODE=form     # force Form Elicitation
APPROVAL_MODE=url      # force URL Elicitation
APPROVAL_MODE=external # force external HTTP review page
```

`auto` means capability-based selection, NOT automatic approval.

## Workflow

```text
User intent
   ↓
Read current DevPanel state
   ↓
Create immutable ChangePlan
   ↓
Model presents plan to user
   ↓
devpanel_approve_and_execute_plan(planId)
   ↓
Server requests human approval (Form Elicitation / URL / External)
   ↓
Human approves exact plan hash
   ↓
Server revalidates preconditions
   ↓
Server executes mutation
   ↓
Server returns result inline
```

## Why approval is not a tool argument

The executor never accepts `approved: true`, repository changes, application IDs, backup IDs, or any other mutable action input. The plan is frozen before approval. Approval is stored separately and bound to the plan SHA-256 hash.

This prevents the model from turning:

```json
{"planId":"plan_123","approved":true}
```

into fake human approval.

## Quick start -- safe mock demo

```bash
cp .env.example .env
npm install
npm run dev
```

By default this starts in **stdio** transport with `DP_MODE=mock`. In a second terminal:

```bash
npm run inspector
```

The default `DP_MODE=mock` does **not** contact DevPanel.

Suggested demo:

1. `devpanel_list_applications`
2. `devpanel_plan_backup_application` with `Existing Demo`
3. `devpanel_approve_and_execute_plan` with returned plan ID
4. Approve via Form Elicitation dialog (or open the returned `approval_url`)
5. `devpanel_list_backups` to verify the result

## Environment variables

Full annotated defaults live in `.env.example` (`cp .env.example .env` to start) -- this table is the quick-reference index. Grouped by what they configure:

**Core**

| Var | Default | Required when | Notes |
|---|---|---|---|
| `DP_MODE` | `mock` | -- | `mock` (no external calls) or `real` (calls DevPanel) |
| `DP_API_BASE_URL` | `http://localhost.invalid` | `DP_MODE=real` | DevPanel REST API base URL |
| `DP_ACCESS_TOKEN` | (empty) | `DP_MODE=real`; also `DP_AUTH_MODE=off` | DevPanel personal access token, forwarded to the DevPanel API |
| `DP_DEFAULT_WORKSPACE_ID` | `mock-workspace` | `DP_MODE=real` | Workspace used when a tool call doesn't specify one |
| `DP_ENABLE_REAL_CREATE` | `false` | -- | Gates real `create application` (see [Real DevPanel mode](#real-devpanel-mode)) |
| `DP_CREATE_PROFILE` | `drupal11-demo` | -- | Which `config/create-profiles/*.json` payload to use |

**Transport & `/mcp` auth** (see [HTTP transport mode](#http-transport-mode) for the full picture) -- the `npm run start:*` scripts below set `DP_TRANSPORT`/`DP_AUTH_MODE` for you, so you normally don't hand-edit these two:

| Var | Default | Required when | Notes |
|---|---|---|---|
| `DP_TRANSPORT` | `stdio` | -- | `stdio` or `http` |
| `DP_AUTH_MODE` | `off` | -- | `off` (shared token), `sso`, or `token` (bring-your-own) |
| `DP_MCP_BEARER_TOKEN` | (empty) | -- | Static bearer `/mcp` requires in `off` mode; falls back to `DP_ACCESS_TOKEN` |
| `DP_PUBLIC_BASE_URL` | (empty) | `DP_TRANSPORT=http` | Public origin, e.g. `https://dpmcp.up.railway.app` (no trailing slash) |
| `DP_ALLOWED_HOSTS` | derived from `DP_PUBLIC_BASE_URL` | -- | Host-header allowlist (anti DNS-rebinding) |
| `PORT` | `3000` | -- | HTTP listen port (Railway sets this automatically) |
| `DP_ELICIT_TIMEOUT_MS` | `60000` | -- | Max wait for a client-native elicitation dialog before falling back to the external review URL |

**Cognito SSO** (`DP_AUTH_MODE=sso` only)

| Var | Default | Notes |
|---|---|---|
| `COGNITO_CLIENT_ID` | (empty) | Dedicated hosted-UI-enabled app client for this server |
| `COGNITO_CLIENT_SECRET` | (empty) | Leave empty for a public client |
| `COGNITO_DOMAIN` | (empty) | Hosted-UI custom domain, e.g. `https://login.site.devpanel.com` |
| `COGNITO_SCOPES` | `phone email openid profile aws.cognito.signin.user.admin offline_access` | `offline_access` is what enables auto-renew |
| `COGNITO_REDIRECT_URI` | derived | `{DP_PUBLIC_BASE_URL}/callback` (http) or `http://localhost:{DP_LOGIN_CALLBACK_PORT}/callback` (stdio) |
| `DP_LOGIN_CALLBACK_PORT` | `8788` | Loopback port for the stdio-mode login callback |
| `DP_LOGIN_TIMEOUT_MS` | `180000` | How often to re-print the login URL while a login is pending |

**Approval**

| Var | Default | Notes |
|---|---|---|
| `APPROVAL_MODE` | `auto` | `auto` / `form` / `url` / `external` -- see [Approval priority](#approval-priority) |
| `APPROVAL_HOST` | `127.0.0.1` | Bind host for the external review UI (stdio mode) |
| `APPROVAL_PORT` | `8787` | Bind port for the external review UI (stdio mode) |
| `APPROVAL_PUBLIC_BASE_URL` | derived | `{DP_PUBLIC_BASE_URL}` (http) or `http://127.0.0.1:{APPROVAL_PORT}` (stdio) |
| `PLAN_TTL_SECONDS` | `900` | How long a plan stays valid before going `STALE` |

## Real DevPanel mode

Set:

```env
DP_MODE=real
DP_API_BASE_URL=https://...
DP_ACCESS_TOKEN=...
DP_DEFAULT_WORKSPACE_ID=...
```

Read, backup, restore, and delete use endpoints present in the supplied DevPanel OpenAPI -- but "present in the spec" is not the same as "verified real"; see the restore caveat below.

**Real CREATE is intentionally disabled by default.** The endpoint contract is documented in the DevPanel OpenAPI (`POST /:workspaceId/projects` → `CreateProjectDTO`), but the OpenAPI's `instances[]` typing conflicts with the captured request shape, so a recorded real payload remains authoritative. Before enabling real creation:

1. Create one application manually in the current DevPanel UI.
2. Capture the successful Network request + response.
3. Update `config/create-profiles/drupal11-demo.json` with the verified payload.
4. Update `RealDevPanelClient.createApplication()` if the project ID response path differs.
5. Set the profile's `verified` flag to `true`.
6. Set `DP_ENABLE_REAL_CREATE=true`.

Do not infer this contract from field names.

**Activate has the same kind of divergence.** The OpenAPI's `ActivateLAMAppDTO` is an empty stub schema, so `RealDevPanelClient.activateApplication()` sends `ACTIVATE_DEFAULTS` (`src/clients/real-devpanel.ts`), a payload shape captured from a real DevPanel UI activate request. As with create, do not infer this contract from the OpenAPI spec or from field names -- update `ACTIVATE_DEFAULTS` only from a captured real request/response.

**Deactivate is unverified, unlike activate.** `PATCH .../applications/{applicationId}/deactivate` (`ApplicationsController_deactivateApplication`) is a real, documented sibling of the activate endpoint, and `RealDevPanelClient.deactivateApplication()` mirrors `activateApplication()`'s PATCH-then-poll-until-status pattern (polling for `UNDEPLOY_APPLICATION_SUCCESS` instead of `DEPLOY_APPLICATION_SUCCESS`). But `DeactivateLAMAppDTO` is an empty stub schema like `ActivateLAMAppDTO` was, and no real deactivate request has been captured from the DevPanel UI yet, so the request body is currently an unverified guess (`{}`). Capture a real request/response (same Network-tab workflow as create/activate) before relying on this in real mode, and update the body accordingly.

**Code server / phpMyAdmin toggle -- confirmed endpoint, but the request needs the app's full current config.** Toggling `isEnableEditor`/`isEnablePMA` on an already-deployed application (as opposed to setting them once at activate time via `ActivateConfig`) uses `PATCH .../applications/{applicationId}/update` (captured from the DevPanel UI 2026-08-06). Unlike a delta PATCH, this endpoint expects the *entire* application config on every call -- the DevPanel UI reads current state and PATCHes it back with one field flipped. `RealDevPanelClient.buildUpdateAppPayload()` re-reads the application via `getApplication()` and extracts as many fields as possible from its raw response; fields where a wrong guess could silently downgrade real resources (`containerImage`, `groupType`, `capacity`, `capacityLimit`, `storage`) are **not** defaulted -- the call throws a clear error if any of those can't be read live, rather than resetting them to the captured sample's values. The remaining structural fields (`appRoot`, `webRoot`, `codesDirectory`, `startAppScript`, `imagePullPolicy`, `filePermissionLevel`, `isEnableBasicAuth`, `ipRestrictionSlug`, `isEnable`, `isEnablePPA`) fall back to the captured sample (`UPDATE_APP_SAFE_DEFAULTS` in `src/clients/real-devpanel.ts`) since they're low-risk platform conventions. **Caveat:** the field names above are confirmed for the PATCH *request*; that `GET .../applications/{id}` exposes the same field names (used to read "current" values) is assumed, not independently verified -- if a real response uses different field names, the affected required fields will throw rather than silently guess, so this fails loud rather than corrupting app config.

**Backup file download.** `GET .../backups/{backupId}/files/{fileId}` (used by `devpanel_get_backup_download_url`) has no response schema in the OpenAPI spec, but the real controller contract has been confirmed (`applications.controller.ts:684-742`): the request must include `?downloadURL=true` or the response is just file-object metadata (no URL). With that param, the response is JSON with a `downloadURL` field (a 1h pre-signed S3/DO/Azure/OVH URL), plus `downloadPgsqlURL` when the application and environment both have PgDB enabled. `RealDevPanelClient.getBackupFile()` sends the query param and `normalizeBackupFile()` reads both fields directly. `fileId` comes from `devpanel_list_backups` -- each backup's raw data carries full `databaseFile`/`filesFile`/`sourcecodeFile` objects, each with an `_id`.

**Restore is disabled -- use phpMyAdmin instead.** `PATCH .../backups/{backupId}/restore` (`RealDevPanelClient.restoreBackup()`) is typed in the OpenAPI spec as a bodyless request returning 200 with no content, but that has never been confirmed against a live backend: create/activate/backup-download were all corrected by capturing a real request from the DevPanel UI, and DevPanel has no UI restore feature to capture one from either. Rather than ship an unverifiable mutation, `devpanel_plan_restore_application` never creates a plan -- it always returns a warning message directing the user to the manual path: download the backup's database dump with `devpanel_get_backup_download_url` (databaseFile `_id` as `fileId`) and import it into the application's database via phpMyAdmin. `RealDevPanelClient.restoreBackup()` and the `RESTORE_APPLICATION` execution-service case are left in place but are unreachable through the MCP tools while this gate is active.

## Keeping in sync with `devpanel-openapi.json`

`src/generated/devpanel-api.d.ts` is generated from `devpanel-openapi.json` via `npm run generate:api` and is not hand-edited. `src/clients/api-paths.ts` types every hardcoded DevPanel endpoint path in `RealDevPanelClient` against the generated `paths` type, so a spec update that renames or removes an endpoint fails `npm run typecheck` at the exact call site instead of failing silently at runtime. `tests/api-types.test.ts` fails if `devpanel-openapi.json` was edited without regenerating.

After editing `devpanel-openapi.json`:

```bash
npm run generate:api
npm run typecheck   # surfaces any endpoint path that changed or was removed
npm test
```

The spec documents request bodies only -- it has no response schemas for `Workspace`, `Application`, `Project`, `Backup`, etc., so response shapes in `src/domain/types.ts` remain hand-curated and defensively normalized at runtime; see the comment at the top of that file.

## HTTP transport mode

`DP_TRANSPORT` (`stdio` default, or `http`) and `DP_AUTH_MODE` (`off` default, `sso`, or `token`) are independent settings. Transport picks stdio vs. public HTTP; auth mode picks how `/mcp` authenticates callers and how a DevPanel credential is obtained. `DP_MODE=mock` still works over `DP_TRANSPORT=http` -- transport doesn't force real mode.

Switching between the common combinations doesn't require hand-editing `DP_TRANSPORT`/`DP_AUTH_MODE` in `.env` -- three npm scripts set them for you (Node's `loadEnvFile()` never overrides vars already set in the shell, so these always win over `.env`; secrets like `DP_PUBLIC_BASE_URL`, `DP_MCP_BEARER_TOKEN`, `DP_ACCESS_TOKEN` still come from `.env` as usual):

```
npm run start:stdio        # DP_TRANSPORT=stdio DP_AUTH_MODE=off  (local, single shared token)
npm run start:http:bearer  # DP_TRANSPORT=http  DP_AUTH_MODE=off  (public HTTP, single shared bearer)
npm run start:http:token   # DP_TRANSPORT=http  DP_AUTH_MODE=token (public HTTP, bring-your-own-token)
```

```env
DP_TRANSPORT=http
DP_PUBLIC_BASE_URL=https://your-server.example.com   # required in http mode
DP_ALLOWED_HOSTS=                                     # optional Host-header allowlist; derived from DP_PUBLIC_BASE_URL by default
```

There is no in-process TLS support -- run behind a TLS-terminating reverse proxy (Railway, nginx, Cloudflare Tunnel, etc.).

`DP_AUTH_MODE` controls `/mcp`'s auth behavior, independent of transport (see `.env.example` for the full annotated list of vars per mode):

- **`off`** (default) -- a single shared `DP_ACCESS_TOKEN` is used for every caller. `/mcp` itself is gated by a static bearer: `DP_MCP_BEARER_TOKEN`, falling back to `DP_ACCESS_TOKEN` if unset. Fine for solo local dev; wrong for a shared deployment, since every caller acts as the same DevPanel identity.
- **`sso`** -- the server logs into Cognito itself (`/login`, `/callback` in http mode; a loopback listener in stdio mode) and keeps the DevPanel token server-side only. `/mcp` is protected by this server's own MCP OAuth implementation (`src/auth/mcp-oauth.ts`); those tokens are scoped to the MCP tools only and are never sent to DevPanel.
- **`token`** (bring-your-own-token) -- requires `DP_TRANSPORT=http`. There is no server-side secret: each MCP session's own `/mcp` bearer is forwarded 1:1 to DevPanel for that session, and DevPanel itself rejects invalid tokens.

The MCP OAuth grant flow (`/authorize` -> `/token`) only ever issues usable tokens in `sso` mode, where a real Cognito login gates consent. In `off`/`token` mode `/authorize` refuses outright (`error=unauthorized_client`) instead of rendering consent -- minting a local grant there would either bypass the static-bearer gate (`off`) or hand out a token that isn't a real DevPanel credential (`token`).

**Plan ownership** comes from `DevPanelClient.getCallerIdentity()` (`src/tools/register.ts` calls `dp.getCallerIdentity()` per session, not a global singleton). `TokenScopedDevPanelClient` (sso mode) returns the Cognito `sub`; `RealDevPanelClient` returns the Cognito `sub` in sso mode or a one-way hash of its own bearer token otherwise (`src/clients/real-devpanel.ts`) -- never the raw token, since `PLAN_OWNER_MISMATCH` errors echo this value back to whoever triggered the mismatch. Because each `token`-mode session gets its own `RealDevPanelClient` instance scoped to its own forwarded bearer (`src/index.ts`), different callers get different owner ids there too, so one user can no longer approve/execute a plan another user created. `off` mode still shares one identity across all callers (a single `RealDevPanelClient` built from the one shared `DP_ACCESS_TOKEN`), matching its single-shared-identity design.

## Important implementation constraints

- stdout is reserved for MCP when using stdio -- logs use `console.error`.
- Plan objects are immutable after review begins.
- Approval must bind to `plan.hash`.
- Executor re-reads DevPanel state immediately before mutation.
- A changed target makes the plan `STALE`; the user must review a new plan.
- Only `devpanel_approve_and_execute_plan` may call mutating DevPanel client methods.
- Secrets remain server-side and are never tool arguments.
- Production should replace `InMemoryPlanStore` with a durable transactional store.

## Technology baseline

The starter uses the stable TypeScript MCP SDK package line rather than the current v2 beta:

- `@modelcontextprotocol/sdk@1.30.0`
- `zod@4.4.3`
- Node.js 24+

For single-user setups, use stdio transport (`DP_TRANSPORT=stdio`). For multi-user hosted deployments, use HTTP transport with per-user Bearer tokens (`DP_TRANSPORT=http`).
