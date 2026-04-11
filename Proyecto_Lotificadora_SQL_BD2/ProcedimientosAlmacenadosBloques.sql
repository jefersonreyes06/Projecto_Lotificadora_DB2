-- Asegúrate de estar en la base de datos correcta
-- USE IngenierosEnProceso  -- Cambia esto al nombre de tu BD si es diferente
GO

-- =====================================================
-- STORED PROCEDURES PARA BLOQUES
-- =====================================================

-- Crear nuevo bloque
CREATE PROCEDURE sp_bloques_crear
    @EtapaID INT,
    @Nombre VARCHAR(50),
    @AreaTotalVaras DECIMAL(18,4),
    @Estado VARCHAR(20) = 'Disponible'
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
        IF @Nombre IS NULL OR @Nombre = '' 
            OR @AreaTotalVaras IS NULL OR @AreaTotalVaras <= 0
        BEGIN
            SELECT 'Error: Faltan campos requeridos o son inválidos' AS message, 0 AS success
            RETURN
        END
        
        -- Insertar el bloque
        INSERT INTO Bloques (EtapaID, Nombre, AreaTotalVaras, Estado)
        VALUES (@EtapaID, @Nombre, @AreaTotalVaras, @Estado)
        
        -- Retornar el bloque creado
        SELECT 
            BloqueID AS id,
            EtapaID AS etapaId,
            Nombre AS nombre,
            AreaTotalVaras AS areaTotalVaras,
            Estado AS estado,
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
CREATE PROCEDURE sp_bloques_listar
    @etapaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BloqueID AS id,
        EtapaID AS etapaId,
        Nombre AS nombre,
        AreaTotalVaras AS areaTotalVaras,
        Estado AS estado
    FROM Bloques
    WHERE 
        (@etapaId IS NULL OR EtapaID = @etapaId)
        AND Estado != 'Eliminado'
    ORDER BY Nombre ASC
END
GO

-- Obtener bloque por ID
CREATE PROCEDURE sp_bloques_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BloqueID AS id,
        EtapaID AS etapaId,
        Nombre AS nombre,
        AreaTotalVaras AS areaTotalVaras,
        Estado AS estado
    FROM Bloques
    WHERE BloqueID = @id
END
GO

-- Actualizar bloque
CREATE PROCEDURE sp_bloques_actualizar
    @id INT,
    @Nombre VARCHAR(50) = NULL,
    @AreaTotalVaras DECIMAL(18,4) = NULL,
    @Estado VARCHAR(20) = NULL
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
        
        -- Validar datos si se proveen
        IF (@AreaTotalVaras IS NOT NULL AND @AreaTotalVaras <= 0)
        BEGIN
            SELECT 'Error: El área debe ser mayor a 0' AS message, 0 AS success
            RETURN
        END
        
        -- Actualizar solo los campos proporcionados
        UPDATE Bloques
        SET 
            Nombre = COALESCE(@Nombre, Nombre),
            AreaTotalVaras = COALESCE(@AreaTotalVaras, AreaTotalVaras),
            Estado = COALESCE(@Estado, Estado)
        WHERE BloqueID = @id
        
        -- Retornar el bloque actualizado
        SELECT 
            BloqueID AS id,
            EtapaID AS etapaId,
            Nombre AS nombre,
            AreaTotalVaras AS areaTotalVaras,
            Estado AS estado,
            1 AS success
        FROM Bloques
        WHERE BloqueID = @id
        
    END TRY
    BEGIN CATCH
        SELECT 
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success
    END CATCH
END
GO

-- Eliminar bloque
CREATE PROCEDURE sp_bloques_eliminar
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
