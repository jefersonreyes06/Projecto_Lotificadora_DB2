-- =============================================================================
-- EJEMPLOS DE PRUEBA - PROCEDIMIENTOS Y TRIGGERS DE PAGOS
-- =============================================================================
-- Archivo: EJEMPLOS_PRUEBA_PAGOS.sql
-- Descripción: Ejemplos prácticos para ejecutar en SQL Server Management Studio
-- =============================================================================

USE IngenierosEnProceso;
GO

-- =============================================================================
-- SECCIÓN 1: PREPARACIÓN (Datos de Prueba)
-- =============================================================================

-- Verificar que exista un cliente con estado 'Activo'
SELECT TOP 1 * FROM Clientes WHERE Estado = 'Activo';

-- Verificar que exista una venta al crédito en estado 'Activa'
SELECT TOP 1 v.* FROM Ventas v 
WHERE v.TipoVenta = 'Credito' AND v.Estado = 'Activa';

-- Verificar que exista un lote en estado 'Proceso' o 'Vendido'
SELECT TOP 1 l.* FROM Lotes l 
WHERE l.Estado IN ('Proceso', 'Vendido');

-- Verificar que exista un usuario con rol 'Cajero'
SELECT TOP 1 * FROM Usuarios WHERE Rol = 'Cajero';

-- Verificar que exista una cuenta bancaria activa
SELECT TOP 1 * FROM CuentaBancaria WHERE Estado = 'Activa';

GO

-- =============================================================================
-- SECCIÓN 2: PRUEBA DE PROCEDIMIENTOS
-- =============================================================================

-- =============================================================================
-- 2.1. LISTAR PAGOS
-- =============================================================================
-- Listar todos los pagos
EXEC sp_pagos_listar;

-- Listar pagos de una venta específica
EXEC sp_pagos_listar @VentaID = 1;

-- Listar pagos en efectivo
EXEC sp_pagos_listar @MetodoPago = 'Efectivo';

-- Listar pagos en un rango de fechas
EXEC sp_pagos_listar 
    @FechaInicio = '2026-04-01',
    @FechaFin = '2026-04-30';

-- Listar pagos de un cliente específico
EXEC sp_pagos_listar @ClienteID = 1;

GO

-- =============================================================================
-- 2.2. OBTENER UN PAGO ESPECÍFICO
-- =============================================================================
-- Obtener detalle completo de un pago
EXEC sp_pagos_obtener @PagoID = 1;

GO

-- =============================================================================
-- 2.3. OBTENER LOTES DISPONIBLES AL CRÉDITO
-- =============================================================================
-- Obtener TODOS los lotes disponibles
EXEC sp_lotes_disponibles_credito;

-- Obtener lotes de un cliente por DNI
-- (Cambiar '0801234567890' por un DNI real de la BD)
EXEC sp_lotes_disponibles_credito @DNI = '0801234567890';

-- Obtener lote por número
EXEC sp_lotes_disponibles_credito @NumeroLote = 'A-01';

-- Obtener lote por ID
EXEC sp_lotes_disponibles_credito @LoteID = 1;

GO

-- =============================================================================
-- 2.4. OBTENER PLAN DE PAGOS (CUOTAS)
-- =============================================================================
-- Ver todas las cuotas de una venta
EXEC sp_obtener_plan_pagos @VentaID = 1;

GO

-- =============================================================================
-- 2.5. OBTENER FACTURA DE UN PAGO
-- =============================================================================
-- Ver factura de un pago
EXEC sp_pago_factura @PagoID = 1;

GO

-- =============================================================================
-- 2.6. REGISTRAR UN NUEVO PAGO
-- =============================================================================

-- Primero, obtener una cuota pendiente
SELECT TOP 1 pp.CuotaID, pp.NumeroCuota, pp.MontoCuota, pp.SaldoPendiente
FROM PlanPagos pp
WHERE pp.Estado = 'Pendiente'
ORDER BY pp.CuotaID;

-- OPCIÓN A: Registrar pago en EFECTIVO
-- (Cambiar @CuotaID, @UsuarioCajaID según los datos reales)
EXEC sp_registrar_pago_completo
    @CuotaID = 1,
    @MontoRecibido = 875.00,
    @MetodoPago = 'Efectivo',
    @UsuarioCajaID = 1,
    @Observaciones = 'Pago en efectivo - Prueba';

-- OPCIÓN B: Registrar pago por DEPOSITO BANCARIO
EXEC sp_registrar_pago_completo
    @CuotaID = 2,
    @MontoRecibido = 875.00,
    @MetodoPago = 'Deposito',
    @NumeroDeposito = 'DEP-2026-0001',
    @CuentaBancariaID = 1,
    @UsuarioCajaID = 1,
    @Observaciones = 'Pago por depósito - Prueba';

-- OPCIÓN C: Registrar pago parcial
EXEC sp_registrar_pago_completo
    @CuotaID = 3,
    @MontoRecibido = 500.00,
    @MetodoPago = 'Efectivo',
    @UsuarioCajaID = 1,
    @Observaciones = 'Pago parcial - Abono a cuenta';

