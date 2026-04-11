-- ════════════════════════════════════════
-- Vistas.sql
-- ════════════════════════════════════════

USE LotificadoraDB;
GO

-- ════════════════════════════════════════
-- VISTA: LOTES DISPONIBLES
-- ════════════════════════════════════════
CREATE OR ALTER VIEW vw_lotes_disponibles
AS
SELECT
    -- Datos del lote
    L.LoteID,
    L.NumeroLote AS codigo_lote,
    CAST(L.AreaVaras AS DECIMAL(10,2)) AS area_m2,
    CAST(L.PrecioBase AS DECIMAL(18,2)) AS precio_base,
    CAST(L.PrecioFinal AS DECIMAL(18,2)) AS precio_final,
    L.Estado AS estado,
    L.FechaReserva,
    L.FechaVenta,

    -- Datos del bloque
    B.Nombre AS bloque,

    -- Datos de la etapa
    E.Nombre AS etapa,

    -- Datos del proyecto
    P.Nombre AS proyecto,

    -- IDs para filtros
    P.ProyectoID AS proyectoId,
    E.EtapaID AS etapaId,
    B.BloqueID AS bloqueId

FROM Lotes L
INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
INNER JOIN Proyectos P ON E.ProyectoID = P.ProyectoID
WHERE L.Estado IN ('Disponible', 'Reservado'); -- Solo mostrar lotes disponibles o reservados
GO