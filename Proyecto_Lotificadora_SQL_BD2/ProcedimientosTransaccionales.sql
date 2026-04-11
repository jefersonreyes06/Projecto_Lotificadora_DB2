USE IngenierosEnProceso
GO

-- ============================================
-- PROCEDIMIENTOS CON MANEJO TRANSACCIONAL
-- ============================================

-- 1. CREAR VENTA COMPLETA (Transaccional)
-- Incluye: Validar lote disponible, crear venta, generar plan de pagos
CREATE OR ALTER PROCEDURE sp_crear_venta_completa
    @ClienteID INT,
    @LoteID INT,
    @TipoVenta VARCHAR(20),
    @Prima DECIMAL(12,2) = 0,
    @AniosPlazo INT = 0,
    @TasaInteresAplicada DECIMAL(5,2) = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @MontoTotal DECIMAL(12,2);
    DECLARE @MontoFinanciado DECIMAL(12,2);
    DECLARE @VentaID INT;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el lote existe y está disponible
        IF NOT EXISTS (SELECT 1 FROM Lotes WHERE LoteID = @LoteID AND Estado = 'Disponible')
        BEGIN
            SET @ErrorMessage = 'El lote no existe o no está disponible para venta.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Validar que el cliente existe y está activo
        IF NOT EXISTS (SELECT 1 FROM Clientes WHERE ClienteID = @ClienteID AND Estado = 'Activo')
        BEGIN
            SET @ErrorMessage = 'El cliente no existe o no está activo.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Obtener el precio del lote
        SELECT @MontoTotal = PrecioFinal FROM Lotes WHERE LoteID = @LoteID;
        
        -- Calcular monto financiado
        SET @MontoFinanciado = @MontoTotal - @Prima;
        
        -- Si es financiado, validar que se proporcionaron años y tasa
        IF @TipoVenta = 'Financiado' AND (@AniosPlazo = 0 OR @TasaInteresAplicada = 0)
        BEGIN
            SET @ErrorMessage = 'Para ventas financiadas se requieren años de plazo y tasa de interés.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Insertar la venta
        INSERT INTO Ventas (ClienteID, LoteID, TipoVenta, MontoTotal, Prima, MontoFinanciado, AniosPlazo, TasaInteresAplicada)
        VALUES (@ClienteID, @LoteID, @TipoVenta, @MontoTotal, @Prima, @MontoFinanciado, @AniosPlazo, @TasaInteresAplicada);
        
        SET @VentaID = SCOPE_IDENTITY();
        
        -- Si es financiado, generar plan de pagos
        IF @TipoVenta = 'Financiado'
        BEGIN
            EXEC sp_generar_plan_pagos @VentaID, @MontoFinanciado, @AniosPlazo, @TasaInteresAplicada;
        END;
        
        -- Actualizar estado del lote (esto también se hace con trigger, pero por seguridad)
        UPDATE Lotes SET Estado = 'Vendido', FechaVenta = GETDATE() WHERE LoteID = @LoteID;
        
        -- Registrar en auditoría
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
        VALUES ('Ventas', @VentaID, 'INSERT', 
                'Cliente: ' + CAST(@ClienteID AS VARCHAR(10)) + 
                ', Lote: ' + CAST(@LoteID AS VARCHAR(10)) + 
                ', Monto: ' + CAST(@MontoTotal AS VARCHAR(20)));
        
        COMMIT TRANSACTION;
        
        SELECT @VentaID AS VentaID, 'Venta creada exitosamente' AS Mensaje, 1 AS Exito;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS VentaID, ERROR_MESSAGE() AS Mensaje, 0 AS Exito;
    END CATCH;
END;
GO

