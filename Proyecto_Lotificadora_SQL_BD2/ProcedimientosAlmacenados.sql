-- Asegúrate de estar en la base de datos correcta
-- USE IngenierosEnProceso  -- Cambia esto al nombre de tu base de datos si es diferente
GO

-- =====================================================
-- STORED PROCEDURES PARA CLIENTES
-- =====================================================

-- Registrar nuevo cliente
CREATE PROCEDURE sp_clientes_registrar
    @nombre VARCHAR(50),
    @apellido VARCHAR(50),
    @dni VARCHAR(20),
    @fecha_nacimiento DATE = NULL,
    @genero VARCHAR(20) = NULL,
    @estado_civil VARCHAR(50) = NULL,
    @correo VARCHAR(100) = NULL,
    @telefono VARCHAR(20),
    @telefono_alt VARCHAR(20) = NULL,
    @departamento VARCHAR(50),
    @municipio VARCHAR(50),
    @direccion VARCHAR(200),
    @empresa VARCHAR(100),
    @cargo VARCHAR(100) = NULL,
    @telefono_trabajo VARCHAR(20) = NULL,
    @ingreso_mensual DECIMAL(12,2) = NULL,
    @anios_laborando DECIMAL(3,1) = NULL,
    @tipo_empleo VARCHAR(50) = NULL,
    @estado VARCHAR(20) = 'Activo'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Validar que DNI sea único
        IF EXISTS (SELECT 1 FROM Clientes WHERE DNI = @dni)
        BEGIN
            SELECT 'Error: DNI ya está registrado' AS message, 0 AS success
            RETURN
        END
        
        -- Validar campos requeridos
        IF @nombre IS NULL OR @nombre = '' OR @apellido IS NULL OR @apellido = '' 
            OR @dni IS NULL OR @dni = '' OR @telefono IS NULL OR @telefono = ''
            OR @departamento IS NULL OR @municipio IS NULL OR @direccion IS NULL
            OR @empresa IS NULL
        BEGIN
            SELECT 'Error: Faltan campos requeridos' AS message, 0 AS success
            RETURN
        END
        
        -- Insertar el cliente
        INSERT INTO Clientes (
            NombreCompleto, DNI, Telefono, Email, Direccion, 
            Departamento, Municipio, Ocupacion, IngresoMensual, 
            NombreEmpresa, TelefonoEmpresa, AniosEmpleo, Estado, FechaRegistro
        )
        VALUES (
            @nombre + ' ' + @apellido,
            @dni,
            @telefono,
            @correo,
            @direccion,
            @departamento,
            @municipio,
            @cargo,
            @ingreso_mensual,
            @empresa,
            @telefono_trabajo,
            @anios_laborando,
            @estado,
            GETDATE()
        )
        
        -- Retornar el cliente creado
        SELECT 
            ClienteID AS id,
            NombreCompleto AS nombre_completo,
            DNI AS dni,
            Telefono AS telefono,
            Email AS email,
            Direccion AS direccion,
            Departamento AS departamento,
            Municipio AS municipio,
            Ocupacion AS ocupacion,
            IngresoMensual AS ingreso_mensual,
            NombreEmpresa AS nombre_empresa,
            TelefonoEmpresa AS telefono_empresa,
            AniosEmpleo AS anios_empleo,
            Estado AS estado,
            FechaRegistro AS fecha_registro,
            1 AS success
        FROM Clientes
        WHERE ClienteID = SCOPE_IDENTITY()
        
    END TRY
    BEGIN CATCH
        SELECT 
            'Error: ' + ERROR_MESSAGE() AS message,
            0 AS success
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
        NombreCompleto AS nombre_completo,
        DNI AS dni,
        Telefono AS telefono,
        Email AS email,
        Direccion AS direccion,
        Departamento AS departamento,
        Municipio AS municipio,
        Ocupacion AS ocupacion,
        IngresoMensual AS ingreso_mensual,
        NombreEmpresa AS nombre_empresa,
        TelefonoEmpresa AS telefono_empresa,
        AniosEmpleo AS anios_empleo,
        Estado AS estado,
        FechaRegistro AS fecha_registro
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
        NombreCompleto AS nombre_completo,
        DNI AS dni,
        Telefono AS telefono,
        Email AS email,
        Direccion AS direccion,
        Departamento AS departamento,
        Municipio AS municipio,
        Ocupacion AS ocupacion,
        IngresoMensual AS ingreso_mensual,
        NombreEmpresa AS nombre_empresa,
        TelefonoEmpresa AS telefono_empresa,
        AniosEmpleo AS anios_empleo,
        Estado AS estado,
        FechaRegistro AS fecha_registro
    FROM Clientes
    WHERE ClienteID = @id
END
GO

-- Actualizar cliente
CREATE PROCEDURE sp_clientes_actualizar
    @id INT,
    @nombre VARCHAR(50) = NULL,
    @apellido VARCHAR(50) = NULL,
    @dni VARCHAR(20) = NULL,
    @fecha_nacimiento DATE = NULL,
    @genero VARCHAR(20) = NULL,
    @estado_civil VARCHAR(50) = NULL,
    @correo VARCHAR(100) = NULL,
    @telefono VARCHAR(20) = NULL,
    @telefono_alt VARCHAR(20) = NULL,
    @departamento VARCHAR(50) = NULL,
    @municipio VARCHAR(50) = NULL,
    @direccion VARCHAR(200) = NULL,
    @empresa VARCHAR(100) = NULL,
    @cargo VARCHAR(100) = NULL,
    @telefono_trabajo VARCHAR(20) = NULL,
    @ingreso_mensual DECIMAL(12,2) = NULL,
    @anios_laborando DECIMAL(3,1) = NULL,
    @tipo_empleo VARCHAR(50) = NULL,
    @estado VARCHAR(20) = NULL
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
            NombreCompleto = CASE WHEN @nombre IS NOT NULL AND @apellido IS NOT NULL 
                                   THEN @nombre + ' ' + @apellido 
                                   ELSE NombreCompleto END,
            DNI = COALESCE(@dni, DNI),
            Telefono = COALESCE(@telefono, Telefono),
            Email = COALESCE(@correo, Email),
            Direccion = COALESCE(@direccion, Direccion),
            Departamento = COALESCE(@departamento, Departamento),
            Municipio = COALESCE(@municipio, Municipio),
            Ocupacion = COALESCE(@cargo, Ocupacion),
            IngresoMensual = COALESCE(@ingreso_mensual, IngresoMensual),
            NombreEmpresa = COALESCE(@empresa, NombreEmpresa),
            TelefonoEmpresa = COALESCE(@telefono_trabajo, TelefonoEmpresa),
            AniosEmpleo = COALESCE(@anios_laborando, AniosEmpleo),
            Estado = COALESCE(@estado, Estado)
        WHERE ClienteID = @id
        
        -- Retornar el cliente actualizado
        SELECT 
            ClienteID AS id,
            NombreCompleto AS nombre_completo,
            DNI AS dni,
            Telefono AS telefono,
            Email AS email,
            Direccion AS direccion,
            Departamento AS departamento,
            Municipio AS municipio,
            Ocupacion AS ocupacion,
            IngresoMensual AS ingreso_mensual,
            NombreEmpresa AS nombre_empresa,
            TelefonoEmpresa AS telefono_empresa,
            AniosEmpleo AS anios_empleo,
            Estado AS estado,
            FechaRegistro AS fecha_registro,
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
