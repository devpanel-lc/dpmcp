# MCP Tool Contracts

## Design rule

MCP tools represent business intent, not individual REST endpoints.

Bad:

```text
post_api_v2_workspaces_projects
patch_api_v2_application_backup_restore
```

Good:

```text
devpanel_plan_create_application
devpanel_plan_restore_application
devpanel_execute_plan
```

## Read tools

### `devpanel_list_applications`

Purpose: list/search applications.

Input:

```json
{"search":"optional text"}
```

Side effects: none.

### `devpanel_get_application`

Input:

```json
{"application":"application ID or unique search"}
```

Behavior:
- try exact ID
- otherwise search
- reject zero matches
- reject multiple matches

### `devpanel_get_application_activities`

Input:

```json
{"application":"Existing Demo"}
```

### `devpanel_get_activity_logs`

Input:

```json
{"activityId":"..."}
```

### `devpanel_list_backups`

Input:

```json
{"application":"Existing Demo"}
```

## Plan tools

Plan tools are read-only with respect to DevPanel. They may write a plan record to the MCP server's own PlanStore.

### `devpanel_plan_create_application`

Input:

```json
{
  "workspaceId":"...",
  "repositoryOwner":"devpanel",
  "repositoryName":"example-drupal",
  "repositoryProvider":"github",
  "repositoryId":"optional",
  "branch":"main",
  "projectType":"drupal11_v2",
  "repositoryType":"optional"
}
```

Notes:
- This is the desired **business input**, not a direct DevPanel DTO.
- Real creation must map it through a verified create profile captured from the UI.
- Current OpenAPI does not prove that `instances[]` means branches; starter profile is explicitly unverified.

### `devpanel_plan_backup_application`

```json
{"application":"Existing Demo"}
```

Plan mutation:

```json
{"type":"MANUAL"}
```

### `devpanel_plan_restore_application`

Latest backup:

```json
{"application":"Existing Demo"}
```

Specific backup:

```json
{"application":"Existing Demo","backupId":"backup_123"}
```

### `devpanel_plan_delete_application`

```json
{"application":"Existing Demo"}
```

The planner reads backup state so the user can see recovery context before approval.

## Plan read tool

### `devpanel_get_plan`

```json
{"planId":"plan_..."}
```

Returns status, hash, target, steps, approval and execution result.

## Single mutation gateway

### `devpanel_execute_plan`

Input:

```json
{"planId":"plan_..."}
```

No other fields are accepted.

Possible outcome before approval:

```json
{
  "state":"APPROVAL_REQUIRED",
  "approval_url":"http://127.0.0.1:8787/review/plan_..."
}
```

After the human approves, call the same tool again with the same plan ID.

The executor:
- verifies plan hash
- verifies TTL
- verifies approval hash
- revalidates DevPanel state
- performs the stored operation
- stores execution result

## Future tools

Add only when the plan/executor pattern is preserved:

```text
devpanel_plan_pause_application
devpanel_plan_resume_application
devpanel_plan_restart_pod
devpanel_plan_add_domain
devpanel_plan_deploy_application
devpanel_plan_blue_green_switch
```

Do not introduce a second write gateway without a strong reason.
