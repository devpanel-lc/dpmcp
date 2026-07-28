# Example Conversations

These examples describe intended agent behavior. The model wording may vary; the security sequence must not.

## Example A -- Backup

**User**

> Back up Existing Demo before I make changes.

**Agent behavior**

1. Resolve `Existing Demo`.
2. Call `devpanel_plan_backup_application`.
3. Show the plan summary and state that nothing changed yet.
4. Call `devpanel_approve_and_execute_plan(planId)`.
5. If Form Elicitation is supported: native approve/decline dialog appears. User approves inline.
6. If not: present the returned external review URL. User opens it and approves.
7. Server revalidates, executes, and returns result.
8. Verify with `devpanel_list_backups`.

The agent must never say it approved on the user's behalf.

## Example B -- Restore latest backup

**User**

> Restore Existing Demo to its latest backup.

**Expected planner behavior**

- resolve exact app
- list backups
- choose latest backup from the server result
- produce HIGH-risk restore plan
- include backup ID in immutable target/preconditions
- require approval via elicitation or external URL
- revalidate both app fingerprint and backup existence immediately before restore

## Example C -- Ambiguous target

Assume two applications match `portal`.

**User**

> Delete portal.

**Expected result**

The resolver rejects the request as ambiguous and lists the candidate names/IDs. It must not pick one based on model intuition.

## Example D -- Stale plan

**User**

> Restore Acme from backup B1.

Plan is created and approved. Before execution, another operator changes the application state.

**Expected result**

```text
Plan is stale: application changed since planning. Create a new plan.
```

No restore occurs.

## Example E -- Creation

**User**

> Create a Drupal 11 app from devpanel/example-drupal on main.

**Mock mode**

The full plan/approval/execution flow works.

**Real mode before create profile verification**

Planning may succeed, but execution fails closed with a message requiring a captured and verified DevPanel create contract.

This is intentional. The OpenAPI does not document enough of the create response/`instances[]` semantics to safely guess.
