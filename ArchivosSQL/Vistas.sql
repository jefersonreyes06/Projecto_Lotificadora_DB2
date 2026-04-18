USE IngenierosEnProceso
GO

-- ============================================
-- TRIGGERS PARA LOTES
-- ============================================

-- Trigger 1: Actualizar área total del bloque cuando se inserta un lote
CREATE OR ALTER TRIGGER tr_Lotes_Insert_UpdateAreaBloque
ON Lotes
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE b
    SET b.AreaTotalVaras = (
        SELECT COALESCE(SUM(l.AreaVaras), 0)
        FROM Lotes l
        WHERE l.BloqueID = b.BloqueID
    )
    FROM Bloques b
    INNER JOIN inserted i ON b.BloqueID = i.BloqueID;
END;
GO

-- Trigger 2: Actualizar área total del bloque cuando se elimina un lote
CREATE OR ALTER TRIGGER tr_Lotes_Delete_UpdateAreaBloque
ON Lotes
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE b
    SET b.AreaTotalVaras = (
        SELECT COALESCE(SUM(l.AreaVaras), 0)
        FROM Lotes l
        WHERE l.BloqueID = b.BloqueID
    )
    FROM Bloques b
    INNER JOIN deleted d ON b.BloqueID = d.BloqueID;
END;
GO

-- ============================================
-- TRIGGERS PARA VENTAS
-- ============================================

-- Trigger 3: Cambiar estado del lote a "Vendido" cuando se crea una venta
CREATE OR ALTER TRIGGER tr_Ventas_Insert_UpdateLoteStatus
ON Ventas
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE l
    SET l.Estado = 'Vendido',
        l.FechaVenta = GETDATE()
    FROM Lotes l
    INNER JOIN inserted i ON l.LoteID = i.LoteID;
    
    -- Registrar en auditoría
    INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
    SELECT 'Ventas', i.VentaID, 'INSERT', 
           'Cliente: ' + c.DNI + ', Lote: ' + CAST(i.LoteID AS VARCHAR(10)) + ', Monto: ' + CAST(i.MontoTotal AS VARCHAR(20))
    FROM inserted i
    INNER JOIN Clientes c ON i.ClienteID = c.ClienteID;
END;
GO

-- Trigger 4: Revertir estado del lote a "Disponible" cuando se cancela una venta
CREATE OR ALTER TRIGGER tr_Ventas_Update_RevertLoteStatus
ON Ventas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si el estado cambió a "Cancelada", cambiar el lote a "Disponible"
    UPDATE l
    SET l.Estado = 'Disponible',
        l.FechaVenta = NULL
    FROM Lotes l
    INNER JOIN inserted i ON l.LoteID = i.LoteID
    WHERE i.Estado = 'Cancelada' AND EXISTS (
        SELECT 1 FROM deleted d WHERE d.VentaID = i.VentaID AND d.Estado != 'Cancelada'
    );
END;
GO

-- ============================================
-- TRIGGERS PARA PAGOS
-- ============================================

-- Trigger 5: Actualizar estado de la cuota a "Pagada" cuando se registra un pago
CREATE OR ALTER TRIGGER tr_Pagos_Insert_UpdateCuota
ON Pagos
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE pp
    SET pp.Estado = 'Pagada',
        pp.FechaPago = GETDATE(),
        pp.SaldoPendiente = 0
    FROM PlanPagos pp
    INNER JOIN inserted i ON pp.CuotaID = i.CuotaID;
END;
GO

-- Trigger 6: Actualizar saldo pendiente de la venta cuando se registra un pago
CREATE OR ALTER TRIGGER tr_Pagos_Insert_UpdateVentaSaldo
ON Pagos
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @SaldoTotal DECIMAL(12,2);
    
    UPDATE v
    SET v.MontoFinanciado = CASE 
        WHEN SUM(i.MontoRecibido) >= v.MontoFinanciado THEN 0
        ELSE v.MontoFinanciado - SUM(i.MontoRecibido)
    END
    FROM Ventas v
    INNER JOIN PlanPagos pp ON v.VentaID = pp.VentaID
    INNER JOIN inserted i ON pp.CuotaID = i.CuotaID
    GROUP BY v.VentaID;
    
    -- Registrar en auditoría
    INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
    SELECT 'Pagos', i.PagoID, 'INSERT', 
           'Monto: ' + CAST(i.MontoRecibido AS VARCHAR(20)) + ', Método: ' + i.MetodoPago
    FROM inserted i;
END;
GO

-- ============================================
-- TRIGGERS PARA CLIENTES
-- ============================================

