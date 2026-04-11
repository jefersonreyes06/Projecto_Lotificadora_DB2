-- Script de inicialización completo de la base de datos
-- Ejecutar en orden para configurar completamente el sistema

USE IngenierosEnProceso
GO

-- 1. Crear tablas base
:r CreacionDeTablas.sql
GO

-- 2. Crear funciones escalares para dashboard
:r FuncionesEscalares.sql
GO

-- 2a. Crear funciones tipo tabla para reportes y plan de pagos
:r FuncionesTipoTabla.sql
GO

-- 3. Crear procedimientos almacenados
:r ProcedimientosAlmacenados.sql
:r ProcedimientosAlmacenadosBloques.sql
:r ProcedimientosAlmacenadosClientes.sql
:r ProcedimientosAlmacenadosCuentas.sql
:r ProcedimientosAlmacenadosLotes.sql
:r ProcedimientosAlmacenadosProyectos.sql
:r ProcedimientosAlmacenadosVentas.sql
GO

-- 4. Crear procedimientos transaccionales
:r ProcedimientosTransaccionales.sql
GO

-- 5. Crear vistas
:r Vistas.sql
GO

-- 6. Crear triggers (IMPORTANTE: Los triggers deben ejecutarse al final)
:r Triggers.sql
GO

-- 7. Ejecutar pruebas de funcionalidad
:r PruebaTriggers.sql
GO

PRINT '=== BASE DE DATOS INICIALIZADA COMPLETAMENTE ==='
PRINT 'Triggers incluidos:'
PRINT '- 2 triggers para LOTES (actualización de áreas)'
PRINT '- 3 triggers para VENTAS (estados y auditoría)'
PRINT '- 2 triggers para PAGOS (actualización de cuotas y saldos)'
PRINT '- 2 triggers para CLIENTES (auditoría)'
PRINT '- 1 trigger para VALIDACIÓN (prevención de eliminaciones)'
PRINT ''
PRINT '=== PRUEBAS EJECUTADAS ==='
PRINT 'Si no hay errores arriba, todos los triggers funcionan correctamente.'
GO