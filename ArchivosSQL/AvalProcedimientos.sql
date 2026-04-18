
CREATE OR ALTER PROCEDURE sp_aval_listar
        @q VARCHAR(100) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT 
            AvalID AS id,
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
            Empresa AS nombreEmpresa,
            TelefonoEmpresa AS telefonoEmpresa,
            AniosEmpleo AS aniosEmpleo,
            FechaRegistro AS fechaRegistro,
            Estado AS estado
        FROM Aval
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


EXEC sp_aval_listar