-- Trigger 7: Registrar en auditoría cuando se actualiza un cliente
CREATE OR ALTER TRIGGER tr_Clientes_Update_Auditoria
ON Clientes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosAntiguos, DatosNuevos)
    SELECT 'Clientes', i.ClienteID, 'UPDATE',
           'Nombre: ' + d.NombreCompleto + ', Teléfono: ' + d.Telefono,
           'Nombre: ' + i.NombreCompleto + ', Teléfono: ' + i.Telefono
    FROM inserted i
    INNER JOIN deleted d ON i.ClienteID = d.ClienteID
    WHERE i.NombreCompleto != d.NombreCompleto 
       OR i.Telefono != d.Telefono 
       OR i.Email != d.Email;
END;
GO

-- ============================================
-- TRIGGERS PARA VALIDACIÓN
-- ============================================

-- Trigger 8: Validar que no se eliminen lotes vendidos
CREATE OR ALTER TRIGGER tr_Lotes_Delete_ValidateEstado
ON Lotes
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que no hay lotes vendidos siendo eliminados
    IF EXISTS (SELECT 1 FROM deleted WHERE Estado = 'Vendido')
    BEGIN
        RAISERROR('No se pueden eliminar lotes vendidos.', 16, 1);
        ROLLBACK;
        RETURN;
    END;
    
    -- Si la validación pasa, realizar la eliminación
    DELETE FROM Lotes WHERE LoteID IN (SELECT LoteID FROM deleted);
END;
GO

-- Trigger 9: Validar cambios de estado en ventas (auditoría de cambios críticos)
CREATE OR ALTER TRIGGER tr_Ventas_Update_Auditoria
ON Ventas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosAntiguos, DatosNuevos)
    SELECT 'Ventas', i.VentaID, 'UPDATE',
           'Estado: ' + d.Estado + ', Monto: ' + CAST(d.MontoTotal AS VARCHAR(20)),
           'Estado: ' + i.Estado + ', Monto: ' + CAST(i.MontoTotal AS VARCHAR(20))
    FROM inserted i
    INNER JOIN deleted d ON i.VentaID = d.VentaID
    WHERE i.Estado != d.Estado OR i.MontoTotal != d.MontoTotal;
END;
GO

-- Trigger 10: Prevenir cambios en clientes con ventas activas que afecten integridad
CREATE OR ALTER TRIGGER tr_Clientes_Update_ValidateVentas
ON Clientes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si el estado cambia a inactivo, validar que no hay ventas activas
    IF UPDATE(Estado)
    BEGIN
        IF EXISTS (
            SELECT 1 FROM inserted i
            INNER JOIN Ventas v ON i.ClienteID = v.ClienteID
            WHERE i.Estado = 'Inactivo' AND v.Estado = 'Activa'
        )
        BEGIN
            RAISERROR('No se puede desactivar un cliente con ventas activas.', 16, 1);
            ROLLBACK;
            RETURN;
        END;
    END;
END;
GO

-- ============================================
-- TRIGGERS ADICIONALES PARA PAGOS
-- ============================================

-- Trigger 11: Actualizar saldo de cuenta bancaria cuando se registra pago por depósito
CREATE OR ALTER TRIGGER tr_Pagos_Insert_UpdateCuentaBancaria
ON Pagos
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Actualizar saldo de la cuenta bancaria si el pago es por depósito/transferencia
    UPDATE cb
    SET cb.SaldoActual = cb.SaldoActual + i.MontoRecibido
    FROM CuentaBancaria cb
    INNER JOIN inserted i ON cb.CuentaID = i.CuentaBancariaID
    WHERE i.MetodoPago IN ('Deposito', 'Transferencia')
      AND i.CuentaBancariaID IS NOT NULL;
END;
GO

-- Trigger 12: Validar que el pago solo se registre para ventas al crédito en proceso
CREATE OR ALTER TRIGGER tr_Pagos_Insert_ValidateLoteEstado
ON Pagos
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorCount INT = 0;
    DECLARE @ValidPagos TABLE (
        PagoID INT,
        CuotaID INT,
        FechaPago DATE,
        MontoRecibido DECIMAL(12,2),
        MetodoPago VARCHAR(20),
        NumeroDeposito VARCHAR(50),
        CuentaBancariaID INT,
        UsuarioCajaID INT,
        Observaciones VARCHAR(200)
    );
    
    -- Validar cada pago insertado
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE NOT EXISTS (
            SELECT 1
            FROM PlanPagos pp
            INNER JOIN Ventas v ON pp.VentaID = v.VentaID
            INNER JOIN Lotes l ON v.LoteID = l.LoteID
            WHERE pp.CuotaID = i.CuotaID
              AND v.TipoVenta = 'Credito'
              AND v.Estado = 'Activa'
              AND (l.Estado = 'Proceso' OR l.Estado = 'Vendido')
              AND pp.Estado = 'Pendiente'
        )
    )
    BEGIN
        RAISERROR('El pago no puede registrarse. Validar: Venta activa, crédito, lote en proceso/vendido, cuota pendiente.', 16, 1);
        ROLLBACK;
        RETURN;
    END;
    
    -- Si todas las validaciones pasan, insertar los pagos
    INSERT INTO Pagos (CuotaID, FechaPago, MontoRecibido, MetodoPago, NumeroDeposito, CuentaBancariaID, UsuarioCajaID, Observaciones)
    SELECT CuotaID, FechaPago, MontoRecibido, MetodoPago, NumeroDeposito, CuentaBancariaID, UsuarioCajaID, Observaciones
    FROM inserted;
