USE IngenierosEnProceso
GO

SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = 'dbo'  -- Cambia el esquema si no es dbo
    AND TABLE_NAME = 'Lotes';


ALTER TABLE LoteCaracteristicas
ADD CONSTRAINT UQ_LoteCaracteristicas UNIQUE (LoteID, CaracteristicaID);

ALTER TABLE LoteCaracteristicas
ADD CONSTRAINT PK_LoteCaracteristicas PRIMARY KEY (LoteID, CaracteristicaID);

ALTER TABLE Ventas
DROP COLUMN EtapaID

ALTER TABLE Ventas
DROP CONSTRAINT FK_Ventas_Etapas;

ALTER TABLE Ventas
ADD BloqueID int
CONSTRAINT FK_Ventas_Bloques
FOREIGN KEY (BloqueID) REFERENCES Bloques(BloqueID)

ALTER TABLE Ventas
ADD EtapaID int
CONSTRAINT FK_Ventas_Etapas
FOREIGN KEY (EtapaID) REFERENCES Etapas(EtapaID)

GO
CREATE OR ALTER VIEW vw_prestamos_activos 
AS
SELECT
    p.Nombre AS Proyecto,
    e.Nombre AS Etapa,
    b.Nombre AS Bloque,
    l.NumeroLote AS [NumeroLote],
    l.PrecioFinal,
    c.NombreCompleto,
    c.DNI,
    v.Estado
    From Proyectos p
    INNER JOIN Etapas e ON e.ProyectoID = p.ProyectoID
    INNER JOIN Bloques b ON b.EtapaID = e.EtapaID
    INNER JOIN Lotes l ON l.BloqueID = b.BloqueID
    INNER JOIN Ventas v ON l.LoteID = v.LoteID
    INNER JOIN Clientes c ON c.ClienteID = v.ClienteID
    WHERE l.Estado = 'En Proceso'
GO

SELECT * FROM vw_prestamos_activos