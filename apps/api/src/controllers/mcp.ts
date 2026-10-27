import { Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { extractApiKeyString, validateApiKey } from '../middleware/apiKeyAuth';
import {
  createMcpServerForUser,
  handleDirectJsonRpc,
  MCP_TOOLS_DEFINITIONS,
} from '../services/mcpServer';

interface McpSession {
  transport: SSEServerTransport;
  userId: string;
  createdAt: number;
}

const activeSessions = new Map<string, McpSession>();

// Cleanup stale sessions older than 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > 2 * 60 * 60 * 1000) {
      activeSessions.delete(id);
    }
  }
}, 30 * 60 * 1000).unref();

export const handleMcpDiscovery = (req: Request, res: Response) => {
  const host = req.get('host') || 'swiftspend-api.vercel.app';
  const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${proto}://${host}`;

  res.json({
    name: 'swiftspend-mcp',
    description: 'SwiftSpend Model Context Protocol (MCP) Remote Server',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      sse: `${baseUrl}/mcp/sse`,
      messages: `${baseUrl}/mcp/messages`,
      http_jsonrpc: `${baseUrl}/mcp`,
      authorize_portal: `${baseUrl}/mcp/authorize`,
      oauth_authorize: `${baseUrl}/oauth/authorize`,
      oauth_token: `${baseUrl}/oauth/token`,
      openapi: `${baseUrl}/api/v1/openapi.json`,
      docs: `${baseUrl}/docs/mcp`,
    },
    authentication: {
      methods: [
        'Query Parameter: ?apiKey=sk_live_... or ?api_key=sk_live_...',
        'HTTP Header: Authorization: Bearer sk_live_...',
        'HTTP Header: X-API-Key: sk_live_...',
        'OAuth 2.0 Authorization Code Flow (/oauth/authorize, /oauth/token)',
      ],
    },
    tools: MCP_TOOLS_DEFINITIONS.map((t) => ({ name: t.name, description: t.description })),
  });
};

export const handleMcpSse = async (req: Request, res: Response) => {
  try {
    const apiKey = extractApiKeyString(req);
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API Key is required to connect to the MCP SSE endpoint. Provide via ?apiKey=sk_live_... or Authorization header.',
      });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or revoked API key.',
      });
    }

    // Set CORS and SSE headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const transport = new SSEServerTransport('/mcp/messages', res);
    const server = createMcpServerForUser(auth.userId);

    const sessionId = transport.sessionId;
    activeSessions.set(sessionId, {
      transport,
      userId: auth.userId,
      createdAt: Date.now(),
    });

    req.on('close', () => {
      activeSessions.delete(sessionId);
    });

    await server.connect(transport);
  } catch (err: any) {
    console.error('Error establishing MCP SSE connection:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error establishing MCP SSE connection' });
    }
  }
};

export const handleMcpMessages = async (req: Request, res: Response) => {
  try {
    const sessionId = (req.query.sessionId as string) || (req.query.session_id as string);
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId query parameter' });
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found or has expired' });
    }

    await session.transport.handlePostMessage(req, res);
  } catch (err: any) {
    console.error('Error handling MCP message:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error processing message' });
    }
  }
};

export const handleMcpDirectPost = async (req: Request, res: Response) => {
  try {
    const apiKey = extractApiKeyString(req);
    if (!apiKey) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id ?? null,
        error: {
          code: -32000,
          message: 'Unauthorized: API Key required via Authorization Bearer or X-API-Key or ?apiKey=...',
        },
      });
    }

    const auth = await validateApiKey(apiKey);
    if (!auth) {
      return res.status(401).json({
        jsonrpc: '2.0',
        id: req.body?.id ?? null,
        error: {
          code: -32000,
          message: 'Unauthorized: Invalid or revoked API Key',
        },
      });
    }

    const result = await handleDirectJsonRpc(auth.userId, req.body);
    if (result) {
      return res.json(result);
    }
    return res.status(204).end();
  } catch (err: any) {
    console.error('Error handling MCP direct post:', err);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id ?? null,
      error: { code: -32603, message: 'Internal server error' },
    });
  }
};
