USE IngenierosEnProceso
GO

DECLARE @MinID INT, @MaxID INT;

-- Obtener el rango de IDs
SELECT @MinID = MIN(LoteID), @MaxID = MAX(LoteID)
FROM Lotes;

-- Recorrer uno por uno
DECLARE @LoteID INT;

DECLARE lote_cursor CURSOR FOR
    SELECT LoteID
    FROM Lotes
    ORDER BY LoteID;

OPEN lote_cursor;
FETCH NEXT FROM lote_cursor INTO @LoteID;

WHILE @@FETCH_STATUS = 0
BEGIN
    UPDATE L
    SET L.PrecioBase = COALESCE(E.PrecioVaraCuadrada,0) * COALESCE(L.AreaVaras,0)
    FROM Lotes L
    INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
    INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
    WHERE L.LoteID = @LoteID;

    FETCH NEXT FROM lote_cursor INTO @LoteID;
END;

CLOSE lote_cursor;
DEALLOCATE lote_cursor;
GO


CREATE OR ALTER TRIGGER trg_ActualizarPrecioBasePorEtapa
ON Etapas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Verificación rápida (Nativa)
    IF UPDATE(PrecioVaraCuadrada)
    BEGIN
        -- 2. Actualización masiva (Conjuntista)
        UPDATE L
        SET 
            L.PrecioBase = L.AreaVaras * ISNULL(i.PrecioVaraCuadrada, 0)
        FROM Lotes L
        INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
        INNER JOIN inserted i ON B.EtapaID = i.EtapaID
        WHERE L.Estado = 'Disponible'; -- Mantenemos el candado de seguridad
        
        -- 3. IMPORTANTE: Aquí deberías llamar también a la lógica de actualización 
        -- del PrecioFinal que discutimos antes, para que se propague el cambio.
    END
END;
GO

-- FUNCIONA! Calcular Precio Lote
CREATE OR ALTER TRIGGER trg_calcular_precio_base_Lote
ON Lotes
AFTER INSERT, UPDATE -- <-- ¡Esto es lo que permite detectar cambios!
AS
BEGIN
    SET NOCOUNT ON;

    -- Solo ejecutamos si hubo cambios relevantes en columnas que afectan el precio
    IF UPDATE(PrecioBase) OR UPDATE(BloqueID) OR UPDATE(AreaVaras)
    BEGIN
        -- 1. Si se actualizó el Bloque o Área, recalculamos PrecioBase
        UPDATE L
        SET L.PrecioBase = L.AreaVaras * E.PrecioVaraCuadrada
        FROM Lotes L
        INNER JOIN inserted i ON L.LoteID = i.LoteID
        INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
        INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
        WHERE UPDATE(BloqueID) OR UPDATE(AreaVaras);

        -- 2. Recalculamos PrecioFinal siempre que PrecioBase haya cambiado o se actualice
        -- (Este bloque se ejecuta incluso si solo se actualizó manualmente el PrecioBase)
        UPDATE L
        SET L.PrecioFinal = L.PrecioBase * (1 + ISNULL(C.TotalIncremento, 0) / 100.0)
        FROM Lotes L
        INNER JOIN inserted i ON L.LoteID = i.LoteID
        LEFT JOIN (
            SELECT LC.LoteID, SUM(C.PorcentajeIncremento) AS TotalIncremento
            FROM LoteCaracteristicas LC
            JOIN Caracteristicas C ON LC.CaracteristicaID = C.CaracteristicaID
            GROUP BY LC.LoteID
        ) C ON L.LoteID = C.LoteID
        WHERE L.Estado = 'Disponible';
    END
END;
GO


-- Calcular el Precio Final del Lote
/*CREATE OR ALTER TRIGGER trg_CalcularPrecioFinal
ON LoteCaracteristicas
AFTER INSERT, UPDATE
AS
BEGIN
    /*UPDATE L
    SET L.PrecioFinal = COALESCE(E.PrecioVaraCuadrada,0) * COALESCE(L.AreaVaras,0) * (1 + c.PorcentajeIncremento/100)
    FROM Lotes L
    INNER JOIN inserted i ON L.LoteID = i.LoteID
    INNER JOIN Caracteristicas c ON c.CaracteristicaID = i.CaracteristicaID
    INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
    INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
    WHERE L.Estado = 'Disponible';*/

    UPDATE L
    SET L.PrecioFinal = COALESCE(E.PrecioVaraCuadrada,0) * COALESCE(L.AreaVaras,0) * (1 + c.PorcentajeIncremento/100)
    FROM LoteCaracteristicas l
    INNER JOIN inserted i ON L.LoteID = i.LoteID
    INNER JOIN Caracteristicas c ON c.CaracteristicaID = i.CaracteristicaID
    INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
    INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
    WHERE L.Estado = 'Disponible';

    /*
    SELECT *
    FROM LoteCaracteristicas lc
    INNER JOIN Lotes l ON l.LoteID = lc.LoteID
    INNER JOIN Caracteristicas c ON c.CaracteristicaID = lc.CaracteristicaID
    INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
    INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
    WHERE L.Estado = 'Disponible';*/
