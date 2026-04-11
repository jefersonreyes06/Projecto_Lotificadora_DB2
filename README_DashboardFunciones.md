# Funciones Escalares para Dashboard

## Resumen
Se han implementado 5 funciones escalares que proporcionan métricas clave para el dashboard del sistema de lotificadora.

## Funciones Implementadas

### 1. `fn_ContarProyectosActivos()`
**Propósito**: Contar proyectos en estado 'Activo'
**Retorno**: `INT` - Número de proyectos activos
**Uso**: Dashboard principal

### 2. `fn_LotesDisponibles()`
**Propósito**: Contar lotes en estado 'Disponible'
**Retorno**: `INT` - Número de lotes disponibles para venta
**Uso**: Dashboard principal

### 3. `fn_VentasMesActual()`
**Propósito**: Contar ventas realizadas en el mes actual
**Retorno**: `INT` - Número de ventas del mes en curso
**Uso**: Dashboard principal

### 4. `fn_PagosPendientes()`
**Propósito**: Contar cuotas de pago pendientes o parciales
**Retorno**: `INT` - Número de cuotas por cobrar
**Uso**: Dashboard principal

### 5. `fn_IngresosMesActual()`
**Propósito**: Sumar todos los pagos recibidos en el mes actual
**Retorno**: `DECIMAL(12,2)` - Monto total de ingresos del mes
**Uso**: Dashboard principal

## Endpoints del Backend

```
GET /api/dashboard/proyectos-activos     → fn_ContarProyectosActivos()
GET /api/dashboard/lotes-disponibles     → fn_LotesDisponibles()
GET /api/dashboard/ventas-mes-actual     → fn_VentasMesActual()
GET /api/dashboard/pagos-pendientes      → fn_PagosPendientes()
GET /api/dashboard/ingresos-mes-actual   → fn_IngresosMesActual()
```

**Respuesta**: `{ total: number }`

## API del Frontend

```javascript
import { dashboardApi } from '../services/api';

// Todas las funciones devuelven promesas que resuelven a { total: number }
const proyectosActivos = await dashboardApi.proyectosActivos();
const lotesDisponibles = await dashboardApi.lotesDisponibles();
const ventasMes = await dashboardApi.ventasMesActual();
const pagosPendientes = await dashboardApi.pagosPendientes();
const ingresosMes = await dashboardApi.ingresosMesActual();
```

## Dashboard Actualizado

El dashboard ahora muestra 5 métricas principales:

1. **Proyectos activos** - Total de proyectos en operación
2. **Lotes disponibles** - Lotes listos para venta
3. **Ventas este mes** - Número de ventas realizadas
4. **Pagos pendientes** - Cuotas por cobrar
5. **Ingresos este mes** - Monto total recibido

## Implementación Técnica

### Base de Datos
- Archivo: `Proyecto_Lotificadora_SQL_BD2/FuncionesEscalares.sql`
- Todas las funciones usan consultas optimizadas con índices apropiados

### Backend
- Archivo: `server/routes/dashboard.js`
- Usa `executeScalarFunction()` para llamadas eficientes
- Manejo de errores consistente

### Frontend
- Archivo: `app/services/api.js` - Funciones `dashboardApi.*`
- Archivo: `app/pages/Dashboard.jsx` - Componente actualizado
- Carga paralela de todas las métricas usando `Promise.all()`

## Beneficios

1. **Performance**: Consultas escalares optimizadas
2. **Consistencia**: Todas las métricas calculadas en BD
3. **Mantenibilidad**: Lógica centralizada en funciones SQL
4. **Escalabilidad**: Fácil agregar nuevas métricas
5. **Confiabilidad**: Cálculos precisos y consistentes