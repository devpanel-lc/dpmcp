# AGENTS.md — DevPanel Application MCP

## What this is

MCP server (TypeScript, stdio or http transport via `DP_TRANSPORT`) for planning, reviewing, approving, and executing DevPanel application mutations. The central invariant: **the model may inspect and plan freely but may not mutate DevPanel until a human approves an immutable plan**. Approval is in-conversation: the plan is rendered as text, the human answers APPROVE/REJECT, and the model relays that answer with the plan hash.

## Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server (stdio) | `npm run dev` |
| Dev server, explicit stdio + shared token | `npm run start:stdio` |
| Dev server, http + shared bearer | `npm run start:http:bearer` |
| Dev server, http + bring-your-own-token | `npm run start:http:token` |
| MCP Inspector | `npm run inspector` |
| Typecheck | `npm run typecheck` |
| Build | `npm run build` |
| Run all tests | `npm test` |
| Run one test file | `npx vitest run tests/plan-flow.test.ts` |
| Regenerate API types from `devpanel-openapi.json` | `npm run generate:api` |

**Order matters:** `npm run typecheck` → `npm test` before any commit. There is no linter configured. If `devpanel-openapi.json` changed, run `npm run generate:api` first -- `tests/api-types.test.ts` fails if the committed generated types are stale.

## Mode switch

Default `DP_MODE=mock` requires no external services. Copy `.env.example` → `.env` and run `npm run dev`.

`DP_MODE=real` requires `DP_API_BASE_URL`, `DP_ACCESS_TOKEN`, `DP_DEFAULT_WORKSPACE_ID`.

`DP_AUTH_MODE` (`off` default, `sso`, `token`) controls how `/mcp` authenticates callers and how the DevPanel credential is obtained -- independent of `DP_TRANSPORT`. `DP_MCP_BEARER_TOKEN` is the static bearer `/mcp` requires in `off` mode (falls back to `DP_ACCESS_TOKEN`). See `.env.example` for the full annotated list of vars per mode.

Real CREATE is gated behind `DP_ENABLE_REAL_CREATE=true` — see `config/create-profiles/drupal11-demo.json`. The profile's `verified` field must be `true` before enabling; do not guess the create-project response contract.

## Approval

Approval has no configuration. `devpanel_approve_and_execute_plan` is called
twice: `{planId}` returns the plan as text plus a fixed question and records
nothing; `{planId, decision, planHash}` relays the human's literal answer, and a
hash mismatch is refused. Client-native elicitation and the external review page
were removed -- real clients either don't implement elicitation or don't hold a
stream open to receive it, so every approval degraded to a browser URL.

Caveat to keep in mind when changing this area: `decision` is a tool argument, so
the model is mechanically able to forge it. The remaining human gate is the MCP
client's own tool-permission prompt, which this server cannot observe or require.

## Architecture (non-obvious)

```
src/index.ts                      → wires client, store, stdio transport
src/server.ts                     → builds McpServer, delegates to registerTools
src/tools/register.ts             → all MCP tools; devpanel_approve_and_execute_plan renders the plan + records the relayed decision
src/services/plan-service.ts      → creates immutable ChangePlan objects
src/services/execution-service.ts → validates, revalidates, executes approved plans
src/services/application-resolver.ts → resolves app by ID or fuzzy search
src/clients/                      → DevPanelClient interface + MockDevPanelClient + RealDevPanelClient
src/stores/plan-store.ts          → InMemoryPlanStore (swap for durable store in prod)
src/approval/plan-summary.ts      → renders a plan as text + the static approval question
src/domain/types.ts               → ChangePlan, ApprovalRecord, PlanStatus, ElicitationResult
src/utils/                        → hash.ts (SHA-256 plan fingerprint), fingerprint.ts (app state fingerprint)
src/generated/devpanel-api.d.ts   → generated from devpanel-openapi.json via `npm run generate:api`, do not hand-edit
src/clients/api-paths.ts          → apiPath() types RealDevPanelClient's endpoint paths against generated paths
src/tools/read-only-tool.ts       → defineReadOnlyTool() for tools that are structurally read-only only
src/http-server.ts                → public HTTP transport: /mcp (MCP OAuth), /login, /callback, /healthz
src/auth/session.ts               → in-memory Cognito SSO session store (access/refresh/id tokens), never persisted to disk
src/auth/cognito.ts               → Cognito hosted-UI client: authorize URL, PKCE, code exchange, refresh
src/auth/mcp-oauth.ts             → this server's own OAuth provider for /mcp (tokens scoped to MCP tools, never sent to DevPanel)
src/auth/login-server.ts          → drives the Cognito login/callback flow (loopback in stdio, /login+/callback in http)
```

### Key design constraints

- **stdout is reserved for MCP** when using stdio — all logs go to `console.error`.
- `devpanel_approve_and_execute_plan` is the **only** tool that may call mutating DevPanel client methods.
  - Exception: `devpanel_set_git_token` / `devpanel_remove_git_token` mutate the calling user's credential config directly (user-scoped auth setup, not application state). No other direct-mutation tools may be added.
- The executor **never** accepts mutable action parameters at approval time — approval is bound to `plan.hash` via an `ApprovalRecord`. The `decision` argument carries only APPROVE/REJECT, and is refused unless the accompanying `planHash` matches the current plan.
- Plans become `STALE` when preconditions fail (app fingerprint changed, backup disappeared) or TTL expires (`PLAN_TTL_SECONDS`, default 900s).
- The executor re-reads DevPanel state immediately before mutation (revalidation step).
- Plans are immutable after review begins; plan hash is computed by `hashPlan()`.

### Approval flow

```
Model creates plan (plan_* tool)
  ↓
Model calls devpanel_approve_and_execute_plan(planId)
  ↓
Server checks: approval exists? → execute if approved
  ↓
No approval → return plan text + "APPROVE or REJECT?" (nothing recorded)
  ↓
Human answers in the conversation
  ↓
Model calls again with {decision, planHash} → ApprovalRecord written to store
  ↓
Server revalidates preconditions
  ↓
Server executes mutation
  ↓
Server returns result
```

## Testing

- Framework: Vitest (`vitest run`)
- `tests/plan-flow.test.ts` — plan → approval → execute flow, security bypass attempts, stale/expired plans, hash integrity. `tests/http-mode.test.ts` — the two-call in-conversation approval over http.
- No fixtures or external services required.

## Gotchas

- `tsc` config: `"module": "NodeNext"` with ESM (`"type": "module"` in package.json). Source uses `.js` extensions in imports — keep them.
- Zod 4.x (not 3.x) — schemas differ slightly.
- MCP SDK is pinned to `@modelcontextprotocol/sdk@1.30.0` (stable v1 line, not v2 beta).
- `package-lock.json` is checked in — run `npm install` before typecheck/test if `node_modules/` is missing.
- Recommended Node version: 24 (see `.nvmrc`).
- `config/create-profiles/drupal11-demo.json` contains a template payload with `{{placeholders}}` — not valid JSON for direct use; it is documentation of the expected shape.
- MCP SDK has no "MCP Apps" or tool-hiding capability. Elicitation exists but is unusable in practice: clients may not implement it, and over streamable-HTTP a request sent without `relatedRequestId` is silently dropped when no standalone SSE stream is open.
