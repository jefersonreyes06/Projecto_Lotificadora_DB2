-- =====================================================
-- STORED PROCEDURES PARA PAGOS Y CAJA
-- =====================================================

USE IngenierosEnProceso;
GO

-- =====================================================
-- 1. LISTAR PAGOS CON FILTROS
-- =====================================================
-- Obtiene lista de pagos con información de cuota, cliente y venta
CREATE OR ALTER PROCEDURE sp_pagos_listar
    @VentaID INT = NULL,
    @ClienteID INT = NULL,
    @FechaInicio DATE = NULL,
    @FechaFin DATE = NULL,
    @MetodoPago VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT
            p.PagoID,
            p.CuotaID,
            p.FechaPago,
            p.MontoRecibido,
            p.MetodoPago,
            p.NumeroDeposito,
            p.CuentaBancariaID,
            cb.Banco AS BancoCuenta,
            cb.NumeroCuenta,
            p.Observaciones,
            -- Datos de la cuota
            pp.NumeroCuota,
            pp.MontoCuota,
            pp.FechaVencimiento,
            pp.Estado AS EstadoCuota,
            -- Datos de la venta
            v.VentaID,
            v.TipoVenta,
            v.MontoTotal,
            v.MontoFinanciado,
            -- Datos del cliente
            c.ClienteID,
            c.NombreCompleto AS ClienteNombre,
            c.DNI,
            -- Datos del lote
            l.LoteID,
            l.NumeroLote,
            -- Datos del usuario de caja
            u.UsuarioID AS UsuarioCajaID,
            u.NombreCompleto AS UsuarioCajaNombre,
            u.NombreUsuario
        FROM Pagos p
        INNER JOIN PlanPagos pp ON p.CuotaID = pp.CuotaID
        INNER JOIN Ventas v ON pp.VentaID = v.VentaID
        INNER JOIN Clientes c ON v.ClienteID = c.ClienteID
        INNER JOIN Lotes l ON v.LoteID = l.LoteID
        INNER JOIN Usuarios u ON p.UsuarioCajaID = u.UsuarioID
        LEFT JOIN CuentaBancaria cb ON p.CuentaBancariaID = cb.CuentaID
        WHERE (@VentaID IS NULL OR v.VentaID = @VentaID)
          AND (@ClienteID IS NULL OR c.ClienteID = @ClienteID)
          AND (@FechaInicio IS NULL OR p.FechaPago >= @FechaInicio)
          AND (@FechaFin IS NULL OR p.FechaPago <= @FechaFin)
          AND (@MetodoPago IS NULL OR p.MetodoPago = @MetodoPago)
        ORDER BY p.FechaPago DESC, p.PagoID DESC;
        
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS error_message;
    END CATCH
END;
GO

-- =====================================================
-- 2. OBTENER UN PAGO ESPECÍFICO
-- =====================================================
-- Obtiene los detalles completos de un pago incluyendo factura
CREATE OR ALTER PROCEDURE sp_pagos_obtener
    @PagoID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT
            p.PagoID,
            p.CuotaID,
            p.FechaPago,
            p.MontoRecibido,
            p.MetodoPago,
            p.NumeroDeposito,
            p.CuentaBancariaID,
            cb.Banco AS BancoCuenta,
            cb.NumeroCuenta,
            p.Observaciones,
            -- Datos de la cuota
            pp.NumeroCuota,
            pp.MontoCuota,
            pp.Capital,
            pp.Interes,
            pp.SaldoPendiente,
            pp.FechaVencimiento,
            pp.Estado AS EstadoCuota,
            -- Datos de la venta
            v.VentaID,
            v.TipoVenta,
            v.MontoTotal,
            v.MontoFinanciado,
            v.AniosPlazo,
            v.TasaInteresAplicada,
            v.Estado AS EstadoVenta,
            -- Datos del cliente
            c.ClienteID,
            c.NombreCompleto AS ClienteNombre,
            c.DNI,
            c.Telefono,
            c.Email,
            -- Datos del lote
            l.LoteID,
            l.NumeroLote,
            l.AreaVaras,
            l.Estado AS EstadoLote,
            -- Datos de la factura
            f.FacturaID,
            f.NumeroFactura,
            f.CAI,
            f.DesgloseCapital,
            f.DesgloseInteres,
            f.DesgloseIVA,
            f.TotalFactura,
            f.FechaEmision AS FechaFactura,
            f.Estado AS EstadoFactura
        FROM Pagos p
        INNER JOIN PlanPagos pp ON p.CuotaID = pp.CuotaID
        INNER JOIN Ventas v ON pp.VentaID = v.VentaID
        INNER JOIN Clientes c ON v.ClienteID = c.ClienteID
        INNER JOIN Lotes l ON v.LoteID = l.LoteID
        LEFT JOIN CuentaBancaria cb ON p.CuentaBancariaID = cb.CuentaID
        LEFT JOIN Facturas f ON p.PagoID = f.PagoID
        WHERE p.PagoID = @PagoID;
        
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS error_message;
    END CATCH
