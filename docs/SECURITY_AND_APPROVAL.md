# Security and Approval Model

## 1. Security objective

The central security property is:

> An LLM can propose a DevPanel change, but it cannot authorize its own proposal.

## 2. Trust boundaries

Treat these as separate principals:

1. **User** -- may approve a change.
2. **MCP host/model** -- may read, reason, propose, and request execution.
3. **DevPanel MCP server** -- enforces plan and approval rules.
4. **DevPanel API** -- performs actual infrastructure/application operations.

Do not treat an LLM-generated field as proof of user approval.

## 3. Forbidden approval patterns

Never implement:

```json
{"planId":"...","approved":true}
```

Never accept:

```json
{"confirmation":"yes"}
```

Never execute because the model says:

> The user approved this earlier.

The server must verify a separate approval record.

## 4. Approval binding

ApprovalRecord:

```json
{
  "decision": "APPROVE",
  "planHash": "sha256:...",
  "approvedAt": "...",
  "approvedBy": "...",
  "source": "review-ui"
}
```

The plan hash is the capability being approved.

Any semantic plan change produces a different hash and invalidates the old approval.

## 5. Time-of-check/time-of-use protection

A valid approval is necessary but not sufficient.

Before executing, re-read DevPanel and verify the preconditions still hold. This protects against:
- another developer changing the application
- a deployment changing state
- a backup being deleted
- a target being replaced
- an application name query now resolving differently

## 6. Risk levels

### LOW
- create application
- create backup

### MEDIUM -- future
- pause/resume
- change capacity
- add domain
- alter non-production settings

### HIGH
- restore backup
- delete application
- production deployment -- future
- blue/green switchover -- future

MVP still requires approval for LOW risk changes. Risk is for presentation and future policy, not a bypass.

## 7. Destructive tool annotation

`devpanel_execute_plan` is intentionally annotated as mutating/destructive because it may execute plans with different risk levels. MCP tool annotations are hints for clients, not authorization controls. Server-side approval enforcement remains mandatory.

## 8. Credential rules

- `DP_ACCESS_TOKEN` is server-side configuration.
- Never return it to the model.
- Never include it in a plan.
- Never ask the user to paste it into a tool parameter.
- Redact authorization headers from logs.
- Production should use user-scoped OAuth/OIDC tokens rather than one shared bearer token.

## 9. Approval UI security -- local demo vs production

The bundled review UI is intentionally minimal and suitable for localhost demo only.

Before exposing it remotely, add:
- authentication
- CSRF protection
- HTTPS
- session/actor binding
- SameSite cookies or equivalent session controls
- authorization that confirms the reviewing user owns/can modify the target
- rate limiting
- approval nonce / one-time action token
- durable DB transaction

Do not deploy the local review server publicly as-is.

## 10. Plan store requirements for production

In-memory storage is only for a single-process demo.

Production store should provide:
- atomic compare-and-set status transitions
- unique plan IDs
- immutable plan payload/history
- transactional approval insertion
- execution lock
- durable audit log
- TTL cleanup
- user/session/tenant fields

Suggested database constraints:

```text
plan.id                  PRIMARY KEY
plan.hash                NOT NULL
approval.plan_id         UNIQUE
approval.plan_hash       NOT NULL
execution.plan_id        UNIQUE
```

Execution should lock the plan row to prevent two concurrent calls from executing twice.

## 11. Idempotency

The starter does not claim `execute_plan` is idempotent.

Production should add an idempotency key derived from `plan.id` and enforce one execution attempt for non-repeatable operations. For DevPanel operations that expose an activity/task ID, store it and resume verification rather than issuing the mutation again.

## 12. MCP Elicitation option

MCP 2025-11-25 defines user elicitation with `accept`, `decline`, and `cancel`. It is a good future approval-provider option when the target MCP host supports it.

Keep elicitation as a UI/provider layer only. The authorization fact must still be written to the same server-side approval record and bound to the plan hash.
