-- ----------------------------------------
-- ProcedimientosAlmacenadosCuentas.sql
-- ----------------------------------------
USE IngenierosEnProceso

-- ----------------------------------------
-- LISTAR CUENTAS
-- ----------------------------------------
GO
CREATE OR ALTER PROCEDURE sp_cuentas_listar
    @etapaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @etapaId IS NOT NULL
    BEGIN
        SELECT
            CuentaID,
            EtapaID,
            Banco,
            NumeroCuenta,
            TipoCuenta,
            SaldoActual,
            Estado
        FROM CuentaBancaria
        WHERE EtapaID = @etapaId AND Estado = 'Activa'
        ORDER BY Banco, NumeroCuenta;
    END
    ELSE
    BEGIN
        SELECT
            CuentaID,
            EtapaID,
            Banco,
            NumeroCuenta,
            TipoCuenta,
            SaldoActual,
            Estado
        FROM CuentaBancaria
        WHERE Estado = 'Activa'
        ORDER BY Banco, NumeroCuenta;
    END
END;
GO

-- ----------------------------------------
-- OBTENER CUENTA POR ID
-- ----------------------------------------
CREATE OR ALTER PROCEDURE sp_cuentas_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        CuentaID,
        c.EtapaID,
        e.Nombre AS Etapa,
        p.Nombre AS Proyecto,
        Banco,
        NumeroCuenta,
        TipoCuenta,
        SaldoActual,
        c.Estado
    FROM CuentaBancaria c
    INNER JOIN Etapas e ON c.EtapaID = e.EtapaID
    INNER JOIN Proyectos p ON e.ProyectoID = p.ProyectoID
    WHERE CuentaID = @id;
END;
GO

-- ----------------------------------------
-- CREAR CUENTA
-- ----------------------------------------
CREATE OR ALTER PROCEDURE sp_cuentas_crear
    @EtapaID INT,
    @Banco VARCHAR(100),
    @NumeroCuenta VARCHAR(50),
    @TipoCuenta VARCHAR(50),
    @SaldoActual DECIMAL(18,2) = 0.00,
    @Estado VARCHAR(20) = 'Activa'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que la etapa existe
    IF NOT EXISTS (SELECT 1 FROM Etapas WHERE EtapaID = @EtapaID)
    BEGIN
        RAISERROR('La etapa especificada no existe', 16, 1);
        RETURN;
    END

    -- Validar que no exista una cuenta con el mismo número en el mismo banco
    IF EXISTS (SELECT 1 FROM CuentaBancaria WHERE Banco = @Banco AND NumeroCuenta = @NumeroCuenta AND Estado = 'Activa')
    BEGIN
        RAISERROR('Ya existe una cuenta con este número en el banco especificado', 16, 1);
        RETURN;
    END

    INSERT INTO CuentaBancaria (EtapaID, Banco, NumeroCuenta, TipoCuenta, SaldoActual, Estado)
    VALUES (@EtapaID, @Banco, @NumeroCuenta, @TipoCuenta, @SaldoActual, @Estado);

    SELECT SCOPE_IDENTITY() AS CuentaID;
END;
GO

-- ----------------------------------------
-- ACTUALIZAR CUENTA
-- ----------------------------------------
CREATE OR ALTER PROCEDURE sp_cuentas_actualizar
    @id INT,
    @EtapaID INT,
    @Banco VARCHAR(100),
    @NumeroCuenta VARCHAR(50),
    @TipoCuenta VARCHAR(50),
    @SaldoActual DECIMAL(18,2),
    @Estado VARCHAR(20) = 'Activa'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que la cuenta existe
    IF NOT EXISTS (SELECT 1 FROM CuentaBancaria WHERE CuentaID = @id)
    BEGIN
        RAISERROR('La cuenta especificada no existe', 16, 1);
        RETURN;
    END

    -- Validar que la etapa existe
    IF NOT EXISTS (SELECT 1 FROM Etapas WHERE EtapaID = @EtapaID)
    BEGIN
        RAISERROR('La etapa especificada no existe', 16, 1);
        RETURN;
    END

    -- Validar que no exista otra cuenta con el mismo número en el mismo banco
    IF EXISTS (SELECT 1 FROM CuentaBancaria WHERE Banco = @Banco AND NumeroCuenta = @NumeroCuenta AND Estado = 'Activa' AND CuentaID != @id)
    BEGIN
        RAISERROR('Ya existe otra cuenta con este número en el banco especificado', 16, 1);
        RETURN;
    END

    UPDATE CuentaBancaria
    SET
        EtapaID = @EtapaID,
        Banco = @Banco,
        NumeroCuenta = @NumeroCuenta,
        TipoCuenta = @TipoCuenta,
        SaldoActual = @SaldoActual,
        Estado = @Estado
    WHERE CuentaID = @id;

    SELECT @id AS CuentaID;
END;
GO

-- ----------------------------------------
-- ELIMINAR CUENTA
-- ----------------------------------------
CREATE OR ALTER PROCEDURE sp_cuentas_eliminar
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que la cuenta existe
    IF NOT EXISTS (SELECT 1 FROM CuentaBancaria WHERE CuentaID = @id)
    BEGIN
        RAISERROR('La cuenta especificada no existe', 16, 1);
        RETURN;
    END

    -- Verificar si la cuenta tiene movimientos asociados
    IF EXISTS (SELECT 1 FROM Movimientos WHERE CuentaID = @id)
    BEGIN
        -- En lugar de eliminar físicamente, marcar como inactiva
        UPDATE CuentaBancaria SET Estado = 'Inactiva' WHERE CuentaID = @id;
        SELECT @id AS CuentaID;
    END
    ELSE
    BEGIN
        -- Si no tiene movimientos, eliminar físicamente
        DELETE FROM CuentaBancaria WHERE CuentaID = @id;
        SELECT @id AS CuentaID;
    END
END;
GO

-- ----------------------------------------
-- OBTENER MOVIMIENTOS DE UNA CUENTA
-- ----------------------------------------
CREATE OR ALTER PROCEDURE sp_cuentas_movimientos
    @id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Validar que la cuenta existe
    IF NOT EXISTS (SELECT 1 FROM CuentaBancaria WHERE CuentaID = @id)
    BEGIN
        RAISERROR('La cuenta especificada no existe', 16, 1);
        RETURN;
    END

    SELECT
        MovimientoID,
        CuentaID,
        TipoMovimiento,
        Monto,
        Descripcion,
        FechaMovimiento,
        SaldoAnterior,
        SaldoPosterior
    FROM Movimientos
    WHERE CuentaID = @id
    ORDER BY FechaMovimiento DESC;
END;
GO