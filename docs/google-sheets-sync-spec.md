# Google Sheets Sync — Specification (SYNC_SPEC_V1)

## Overview
One-way sync from SwiftSpend → Google Sheets. The spreadsheet is owned by the user. SwiftSpend only manages sheets named `YYYY-MM` and the `Summary` sheet. All other sheets are left untouched.

## Architecture
- Backend-driven: all Sheets API calls happen server-side
- Frontend triggers sync and polls status
- OAuth tokens stored in `user_integrations` Supabase table (RLS protected)

## Spreadsheet Structure

### Sheet naming
- Monthly sheets: `YYYY-MM` (e.g. `2026-10`)
- Summary sheet: `Summary` (always first)
- Only sheets matching `/^\d{4}-\d{2}$/` are managed

### Column layout (SYNC_SPEC_V1)
| Column | Field | Notes |
|--------|-------|-------|
| A | expense_id | Hidden. Used for idempotent row diff |
| B | Date | YYYY-MM-DD |
| C | Merchant | |
| D | Category | |
| E | Amount | Original amount |
| F | Currency | ISO code |
| G | {DefaultCurrency} | Formula: `=IF(F{row}="{def}",E{row},E{row}*{rate})` |
| H | Note | expense description |

### Formula rows
- Row `lastDataRow + 2`: `=SUBTOTAL(9, E2:E{last})` and `=SUBTOTAL(9, G2:G{last})`
- Row `lastDataRow + 4+N`: `=SUMIF(D$2:D${last}, "{category}", G$2:G${last})` for each category

### Charts (per month sheet)
1. **Pie chart** — Category breakdown: domain=D col, series=G col
2. **Column chart** — Daily trend: domain=B col, series=G col
3. **Line chart** — Monthly progression: data from Summary sheet

### Sync algorithm
1. Read column A (IDs) from existing sheet
2. Compute: toAdd, toUpdate, toDelete sets
3. Batch update changed rows, append new rows, delete removed rows (bottom-up)
4. Rewrite formula rows
5. Delete and recreate charts

## Database
Table: `user_integrations`
- `provider = 'google_sheets'`
- `spreadsheet_id`: Google Sheet ID
- `refresh_token`: long-lived token
- `sync_status`: 'idle' | 'syncing' | 'error'
- `last_synced_at`: timestamp of last successful sync

## Auto-sync
Fire-and-forget triggered on expense create/update/delete.
Only the affected month is re-synced for incremental updates.

## Initial sync
Last 12 calendar months from the connect date.

## Google Cloud Setup
1. Create Google Cloud project
2. Enable Google Sheets API and Google Drive API
3. Create OAuth 2.0 Web Application credentials
4. Add authorized redirect URI: `{VITE_API_BASE_URL}/auth/google/callback`
5. Set env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (backend)
6. Set env vars: `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_REDIRECT_URI` (frontend)

## Changelog
- SYNC_SPEC_V1 (2026-10): Initial implementation
