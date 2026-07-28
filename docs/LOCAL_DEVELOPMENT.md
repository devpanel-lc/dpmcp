# Local Development

## Prerequisites

- Node.js 24+
- npm
- MCP client with Elicitation support (optional, for inline approval)

## 1. Install

```bash
cp .env.example .env
npm install
```

Keep:

```env
DP_MODE=mock
APPROVAL_MODE=auto
```

for the first run.

## 2. Start MCP server

```bash
npm run dev
```

The process runs two local surfaces:

1. MCP stdio transport
2. External approval UI on `http://127.0.0.1:8787` (fallback)

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

### Approve and execute

```json
{"planId":"plan_..."}
```

**With Elicitation support:** A native approve/decline dialog appears inside your MCP client. Click Approve.

**Without Elicitation:** An approval URL is returned. Open it in a browser and click **Approve exact plan**.

After approval:
- Server revalidates DevPanel state
- Server executes mutation
- Server returns result inline

### Verify

Call:

```text
devpanel_list_backups
```

The mock backup should now appear.

## 5. Approval mode testing

### Auto mode (default)

```env
APPROVAL_MODE=auto
```

Uses capability negotiation: Form Elicitation → URL Elicitation → External URL.

### Force Form Elicitation

```env
APPROVAL_MODE=form
```

Requires MCP client with Elicitation support. Falls back to cancelled if unsupported.

### Force URL Elicitation

```env
APPROVAL_MODE=url
```

Client prompts user to open review URL.

### Force External URL

```env
APPROVAL_MODE=external
```

Always returns the external review URL. Useful for testing the fallback path.

## 6. Run tests

```bash
npm test
npm run typecheck
```

Tests cover:
- Basic plan → approval → execute flow
- Form Elicitation approval/decline/cancel
- External URL fallback
- Model bypass attempts (no approval, wrong hash, tampered plan)
- Stale and expired plans
- Hash integrity

## 7. Switching to real DevPanel

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

## 8. Create-contract capture

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

## 9. MCP host configuration example

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
