-- =====================================================
-- STORED PROCEDURES PARA VENTAS
-- =====================================================

USE IngenierosEnProceso;
GO

-- Insertar una nueva venta
CREATE PROCEDURE sp_ventas_insertar
    @ClienteID INT,
    @LoteID INT,
    @TipoVenta VARCHAR(20),
    @MontoTotal DECIMAL(12,2),
    @Prima DECIMAL(12,2) = 0,
    @MontoFinanciado DECIMAL(12,2),
    @AniosPlazo INT,
    @TasaInteresAplicada DECIMAL(5,2),
    @CuotaMensualEstimada DECIMAL(12,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Validar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Clientes WHERE ClienteID = @ClienteID AND Estado = 'Activo')
        BEGIN
            SELECT 'Error: Cliente no encontrado o inactivo' AS message, 0 AS success;
            RETURN;
        END

        -- Validar que el lote existe y está disponible
        IF NOT EXISTS (SELECT 1 FROM Lotes WHERE LoteID = @LoteID AND Estado = 'Disponible')
        BEGIN
            SELECT 'Error: Lote no encontrado o no disponible' AS message, 0 AS success;
            RETURN;
        END

        -- Validar TipoVenta
        IF @TipoVenta NOT IN ('Contado', 'Financiado')
        BEGIN
            SELECT 'Error: TipoVenta debe ser Contado o Financiado' AS message, 0 AS success;
            RETURN;
        END

        -- Insertar la venta
        INSERT INTO Ventas (
            ClienteID, LoteID, FechaVenta, TipoVenta, MontoTotal, Prima, MontoFinanciado, AniosPlazo, TasaInteresAplicada, CuotaMensualEstimada, Estado
        )
        VALUES (
            @ClienteID, @LoteID, GETDATE(), @TipoVenta, @MontoTotal, @Prima, @MontoFinanciado, @AniosPlazo, @TasaInteresAplicada, @CuotaMensualEstimada, 'Activa'
        );

        -- Retornar la venta creada
        SELECT
            VentaID, ClienteID, LoteID, FechaVenta, TipoVenta, MontoTotal, Prima, MontoFinanciado, AniosPlazo, TasaInteresAplicada, CuotaMensualEstimada, Estado,
            1 AS success
        FROM Ventas
        WHERE VentaID = SCOPE_IDENTITY();

    END TRY
    BEGIN CATCH
        SELECT
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success;
    END CATCH
END;
GO

-- Listar todas las ventas
CREATE PROCEDURE sp_ventas_listar
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        v.VentaID AS VentaId,
        v.ClienteID,
        c.NombreCompleto AS ClienteNombre,
        l.NumeroLote AS lote,
        v.FechaVenta AS fecha_venta,
        v.TipoVenta AS tipo_venta,
        v.MontoTotal AS monto_total,
        v.Estado,
        -- Calcular cuotas pendientes para ventas a crédito
        CASE
            WHEN v.TipoVenta = 'Credito' THEN
                ISNULL((
                    SELECT COUNT(*)
                    FROM PlanPagos pp
                    WHERE pp.VentaID = v.VentaID
                      AND pp.Estado <> 'Pagada'
                ), 0)
            ELSE 0
        END AS cuotas_pendientes,
        -- Determinar estado de cuenta basado en cuotas pendientes
        CASE
            WHEN v.TipoVenta = 'Contado' THEN 'Pagado'
            WHEN v.Estado = 'Cancelada' THEN 'Cancelada'
            WHEN EXISTS(
                SELECT 1
                FROM PlanPagos pp
                WHERE pp.VentaID = v.VentaID
                  AND pp.Estado <> 'Pagada'
                  AND pp.FechaVencimiento < GETDATE()
            ) THEN 'En mora'
            ELSE 'Al día'
        END AS estado_cuenta
    FROM Ventas v
    INNER JOIN Clientes c ON v.ClienteID = c.ClienteID
    INNER JOIN Lotes l ON v.LoteID = l.LoteID
    ORDER BY v.FechaVenta DESC;
END;
GO

-- Obtener venta por ID
CREATE PROCEDURE sp_ventas_obtener_por_id
    @VentaID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        v.VentaID,
        v.ClienteID,
        c.NombreCompleto AS ClienteNombre,
        v.LoteID,
        l.NumeroLote,
        v.FechaVenta,
        v.TipoVenta,
        v.MontoTotal,
        v.Prima,
        v.MontoFinanciado,
        v.AniosPlazo,
        v.TasaInteresAplicada,
        v.CuotaMensualEstimada,
        v.Estado
    FROM Ventas v
    INNER JOIN Clientes c ON v.ClienteID = c.ClienteID
    INNER JOIN Lotes l ON v.LoteID = l.LoteID
    WHERE v.VentaID = @VentaID;
END;
GO

