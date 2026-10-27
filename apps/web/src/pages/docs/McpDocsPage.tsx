import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const McpDocsPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    toast.success('Copied to clipboard!');
    setTimeout(() => {
      setCopiedSection((curr) => (curr === sectionId ? null : curr));
    }, 2000);
  };

  const mcpConfigSnippet = `{
  "mcpServers": {
    "swiftspend": {
      "command": "node",
      "args": [
        "/path/to/swiftspend/packages/mcp-server/dist/index.js"
      ],
      "env": {
        "SWIFTSPEND_API_KEY": "sk_live_your_secret_api_key"
      }
    }
  }
}`;

  const curlExpenseSnippet = `curl -X POST https://swiftspend-api.vercel.app/api/v1/expenses \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_your_key_here" \\
  -d '{
    "amount": 14.50,
    "currency": "EUR",
    "category_name": "Groceries",
    "merchant": "Trader Joe's",
    "description": "Weekly essentials",
    "date": "2026-10-27"
  }'`;

  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-outline-variant/10 bg-surface/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-105 transition-transform">
                account_balance_wallet
              </span>
              <span className="font-display font-bold text-lg tracking-tight">SwiftSpend</span>
            </Link>
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
              MCP Docs
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="text-xs font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">key</span>
              <span>Get API Key</span>
            </Link>
            <Link
              to="/"
              className="px-3.5 py-1.5 bg-primary text-on-primary font-body text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Go to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Protocol Specification v1.0
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-primary">
            SwiftSpend MCP Server
          </h1>
          <p className="font-body text-base sm:text-lg text-secondary max-w-3xl leading-relaxed">
            Connect AI assistants (Claude Desktop, Cursor, Antigravity, VS Code, and more) directly to your SwiftSpend budget.
            Log expenses naturally with AI, query past spend history, and verify active categories.
          </p>
        </div>

        {/* Quick Steps Card */}
        <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">rocket_launch</span>
            Quick Setup (3 Steps)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-semibold text-sm text-primary">Generate API Key</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Open <Link to="/settings" className="text-primary underline font-medium">Settings &rarr; API Keys</Link> in SwiftSpend and generate an API key (`sk_live_...`).
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-semibold text-sm text-primary">Build MCP Server</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Clone the repository and run:
              </p>
              <code className="block bg-surface-container-high px-2 py-1 rounded text-[11px] font-mono text-primary break-all">
                pnpm --filter @swiftspend/mcp-server build
              </code>
            </div>

            <div className="space-y-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-semibold text-sm text-primary">Configure Client</h3>
              <p className="text-xs text-secondary leading-relaxed">
                Add the server configuration to your MCP client config file (e.g. `mcp.json` or Claude Desktop configuration).
              </p>
            </div>
          </div>
        </section>

        {/* Configuration Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-2xl text-primary">Client Configuration</h2>
              <p className="font-body text-xs sm:text-sm text-secondary">
                Add this block to your <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-xs font-mono">mcp.json</code> or Claude Desktop config.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(mcpConfigSnippet, 'mcp-config')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-semibold text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {copiedSection === 'mcp-config' ? 'check' : 'content_copy'}
              </span>
              <span>{copiedSection === 'mcp-config' ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="relative bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
            <pre className="p-4 sm:p-6 overflow-x-auto text-xs sm:text-sm font-mono text-primary leading-relaxed">
              <code>{mcpConfigSnippet}</code>
            </pre>
          </div>

          {/* Environment Variables Table */}
          <div className="mt-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-surface-container-low text-secondary border-b border-outline-variant/10">
                <tr>
                  <th className="p-3 sm:p-4 font-semibold">Environment Variable</th>
                  <th className="p-3 sm:p-4 font-semibold">Required</th>
                  <th className="p-3 sm:p-4 font-semibold">Description</th>
                  <th className="p-3 sm:p-4 font-semibold">Default / Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                <tr>
                  <td className="p-3 sm:p-4 font-mono font-semibold text-primary">SWIFTSPEND_API_KEY</td>
                  <td className="p-3 sm:p-4 text-xs font-bold text-primary">Yes</td>
                  <td className="p-3 sm:p-4 text-secondary">Your secret API key created in Settings</td>
                  <td className="p-3 sm:p-4 font-mono text-on-surface-variant text-xs">sk_live_...</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-mono font-semibold text-primary">SWIFTSPEND_API_URL</td>
                  <td className="p-3 sm:p-4 text-xs font-semibold text-secondary">No (optional)</td>
                  <td className="p-3 sm:p-4 text-secondary">Base URL of your SwiftSpend deployment</td>
                  <td className="p-3 sm:p-4 font-mono text-on-surface-variant text-xs">Defaults to https://swiftspend-api.vercel.app</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* MCP Tools Section */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-primary">Available MCP Tools</h2>
            <p className="font-body text-xs sm:text-sm text-secondary">
              The tools exposed to your AI assistant over the Model Context Protocol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tool 1 */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-primary">add_expense</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                    Write
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Creates and categorizes a new transaction in SwiftSpend.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-outline-variant/10">
                  <p className="text-[11px] font-semibold text-primary">Parameters:</p>
                  <ul className="text-xs font-mono text-secondary space-y-1">
                    <li><span className="text-primary font-semibold">amount</span>: number <span className="text-red-500">*</span></li>
                    <li><span className="text-primary font-semibold">currency</span>: string <span className="text-red-500">*</span></li>
                    <li><span className="text-primary">category_name</span>?: string</li>
                    <li><span className="text-primary">merchant</span>?: string</li>
                    <li><span className="text-primary">description</span>?: string</li>
                    <li><span className="text-primary">date</span>?: YYYY-MM-DD</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tool 2 */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-primary">list_expenses</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                    Read
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Fetches recent expense transactions with pagination.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-outline-variant/10">
                  <p className="text-[11px] font-semibold text-primary">Parameters:</p>
                  <ul className="text-xs font-mono text-secondary space-y-1">
                    <li><span className="text-primary">limit</span>?: number (default 20, max 100)</li>
                    <li><span className="text-primary">page</span>?: number (default 1)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tool 3 */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-primary">list_categories</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md">
                    Read
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  Retrieves the user's active categories for accurate transaction matching.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-outline-variant/10">
                  <p className="text-[11px] font-semibold text-primary">Parameters:</p>
                  <p className="text-xs font-mono text-secondary">None</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REST API Endpoints Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-2xl text-primary">Direct Public REST API (v1)</h2>
              <p className="font-body text-xs sm:text-sm text-secondary">
                You can also interact directly with the REST endpoints via cURL or any HTTP client.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(curlExpenseSnippet, 'curl-expense')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-xs font-semibold text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                {copiedSection === 'curl-expense' ? 'check' : 'content_copy'}
              </span>
              <span>{copiedSection === 'curl-expense' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-outline-variant/10">
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded">
                    POST
                  </span>
                  <code className="font-mono text-sm font-semibold text-primary">/api/v1/expenses</code>
                </div>
                <span className="text-xs text-secondary">Create a new expense</span>
              </div>

              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded">
                    GET
                  </span>
                  <code className="font-mono text-sm font-semibold text-primary">/api/v1/expenses</code>
                </div>
                <span className="text-xs text-secondary">List user expenses (?limit=20&page=1)</span>
              </div>

              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded">
                    GET
                  </span>
                  <code className="font-mono text-sm font-semibold text-primary">/api/v1/categories</code>
                </div>
                <span className="text-xs text-secondary">List active categories</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm text-primary">Example cURL Request:</h3>
            <pre className="bg-surface-container-high p-4 rounded-xl overflow-x-auto text-xs font-mono text-primary leading-relaxed">
              <code>{curlExpenseSnippet}</code>
            </pre>
          </div>
        </section>

        {/* GitHub / Open Source reference */}
        <section className="bg-surface-container-low p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-primary">Source Code & Contribution</h3>
            <p className="font-body text-xs sm:text-sm text-secondary">
              Inspect the implementation of the MCP server or open an issue on GitHub.
            </p>
          </div>
          <a
            href="https://github.com/alyona-shirpal/swiftspend/tree/main/packages/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-xs font-semibold text-primary transition-colors shrink-0"
          >
            <span>View on GitHub</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/10 py-6 text-center text-xs text-secondary">
        SwiftSpend &copy; {new Date().getFullYear()} &bull; Public Model Context Protocol (MCP) Documentation
      </footer>
    </div>
  );
};

export default McpDocsPage;
