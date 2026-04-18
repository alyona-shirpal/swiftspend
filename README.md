# SwiftSpend Monorepo

SwiftSpend is a minimal, fast, and feature-rich personal expense tracker. The project is organized as a monorepo using Turborepo and pnpm workspaces, splitting the stack cleanly between a Node.js backend, React frontend, and a shared types package.

## Monorepo Structure

```text
swiftspend/
├── apps/
│   ├── api/                  → Node.js + Express backend (TypeScript)
│   └── web/                  → React 18 frontend (TypeScript + Vite + Tailwind)
├── packages/
│   └── types/                → Shared TypeScript types and enums used by both apps
├── supabase/
│   ├── migrations/           → SQL migration files
│   └── config.toml           → Supabase CLI config
├── .env.example              → Root-level env reference
├── package.json              → Root package.json
└── turbo.json                → Turborepo pipeline config
```

## Prerequisites

- Node.js 20+
- pnpm 8+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Turborepo CLI (optional but recommended: `npm install -g turbo`)

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in the required values in `.env`.

3. **Start Supabase locally**
   ```bash
   cd supabase
   supabase start
   cd ..
   ```

4. **Run development servers**
   Start both the frontend and backend simultaneously:
   ```bash
   pnpm dev
   ```
   - API will be accessible at: `http://localhost:3000`
   - Frontend will run on Vite's default port, usually `http://localhost:5173`

## Shared Types Package

The `@swiftspend/types` package centralizes common enums and TypeScript types.
If you update this package, both `apps/api` and `apps/web` can import the changes directly via `workspace:*` dependencies. 

## Documentation
- [Backend Development (apps/api)](apps/api/README.md)
- [Frontend Development (apps/web)](apps/web/README.md)
- [Database Management (supabase)](supabase/README.md)
