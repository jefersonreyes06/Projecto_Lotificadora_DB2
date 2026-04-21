# Procedimientos Almacenados y Triggers para Pagos & Caja

## 📋 Descripción General

Se han creado procedimientos almacenados y triggers específicos para manejar la lógica de pagos y cierre de caja en el sistema de lotificadora. Estos procedimientos incluyen validaciones importantes para garantizar que los pagos solo se registren bajo condiciones específicas (lotes al crédito, en proceso de venta, cuotas pendientes).

---

## 🔧 PROCEDIMIENTOS ALMACENADOS

### 1. **sp_pagos_listar**
```sql
EXEC sp_pagos_listar 
    @VentaID = NULL,
    @ClienteID = NULL,
    @FechaInicio = NULL,
    @FechaFin = NULL,
    @MetodoPago = NULL
```

**Descripción:** Obtiene una lista de pagos registrados con filtros opcionales.

**Parámetros:**
- `@VentaID`: Filtrar pagos por ID de venta (opcional)
- `@ClienteID`: Filtrar pagos por ID de cliente (opcional)
- `@FechaInicio`: Filtrar pagos desde una fecha (opcional)
- `@FechaFin`: Filtrar pagos hasta una fecha (opcional)
- `@MetodoPago`: Filtrar por método (Efectivo, Deposito, Transferencia) (opcional)

**Retorna:** Lista con información de pagos, cuotas, cliente, lote y usuario de caja.

---

### 2. **sp_pagos_obtener**
```sql
EXEC sp_pagos_obtener @PagoID = 1
```

**Descripción:** Obtiene los detalles completos de un pago específico incluida la factura.

**Parámetros:**
- `@PagoID`: ID del pago a obtener (requerido)

**Retorna:** Información detallada del pago con desglose de capital, interés, IVA y datos de la factura.

---

### 3. **sp_lotes_disponibles_credito**
```sql
-- Por DNI del cliente
EXEC sp_lotes_disponibles_credito @DNI = '0801234567890'

-- Por número de lote
EXEC sp_lotes_disponibles_credito @NumeroLote = 'A-01'

-- Por ID de lote
EXEC sp_lotes_disponibles_credito @LoteID = 5

-- Todos los lotes disponibles
EXEC sp_lotes_disponibles_credito
```

**Descripción:** Obtiene lotes disponibles para procesar pagos, con validaciones de crédito y estado.

**Parámetros:**
- `@DNI`: DNI del cliente para ver sus lotes en crédito (opcional)
- `@NumeroLote`: Número específico del lote (opcional)
- `@LoteID`: ID específico del lote (opcional)

**Validaciones Aplicadas:**
- ✅ Estado del lote debe ser "Disponible" o "Proceso"
- ✅ Si es búsqueda por DNI: Validar venta activa al crédito
- ✅ Si es búsqueda por DNI: Validar cliente activo

**Retorna:** Lotes con información de cuotas pendientes, saldo pendiente, proyecto, etapa y tasa de interés.

---

### 4. **sp_obtener_plan_pagos**
```sql
EXEC sp_obtener_plan_pagos @VentaID = 1
```

**Descripción:** Obtiene todas las cuotas del plan de pagos de una venta.

**Parámetros:**
- `@VentaID`: ID de la venta (requerido)

**Retorna:** 
- Todas las cuotas (pendiente, parcial, pagada)
- Información de pagos registrados si existen
- Flag de vencimiento (1 si está vencida)
- Días al vencimiento (negativo si está vencida)

---

### 5. **sp_pago_factura**
```sql
EXEC sp_pago_factura @PagoID = 1
```

**Descripción:** Obtiene la factura y todos los detalles relacionados a un pago.

**Parámetros:**
- `@PagoID`: ID del pago (requerido)

**Retorna:** Información completa de factura con datos del cliente, lote, proyecto y desglose fiscal.

---

### 6. **sp_cierre_caja_diario**
```sql
-- Crear/actualizar cierre para hoy
EXEC sp_cierre_caja_diario 
    @UsuarioCajaID = 5,
    @FechaCierre = '2026-04-11',
    @Turno = 'Matutino'

-- Sin parámetros (fecha actual)
EXEC sp_cierre_caja_diario
```

**Descripción:** Genera o actualiza el cierre de caja diario con resumen de pagos.

**Parámetros:**
- `@UsuarioCajaID`: ID del usuario (opcional - si NULL, suma todos)
- `@FechaCierre`: Fecha del cierre (opcional - usa GETDATE() si NULL)
- `@Turno`: Identificación del turno (opcional)

