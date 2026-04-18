# Supabase Local Development

This folder contains the Supabase configuration and migrations for SwiftSpend.

## Getting Started

1. **Start Supabase locally**
   ```bash
   supabase start
   ```

2. **Create a new migration**
   ```bash
   supabase migration new <migration_name>
   ```
   This will create a new SQL file in `supabase/migrations/`.

3. **Apply migrations**
   Migrations are applied automatically on `start` or `db reset`. You can also run:
   ```bash
   supabase db push
   ```

4. **Generate TypeScript types**
   Regenerate the database types based on your schema:
   ```bash
   supabase gen types typescript --local > apps/api/src/types/database.types.ts
   ```
