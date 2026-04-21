# Express API for Lotificadora App

This backend exposes SQL Server stored procedures, views and table-based functions for the Lotificadora front-end.

## Setup

1. Copy `.env.example` to `.env`.
2. Set your SQL Server credentials and database name.
3. Install dependencies:
   ```bash
   npm install
   ```

## Run

```bash
npm run serve:api
```

The API will start on `http://localhost:3001` by default.

## Available API patterns

- `/api/proyectos`
- `/api/etapas`
- `/api/bloques`
- `/api/lotes`
- `/api/clientes`
- `/api/ventas`
- `/api/pagos`
- `/api/cuentas`
- `/api/reportes`

The endpoints map to the stored procedures and views referenced by the front-end service layer in `services/api.js`.
