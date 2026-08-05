# DevPanel Application MCP

MVP MCP server for **planning, reviewing, approving, and executing DevPanel application changes**.

The core rule is simple:

> The model may inspect and plan freely. It may not mutate DevPanel until a human has reviewed and approved the exact immutable plan.

## MVP scope

Read:
- list applications
- get application
- get application activities
- get activity logs
- list backups

Plan-only:
- create application
- create manual backup
- restore backup
- delete application

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

## Real DevPanel mode

Set:

```env
DP_MODE=real
DP_API_BASE_URL=https://...
DP_ACCESS_TOKEN=...
DP_DEFAULT_WORKSPACE_ID=...
```

Read, backup, restore, and delete use endpoints present in the supplied DevPanel OpenAPI.

**Real CREATE is intentionally disabled by default.** The endpoint contract is documented in the DevPanel OpenAPI (`POST /:workspaceId/projects` → `CreateProjectDTO`), but the OpenAPI's `instances[]` typing conflicts with the captured request shape, so a recorded real payload remains authoritative. Before enabling real creation:

1. Create one application manually in the current DevPanel UI.
2. Capture the successful Network request + response.
3. Update `config/create-profiles/drupal11-demo.json` with the verified payload.
4. Update `RealDevPanelClient.createApplication()` if the project ID response path differs.
5. Set the profile's `verified` flag to `true`.
6. Set `DP_ENABLE_REAL_CREATE=true`.

Do not infer this contract from field names.

**Activate has the same kind of divergence.** The OpenAPI's `ActivateLAMAppDTO` is an empty stub schema, so `RealDevPanelClient.activateApplication()` sends `ACTIVATE_DEFAULTS` (`src/clients/real-devpanel.ts`), a payload shape captured from a real DevPanel UI activate request. As with create, do not infer this contract from the OpenAPI spec or from field names -- update `ACTIVATE_DEFAULTS` only from a captured real request/response.

## Keeping in sync with `devpanel-openapi.json`

`src/generated/devpanel-api.d.ts` is generated from `devpanel-openapi.json` via `npm run generate:api` and is not hand-edited. `src/clients/api-paths.ts` types every hardcoded DevPanel endpoint path in `RealDevPanelClient` against the generated `paths` type, so a spec update that renames or removes an endpoint fails `npm run typecheck` at the exact call site instead of failing silently at runtime. `tests/api-types.test.ts` fails if `devpanel-openapi.json` was edited without regenerating.

After editing `devpanel-openapi.json`:

```bash
npm run generate:api
npm run typecheck   # surfaces any endpoint path that changed or was removed
npm test
```

The spec documents request bodies only -- it has no response schemas for `Workspace`, `Application`, `Project`, `Backup`, etc., so response shapes in `src/domain/types.ts` remain hand-curated and defensively normalized at runtime; see the comment at the top of that file.

## HTTP transport mode (per-user Bearer tokens)

Set `DP_TRANSPORT=http` to run the MCP server over Streamable HTTP instead of stdio. Each request must carry an `Authorization: Bearer <token>` header. The token serves dual purpose:

1. **Authentication** -- the token is forwarded to the DevPanel API as the `accessToken` for each request
2. **Plan ownership** -- the SHA-256 hash of the token becomes the `ownerId` on every plan created by that caller

```env
DP_TRANSPORT=http
DP_HTTP_HOST=127.0.0.1
DP_HTTP_PORT=3100
DP_HTTP_TLS_ENABLED=false  # set true + provide cert/key for production
DP_HTTP_CERT_PATH=
DP_HTTP_KEY_PATH=
```

The HTTP server binds to the configured host/port and accepts JSON-RPC requests using the MCP Streamable HTTP protocol. Plans created by one user cannot be approved or executed by a different token (owner identity is checked at execution time).

**Security warning:** Without TLS (`DP_HTTP_TLS_ENABLED=false`), Bearer tokens are transmitted in cleartext. For production, either enable TLS with `DP_HTTP_TLS_ENABLED=true` + `DP_HTTP_CERT_PATH`/`DP_HTTP_KEY_PATH`, or run behind a TLS-terminating reverse proxy (nginx, Cloudflare Tunnel, etc.). When binding to `127.0.0.1`, traffic is local-only and does not cross the network.

When `DP_TRANSPORT=http`, the `DP_MODE` setting is ignored (real mode is implicit since mock mode only applies to stdio local development).

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