END;
GO

-- =====================================================
-- 3. OBTENER LOTES DISPONIBLES AL CRÉDITO POR CLIENTE
-- =====================================================
-- Obtiene lotes disponibles para un cliente (por DNI o LoteID)
-- Valida que el lote esté al crédito y en proceso de venta
CREATE OR ALTER PROCEDURE sp_lotes_disponibles_credito
    @DNI VARCHAR(20) = NULL,
    @NumeroLote VARCHAR(20) = NULL,
    @LoteID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Obtener lotes disponibles o lote específico
        IF @LoteID IS NOT NULL
        BEGIN
            -- Buscar lote específico por ID
            SELECT
                l.LoteID,
                l.NumeroLote,
                l.AreaVaras,
                l.PrecioBase,
                l.PrecioFinal,
                l.Estado AS EstadoLote,
                b.BloqueID,
                b.Nombre AS NombreBloque,
                e.EtapaID,
                e.Nombre AS NombreEtapa,
                e.TasaInteresAnual,
                p.ProyectoID,
                p.Nombre AS NombreProyecto,
                -- Mostrar si hay venta activa en crédito
                CASE WHEN v.VentaID IS NOT NULL THEN 1 ELSE 0 END AS TieneVenta,
                v.VentaID,
                v.Estado AS EstadoVenta,
                c.ClienteID,
                c.NombreCompleto AS ClienteNombre,
                c.DNI,
                -- Información de cuotas pendientes
                (SELECT COUNT(*) FROM PlanPagos WHERE VentaID = v.VentaID AND Estado = 'Pendiente') AS CuotasPendientes,
                (SELECT SUM(SaldoPendiente) FROM PlanPagos WHERE VentaID = v.VentaID AND Estado = 'Pendiente') AS SaldoPendiente
            FROM Lotes l
            INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
            INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
            INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
            LEFT JOIN Ventas v ON l.LoteID = v.LoteID AND v.Estado = 'Activa'
            LEFT JOIN Clientes c ON v.ClienteID = c.ClienteID
            WHERE l.LoteID = @LoteID
              AND (l.Estado = 'Disponible' OR l.Estado = 'En Proceso');
        END
        ELSE IF @NumeroLote IS NOT NULL
        BEGIN
            -- Buscar lote específico por número (insensible a mayúsculas/minúsculas)
            SELECT
                l.LoteID,
                l.NumeroLote,
                l.AreaVaras,
                l.PrecioBase,
                l.PrecioFinal,
                l.Estado AS EstadoLote,
                b.BloqueID,
                b.Nombre AS NombreBloque,
                e.EtapaID,
                e.Nombre AS NombreEtapa,
                e.TasaInteresAnual,
                p.ProyectoID,
                p.Nombre AS NombreProyecto,
                CASE WHEN v.VentaID IS NOT NULL THEN 1 ELSE 0 END AS TieneVenta,
                v.VentaID,
                v.Estado AS EstadoVenta,
                c.ClienteID,
                c.NombreCompleto AS ClienteNombre,
                c.DNI,
                (SELECT COUNT(*) FROM PlanPagos WHERE VentaID = v.VentaID AND Estado = 'Pendiente') AS CuotasPendientes,
                (SELECT SUM(SaldoPendiente) FROM PlanPagos WHERE VentaID = v.VentaID AND Estado = 'Pendiente') AS SaldoPendiente
            FROM Lotes l
            INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
            INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
            INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
            LEFT JOIN Ventas v ON l.LoteID = v.LoteID AND v.Estado = 'Activa'
            LEFT JOIN Clientes c ON v.ClienteID = c.ClienteID
            WHERE LOWER(l.NumeroLote) = LOWER(@NumeroLote)
              AND (l.Estado = 'Disponible' OR l.Estado = 'En Proceso');
        END
        ELSE IF @DNI IS NOT NULL
        BEGIN
            -- Obtener todos los lotes en crédito del cliente por DNI
            SELECT
                l.LoteID,
                l.NumeroLote,
                l.AreaVaras,
                l.PrecioBase,
                l.PrecioFinal,
                l.Estado AS EstadoLote,
                b.BloqueID,
                b.Nombre AS NombreBloque,
                e.EtapaID,
                e.Nombre AS NombreEtapa,
                e.TasaInteresAnual,
                p.ProyectoID,
                p.Nombre AS NombreProyecto,
                1 AS TieneVenta,
                v.VentaID,
                v.Estado AS EstadoVenta,
                c.ClienteID,
                c.NombreCompleto AS ClienteNombre,
                c.DNI,
                (SELECT COUNT(*) FROM PlanPagos WHERE VentaID = v.VentaID AND Estado = 'Pendiente') AS CuotasPendientes,
                (SELECT SUM(SaldoPendiente) FROM PlanPagos WHERE VentaID = v.VentaID AND Estado = 'Pendiente') AS SaldoPendiente
            FROM Clientes c
            INNER JOIN Ventas v ON c.ClienteID = v.ClienteID --AND v.Estado = 'Activa'
            INNER JOIN Lotes l ON v.LoteID = l.LoteID
            INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
            INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
            INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
            WHERE c.DNI = @DNI
              AND v.TipoVenta = 'Credito'
              AND l.Estado = 'En Proceso'
              AND c.Estado = 'Activo';
        END
        ELSE
        BEGIN
            -- Si no hay filtros, retornar lotes disponibles para crédito
            SELECT
                l.LoteID,
                l.NumeroLote,
                l.AreaVaras,
                l.PrecioBase,
                l.PrecioFinal,
                l.Estado AS EstadoLote,
                b.BloqueID,
                b.Nombre AS NombreBloque,
                e.EtapaID,
                e.Nombre AS NombreEtapa,
                e.TasaInteresAnual,
                p.ProyectoID,
                p.Nombre AS NombreProyecto,
                0 AS TieneVenta,
                NULL AS VentaID,
                NULL AS EstadoVenta,
                NULL AS ClienteID,
                NULL AS ClienteNombre,
                NULL AS DNI,
                0 AS CuotasPendientes,
                0 AS SaldoPendiente
            FROM Lotes l
            INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
            INNER JOIN Etapas e ON b.EtapaID = e.EtapaID
            INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
            WHERE l.Estado IN ('Disponible', 'En Proceso')
            ORDER BY l.NumeroLote;
        END
        
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS error_message;
    END CATCH
