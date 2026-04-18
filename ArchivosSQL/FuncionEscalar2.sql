USE IngenierosEnProceso
GO

-- Funciones Escalares
-- Proyectos Activos
CREATE OR ALTER FUNCTION dbo.fn_ContarProyectosActivos()
RETURNS INT
AS
BEGIN
    DECLARE @Total INT;

    SELECT @Total = COUNT(DISTINCT ProyectoID)
    FROM Proyectos
    WHERE Estado = 'Activo';

    RETURN @Total;
END;
GO
-- Ventas del Mes Actual
CREATE OR ALTER FUNCTION dbo.fn_VentasMesActual()
RETURNS INT
AS
BEGIN
    DECLARE @Total INT;

    SELECT @Total = COUNT(DISTINCT VentaID)
    FROM Ventas
    WHERE MONTH(FechaVenta) = MONTH(GETDATE())
      AND YEAR(FechaVenta) = YEAR(GETDATE());

    RETURN @Total;
END;
GO
-- Lotes Disponibles
CREATE OR ALTER FUNCTION dbo.fn_LotesDisponibles()
RETURNS INT
AS
BEGIN
    DECLARE @Total INT;

    SELECT @Total = COUNT(DISTINCT LoteID)
    FROM Lotes
    WHERE Estado = 'Disponible';

    RETURN @Total;
END;
GO
-- 