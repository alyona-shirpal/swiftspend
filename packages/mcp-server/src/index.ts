#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.SWIFTSPEND_API_URL || 'https://swiftspend-api.vercel.app';
const API_KEY = process.env.SWIFTSPEND_API_KEY;

if (!API_KEY) {
  console.error('Error: SWIFTSPEND_API_KEY environment variable is required.');
  process.exit(1);
}

const apiClient = axios.create({
  baseURL: `${API_URL.replace(/\/$/, '')}/api/v1`,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

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

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'add_expense',
        description: 'Post/log a new expense in SwiftSpend',
        inputSchema: {
          type: 'object',
          properties: {
            amount: {
              type: 'number',
              description: 'Expense amount (must be positive)',
            },
            currency: {
              type: 'string',
              description: '3-letter currency code (e.g. EUR, USD, UAH)',
            },
            category_name: {
              type: 'string',
              description: 'Optional category name (e.g. Groceries, Restaurants)',
            },
            merchant: {
              type: 'string',
              description: 'Optional merchant or place of purchase',
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
        description: 'Edit or update an existing expense entry in SwiftSpend',
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
        description: 'Get list of recent expenses',
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
        description: 'Get list of active spending categories',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'add_expense') {
      const response = await apiClient.post('/expenses', args);
      return {
        content: [
          {
            type: 'text',
            text: `Expense logged successfully! ID: ${response.data.id}, Amount: ${response.data.amount} ${response.data.currency}`,
          },
        ],
      };
    }

    if (name === 'update_expense') {
      const { id, ...updateData } = args as { id: string; [key: string]: any };
      if (!id) {
        throw new Error('Expense ID is required to update');
      }
      const response = await apiClient.patch(`/expenses/${id}`, updateData);
      return {
        content: [
          {
            type: 'text',
            text: `Expense updated successfully! ID: ${response.data.id}, Amount: ${response.data.amount} ${response.data.currency}`,
          },
        ],
      };
    }

    if (name === 'list_expenses') {
      const response = await apiClient.get('/expenses', { params: args });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    if (name === 'list_categories') {
      const response = await apiClient.get('/categories');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMsg}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SwiftSpend MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in MCP Server:', error);
  process.exit(1);
});