END;
GO

SELECT * FROM Ventas
SELECT * FROM Lotes

-- =====================================================
-- 4. OBTENER PLAN DE PAGOS (CUOTAS PENDIENTES)
-- =====================================================
-- Obtiene todas las cuotas relacionadas a una venta
CREATE OR ALTER PROCEDURE sp_obtener_plan_pagos
    @VentaID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT
            pp.CuotaID,
            pp.VentaID,
            pp.NumeroCuota,
            pp.FechaVencimiento,
            pp.MontoCuota,
            pp.Capital,
            pp.Interes,
            pp.SaldoPendiente,
            pp.Estado,
            pp.FechaPago,
            -- Información del pago registrado si existe
            p.PagoID,
            p.MontoRecibido,
            p.MetodoPago,
            u.NombreCompleto AS UsuarioCaja,
            -- Calcular si está vencida
            CASE 
                WHEN pp.FechaVencimiento < GETDATE() AND pp.Estado = 'Pendiente' THEN 1 
                ELSE 0 
            END AS EstaVencida,
            DATEDIFF(DAY, GETDATE(), pp.FechaVencimiento) AS DiasAlVencimiento
        FROM PlanPagos pp
        LEFT JOIN Pagos p ON pp.CuotaID = p.CuotaID
        LEFT JOIN Usuarios u ON p.UsuarioCajaID = u.UsuarioID
        WHERE pp.VentaID = @VentaID
        ORDER BY pp.NumeroCuota ASC;
        
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS error_message;
    END CATCH
END;
GO

