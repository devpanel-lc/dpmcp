# DevPanel API Mapping -- MVP

This document is derived from the supplied DevPanel OpenAPI file. Where the OpenAPI is incomplete, this file says so explicitly.

## Resource model used by the MCP

```text
Workspace → Project → Application
```

Deployment exists in the API but is outside the v0.1 scope.

## List applications

```http
GET /api/v2/applications
```

Known query parameters:
- search
- pageIndex
- pageSize
- projectId
- environmentId
- namespace

## Get application

```http
GET /api/v2/applications/{id}
```

There is also a nested detail endpoint:

```http
GET /api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}
```

## Activity history

```http
GET /api/v2/applications/{id}/activities
```

## Activity logs

```http
GET /api/v2/activities/{id}/logs
```

Known query parameters:
- pageSize
- sinceSeconds

## Create application -- important OpenAPI limitation

There is no simple documented `POST /api/v2/applications` creation endpoint.

The primary project creation endpoint is:

```http
POST /api/v2/workspaces/{workspaceId}/projects
```

Request schema: `CreateProjectDTO`.

OpenAPI fields:

```json
{
  "repositoryId": "string",
  "repositoryOwner": "string",
  "repositoryName": "string",
  "projectType": "string",
  "repositoryType": "string",
  "instances": ["string"],
  "repositoryProvider": "string",
  "isUsePersonalToken": false,
  "isUseRepositoryToken": false,
  "repositoryToken": ""
}
```

OpenAPI-required fields:
- repositoryProvider
- isUsePersonalToken
- isUseRepositoryToken
- repositoryToken

### Not documented by the OpenAPI

- semantics of `instances[]`
- exact create-project response body
- where project ID is returned
- exact async provisioning sequence
- whether application/project naming is supplied through another request or inferred

Therefore real CREATE is disabled in the starter until a successful current UI request/response is captured.

## Backups

List:

```http
GET /api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups
```

Create:

```http
POST /api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups
Content-Type: application/json

{"type":"MANUAL"}
```

`CreateBackupDTO.type` enum:
- MANUAL
- AUTOMATED

Automatic backup configuration also exists via PATCH on the same collection, but `AutoBackupDTO` is not sufficiently documented for this MVP.

## Restore

```http
PATCH /api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}/backups/{backupId}/restore
```

No request body is documented.

## Delete application

```http
DELETE /api/v2/workspaces/{workspaceId}/projects/{projectId}/applications/{applicationId}
```

## Other application functions present but intentionally excluded from MVP

- update/upgrade application
- pause
- expired-time extension
- state changes
- advanced application settings
- activate/deactivate
- deploy-to-server
- VS Code session
- phpMyAdmin session
- force HTTPS
- HTTP logs by container
- application users
- custom domains
- export to template
- VPS operations

Several corresponding DTOs are empty objects in the supplied OpenAPI, including examples such as:
- `UpgradeApplicationDTO`
- `ApplicationReplicasDTO`
- `UpdateApplicationStateDTO`
- `CreateDomainDTO`

Do not implement these from guesswork. Capture the current frontend contract first.

## Create contract verification checklist

Before enabling `DP_ENABLE_REAL_CREATE=true`:

- [ ] capture DevPanel UI create request URL
- [ ] capture full JSON request body
- [ ] capture full JSON response body
- [ ] identify project ID field
- [ ] identify application creation/polling behavior
- [ ] confirm branch mapping
- [ ] confirm project type value
- [ ] confirm repository ID/owner/name/provider values
- [ ] confirm any name, capacity, namespace, environment or cloud fields not shown in OpenAPI
- [ ] save sanitized fixture in tests
- [ ] update create profile and mark `verified: true`
