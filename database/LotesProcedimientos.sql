USE IngenierosEnProceso
GO

CREATE OR ALTER PROCEDURE sp_lotes_crear
    @BloqueID       INT,
    @AreaVaras      DECIMAL(18,4),
    @Estado         VARCHAR(20) = 'Disponible',
    @Caracteristicas VARCHAR(MAX) = NULL -- IDs separados por coma: '1,2,3'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- 1. Validaciones
        IF NOT EXISTS (SELECT 1 FROM Bloques WHERE BloqueID = @BloqueID)
            THROW 50001, 'El bloque no existe.', 1;

        IF @AreaVaras IS NULL OR @AreaVaras <= 0
            THROW 50002, 'Área inválida.', 1;

        -- 2. Insertar Lote (Sin calcular precios, los triggers lo harán por ti)
        -- Insertamos valores temporales o nulos en los precios; los triggers los corregirán inmediatamente
        INSERT INTO Lotes (BloqueID, NumeroLote, AreaVaras, PrecioBase, PrecioFinal, Estado)
        VALUES (@BloqueID, 'TEMP', @AreaVaras, 0, 0, @Estado);

        DECLARE @NuevoID INT = SCOPE_IDENTITY();

        -- 3. Generar NumeroLote definitivo
        UPDATE Lotes
        SET NumeroLote = 'L-' + CAST(@NuevoID AS VARCHAR(10))
        WHERE LoteID = @NuevoID;

        -- 4. Insertar características (Esto disparará el trigger que calcula el PrecioFinal)
        IF @Caracteristicas IS NOT NULL
        BEGIN
            INSERT INTO LoteCaracteristicas (LoteID, CaracteristicaID)
            SELECT @NuevoID, TRIM(value)
            FROM STRING_SPLIT(@Caracteristicas, ',')
            WHERE TRIM(value) != '';
        END

        -- 5. Retornar el lote resultante
        -- Nota: Al hacer este SELECT, los triggers ya habrán terminado de ejecutarse
        SELECT
            l.LoteID, l.BloqueID, l.NumeroLote, l.AreaVaras,
            l.PrecioBase, l.PrecioFinal, l.Estado,
            c.CaracteristicaID, c.Nombre AS NombreCaracteristica, c.PorcentajeIncremento
        FROM Lotes l
        LEFT JOIN LoteCaracteristicas lc ON l.LoteID = lc.LoteID
        LEFT JOIN Caracteristicas c ON lc.CaracteristicaID = c.CaracteristicaID
        WHERE l.LoteID = @NuevoID;

    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE sp_lotes_crear
    @BloqueID      INT,
    @AreaVaras     DECIMAL(18,4),
    @Estado        VARCHAR(20) = 'Disponible',
    @FechaReserva  DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY

        IF NOT EXISTS (SELECT 1 FROM Bloques WHERE BloqueID = @BloqueID)
            THROW 50001, 'El bloque no existe.', 1;

        IF @AreaVaras IS NULL OR @AreaVaras <= 0
            THROW 50002, 'Faltan campos requeridos o son inválidos.', 1;

        -- Precio base = precio por vara * área
        DECLARE @PrecioBase DECIMAL(12,2) = @PrecioVara * @AreaVaras;

        /*-- Calcular porcentaje total según características
        DECLARE @Incremento DECIMAL(6,4) = 0;
        SET @Incremento = @Incremento + CASE WHEN @EsEsquina     = 1 THEN 0.05  ELSE 0 END;
        SET @Incremento = @Incremento + CASE WHEN @CercaParque   = 1 THEN 0.03  ELSE 0 END;
        SET @Incremento = @Incremento + CASE WHEN @CalleCerrada  = 1 THEN 0.02  ELSE 0 END;
        SET @Incremento = @Incremento + CASE WHEN @FrenteAvenida = 1 THEN 0.015 ELSE 0 END;

        -- Precio final aplicando incrementos
        DECLARE @PrecioFinal DECIMAL(12,2) = @PrecioBase * (1 + @Incremento);*/

        -- Insertar con NumeroLote temporal
        INSERT INTO Lotes (BloqueID, NumeroLote, AreaVaras, PrecioBase, PrecioFinal, Estado, FechaReserva, FechaVenta)
        VALUES (@BloqueID, 'L-0', @AreaVaras, @PrecioBase, @PrecioFinal, @Estado, @FechaReserva);

        DECLARE @NuevoID INT = SCOPE_IDENTITY();

        -- Actualizar NumeroLote con el ID generado
        UPDATE Lotes
        SET NumeroLote = 'L-0' + CAST(@NuevoID AS VARCHAR(10))
        WHERE LoteID = @NuevoID;

        SELECT
            LoteID        AS id,
            BloqueID      AS bloqueId,
            NumeroLote    AS numeroLote,
            AreaVaras     AS areaVaras,
            PrecioBase    AS precioBase,
            PrecioFinal   AS precioFinal,
            Estado        AS estado,
            FechaReserva  AS fechaReserva,
            FechaVenta    AS fechaVenta
        FROM Lotes
        WHERE LoteID = @NuevoID;

    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- Listar lotes (opcionalmente por bloque)