-- =====================================================
-- 5. OBTENER FACTURA DE UN PAGO
-- =====================================================
-- Obtiene la factura y todos los detalles relacionados al pago
CREATE OR ALTER PROCEDURE sp_pago_factura
    @PagoID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT
            f.FacturaID,
            f.NumeroFactura,
            f.CAI,
            f.FechaEmision,
            f.FechaLimiteEmision,
            f.DesgloseCapital,
            f.DesgloseInteres,
            f.DesgloseIVA,
            f.TotalFactura,
            f.Estado AS EstadoFactura,
            -- Datos del pago
            p.PagoID,
            p.FechaPago,
            p.MontoRecibido,
            p.MetodoPago,
            p.NumeroDeposito,
            p.CuentaBancariaID,
            cb.Banco,
            cb.NumeroCuenta,
            -- Datos de la cuota
            pp.CuotaID,
            pp.NumeroCuota,
            pp.MontoCuota,
            pp.Capital,
            pp.Interes,
            pp.FechaVencimiento,
            -- Datos de la venta
            v.VentaID,
            v.TipoVenta,
            -- Datos del cliente
            c.ClienteID,
            c.NombreCompleto,
            c.DNI,
            c.RTN,
            c.Direccion,
            c.Telefono,
            c.Email,
            -- Datos del lote
            l.NumeroLote,
            l.AreaVaras,
            l.PrecioFinal,
            -- Datos del proyecto/etapa
            proy.Nombre AS ProyectoNombre,
            eta.Nombre AS EtapaNombre,
            -- Usuario que emitió la factura
            u.NombreCompleto AS UsuarioEmision,
            u.NombreUsuario
        FROM Facturas f
        INNER JOIN Pagos p ON f.PagoID = p.PagoID
        INNER JOIN PlanPagos pp ON p.CuotaID = pp.CuotaID
        INNER JOIN Ventas v ON pp.VentaID = v.VentaID
        INNER JOIN Clientes c ON v.ClienteID = c.ClienteID
        INNER JOIN Lotes l ON v.LoteID = l.LoteID
        INNER JOIN Bloques b ON l.BloqueID = b.BloqueID
        INNER JOIN Etapas eta ON b.EtapaID = eta.EtapaID
        INNER JOIN Proyectos proy ON eta.ProyectoID = proy.ProyectoID
        LEFT JOIN CuentaBancaria cb ON p.CuentaBancariaID = cb.CuentaID
        INNER JOIN Usuarios u ON f.UsuarioEmisionID = u.UsuarioID
        WHERE f.PagoID = @PagoID;
        
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS error_message;
    END CATCH
END;
GO
SELECT GETDATE()
-- =====================================================
-- 6. CIERRE DE CAJA DIARIO
-- =====================================================
-- Genera un cierre de caja con resumen de pagos del día
EXEC sp_cierre_caja_diario 1, '2026-04-17'

SELECT * 
FROM CierreCaja
ORDER BY CierreID DESC;

