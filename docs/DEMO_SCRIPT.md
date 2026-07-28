# Demo Script

## Demo objective

Show one idea clearly:

> The AI can operate DevPanel, but it cannot make a DevPanel change until the user approves the exact plan.

Do not spend the demo showing individual REST endpoints.

## Scene 1 -- Inspect

User:

> Show me my DevPanel applications.

Agent calls:

```text
devpanel_list_applications
```

Expected result includes `Existing Demo` in mock mode.

Talking point:
- read-only operations can happen immediately
- model gets normalized application state

## Scene 2 -- Plan a backup

User:

> Back up Existing Demo before we change anything.

Agent should call:

```text
devpanel_plan_backup_application
```

Expected response:
- plan ID
- `PENDING_APPROVAL`
- risk LOW
- exact application target
- current state fingerprint
- mutation step: create MANUAL backup

Talking point:

> Notice that no backup exists yet. The assistant has only created a plan.

## Scene 3 -- Attempt execution

Agent calls:

```text
devpanel_execute_plan(planId)
```

Expected:

```text
APPROVAL_REQUIRED
```

Show approval URL.

Talking point:

> The model cannot pass `approved=true`; the server does not accept such an argument.

## Scene 4 -- Human review

Open approval URL.

Show:
- summary
- risk
- target
- steps
- expected result
- rollback
- hash

Click **Approve exact plan**.

Talking point:

> This approval is stored against the exact SHA-256 plan hash.

## Scene 5 -- Execute

Agent calls again:

```text
devpanel_execute_plan(samePlanId)
```

Expected:
- executor revalidates application fingerprint
- mutation runs
- result stored
- status `SUCCEEDED`

## Scene 6 -- Verify

User:

> Verify the backup exists.

Agent calls:

```text
devpanel_list_backups
```

Show new backup.

## Scene 7 -- High-risk example

User:

> Delete Existing Demo.

Agent creates delete plan.

Show that the plan is HIGH risk and includes latest-backup context.

Do not actually approve/delete in a public demo unless using mock mode or a disposable application.

## Optional stale-plan demonstration

1. Create plan A.
2. Change target application state outside the plan.
3. Approve plan A.
4. Execute plan A.
5. Server rejects with `STALE` because fingerprint changed.

This is a strong proof that approval is not a blanket permission to perform whatever the agent wants later.

## Suggested 5-minute narrative

```text
0:00  List existing apps
0:30  Ask AI to back one up
1:00  AI produces plan -- no mutation
1:30  Execute attempt returns approval required
2:00  Review exact plan in browser
2:45  Approve
3:00  Execute same plan
3:45  Verify backup
4:15  Show delete plan as HIGH risk
4:45  Explain same architecture extends to deployments/domains/cloud
```
