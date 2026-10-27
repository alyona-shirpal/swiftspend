# SwiftSpend MCP Server Documentation

The SwiftSpend Model Context Protocol (MCP) server allows AI assistants (such as Claude Desktop, Cursor, and Antigravity) to connect to your SwiftSpend account and log expenses, query spending history, and check active categories.

---

## Installation & Setup

### 1. Build the Package locally
```bash
pnpm --filter @swiftspend/mcp-server build
```

The executable script will be generated at `packages/mcp-server/dist/index.js`.

---

## Configuration

The MCP server requires your API key:

| Environment Variable | Required | Description | Default / Example |
| --- | --- | --- | --- |
| `SWIFTSPEND_API_KEY` | **Yes** | Your API key generated in SwiftSpend Settings | `sk_live_...` |
| `SWIFTSPEND_API_URL` | No | SwiftSpend backend URL (optional) | Defaults to `https://swiftspend-api.vercel.app` |

---

## Integrating with MCP Clients

### Claude Desktop / Cursor / Antigravity Config (`mcp.json`)

Add the following to your `mcp.json` configuration file:

```json
{
  "mcpServers": {
    "swiftspend": {
      "command": "node",
      "args": [
        "/absolute/path/to/swiftspend/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "SWIFTSPEND_API_KEY": "sk_live_your_secret_api_key"
      }
    }
  }
}
```

> **Note**: `SWIFTSPEND_API_URL` is optional and defaults to `https://swiftspend-api.vercel.app`. You only need to set it if running against a local development server (`http://localhost:3000`) or a custom deployment domain.

---

## Publishing to Vercel

If you deploy your backend on Vercel:

1. Deploy `apps/api` to Vercel (or rely on existing deployment).
2. The Public REST API routes are available at `https://swiftspend-api.vercel.app/api/v1`.
3. If running a custom deployment, set `SWIFTSPEND_API_URL` to your custom Vercel deployment domain in your local MCP client configuration.

---

## Available MCP Tools

### `add_expense`
Logs a new expense in SwiftSpend.
- **Parameters**:
  - `amount` *(number, required)*
  - `currency` *(string, required, e.g. "EUR")*
  - `category_name` *(string, optional, e.g. "Restaurants")*
  - `merchant` *(string, optional, e.g. "Starbucks")*
  - `description` *(string, optional)*
  - `date` *(string, optional, YYYY-MM-DD)*

### `list_expenses`
Retrieves recent expenses.
- **Parameters**:
  - `limit` *(number, default 20)*
  - `page` *(number, default 1)*

### `list_categories`
Retrieves active spending categories.
