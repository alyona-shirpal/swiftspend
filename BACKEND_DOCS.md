# SwiftSpend Backend Documentation

Welcome to the backend documentation for the SwiftSpend personal expense tracker! This document provides all the necessary details to understand, run, and extend the Express.js API.

---

## 1. Project Setup and Environment Variables

The backend API is located in `apps/api`. First, install dependencies and set up the `.env` file.

### Installation
From the root of the monorepo:
```bash
pnpm install
pnpm --filter api run build
```

### Environment Variables
Copy `.env.example` to `.env` inside `apps/api` and update the values:

```env
PORT=3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EXCHANGE_RATE_API_KEY=your_api_key_here
```
> [!IMPORTANT]
> The `SUPABASE_SERVICE_ROLE_KEY` is crucial for backend operations like caching the exchange rate, bypassing Row Level Security. Never expose this key in the frontend.

---

## 2. Supabase Migrations

The database schema and policies are defined using Supabase SQL migrations located in `supabase/migrations`.

### How to run migrations
Ensure the Supabase CLI is installed.
To start a new local Postgres database and apply migrations:
```bash
supabase start
```
To apply them to a remote database if linked:
```bash
supabase db push
```

### How to write new migrations
To generate a new empty migration file:
```bash
supabase migration new <my_feature_name>
```
Then, write your pure SQL schema changes (and any RLS policies!) in the newly created file inside `supabase/migrations`.

---

## 3. Regenerating Supabase TypeScript Types

As the schema changes, ensure TypeScript types remain in sync.

Run the Supabase CLI generator command:
```bash
supabase gen types typescript --local > packages/types/src/database.types.ts
```
*(Or point to your remote `--project-id "your-id"` instead of `--local`)*.

---

## 4. Currency Conversion Flow

1. **User Submits**: `POST /expenses` with amount and chosen `currency`.
2. **Fetch Rates**: Backend calls `ExchangeRateService.getCachedRates()`.
3. **Cache Check**: Cache TTL is 1 hour. If it's stale, backend fetches from OpenExchangeRates API and `.insert()` into the cache.
4. **Convert**: Math calculates values for UAH, ALL, EUR, and USD simultaneously.
5. **Store**: Inserted expense row contains all four calculated `amount_*` columns plus the exact JSON cache snapshot.

```text
                  +---------------------+
 [Client] ------> | POST /expenses      | -------> [Supabase expenses]
                  +---------------------+                 ^ (inserts computed amounts)
                           |                              |
                           v                              |
                  [ExchangeRateService] ------------------+
                           |
                     (Cache stale?) 
                           v
                  [OpenExchangeRates API] ---> [Supabase exchange_rate_cache]
```

---

## 5. Adding a New Endpoint (Step-by-Step)

Here's an example of how to introduce `GET /users/me`:

1. **Add Route File**: Create `src/routes/users.ts`.
   ```ts
   import { Router } from 'express';
   import { getMe } from '../controllers/users';
   import { requireAuth } from '../middleware/auth';
   const router = Router();
   router.use(requireAuth);
   router.get('/me', getMe);
   export default router;
   ```
2. **Add Controller**: Create `src/controllers/users.ts`. Validate input via Zod.
   ```ts
   export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
       res.json(req.user);
   }
   ```
3. **Register Route**: Inside `src/index.ts`.
   ```ts
   import usersRoutes from './routes/users';
   app.use('/users', usersRoutes);
   ```

---

## 6. Exchange Rate Caching and TTL

The `ExchangeRateService` queries `exchange_rate_cache` using `supabaseAdmin`. 
By default, the TTL is defined as:
```ts
private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
```
If the difference between `now()` and `fetched_at` exceeds this TTL, a new `axios.get` goes to the external provider.
To change the TTL, simple modify the millisecond integer in `src/services/exchangeRate.ts`.

---

## 7. Row Level Security (RLS) Policy Patterns

All tables strictly enforce data ownership at the database layer.

> [!CAUTION]
> The Express API does **not** rely solely on application middleware, making Supabase safe directly from edge networks.

Standard policy applied directly in Postgres:
```sql
CREATE POLICY "Users can view their own expenses" 
    ON public.expenses FOR SELECT 
    USING (auth.uid() = user_id);
```
During queries like `supabase.from('expenses').select()`, missing the backend `.eq('user_id', req.user.id)` natively acts as defense-in-depth, but is best practice for clarity.
