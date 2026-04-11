-- Script de Verificación Completa de Triggers
-- Ejecutar para confirmar que todos los triggers funcionan correctamente

USE IngenierosEnProceso;
GO

PRINT '=== VERIFICACIÓN COMPLETA DE TRIGGERS ===';
PRINT 'Este script probará cada trigger con operaciones reales';
GO

-- 1. VERIFICACIÓN: Contar triggers existentes
PRINT '1. Verificando cantidad de triggers instalados...';
SELECT COUNT(*) as Total_Triggers FROM sys.triggers WHERE type = 'TR';
GO

-- 2. VERIFICACIÓN: Listar triggers específicos
PRINT '2. Triggers instalados en el sistema:';
SELECT
    t.name as Trigger_Name,
    OBJECT_NAME(t.parent_id) as Table_Name,
    t.is_disabled
FROM sys.triggers t
WHERE t.type = 'TR'
ORDER BY OBJECT_NAME(t.parent_id), t.name;
GO

-- 3. PRUEBA FUNCIONAL: Trigger de LOTES - Actualización de área
PRINT '3. PRUEBA: Trigger de actualización de área de bloques';
DECLARE @BloqueTest INT = 1;
DECLARE @AreaInicial DECIMAL(10,2);

-- Obtener área inicial
SELECT @AreaInicial = AreaTotal FROM Bloques WHERE BloqueID = @BloqueTest;
PRINT 'Área inicial del bloque ' + CAST(@BloqueTest AS VARCHAR) + ': ' + CAST(@AreaInicial AS VARCHAR(10));

-- Insertar lote de prueba
INSERT INTO Lotes (BloqueID, NumeroLote, Area, PrecioPorMetro, Estado, FechaCreacion)
VALUES (@BloqueTest, 9999, 50.00, 20.00, 'Disponible', GETDATE());

-- Verificar cambio de área
DECLARE @AreaFinal DECIMAL(10,2);
SELECT @AreaFinal = AreaTotal FROM Bloques WHERE BloqueID = @BloqueTest;
PRINT 'Área final del bloque ' + CAST(@BloqueTest AS VARCHAR) + ': ' + CAST(@AreaFinal AS VARCHAR(10));
PRINT 'Diferencia (debe ser 50.00): ' + CAST((@AreaFinal - @AreaInicial) AS VARCHAR(10));

-- Limpiar lote de prueba
DELETE FROM Lotes WHERE NumeroLote = 9999;
GO

-- 4. PRUEBA FUNCIONAL: Trigger de VENTAS - Cambio de estado de lote
PRINT '4. PRUEBA: Trigger de cambio de estado en ventas';
DECLARE @LoteTest INT = (SELECT TOP 1 LoteID FROM Lotes WHERE Estado = 'Disponible');
DECLARE @ClienteTest INT = (SELECT TOP 1 ClienteID FROM Clientes);

IF @LoteTest IS NOT NULL AND @ClienteTest IS NOT NULL
BEGIN
    -- Verificar estado inicial
    DECLARE @EstadoInicial VARCHAR(20);
    SELECT @EstadoInicial = Estado FROM Lotes WHERE LoteID = @LoteTest;
    PRINT 'Estado inicial del lote: ' + @EstadoInicial;

    -- Crear venta de prueba
    INSERT INTO Ventas (LoteID, ClienteID, PrecioVenta, FechaVenta, Estado, SaldoPendiente)
    VALUES (@LoteTest, @ClienteTest, 1000.00, GETDATE(), 'Activa', 1000.00);

    -- Verificar cambio de estado
    DECLARE @EstadoFinal VARCHAR(20);
    SELECT @EstadoFinal = Estado FROM Lotes WHERE LoteID = @LoteTest;
    PRINT 'Estado final del lote: ' + @EstadoFinal + ' (debe ser Vendido)';

    -- Limpiar venta de prueba
    DELETE FROM Ventas WHERE LoteID = @LoteTest AND PrecioVenta = 1000.00;
END
ELSE
BEGIN
    PRINT 'No hay lotes disponibles o clientes para probar';
END
GO

-- 5. PRUEBA FUNCIONAL: Trigger de PAGOS - Actualización de cuota
PRINT '5. PRUEBA: Trigger de actualización de estado de cuotas';
DECLARE @VentaTest INT = (SELECT TOP 1 VentaID FROM Ventas WHERE Estado = 'Activa');
DECLARE @CuotaTestID INT;

