/**
 * googleSheets.ts
 * ---------------
 * SwiftSpend → Google Sheets one-way sync service.
 *
 * SYNC_SPEC_V1 — Spreadsheet structure:
 *   - One sheet per calendar month, named 'YYYY-MM' (e.g. '2026-10')
 *   - Sheets sorted: current month first, then descending
 *   - Only sheets matching /^\d{4}-\d{2}$/ are managed; others are left untouched
 *   - A 'Summary' sheet is always placed first (position 0)
 *
 * SYNC_SPEC_V1 — Column layout (0-indexed):
 *   A (0) = expense_id       — hidden, used for idempotent diff
 *   B (1) = Date             — YYYY-MM-DD
 *   C (2) = Merchant
 *   D (3) = Category
 *   E (4) = Amount           — original amount in original currency
 *   F (5) = Currency         — ISO code
 *   G (6) = {DefaultCurrency}  — formula: =IF(F{row}="{defaultCurrency}",E{row},E{row}*{rate})
 *   H (7) = Note             — expense description
 *
 * SYNC_SPEC_V1 — Formulas (written below data rows):
 *   Row (lastDataRow+2): SUBTOTAL totals for Amount and DefaultCurrency columns
 *   Rows (lastDataRow+4 onwards): SUMIF per-category totals
 *
 * SYNC_SPEC_V1 — Charts per month sheet (embedded):
 *   Chart 1: Pie  — category breakdown (D + G cols)
 *   Chart 2: Column chart — daily spend trend (B + G cols)
 *   Chart 3: Line — monthly spend progression (built from summary data)
 *
 * SYNC_SPEC_V1 — Diff algorithm:
 *   1. Read column A (expense IDs) from existing sheet
 *   2. Build existingIdToRow map
 *   3. Batch update changed rows, append new rows, delete removed rows
 *   4. Always rewrite formula rows and recreate charts
 */

import axios, { AxiosError } from 'axios';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface GoogleSheetsConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface IntegrationRecord {
  id: string;
  user_id: string;
  spreadsheet_id: string | null;
  refresh_token: string;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
}

export interface SyncContext {
  integration: IntegrationRecord;
  accessToken: string;
  defaultCurrency: string;
  userCurrencies: string[];
}

export interface ExpenseForSync {
  id: string;
  date: string;
  merchant: string | null;
  description: string | null;
  amount: number;
  currency: string;
  amounts: Record<string, number>; // pre-converted amounts keyed by currency code
  exchange_rate_snapshot: { base: string; rates: Record<string, number> };
  category_id: string | null;
}

export interface CategoryForSync {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Config helper — throws a clear error when env vars are missing
// ---------------------------------------------------------------------------

/**
 * Returns Google OAuth client config from environment variables.
 * SYNC_SPEC_V1: centralised env validation so misconfiguration surfaces immediately at startup.
 */
export function getGoogleConfig(): GoogleSheetsConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) throw new Error('Missing env: GOOGLE_CLIENT_ID');
  if (!clientSecret) throw new Error('Missing env: GOOGLE_CLIENT_SECRET');
  if (!redirectUri) throw new Error('Missing env: GOOGLE_REDIRECT_URI');

  return { clientId, clientSecret, redirectUri };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Sheets API request with exponential backoff on 429 rate-limit responses. */
