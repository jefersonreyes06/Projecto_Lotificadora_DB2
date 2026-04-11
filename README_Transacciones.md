# Procedimientos Transaccionales - Documentación

## Resumen
Se han implementado 4 procedimientos almacenados con manejo transaccional completo para operaciones críticas del sistema de lotificadora.

## Procedimientos Implementados

### 1. `sp_crear_venta_completa`
**Propósito**: Crear una venta completa con validaciones y generación automática de plan de pagos.

**Parámetros**:
- `@ClienteID INT` - ID del cliente
- `@LoteID INT` - ID del lote
- `@TipoVenta VARCHAR(20)` - 'Contado' o 'Financiado'
- `@Prima DECIMAL(12,2)` - Prima pagada (opcional)
- `@AniosPlazo INT` - Años de financiamiento (requerido si es financiado)
- `@TasaInteresAplicada DECIMAL(5,2)` - Tasa de interés (requerida si es financiado)

**Validaciones**:
- Cliente activo
- Lote disponible
- Datos completos para financiamiento

**Acciones**:
- Inserta venta
- Actualiza estado del lote
- Genera plan de pagos (si es financiado)
- Registra auditoría

### 2. `sp_registrar_pago_completo`
**Propósito**: Registrar un pago completo con actualización de saldos y generación de factura.

**Parámetros**:
- `@CuotaID INT` - ID de la cuota a pagar
- `@MontoRecibido DECIMAL(12,2)` - Monto pagado
- `@MetodoPago VARCHAR(20)` - Método de pago
- `@NumeroDeposito VARCHAR(50)` - Número de depósito (opcional)
- `@CuentaBancariaID INT` - ID de cuenta bancaria (opcional)
- `@UsuarioCajaID INT` - ID del usuario de caja
- `@Observaciones VARCHAR(200)` - Observaciones (opcional)

**Validaciones**:
- Cuota pendiente existente
- Monto no excede saldo pendiente

**Acciones**:
- Inserta pago
- Actualiza estado de cuota
- Genera factura automática
- Registra auditoría

### 3. `sp_crear_lote_completo`
**Propósito**: Crear un lote con características y actualización automática de áreas.

**Parámetros**:
- `@BloqueID INT` - ID del bloque
- `@NumeroLote VARCHAR(20)` - Número del lote
- `@AreaVaras DECIMAL(18,4)` - Área en varas cuadradas
- `@PrecioBase DECIMAL(12,2)` - Precio base
- `@Estado VARCHAR(20)` - Estado del lote
- `@CaracteristicasXML XML` - XML con IDs de características (opcional)

**Validaciones**:
- Bloque existente
- Número de lote único en el bloque

**Acciones**:
- Inserta lote
- Asigna características
- Calcula precio final con incrementos
- Actualiza área total del bloque
- Registra auditoría

### 4. `sp_cancelar_venta_completa`
**Propósito**: Cancelar una venta y revertir todos los cambios relacionados.

**Parámetros**:
- `@VentaID INT` - ID de la venta a cancelar
- `@MotivoCancelacion VARCHAR(200)` - Motivo de la cancelación

**Validaciones**:
- Venta existente y no cancelada

**Acciones**:
- Cambia estado de venta a 'Cancelada'
- Libera lote (estado 'Disponible')
- Cancela cuotas pendientes
- Registra auditoría

## Endpoints del Frontend

### Ventas
```javascript
// Crear venta completa
const venta = await ventasApi.create({
  clienteId: 1,
  loteId: 5,
  tipoVenta: 'Financiado',
  prima: 5000,
  aniosPlazo: 5,
  tasaInteresAplicada: 12.5
});

// Cancelar venta
const resultado = await ventasApi.cancelar(ventaId, 'Motivo de cancelación');
```

### Pagos
```javascript
// Registrar pago completo
const pago = await pagosApi.registrar({
  cuotaId: 10,
  montoRecibido: 1500,
  metodoPago: 'Efectivo',
  usuarioCajaId: 1,
  observaciones: 'Pago completo de cuota'
});
```

### Lotes
```javascript
// Crear lote con características
const lote = await lotesApi.create({
  bloqueId: 2,
  numeroLote: 'A-15',
  areaVaras: 250.5,
  precioBase: 150000,
  caracteristicas: [1, 3, 5] // IDs de características
});
```

## Beneficios del Manejo Transaccional

1. **Integridad de Datos**: Todas las operaciones relacionadas se ejecutan como una unidad atómica
2. **Consistencia**: Si falla alguna parte, se revierte todo
3. **Auditoría Completa**: Todas las operaciones quedan registradas
4. **Validaciones Centralizadas**: Lógica de negocio en un solo lugar
5. **Mantenimiento**: Cambios en reglas de negocio solo requieren actualizar el SP

## Manejo de Errores

Todos los procedimientos devuelven:
- **Éxito**: `{ exito: 1, mensaje: "Operación exitosa", [id]: valor }`
- **Error**: `{ exito: 0, mensaje: "Descripción del error" }`

El frontend debe verificar `exito` antes de continuar.