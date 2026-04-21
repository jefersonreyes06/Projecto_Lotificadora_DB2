-- ════════════════════════════════════════
-- ProcedimientosAlmacenadosProyectos.sql
-- ════════════════════════════════════════

USE LotificadoraDB;
GO

-- ════════════════════════════════════════
-- LISTAR PROYECTOS
-- ════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_proyectos_listar
    @proyectoId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @proyectoId IS NOT NULL
    BEGIN
        SELECT
            ProyectoID,
            Nombre,
            UbicacionLegal,
            MaxAniosFinanciamiento,
            FechaCreacion,
            Estado
        FROM Proyectos
        WHERE ProyectoID = @proyectoId AND Estado = 'Activo';
    END
    ELSE
    BEGIN
        SELECT
            ProyectoID,
            Nombre,
            UbicacionLegal,
            MaxAniosFinanciamiento,
            FechaCreacion,
            Estado
        FROM Proyectos
        WHERE Estado = 'Activo'
        ORDER BY Nombre ASC;
    END
END;
GO

-- ════════════════════════════════════════
-- OBTENER PROYECTO POR ID
-- ════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_proyectos_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ProyectoID,
        Nombre,
        UbicacionLegal,
        MaxAniosFinanciamiento,
        FechaCreacion,
        Estado
    FROM Proyectos
    WHERE ProyectoID = @id;
END;
GO

-- ════════════════════════════════════════
-- CREAR PROYECTO
-- ════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_proyectos_crear
    @Nombre NVARCHAR(100),
    @UbicacionLegal NVARCHAR(200),
    @MaxAniosFinanciamiento INT = 20,
    @Estado NVARCHAR(20) = 'Activo'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que no exista un proyecto con el mismo nombre
    IF EXISTS (SELECT 1 FROM Proyectos WHERE Nombre = @Nombre AND Estado = 'Activo')
    BEGIN
        RAISERROR('Ya existe un proyecto con este nombre', 16, 1);
        RETURN;
    END

    -- Validar que MaxAniosFinanciamiento sea positivo
    IF @MaxAniosFinanciamiento <= 0
    BEGIN
        RAISERROR('Los años máximos de financiamiento deben ser mayor a cero', 16, 1);
        RETURN;
    END

    INSERT INTO Proyectos (Nombre, UbicacionLegal, MaxAniosFinanciamiento, Estado)
    VALUES (@Nombre, @UbicacionLegal, @MaxAniosFinanciamiento, @Estado);

    SELECT SCOPE_IDENTITY() AS ProyectoID;
END;
GO

-- ════════════════════════════════════════
-- ACTUALIZAR PROYECTO
-- ════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_proyectos_actualizar
    @id INT,
    @Nombre NVARCHAR(100),
    @UbicacionLegal NVARCHAR(200),
    @MaxAniosFinanciamiento INT,
    @Estado NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el proyecto existe
    IF NOT EXISTS (SELECT 1 FROM Proyectos WHERE ProyectoID = @id)
    BEGIN
        RAISERROR('El proyecto especificado no existe', 16, 1);
        RETURN;
    END

    -- Validar que no exista otro proyecto con el mismo nombre
    IF EXISTS (SELECT 1 FROM Proyectos WHERE Nombre = @Nombre AND Estado = 'Activo' AND ProyectoID != @id)
    BEGIN
        RAISERROR('Ya existe otro proyecto con este nombre', 16, 1);
        RETURN;
    END

    -- Validar que MaxAniosFinanciamiento sea positivo
    IF @MaxAniosFinanciamiento <= 0
    BEGIN
        RAISERROR('Los años máximos de financiamiento deben ser mayor a cero', 16, 1);
        RETURN;
    END

    UPDATE Proyectos
    SET
        Nombre = @Nombre,
        UbicacionLegal = @UbicacionLegal,
        MaxAniosFinanciamiento = @MaxAniosFinanciamiento,
        Estado = @Estado
    WHERE ProyectoID = @id;

    SELECT @id AS ProyectoID;
END;
GO

-- ════════════════════════════════════════
-- ELIMINAR PROYECTO
-- ════════════════════════════════════════
CREATE OR ALTER PROCEDURE sp_proyectos_eliminar
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el proyecto existe
    IF NOT EXISTS (SELECT 1 FROM Proyectos WHERE ProyectoID = @id)
    BEGIN
        RAISERROR('El proyecto especificado no existe', 16, 1);
        RETURN;
    END

    -- Validar que el proyecto no tenga etapas asociadas
    IF EXISTS (SELECT 1 FROM Etapas WHERE ProyectoID = @id)
    BEGIN
        RAISERROR('No se puede eliminar el proyecto porque tiene etapas asociadas', 16, 1);
        RETURN;
    END

    -- Validar que el proyecto no tenga bloques asociados (a través de etapas)
    IF EXISTS (
        SELECT 1 FROM Bloques B
        INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
        WHERE E.ProyectoID = @id
    )
    BEGIN
        RAISERROR('No se puede eliminar el proyecto porque tiene bloques asociados', 16, 1);
        RETURN;
    END

    -- Validar que el proyecto no tenga lotes asociados (a través de bloques y etapas)
    IF EXISTS (
        SELECT 1 FROM Lotes L
        INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
        INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
        WHERE E.ProyectoID = @id
    )
    BEGIN
        RAISERROR('No se puede eliminar el proyecto porque tiene lotes asociados', 16, 1);
        RETURN;
    END

    -- Si pasa todas las validaciones, eliminar el proyecto
    DELETE FROM Proyectos WHERE ProyectoID = @id;
    SELECT @id AS ProyectoID;
END;
GO