-- Actualizar una venta
CREATE PROCEDURE sp_ventas_actualizar
    @VentaID INT,
    @TipoVenta VARCHAR(20) = NULL,
    @MontoTotal DECIMAL(12,2) = NULL,
    @Prima DECIMAL(12,2) = NULL,
    @MontoFinanciado DECIMAL(12,2) = NULL,
    @AniosPlazo INT = NULL,
    @TasaInteresAplicada DECIMAL(5,2) = NULL,
    @CuotaMensualEstimada DECIMAL(12,2) = NULL,
    @Estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Validar que la venta existe
        IF NOT EXISTS (SELECT 1 FROM Ventas WHERE VentaID = @VentaID)
        BEGIN
            SELECT 'Error: Venta no encontrada' AS message, 0 AS success;
            RETURN;
        END

        -- Actualizar solo los campos proporcionados
        UPDATE Ventas
        SET
            TipoVenta = ISNULL(@TipoVenta, TipoVenta),
            MontoTotal = ISNULL(@MontoTotal, MontoTotal),
            Prima = ISNULL(@Prima, Prima),
            MontoFinanciado = ISNULL(@MontoFinanciado, MontoFinanciado),
            AniosPlazo = ISNULL(@AniosPlazo, AniosPlazo),
            TasaInteresAplicada = ISNULL(@TasaInteresAplicada, TasaInteresAplicada),
            CuotaMensualEstimada = ISNULL(@CuotaMensualEstimada, CuotaMensualEstimada),
            Estado = ISNULL(@Estado, Estado)
        WHERE VentaID = @VentaID;

        -- Retornar la venta actualizada
        EXEC sp_ventas_obtener_por_id @VentaID;

        SELECT 1 AS success;

    END TRY
    BEGIN CATCH
        SELECT
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success;
    END CATCH
END;
GO

-- Eliminar una venta (cambiar estado a 'Cancelada')
CREATE PROCEDURE sp_ventas_eliminar
    @VentaID INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Validar que la venta existe
        IF NOT EXISTS (SELECT 1 FROM Ventas WHERE VentaID = @VentaID)
        BEGIN
            SELECT 'Error: Venta no encontrada' AS message, 0 AS success;
            RETURN;
        END

        -- Cambiar estado a 'Cancelada' en lugar de eliminar
        UPDATE Ventas
        SET Estado = 'Cancelada'
        WHERE VentaID = @VentaID;

        -- También, liberar el lote si estaba vendido
        UPDATE Lotes
        SET Estado = 'Disponible', FechaVenta = NULL
        WHERE LoteID = (SELECT LoteID FROM Ventas WHERE VentaID = @VentaID);

        SELECT 'Venta cancelada exitosamente' AS message, 1 AS success;

    END TRY
    BEGIN CATCH
        SELECT
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success;
    END CATCH
END;
GO

-- Listar lotes disponibles para venta
CREATE PROCEDURE sp_lotes_disponibles
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        l.LoteID AS id,
        l.NumeroLote AS codigo_lote,
        b.Nombre AS bloque,
        e.Nombre AS etapa,
        p.Nombre AS proyecto,
        l.AreaVaras AS area_m2,
        0 AS es_esquina, -- Campo no implementado
        l.Estado AS estado,
        l.PrecioFinal AS valor_total,
        l.PrecioBase AS precio_base
    FROM Lotes l
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    WHERE l.Estado = 'Disponible'
    ORDER BY p.Nombre, e.Nombre, b.Nombre, l.NumeroLote;
END;
GO

-- =====================================================
-- PROCEDIMIENTOS PARA ESTADÍSTICAS DE VENTAS
-- =====================================================

-- Contar ventas de contado
CREATE PROCEDURE sp_ventas_contar_contado
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS total_contado
    FROM Ventas
    WHERE TipoVenta = 'Contado'
      AND Estado <> 'Cancelada';
END;
GO

-- Contar ventas a crédito
CREATE PROCEDURE sp_ventas_contar_credito
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS total_credito
    FROM Ventas
    WHERE TipoVenta = 'Credito'
      AND Estado <> 'Cancelada';
END;
GO

-- Contar ventas en mora (crédito con cuotas vencidas)
CREATE PROCEDURE sp_ventas_contar_mora
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(DISTINCT v.VentaID) AS total_mora
    FROM Ventas v
    INNER JOIN PlanPagos pp ON v.VentaID = pp.VentaID
    WHERE v.TipoVenta = 'Credito'
      AND v.Estado = 'Activa'
      AND pp.Estado <> 'Pagada'
      AND pp.FechaVencimiento < GETDATE();
END;
GO

-- Obtener estadísticas completas de ventas
CREATE PROCEDURE sp_ventas_estadisticas
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        -- Total de ventas
        (SELECT COUNT(*) FROM Ventas WHERE Estado <> 'Cancelada') AS total_ventas,

        -- Ventas de contado
        (SELECT COUNT(*) FROM Ventas WHERE TipoVenta = 'Contado' AND Estado <> 'Cancelada') AS total_contado,

        -- Ventas a crédito
        (SELECT COUNT(*) FROM Ventas WHERE TipoVenta = 'Credito' AND Estado <> 'Cancelada') AS total_credito,

        -- Ventas en mora
        (
            SELECT COUNT(DISTINCT v.VentaID)
            FROM Ventas v
            INNER JOIN PlanPagos pp ON v.VentaID = pp.VentaID
            WHERE v.TipoVenta = 'Credito'
              AND v.Estado = 'Activa'
              AND pp.Estado <> 'Pagada'
              AND pp.FechaVencimiento < GETDATE()
        ) AS total_mora;
END;
GO

-- NOTA: El trigger 'trg_venta_actualizar_lote' ha sido eliminado de este archivo
-- porque causaba duplicación de registros de Lotes. La funcionalidad se consolidó
-- en el trigger 'tr_Ventas_Insert_UpdateLoteStatus' del archivo Triggers.sql
-- Ver: ConsolidacionCorrecciones.sql para más detalles.