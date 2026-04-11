-- Asegúrate de estar en la base de datos correcta
-- USE [Tu_Base_De_Datos]  -- Cambia esto al nombre de tu BD
GO

-- =====================================================
-- STORED PROCEDURES PARA CLIENTES (sin crear)
-- =====================================================

-- Crear cliente
CREATE OR ALTER PROCEDURE sp_clientes_crear
    @NombreCompleto VARCHAR(100),
    @DNI VARCHAR(20),
    @RTN VARCHAR(20) = NULL,
    @Telefono VARCHAR(20),
    @Email VARCHAR(100) = NULL,
    @Direccion VARCHAR(200) = NULL,
    @Departamento VARCHAR(50) = NULL,
    @Municipio VARCHAR(50) = NULL,
    @Ocupacion VARCHAR(100) = NULL,
    @NombreEmpresa VARCHAR(100) = NULL,
    @TelefonoEmpresa VARCHAR(20) = NULL,
    @AniosEmpleo DECIMAL(3,1) = NULL,
    @IngresoMensual DECIMAL(12,2) = NULL,
    @CapacidadPago DECIMAL(12,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Clientes WHERE DNI = @DNI)
        BEGIN
            SELECT 'Error: DNI ya está registrado' AS message, 0 AS success;
            RETURN;
        END

        INSERT INTO Clientes (
            NombreCompleto, DNI, RTN, Telefono, Email, Direccion,
            Departamento, Municipio, Ocupacion, IngresoMensual,
            NombreEmpresa, TelefonoEmpresa, AniosEmpleo, CapacidadPago,
            Estado
        )
        VALUES (
            @NombreCompleto, @DNI, @RTN, @Telefono, @Email, @Direccion,
            @Departamento, @Municipio, @Ocupacion, @IngresoMensual,
            @NombreEmpresa, @TelefonoEmpresa, @AniosEmpleo, @CapacidadPago,
            'Activo'
        );

        SELECT
            ClienteID AS id,
            NombreCompleto AS nombreCompleto,
            DNI AS dni,
            RTN AS rtn,
            Telefono AS telefono,
            Email AS email,
            Direccion AS direccion,
            Departamento AS departamento,
            Municipio AS municipio,
            Ocupacion AS ocupacion,
            NombreEmpresa AS nombreEmpresa,
            TelefonoEmpresa AS telefonoEmpresa,
            AniosEmpleo AS aniosEmpleo,
            IngresoMensual AS ingresoMensual,
            CapacidadPago AS capacidadPago,
            Estado AS estado,
            FechaRegistro AS fechaRegistro,
            1 AS success
        FROM Clientes
        WHERE ClienteID = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        SELECT 'Error: ' + ERROR_MESSAGE() AS message, 0 AS success;
    END CATCH
END
GO

-- Listar clientes con búsqueda opcional
CREATE PROCEDURE sp_clientes_listar
    @q VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ClienteID AS id,
        NombreCompleto AS nombreCompleto,
        DNI AS dni,
        RTN AS rtn,
        Telefono AS telefono,
        Email AS email,
        Direccion AS direccion,
        Departamento AS departamento,
        Municipio AS municipio,
        Ocupacion AS ocupacion,
        IngresoMensual AS ingresoMensual,
        NombreEmpresa AS nombreEmpresa,
        TelefonoEmpresa AS telefonoEmpresa,
        AniosEmpleo AS aniosEmpleo,
        FechaRegistro AS fechaRegistro,
        Estado AS estado
    FROM Clientes
    WHERE 
        (
            @q IS NULL 
            OR @q = ''
            OR NombreCompleto LIKE '%' + @q + '%'
            OR DNI LIKE '%' + @q + '%'
            OR Telefono LIKE '%' + @q + '%'
            OR Email LIKE '%' + @q + '%'
        )
        AND Estado = 'Activo'
    ORDER BY NombreCompleto ASC
END
GO

-- Obtener cliente por ID
CREATE PROCEDURE sp_clientes_obtener
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ClienteID AS id,
        NombreCompleto AS nombreCompleto,
        DNI AS dni,
        RTN AS rtn,
        Telefono AS telefono,
        Email AS email,
        Direccion AS direccion,
        Departamento AS departamento,
        Municipio AS municipio,
        Ocupacion AS ocupacion,
        IngresoMensual AS ingresoMensual,
        NombreEmpresa AS nombreEmpresa,
        TelefonoEmpresa AS telefonoEmpresa,
        AniosEmpleo AS aniosEmpleo,
        FechaRegistro AS fechaRegistro,
        Estado AS estado
    FROM Clientes
    WHERE ClienteID = @id
END
GO

