USE IngenierosEnProceso
GO

-- Funciones Escalares para Dashboard
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

-- Pagos Pendientes (Cuotas sin pagar completamente)
CREATE OR ALTER FUNCTION dbo.fn_PagosPendientes()
RETURNS INT
AS
BEGIN
    DECLARE @Total INT;

    SELECT @Total = COUNT(DISTINCT CuotaID)
    FROM PlanPagos
    WHERE Estado IN ('Pendiente', 'Parcial');

    RETURN @Total;
END;
GO

-- Ingresos del Mes Actual (Total de pagos recibidos este mes)
CREATE OR ALTER FUNCTION dbo.fn_IngresosMesActual()
RETURNS DECIMAL(12,2)
AS
BEGIN
    DECLARE @Total DECIMAL(12,2);

    SELECT @Total = COALESCE(SUM(MontoRecibido), 0)
    FROM Pagos
    WHERE MONTH(FechaPago) = MONTH(GETDATE())
      AND YEAR(FechaPago) = YEAR(GETDATE());

    RETURN @Total;
END;
GO