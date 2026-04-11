# Guía de Integración: Pagos en el Frontend

## 📱 Endpoints Disponibles

### 1. Listar Pagos
```http
GET /pagos?ventaId=1&clienteId=1&fechaInicio=2026-04-01&fechaFin=2026-04-30&metodoPago=Efectivo
```

**Parámetros Query (todos opcionales):**
- `ventaId`: ID de venta a filtrar
- `clienteId`: ID de cliente a filtrar
- `fechaInicio`: Fecha mínima de pago
- `fechaFin`: Fecha máxima de pago
- `metodoPago`: 'Efectivo', 'Deposito', 'Transferencia'

**Respuesta:**
```json
[
  {
    "PagoID": 1,
    "CuotaID": 5,
    "FechaPago": "2026-04-11",
    "MontoRecibido": 1500.00,
    "MetodoPago": "Efectivo",
    "ClienteNombre": "Juan Pérez",
    "DNI": "0801234567890",
    "NumeroLote": "A-01",
    "EstadoCuota": "Pagada"
  }
]
```

---

### 2. Obtener Lotes Disponibles al Crédito
```http
GET /pagos/lotes/disponibles?dni=0801234567890
GET /pagos/lotes/disponibles?numeroLote=A-01
GET /pagos/lotes/disponibles?loteId=5
GET /pagos/lotes/disponibles
```

**Parámetros Query (todos opcionales):**
- `dni`: DNI del cliente
- `numeroLote`: Número del lote (ej: "A-01", "B-05")
- `loteId`: ID del lote

**Respuesta (búsqueda por DNI):**
```json
[
  {
    "LoteID": 5,
    "NumeroLote": "A-01",
    "AreaVaras": 750.00,
    "PrecioFinal": 45000.00,
    "EstadoLote": "Proceso",
    "NombreProyecto": "Proyecto Residencial",
    "NombreEtapa": "Etapa 1",
    "TasaInteresAnual": 12.50,
    "VentaID": 3,
    "ClienteNombre": "Juan Pérez",
    "DNI": "0801234567890",
    "CuotasPendientes": 48,
    "SaldoPendiente": 42000.00
  }
]
```

---

### 3. Obtener Plan de Pagos (Cuotas)
```http
GET /pagos/plan-pagos/3
```

**Parámetro:**
- `ventaId` (URL param): ID de la venta

**Respuesta:**
```json
[
  {
    "CuotaID": 5,
    "VentaID": 3,
    "NumeroCuota": 1,
    "FechaVencimiento": "2026-05-11",
    "MontoCuota": 875.00,
    "Capital": 850.00,
    "Interes": 25.00,
    "SaldoPendiente": 875.00,
    "Estado": "Pendiente",
    "FechaPago": null,
    "PagoID": null,
    "EstaVencida": 0,
    "DiasAlVencimiento": 30
  },
  {
    "CuotaID": 6,
    "VentaID": 3,
    "NumeroCuota": 2,
    "FechaVencimiento": "2026-06-11",
    "MontoCuota": 875.00,
    "Capital": 850.00,
    "Interes": 25.00,
    "SaldoPendiente": 875.00,
    "Estado": "Pendiente",
    "FechaPago": null,
    "PagoID": null,
    "EstaVencida": 0,
    "DiasAlVencimiento": 61
  }
]
```

---

### 4. Obtener Detalle de un Pago
```http
GET /pagos/5
```

**Parámetro:**
- `id` (URL param): ID del pago

**Respuesta:**
```json
{
  "PagoID": 5,
  "CuotaID": 10,
  "FechaPago": "2026-04-11",
  "MontoRecibido": 875.00,
  "MetodoPago": "Deposito",
  "NumeroDeposito": "DEP-2026-001",
  "BancoCuenta": "Banco Ficohsa",
  "NumeroCuenta": "123456789",
  "ClienteNombre": "Juan Pérez",
  "DNI": "0801234567890",
  "NumeroLote": "A-01",
  "EstadoCuota": "Pagada",
  "FacturaID": 5,
  "NumeroFactura": "FAC-20260411-00005",
  "CAI": "CAI-2024-001",
  "TotalFactura": 875.00
}
```

---

### 5. Registrar un Nuevo Pago
```http
POST /pagos
Content-Type: application/json

{
  "cuotaId": 10,
  "montoRecibido": 875.00,
  "metodoPago": "Efectivo",
  "usuarioCajaId": 1,
  "observaciones": "Pago en efectivo cliente satisfecho"
}
```

