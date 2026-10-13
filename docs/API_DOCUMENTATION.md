# SwiftSpend Public REST API Documentation

The SwiftSpend REST API allows developers and third-party services to securely manage expenses and categories using API Keys.

## Authentication

Authentication is performed using API Keys generated in the SwiftSpend Settings page.

You can provide your API key in requests using either:
1. **Header**: `X-API-Key: sk_live_your_secret_key`
2. **Bearer Token**: `Authorization: Bearer sk_live_your_secret_key`

---

## Interactive Docs & OpenAPI Schema

When running the API server locally or on Vercel:
- **Interactive Swagger UI**: `https://your-api-domain.com/docs` or `https://your-api-domain.com/api/v1/docs`
- **OpenAPI 3.0 Spec**: `https://your-api-domain.com/api/v1/openapi.json`

---

## Endpoints

### 1. Create Expense

`POST /api/v1/expenses`

#### Request Body
```json
{
  "amount": 42.50,
  "currency": "EUR",
  "category_name": "Groceries",
  "merchant": "Supermarket",
  "description": "Weekly grocery run",
  "date": "2026-10-10"
}
```

- `amount` *(number, required)*: Positive amount spent.
- `currency` *(string, required)*: 3-letter currency code (e.g. `EUR`, `USD`, `UAH`).
- `category_id` *(string, optional)*: UUID of category.
- `category_name` *(string, optional)*: Name of category (case-insensitive match if `category_id` is omitted).
- `merchant` *(string, optional)*: Merchant / store name.
- `description` *(string, optional)*: Expense note/description.
- `date` *(string, optional)*: `YYYY-MM-DD` date (defaults to today).

#### Response (`201 Created`)
```json
{
  "id": "7f8c9b20-1a2b-4c5d-9e8f-123456789abc",
  "user_id": "...",
  "amount": 42.5,
  "currency": "EUR",
  "date": "2026-10-10",
  "created_at": "2026-10-10T16:30:00.000Z"
}
```

---

### 2. List Expenses

`GET /api/v1/expenses`

#### Query Parameters
- `limit` *(number, default 20, max 100)*: Items per page.
- `page` *(number, default 1)*: Page number.

#### Response (`200 OK`)
```json
{
  "data": [ ... ],
  "metadata": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

---

### 3. List Active Categories

`GET /api/v1/categories`

#### Response (`200 OK`)
```json
{
  "categories": [
    {
      "id": "...",
      "name": "Groceries",
      "icon": "shopping_cart",
      "color": "#4CAF50"
    }
  ]
}
```