CREATE OR ALTER PROCEDURE sp_cierre_caja_diario
    @UsuarioCajaID INT = 1,
    @FechaCierre DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalEfectivo DECIMAL(12,2);
    DECLARE @TotalDeposito DECIMAL(12,2);
    DECLARE @TotalGeneral DECIMAL(12,2);
    DECLARE @CantidadEfectivo INT;
    DECLARE @CantidadDeposito INT;
    DECLARE @CierreID INT;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @FechaActual DATE =  ISNULL(@FechaCierre, FORMAT(GETDATE(), 'yyyy-MM-dd'));
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el usuario existe
        IF @UsuarioCajaID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Usuarios WHERE UsuarioID = @UsuarioCajaID)
        BEGIN
            SET @ErrorMessage = 'El usuario especificado no existe o no es un cajero.';
            RAISERROR(@ErrorMessage, 16, 1);
        END;
        
        -- Calcular totales de pagos en efectivo
        SELECT 
            @TotalEfectivo = ISNULL(SUM(MontoCuota), 0),
            @CantidadEfectivo = ISNULL(COUNT(*), 0)
        FROM PlanPagos
        WHERE TipoPago = 'Efectivo' AND FechaPago = @FechaActual
        
        -- Calcular totales de pagos por depósito
        SELECT 
            @TotalDeposito = ISNULL(SUM(MontoCuota), 0),
            @CantidadDeposito = ISNULL(COUNT(*), 0)
        FROM PlanPagos
        WHERE TipoPago IN ('Deposito') AND FechaPago = @FechaActual
        
        -- Calcular total general
        SET @TotalGeneral = @TotalEfectivo + @TotalDeposito;
        
        -- Validar que no exista ya un cierre para esta fecha
        IF EXISTS (SELECT 1 FROM CierreCaja WHERE CAST(FechaCierre AS DATE) = @FechaActual AND (@UsuarioCajaID IS NULL OR UsuarioCajaID = @UsuarioCajaID))
        BEGIN
            -- Actualizar cierre existente
            UPDATE CierreCaja
            SET TotalEfectivoRecibido = @TotalEfectivo,
                TotalDepositadoBanco = @TotalDeposito,
                TotalGeneral = @TotalGeneral,
                CantidadPagosEfectivo = @CantidadEfectivo,
                CantidadPagosDeposito = @CantidadDeposito
            WHERE CAST(FechaCierre AS DATE) = @FechaActual 
              AND (@UsuarioCajaID IS NULL OR UsuarioCajaID = @UsuarioCajaID);
            
            SELECT @CierreID = CierreID FROM CierreCaja WHERE CAST(FechaCierre AS DATE) = @FechaActual AND (@UsuarioCajaID IS NULL OR UsuarioCajaID = @UsuarioCajaID);
        END
        ELSE
        BEGIN
            -- Insertar nuevo cierre
            INSERT INTO CierreCaja (UsuarioCajaID, FechaCierre, TotalEfectivoRecibido, TotalDepositadoBanco, TotalGeneral, CantidadPagosEfectivo, CantidadPagosDeposito)
            VALUES (@UsuarioCajaID, @FechaActual, @TotalEfectivo, @TotalDeposito, @TotalGeneral, @CantidadEfectivo, @CantidadDeposito);
            
            SET @CierreID = SCOPE_IDENTITY();
        END;
        
        -- Registrar en auditoría
        INSERT INTO Auditoria (TablaAfectada, RegistroID, Accion, DatosNuevos)
        VALUES ('CierreCaja', @CierreID, 'INSERT/UPDATE', 
                'Total: ' + CAST(@TotalGeneral AS VARCHAR(20)) +
                ', Efectivo: ' + CAST(@TotalEfectivo AS VARCHAR(20)) +
                ', Depósito: ' + CAST(@TotalDeposito AS VARCHAR(20)));
        
        COMMIT TRANSACTION;
        
        -- Retornar resumen del cierre
        SELECT
            @CierreID AS CierreID,
            @FechaActual AS FechaCierre,
            @TotalEfectivo AS TotalEfectivoRecibido,
            @TotalDeposito AS TotalDepositadoBanco,
            @TotalGeneral AS TotalGeneral,
            @CantidadEfectivo AS CantidadPagosEfectivo,
            @CantidadDeposito AS CantidadPagosDeposito,
            'Cierre generado exitosamente' AS Mensaje,
            1 AS Exito;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        SELECT 0 AS CierreID, NULL AS FechaCierre, 0 AS TotalEfectivoRecibido, 0 AS TotalDepositadoBanco, 
               0 AS TotalGeneral, 0 AS CantidadPagosEfectivo, 0 AS CantidadPagosDeposito, 
               ERROR_MESSAGE() AS Mensaje, 0 AS Exito;
    END CATCH;
END;
GO

-- =====================================================
-- 7. OBTENER RESUMEN DE CAJA DIARIO
-- =====================================================
-- Obtiene el resumen de caja para un día y usuario específico
CREATE OR ALTER PROCEDURE sp_resumen_caja_diario
    @FechaCierre DATE = NULL,
    @UsuarioCajaID INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FechaActual DATE = ISNULL(@FechaCierre, FORMAT(GETDATE(), 'yyyy-MM-dd'));
    
    BEGIN TRY
        SELECT
            cc.CierreID,
            cc.UsuarioCajaID,
            u.NombreCompleto AS UsuarioCaja,
            u.NombreUsuario,
            cc.FechaCierre,
            cc.TotalEfectivoRecibido,
            cc.TotalDepositadoBanco,
            cc.TotalGeneral,
            cc.CantidadPagosEfectivo,
            cc.CantidadPagosDeposito,
            cc.Observaciones,
            -- Detalles de pagos por método
            (SELECT COUNT(*) FROM Pagos p WHERE MetodoPago = 'Efectivo' AND CAST(p.FechaPago AS DATE) = @FechaActual AND (@UsuarioCajaID IS NULL OR p.UsuarioCajaID = @UsuarioCajaID)) AS DetailCuotasEfectivo,
            (SELECT COUNT(*) FROM Pagos p WHERE MetodoPago IN ('Deposito', 'Transferencia') AND CAST(p.FechaPago AS DATE) = @FechaActual AND (@UsuarioCajaID IS NULL OR p.UsuarioCajaID = @UsuarioCajaID)) AS DetailCuotasDeposito
        FROM CierreCaja cc
        INNER JOIN Usuarios u ON cc.UsuarioCajaID = u.UsuarioID
        WHERE CAST(cc.FechaCierre AS DATE) = @FechaActual
          AND (@UsuarioCajaID IS NULL OR cc.UsuarioCajaID = @UsuarioCajaID)
        ORDER BY cc.CierreID DESC;
        
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS error_message;
    END CATCH;
