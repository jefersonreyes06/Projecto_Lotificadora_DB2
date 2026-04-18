USE IngenierosEnProceso
GO

-- ============================================
-- PROCEDIMIENTOS CON MANEJO TRANSACCIONAL
-- ============================================

-- 0. CREAR VENTA DE UN LOTE (MANEJO TRANSACCIONAL)
CREATE OR ALTER PROCEDURE sp_crear_venta_lote
    @LoteID INT,
    @ClienteID INT,
    @BeneficiarioID INT,
    @AvalID INT = NULL,
    @UsuarioID INT = 1,
    @TipoVenta VARCHAR(30) = 'Contado',
    @AniosPlazo INT,
    @MontoTotal DECIMAL(12, 2),
    @Prima DECIMAL(12, 2),
    @MontoFinanciado DECIMAL(12, 2) = NULL,
    @TasaInteresAplicada DECIMAL(12, 2) = NULL,
    @CuotaMensualEstimada DECIMAL(12, 2) = NULL,
    @Estado VARCHAR(30) = 'Finalizada'
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;
        -- 2. Actualizar estado del lote
        IF @TipoVenta = 'Contado'
        BEGIN
            INSERT INTO Ventas (ClienteID, LoteID, UsuarioID, BeneficiarioID, AvalID, TipoVenta, FechaVenta, 
            MontoTotal, Prima, MontoFinanciado, AniosPlazo, TasaInteresAplicada, CuotaMensualEstimada, Estado)
            VALUES (@ClienteID, @LoteID, @UsuarioID, @BeneficiarioID, NULL, @TipoVenta, GETDATE(), 
            @MontoTotal, 0, 0, 0, 0, 0, @Estado)

            UPDATE Lotes
            SET Estado = 'Vendido'
            WHERE LoteID = @LoteID;
        END
        ELSE 
        BEGIN
            IF @AvalID IS NULL
            BEGIN
                THROW 50001, 'El AvalID no puede ser nulo', 1;
            END
            ELSE
            BEGIN
                INSERT INTO Ventas (ClienteID, LoteID, UsuarioID, BeneficiarioID, AvalID, TipoVenta, FechaVenta, 
                MontoTotal, Prima, MontoFinanciado, AniosPlazo, TasaInteresAplicada, CuotaMensualEstimada, Estado)
                VALUES (@ClienteID, @LoteID, @UsuarioID, @BeneficiarioID, @AvalID, @TipoVenta, GETDATE(), 
                @MontoTotal, @Prima, @MontoFinanciado, @AniosPlazo, @TasaInteresAplicada, @CuotaMensualEstimada, @Estado)

                UPDATE Lotes
                SET Estado = 'Reservado'
                WHERE LoteID = @LoteID;
            END
        END

        SELECT * FROM Ventas WHERE VentaID = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

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
        IF @TipoVenta = 'Credito' AND (@AniosPlazo = 0 OR @TasaInteresAplicada = 0)
        BEGIN
            SET @ErrorMessage = 'Para ventas al crédito se requieren años de plazo y tasa de interés.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Insertar la venta
        INSERT INTO Ventas (ClienteID, LoteID, TipoVenta, MontoTotal, Prima, MontoFinanciado, AniosPlazo, TasaInteresAplicada)
        VALUES (@ClienteID, @LoteID, @TipoVenta, @MontoTotal, @Prima, @MontoFinanciado, @AniosPlazo, @TasaInteresAplicada);
        
        SET @VentaID = SCOPE_IDENTITY();
        
        -- Si es al crédito, generar plan de pagos
        IF @TipoVenta = 'Credito'
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

