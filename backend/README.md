# Arkan Auto Parts - Backend

## Project Structure (MVC Architecture)

```
src/
├── config/           # Configuration files
│   ├── db.ts         # Database initialization, migrations, seed data
│   └── env.ts        # Environment variables loader
├── controllers/      # Request/Response handlers
│   ├── auth.controller.ts
│   ├── customer.controller.ts
│   ├── financial.controller.ts
│   ├── invoice.controller.ts
│   ├── products.controller.ts
│   ├── settings.controller.ts
│   └── supplier.controller.ts
├── middlewares/      # Express middleware
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/           # Route definitions
│   ├── index.ts      # Route aggregator
│   ├── auth.routes.ts
│   ├── customer.routes.ts
│   ├── financial.routes.ts
│   ├── invoice.routes.ts
│   ├── products.routes.ts
│   ├── settings.routes.ts
│   └── supplier.routes.ts
├── services/         # Business logic (layered under controllers)
│   ├── auth.service.ts
│   ├── customer.service.ts
│   ├── financial.service.ts
│   ├── invoice.service.ts
│   ├── products.service.ts
│   ├── settings.service.ts
│   └── supplier.service.ts
├── utils/            # Utility functions
│   └── logger.ts
└── server.ts         # Application entry point
```

## API Endpoints

| Prefix                            | Endpoints                                                                                                                                                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth`                       | POST /login, GET/POST/PUT/DELETE /users                                                                                                                                                                                             |
| `/api/parts`                      | GET/POST /parts, GET/PUT/DELETE /parts/:id, PUT /parts/:id/price                                                                                                                                                                    |
| `/api/parts/inventory`            | POST /add-quantity, POST /audit, POST /stock-entry, POST /import, GET /movements                                                                                                                                                    |
| `/api/parts/brands`               | GET/POST /brands                                                                                                                                                                                                                    |
| `/api/parts/models`               | GET/POST /models                                                                                                                                                                                                                    |
| `/api/parts/categories`           | GET/POST/DELETE /categories                                                                                                                                                                                                         |
| `/api/parts/year-ranges`          | GET /year-ranges                                                                                                                                                                                                                    |
| `/api/customers`                  | GET/POST /customers, GET/PUT/DELETE /customers/:id, GET /customers/:id/invoices, GET /customers/:id/payments, GET /customers/:id/statement                                                                                          |
| `/api/invoices`                   | GET/POST /invoices, GET/DELETE /invoices/:id                                                                                                                                                                                        |
| `/api/suppliers`                  | GET/POST /suppliers, GET/DELETE /suppliers/:id                                                                                                                                                                                      |
| `/api/suppliers/purchase-orders`  | GET/POST /purchase-orders, GET/POST /purchase-orders/:id/receive                                                                                                                                                                    |
| `/api/suppliers/purchase-returns` | GET/POST /purchase-returns                                                                                                                                                                                                          |
| `/api/suppliers/payments`         | GET/POST /supplier-payments                                                                                                                                                                                                         |
| `/api/financial`                  | GET /cashbox/balance, GET/POST /cashbox/movements, GET/POST /bank-accounts, GET /financial-center/summary                                                                                                                           |
| `/api/financial/reports`          | GET /dashboard, GET /sales-details, GET /profit-details, GET /inventory-details, GET /sales, GET /low-stock, GET /daily-summary, GET /sales-range, GET /top-selling, GET /customer-debts, GET /supplier-debts, GET /recent-activity |
| `/api/settings`                   | GET/POST /settings                                                                                                                                                                                                                  |

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default        | Description        |
| -------- | -------------- | ------------------ |
| PORT     | 5000           | Server port        |
| NODE_ENV | development    | Environment mode   |
| DB_PATH  | arkan_parts.db | Database file path |

## Database

- **Type**: SQLite (better-sqlite3)
- **File**: `arkan_parts.db`
- **Auto-migrations**: Tables and seed data created on first run