END;
GO

EXEC sp_resumen_caja_diario @FechaCierre = '2026-04-17', @UsuarioCajaID = 1;
EXEC sp_resumen_caja_diario @FechaCierre = '2026-04-17', @UsuarioCajaID = 1;
GO
CREATE OR ALTER PROCEDURE sp_resumen_caja_diario
    @FechaCierre DATE = NULL,
    @UsuarioCajaID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY

        -- Fecha base limpia
        DECLARE @Fecha DATE = ISNULL(@FechaCierre, CAST(GETDATE() AS DATE));

        SELECT
            cc.CierreID,
            cc.UsuarioCajaID,
            u.NombreCompleto AS UsuarioCaja,
            u.NombreUsuario,
            cc.FechaCierre,
            cc.TotalEfectivoRecibido,
            cc.TotalDepositadoBanco,
            cc.TotalGeneral,
            cc.CantidadPagosEfectivo,
            cc.CantidadPagosDeposito,
            cc.Observaciones,

            -- pagos del día (efectivo)
            (
                SELECT COUNT(*)
                FROM Pagos p
                WHERE p.MetodoPago = 'Efectivo'
                  AND CAST(p.FechaPago AS DATE) = @Fecha
                  AND (@UsuarioCajaID IS NULL OR p.UsuarioCajaID = @UsuarioCajaID)
            ) AS DetailCuotasEfectivo,

            -- pagos del día (depósito / transferencia)
            (
                SELECT COUNT(*)
                FROM Pagos p
                WHERE p.MetodoPago IN ('Deposito', 'Transferencia')
                  AND CAST(p.FechaPago AS DATE) = @Fecha
                  AND (@UsuarioCajaID IS NULL OR p.UsuarioCajaID = @UsuarioCajaID)
            ) AS DetailCuotasDeposito

        FROM CierreCaja cc
        INNER JOIN Usuarios u ON u.UsuarioID = cc.UsuarioCajaID

        WHERE CAST(cc.FechaCierre AS DATE) = @Fecha
          AND (@UsuarioCajaID IS NULL OR cc.UsuarioCajaID = @UsuarioCajaID)

        ORDER BY cc.CierreID DESC;

    END TRY
    BEGIN CATCH
        SELECT
            ERROR_NUMBER() AS ErrorNumber,
            ERROR_MESSAGE() AS ErrorMessage;
    END CATCH;
END;
GO

-- PROCEDIMIENTO PARA GENERAR UN PAGO DE UNA CUOTA
-- PROTOTIPO 2
CREATE OR ALTER PROCEDURE sp_generar_pago_cuota
    @VentaID INT,
    @TipoPago VARCHAR(30),
    @MontoRecibido DECIMAL(12, 2)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF @VentaID IS NULL
        BEGIN 
            THROW 50001, 'El identificador de la Venta no debe ser nulo!', 1;
        END 
        ELSE
        BEGIN;
            -- Cancelar la primera cuota pendiente de esa venta (ORDENADO POR FECHA VENCIMIENTO) ASC
            WITH CTE AS (
                SELECT TOP (1) *
                FROM PlanPagos
                WHERE VentaID = @VentaID AND Estado = 'Pendiente'
                ORDER BY FechaVencimiento ASC
            )
            UPDATE CTE
            SET 
                SaldoPendiente = 0,
                Estado = 'Pagada',
                FechaPago = GETDATE(),
                TipoPago = @TipoPago;

            IF @TipoPago = 'Deposito' 
            BEGIN
                UPDATE TOP(1) cb 
                SET cb.SaldoActual = cb.SaldoActual + @MontoRecibido
                FROM CuentaBancaria cb
                INNER JOIN Bloques b ON b.EtapaID = cb.EtapaID
                INNER JOIN Lotes l ON b.BloqueID = l.BloqueID
                INNER JOIN Ventas v ON v.LoteID = l.LoteID
                WHERE v.VentaID = @VentaID;
            END
        END
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS error_message;
    END CATCH
END;


EXEC sp_generar_pago_cuota 1033, 'Efectivo', 17169.17;