-- GENERAR PLAN DE PAGOS (Transaccional)
-- Genera el plan de pagos para una venta al crédito
CREATE OR ALTER PROCEDURE sp_generar_plan_pagos
    @VentaID INT,
    @MontoFinanciado DECIMAL(12,2),
    @AniosPlazo INT,
    @TasaInteresAplicada DECIMAL(5,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CuotaMensual DECIMAL(12,2);
    DECLARE @TotalCuotas INT = @AniosPlazo * 12;
    DECLARE @FechaVencimiento DATE = DATEADD(MONTH, 1, GETDATE());
    DECLARE @SaldoPendiente DECIMAL(12,2) = @MontoFinanciado;
    DECLARE @InteresMensual DECIMAL(12,2);
    DECLARE @CapitalMensual DECIMAL(12,2);
    DECLARE @CuotaID INT;
    DECLARE @ErrorMessage NVARCHAR(4000);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Calcular cuota mensual usando fórmula de amortización
        SET @InteresMensual = @TasaInteresAplicada / 100 / 12;
        SET @CuotaMensual = (@MontoFinanciado * @InteresMensual * POWER(1 + @InteresMensual, @TotalCuotas)) / (POWER(1 + @InteresMensual, @TotalCuotas) - 1);
        
        -- Insertar cuotas mensuales
        DECLARE @i INT = 1;
        WHILE @i <= @TotalCuotas
        BEGIN
            -- Calcular interés y capital para esta cuota
            SET @InteresMensual = @SaldoPendiente * (@TasaInteresAplicada / 100 / 12);
            SET @CapitalMensual = @CuotaMensual - @InteresMensual;
            
            -- Asegurar que no exceda el saldo pendiente
            IF @CapitalMensual > @SaldoPendiente
                SET @CapitalMensual = @SaldoPendiente;
            
            -- Insertar cuota
            INSERT INTO PlanPagos (VentaID, NumeroCuota, FechaVencimiento, MontoCuota, Capital, Interes, SaldoPendiente, Estado)
            VALUES (@VentaID, @i, @FechaVencimiento, @CuotaMensual, @CapitalMensual, @InteresMensual, @SaldoPendiente, 'Pendiente');
            
            SET @CuotaID = SCOPE_IDENTITY();
            
            -- Actualizar saldo pendiente
            SET @SaldoPendiente = @SaldoPendiente - @CapitalMensual;
            
            -- Próxima fecha de vencimiento
            SET @FechaVencimiento = DATEADD(MONTH, 1, @FechaVencimiento);
            
            SET @i = @i + 1;
        END;
        
        -- Actualizar cuota mensual estimada en la venta
        UPDATE Ventas SET CuotaMensualEstimada = @CuotaMensual WHERE VentaID = @VentaID;
        
        COMMIT TRANSACTION;
        
        SELECT @VentaID AS VentaID, 'Plan de pagos generado exitosamente' AS Mensaje, 1 AS Exito;
        
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
    @Observaciones VARCHAR(200) = NULL,
    @FechaPago DATE = NULL
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
        
        -- Validar que la venta es crédito y el lote está en estado Proceso
        IF NOT EXISTS (
            SELECT 1
            FROM PlanPagos p
            INNER JOIN Ventas v ON p.VentaID = v.VentaID
            INNER JOIN Lotes l ON v.LoteID = l.LoteID
            WHERE p.CuotaID = @CuotaID
              AND v.TipoVenta = 'Credito'
              AND l.Estado = 'Proceso'
        )
        BEGIN
            SET @ErrorMessage = 'El pago solo puede registrarse para ventas al crédito con lote en estado Proceso.';
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
        INSERT INTO Pagos (CuotaID, FechaPago, MontoRecibido, MetodoPago, NumeroDeposito, CuentaBancariaID, UsuarioCajaID, Observaciones)
        VALUES (@CuotaID, ISNULL(@FechaPago, GETDATE()), @MontoRecibido, @MetodoPago, @NumeroDeposito, @CuentaBancariaID, @UsuarioCajaID, @Observaciones);
        
        SET @PagoID = SCOPE_IDENTITY();
        
        -- Actualizar la cuota
        UPDATE PlanPagos 
        SET Estado = CASE WHEN @MontoRecibido >= @SaldoPendiente THEN 'Pagada' ELSE 'Parcial' END,
            SaldoPendiente = @SaldoPendiente - @MontoRecibido,
            FechaPago = ISNULL(@FechaPago, GETDATE())
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
            FROM @CaracteristicasXML.nodes('/caracteristicas/caracteristica') AS CaracteristicaXML(item)
            INNER JOIN Caracteristicas c ON c.CaracteristicaID = CaracteristicaXML.item.value('@id', 'INT');
        END;
        
        -- Insertar el lote
        INSERT INTO Lotes (BloqueID, NumeroLote, AreaVaras, PrecioBase, PrecioFinal, Estado)
        VALUES (@BloqueID, @NumeroLote, @AreaVaras, @PrecioBase, @PrecioFinal, @Estado);
        
        SET @LoteID = SCOPE_IDENTITY();
        
        -- Insertar características del lote si se proporcionaron
        IF @CaracteristicasXML IS NOT NULL
        BEGIN
            INSERT INTO LoteCaracteristicas (LoteID, CaracteristicaID)
            SELECT @LoteID, CaracteristicaXML.item.value('@id', 'INT')
            FROM @CaracteristicasXML.nodes('/caracteristicas/caracteristica') AS CaracteristicaXML(item);
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