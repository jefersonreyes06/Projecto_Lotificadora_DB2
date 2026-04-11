-- Crear base de datos si no existe
USE master
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IngenierosEnProceso')
BEGIN
    CREATE DATABASE IngenierosEnProceso;
    PRINT 'Base de datos IngenierosEnProceso creada exitosamente';
END
ELSE
BEGIN
    PRINT 'La base de datos IngenierosEnProceso ya existe';
END
GO

USE IngenierosEnProceso
GO