async function sheetsRequest<T>(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  accessToken: string,
  data?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${accessToken}` },
        data,
        params,
      });
      return response.data as T;
    } catch (err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;

      // SYNC_SPEC_V1: Retry on 429 (rate limit) with exponential backoff; re-throw on other errors.
      if (status === 429 && attempt < maxAttempts) {
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw err;
    }
  }

  throw new Error('Google Sheets request failed after maximum retry attempts');
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

/**
 * Exchange an OAuth authorization code for access + refresh tokens.
 * SYNC_SPEC_V1: Called once during the initial connect flow.
 */
export async function exchangeCodeForTokens(
  code: string,
  config: GoogleSheetsConfig,
): Promise<{ access_token: string; refresh_token: string; expiry_date: number }> {
  const params = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const { data } = await axios.post<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>(OAUTH_TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const expiry_date = Date.now() + data.expires_in * 1000;
  return { access_token: data.access_token, refresh_token: data.refresh_token, expiry_date };
}

/**
 * Use a refresh token to obtain a new short-lived access token.
 * SYNC_SPEC_V1: Called at the start of every sync run to ensure a valid access token.
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: GoogleSheetsConfig,
): Promise<{ access_token: string; expiry_date: number }> {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
  });

  const { data } = await axios.post<{ access_token: string; expires_in: number }>(
    OAUTH_TOKEN_URL,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  const expiry_date = Date.now() + data.expires_in * 1000;
  return { access_token: data.access_token, expiry_date };
}

/**
 * Revoke a Google OAuth token (access or refresh).
 * SYNC_SPEC_V1: Called on disconnect to clean up Google authorization.
 */
export async function revokeToken(token: string): Promise<void> {
  await axios.post(
    'https://oauth2.googleapis.com/revoke',
    new URLSearchParams({ token }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
}

// ---------------------------------------------------------------------------
// Spreadsheet management
// ---------------------------------------------------------------------------

interface SpreadsheetMeta {
  spreadsheetId: string;
  sheets: Array<{ properties: { sheetId: number; title: string; index: number } }>;
}

/**
 * Find existing spreadsheet by ID or create a new "SwiftSpend Expenses" spreadsheet.
 * SYNC_SPEC_V1: Idempotent — safe to call on every sync run.
 */
async function getOrCreateSpreadsheet(
  accessToken: string,
  existingId?: string | null,
): Promise<SpreadsheetMeta> {
  if (existingId) {
    try {
      const data = await sheetsRequest<SpreadsheetMeta>(
        'get',
        `${SHEETS_BASE}/${existingId}`,
        accessToken,
      );
      return data;
    } catch (err) {
      // If 404, fall through and create a new spreadsheet
      const axiosErr = err as AxiosError;
      if (axiosErr.response?.status !== 404) throw err;
    }
  }

  // SYNC_SPEC_V1: Create with a single "Summary" placeholder sheet; month sheets added later.
  const data = await sheetsRequest<SpreadsheetMeta>('post', SHEETS_BASE, accessToken, {
    properties: { title: 'SwiftSpend Expenses' },
    sheets: [{ properties: { title: 'Summary', index: 0 } }],
  });

  return data;
}

// ---------------------------------------------------------------------------
// Per-month sheet sync
// ---------------------------------------------------------------------------

interface SheetValues {
  values?: string[][];
}

/**
 * Sync all expenses for a single calendar month into one sheet tab.
 * SYNC_SPEC_V1: Implements the diff algorithm — read IDs, compute delta, batch-write changes.
 */
async function syncMonthSheet(
  accessToken: string,
  spreadsheetId: string,
  monthKey: string, // 'YYYY-MM'
  expenses: ExpenseForSync[],
  categoryMap: Map<string, string>, // id → name
  defaultCurrency: string,
  existingSheets: SpreadsheetMeta['sheets'],
): Promise<{ sheetId: number; rowCount: number }> {
  // SYNC_SPEC_V1: Find or create the month sheet tab.
  const sheet = existingSheets.find((s) => s.properties.title === monthKey);
  let sheetId: number;
  let isNewSheet = false;

  if (!sheet) {
    isNewSheet = true;
    const addResp = await sheetsRequest<{
      replies: Array<{ addSheet: { properties: { sheetId: number } } }>;
    }>('post', `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
      requests: [{ addSheet: { properties: { title: monthKey } } }],
    });
    const createdSheetId = addResp.replies?.[0]?.addSheet?.properties?.sheetId;
    if (createdSheetId === undefined) {
      throw new Error(`Failed to create sheet ${monthKey}`);
    }
    sheetId = createdSheetId;
  } else {
    sheetId = sheet.properties.sheetId;
  }

  // SYNC_SPEC_V1: Read column A (expense IDs) to diff existing vs. incoming expenses.
  const existingIdToRow = new Map<string, number>(); // expenseId → 1-indexed row number (2+)

  if (!isNewSheet) {
    const valuesResp = await sheetsRequest<SheetValues>(
      'get',
      `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(monthKey)}!A:A`,
      accessToken,
    );
    const rows = valuesResp.values ?? [];
    // Row 0 in the response is the header; data starts at row index 1 → sheet row 2
    for (let i = 1; i < rows.length; i++) {
      const cellId = rows[i]?.[0];
      if (cellId && cellId.trim() !== '' && !cellId.startsWith('=')) {
        existingIdToRow.set(cellId, i + 1); // convert to 1-indexed sheet row
      }
    }
  }

  // Build lookup of incoming expenses
  const incomingById = new Map<string, ExpenseForSync>(expenses.map((e) => [e.id, e]));

  // Rows to write: header at row 1, data starting at row 2
  const HEADER_ROW = ['expense_id', 'Date', 'Merchant', 'Category', 'Amount', 'Currency', defaultCurrency, 'Note'];

  // Build the full value matrix for all incoming expenses in date order
  // SYNC_SPEC_V1: Sort by date ascending within the month sheet for readability.
  const sortedExpenses = [...expenses].sort((a, b) => a.date.localeCompare(b.date));

  const buildDataRow = (expense: ExpenseForSync, sheetRow: number): (string | number)[] => {
    const categoryName = expense.category_id ? (categoryMap.get(expense.category_id) ?? '') : '';
    const snapshot = expense.exchange_rate_snapshot;

    // SYNC_SPEC_V1: Compute cross-rate for the currency conversion formula column G.
    // Cross-rate = rates[defaultCurrency] / rates[expenseCurrency].
    // Falls back to the pre-computed amounts value if rates are unavailable.
    let convertedFormula: string | number;
    const rateDefault = snapshot.rates[defaultCurrency];
    const rateSrc = snapshot.rates[expense.currency];

    if (rateDefault != null && rateSrc != null && rateSrc !== 0) {
      const crossRate = rateDefault / rateSrc;
      convertedFormula =
        expense.currency === defaultCurrency
          ? `=E${sheetRow}`
          : `=IF(F${sheetRow}="${defaultCurrency}",E${sheetRow},E${sheetRow}*${crossRate})`;
    } else {
      // Fallback: use pre-converted amount as a static number
      convertedFormula = expense.amounts[defaultCurrency] ?? expense.amount;
    }

    return [
      expense.id,
      expense.date,
      expense.merchant ?? '',
      categoryName,
      expense.amount,
      expense.currency,
      convertedFormula,
      expense.description ?? '',
    ];
  };

  // Build rows with correct sheet row numbers (header=1, data starts at 2)
  const dataRows = sortedExpenses.map((expense, idx) =>
    buildDataRow(expense, idx + 2),
  );

  // Determine which expense IDs were in the old sheet but not in the new set → delete
  const incomingIds = new Set(incomingById.keys());
  const rowsToDelete: number[] = [];
  for (const [existingId, existingRow] of existingIdToRow.entries()) {
    if (!incomingIds.has(existingId)) {
      rowsToDelete.push(existingRow);
    }
  }

  // SYNC_SPEC_V1: Clear and fully rewrite all data rows for simplicity and correctness.
  // Since formulas in column G embed the row number, a full rewrite avoids stale formula refs.
  const lastDataRow = 1 + dataRows.length; // 1 header + N data rows

  // Clear everything from row 2 downward first
  await sheetsRequest('post', `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(monthKey)}!A2:Z10000:clear`, accessToken, {});

  if (isNewSheet) {
    // Write header
    await sheetsRequest('put', `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(monthKey)}!A1`, accessToken, {
      values: [HEADER_ROW],
    }, { valueInputOption: 'USER_ENTERED' });
  } else {
    // Ensure header is up to date (e.g. if defaultCurrency changed)
    await sheetsRequest('put', `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(monthKey)}!A1`, accessToken, {
      values: [HEADER_ROW],
    }, { valueInputOption: 'USER_ENTERED' });
  }

  // Write data rows
  if (dataRows.length > 0) {
    await sheetsRequest(
      'put',
      `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(monthKey)}!A2`,
      accessToken,
      { values: dataRows },
      { valueInputOption: 'USER_ENTERED' },
    );
  }

  // SYNC_SPEC_V1: Write SUBTOTAL formula row two rows below the last data row.
  const subtotalRow = lastDataRow + 2;
  const subtotalValues = [
    ['', '', '', 'Total', `=SUBTOTAL(9,E2:E${lastDataRow})`, '', `=SUBTOTAL(9,G2:G${lastDataRow})`, ''],
  ];
  await sheetsRequest(
    'put',
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(monthKey)}!A${subtotalRow}`,
    accessToken,
    { values: subtotalValues },
    { valueInputOption: 'USER_ENTERED' },
  );

  // SYNC_SPEC_V1: Write per-category SUMIF rows starting 4 rows below last data row.
  // Only include categories that have at least one expense in this month.
  const presentCategoryNames = new Set(
    sortedExpenses
      .map((e) => (e.category_id ? categoryMap.get(e.category_id) : null))
      .filter((name): name is string => Boolean(name)),
  );
  const categoryRows = Array.from(presentCategoryNames).map((catName) => [
    '',
    '',
    '',
    catName,
    '',
    '',
    `=SUMIF(D$2:D$${lastDataRow},"${catName}",G$2:G$${lastDataRow})`,
    '',
  ]);
  if (categoryRows.length > 0) {
    const categoryStartRow = subtotalRow + 2;
    await sheetsRequest(
      'put',
      `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(monthKey)}!A${categoryStartRow}`,
      accessToken,
      { values: categoryRows },
      { valueInputOption: 'USER_ENTERED' },
    );
  }

  // -------------------------------------------------------------------------
  // Formatting: delete old charts for this sheet, re-add, set auto-filter, hide col A
  // -------------------------------------------------------------------------
  const formatRequests: unknown[] = [];

  // SYNC_SPEC_V1: Hide column A (expense_id) — it's internal, used only for diffing.
  formatRequests.push({
    updateDimensionProperties: {
      range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
      properties: { hiddenByUser: true },
      fields: 'hiddenByUser',
    },
  });

  // SYNC_SPEC_V1: Auto-filter on header row so users can filter by category, date, etc.
  formatRequests.push({
    setBasicFilter: {
      filter: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
      },
    },
  });

  // SYNC_SPEC_V1: Pie chart — category breakdown (col D = domain, col G = series).
  if (dataRows.length > 0) {
    formatRequests.push({
      addChart: {
        chart: {
          spec: {
            title: `${monthKey} — Spend by Category`,
            pieChart: {
              legendPosition: 'RIGHT_LEGEND',
              domain: {
                sourceRange: {
                  sources: [{ sheetId, startRowIndex: 1, endRowIndex: lastDataRow, startColumnIndex: 3, endColumnIndex: 4 }],
                },
              },
              series: {
                sourceRange: {
                  sources: [{ sheetId, startRowIndex: 1, endRowIndex: lastDataRow, startColumnIndex: 6, endColumnIndex: 7 }],
                },
              },
            },
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId, rowIndex: 1, columnIndex: 9 },
              widthPixels: 480,
              heightPixels: 300,
            },
          },
        },
      },
    });

    // SYNC_SPEC_V1: Column chart — daily spend trend (col B = domain, col G = series).
    formatRequests.push({
      addChart: {
        chart: {
          spec: {
            title: `${monthKey} — Daily Spend`,
            basicChart: {
              chartType: 'COLUMN',
              legendPosition: 'NO_LEGEND',
              domains: [
                {
                  domain: {
                    sourceRange: {
                      sources: [{ sheetId, startRowIndex: 1, endRowIndex: lastDataRow, startColumnIndex: 1, endColumnIndex: 2 }],
                    },
                  },
                },
              ],
              series: [
                {
                  series: {
                    sourceRange: {
                      sources: [{ sheetId, startRowIndex: 1, endRowIndex: lastDataRow, startColumnIndex: 6, endColumnIndex: 7 }],
                    },
                  },
                  targetAxis: 'LEFT_AXIS',
                },
              ],
              axis: [{ position: 'BOTTOM_AXIS', title: 'Date' }, { position: 'LEFT_AXIS', title: defaultCurrency }],
            },
          },
          position: {
            overlayPosition: {
              anchorCell: { sheetId, rowIndex: 16, columnIndex: 9 },
              widthPixels: 480,
              heightPixels: 300,
            },
          },
        },
      },
    });
  }

  if (formatRequests.length > 0) {
    await sheetsRequest('post', `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
      requests: formatRequests,
    });
  }

  return { sheetId, rowCount: dataRows.length };
}