-- 2. REGISTRAR PAGO COMPLETO (Transaccional)
-- Incluye: Validar cuota pendiente, registrar pago, actualizar saldos, generar factura
CREATE OR ALTER PROCEDURE sp_registrar_pago_completo
    @CuotaID INT,
    @MontoRecibido DECIMAL(12,2),
    @MetodoPago VARCHAR(20),
    @NumeroDeposito VARCHAR(50) = NULL,
    @CuentaBancariaID INT = NULL,
    @UsuarioCajaID INT,
    @Observaciones VARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @PagoID INT;
    DECLARE @FacturaID INT;
    DECLARE @MontoCuota DECIMAL(12,2);
    DECLARE @SaldoPendiente DECIMAL(12,2);
    DECLARE @VentaID INT;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @NumeroFactura VARCHAR(50);
    DECLARE @CAI VARCHAR(50) = 'CAI-2024-001'; -- CAI de ejemplo
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que la cuota existe y está pendiente
        IF NOT EXISTS (SELECT 1 FROM PlanPagos WHERE CuotaID = @CuotaID AND Estado = 'Pendiente')
        BEGIN
            SET @ErrorMessage = 'La cuota no existe o ya está pagada.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Obtener datos de la cuota
        SELECT @MontoCuota = MontoCuota, @SaldoPendiente = SaldoPendiente, @VentaID = VentaID
        FROM PlanPagos WHERE CuotaID = @CuotaID;
        
        -- Validar que el monto recibido no exceda el saldo pendiente
        IF @MontoRecibido > @SaldoPendiente
        BEGIN
            SET @ErrorMessage = 'El monto recibido no puede exceder el saldo pendiente de la cuota.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Generar número de factura único
        SET @NumeroFactura = 'FAC-' + CAST(YEAR(GETDATE()) AS VARCHAR(4)) + 
                           RIGHT('00' + CAST(MONTH(GETDATE()) AS VARCHAR(2)), 2) + 
                           RIGHT('00' + CAST(DAY(GETDATE()) AS VARCHAR(2)), 2) + 
                           '-' + RIGHT('00000' + CAST(@CuotaID AS VARCHAR(5)), 5);
        
        -- Insertar el pago
        INSERT INTO Pagos (CuotaID, MontoRecibido, MetodoPago, NumeroDeposito, CuentaBancariaID, UsuarioCajaID, Observaciones)
        VALUES (@CuotaID, @MontoRecibido, @MetodoPago, @NumeroDeposito, @CuentaBancariaID, @UsuarioCajaID, @Observaciones);
        
        SET @PagoID = SCOPE_IDENTITY();
        
        -- Actualizar la cuota
        UPDATE PlanPagos 
        SET Estado = CASE WHEN @MontoRecibido >= @SaldoPendiente THEN 'Pagada' ELSE 'Parcial' END,
            SaldoPendiente = @SaldoPendiente - @MontoRecibido,
            FechaPago = GETDATE()
        WHERE CuotaID = @CuotaID;
        
        -- Generar factura
        INSERT INTO Facturas (PagoID, NumeroFactura, CAI, DesgloseCapital, DesgloseInteres, TotalFactura, UsuarioEmisionID)
        VALUES (@PagoID, @NumeroFactura, @CAI, @MontoRecibido, 0, @MontoRecibido, @UsuarioCajaID);
        
        SET @FacturaID = SCOPE_IDENTITY();
        
        -- Registrar en auditoría
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
        VALUES ('Pagos', @PagoID, 'INSERT', 
                'Monto: ' + CAST(@MontoRecibido AS VARCHAR(20)) + 
                ', Método: ' + @MetodoPago + 
                ', Factura: ' + @NumeroFactura);
        
        COMMIT TRANSACTION;
        
        SELECT @PagoID AS PagoID, @FacturaID AS FacturaID, @NumeroFactura AS NumeroFactura, 
               'Pago registrado exitosamente' AS Mensaje, 1 AS Exito;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS PagoID, 0 AS FacturaID, '' AS NumeroFactura, ERROR_MESSAGE() AS Mensaje, 0 AS Exito;
    END CATCH;
END;
GO