**Con Depósito Bancario:**
```json
{
  "cuotaId": 10,
  "montoRecibido": 875.00,
  "metodoPago": "Deposito",
  "numeroDeposito": "DEP-2026-001",
  "cuentaBancariaId": 1,
  "usuarioCajaId": 1,
  "observaciones": "Depósito bancario realizado"
}
```

**Parámetros Body:**
- `cuotaId` (requerido): ID de la cuota a pagar
- `montoRecibido` (requerido): Monto del pago
- `metodoPago` (requerido): 'Efectivo', 'Deposito', 'Transferencia'
- `numeroDeposito` (opcional): Número de depósito si aplica
- `cuentaBancariaId` (opcional): ID de cuenta si es depósito
- `usuarioCajaId` (requerido): ID del usuario de caja
- `observaciones` (opcional): Nota del pago
- `fechaPago` (opcional): Fecha del pago (default: GETDATE())

**Respuesta (éxito):**
```json
{
  "PagoID": 25,
  "FacturaID": 25,
  "NumeroFactura": "FAC-20260411-00025",
  "Mensaje": "Pago registrado exitosamente",
  "Exito": 1
}
```

**Respuesta (error):**
```json
{
  "PagoID": 0,
  "FacturaID": 0,
  "NumeroFactura": "",
  "Mensaje": "Error: El pago solo puede registrarse para ventas al crédito con lote en estado Proceso.",
  "Exito": 0
}
```

---

### 6. Obtener Factura de un Pago
```http
GET /pagos/5/factura
```

**Parámetro:**
- `id` (URL param): ID del pago

**Respuesta:**
```json
{
  "FacturaID": 5,
  "NumeroFactura": "FAC-20260411-00005",
  "CAI": "CAI-2024-001",
  "FechaEmision": "2026-04-11",
  "DesgloseCapital": 850.00,
  "DesgloseInteres": 25.00,
  "DesgloseIVA": 0.00,
  "TotalFactura": 875.00,
  "ClienteNombre": "Juan Pérez",
  "DNI": "0801234567890",
  "NumeroLote": "A-01",
  "ProyectoNombre": "Proyecto Residencial",
  "EtapaNombre": "Etapa 1"
}
```

---

### 7. Registrar Cierre de Caja Diario
```http
POST /pagos/cierre-diario
Content-Type: application/json

{
  "usuarioCajaId": 1,
  "turno": "Matutino"
}
```

**Parámetros Body (todos opcionales):**
- `usuarioCajaId`: ID del usuario (NULL = todos los usuarios)
- `fechaCierre`: Fecha del cierre (default: hoy)
- `turno`: 'Matutino', 'Vespertino', 'Nocturno', etc.

**Respuesta:**
```json
{
  "CierreID": 5,
  "FechaCierre": "2026-04-11",
  "TotalEfectivoRecibido": 5250.00,
  "TotalDepositadoBanco": 7500.00,
  "TotalGeneral": 12750.00,
  "CantidadPagosEfectivo": 6,
  "CantidadPagosDeposito": 8,
  "Mensaje": "Cierre generado exitosamente",
  "Exito": 1
}
```

---

### 8. Obtener Resumen de Caja Diario
```http
GET /pagos/caja/resumen?fechaCierre=2026-04-11&usuarioCajaId=1
```

**Parámetros Query (opcionales):**
- `fechaCierre`: Fecha a consultar
- `usuarioCajaId`: ID del usuario

**Respuesta:**
```json
[
  {
    "CierreID": 5,
    "UsuarioCajaID": 1,
    "UsuarioCaja": "María López",
    "FechaCierre": "2026-04-11",
    "Turno": "Matutino",
    "TotalEfectivoRecibido": 5250.00,
    "TotalDepositadoBanco": 7500.00,
    "TotalGeneral": 12750.00,
    "CantidadPagosEfectivo": 6,
    "CantidadPagosDeposito": 8,
    "Estado": "Pendiente"
  }
]
```

---

## 💡 FLUJOS DE USO RECOMENDADOS

### 🔄 Flujo 1: Procesar Pago por DNI del Cliente

