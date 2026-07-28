# Local Development

## Prerequisites

- Node.js 20+
- npm
- browser

## 1. Install

```bash
cp .env.example .env
npm install
```

Keep:

```env
DP_MODE=mock
```

for the first run.

## 2. Start MCP server

```bash
npm run dev
```

The process runs two local surfaces:

1. MCP stdio transport
2. human review UI on `http://127.0.0.1:8787`

All logs go to stderr because stdout is the MCP protocol channel.

## 3. Use MCP Inspector

In another terminal:

```bash
npm run inspector
```

Connect and open Tools.

## 4. Run the core approval flow

### List apps

Call:

```text
devpanel_list_applications
```

Expected mock app:

```text
Existing Demo
```

### Create a backup plan

```json
{"application":"Existing Demo"}
```

Copy returned plan ID.

### Attempt execution

```json
{"planId":"plan_..."}
```

Expected:

```text
APPROVAL_REQUIRED
```

and an approval URL.

At this point no backup has been created.

### Review

Open the URL in a browser. Verify:
- action
- risk
- exact target
- ordered steps
- expected result
- rollback
- plan hash

Click **Approve exact plan**.

### Execute again

Call:

```json
{"planId":"same plan ID"}
```

Expected:

```text
EXECUTED
```

### Verify

Call:

```text
devpanel_list_backups
```

The mock backup should now appear.

## 5. Run tests

```bash
npm test
npm run typecheck
```

The included test verifies that execution does not happen before approval and succeeds after an approval record bound to the exact plan hash.

## 6. Switching to real DevPanel

Edit `.env`:

```env
DP_MODE=real
DP_API_BASE_URL=https://YOUR-API
DP_ACCESS_TOKEN=YOUR_SERVER_SIDE_TOKEN
DP_DEFAULT_WORKSPACE_ID=...
```

Start with read tools only.

Recommended progression:

1. list applications
2. get application
3. list backups
4. create backup plan + approval + execute
5. restore in a non-production test application
6. delete only a disposable test application
7. enable create only after contract capture

## 7. Create-contract capture

In browser DevTools:

```text
Network
  ↓
Create one disposable application manually
  ↓
Locate POST /api/v2/workspaces/{workspaceId}/projects
  ↓
Copy sanitized request payload
  ↓
Copy sanitized response JSON
```

Do not include access tokens, cookies, passwords, private repository tokens, or customer data in fixtures.

Then update:

```text
config/create-profiles/drupal11-demo.json
```

and `RealDevPanelClient.createApplication()` if necessary.

## 8. MCP host configuration example

A generic stdio host configuration looks like:

```json
{
  "mcpServers": {
    "devpanel": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/absolute/path/to/devpanel-mcp-starter"
    }
  }
}
```

Exact configuration location depends on the MCP host.
