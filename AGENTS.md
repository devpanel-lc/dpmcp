# AGENTS.md — DevPanel Application MCP

## What this is

MCP server (TypeScript, stdio transport) for planning, reviewing, approving, and executing DevPanel application mutations. The central invariant: **the model may inspect and plan freely but may not mutate DevPanel until a human approves an immutable plan via the review UI**.

## Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server (stdio) | `npm run dev` |
| MCP Inspector | `npm run inspector` |
| Typecheck | `npm run typecheck` |
| Build | `npm run build` |
| Run all tests | `npm test` |
| Run one test file | `npx vitest run tests/plan-flow.test.ts` |

**Order matters:** `npm run typecheck` → `npm test` before any commit. There is no linter configured.

## Mode switch

Default `DP_MODE=mock` requires no external services. Copy `.env.example` → `.env` and run `npm run dev`.

`DP_MODE=real` requires `DP_API_BASE_URL`, `DP_ACCESS_TOKEN`, `DP_DEFAULT_WORKSPACE_ID`.

Real CREATE is gated behind `DP_ENABLE_REAL_CREATE=true` — see `config/create-profiles/drupal11-demo.json`. The profile's `verified` field must be `true` before enabling; do not guess the create-project response contract.

## Architecture (non-obvious)

```
src/index.ts          → wires client, store, approval server, stdio transport
src/server.ts         → builds McpServer, delegates to registerTools
src/tools/register.ts → all MCP tools; only devpanel_execute_plan mutates DevPanel
src/services/         → PlanService (creates plans), ExecutionService (executes with preconditions)
src/clients/          → DevPanelClient interface + MockDevPanelClient + RealDevPanelClient
src/stores/           → InMemoryPlanStore (swap for durable store in prod)
src/approval/         → review-server.ts serves the human approval UI
src/domain/types.ts   → ChangePlan, ApprovalRecord, PlanStatus
src/utils/            → hash.ts (SHA-256 plan fingerprint), fingerprint.ts (app state fingerprint)
```

### Key design constraints

- **stdout is reserved for MCP** when using stdio — all logs go to `console.error`.
- `devpanel_execute_plan` is the **only** tool that may call mutating DevPanel client methods.
- The executor **never** accepts `approved: true` or any mutable action parameters — approval is bound to `plan.hash` via a separate `ApprovalRecord`.
- Plans become `STALE` when preconditions fail (app fingerprint changed, backup disappeared) or TTL expires (`PLAN_TTL_SECONDS`, default 900s).
- The executor re-reads DevPanel state immediately before mutation (revalidation step).
- Plans are immutable after review begins; plan hash is computed by `hashPlan()`.

## Testing

- Framework: Vitest (`vitest run`)
- Single test file: `tests/plan-flow.test.ts` — tests the plan → approval → execute flow against `MockDevPanelClient` and `InMemoryPlanStore`.
- No fixtures or external services required.

## Gotchas

- `tsc` config: `"module": "NodeNext"` with ESM (`"type": "module"` in package.json). Source uses `.js` extensions in imports — keep them.
- Zod 4.x (not 3.x) — schemas differ slightly (`z.string().min(1)` etc. but check Zod 4 docs for any API changes).
- MCP SDK is pinned to `@modelcontextprotocol/sdk@1.30.0` (stable v1 line, not v2 beta).
- No lockfile checked in — run `npm install` before typecheck/test if `node_modules/` is missing.
- Recommended Node version: 24 (see `.nvmrc`).
- `config/create-profiles/drupal11-demo.json` contains a template payload with `{{placeholders}}` — not valid JSON for direct use; it is documentation of the expected shape.
