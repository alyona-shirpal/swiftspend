import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { supabaseAdmin } from './supabase';
import { createExpenseRecordAdmin } from './createExpenseAdmin';
import { updateExpenseRecord } from './updateExpenseRecord';

export const MCP_TOOLS_DEFINITIONS = [
  {
    name: 'add_expense',
    description: 'Post/log a new expense in SwiftSpend with automatic multi-currency conversion',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Expense amount (must be positive number)',
        },
        currency: {
          type: 'string',
          description: '3-letter currency code (e.g. EUR, USD, UAH)',
        },
        category_name: {
          type: 'string',
          description: 'Optional category name (e.g. Groceries, Restaurants, Transport)',
        },
        category_id: {
          type: 'string',
          description: 'Optional category UUID',
        },
        merchant: {
          type: 'string',
          description: 'Optional merchant or place of purchase (e.g. Starbucks, Silpo)',
        },
        description: {
          type: 'string',
          description: 'Optional description or note for the expense',
        },
        date: {
          type: 'string',
          description: 'Optional date of expense in YYYY-MM-DD format (defaults to today)',
        },
      },
      required: ['amount', 'currency'],
    },
  },
  {
    name: 'update_expense',
    description: 'Edit or update an existing expense entry (amount, category, merchant, description, date)',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The UUID of the expense entry to update',
        },
        amount: {
          type: 'number',
          description: 'New amount for the expense',
        },
        currency: {
          type: 'string',
          description: 'New 3-letter currency code (e.g. EUR, USD, UAH)',
        },
        category_name: {
          type: 'string',
          description: 'Optional category name to assign (e.g. Groceries, Restaurants)',
        },
        category_id: {
          type: 'string',
          description: 'Optional category UUID',
        },
        merchant: {
          type: 'string',
          description: 'Optional new merchant or place of purchase',
        },
        description: {
          type: 'string',
          description: 'Optional new description or note',
        },
        date: {
          type: 'string',
          description: 'Optional new date in YYYY-MM-DD format',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_expenses',
    description: 'Retrieve recent user expenses with category info and pagination',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of expenses to fetch (default 20, max 100)',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default 1)',
        },
      },
    },
  },
  {
    name: 'list_categories',
    description: 'Retrieve list of active spending categories for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function executeMcpTool(userId: string, name: string, args: Record<string, any> = {}) {
  if (name === 'add_expense') {
    const amount = Number(args.amount);
    const currency = String(args.currency || '').toUpperCase();

    if (!amount || amount <= 0) {
      throw new Error('Valid positive amount is required');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Valid 3-letter currency code is required (e.g. EUR, USD, UAH)');
    }

    let categoryId = args.category_id || null;
    if (!categoryId && args.category_name) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', String(args.category_name).trim())
        .limit(1)
        .maybeSingle();

      if (cat) {
        categoryId = cat.id;
      }
    }

    const expense = await createExpenseRecordAdmin(userId, {
      amount,
      currency,
      category_id: categoryId,
      merchant: args.merchant ? String(args.merchant).trim() : null,
      description: args.description ? String(args.description).trim() : null,
      date: args.date || undefined,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Expense logged successfully! ID: ${expense.id}, Amount: ${expense.amount} ${expense.currency}${expense.merchant ? ` at ${expense.merchant}` : ''}`,
        },
      ],
    };
  }

  if (name === 'update_expense') {
    const expenseId = String(args.id || '').trim();
    if (!expenseId) {
      throw new Error('Expense ID is required to update');
    }

    let categoryId = args.category_id !== undefined ? args.category_id : undefined;
    if (categoryId === undefined && args.category_name) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', String(args.category_name).trim())
        .limit(1)
        .maybeSingle();

      if (cat) {
        categoryId = cat.id;
      }
    }

    const payload: Record<string, any> = {};
    if (args.amount !== undefined) payload.amount = Number(args.amount);
    if (args.currency !== undefined) payload.currency = String(args.currency).toUpperCase();
    if (categoryId !== undefined) payload.category_id = categoryId;
    if (args.merchant !== undefined) payload.merchant = args.merchant ? String(args.merchant).trim() : null;
    if (args.description !== undefined) payload.description = args.description ? String(args.description).trim() : null;
    if (args.date !== undefined) payload.date = String(args.date);

    const updated = await updateExpenseRecord(supabaseAdmin, userId, expenseId, payload);

    return {
      content: [
        {
          type: 'text',
          text: `Expense updated successfully! ID: ${updated.id}, Amount: ${updated.amount} ${updated.currency}${updated.merchant ? ` at ${updated.merchant}` : ''}`,
        },
      ],
    };
  }

  if (name === 'list_expenses') {
    const limitNum = Math.min(Math.max(parseInt(args.limit, 10) || 20, 1), 100);
    const pageNum = Math.max(parseInt(args.page, 10) || 1, 1);
    const fromIndex = (pageNum - 1) * limitNum;
    const toIndex = fromIndex + limitNum - 1;

    const { data, count, error } = await supabaseAdmin
      .from('expenses')
      .select('*, category:categories(id, name, icon, color)', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              expenses: data || [],
              metadata: {
                total: count || 0,
                page: pageNum,
                limit: limitNum,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (name === 'list_categories') {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, icon, color, is_active')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data || [], null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

export function createMcpServerForUser(userId: string) {
  const server = new Server(
    {
      name: 'swiftspend-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS_DEFINITIONS,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      return await executeMcpTool(userId, name, args || {});
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error executing ${name}: ${err?.message || 'Unknown error'}`,
          },
        ],
      };
    }
  });

  return server;
}

export async function handleDirectJsonRpc(userId: string, body: any): Promise<any> {
  const { jsonrpc, id, method, params } = body || {};
  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
    };
  }

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'swiftspend-mcp', version: '1.0.0' },
      },
    };
  }

  if (method === 'notifications/initialized' || method === 'ping') {
    return id !== undefined ? { jsonrpc: '2.0', id, result: {} } : null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: MCP_TOOLS_DEFINITIONS,
      },
    };
  }

  if (method === 'tools/call') {
    try {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const result = await executeMcpTool(userId, toolName, toolArgs);
      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${err?.message || 'Internal error'}`,
            },
          ],
        },
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}