-- 3. CREAR LOTE CON CARACTERÍSTICAS (Transaccional)
-- Incluye: Crear lote, asignar características, actualizar área del bloque
CREATE OR ALTER PROCEDURE sp_crear_lote_completo
    @BloqueID INT,
    @NumeroLote VARCHAR(20),
    @AreaVaras DECIMAL(18,4),
    @PrecioBase DECIMAL(12,2),
    @Estado VARCHAR(20) = 'Disponible',
    @CaracteristicasXML XML = NULL -- XML con características: <caracteristicas><caracteristica id="1"/><caracteristica id="2"/></caracteristicas>
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @LoteID INT;
    DECLARE @PrecioFinal DECIMAL(12,2) = @PrecioBase;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el bloque existe
        IF NOT EXISTS (SELECT 1 FROM Bloques WHERE BloqueID = @BloqueID)
        BEGIN
            SET @ErrorMessage = 'El bloque especificado no existe.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Validar que no existe otro lote con el mismo número en el bloque
        IF EXISTS (SELECT 1 FROM Lotes WHERE BloqueID = @BloqueID AND NumeroLote = @NumeroLote)
        BEGIN
            SET @ErrorMessage = 'Ya existe un lote con ese número en el bloque especificado.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Calcular precio final basado en características si se proporcionan
        IF @CaracteristicasXML IS NOT NULL
        BEGIN
            SELECT @PrecioFinal = @PrecioBase + SUM(c.PorcentajeIncremento * @PrecioBase / 100)
            FROM @CaracteristicasXML.nodes('/caracteristicas/caracteristica') AS CaracteristicaXML(cross)
            INNER JOIN Caracteristicas c ON c.CaracteristicaID = CaracteristicaXML.cross.value('@id', 'INT');
        END;
        
        -- Insertar el lote
        INSERT INTO Lotes (BloqueID, NumeroLote, AreaVaras, PrecioBase, PrecioFinal, Estado)
        VALUES (@BloqueID, @NumeroLote, @AreaVaras, @PrecioBase, @PrecioFinal, @Estado);
        
        SET @LoteID = SCOPE_IDENTITY();
        
        -- Insertar características del lote si se proporcionaron
        IF @CaracteristicasXML IS NOT NULL
        BEGIN
            INSERT INTO LoteCaracteristicas (LoteID, CaracteristicaID)
            SELECT @LoteID, CaracteristicaXML.cross.value('@id', 'INT')
            FROM @CaracteristicasXML.nodes('/caracteristicas/caracteristica') AS CaracteristicaXML(cross);
        END;
        
        -- Actualizar área total del bloque (esto también se hace con trigger, pero por seguridad)
        UPDATE Bloques 
        SET AreaTotalVaras = (SELECT COALESCE(SUM(AreaVaras), 0) FROM Lotes WHERE BloqueID = @BloqueID)
        WHERE BloqueID = @BloqueID;
        
        -- Registrar en auditoría
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
        VALUES ('Lotes', @LoteID, 'INSERT', 
                'Bloque: ' + CAST(@BloqueID AS VARCHAR(10)) + 
                ', Número: ' + @NumeroLote + 
                ', Área: ' + CAST(@AreaVaras AS VARCHAR(20)));
        
        COMMIT TRANSACTION;
        
        SELECT @LoteID AS LoteID, 'Lote creado exitosamente' AS Mensaje, 1 AS Exito;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS LoteID, ERROR_MESSAGE() AS Mensaje, 0 AS Exito;
    END CATCH;
END;
GO

-- 4. CANCELAR VENTA COMPLETA (Transaccional)
-- Incluye: Cambiar estado venta, liberar lote, eliminar plan de pagos pendiente
CREATE OR ALTER PROCEDURE sp_cancelar_venta_completa
    @VentaID INT,
    @MotivoCancelacion VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @LoteID INT;
    DECLARE @EstadoActual VARCHAR(20);
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener datos de la venta
        SELECT @LoteID = LoteID, @EstadoActual = Estado 
        FROM Ventas WHERE VentaID = @VentaID;
        
        -- Validar que la venta existe
        IF @LoteID IS NULL
        BEGIN
            SET @ErrorMessage = 'La venta especificada no existe.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Validar que la venta no esté ya cancelada
        IF @EstadoActual = 'Cancelada'
        BEGIN
            SET @ErrorMessage = 'La venta ya está cancelada.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Cambiar estado de la venta
        UPDATE Ventas SET Estado = 'Cancelada' WHERE VentaID = @VentaID;
        
        -- Liberar el lote
        UPDATE Lotes SET Estado = 'Disponible', FechaVenta = NULL WHERE LoteID = @LoteID;
        
        -- Cambiar estado de cuotas pendientes a canceladas
        UPDATE PlanPagos SET Estado = 'Cancelada' WHERE VentaID = @VentaID AND Estado = 'Pendiente';
        
        -- Registrar en auditoría
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
        VALUES ('Ventas', @VentaID, 'CANCEL', 
                'Motivo: ' + @MotivoCancelacion + ', Lote liberado: ' + CAST(@LoteID AS VARCHAR(10)));
        
        COMMIT TRANSACTION;
        
        SELECT @VentaID AS VentaID, 'Venta cancelada exitosamente' AS Mensaje, 1 AS Exito;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS VentaID, ERROR_MESSAGE() AS Mensaje, 0 AS Exito;
    END CATCH;
END;
GO