GO

-- =============================================================================
-- 2.7. CIERRE DE CAJA DIARIO
-- =============================================================================

-- Generar cierre para HOY por un usuario específico
EXEC sp_cierre_caja_diario 
    @UsuarioCajaID = 1,
    @Turno = 'Matutino';

-- Generar cierre para una fecha específica
EXEC sp_cierre_caja_diario 
    @UsuarioCajaID = 1,
    @FechaCierre = '2026-04-11',
    @Turno = 'Vespertino';

-- Generar cierre general (todos los usuarios)
EXEC sp_cierre_caja_diario;

GO

-- =============================================================================
-- 2.8. OBTENER RESUMEN DE CAJA
-- =============================================================================

-- Resumen de caja para HOY
EXEC sp_resumen_caja_diario;

-- Resumen de caja para una fecha específica
EXEC sp_resumen_caja_diario @FechaCierre = '2026-04-11';

-- Resumen de caja de un usuario específico
EXEC sp_resumen_caja_diario @UsuarioCajaID = 1;

GO

-- =============================================================================
-- SECCIÓN 3: VERIFICACIÓN DE TRIGGERS
-- =============================================================================

-- =============================================================================
-- 3.1. VERIFICAR ACTUALIZACIÓN DE CUENTA BANCARIA
-- =============================================================================

-- Ver saldo actual de una cuenta
SELECT CuentaID, Banco, SaldoActual FROM CuentaBancaria WHERE CuentaID = 1;

-- Registrar un pago por depósito
EXEC sp_registrar_pago_completo
    @CuotaID = 4,
    @MontoRecibido = 1000.00,
    @MetodoPago = 'Deposito',
    @NumeroDeposito = 'DEP-2026-0002',
    @CuentaBancariaID = 1,
    @UsuarioCajaID = 1;

-- Verificar que el saldo se actualizó (debe aumentar 1000)
SELECT CuentaID, Banco, SaldoActual FROM CuentaBancaria WHERE CuentaID = 1;

GO

-- =============================================================================
-- 3.2. VERIFICAR CAMBIO DE ESTADO DEL LOTE
-- =============================================================================

-- Este trigger solo funciona si hay un lote con todas sus cuotas pagadas

-- Obtener un lote en proceso
SELECT TOP 1 l.LoteID, l.NumeroLote, l.Estado
FROM Lotes l
INNER JOIN Ventas v ON l.LoteID = v.LoteID
WHERE l.Estado = 'Proceso'
ORDER BY l.LoteID;

-- Ver sus cuotas
SELECT pp.CuotaID, pp.NumeroCuota, pp.Estado, pp.SaldoPendiente
FROM PlanPagos pp
INNER JOIN Ventas v ON pp.VentaID = v.VentaID
WHERE v.LoteID = 1 -- Cambiar por LoteID real
ORDER BY pp.NumeroCuota;

GO

-- =============================================================================
-- SECCIÓN 4: VALIDACIONES (Verificación de Errores)
-- =============================================================================

-- =============================================================================
-- 4.1. INTENTO: Pago en lote no al crédito (DEBE FALLAR)
-- =============================================================================

-- Primero, obtener una venta de CONTADO
SELECT TOP 1 * FROM Ventas WHERE TipoVenta = 'Contado' AND Estado = 'Activa';

-- Obtener una cuota de esa venta (si existe)
-- Si no hay, este script abortará con error - es lo esperado

-- Intento de pago (Este INSERT debe fallar con el trigger de validación)
/*
EXEC sp_registrar_pago_completo
    @CuotaID = 999,  -- Cuota de venta de CONTADO
    @MontoRecibido = 500.00,
    @MetodoPago = 'Efectivo',
    @UsuarioCajaID = 1;

-- Resultado esperado: Error - "El pago solo puede registrarse para ventas al crédito..."
*/

GO

-- =============================================================================
-- 4.2. INTENTO: Pago superior al saldo pendiente (DEBE FALLAR)
-- =============================================================================

-- Obtener una cuota pendiente
SELECT TOP 1 pp.CuotaID, pp.SaldoPendiente
FROM PlanPagos pp
WHERE pp.Estado = 'Pendiente'
ORDER BY pp.CuotaID;

-- Intento de pago por monto mayor al saldo (Este INSERT debe fallar)
/*
EXEC sp_registrar_pago_completo
    @CuotaID = 1,
    @MontoRecibido = 999999.00,  -- Monto muy alto
    @MetodoPago = 'Efectivo',
    @UsuarioCajaID = 1;

-- Resultado esperado: Error - "El monto recibido no puede exceder el saldo pendiente..."
*/

GO

-- =============================================================================
-- SECCIÓN 5: AUDITORÍA
-- =============================================================================

-- Ver todos los registros de auditoría de pagos
SELECT TOP 20 * FROM Auditoria 
WHERE TablaAfectada = 'Pagos'
ORDER BY FechaAccion DESC;

-- Ver auditoría de cuotas actualizadas
SELECT TOP 20 * FROM Auditoria 
WHERE TablaAfectada = 'PlanPagos'
ORDER BY FechaAccion DESC;

