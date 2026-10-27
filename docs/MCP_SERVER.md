# SwiftSpend MCP Server Documentation

The SwiftSpend Model Context Protocol (MCP) server allows AI assistants (such as Claude Desktop, Cursor, and Antigravity) to connect to your SwiftSpend account and log expenses, query spending history, and check active categories.

---

## Remote MCP Server & AI Authorization Hub

SwiftSpend provides hosted remote MCP endpoints, eliminating the need to run local Node scripts:

### 1. Interactive Authorization Portal (Codex, ChatGPT, Gemini)
Authorize your AI assistant with a single click:
👉 **`https://swiftspend-api.vercel.app/connect`** (or `/oauth/authorize`)

### 2. Remote MCP Endpoints
| Endpoint | Method | Description |
| --- | --- | --- |
| `/mcp/sse` | `GET` | Remote SSE connection endpoint (`?apiKey=sk_live_...`) |
| `/mcp/messages` | `POST` | MCP JSON-RPC message endpoint for active SSE sessions |
| `/mcp` | `GET` | Discovery endpoint with server metadata and status |
| `/mcp` | `POST` | Direct JSON-RPC over HTTP (for HTTP MCP clients) |
| `/oauth/authorize` | `GET/POST` | OAuth 2.0 Authorization Code flow with **Authorize Button** & PKCE |
| `/oauth/token` | `POST` | OAuth 2.0 Token exchange endpoint (PKCE `code_verifier` support) |
| `/oauth/register` | `POST` | RFC 7591 Dynamic Client Registration (DCR) for Gemini |
| `/.well-known/oauth-authorization-server` | `GET` | RFC 8414 OAuth 2.0 Authorization Server Discovery |
| `/.well-known/oauth-protected-resource` | `GET` | RFC 9728 OAuth 2.0 Protected Resource Metadata |
| `/api/v1/openapi.json` | `GET` | OpenAPI 3.0 specification for ChatGPT Actions & Gemini Function Calling |

### 3. Connecting Custom Apps in Google Gemini
Gemini Apps (Web & Mobile, per [Google Support Guide 17209137](https://support.google.com/gemini/answer/17209137)) allow connecting custom MCP apps:

1. **Prerequisites**:
   - Personal Google Account (18+).
   - SwiftSpend API Key generated under **Settings → API Keys**.
2. **Steps to Connect in Gemini**:
   - Open [gemini.google.com](https://gemini.google.com) on desktop.
   - Go to **Settings** (or user profile menu) → **Connected Apps** → **Custom Apps**.
   - Click **Add a custom app**.
   - In the **Server URL** / **MCP URL** field, enter:
     ```
     https://swiftspend-api.vercel.app/mcp
     ```
     *(Or your custom deployed backend URL).*
   - When prompted for authentication, click **Connect / Authorize**. Gemini uses standard OAuth 2.1 discovery (`/.well-known/oauth-authorization-server`) and Dynamic Client Registration (DCR).
   - Enter your SwiftSpend API key (`sk_live_...`) and click **Authorize & Connect with Button**.
   - Gemini will finish the redirect handshake (`https://gemini.google.com/oauth-redirect`) and link your SwiftSpend tools.
3. **Using in Gemini**:
   - In any Gemini chat, mention or use SwiftSpend tools to log expenses or query your budget:
     > *"Log an expense of 14 EUR for lunch at Bistro"*
     > *"List my recent expenses from SwiftSpend"*

---

### 4. Remote MCP Client Configuration (`mcp.json`)
```json
{
  "mcpServers": {
    "swiftspend-remote": {
      "url": "https://swiftspend-api.vercel.app/mcp/sse",
      "headers": {
        "Authorization": "Bearer sk_live_your_secret_api_key"
      }
    }
  }
}
```

---

## Installation & Setup (Local Stdio Alternative)

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