**Calcula Automáticamente:**
- Total de pagos en efectivo
- Total de pagos por depósito/transferencia
- Total general
- Cantidad de registros por método

**Retorna:** Resumen del cierre con totales y cantidades, más un flag de éxito.

---

### 7. **sp_resumen_caja_diario**
```sql
EXEC sp_resumen_caja_diario 
    @FechaCierre = '2026-04-11',
    @UsuarioCajaID = 5
```

**Descripción:** Obtiene el resumen de caja para consulta y auditoría.

**Parámetros:**
- `@FechaCierre`: Fecha a consultar (opcional)
- `@UsuarioCajaID`: Usuario a filtrar (opcional)

**Retorna:** Información del cierre con estado, turno y cantidad de cuotas por tipo.

---

## 🎯 TRIGGERS CREADOS

### 1. **tr_Pagos_Insert_UpdateCuentaBancaria**
**Evento:** AFTER INSERT en tabla Pagos
**Acción:** Actualiza automáticamente el saldo de la cuenta bancaria cuando se registra un pago por depósito o transferencia.
```sql
-- Cuando se inserta un pago con MetodoPago = 'Deposito' o 'Transferencia'
-- El SaldoActual de CuentaBancaria += MontoRecibido
```

---

### 2. **tr_Pagos_Insert_ValidateLoteEstado**
**Evento:** INSTEAD OF INSERT en tabla Pagos
**Acción:** Valida que el pago solo se registre bajo estas condiciones:
- ✅ La venta DEBE ser al crédito (TipoVenta = 'Credito')
- ✅ La venta DEBE estar activa (Estado = 'Activa')
- ✅ El lote DEBE estar en estado 'Proceso' o 'Vendido'
- ✅ La cuota DEBE estar en estado 'Pendiente'

Si alguna condición falla, rechaza el INSERT con mensaje de error.

---

### 3. **tr_PlanPagos_Update_UpdateLoteEstado**
**Evento:** AFTER UPDATE en tabla PlanPagos
**Acción:** Cuando una cuota se marca como "Pagada":
- Verifica si TODAS las cuotas de la venta están pagadas
- Si es así, cambia el estado del lote a 'Vendido'

---

### 4. **tr_PlanPagos_Update_Auditoria**
**Evento:** AFTER UPDATE en tabla PlanPagos
**Acción:** Registra automáticamente en la tabla Auditoria:
- Cambios de estado en cuotas
- Cambios en saldo pendiente
- Quién, cuándo y qué cambió

---

### 5. **tr_Facturas_Insert_Auditoria**
**Evento:** AFTER INSERT en tabla Facturas
**Acción:** Registra en auditoría cada factura creada con:
- Número de factura
- Total
- CAI
- Timestamp automático

---

### 6. **tr_Pagos_Insert_ValidateMontoRecibido**
**Evento:** INSTEAD OF INSERT en tabla Pagos
**Acción:** Valida que:
- El MontoRecibido NO exceda el SaldoPendiente de la cuota
- Si el monto es mayor, rechaza el INSERT

---

### 7. **tr_Pagos_Insert_UpdateCuotaEstado**
**Evento:** AFTER INSERT en tabla Pagos
**Acción:** Actualiza automáticamente el estado de la cuota:
- Si MontoRecibido >= SaldoPendiente → Estado = 'Pagada'
- Si MontoRecibido < SaldoPendiente → Estado = 'Parcial'
- Calcula nuevo SaldoPendiente

---

## 📊 FLUJO DE REGISTRO DE PAGO

```
1. Usuario envía solicitud POST /pagos con datos del pago
   ↓
2. API llamaProc sp_registrar_pago_completo (ya existía)
   ↓
3. INSERT en tabla Pagos se disparan los triggers:
   - tr_Pagos_Insert_ValidateLoteEstado ✓ Si falla, rechaza
   - tr_Pagos_Insert_ValidateMontoRecibido ✓ Si falla, rechaza
   - tr_Pagos_Insert_UpdateCuentaBancaria (si es depósito)
   - tr_Pagos_Insert_UpdateCuotaEstado
   ↓
4. Factura se crea automáticamente
   ↓
5. tr_Facturas_Insert_Auditoria registra la factura
   ↓
6. Cuando cuota se marca Pagada, tr_PlanPagos_Update_UpdateLoteEstado
   verifica si todas las cuotas están pagadas → cambia lote a Vendido
   ↓
7. Auditoría registra todas las operaciones
```

