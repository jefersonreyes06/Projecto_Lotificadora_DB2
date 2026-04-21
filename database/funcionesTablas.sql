CREATE OR ALTER VIEW vw_ocupacion_lotes AS
SELECT
    e.EtapaID,
    e.Nombre AS NombreEtapa,
    p.ProyectoID,
    p.Nombre AS NombreProyecto,
    COUNT(CASE WHEN l.Estado = 'Disponible' THEN 1 END) AS LotesDisponibles,
    COUNT(CASE WHEN l.Estado = 'En Proceso' THEN 1 END) AS LotesEnProceso,
    COUNT(CASE WHEN l.Estado = 'Vendido' THEN 1 END) AS LotesVendidos,
    COUNT(*) AS TotalLotes
FROM Lotes AS l
INNER JOIN Bloques AS b ON l.BloqueID = b.BloqueID
INNER JOIN Etapas AS e ON b.EtapaID = e.EtapaID
INNER JOIN Proyectos AS p ON e.ProyectoID = p.ProyectoID
GROUP BY e.EtapaID, e.Nombre, p.ProyectoID, p.Nombre;
GO
-- =====================================================
-- VISTA: RESUMEN EJECUTIVO DE PROYECTOS
-- =====================================================
CREATE OR ALTER VIEW vw_resumen_proyectos AS
SELECT
    p.ProyectoID,
    p.Nombre AS NombreProyecto,
    COUNT(DISTINCT e.EtapaID) AS TotalEtapas,
    COUNT(DISTINCT b.BloqueID) AS TotalBloques,
    COUNT(l.LoteID) AS TotalLotes,
    SUM(CASE WHEN l.Estado = 'Vendido' THEN l.PrecioFinal ELSE 0 END) AS TotalIngresos,
    AVG(CASE WHEN l.Estado = 'Vendido' THEN l.PrecioFinal ELSE NULL END) AS PrecioPromedioLotesVendidos
FROM Proyectos p
LEFT JOIN Etapas e ON p.ProyectoID = e.ProyectoID
LEFT JOIN Bloques b ON e.EtapaID = b.EtapaID
LEFT JOIN Lotes l ON b.BloqueID = l.BloqueID
GROUP BY p.ProyectoID, p.Nombre;
GO

USE IngenierosEnProceso;
GO
SELECT * FROM fn_plan_pago_cliente (1033);

CREATE OR ALTER FUNCTION fn_plan_pago_cliente
(
    --@ClienteID INT,
    @VentaID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        p.CuotaID,
        v.VentaID AS VentaID,
        p.NumeroCuota,
        p.FechaVencimiento,
        p.MontoCuota,
        --p.SaldoPendiente,
        p.Estado AS EstadoCuota,
        v.ClienteID,
        v.MontoTotal,
        v.Estado AS EstadoVenta
    FROM PlanPagos p
    INNER JOIN Ventas v ON v.VentaID = p.VentaID
    WHERE p.VentaID = @VentaID AND ClienteID = v.ClienteID
);
