USE IngenierosEnProceso
GO

-- Creacion de Procedimientos almacenados para listas

CREATE OR ALTER PROCEDURE sp_proyectos_listar
    @ProyectoID INT = NULL
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
    WHERE @ProyectoID IS NULL OR ProyectoID = @ProyectoID
    ORDER BY Nombre;
END;

Exec sp_proyectos_listar

GO

CREATE OR ALTER PROCEDURE sp_etapas_listar
    @ProyectoID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        e.EtapaID,
        e.Nombre,
        p.Nombre,
        AreaTotalVaras,
        PrecioVaraCuadrada,
        TasaInteresAnual,
        e.Estado
    FROM Etapas e
    INNER JOIN Proyectos p ON e.ProyectoID  = p.ProyectoID
    WHERE @ProyectoID IS NULL OR e.ProyectoID = @ProyectoID
    ORDER BY e.Nombre;
END;

Exec sp_etapas_listar

GO

CREATE OR ALTER PROCEDURE sp_bloques_listar
    @EtapaID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        BloqueID,
        EtapaID,
        Nombre,
        AreaTotalVaras,
        Estado
    FROM Bloques
    WHERE @EtapaID IS NULL OR EtapaID = @EtapaID
    ORDER BY Nombre;
END;

Exec sp_bloques_listar
GO

CREATE OR ALTER PROCEDURE sp_clientes_listar_dni
    @dni varchar = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        NombreCompleto,
        DNI,
        Ocupacion,
        NombreEmpresa,
        CapacidadPago,
        Departamento,
        Direccion
    FROM Clientes
    WHERE @dni IS NULL OR DNI = @dni
    ORDER BY NombreCompleto;
END;
GO