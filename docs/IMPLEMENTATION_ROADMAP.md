# Implementation Roadmap

## Phase 0 -- Contract validation

Goal: know exactly what the current DevPanel frontend sends/receives.

Tasks:
- capture one create-application request/response
- capture backup request/response
- capture restore request/response
- capture delete response
- sanitize fixtures
- confirm auth header requirements
- confirm production/non-production test workspace

Exit criteria:
- no real mutation depends on an inferred DTO field

## Phase 1 -- Local MCP demo

Included in this starter:
- stdio MCP transport
- mock DevPanel adapter
- real DevPanel adapter for documented operations
- plan service
- SHA-256 immutable plan hash
- local approval UI
- execution gateway
- precondition revalidation
- one integration-style test

Add during implementation:
- more unit tests
- normalized response schemas
- better errors
- mock stale-state test

Exit criteria:
- complete mock demo works with MCP Inspector

## Phase 2 -- Real DevPanel sandbox

Tasks:
- enable read tools against a disposable workspace
- verify normalized application hierarchy
- enable manual backup
- enable restore against disposable app
- enable delete against disposable app
- finalize verified creation profile
- enable create

Exit criteria:
- create → backup → restore → delete works only through approved plans

## Phase 3 -- Durable hosted MVP

Replace demo components:

```text
InMemoryPlanStore     → PostgreSQL
Local review UI       → authenticated approval web route
Shared DP token       → user-scoped token/OAuth
stdio only            → Streamable HTTP
single process        → multi-instance safe executor
```

Add:
- database row locking
- idempotency
- per-user/tenant authorization
- audit records
- HTTPS
- CSRF protection
- plan expiration worker/cleanup
- rate limiting

## Phase 4 -- MCP Elicitation approval provider

When target hosts support elicitation reliably:
- add `McpElicitationApprovalProvider`
- present plan summary in client UI
- preserve server-side hash-bound ApprovalRecord
- keep web review as fallback or for high-risk operations

Do not move authorization state into model-visible conversation text.

## Phase 5 -- Application management expansion

Candidate plan actions:
- pause/resume
- restart pod
- update/upgrade
- extend expiry
- application users
- force HTTPS
- domain management
- VS Code session (read/access action; assess approval policy)

Before each addition:
- verify corresponding DevPanel request DTO
- define risk
- define preconditions
- define postconditions
- define rollback/recovery

## Phase 6 -- Deployment domain

Add:
- create deployment
- configure deployment
- activate/deactivate
- deployment backup/restore
- custom domain
- create green deployment
- blue/green switch

Production switchover should be HIGH risk and always require explicit approval.

## Phase 7 -- Broader DevPanel MCP

Reuse the same ChangePlan abstraction for:
- workspace lifecycle
- project configuration
- teams/members
- secrets
- environments
- cloud accounts
- VPS
- catalogs/templates

## Recommended repository evolution

For MVP, one repository is sufficient.

When the codebase grows, split:

```text
packages/devpanel-client
packages/change-plan-core
apps/devpanel-mcp
apps/devpanel-approval-ui
```

Keep `change-plan-core` free of MCP-specific types so it can also power DevPanel's own UI or API automation later.
