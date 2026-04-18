USE IngenierosEnProceso
GO

CREATE OR ALTER PROCEDURE sp_buscar_numero_lote
	@NumeroLote VARCHAR(30)
AS
BEGIN
	DECLARE @Estado VARCHAR(30);

	SELECT @Estado = Estado
	FROM Lotes
	WHERE NumeroLote = @NumeroLote;

	IF @Estado = 'Vendido'
	BEGIN
		DECLARE @Mensaje VARCHAR(200);
		SET @Mensaje = 'El lote con número ' + @NumeroLote + ' ya fue vendido.';
		THROW 50001, @Mensaje, 1;
	END
	ELSE
	BEGIN
		DECLARE @LoteID INT;

		SELECT 
			TOP 1
			@LoteID = LoteID
		FROM Lotes
		WHERE NumeroLote = @NumeroLote;

		DECLARE @VentaID INT;
		SELECT 
			TOP 1
			@VentaID = VentaID
		FROM Ventas
		WHERE LoteID = @LoteID;

		DECLARE @MontoCuota DECIMAL(12,2);

		SELECT 
			TOP 1
			@MontoCuota = MontoCuota
		FROM PlanPagos p
		INNER JOIN Ventas v ON p.VentaID = v.VentaID
		WHERE v.VentaID = @VentaID;

		SELECT 
		--*,
		v.VentaID,
		c.ClienteID,
		c.NombreCompleto,
		c.DNI,
		l.NumeroLote,
		l.LoteID,
		v.TipoVenta,
		v.Estado AS EstadoVenta,
		l.Estado AS EstadoLote,
		v.MontoTotal,

		@MontoCuota AS MontoCuota,
		cp.CuotasPendientes AS CuotasPendientes,
		COALESCE(cp.MontoPendiente, 0) AS MontoPendiente,
		cr.CuotasRestantes AS CuotasRestantes,
		cr.SaldoPendiente AS SaldoPendiente,
		cpp.SaldoPagado AS SaldoPagado,
		cpp.CuotasPagadas AS CuotasPagadas
		FROM Ventas v
		INNER JOIN Lotes l ON l.LoteID = v.LoteID
		INNER JOIN Clientes c ON c.ClienteID = v.ClienteID
		--INNER JOIN PlanPagos p ON p.VentaID = v.VentaID
		OUTER APPLY dbo.fn_CuotasPendientesByVenta(v.VentaID) cp
		OUTER APPLY dbo.fn_CuotasRestantesByVenta(v.VentaID) cr
		OUTER APPLY	dbo.fn_CuotasPagadasByVenta(v.VentaID) cpp
		WHERE l.NumeroLote = @NumeroLote
	END
END

EXEC sp_buscar_numero_lote 'L-9'
--GO


--- ELIMINAR EN FUTURO
/*CREATE OR ALTER FUNCTION fn_CuotasPendientesByNLote
(
    @NumeroLote VARCHAR(30)
)
RETURNS TABLE
AS
RETURN
(
    SELECT
		p.CuotaID,
        p.VentaID,
        p.NumeroCuota,
		COUNT(p.VentaID) AS CuotasPendientes,
        COAlESCE(SUM(p.MontoCuota), 0) AS MontoPendiente,
        p.FechaVencimiento,
        p.Estado
    FROM PlanPagos p
    INNER JOIN Ventas v ON p.VentaID = v.VentaID
    INNER JOIN Lotes l ON v.LoteID = l.LoteID
    WHERE l.NumeroLote = @NumeroLote AND p.Estado = 'Pendiente' AND
		MONTH(FechaVencimiento) <= MONTH(GETDATE()) AND
		YEAR(FechaVencimiento) <= YEAR(GETDATE())
	GROUP BY p.CuotaID, p.FechaVencimiento, p.VentaID, p.NumeroCuota, p.Estado
);*/


GO
CREATE OR ALTER FUNCTION fn_CuotasPendientesByVenta
(
    @VentaID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT
		COUNT(p.VentaID) AS CuotasPendientes,
        SUM(p.MontoCuota) AS MontoPendiente
    FROM PlanPagos p
    WHERE p.VentaID = @VentaID
      AND p.Estado = 'Pendiente'
      AND p.FechaVencimiento <= GETDATE()
);
GO

CREATE OR ALTER FUNCTION fn_CuotasRestantesByVenta
(
    @VentaID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT
		COUNT(p.VentaID) AS CuotasRestantes,
		COALESCE(SUM(p.Capital), 0) AS SaldoPendiente
    FROM PlanPagos p
    WHERE p.VentaID = @VentaID
      AND p.Estado = 'Pendiente'
      AND p.FechaVencimiento >= GETDATE()
);


CREATE OR ALTER FUNCTION fn_CuotasPagadasByVenta
(
    @VentaID INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT
		COUNT(p.VentaID) AS CuotasPagadas,
		COALESCE(SUM(p.Capital), 0) AS SaldoPagado
    FROM PlanPagos p
    WHERE p.VentaID = @VentaID
      AND p.Estado = 'Pagada'
      AND p.FechaVencimiento >= GETDATE()
);



SELECT *
FROM dbo.fn_CuotasRestantesByVenta(1033);