END;*/
GO


CREATE OR ALTER TRIGGER trg_CalcularPrecioFinal
ON LoteCaracteristicas
AFTER INSERT, UPDATE
AS
BEGIN;
    WITH SumaCaracteristicas AS (
        SELECT 
            i.LoteID,
            SUM(c.PorcentajeIncremento) AS TotalIncremento
        FROM inserted i
        INNER JOIN Caracteristicas c ON c.CaracteristicaID = i.CaracteristicaID
        GROUP BY i.LoteID
    )
    UPDATE L
    SET L.PrecioFinal = COALESCE(E.PrecioVaraCuadrada,0) 
                        * COALESCE(L.AreaVaras,0) 
                        * (1 + COALESCE(sc.TotalIncremento,0)/100.0)
    FROM Lotes L
    INNER JOIN SumaCaracteristicas sc ON L.LoteID = sc.LoteID
    INNER JOIN Bloques B ON L.BloqueID = B.BloqueID
    INNER JOIN Etapas E ON B.EtapaID = E.EtapaID
    WHERE L.Estado = 'Disponible';
END;
GO

CREATE OR ALTER TRIGGER trg_RecalcularPrecioFinalPorLote
ON Lotes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Solo recalcular si cambió el PrecioBase
    IF UPDATE(PrecioBase)
    BEGIN
        -- Usamos un cursor o un bucle solo si fuera estrictamente necesario, 
        -- pero aquí podemos optimizarlo con un JOIN masivo
        UPDATE L
        SET L.PrecioFinal = (L.PrecioBase * (1 + ISNULL(C.TotalIncremento, 0)/100.0))
        FROM Lotes L
        INNER JOIN inserted i ON L.LoteID = i.LoteID
        -- Calculamos la suma de los porcentajes de todas sus características
        LEFT JOIN (
            SELECT LC.LoteID, SUM(C.PorcentajeIncremento) AS TotalIncremento
            FROM LoteCaracteristicas LC
            JOIN Caracteristicas C ON LC.CaracteristicaID = C.CaracteristicaID
            GROUP BY LC.LoteID
        ) C ON L.LoteID = C.LoteID
        WHERE L.Estado = 'Disponible';
    END
END;
GO

/*
CREATE OR ALTER TRIGGER trg_AuditoriaVentas
ON Ventas
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UsuarioID INT = 1;  -- En producción usar SYSTEM_USER o el usuario logueado
    
    -- AUDITORÍA PARA INSERT (Nueva venta)
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, FechaAccion, UsuarioID, DatosNuevos)
        SELECT 
            'Ventas', 
            i.VentaID, 
            'INSERT - Nueva Venta', 
            GETDATE(), 
            @UsuarioID,
            'ClienteID: ' + CAST(i.ClienteID AS VARCHAR) + 
            ', LoteID: ' + CAST(i.LoteID AS VARCHAR) + 
            ', Tipo: ' + i.TipoVenta + 
            ', Monto: L. ' + CAST(i.MontoTotal AS VARCHAR)
        FROM inserted i;
        
        PRINT 'Auditoría de venta registrada';
    END
    
    -- AUDITORÍA PARA UPDATE (Actualización de venta)
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, FechaAccion, UsuarioID, DatosAntiguos, DatosNuevos)
        SELECT 
            'Ventas', 
            i.VentaID, 
            'UPDATE - Modificación', 
            GETDATE(), 
            @UsuarioID,
            'Estado Anterior: ' + ISNULL(d.Estado, 'N/A'),
            'Estado Nuevo: ' + ISNULL(i.Estado, 'N/A') + 
            ', Fecha Pago: ' + ISNULL(CONVERT(VARCHAR, i.FechaVenta, 103), 'N/A')
        FROM inserted i
        INNER JOIN deleted d ON i.VentaID = d.VentaID;
        
        PRINT 'Auditoría de actualización registrada';
    END
    
    -- AUDITORÍA PARA DELETE (Venta eliminada)
    IF EXISTS (SELECT 1 FROM deleted) AND NOT EXISTS (SELECT 1 FROM inserted)
    BEGIN
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, FechaAccion, UsuarioID, DatosAntiguos)
        SELECT 
            'Ventas', 
            d.VentaID, 
            'DELETE - Eliminada', 
            GETDATE(), 
            @UsuarioID,
            'ClienteID: ' + CAST(d.ClienteID AS VARCHAR) + 
            ', LoteID: ' + CAST(d.LoteID AS VARCHAR) + 
            ', Tipo: ' + d.TipoVenta
        FROM deleted d;
        
        PRINT 'Auditoría de eliminación registrada';
    END
END;
GO
*/