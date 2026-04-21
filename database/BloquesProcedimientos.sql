-- Asegúrate de estar en la base de datos correcta
-- USE IngenierosEnProceso  -- Cambia esto al nombre de tu BD si es diferente
USE IngenierosEnProceso
GO

-- =====================================================
-- STORED PROCEDURES PARA BLOQUES
-- =====================================================

-- Crear nuevo bloque

EXEC sp_help 'sp_bloques_crear';
GO

CREATE OR ALTER PROCEDURE sp_bloques_crear
    @EtapaID INT,
    @Bloque VARCHAR(50),
    @AreaTotalVaras DECIMAL(18,4)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que la etapa existe
        IF NOT EXISTS (SELECT 1 FROM Etapas WHERE EtapaID = @EtapaID)
        BEGIN
            SELECT 'Error: La etapa no existe' AS message, 0 AS success
            RETURN
        END
        
        -- Validar campos requeridos
        IF @Bloque IS NULL OR @Bloque = '' 
            OR @AreaTotalVaras IS NULL OR @AreaTotalVaras <= 0
        BEGIN
            SELECT 'Error: Faltan campos requeridos o son inválidos' AS message, 0 AS success
            RETURN
        END
        
        -- Insertar el bloque
        INSERT INTO Bloques (EtapaID, Nombre, AreaTotalVaras)
        VALUES (@EtapaID, @Bloque, @AreaTotalVaras)
        
        -- Retornar el bloque creado
        SELECT 
            BloqueID AS BloqueID,
            EtapaID AS EtapaID,
            Nombre AS Bloque,
            AreaTotalVaras AS AreaTotalVaras,
            1 AS success
        FROM Bloques
        WHERE BloqueID = SCOPE_IDENTITY()
        
    END TRY
    BEGIN CATCH
        SELECT 
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success
    END CATCH
END
GO

-- Listar bloques por etapa (con búsqueda opcional)
CREATE OR ALTER PROCEDURE sp_bloques_listar
    @etapaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BloqueID AS BloqueID,
        b.EtapaID AS EtapaID,
        b.Nombre AS Bloque,
        e.Nombre AS Etapa,
        p.Nombre AS Proyecto,
        b.AreaTotalVaras AS AreaTotalVaras
    FROM Bloques b
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    WHERE 
        @etapaId IS NULL OR b.EtapaID = @etapaId
    ORDER BY b.Nombre, e.Nombre, p.Nombre ASC
END
GO

USE IngenierosEnProceso
GO

-- Obtener bloque por ID
CREATE OR ALTER PROCEDURE sp_bloques_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        b.BloqueID AS BloqueID,
        e.EtapaID AS EtapaID,
        e.Nombre AS Etapa,
        b.Nombre AS Bloque,
        p.Nombre AS Proyecto,
        b.AreaTotalVaras AS areaTotalVaras
    FROM Bloques b
    INNER JOIN Etapas e ON e.EtapaID = b.EtapaID
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    WHERE b.BloqueID = @id
END
GO

-- Actualizar bloque
CREATE OR ALTER PROCEDURE sp_bloques_actualizar
    @BloqueID INT,
    @Bloque VARCHAR(50) = NULL,
    @AreaTotalVaras DECIMAL(18,4) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el bloque existe
        IF NOT EXISTS (SELECT 1 FROM Bloques WHERE BloqueID = @BloqueID)
        BEGIN
            SELECT 'Error: Bloque no encontrado' AS message, 0 AS success
            RETURN
        END
        
        -- Validar datos si se proveen
        IF (@AreaTotalVaras IS NOT NULL AND @AreaTotalVaras <= 0)
        BEGIN
            SELECT 'Error: El área debe ser mayor a 0' AS message, 0 AS success
            RETURN
        END
        
        -- Actualizar solo los campos proporcionados
        UPDATE Bloques
        SET 
            Nombre = COALESCE(@Bloque, Nombre),
            AreaTotalVaras = COALESCE(@AreaTotalVaras, AreaTotalVaras)
        WHERE BloqueID = @BloqueID;
        
        -- Retornar el bloque actualizado
        SELECT 
            BloqueID AS BloqueID,
            EtapaID AS EtapaID,
            Nombre AS Bloque,
            AreaTotalVaras AS AreaTotalVaras,
            1 AS success
        FROM Bloques
        WHERE BloqueID = @BloqueID;
        
    END TRY
    BEGIN CATCH
        SELECT 
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success
    END CATCH
END
GO

-- Eliminar bloque
CREATE OR ALTER PROCEDURE sp_bloques_eliminar
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el bloque existe
        IF NOT EXISTS (SELECT 1 FROM Bloques WHERE BloqueID = @id)
        BEGIN
            SELECT 'Error: Bloque no encontrado' AS message, 0 AS success
            RETURN
        END
        
        -- Verificar que no hay lotes asociados
        IF EXISTS (SELECT 1 FROM Lotes WHERE BloqueID = @id AND Estado != 'Eliminado')
        BEGIN
            SELECT 'Error: No se puede eliminar un bloque con lotes asociados' AS message, 0 AS success
            RETURN
        END
        
        -- Cambiar estado a Eliminado en lugar de eliminar (soft delete)
        UPDATE Bloques
        SET Estado = 'Eliminado'
        WHERE BloqueID = @id
        
        SELECT 
            'Bloque eliminado correctamente' AS message,
            1 AS success,
            @id AS deletedId
        
    END TRY
    BEGIN CATCH
        SELECT 
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success
    END CATCH
END
GO
