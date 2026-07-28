# Architecture

## 1. Logical architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ MCP Host / LLM                                               │
│                                                             │
│  read tools      plan tools           execute_plan           │
└────────┬─────────────┬──────────────────────┬────────────────┘
         │             │                      │
         ▼             ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│ DevPanel Application MCP                                    │
│                                                             │
│ ApplicationResolver                                         │
│      │                                                      │
│      ├──────────► PlanService ─────────► PlanStore           │
│      │                                │                      │
│      │                                └── plan hash          │
│      │                                                      │
│      └──────────► ExecutionService                           │
│                         │                                    │
│                         ├── verify hash                      │
│                         ├── verify approval                  │
│                         ├── revalidate preconditions         │
│                         └── execute approved action          │
│                                                             │
│ Approval Review HTTP UI ───────────────► PlanStore           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                     DevPanelClient interface
                         │             │
                  Mock adapter     Real adapter
                                       │
                                       ▼
                               DevPanel REST API
```

## 2. DevPanel resource hierarchy

Based on the supplied OpenAPI, application operations commonly use:

```text
Workspace
   ↓
Project
   ↓
Application
   ↓
Deployment (later scope)
```

The Applications API exposes list/detail/management operations, while application creation is initiated through Projects/Quickstart/Migrate APIs rather than a simple `POST /applications` endpoint.

## 3. Layer responsibilities

### MCP tool layer

Responsibilities:
- validate tool input with Zod
- give the model narrowly-scoped business operations
- return normalized structured information
- never embed DevPanel bearer credentials
- never contain orchestration logic beyond invoking services

### ApplicationResolver

Responsibilities:
- resolve an application from an ID or user-friendly unique query
- reject ambiguous matches
- return exact workspace/project/application identifiers

### PlanService

Responsibilities:
- perform read-only discovery
- calculate exact target and preconditions
- choose risk level
- generate ordered plan steps
- calculate immutable hash
- persist `PENDING_APPROVAL`

It must not call mutating DevPanel methods.

### Approval UI / Approval Provider

Responsibilities:
- present exact plan to human
- allow approve or reject
- bind decision to plan hash
- record actor/time/source

MVP uses a local HTTP review page because it works independently of MCP-host elicitation support.

### ExecutionService

Responsibilities:
1. load stored plan
2. verify plan hash
3. verify TTL
4. verify approval exists and matches hash
5. re-read target state
6. verify preconditions
7. mark execution started
8. call the one approved operation
9. store result/error
10. transition final status

### DevPanelClient

Defines business-oriented methods:
- list/get application
- list/create backup
- restore backup
- delete app
- create app
- get activity/logs

The MCP layer never builds raw REST URLs.

## 4. Plan state machine

```text
PENDING_APPROVAL
   ├──────── Reject ───────► REJECTED
   │
   └──────── Approve ──────► APPROVED
                                │
                                │ execute_plan
                                ▼
                          Revalidate state
                           │            │
                        changed       valid
                           │            │
                           ▼            ▼
                         STALE      EXECUTING
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                          SUCCEEDED             FAILED
```

A production implementation may add `DRAFT`, `READY_FOR_REVIEW`, `CANCELLED`, and explicit retry states.

## 5. Plan integrity

The plan hash is calculated over immutable semantic fields and excludes:
- `hash`
- `status`
- `approval`
- `execution`

Approval stores the hash independently:

```text
approval.planHash == plan.hash
```

Execution fails if this is not true.

## 6. Preconditions

For existing applications the MVP stores an application fingerprint derived from:
- application ID
- project ID
- workspace ID
- status
- hostname
- origin branch

Restore additionally stores the selected backup ID.

Immediately before mutation the executor reads the application again. A mismatched fingerprint marks the plan stale.

As the MCP grows, preconditions should become action-specific and include stronger revision/version identifiers exposed by DevPanel.

## 7. Approval provider evolution

The architecture should use an `ApprovalProvider` abstraction in production. Possible implementations:

```text
Local Review UI     -- current starter/demo
MCP Elicitation     -- client-rendered approval when host supports it
Enterprise Web UI   -- authenticated dashboard / SSO
Slack approval      -- later, only with strong actor binding
```

All providers write the same ApprovalRecord. The executor does not care which UI produced it.

## 8. Transport evolution

### v0.1
- MCP over stdio
- local approval HTTP server
- in-memory plan store

### hosted MVP
- Streamable HTTP MCP transport
- authenticated review UI
- PostgreSQL/Redis plan store
- per-user DevPanel token
- actor/session binding

### production
- OAuth/OIDC
- durable audit log
- rate limiting
- idempotency keys
- task/long-running operation support where appropriate