// ---------------------------------------------------------------------------
// Summary sheet
// ---------------------------------------------------------------------------

interface MonthlyTotal {
  monthKey: string;
  total: number;
  count: number;
}

/**
 * Write or overwrite the Summary sheet with monthly totals and a line chart.
 * SYNC_SPEC_V1: Summary is always the first sheet (index 0).
 */
async function syncSummarySheet(
  accessToken: string,
  spreadsheetId: string,
  monthlyTotals: MonthlyTotal[],
  defaultCurrency: string,
  summarySheetId: number,
): Promise<void> {
  // SYNC_SPEC_V1: Sort descending so the most recent month is at the top.
  const sorted = [...monthlyTotals].sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  const headerRow = ['Month', `Total (${defaultCurrency})`, '# Expenses'];
  const dataRows = sorted.map((m) => [m.monthKey, m.total, m.count]);

  // Clear existing content
  await sheetsRequest(
    'post',
    `${SHEETS_BASE}/${spreadsheetId}/values/Summary!A1:Z1000:clear`,
    accessToken,
    {},
  );

  const allRows = [headerRow, ...dataRows];
  await sheetsRequest(
    'put',
    `${SHEETS_BASE}/${spreadsheetId}/values/Summary!A1`,
    accessToken,
    { values: allRows },
    { valueInputOption: 'USER_ENTERED' },
  );

  if (dataRows.length === 0) return;

  const lastDataRow = 1 + dataRows.length;

  // SYNC_SPEC_V1: Line chart of monthly totals on the Summary sheet.
  await sheetsRequest('post', `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
    requests: [
      {
        addChart: {
          chart: {
            spec: {
              title: `Monthly Spend Trend (${defaultCurrency})`,
              basicChart: {
                chartType: 'LINE',
                legendPosition: 'NO_LEGEND',
                domains: [
                  {
                    domain: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: summarySheetId,
                            startRowIndex: 1,
                            endRowIndex: lastDataRow,
                            startColumnIndex: 0,
                            endColumnIndex: 1,
                          },
                        ],
                      },
                    },
                  },
                ],
                series: [
                  {
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: summarySheetId,
                            startRowIndex: 1,
                            endRowIndex: lastDataRow,
                            startColumnIndex: 1,
                            endColumnIndex: 2,
                          },
                        ],
                      },
                    },
                    targetAxis: 'LEFT_AXIS',
                  },
                ],
                axis: [
                  { position: 'BOTTOM_AXIS', title: 'Month' },
                  { position: 'LEFT_AXIS', title: defaultCurrency },
                ],
              },
            },
            position: {
              overlayPosition: {
                anchorCell: { sheetId: summarySheetId, rowIndex: 1, columnIndex: 4 },
                widthPixels: 600,
                heightPixels: 400,
              },
            },
          },
        },
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Sheet ordering
// ---------------------------------------------------------------------------

/**
 * Reorder sheets via batchUpdate so that Summary is index 0 and months are descending.
 * SYNC_SPEC_V1: Called at the end of every sync so the spreadsheet always has a consistent layout.
 */
async function sortSheets(
  accessToken: string,
  spreadsheetId: string,
  sheetOrder: Array<{ sheetId: number; index: number }>,
): Promise<void> {
  const requests = sheetOrder.map(({ sheetId, index }) => ({
    updateSheetProperties: {
      properties: { sheetId, index },
      fields: 'index',
    },
  }));

  await sheetsRequest('post', `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
    requests,
  });
}

