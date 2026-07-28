# Goals and Requirements

## 1. Product goal

Build a DevPanel MCP server that lets an AI assistant help a user operate DevPanel applications while keeping the human in control of every state-changing action.

The MVP should demonstrate that a user can describe an operational goal in natural language, allow the agent to inspect DevPanel, receive a concrete plan, verify the plan, approve it inline via MCP client-native Elicitation, and only then permit execution.

The goal is **not** to expose every DevPanel REST endpoint as an MCP tool.

## 2. Primary MVP user story

> As a DevPanel user, I can ask an AI assistant to create or manage an application. The assistant first gathers the current state and prepares a detailed change plan. I review the exact target and steps inside my MCP client. Nothing changes until I explicitly approve that immutable plan via Form Elicitation or external review. The system revalidates the state immediately before execution, performs only the approved operations, verifies the result, and records what happened.

## 3. MVP capabilities

### Read-only operations

- list applications
- resolve one application by ID or unique search
- get application details
- get activities
- get activity logs
- list application backups

These operations may execute without a DevPanel change-plan approval because they do not mutate DevPanel. The MCP host may still apply its own normal tool confirmation policy.

### Planned state-changing operations

- create application
- create manual backup
- restore a backup
- delete application

Each operation follows:

```text
DISCOVER → PLAN → REVIEW → APPROVE → REVALIDATE → EXECUTE → VERIFY
```

## 4. Functional requirements

### FR-1 -- Read current state before planning
The planner must read enough DevPanel state to identify the exact target and detect ambiguity.

### FR-2 -- No direct write tools
The MCP server must not expose direct `create_application`, `restore_application`, or `delete_application` tools that mutate on first call.

### FR-3 -- Immutable plan
A plan must include:
- unique plan ID
- action type
- risk level
- human-readable summary
- exact target identifiers
- normalized proposed inputs
- ordered steps
- preconditions
- expected result
- rollback/recovery notes
- creation and expiry timestamps
- deterministic plan hash

### FR-4 -- Approval bound to hash
Approval must contain the exact `planHash` it authorizes.

### FR-5 -- LLM cannot self-approve
No MCP tool may accept a boolean or string that the model can use to assert human approval. Approval is obtained through MCP Elicitation or external review UI.

### FR-6 -- Inline approval via Elicitation
The primary approval mechanism is MCP Form Elicitation -- a native approve/decline dialog inside the MCP client. Fallback: URL Elicitation, then external HTTP review page.

### FR-7 -- Revalidation
Before any mutation, the executor must compare current DevPanel state with the plan preconditions.

### FR-8 -- Stale plan handling
If relevant state changed, execution must stop and mark the plan `STALE`. A new plan must be generated and approved.

### FR-9 -- One mutation gateway
Only `devpanel_approve_and_execute_plan` may call mutating methods on the DevPanel client.

### FR-10 -- Result verification
After execution, the MCP server must verify or re-read enough state to report the outcome. The MVP performs basic verification; production can add stronger per-action postconditions.

### FR-11 -- Plan TTL
Plans expire after a configurable time. Default MVP TTL: 15 minutes.

### FR-12 -- Fail closed
Unknown or undocumented DevPanel API contracts must block real mutation rather than being guessed.

## 5. Non-functional requirements

### NFR-1 -- Safety over convenience
A failed or stale plan must require replanning, not automatic improvisation.

### NFR-2 -- Auditable
Store plan, approval, execution timestamps, result/error, and actor identity.

### NFR-3 -- Deterministic execution
Execution must use the stored plan, not arguments reconstructed from the conversation.

### NFR-4 -- MCP-host independent approval
The MVP approval gate works with multiple approval providers: Form Elicitation (primary), URL Elicitation (fallback), External URL (last resort).

### NFR-5 -- Extensible
The same plan/executor architecture must later support deployments, domains, teams, workspaces, secrets, cloud resources, and blue/green workflows.

### NFR-6 -- Server-side secrets
DevPanel bearer credentials are environment/server configuration only.

## 6. Explicit non-goals for v0.1

- full DevPanel API coverage
- production OAuth / Cognito flow
- cloud account creation
- workspace/team administration
- production deployment workflows
- custom domain changes
- automatic approval policies
- model-authored arbitrary REST calls
- generic shell or arbitrary command execution
- background task infrastructure

## 7. MVP success criteria

A demo is successful when all of these work:

1. AI lists an existing application.
2. AI creates a backup plan.
3. Approve-and-execute triggers Elicitation dialog (or returns external URL).
4. User approves the exact plan.
5. Server revalidates and executes.
6. A follow-up read verifies the outcome.
7. Restore/delete demonstrate the same approval gate.
8. Editing or changing a plan after approval is impossible.
9. A changed application fingerprint causes execution to fail as stale.
10. Mock mode runs the complete demo without DevPanel credentials.
