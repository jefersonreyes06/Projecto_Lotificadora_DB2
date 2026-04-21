USE IngenierosEnProceso
GO

CREATE TABLE Proyectos (
    ProyectoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    UbicacionLegal VARCHAR(400) NOT NULL,
    MaxAniosFinanciamiento INT NOT NULL,
    FechaCreacion DATE DEFAULT GETDATE(),
    Estado VARCHAR(20) DEFAULT 'Activo'
);

CREATE TABLE Etapas (
    EtapaID INT PRIMARY KEY IDENTITY(1,1),
    ProyectoID INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    AreaTotalVaras DECIMAL(18,4) NOT NULL,
    PorcentajeAreasVerdes DECIMAL(5,2) NOT NULL,
    PorcentajeAreasComunes DECIMAL(5,2) NOT NULL,
    PrecioVaraCuadrada DECIMAL(10,2) NOT NULL,
    TasaInteresAnual DECIMAL(5,2) NOT NULL,
    FechaInicio DATE,
    FechaFin DATE,
    Estado VARCHAR(20) DEFAULT 'EnPlanificacion',
    FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID)
);

CREATE TABLE Bloques (
    BloqueID INT PRIMARY KEY IDENTITY(1,1),
    EtapaID INT NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    AreaTotalVaras DECIMAL(18,4),
    Estado VARCHAR(20) DEFAULT 'Disponible',
    FOREIGN KEY (EtapaID) REFERENCES Etapas(EtapaID)
);

CREATE TABLE Lotes (
    LoteID INT PRIMARY KEY IDENTITY(1,1),
    BloqueID INT NOT NULL,
    NumeroLote VARCHAR(20) NOT NULL,
    AreaVaras DECIMAL(18,4) NOT NULL,
    PrecioBase DECIMAL(12,2) NOT NULL,
    PrecioFinal DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'Disponible',
    FechaReserva DATE,
    FechaVenta DATE,
    FOREIGN KEY (BloqueID) REFERENCES Bloques(BloqueID)
);

CREATE TABLE Caracteristicas (
    CaracteristicaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    PorcentajeIncremento DECIMAL(5,2) NOT NULL,
    Descripcion VARCHAR(200)
);

CREATE TABLE LoteCaracteristicas (
    LoteID INT NOT NULL,
    CaracteristicaID INT NOT NULL,
    PRIMARY KEY (LoteID, CaracteristicaID),
    FOREIGN KEY (LoteID) REFERENCES Lotes(LoteID),
    FOREIGN KEY (CaracteristicaID) REFERENCES Caracteristicas(CaracteristicaID)
);

CREATE TABLE Clientes (
    ClienteID INT PRIMARY KEY IDENTITY(1,1),
    NombreCompleto VARCHAR(100) NOT NULL,
    DNI VARCHAR(20) UNIQUE NOT NULL,
    RTN VARCHAR(20),
    Telefono VARCHAR(20) NOT NULL,
    Email VARCHAR(100),
    Direccion VARCHAR(200),
    Departamento VARCHAR(50),
    Municipio VARCHAR(50),
    Ocupacion VARCHAR(100),
    IngresoMensual DECIMAL(12,2),
    NombreEmpresa VARCHAR(100),
    TelefonoEmpresa VARCHAR(20),
    AniosEmpleo DECIMAL(3,1),
    FechaRegistro DATE DEFAULT GETDATE(),
    Estado VARCHAR(20) DEFAULT 'Activo'
);

CREATE TABLE Ventas (
    VentaID INT PRIMARY KEY IDENTITY(1,1),
    ClienteID INT NOT NULL,
    LoteID INT NOT NULL,
    FechaVenta DATE NOT NULL DEFAULT GETDATE(),
    TipoVenta VARCHAR(20) NOT NULL,
    MontoTotal DECIMAL(12,2) NOT NULL,
    Prima DECIMAL(12,2) DEFAULT 0,
    MontoFinanciado DECIMAL(12,2) NOT NULL,
    AniosPlazo INT NOT NULL,
    TasaInteresAplicada DECIMAL(5,2) NOT NULL,
    CuotaMensualEstimada DECIMAL(12,2),
    Estado VARCHAR(20) DEFAULT 'Activa',
    FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID),
    FOREIGN KEY (LoteID) REFERENCES Lotes(LoteID)
);

CREATE TABLE Aval (
    AvalID INT PRIMARY KEY IDENTITY(1,1),
    VentaID INT NOT NULL,
    NombreCompleto VARCHAR(100) NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    RTN VARCHAR(20),
    Telefono VARCHAR(20),
    Direccion VARCHAR(200),
    Ocupacion VARCHAR(100),
    IngresoMensual DECIMAL(12,2),
    ParentescoConCliente VARCHAR(50),
    FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID)
);

CREATE TABLE Beneficiarios (
    BeneficiarioID INT PRIMARY KEY IDENTITY(1,1),
    VentaID INT NOT NULL,
    NombreCompleto VARCHAR(100) NOT NULL,
    DNI VARCHAR(20) NOT NULL,
    Telefono VARCHAR(20),
    ParentescoConCliente VARCHAR(50) NOT NULL,
    PorcentajeHerencia DECIMAL(5,2) DEFAULT 100,
    FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID)
);

CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    NombreUsuario VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(256) NOT NULL,
    NombreCompleto VARCHAR(100) NOT NULL,
    Rol VARCHAR(20) NOT NULL,
    FechaCreacion DATE DEFAULT GETDATE(),
    Estado VARCHAR(20) DEFAULT 'Activo'
);

CREATE TABLE CuentaBancaria (
    CuentaID INT PRIMARY KEY IDENTITY(1,1),
    EtapaID INT NOT NULL,
    Banco VARCHAR(50) NOT NULL,
    NumeroCuenta VARCHAR(50) NOT NULL,
    TipoCuenta VARCHAR(20),
    SaldoActual DECIMAL(12,2) DEFAULT 0,
    Estado VARCHAR(20) DEFAULT 'Activa',
    FOREIGN KEY (EtapaID) REFERENCES Etapas(EtapaID)
);

CREATE TABLE PlanPagos (
    CuotaID INT PRIMARY KEY IDENTITY(1,1),
    VentaID INT NOT NULL,
    NumeroCuota INT NOT NULL,
    FechaVencimiento DATE NOT NULL,
    MontoCuota DECIMAL(12,2) NOT NULL,
    Capital DECIMAL(12,2) NOT NULL,
    Interes DECIMAL(12,2) NOT NULL,
    SaldoPendiente DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'Pendiente',
    FechaPago DATE,
    FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID)
);

CREATE TABLE Pagos (
    PagoID INT PRIMARY KEY IDENTITY(1,1),
    CuotaID INT NOT NULL,
    FechaPago DATE NOT NULL DEFAULT GETDATE(),
    MontoRecibido DECIMAL(12,2) NOT NULL,
    MetodoPago VARCHAR(20) NOT NULL,
    NumeroDeposito VARCHAR(50),
    CuentaBancariaID INT,
    UsuarioCajaID INT NOT NULL,
    Observaciones VARCHAR(200),
    FOREIGN KEY (CuotaID) REFERENCES PlanPagos(CuotaID),
    FOREIGN KEY (CuentaBancariaID) REFERENCES CuentaBancaria(CuentaID),
    FOREIGN KEY (UsuarioCajaID) REFERENCES Usuarios(UsuarioID)
);

CREATE TABLE Facturas (
    FacturaID INT PRIMARY KEY IDENTITY(1,1),
    PagoID INT NOT NULL,
    NumeroFactura VARCHAR(50) UNIQUE NOT NULL,
    CAI VARCHAR(50) NOT NULL,
    FechaEmision DATE NOT NULL DEFAULT GETDATE(),
    FechaLimiteEmision DATE,
    DesgloseCapital DECIMAL(12,2) NOT NULL,
    DesgloseInteres DECIMAL(12,2) NOT NULL,
    DesgloseIVA DECIMAL(12,2) DEFAULT 0,
    TotalFactura DECIMAL(12,2) NOT NULL,
    Estado VARCHAR(20) DEFAULT 'Emitida',
    UsuarioEmisionID INT NOT NULL,
    FOREIGN KEY (PagoID) REFERENCES Pagos(PagoID),
    FOREIGN KEY (UsuarioEmisionID) REFERENCES Usuarios(UsuarioID)
);

CREATE TABLE Gastos (
    GastoID INT PRIMARY KEY IDENTITY(1,1),
    ProyectoID INT NOT NULL,
    CuentaBancariaID INT NOT NULL,
    Concepto VARCHAR(100) NOT NULL,
    Categoria VARCHAR(50),
    Monto DECIMAL(12,2) NOT NULL,
    FechaGasto DATE NOT NULL,
    NumeroFacturaProveedor VARCHAR(50),
    Proveedor VARCHAR(100),
    UsuarioAutorizaID INT,
    UsuarioRegistraID INT NOT NULL,
    Estado VARCHAR(20) DEFAULT 'Aprobado',
    FOREIGN KEY (ProyectoID) REFERENCES Proyectos(ProyectoID),
    FOREIGN KEY (CuentaBancariaID) REFERENCES CuentaBancaria(CuentaID),
    FOREIGN KEY (UsuarioAutorizaID) REFERENCES Usuarios(UsuarioID),
    FOREIGN KEY (UsuarioRegistraID) REFERENCES Usuarios(UsuarioID)
);

CREATE TABLE CierreCaja (
    CierreID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioCajaID INT NOT NULL,
    FechaCierre DATE NOT NULL DEFAULT GETDATE(),
    Turno VARCHAR(20),
    TotalEfectivoRecibido DECIMAL(12,2) NOT NULL,
    TotalDepositadoBanco DECIMAL(12,2) NOT NULL,
    TotalGeneral DECIMAL(12,2) NOT NULL,
    CantidadPagosEfectivo INT DEFAULT 0,
    CantidadPagosDeposito INT DEFAULT 0,
    Observaciones VARCHAR(200),
    Estado VARCHAR(20) DEFAULT 'Pendiente',
    FOREIGN KEY (UsuarioCajaID) REFERENCES Usuarios(UsuarioID)
);

CREATE TABLE Auditoria (
    AuditoriaID INT PRIMARY KEY IDENTITY(1,1),
    TablaAfectada VARCHAR(50) NOT NULL,
    RegistroID INT NOT NULL,
    Accion VARCHAR(20) NOT NULL,
    FechaAccion DATETIME NOT NULL DEFAULT GETDATE(),
    UsuarioID INT,
    DatosAntiguos TEXT,
    DatosNuevos TEXT,
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);