---

## 🔐 VALIDACIONES IMPORTANTES

### ✅ Validaciones Automáticas en Pagos

1. **Lote debe estar al crédito**
   - TipoVenta = 'Credito'
   - TipoVenta != 'Contado'

2. **Lote debe estar en proceso**
   - Estado = 'Proceso' O 'Vendido'
   - NO 'Disponible'

3. **Venta debe estar activa**
   - Estado = 'Activa'
   - NO 'Cancelada'

4. **Cuota debe estar pendiente**
   - Estado = 'Pendiente'
   - NO 'Pagada' o 'Cancelada'

5. **Monto válido**
   - MontoRecibido <= SaldoPendiente
   - NO puede ser mayor al monto adeudado

---

## 🔍 CONSULTAS ÚTILES DESDE FRONTEND

### Obtener lote de un cliente por DNI
```javascript
// En pagos.js
const result = await executeProcedure("sp_lotes_disponibles_credito", { 
    DNI: "0801234567890" 
});
```

### Obtener cuotas pendientes de un lote
```javascript
// Primero obtener VentaID del lote
// Luego:
const cuotas = await executeProcedure("sp_obtener_plan_pagos", { 
    VentaID: ventaID 
});
```

### Registrar un pago
```javascript
// Ya implementado en pagos.js
const result = await executeProcedure("sp_registrar_pago_completo", {
    CuotaID: cuotaId,
    MontoRecibido: montoRecibido,
    MetodoPago: metodoPago, // 'Efectivo', 'Deposito', 'Transferencia'
    CuentaBancariaID: cuentaBancariaId, // Si es depósito
    UsuarioCajaID: usuarioCajaId,
    Observaciones: observaciones
});
```

### Cerrar caja diaria
```javascript
const cierre = await executeProcedure("sp_cierre_caja_diario", {
    UsuarioCajaID: usuarioCajaId,
    FechaCierre: new Date()
});
```

---

## 📝 TABLA DE ESTADOS DE LOTES

| Estado        | Descripción |
|---|---|
| `Disponible`  | Lote no vendido, disponible para venta |
| `Proceso`     | Lote vendido, en proceso de pagos |
| `Vendido`     | Lote completamente pagado |

---

## 📝 TABLA DE ESTADOS DE CUOTAS

| Estado    | Descripción |
|---|---|
| `Pendiente` | Aún no se ha registrado ningún pago |
| `Parcial`   | Se ha registrado un pago, pero no cubre el total |
| `Pagada`    | Cuota completamente pagada |
| `Cancelada` | Venta fue cancelada |

---

## 📝 TABLA DE MÉTODOS DE PAGO

| Método        | Descripción |
|---|---|
| `Efectivo`    | Pago en efectivo |
| `Deposito`    | Pago por depósito bancario |
| `Transferencia` | Pago por transferencia bancaria |

---

## 🐛 MANEJO DE ERRORES

Todos los procedimientos incluyen manejo de errores TRY-CATCH que:
- Capturan excepciones SQL
- Retornan mensajes descriptivos
- Revierten transacciones si algo falla
- Registran en auditoría

---

## ✨ CARACTERÍSTICAS ADICIONALES

- **Auditoría Automática:** Cada operación se registra en tabla Auditoria
- **Transaccionalidad:** Operaciones complejas se ejecutan en transacciones
- **Validaciones en Cascada:** El sistema valida en múltiples niveles
- **Saldos Automáticos:** Se calculan y actualizan automáticamente
- **Facturas Automáticas:** Se generan al registrar pagos
- **Cierre de Caja:** Resumen automático de operaciones diarias

---

## 📚 ARCHIVOS MODIFICADOS

1. **ProcedimientosAlmacenadosPagos.sql** (NUEVO)
   - Contiene los 7 procedimientos específicos para pagos

2. **Triggers.sql** (ACTUALIZADO)
   - Agregados 7 triggers adicionales (triggers 11-17)
   - Ahora 17 triggers en total

---

## ⚠️ NOTAS IMPORTANTES

1. Los procedimientos `sp_registrar_pago_completo` y `sp_generar_plan_pagos` ya existían en ProcedimientosTransaccionales.sql
2. Estos nuevos procedimientos actúan como complemento para listar, obtener y consultar información
3. Los triggers proporcionan validaciones y actualizaciones automáticas
4. Para aplicar estos cambios a la BD, ejecutar los dos archivos SQL

---

Creado: 2026-04-11
Versión: 1.0
