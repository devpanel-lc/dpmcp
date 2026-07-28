# Demo Script

## Demo objective

Show one idea clearly:

> The AI can operate DevPanel, but it cannot make a DevPanel change until the user approves the exact plan.

Approval happens **inside the MCP client** via Form Elicitation when supported, or via external URL as fallback.

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

## Scene 3 -- Approve and execute

Agent calls:

```text
devpanel_approve_and_execute_plan(planId)
```

**With Elicitation (primary flow):**

A native approve/decline dialog appears inside the MCP client. The dialog shows:
- Plan summary
- Risk level
- Planned operations
- Plan ID and hash

User clicks **Approve**.

Talking point:

> The approval dialog is native to the MCP client. The user never leaves their IDE/chat.

**Without Elicitation (fallback):**

An external review URL is returned. User opens it in a browser.

## Scene 4 -- Execute

After approval:
- Server revalidates application fingerprint
- Mutation runs
- Result stored
- Status `SUCCEEDED`

## Scene 5 -- Verify

User:

> Verify the backup exists.

Agent calls:

```text
devpanel_list_backups
```

Show new backup.

## Scene 6 -- High-risk example

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
1:30  Approve and execute via Form Elicitation (or external URL)
2:00  Verify backup exists
2:30  Show delete plan as HIGH risk
3:00  Explain same architecture extends to deployments/domains/cloud
```

## Fallback demo (no Elicitation)

If your MCP client does not support Form Elicitation:

```text
0:00  List existing apps
0:30  Ask AI to back one up
1:00  AI produces plan
1:30  devpanel_approve_and_execute_plan returns approval URL
2:00  Open URL in browser, review plan
2:30  Click Approve exact plan
3:00  Return to AI, execute same plan
3:30  Verify backup exists
```
