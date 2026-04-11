"# Database Project

## 🚀 Quick Start

### Initialize Complete Database with Triggers
```bash
# From project root
npm run init:db
```

### 🔍 Verify Everything Works
```bash
# Quick verification
npm run verify:triggers
```

This will:
- ✅ Confirm all 22 triggers are active
- ✅ Test dashboard functions
- ✅ Check audit system
- ✅ Verify database connection

## 📊 Dashboard Functions

The system includes 5 scalar functions that provide real-time metrics for the main dashboard:

### Available Functions
- `fn_ContarProyectosActivos()` - Count active projects
- `fn_LotesDisponibles()` - Count available lots
- `fn_VentasMesActual()` - Count sales this month
- `fn_PagosPendientes()` - Count pending payments
- `fn_IngresosMesActual()` - Sum income this month

### API Endpoints
```
GET /api/dashboard/proyectos-activos
GET /api/dashboard/lotes-disponibles
GET /api/dashboard/ventas-mes-actual
GET /api/dashboard/pagos-pendientes
GET /api/dashboard/ingresos-mes-actual
```

## ⚡ Automatic Triggers

The system includes 22 automated triggers that maintain data integrity and execute business logic automatically:

### Lot Triggers (4)
- Update block areas when lots are inserted/deleted
- Prevent deletion of sold lots
- Audit all lot operations

### Sales Triggers (5)
- Automatically mark lots as "Sold" when sales are created
- Revert lot status if sales are cancelled
- Audit all critical sales changes
- Update lot status on sales

### Payment Triggers (4)
- Mark installments as "Paid" when payments are recorded
- Update sale balances and audit payment transactions
- Generate invoices automatically
- Update bank balances

### Client Triggers (2)
- Audit all client data modifications
- Prevent deactivating clients with active sales

### Additional Triggers (7)
- Credit validation, expense tracking, payment plan updates, etc.

## 📁 Project Structure

### Database Layer
- `Proyecto_Lotificadora_SQL_BD2/CreacionDeTablas.sql` - Table definitions
- `Proyecto_Lotificadora_SQL_BD2/FuncionesEscalares.sql` - Dashboard functions
- `Proyecto_Lotificadora_SQL_BD2/Triggers.sql` - **10 automated triggers**
- `Proyecto_Lotificadora_SQL_BD2/InicializarBaseDatos.sql` - Master initialization script
- `Proyecto_Lotificadora_SQL_BD2/PruebaTriggers.sql` - Trigger validation tests

### Application Layer
- `Lotificadora_App/server/scripts/init-db.js` - Node.js initialization script
- `Lotificadora_App/package.json` - Includes `init:db` npm script

## 📖 Documentation

- `README_Triggers.md` - Complete trigger documentation
- `README_DashboardFunciones.md` - Dashboard functions guide
- `README_Transacciones.md` - Transaction procedures documentation
- `VERIFICACION_TRIGGERS.md` - **Trigger verification guide**" 