```javascript
// 1. Buscar lotes del cliente por DNI
const lotesResponse = await fetch('/pagos/lotes/disponibles?dni=0801234567890');
const lotes = await lotesResponse.json();

// 2. Seleccionar un lote y obtener plan de pagos
const cuotasResponse = await fetch(`/pagos/plan-pagos/${lotes[0].VentaID}`);
const cuotas = await cuotasResponse.json();

// 3. Filtrar cuotas pendientes
const cuotasPendientes = cuotas.filter(c => c.Estado === 'Pendiente');

// 4. Registrar el pago
const pagoResponse = await fetch('/pagos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cuotaId: cuotasPendientes[0].CuotaID,
    montoRecibido: cuotasPendientes[0].SaldoPendiente,
    metodoPago: 'Efectivo',
    usuarioCajaId: 1
  })
});

const pagoRegistrado = await pagoResponse.json();

// 5. Obtener factura
const facturaResponse = await fetch(`/pagos/${pagoRegistrado.PagoID}/factura`);
const factura = await facturaResponse.json();
```

---

### 🔄 Flujo 2: Consultar Pagos de una Venta

```javascript
// 1. Obtener todos los pagos de una venta
const pagosResponse = await fetch('/pagos?ventaId=3');
const pagos = await pagosResponse.json();

// 2. Filtrar por método de pago
const pagosEfectivo = pagos.filter(p => p.MetodoPago === 'Efectivo');
const pagosDeposito = pagos.filter(p => p.MetodoPago === 'Deposito');

// 3. Obtener plan de pagos
const cuotasResponse = await fetch('/pagos/plan-pagos/3');
const cuotas = await cuotasResponse.json();

// 4. Calcular estado
const cuotasPagadas = cuotas.filter(c => c.Estado === 'Pagada').length;
const totalCuotas = cuotas.length;
const porcentajePagado = (cuotasPagadas / totalCuotas) * 100;
```

---

### 🔄 Flujo 3: Cierre de Caja Diario

```javascript
// 1. Registrar cierre de caja
const cierreResponse = await fetch('/pagos/cierre-diario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    usuarioCajaId: 1,
    turno: 'Matutino'
  })
});

const cierre = await cierreResponse.json();
console.log(`Total Efectivo: ${cierre.TotalEfectivoRecibido}`);
console.log(`Total Depósito: ${cierre.TotalDepositadoBanco}`);
console.log(`Total General: ${cierre.TotalGeneral}`);

// 2. Obtener resumen
const resumenResponse = await fetch('/pagos/caja/resumen?fechaCierre=2026-04-11');
const resumen = await resumenResponse.json();
console.log(resumen);
```

---

## ⚠️ VALIDACIONES IMPORTANTES

Todas estas validaciones ocurren automáticamente en la BD:

1. **No puede pagar lote no al crédito**
   - El procedimiento rechaza si TipoVenta != 'Credito'

2. **No puede pagar lote no en proceso**
   - El procedimiento rechaza si Estado != 'Proceso'

3. **No puede pagar cuota no pendiente**
   - El procedimiento rechaza si Estado != 'Pendiente'

4. **No puede pagar más del saldo**
   - El procedimiento rechaza si MontoRecibido > SaldoPendiente

5. **La cuenta bancaria se actualiza automáticamente**
   - Si metodoPago = 'Deposito', el SaldoActual aumenta automáticamente

6. **El lote pasa a "Vendido" cuando todas las cuotas están pagadas**
   - Automático al marcar la última cuota como pagada

---

## 🐛 MANEJO DE ERRORES

```javascript
const registrarPago = async (datos) => {
  try {
    const response = await fetch('/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.Exito === 0) {
      // Error retornado por la BD
      console.error('Error:', result.Mensaje);
      // Mostrar mensaje al usuario
      showError(result.Mensaje);
      return null;
    }

    // Éxito
    console.log('Pago registrado:', result.NumeroFactura);
    return result;

  } catch (error) {
    // Error de red
    console.error('Error de conexión:', error);
    showError('Error al conectar con el servidor');
    return null;
  }
};
```

---

## 📊 ESTRUCTURA DE DATOS

### Estados de Cuota
- `Pendiente` → No hay pagos registrados
- `Parcial` → Hay pagos pero no cubre todo
- `Pagada` → Cuota completamente pagada
- `Cancelada` → Venta fue cancelada

### Métodos de Pago
- `Efectivo` → Dinero en efectivo
- `Deposito` → Depósito bancario
- `Transferencia` → Transferencia bancaria

### Estados de Lote
- `Disponible` → No vendido
- `Proceso` → Vendido, en pagos
- `Vendido` → Completamente pagado

---

Actualizado: 2026-04-11
