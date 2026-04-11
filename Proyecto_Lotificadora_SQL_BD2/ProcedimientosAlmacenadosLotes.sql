-- Asegúrate de estar en la base de datos correcta
-- USE IngenierosEnProceso  -- Cambia esto al nombre de tu BD si es diferente
GO

-- =====================================================
-- STORED PROCEDURES PARA LOTES
-- =====================================================

-- Crear nuevo lote
CREATE PROCEDURE sp_lotes_crear
    @BloqueID INT,
    @NumeroLote VARCHAR(20),
    @AreaVaras DECIMAL(18,4),
    @PrecioBase DECIMAL(12,2),
    @PrecioFinal DECIMAL(12,2),
    @Estado VARCHAR(20) = 'Disponible',
    @FechaReserva DATE = NULL,
    @FechaVenta DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Bloques WHERE BloqueID = @BloqueID)
        BEGIN
            SELECT 'Error: El bloque no existe' AS message, 0 AS success;
            RETURN;
        END

        IF @NumeroLote IS NULL OR @NumeroLote = ''
           OR @AreaVaras IS NULL OR @AreaVaras <= 0
           OR @PrecioBase IS NULL OR @PrecioBase < 0
           OR @PrecioFinal IS NULL OR @PrecioFinal < 0
        BEGIN
            SELECT 'Error: Faltan campos requeridos o son inválidos' AS message, 0 AS success;
            RETURN;
        END

        IF @PrecioFinal < @PrecioBase
        BEGIN
            SELECT 'Error: El precio final no puede ser menor que el precio base' AS message, 0 AS success;
            RETURN;
        END

        INSERT INTO Lotes (BloqueID, NumeroLote, AreaVaras, PrecioBase, PrecioFinal, Estado, FechaReserva, FechaVenta)
        VALUES (@BloqueID, @NumeroLote, @AreaVaras, @PrecioBase, @PrecioFinal, @Estado, @FechaReserva, @FechaVenta);

        SELECT
            LoteID AS id,
            BloqueID AS bloqueId,
            NumeroLote AS numeroLote,
            AreaVaras AS areaVaras,
            PrecioBase AS precioBase,
            PrecioFinal AS precioFinal,
            Estado AS estado,
            FechaReserva AS fechaReserva,
            FechaVenta AS fechaVenta,
            1 AS success
        FROM Lotes
        WHERE LoteID = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS message, 0 AS success;
    END CATCH
END
GO

-- Listar lotes (opcionalmente por bloque)
CREATE PROCEDURE sp_lotes_listar
    @bloqueId INT = NULL
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
        0 AS es_esquina, -- Campo no implementado, asumir false
        l.Estado AS estado,
        l.PrecioFinal AS valor_total,
        l.BloqueID AS bloqueId,
        l.PrecioBase AS precioBase,
        l.FechaReserva AS fechaReserva,
        l.FechaVenta AS fechaVenta
    FROM Lotes l
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    WHERE (@bloqueId IS NULL OR l.BloqueID = @bloqueId)
    ORDER BY p.Nombre, e.Nombre, b.Nombre, l.NumeroLote ASC;
END
GO

-- Obtener lote por ID
CREATE PROCEDURE sp_lotes_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        LoteID AS id,
        BloqueID AS bloqueId,
        NumeroLote AS numeroLote,
        AreaVaras AS areaVaras,
        PrecioBase AS precioBase,
        PrecioFinal AS precioFinal,
        Estado AS estado,
        FechaReserva AS fechaReserva,
        FechaVenta AS fechaVenta
    FROM Lotes
    WHERE LoteID = @id;
END
GO

-- Actualizar lote
CREATE PROCEDURE sp_lotes_actualizar
    @id INT,
    @BloqueID INT = NULL,
    @NumeroLote VARCHAR(20) = NULL,
    @AreaVaras DECIMAL(18,4) = NULL,
    @PrecioBase DECIMAL(12,2) = NULL,
    @PrecioFinal DECIMAL(12,2) = NULL,
    @Estado VARCHAR(20) = NULL,
    @FechaReserva DATE = NULL,
    @FechaVenta DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Lotes WHERE LoteID = @id)
        BEGIN
            SELECT 'Error: Lote no encontrado' AS message, 0 AS success;
            RETURN;
        END

        IF @AreaVaras IS NOT NULL AND @AreaVaras <= 0
        BEGIN
            SELECT 'Error: El área debe ser mayor a 0' AS message, 0 AS success;
            RETURN;
        END

        IF @PrecioBase IS NOT NULL AND @PrecioBase < 0
           OR @PrecioFinal IS NOT NULL AND @PrecioFinal < 0
        BEGIN
            SELECT 'Error: Los precios no pueden ser negativos' AS message, 0 AS success;
            RETURN;
        END

        IF @PrecioBase IS NOT NULL AND @PrecioFinal IS NOT NULL AND @PrecioFinal < @PrecioBase
        BEGIN
            SELECT 'Error: El precio final no puede ser menor que el precio base' AS message, 0 AS success;
            RETURN;
        END

        UPDATE Lotes
        SET
            BloqueID = COALESCE(@BloqueID, BloqueID),
            NumeroLote = COALESCE(@NumeroLote, NumeroLote),
            AreaVaras = COALESCE(@AreaVaras, AreaVaras),
            PrecioBase = COALESCE(@PrecioBase, PrecioBase),
            PrecioFinal = COALESCE(@PrecioFinal, PrecioFinal),
            Estado = COALESCE(@Estado, Estado),
            FechaReserva = COALESCE(@FechaReserva, FechaReserva),
            FechaVenta = COALESCE(@FechaVenta, FechaVenta)
        WHERE LoteID = @id;

        SELECT
            LoteID AS id,
            BloqueID AS bloqueId,
            NumeroLote AS numeroLote,
            AreaVaras AS areaVaras,
            PrecioBase AS precioBase,
            PrecioFinal AS precioFinal,
            Estado AS estado,
            FechaReserva AS fechaReserva,
            FechaVenta AS fechaVenta,
            1 AS success
        FROM Lotes
        WHERE LoteID = @id;
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS message, 0 AS success;
    END CATCH
END
GO

-- Eliminar lote (soft delete)
CREATE PROCEDURE sp_lotes_eliminar
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Lotes WHERE LoteID = @id)
        BEGIN
            SELECT 'Error: Lote no encontrado' AS message, 0 AS success;
            RETURN;
        END

        UPDATE Lotes
        SET Estado = 'Eliminado'
        WHERE LoteID = @id;

        SELECT 'Lote eliminado correctamente' AS message, 1 AS success, @id AS deletedId;
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS message, 0 AS success;
    END CATCH
END
GO