END;
GO

-- Trigger 13: Cambiar estado del lote a "Vendido" cuando todas las cuotas están pagadas
CREATE OR ALTER TRIGGER tr_PlanPagos_Update_UpdateLoteEstado
ON PlanPagos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Si se actualiza el estado de una cuota a "Pagada", verificar si todas están pagadas
    IF UPDATE(Estado)
    BEGIN
        UPDATE l
        SET l.Estado = 'Vendido'
        FROM Lotes l
        INNER JOIN Ventas v ON l.LoteID = v.LoteID
        INNER JOIN PlanPagos pp ON v.VentaID = pp.VentaID
        WHERE NOT EXISTS (
            SELECT 1 FROM PlanPagos pp2
            WHERE pp2.VentaID = v.VentaID
              AND pp2.Estado != 'Pagada'
              AND pp2.Estado != 'Cancelada'
        )
        AND l.Estado = 'Proceso';
    END;
END;
GO

-- Trigger 14: Registrar en auditoría cuando se actualiza una cuota
CREATE OR ALTER TRIGGER tr_PlanPagos_Update_Auditoria
ON PlanPagos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosAntiguos, DatosNuevos)
    SELECT 'PlanPagos', i.CuotaID, 'UPDATE',
           'Estado: ' + d.Estado + ', SaldoPendiente: ' + CAST(d.SaldoPendiente AS VARCHAR(20)),
           'Estado: ' + i.Estado + ', SaldoPendiente: ' + CAST(i.SaldoPendiente AS VARCHAR(20))
    FROM inserted i
    INNER JOIN deleted d ON i.CuotaID = d.CuotaID
    WHERE i.Estado != d.Estado OR i.SaldoPendiente != d.SaldoPendiente;
END;
GO

-- Trigger 15: Registrar en auditoría cuando se registra una factura
CREATE OR ALTER TRIGGER tr_Facturas_Insert_Auditoria
ON Facturas
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
    SELECT 'Facturas', i.FacturaID, 'INSERT',
           'NumeroFactura: ' + i.NumeroFactura + ', Total: ' + CAST(i.TotalFactura AS VARCHAR(20)) + ', CAI: ' + i.CAI
    FROM inserted i;
END;
GO

-- Trigger 16: Validar que el monto de pago no exceda el saldo pendiente
CREATE OR ALTER TRIGGER tr_Pagos_Insert_ValidateMontoRecibido
ON Pagos
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validar que el monto recibido no exceda el saldo pendiente de la cuota
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN PlanPagos pp ON i.CuotaID = pp.CuotaID
        WHERE i.MontoRecibido > pp.SaldoPendiente
    )
    BEGIN
        RAISERROR('El monto recibido no puede exceder el saldo pendiente de la cuota.', 16, 1);
        ROLLBACK;
        RETURN;
    END;
    
    -- Si la validación pasa, insertar los pagos
    INSERT INTO Pagos (CuotaID, FechaPago, MontoRecibido, MetodoPago, NumeroDeposito, CuentaBancariaID, UsuarioCajaID, Observaciones)
    SELECT CuotaID, FechaPago, MontoRecibido, MetodoPago, NumeroDeposito, CuentaBancariaID, UsuarioCajaID, Observaciones
    FROM inserted;
END;
GO

-- Trigger 17: Actualizar estado de cuota cuando se registra pago (reemplaza trigger anterior)
CREATE OR ALTER TRIGGER tr_Pagos_Insert_UpdateCuotaEstado
ON Pagos
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CuotaID INT;
    DECLARE @MontoRecibido DECIMAL(12,2);
    DECLARE @SaldoPendiente DECIMAL(12,2);
    
    -- Recorrer cada pago insertado
    DECLARE cur CURSOR FOR
    SELECT i.CuotaID, i.MontoRecibido
    FROM inserted i;
    
    OPEN cur;
    FETCH NEXT FROM cur INTO @CuotaID, @MontoRecibido;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Obtener el saldo pendiente actual
        SELECT @SaldoPendiente = SaldoPendiente FROM PlanPagos WHERE CuotaID = @CuotaID;
        
        -- Actualizar la cuota
        UPDATE PlanPagos
        SET Estado = CASE 
                WHEN @MontoRecibido >= @SaldoPendiente THEN 'Pagada'
                ELSE 'Parcial'
            END,
            SaldoPendiente = @SaldoPendiente - @MontoRecibido,
            FechaPago = GETDATE()
        WHERE CuotaID = @CuotaID;
        
        FETCH NEXT FROM cur INTO @CuotaID, @MontoRecibido;
    END;
    
    CLOSE cur;
    DEALLOCATE cur;
END;
GO
