-- Script de Prueba para Triggers
-- Ejecutar después de inicializar la base de datos con triggers

USE Lotificadora_DB2;
GO

PRINT '=== PRUEBA DE TRIGGERS ===';
PRINT 'Iniciando pruebas de funcionalidad automática...';
GO

-- 1. PRUEBA: Insertar lote y verificar actualización de área del bloque
PRINT '1. Prueba: Insertar lote y actualizar área del bloque';
DECLARE @BloqueID INT = 1;
DECLARE @AreaAntes DECIMAL(10,2);

-- Obtener área antes
SELECT @AreaAntes = AreaTotal FROM Bloques WHERE BloqueID = @BloqueID;
PRINT 'Área del bloque antes: ' + CAST(@AreaAntes AS VARCHAR(10));

-- Insertar lote
INSERT INTO Lotes (BloqueID, NumeroLote, Area, PrecioPorMetro, Estado, FechaCreacion)
VALUES (@BloqueID, 999, 100.50, 25.00, 'Disponible', GETDATE());

-- Verificar área después
DECLARE @AreaDespues DECIMAL(10,2);
SELECT @AreaDespues = AreaTotal FROM Bloques WHERE BloqueID = @BloqueID;
PRINT 'Área del bloque después: ' + CAST(@AreaDespues AS VARCHAR(10));
PRINT 'Diferencia: ' + CAST((@AreaDespues - @AreaAntes) AS VARCHAR(10)) + ' (debe ser 100.50)';
GO

-- 2. PRUEBA: Crear venta y verificar cambio de estado del lote
PRINT '2. Prueba: Crear venta y cambiar estado del lote';
DECLARE @LoteID INT = (SELECT TOP 1 LoteID FROM Lotes WHERE NumeroLote = 999);
DECLARE @ClienteID INT = 1;

-- Verificar estado antes
DECLARE @EstadoAntes VARCHAR(20);
SELECT @EstadoAntes = Estado FROM Lotes WHERE LoteID = @LoteID;
PRINT 'Estado del lote antes: ' + @EstadoAntes;

-- Crear venta
INSERT INTO Ventas (LoteID, ClienteID, PrecioVenta, FechaVenta, Estado, SaldoPendiente)
VALUES (@LoteID, @ClienteID, 2512.50, GETDATE(), 'Activa', 2512.50);

-- Verificar estado después
DECLARE @EstadoDespues VARCHAR(20);
SELECT @EstadoDespues = Estado FROM Lotes WHERE LoteID = @LoteID;
PRINT 'Estado del lote después: ' + @EstadoDespues + ' (debe ser Vendido)';
GO

-- 3. PRUEBA: Registrar pago y verificar actualización de cuota
PRINT '3. Prueba: Registrar pago y actualizar cuota';
DECLARE @VentaID INT = (SELECT TOP 1 VentaID FROM Ventas WHERE LoteID = (SELECT LoteID FROM Lotes WHERE NumeroLote = 999));
DECLARE @CuotaID INT;

-- Crear cuota primero
INSERT INTO Cuotas (VentaID, NumeroCuota, MontoCuota, FechaVencimiento, Estado)
VALUES (@VentaID, 1, 2512.50, DATEADD(MONTH, 1, GETDATE()), 'Pendiente');
SET @CuotaID = SCOPE_IDENTITY();

-- Verificar estado antes
DECLARE @EstadoCuotaAntes VARCHAR(20);
SELECT @EstadoCuotaAntes = Estado FROM Cuotas WHERE CuotaID = @CuotaID;
PRINT 'Estado de la cuota antes: ' + @EstadoCuotaAntes;

-- Registrar pago
INSERT INTO Pagos (CuotaID, MontoPagado, FechaPago, MetodoPago)
VALUES (@CuotaID, 2512.50, GETDATE(), 'Efectivo');

-- Verificar estado después
DECLARE @EstadoCuotaDespues VARCHAR(20);
SELECT @EstadoCuotaDespues = Estado FROM Cuotas WHERE CuotaID = @CuotaID;
PRINT 'Estado de la cuota después: ' + @EstadoCuotaDespues + ' (debe ser Pagada)';
GO

-- 4. PRUEBA: Verificar auditoría de ventas
PRINT '4. Prueba: Verificar auditoría de ventas';
SELECT TOP 5
    TablaAfectada,
    Operacion,
    FechaCambio,
    Usuario,
    Detalles
FROM Auditoria
WHERE TablaAfectada = 'Ventas'
ORDER BY FechaCambio DESC;
GO

-- 5. PRUEBA: Intentar eliminar lote vendido (debe fallar)
PRINT '5. Prueba: Intentar eliminar lote vendido (debe fallar)';
BEGIN TRY
    DECLARE @LoteVendidoID INT = (SELECT TOP 1 LoteID FROM Lotes WHERE Estado = 'Vendido');
    DELETE FROM Lotes WHERE LoteID = @LoteVendidoID;
    PRINT 'ERROR: Se permitió eliminar lote vendido (trigger no funcionó)';
END TRY
BEGIN CATCH
    PRINT 'CORRECTO: Trigger impidió eliminar lote vendido';
    PRINT 'Mensaje de error: ' + ERROR_MESSAGE();
END CATCH
GO

-- 6. PRUEBA: Verificar funciones escalares del dashboard
PRINT '6. Prueba: Funciones escalares del dashboard';
SELECT
    dbo.fn_TotalLotesDisponibles() AS LotesDisponibles,
    dbo.fn_TotalVentasActivas() AS VentasActivas,
    dbo.fn_IngresosTotales() AS IngresosTotales,
    dbo.fn_PagosPendientes() AS PagosPendientes,
    dbo.fn_ClientesActivos() AS ClientesActivos;
GO

-- LIMPIEZA: Eliminar datos de prueba
PRINT 'LIMPIEZA: Eliminando datos de prueba...';
DELETE FROM Pagos WHERE CuotaID IN (SELECT CuotaID FROM Cuotas WHERE VentaID IN (SELECT VentaID FROM Ventas WHERE LoteID IN (SELECT LoteID FROM Lotes WHERE NumeroLote = 999)));
DELETE FROM Cuotas WHERE VentaID IN (SELECT VentaID FROM Ventas WHERE LoteID IN (SELECT LoteID FROM Lotes WHERE NumeroLote = 999));
DELETE FROM Ventas WHERE LoteID IN (SELECT LoteID FROM Lotes WHERE NumeroLote = 999);
DELETE FROM Lotes WHERE NumeroLote = 999;
PRINT 'Datos de prueba eliminados.';
GO

PRINT '=== PRUEBAS COMPLETADAS ===';
PRINT 'Si todas las pruebas pasaron correctamente, los triggers están funcionando.';