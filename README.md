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

In a second terminal:

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

**Real CREATE is intentionally disabled by default.** The supplied OpenAPI confirms `POST /api/v2/workspaces/{workspaceId}/projects` and `CreateProjectDTO`, but it does not document the create-project response or the meaning of `instances[]`. Before enabling real creation:

1. Create one application manually in the current DevPanel UI.
2. Capture the successful Network request + response.
3. Update `config/create-profiles/drupal11-demo.json` with the verified payload.
4. Update `RealDevPanelClient.createApplication()` if the project ID response path differs.
5. Set the profile's `verified` flag to `true`.
6. Set `DP_ENABLE_REAL_CREATE=true`.

Do not infer this contract from field names.

## Documentation

- `docs/GOALS_AND_REQUIREMENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY_AND_APPROVAL.md`
- `docs/MCP_TOOL_CONTRACTS.md`
- `docs/DEVPANEL_API_MAPPING.md`
- `docs/LOCAL_DEVELOPMENT.md`
- `docs/DEMO_SCRIPT.md`
- `docs/IMPLEMENTATION_ROADMAP.md`

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

For local integrations, use stdio. For a hosted multi-user server, add Streamable HTTP after authentication and durable plan storage are implemented.
