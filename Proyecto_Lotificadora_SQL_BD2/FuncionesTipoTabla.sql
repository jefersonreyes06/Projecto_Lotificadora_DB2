USE IngenierosEnProceso
GO

-- 1. fn_plan_pagos: resumen del plan de pagos de una venta
CREATE OR ALTER FUNCTION dbo.fn_plan_pagos(@VentaID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        v.VentaID,
        v.MontoTotal AS monto_total,
        v.Prima AS prima,
        v.MontoFinanciado AS monto_financiado,
        v.AniosPlazo AS anios,
        v.TasaInteresAplicada AS tasa_interes,
        v.CuotaMensualEstimada AS cuota_mensual,
        v.Estado AS estado
    FROM Ventas v
    WHERE v.VentaID = @VentaID
);
GO

-- 2. fn_tabla_amortizacion: tabla de amortización de cuotas de pago
CREATE OR ALTER FUNCTION dbo.fn_tabla_amortizacion(@VentaID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        p.CuotaID AS id,
        p.NumeroCuota AS numero_cuota,
        p.FechaVencimiento AS fecha_vencimiento,
        p.MontoCuota AS cuota_total,
        p.Capital AS capital,
        p.Interes AS interes,
        p.SaldoPendiente AS saldo,
        p.Estado AS estado
    FROM PlanPagos p
    WHERE p.VentaID = @VentaID
    ORDER BY p.NumeroCuota
);
GO

-- 3. fn_tabla_pagos_pendientes: cuotas pendientes por venta
CREATE OR ALTER FUNCTION dbo.fn_tabla_pagos_pendientes(@VentaID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        p.CuotaID AS id,
        p.NumeroCuota AS numero_cuota,
        p.FechaVencimiento AS fecha_vencimiento,
        p.MontoCuota AS cuota_total,
        p.SaldoPendiente AS saldo_pendiente,
        p.Estado AS estado,
        DATEDIFF(DAY, p.FechaVencimiento, GETDATE()) AS dias_mora
    FROM PlanPagos p
    WHERE p.VentaID = @VentaID
      AND p.Estado <> 'Pagada'
    ORDER BY p.FechaVencimiento
);
GO

-- 4. fn_lotes_por_etapa: lote por etapa con precio y estado
CREATE OR ALTER FUNCTION dbo.fn_lotes_por_etapa(@EtapaID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        l.LoteID AS id,
        l.NumeroLote AS codigo_lote,
        b.Nombre AS bloque,
        l.AreaVaras AS area_m2,
        l.PrecioFinal AS valor_total,
        l.Estado AS estado,
        l.FechaReserva,
        l.FechaVenta
    FROM Lotes l
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    WHERE e.EtapaID = @EtapaID
);
GO

-- 5. fn_clientes_por_proyecto: clientes que tienen ventas en un proyecto
CREATE OR ALTER FUNCTION dbo.fn_clientes_por_proyecto(@ProyectoID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        c.NombreCompleto AS nombre_completo,
        c.DNI AS dni,
        c.Telefono AS telefono,
        CONCAT(b.Nombre, ' - ', l.NumeroLote) AS lote,
        v.TipoVenta AS tipo_venta,
        CASE
            WHEN EXISTS(
                SELECT 1
                FROM PlanPagos pp
                WHERE pp.VentaID = v.VentaID
                  AND pp.Estado <> 'Pagada'
            ) THEN 'En mora'
            ELSE 'Al día'
        END AS estado_cuenta,
        ISNULL(
            (
                SELECT COUNT(*)
                FROM PlanPagos pp
                WHERE pp.VentaID = v.VentaID
                  AND pp.Estado <> 'Pagada'
            ),
            0
        ) AS cuotas_pendientes
    FROM Clientes c
    INNER JOIN Ventas v ON c.ClienteID = v.ClienteID
    INNER JOIN Lotes l ON v.LoteID = l.LoteID
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    WHERE e.ProyectoID = @ProyectoID
);
GO
