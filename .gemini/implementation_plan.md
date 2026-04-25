# Implement Dashboard Screen

This plan details the implementation of the SwiftSpend Dashboard based on the provided HTML design and requirements.

## Overview
We will implement a pixel-perfect React representation of the Dashboard design. The screen includes a Monthly Summary Hero, a Recent Spend list, and an Instant Logging form. We'll also wire up the necessary backend endpoints in the `api` app and data fetching hooks in the `web` app.

## Proposed Changes

### 1. Database Migrations
- **Skip**: The `expenses` table already exists in `20260417215800_init_schema.sql`. As per instructions, we will skip creating a new migration and use the existing schema (which uses `created_at` for time sorting).

### 2. Backend (apps/api)
- **`src/services/exchangeRate.ts`**: Update the service to match the requested caching logic and `convertToAll` method signature.
- **`src/controllers/expenses.ts`**:
  - Update `createExpense` (POST `/expenses`) to set `date` server-side, validate with Zod, get converted amounts, and insert.
  - Implement `getRecentExpenses` (GET `/expenses/recent`) to fetch the top 10 expenses with joined category data.
  - Implement `getMonthlyTotal` (GET `/expenses/monthly-total`) to compute sums for the current/requested month and calculate the percentage change vs the previous month.
- **`src/controllers/categories.ts`**:
  - Implement `getRecentCategories` (GET `/categories/recent`) to return the 4 most recently used categories based on expense history.
- **`src/routes/...`**: Expose the new controller methods on their respective Express routers.

### 3. Frontend Utilities & Types
- **`apps/web/src/utils/formatCurrency.ts`**: Create a helper to format currencies consistently (e.g., `€18.40`).
- **`apps/web/src/types/api.ts`**: Define Zod schemas and TypeScript interfaces for the new API response shapes.

### 4. Frontend Data Hooks
- **`useMonthlyTotal.ts`**: Fetch monthly totals (staleTime 5m).
- **`useRecentExpenses.ts`**: Fetch recent 10 expenses (staleTime 1m).
- **`useRecentCategories.ts`**: Fetch recent 4 categories (staleTime 10m).
- **`useAddExpense.ts`**: Mutation to add an expense and invalidate caches.
- **`useExchangeRates.ts`**: Fetch latest exchange rates for the live preview (staleTime 55m).

### 5. Frontend Components (apps/web/src/components/dashboard/)
- **`MonthlyHero.tsx`**: Displays the monthly total and trend. Includes loading skeletons.
- **`InstantLogging.tsx`**: Form with currency selector, debounced exchange rate preview, category pill scroller, description input, and submit button. Uses local state and Zod validation.
- **`CategoryPill.tsx`**: Reusable pill for the category scroller.
- **`RecentSpend.tsx`**: Renders the list of `ExpenseRow` items. Includes loading and empty states.
- **`ExpenseRow.tsx`**: Individual transaction display matching the "Clean Sweep" rule without dividers.

### 6. Frontend Pages
- **`apps/web/src/pages/dashboard/DashboardPage.tsx`**: Assembles the components into the main grid layout and includes the mocked Bottom Navigation.
- **`apps/web/tailwind.config.js`**: Verify/Update Tailwind tokens based on the HTML design's configuration to ensure strict adherence to the "Financial Architect" and "Digital Ledger" aesthetic.

## User Review Required
> [!IMPORTANT]
> The design specifies an `Instant Logging` form with a currency dropdown, but the existing `expenses` table schema in `init_schema.sql` doesn't have a `time` column (it uses `created_at` which is effectively the same). I will use `created_at` for sorting recent expenses. Does this sound correct?

> [!NOTE]
> The "View All" and Bottom Navigation buttons will be mocked for now, as requested.

## Verification Plan
1. Start the API and Web dev servers.
2. Verify the Dashboard UI matches the HTML design precisely (colors, fonts, layout, asymmetry, etc.).
3. Test adding an expense through the Instant Logging form:
   - Check debounced live preview of exchange rates.
   - Verify category selection works.
   - Add expense and verify success toast.
   - Ensure Monthly Hero and Recent Spend automatically refresh without a page reload.
4. Verify edge cases (empty states, loading skeletons).
