DECLARE @VentaID INT;

DECLARE venta_cursor CURSOR FOR
    SELECT VentaID
    FROM Ventas
    ORDER BY VentaID;

OPEN venta_cursor;
FETCH NEXT FROM venta_cursor INTO @VentaID;

WHILE @@FETCH_STATUS = 0
BEGIN
    UPDATE V
    SET V.Estado = 'Finalizada',
    V.AniosPlazo = 0,
    V.Prima = 0,
    V.MontoFinanciado = 0,
    V.TasaInteresAplicada = 0
    FROM Ventas V
    WHERE V.TipoVenta = 'Contado';

    FETCH NEXT FROM venta_cursor INTO @VentaID;
END;

CLOSE venta_cursor;
DEALLOCATE venta_cursor;
GO