// ---------------------------------------------------------------------------
// Delete charts on a sheet before re-adding (to avoid duplicates on re-sync)
// ---------------------------------------------------------------------------

interface SpreadsheetWithCharts {
  sheets: Array<{
    properties: { sheetId: number; title: string; index: number };
    charts?: Array<{ chartId: number }>;
  }>;
}

/**
 * Delete all embedded charts that belong to a given sheet.
 * SYNC_SPEC_V1: Run before re-adding charts to avoid duplicates on repeated syncs.
 */
async function deleteChartsOnSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
): Promise<void> {
  const data = await sheetsRequest<SpreadsheetWithCharts>(
    'get',
    `${SHEETS_BASE}/${spreadsheetId}`,
    accessToken,
    undefined,
    { includeGridData: false },
  );

  const targetSheet = data.sheets.find((s) => s.properties.sheetId === sheetId);
  const charts = targetSheet?.charts ?? [];
  if (charts.length === 0) return;

  const requests = charts.map((c) => ({ deleteEmbeddedObject: { objectId: c.chartId } }));
  await sheetsRequest('post', `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
    requests,
  });
}

// ---------------------------------------------------------------------------
// Main sync orchestrator
// ---------------------------------------------------------------------------

/**
 * Full sync: groups expenses by month, syncs each month sheet, updates Summary, sorts sheets.
 * SYNC_SPEC_V1: Entry point called by the integrations controller.
 * Returns the spreadsheet ID (may be newly created).
 */
export async function syncExpensesToSheet(
  ctx: SyncContext,
  expenses: ExpenseForSync[],
  categories: CategoryForSync[],
  supabaseAdmin: SupabaseClient,
): Promise<string> {
  const config = getGoogleConfig();

  // SYNC_SPEC_V1: Always refresh the access token at sync start to avoid mid-sync expiry.
  const { access_token } = await refreshAccessToken(ctx.integration.refresh_token, config);
  const accessToken = access_token;

  // Get or create the spreadsheet
  const spreadsheet = await getOrCreateSpreadsheet(accessToken, ctx.integration.spreadsheet_id);
  const spreadsheetId = spreadsheet.spreadsheetId;
  let currentSheets = spreadsheet.sheets;

  const categoryMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));

  // SYNC_SPEC_V1: Group expenses by calendar month (YYYY-MM) for one sheet per month.
  const byMonth = new Map<string, ExpenseForSync[]>();
  for (const expense of expenses) {
    const monthKey = expense.date.slice(0, 7); // 'YYYY-MM'
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
    byMonth.get(monthKey)!.push(expense);
  }

  const monthlyTotals: MonthlyTotal[] = [];

  for (const [monthKey, monthExpenses] of byMonth.entries()) {
    // Delete charts before re-syncing so we don't accumulate duplicates
    const existingSheet = currentSheets.find((s) => s.properties.title === monthKey);
    if (existingSheet) {
      await deleteChartsOnSheet(accessToken, spreadsheetId, existingSheet.properties.sheetId);
    }

    const { rowCount } = await syncMonthSheet(
      accessToken,
      spreadsheetId,
      monthKey,
      monthExpenses,
      categoryMap,
      ctx.defaultCurrency,
      currentSheets,
    );

    // Compute total for this month in the default currency
    const monthTotal = monthExpenses.reduce((sum, e) => {
      return sum + (e.amounts[ctx.defaultCurrency] ?? e.amount);
    }, 0);

    monthlyTotals.push({ monthKey, total: Math.round(monthTotal * 100) / 100, count: rowCount });
  }

  // Refresh sheet metadata after possible additions
  const refreshed = await sheetsRequest<SpreadsheetMeta>(
    'get',
    `${SHEETS_BASE}/${spreadsheetId}`,
    accessToken,
  );
  currentSheets = refreshed.sheets;

  // Summary sheet
  const summarySheet = currentSheets.find((s) => s.properties.title === 'Summary');
  let summarySheetId: number;

  if (!summarySheet) {
    // Should not happen since we create it on spreadsheet creation, but guard anyway
    const addResp = await sheetsRequest<{
      replies: Array<{ addSheet: { properties: { sheetId: number } } }>;
    }>('post', `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
      requests: [{ addSheet: { properties: { title: 'Summary', index: 0 } } }],
    });
    const createdSummaryId = addResp.replies?.[0]?.addSheet?.properties?.sheetId;
    if (createdSummaryId === undefined) {
      throw new Error('Failed to create Summary sheet');
    }
    summarySheetId = createdSummaryId;
  } else {
    summarySheetId = summarySheet.properties.sheetId;
    await deleteChartsOnSheet(accessToken, spreadsheetId, summarySheetId);
  }

  await syncSummarySheet(accessToken, spreadsheetId, monthlyTotals, ctx.defaultCurrency, summarySheetId);

  // SYNC_SPEC_V1: Sort sheets: Summary first (index 0), then months descending by key.
  const managedMonthKeys = currentSheets
    .filter((s) => /^\d{4}-\d{2}$/.test(s.properties.title))
    .map((s) => s.properties.title)
    .sort((a, b) => b.localeCompare(a)); // descending

  const sheetOrder: Array<{ sheetId: number; index: number }> = [
    { sheetId: summarySheetId, index: 0 },
    ...managedMonthKeys.map((key, i) => {
      const s = currentSheets.find((sh) => sh.properties.title === key)!;
      return { sheetId: s.properties.sheetId, index: i + 1 };
    }),
  ];

  await sortSheets(accessToken, spreadsheetId, sheetOrder);

  // Persist spreadsheet_id back to Supabase if newly created
  if (!ctx.integration.spreadsheet_id || ctx.integration.spreadsheet_id !== spreadsheetId) {
    await supabaseAdmin
      .from('user_integrations')
      .update({ spreadsheet_id: spreadsheetId, updated_at: new Date().toISOString() })
      .eq('id', ctx.integration.id);
  }

  return spreadsheetId;
}