CREATE OR ALTER PROCEDURE sp_lotes_listar
    @bloqueId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        LoteID AS LoteID,
        b.Nombre AS Bloque,
        e.Nombre AS Etapa,
        p.Nombre AS Proyecto,
        NumeroLote AS NumeroLote,
        AreaVaras AS AreaVaras,
        PrecioBase AS PrecioBase,
        PrecioFinal AS PrecioFinal,
        l.Estado AS Estado
    FROM Lotes l
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    WHERE (@bloqueId IS NULL OR l.BloqueID = @bloqueId)
    ORDER BY NumeroLote ASC;
END
GO

USE IngenierosEnProceso
GO

-- Obtener lote por ID
CREATE OR ALTER PROCEDURE sp_lotes_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        l.LoteID AS LoteID,
        b.BloqueID AS BloqueID,
        b.Nombre AS Bloque,
        e.Nombre AS Etapa,
        p.Nombre AS Proyecto,
        NumeroLote AS NumeroLote,
        AreaVaras AS AreaVaras,
        l.Estado AS Estado,
        FechaReserva AS FechaReserva
        --lc.CaracteristicaID AS CaractetisticaID
    FROM Lotes l
    INNER JOIN Bloques b ON b.BloqueID = l.BloqueID
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    --INNER JOIN LoteCaracteristicas lc ON lc.LoteID = l.LoteID
    WHERE l.LoteID = @id;
END
GO

EXEC sp_lotes_obtener 7;
GO

-- Actualizar lote
CREATE OR ALTER PROCEDURE sp_lotes_actualizar
    @id INT,
    @BloqueID INT = NULL,
    @AreaVaras DECIMAL(18,4) = NULL,
    @Estado VARCHAR(20) = 'Disponible'
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF @Estado <> 'Disponible'
        BEGIN 
            SELECT 'Error: No puedes modificar un lote que no este disponible!' AS message, 0 AS success;
            RETURN;
        END 
        
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

        UPDATE Lotes
        SET
            BloqueID = COALESCE(@BloqueID, L.BloqueID),
            AreaVaras = COALESCE(@AreaVaras, AreaVaras),
            PrecioBase = (L.AreaVaras * e.PrecioVaraCuadrada),
            Estado = COALESCE(@Estado, Estado)
        FROM Lotes L
        INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
        INNER JOIN Etapas e ON B.EtapaID = e.EtapaID
        WHERE LoteID = @id AND Estado = 'Disponible';

        SELECT
            LoteID AS id,
            BloqueID AS bloqueId,
            NumeroLote AS numeroLote,
            AreaVaras AS areaVaras,
            PrecioBase AS precioBase,
            PrecioFinal AS precioFinal,
            Estado AS estado,
            FechaReserva AS fechaReserva,
            1 AS success
        FROM Lotes
        WHERE LoteID = @id;
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS message, 0 AS success;
    END CATCH
END
GO

--CREATE OR ALTER PROCEDURE sp_obtener_codigo_lote

-- Eliminar lote (soft delete)
CREATE OR ALTER PROCEDURE sp_lotes_eliminar
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