-- Ver auditoría de facturas creadas
SELECT TOP 20 * FROM Auditoria 
WHERE TablaAfectada = 'Facturas'
ORDER BY FechaAccion DESC;

-- Ver auditoría de cierre de caja
SELECT TOP 20 * FROM Auditoria 
WHERE TablaAfectada = 'CierreCaja'
ORDER BY FechaAccion DESC;

GO

-- =============================================================================
-- SECCIÓN 6: REPORTES ÚTILES
-- =============================================================================

-- =============================================================================
-- 6.1. REPORTE: Pagos por método en día específico
-- =============================================================================

DECLARE @Fecha DATE = '2026-04-11';

SELECT 
    p.MetodoPago,
    COUNT(*) AS CantidadPagos,
    SUM(p.MontoRecibido) AS TotalRecibido,
    AVG(p.MontoRecibido) AS PromedioMonto,
    MIN(p.MontoRecibido) AS MinimoMonto,
    MAX(p.MontoRecibido) AS MaximoMonto
FROM Pagos p
WHERE CAST(p.FechaPago AS DATE) = @Fecha
GROUP BY p.MetodoPago;

GO

-- =============================================================================
-- 6.2. REPORTE: Clientes con cuotas vencidas
-- =============================================================================

SELECT DISTINCT
    c.ClienteID,
    c.NombreCompleto,
    c.DNI,
    l.NumeroLote,
    COUNT(pp.CuotaID) AS CuotasVencidas,
    SUM(pp.SaldoPendiente) AS SaldoVencido
FROM Clientes c
INNER JOIN Ventas v ON c.ClienteID = v.ClienteID
INNER JOIN Lotes l ON v.LoteID = l.LoteID
INNER JOIN PlanPagos pp ON v.VentaID = pp.VentaID
WHERE pp.Estado = 'Pendiente'
  AND pp.FechaVencimiento < GETDATE()
GROUP BY c.ClienteID, c.NombreCompleto, c.DNI, l.NumeroLote
ORDER BY SaldoVencido DESC;

GO

-- =============================================================================
-- 6.3. REPORTE: Estado de pagos por cliente
-- =============================================================================

SELECT
    c.ClienteID,
    c.NombreCompleto,
    c.DNI,
    l.NumeroLote,
    v.MontoTotal,
    CAST((SELECT SUM(p.MontoRecibido) FROM Pagos p 
          INNER JOIN PlanPagos pp ON p.CuotaID = pp.CuotaID
          WHERE pp.VentaID = v.VentaID) AS DECIMAL(12,2)) AS TotalPagado,
    CAST(v.MontoTotal - ISNULL((SELECT SUM(p.MontoRecibido) FROM Pagos p 
          INNER JOIN PlanPagos pp ON p.CuotaID = pp.CuotaID
          WHERE pp.VentaID = v.VentaID), 0) AS DECIMAL(12,2)) AS SaldoPendiente,
    CAST((SELECT CAST((ISNULL((SELECT SUM(p.MontoRecibido) FROM Pagos p 
          INNER JOIN PlanPagos pp ON p.CuotaID = pp.CuotaID
          WHERE pp.VentaID = v.VentaID), 0) / v.MontoTotal) * 100 AS DECIMAL(5,2))) AS DECIMAL(5,2)) AS PorcentajePagado,
    (SELECT COUNT(*) FROM PlanPagos pp WHERE pp.VentaID = v.VentaID AND pp.Estado = 'Pagada') AS CuotasPagadas,
    (SELECT COUNT(*) FROM PlanPagos pp WHERE pp.VentaID = v.VentaID) AS TotalCuotas
FROM Clientes c
INNER JOIN Ventas v ON c.ClienteID = v.ClienteID
INNER JOIN Lotes l ON v.LoteID = l.LoteID
WHERE v.Estado = 'Activa'
ORDER BY SaldoPendiente DESC;

GO

-- =============================================================================
-- 6.4. REPORTE: Resumen de caja por usuario y día
-- =============================================================================

SELECT
    cc.FechaCierre,
    cc.Turno,
    u.NombreCompleto AS Cajero,
    cc.CantidadPagosEfectivo,
    cc.CantidadPagosDeposito,
    cc.TotalEfectivoRecibido,
    cc.TotalDepositadoBanco,
    cc.TotalGeneral,
    cc.Estado
FROM CierreCaja cc
INNER JOIN Usuarios u ON cc.UsuarioCajaID = u.UsuarioID
ORDER BY cc.FechaCierre DESC, cc.Turno;

GO

-- =============================================================================
-- NOTAS IMPORTANTES:
-- =============================================================================
-- 1. Reemplazar valores de prueba (ClienteID, VentaID, etc.) con datos reales
-- 2. Los triggers se ejecutan automáticamente en segundo plano
-- 3. Todos los procedimientos incluyen manejo de errores
-- 4. La auditoría se registra automáticamente
-- 5. Las validaciones se applican en la capa de BD (más seguro)
-- =============================================================================