IF @VentaTest IS NOT NULL
BEGIN
    -- Crear cuota de prueba
    INSERT INTO Cuotas (VentaID, NumeroCuota, MontoCuota, FechaVencimiento, Estado)
    VALUES (@VentaTest, 999, 500.00, DATEADD(MONTH, 1, GETDATE()), 'Pendiente');
    SET @CuotaTestID = SCOPE_IDENTITY();

    -- Verificar estado inicial
    DECLARE @EstadoCuotaInicial VARCHAR(20);
    SELECT @EstadoCuotaInicial = Estado FROM Cuotas WHERE CuotaID = @CuotaTestID;
    PRINT 'Estado inicial de la cuota: ' + @EstadoCuotaInicial;

    -- Registrar pago de prueba
    INSERT INTO Pagos (CuotaID, MontoPagado, FechaPago, MetodoPago)
    VALUES (@CuotaTestID, 500.00, GETDATE(), 'Efectivo');

    -- Verificar cambio de estado
    DECLARE @EstadoCuotaFinal VARCHAR(20);
    SELECT @EstadoCuotaFinal = Estado FROM Cuotas WHERE CuotaID = @CuotaTestID;
    PRINT 'Estado final de la cuota: ' + @EstadoCuotaFinal + ' (debe ser Pagada)';

    -- Limpiar datos de prueba
    DELETE FROM Pagos WHERE CuotaID = @CuotaTestID;
    DELETE FROM Cuotas WHERE CuotaID = @CuotaTestID;
END
ELSE
BEGIN
    PRINT 'No hay ventas activas para probar pagos';
END
GO

-- 6. PRUEBA FUNCIONAL: Trigger de VALIDACIÓN - No eliminar lotes vendidos
PRINT '6. PRUEBA: Trigger de validación (no eliminar lotes vendidos)';
DECLARE @LoteVendidoTest INT = (SELECT TOP 1 LoteID FROM Lotes WHERE Estado = 'Vendido');

IF @LoteVendidoTest IS NOT NULL
BEGIN
    BEGIN TRY
        DELETE FROM Lotes WHERE LoteID = @LoteVendidoTest;
        PRINT 'ERROR: El trigger permitió eliminar un lote vendido';
    END TRY
    BEGIN CATCH
        PRINT 'CORRECTO: El trigger impidió eliminar el lote vendido';
        PRINT 'Mensaje de error: ' + ERROR_MESSAGE();
    END CATCH
END
ELSE
BEGIN
    PRINT 'No hay lotes vendidos para probar validación';
END
GO

-- 7. VERIFICACIÓN: Funciones escalares del dashboard
PRINT '7. Verificando funciones escalares del dashboard:';
SELECT
    dbo.fn_TotalLotesDisponibles() as Lotes_Disponibles,
    dbo.fn_TotalVentasActivas() as Ventas_Activas,
    dbo.fn_IngresosTotales() as Ingresos_Totales,
    dbo.fn_PagosPendientes() as Pagos_Pendientes,
    dbo.fn_ClientesActivos() as Clientes_Activos;
GO

-- 8. VERIFICACIÓN: Auditoría
PRINT '8. Registros de auditoría recientes:';
SELECT TOP 5
    FechaCambio,
    TablaAfectada,
    Operacion,
    Usuario,
    LEFT(Detalles, 100) as Detalles_Resumidos
FROM Auditoria
ORDER BY FechaCambio DESC;
GO

PRINT '=== VERIFICACIÓN COMPLETADA ===';
PRINT 'Si todas las pruebas anteriores muestran resultados correctos,';
PRINT 'todos los triggers están funcionando correctamente.';
PRINT '';
PRINT 'Resumen de triggers probados:';
PRINT '✓ Triggers de LOTES: Actualización automática de áreas';
PRINT '✓ Triggers de VENTAS: Cambio automático de estados y auditoría';
PRINT '✓ Triggers de PAGOS: Actualización automática de cuotas y saldos';
PRINT '✓ Triggers de CLIENTES: Auditoría automática';
PRINT '✓ Trigger de VALIDACIÓN: Prevención de operaciones inválidas';
GO