# MVP Acceptance Checklist

## Safety

- [ ] no direct mutating application tools exist
- [ ] `devpanel_approve_and_execute_plan` accepts `planId` only
- [ ] plan hash changes if any semantic plan field changes
- [ ] approval is stored separately from the tool call
- [ ] approval record includes plan hash and approval method
- [ ] expired plans cannot execute
- [ ] stale application fingerprint cannot execute
- [ ] selected restore backup must still exist
- [ ] duplicate/ambiguous application search fails closed

## Approval

- [ ] Form Elicitation works when client supports it
- [ ] URL Elicitation works as fallback
- [ ] External URL works as last resort
- [ ] `APPROVAL_MODE` config controls which provider is used
- [ ] `auto` mode performs capability negotiation
- [ ] model cannot approve plans directly
- [ ] elicitation decline results in no execution
- [ ] elicitation cancel is handled gracefully

## Mock demo

- [ ] list application
- [ ] plan backup
- [ ] approve and execute via Form Elicitation
- [ ] verify backup exists
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
