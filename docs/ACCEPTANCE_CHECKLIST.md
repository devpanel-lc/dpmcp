# MVP Acceptance Checklist

## Safety

- [ ] no direct mutating application tools exist
- [ ] `devpanel_execute_plan` accepts `planId` only
- [ ] plan hash changes if any semantic plan field changes
- [ ] approval is stored separately from the tool call
- [ ] approval record includes plan hash
- [ ] expired plans cannot execute
- [ ] stale application fingerprint cannot execute
- [ ] selected restore backup must still exist
- [ ] duplicate/ambiguous application search fails closed

## Mock demo

- [ ] list application
- [ ] plan backup
- [ ] execute before approval returns `APPROVAL_REQUIRED`
- [ ] review page renders exact plan
- [ ] Reject prevents execution
- [ ] Approve allows same plan to execute
- [ ] backup is visible after execution
- [ ] restore plan works
- [ ] delete plan works

## Real DevPanel sandbox

- [ ] read applications
- [ ] normalize workspace/project/application IDs correctly
- [ ] list backups
- [ ] manual backup
- [ ] restore disposable app
- [ ] delete disposable app
- [ ] capture create project request/response
- [ ] verify create profile
- [ ] enable create only after fixture test passes

## Production hardening -- not required for local MVP

- [ ] durable PlanStore
- [ ] transactional execution lock
- [ ] authenticated approval UI
- [ ] CSRF protection
- [ ] per-user DevPanel authorization
- [ ] Streamable HTTP transport
- [ ] idempotency strategy
- [ ] audit retention policy
