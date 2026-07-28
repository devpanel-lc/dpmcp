# Architecture

## 1. Logical architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ MCP Host / LLM                                               │
│                                                             │
│  read tools      plan tools       approve_and_execute_plan   │
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
│ ApprovalService                                             │
│      │                                                      │
│      ├── Form Elicitation (native client dialog)            │
│      ├── URL Elicitation (client opens URL)                 │
│      └── External URL fallback (HTTP review server)         │
│                                                             │
│ External Review HTTP UI ───────────────► PlanStore           │
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

### ApprovalService

Responsibilities:
- route approval through the best available provider
- Form Elicitation (native client dialog) when supported
- URL Elicitation (client opens URL) when supported
- External URL fallback (HTTP review page) as last resort
- record ApprovalRecord bound to plan hash

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
                                │ devpanel_approve_and_execute_plan
                                ▼
                          VALIDATING (revalidate state)
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

## 7. Approval provider architecture

The approval system uses a provider-based architecture:

```text
Form Elicitation   -- primary: native approve/decline dialog inside MCP client
URL Elicitation    -- fallback: client prompts user to open review URL
External URL       -- last resort: HTTP review page at localhost:8787
```

All providers write the same ApprovalRecord. The executor does not care which UI produced it.

### Capability-based selection

```text
Does client support Form Elicitation?
  YES → native approve/decline dialog
  NO  → Does client support URL Elicitation?
           YES → client opens review URL
           NO  → external HTTP review page
```

`APPROVAL_MODE=auto` triggers this negotiation. Explicit modes (`form`, `url`, `external`) override for testing.

## 8. Transport evolution

### v0.1
- MCP over stdio
- Form Elicitation approval (primary)
- External approval HTTP server (fallback)
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