-- Actualizar cliente
CREATE PROCEDURE sp_clientes_actualizar
    @id INT,
    @NombreCompleto VARCHAR(100) = NULL,
    @DNI VARCHAR(20) = NULL,
    @RTN VARCHAR(20) = NULL,
    @Telefono VARCHAR(20) = NULL,
    @TelefonoAlt VARCHAR(20) = NULL,
    @Email VARCHAR(100) = NULL,
    @Direccion VARCHAR(200) = NULL,
    @Departamento VARCHAR(50) = NULL,
    @Municipio VARCHAR(50) = NULL,
    @EstadoCivil VARCHAR(50) = NULL,
    @Genero VARCHAR(20) = NULL,
    @FechaNacimiento DATE = NULL,
    @Ocupacion VARCHAR(100) = NULL,
    @NombreEmpresa VARCHAR(100) = NULL,
    @TelefonoEmpresa VARCHAR(20) = NULL,
    @AniosEmpleo DECIMAL(3,1) = NULL,
    @IngresoMensual DECIMAL(12,2) = NULL,
    @CapacidadPago DECIMAL(12,2) = NULL,
    @Estado VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Clientes WHERE ClienteID = @id)
        BEGIN
            SELECT 'Error: Cliente no encontrado' AS message, 0 AS success
            RETURN
        END
        
        -- Actualizar solo los campos proporcionados
        UPDATE Clientes
        SET 
            NombreCompleto = COALESCE(@NombreCompleto, NombreCompleto),
            DNI = COALESCE(@DNI, DNI),
            RTN = COALESCE(@RTN, RTN),
            Telefono = COALESCE(@Telefono, Telefono),
            Email = COALESCE(@Email, Email),
            Direccion = COALESCE(@Direccion, Direccion),
            Departamento = COALESCE(@Departamento, Departamento),
            Municipio = COALESCE(@Municipio, Municipio),
            Ocupacion = COALESCE(@Ocupacion, Ocupacion),
            IngresoMensual = COALESCE(@IngresoMensual, IngresoMensual),
            NombreEmpresa = COALESCE(@NombreEmpresa, NombreEmpresa),
            TelefonoEmpresa = COALESCE(@TelefonoEmpresa, TelefonoEmpresa),
            AniosEmpleo = COALESCE(@AniosEmpleo, AniosEmpleo),
            Estado = COALESCE(@Estado, Estado)
        WHERE ClienteID = @id
        
        -- Retornar el cliente actualizado
        SELECT 
            ClienteID AS id,
            NombreCompleto AS nombreCompleto,
            DNI AS dni,
            RTN AS rtn,
            Telefono AS telefono,
            Email AS email,
            Direccion AS direccion,
            Departamento AS departamento,
            Municipio AS municipio,
            Ocupacion AS ocupacion,
            IngresoMensual AS ingresoMensual,
            NombreEmpresa AS nombreEmpresa,
            TelefonoEmpresa AS telefonoEmpresa,
            AniosEmpleo AS aniosEmpleo,
            FechaRegistro AS fechaRegistro,
            Estado AS estado,
            1 AS success
        FROM Clientes
        WHERE ClienteID = @id
        
    END TRY
    BEGIN CATCH
        SELECT 
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success
    END CATCH
END
GO

-- Eliminar cliente
CREATE PROCEDURE sp_clientes_eliminar
    @id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Clientes WHERE ClienteID = @id)
        BEGIN
            SELECT 'Error: Cliente no encontrado' AS message, 0 AS success
            RETURN
        END
        
        -- Cambiar estado a Inactivo en lugar de eliminar (soft delete)
        UPDATE Clientes
        SET Estado = 'Inactivo'
        WHERE ClienteID = @id
        
        SELECT 
            'Cliente eliminado correctamente' AS message,
            1 AS success,
            @id AS deletedId
        
    END TRY
    BEGIN CATCH
        SELECT 
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success
    END CATCH
END
GO

-- Obtener cliente por DNI
CREATE PROCEDURE sp_clientes_obtener_por_dni
    @dni VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1
        ClienteID AS id,
        NombreCompleto AS nombreCompleto,
        DNI AS dni,
        RTN AS rtn,
        Telefono AS telefono,
        Email AS email,
        Direccion AS direccion,
        Departamento AS departamento,
        Municipio AS municipio,
        Ocupacion AS ocupacion,
        IngresoMensual AS ingresoMensual,
        NombreEmpresa AS nombreEmpresa,
        TelefonoEmpresa AS telefonoEmpresa,
        AniosEmpleo AS aniosEmpleo,
        FechaRegistro AS fechaRegistro,
        Estado AS estado
    FROM Clientes
    WHERE DNI = @dni
    AND Estado = 'Activo'
END
GO
