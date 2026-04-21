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

-- NUEVAS FUNCIONES DE TIPO TABLA

-- 1. fn_lotes_disponibles_por_proyecto: Lotes disponibles en un proyecto específico
CREATE OR ALTER FUNCTION dbo.fn_lotes_disponibles_por_proyecto(@ProyectoID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        l.LoteID AS id,
        l.NumeroLote AS codigo_lote,
        b.Nombre AS bloque,
        e.Nombre AS etapa,
        l.AreaVaras AS area_m2,
        l.PrecioFinal AS valor_total,
        l.Estado AS estado
    FROM Lotes l
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
    WHERE e.ProyectoID = @ProyectoID
      AND l.Estado = 'Disponible'
    ORDER BY e.Nombre, b.Nombre, l.NumeroLote
);
GO

-- 2. fn_historial_pagos_cliente: Historial de pagos realizados por un cliente
CREATE OR ALTER FUNCTION dbo.fn_historial_pagos_cliente(@ClienteID INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        p.PagoID AS id,
        p.FechaPago AS fecha_pago,
        p.MontoRecibido AS monto_pagado,
        p.MetodoPago AS metodo_pago,
        pp.NumeroCuota AS numero_cuota,
        pp.MontoCuota AS cuota_total,
        pp.SaldoPendiente AS saldo_anterior,
        v.VentaID AS venta_id,
        CONCAT(b.Nombre, ' - ', l.NumeroLote) AS lote
    FROM Pagos p
    INNER JOIN PlanPagos pp ON p.CuotaID = pp.CuotaID
    INNER JOIN Ventas v ON pp.VentaID = v.VentaID
    INNER JOIN Lotes l ON v.LoteID = l.LoteID
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    WHERE v.ClienteID = @ClienteID
    ORDER BY p.FechaPago DESC
);
GO

-- 3. fn_cuotas_vencidas: Todas las cuotas vencidas en el sistema
CREATE OR ALTER FUNCTION dbo.fn_cuotas_vencidas()
RETURNS TABLE
AS
RETURN
(
    SELECT
        pp.CuotaID AS id,
        pp.NumeroCuota AS numero_cuota,
        pp.FechaVencimiento AS fecha_vencimiento,
        pp.MontoCuota AS cuota_total,
        pp.SaldoPendiente AS saldo_pendiente,
        DATEDIFF(DAY, pp.FechaVencimiento, GETDATE()) AS dias_mora,
        c.NombreCompleto AS cliente,
        CONCAT(b.Nombre, ' - ', l.NumeroLote) AS lote,
        v.VentaID AS venta_id
    FROM PlanPagos pp
    INNER JOIN Ventas v ON pp.VentaID = v.VentaID
    INNER JOIN Clientes c ON v.ClienteID = c.ClienteID
    INNER JOIN Lotes l ON v.LoteID = l.LoteID
    INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
    WHERE pp.Estado = 'Pendiente'
      AND pp.FechaVencimiento < GETDATE()
    ORDER BY pp.FechaVencimiento ASC
);
GO

-- 4. fn_ventas_por_mes: Número de ventas por mes en un año dado
CREATE OR ALTER FUNCTION dbo.fn_ventas_por_mes(@Anio INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        MONTH(v.FechaVenta) AS mes,
        COUNT(*) AS total_ventas,
        SUM(CASE WHEN v.TipoVenta = 'Contado' THEN 1 ELSE 0 END) AS ventas_contado,
        SUM(CASE WHEN v.TipoVenta = 'Credito' THEN 1 ELSE 0 END) AS ventas_credito,
        SUM(v.MontoTotal) AS monto_total
    FROM Ventas v
    WHERE YEAR(v.FechaVenta) = @Anio
      AND v.Estado <> 'Cancelada'
    GROUP BY MONTH(v.FechaVenta)
    ORDER BY MONTH(v.FechaVenta)
);
GO

-- 5. fn_estadisticas_lotes_por_estado: Conteo de lotes por estado
CREATE OR ALTER FUNCTION dbo.fn_estadisticas_lotes_por_estado()
RETURNS TABLE
AS
RETURN
(
    SELECT
        l.Estado AS estado,
        COUNT(*) AS cantidad,
        SUM(l.AreaVaras) AS area_total,
        SUM(l.PrecioFinal) AS valor_total
    FROM Lotes l
    GROUP BY l.Estado
    ORDER BY COUNT(*) DESC
);
GO
