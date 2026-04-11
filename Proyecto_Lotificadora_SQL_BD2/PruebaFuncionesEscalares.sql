-- Script completo para ejecutar todas las funciones escalares del dashboard
-- Ejecutar en orden: 1) FuncionesEscalares.sql, 2) Ejecutar consultas de prueba

USE IngenierosEnProceso
GO

-- Verificar que las funciones existen y funcionan
PRINT '=== PRUEBA DE FUNCIONES ESCALARES ==='

-- 1. Proyectos activos
DECLARE @proyectos INT;
EXEC @proyectos = dbo.fn_ContarProyectosActivos;
PRINT 'Proyectos activos: ' + CAST(@proyectos AS VARCHAR(10));

-- 2. Lotes disponibles
DECLARE @lotes INT;
EXEC @lotes = dbo.fn_LotesDisponibles;
PRINT 'Lotes disponibles: ' + CAST(@lotes AS VARCHAR(10));

-- 3. Ventas del mes actual
DECLARE @ventas INT;
EXEC @ventas = dbo.fn_VentasMesActual;
PRINT 'Ventas este mes: ' + CAST(@ventas AS VARCHAR(10));

-- 4. Pagos pendientes
DECLARE @pagos INT;
EXEC @pagos = dbo.fn_PagosPendientes;
PRINT 'Pagos pendientes: ' + CAST(@pagos AS VARCHAR(10));

-- 5. Ingresos del mes actual
DECLARE @ingresos DECIMAL(12,2);
EXEC @ingresos = dbo.fn_IngresosMesActual;
PRINT 'Ingresos este mes: L ' + CAST(@ingresos AS VARCHAR(20));

PRINT '=== FUNCIONES VERIFICADAS EXITOSAMENTE ==='
GO