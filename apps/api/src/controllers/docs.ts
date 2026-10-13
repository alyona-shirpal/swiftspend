import { Response, Request } from 'express';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SwiftSpend Public REST API',
    version: '1.0.0',
    description: 'Public REST API for managing and logging expenses with SwiftSpend using API Keys.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Public API v1 base URL',
    },
  ],
  security: [
    { ApiKeyAuth: [] },
    { BearerAuth: [] }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key format: sk_live_...',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key or JWT',
      },
    },
    schemas: {
      ExpenseInput: {
        type: 'object',
        required: ['amount', 'currency'],
        properties: {
          amount: { type: 'number', example: 42.50 },
          currency: { type: 'string', example: 'EUR' },
          category_id: { type: 'string', format: 'uuid', nullable: true },
          category_name: { type: 'string', example: 'Groceries' },
          merchant: { type: 'string', example: 'Supermarket' },
          description: { type: 'string', example: 'Weekly groceries' },
          date: { type: 'string', format: 'date', example: '2026-10-10' },
        },
      },
    },
  },
  paths: {
    '/expenses': {
      post: {
        summary: 'Create a new expense',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExpenseInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Expense created successfully' },
          '401': { description: 'Unauthorized / Invalid API Key' },
        },
      },
      get: {
        summary: 'List user expenses',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          '200': { description: 'List of expenses' },
        },
      },
    },
    '/categories': {
      get: {
        summary: 'List active user categories',
        responses: {
          '200': { description: 'List of active categories' },
        },
      },
    },
  },
};

export const serveDocsHtml = (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>SwiftSpend API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          spec: ${JSON.stringify(openApiSpec)},
          dom_id: '#swagger-ui',
        });
      };
    </script>
  </body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

export const serveMcpDocsHtml = (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <title>SwiftSpend MCP Server Setup & Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; background: #fafafa; }
      pre, code { background: #eef1f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
      pre code { display: block; padding: 16px; overflow-x: auto; line-height: 1.4; }
      h1, h2, h3 { color: #111; }
      table { border-collapse: collapse; width: 100%; margin: 20px 0; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      th { background-color: #f2f2f2; }
      .badge { background: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>SwiftSpend Model Context Protocol (MCP) Server <span class="badge">v1.0.0</span></h1>
    <p>The SwiftSpend MCP Server allows AI clients (Claude Desktop, Cursor, Antigravity, etc.) to securely log expenses, retrieve history, and check categories using your API Key.</p>
    
    <h2>1. Configuration</h2>
    <p>Configure the following environment variables in your local MCP client:</p>
    <table>
      <tr><th>Variable</th><th>Description</th><th>Example</th></tr>
      <tr><td><code>SWIFTSPEND_API_KEY</code></td><td>Your secret API key from Settings</td><td><code>sk_live_...</code></td></tr>
      <tr><td><code>SWIFTSPEND_API_URL</code></td><td>SwiftSpend backend base URL</td><td><code>https://your-domain.vercel.app</code></td></tr>
    </table>

    <h2>2. MCP Client Setup (mcp.json)</h2>
    <pre><code>{
  "mcpServers": {
    "swiftspend": {
      "command": "node",
      "args": [
        "/path/to/swiftspend/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "SWIFTSPEND_API_KEY": "sk_live_your_secret_api_key",
        "SWIFTSPEND_API_URL": "https://your-domain.vercel.app"
      }
    }
  }
}</code></pre>

    <h2>3. Available Tools</h2>
    <ul>
      <li><strong><code>add_expense</code></strong>: Post a new expense (<code>amount</code>, <code>currency</code>, <code>category_name</code>, <code>merchant</code>, <code>description</code>, <code>date</code>).</li>
      <li><strong><code>list_expenses</code></strong>: Fetch recent user expenses (<code>limit</code>, <code>page</code>).</li>
      <li><strong><code>list_categories</code></strong>: List active spending categories.</li>
    </ul>

    <h2>REST API Specs</h2>
    <p>Looking for raw HTTP endpoints? Visit <a href="/docs">REST API Documentation</a>.</p>
  </body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
