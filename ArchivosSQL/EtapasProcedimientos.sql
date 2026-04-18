-- Etapas
CREATE OR ALTER PROCEDURE sp_etapas_listar
    @etapaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        e.EtapaID,
        e.Nombre AS Etapa,
        p.Nombre AS Proyecto,
        p.ProyectoID AS ProyectoID,
        e.AreaTotalVaras,
        e.PorcentajeAreasVerdes,
        e.PorcentajeAreasComunes,
        e.PrecioVaraCuadrada,       -- Precio por v²
        e.TasaInteresAnual -- Tasa %
        --e.Estado
    FROM Etapas e
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    WHERE @etapaId IS NULL OR e.EtapaID = @etapaId
    ORDER BY p.Nombre, e.Nombre;
END;
GO

Select * From Etapas
GO
-- Crear Etapa
CREATE OR ALTER PROCEDURE sp_etapas_crear
    @ProyectoID              INT,
    @Nombre                  VARCHAR(100),
    @AreaTotalVaras          DECIMAL(12,2),
    @PorcentajeAreasVerdes   DECIMAL(5,2),
    @PorcentajeAreasComunes  DECIMAL(5,2),
    @PrecioVaraCuadrada      DECIMAL(12,2),
    @TasaInteresAnual        DECIMAL(5,2)
    --@Estado                  VARCHAR(20)   = 'Activo'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que el proyecto existe y está activo
    IF NOT EXISTS (SELECT 1 FROM Proyectos WHERE ProyectoID = @ProyectoID AND Estado = 'Activo')
        THROW 50001, 'El proyecto no existe o no está activo.', 1;

    INSERT INTO Etapas (
        ProyectoID, Nombre, AreaTotalVaras, PorcentajeAreasVerdes,
        PorcentajeAreasComunes, PrecioVaraCuadrada, TasaInteresAnual
    )
    VALUES (
        @ProyectoID, @Nombre, @AreaTotalVaras, @PorcentajeAreasVerdes,
        @PorcentajeAreasComunes, @PrecioVaraCuadrada, @TasaInteresAnual
    );

    IF ((@PorcentajeAreasVerdes + @PorcentajeAreasComunes) > 25)
        Throw 'El Porcentaje de areas verdes y areas comunes no deben superar el 25%'

    SELECT * FROM Etapas WHERE EtapaID = SCOPE_IDENTITY();
END;
GO






CREATE OR ALTER PROCEDURE sp_etapas_crear
    @ProyectoID               INT,
    @Nombre                   VARCHAR(100),
    @AreaTotalVaras           DECIMAL(12,2),
    @PorcentajeAreasVerdes    DECIMAL(5,2),
    @PorcentajeAreasComunes   DECIMAL(5,2),
    @PrecioVaraCuadrada       DECIMAL(12,2),
    @TasaInteresAnual         DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validación de Negocio: Verificar proyecto activo
    IF NOT EXISTS (SELECT 1 FROM Proyectos WHERE ProyectoID = @ProyectoID AND Estado = 'Activo')
    BEGIN
        THROW 50001, 'El proyecto no existe o no está activo.', 1;
    END

    -- 2. Validación de Regla: Suma de áreas antes de insertar
    IF (@PorcentajeAreasVerdes + @PorcentajeAreasComunes) > 25
    BEGIN
        -- El error 50000 es el estándar para errores de usuario
        THROW 50002, 'La suma de áreas verdes y comunes no debe superar el 25%.', 1;
    END

    -- 3. Transacción: Asegura integridad si hubiera más inserts
    BEGIN TRY
        BEGIN TRANSACTION;

            INSERT INTO Etapas (
                ProyectoID, Nombre, AreaTotalVaras, PorcentajeAreasVerdes,
                PorcentajeAreasComunes, PrecioVaraCuadrada, TasaInteresAnual
            )
            VALUES (
                @ProyectoID, @Nombre, @AreaTotalVaras, @PorcentajeAreasVerdes,
                @PorcentajeAreasComunes, @PrecioVaraCuadrada, @TasaInteresAnual
            );

            -- Retornar el registro recién creado
            SELECT * FROM Etapas WHERE EtapaID = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        -- Relanzar el error para que la aplicación lo reciba
        THROW;
    END CATCH
END;
GO



USE IngenierosEnProceso
GO


CREATE OR ALTER PROCEDURE sp_etapas_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        EtapaID,
        ProyectoID,
        Nombre,
        AreaTotalVaras,
        PorcentajeAreasVerdes,
        PorcentajeAreasComunes,
        PrecioVaraCuadrada,
        TasaInteresAnual
    FROM Etapas
    WHERE EtapaID = @id;
END;
GO

CREATE OR ALTER PROCEDURE sp_etapas_actualizar
    @EtapaID                 INT,
    @ProyectoID              INT,
    @Nombre                  VARCHAR(100),
    @AreaTotalVaras          DECIMAL(12,2),
    @PorcentajeAreasVerdes   DECIMAL(5,2)  = NULL,
    @PorcentajeAreasComunes  DECIMAL(5,2)  = NULL,
    @PrecioVaraCuadrada      DECIMAL(12,2) = NULL,
    @TasaInteresAnual        DECIMAL(5,2)  = NULL
    --@Estado                  VARCHAR(20)   = 'Activo'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que la etapa existe
    IF NOT EXISTS (SELECT 1 FROM Etapas WHERE EtapaID = @EtapaID)
        THROW 50001, 'La etapa no existe.', 1;

    -- Validar que el proyecto existe y está activo
    IF NOT EXISTS (SELECT 1 FROM Proyectos WHERE ProyectoID = @ProyectoID AND Estado = 'Activo')
        THROW 50002, 'El proyecto no existe o no está activo.', 1;

    UPDATE Etapas
    SET
        ProyectoID              = @ProyectoID,
        Nombre                  = @Nombre,
        AreaTotalVaras          = @AreaTotalVaras,
        PorcentajeAreasVerdes   = @PorcentajeAreasVerdes,
        PorcentajeAreasComunes  = @PorcentajeAreasComunes,
        PrecioVaraCuadrada      = @PrecioVaraCuadrada,
        TasaInteresAnual        = @TasaInteresAnual
    WHERE EtapaID = @EtapaID;

    SELECT * FROM Etapas WHERE EtapaID = @EtapaID;
END;
GO

Select * From Etapas