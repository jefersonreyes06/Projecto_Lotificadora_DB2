# Inicialización de Base de Datos con Triggers

## Resumen
Este proyecto incluye 10 triggers automatizados que mantienen la integridad de datos y ejecutan lógica de negocio automáticamente.

## Triggers Implementados

### 1-2. Triggers para LOTES
- `tr_Lotes_Insert_UpdateAreaBloque` - Actualiza área total del bloque al insertar lotes
- `tr_Lotes_Delete_UpdateAreaBloque` - Recalcula área del bloque al eliminar lotes

### 3-5. Triggers para VENTAS
- `tr_Ventas_Insert_UpdateLoteStatus` - Marca lote como "Vendido" y registra auditoría
- `tr_Ventas_Update_RevertLoteStatus` - Revierte lote a "Disponible" si venta se cancela
- `tr_Ventas_Update_Auditoria` - Registra cambios críticos en ventas

### 6-7. Triggers para PAGOS
- `tr_Pagos_Insert_UpdateCuota` - Actualiza cuota a "Pagada" al registrar pago
- `tr_Pagos_Insert_UpdateVentaSaldo` - Actualiza saldos y registra auditoría

### 8-9. Triggers para CLIENTES
- `tr_Clientes_Update_Auditoria` - Registra modificaciones en datos de clientes
- `tr_Clientes_Update_ValidateVentas` - Previene desactivar clientes con ventas activas

### 10. Trigger de VALIDACIÓN
- `tr_Lotes_Delete_ValidateEstado` - Impide eliminar lotes vendidos

## Cómo Inicializar

### Opción 1: Script Automático (Recomendado)
```bash
# Desde la raíz del proyecto
npm run init:db
```

### Opción 2: SQL Server Management Studio
```sql
-- Ejecutar en orden:
:r Proyecto_Lotificadora_SQL_BD2/InicializarBaseDatos.sql
```

### Opción 3: Manual por Archivos
```sql
-- 1. Crear base de datos
:r Proyecto_Lotificadora_SQL_BD2/CrearBaseDatos.sql

-- 2. Crear tablas
:r Proyecto_Lotificadora_SQL_BD2/CreacionDeTablas.sql

-- 3. Crear funciones
:r Proyecto_Lotificadora_SQL_BD2/FuncionesEscalares.sql

-- 4. Crear procedimientos
:r Proyecto_Lotificadora_SQL_BD2/ProcedimientosAlmacenados.sql
-- (y todos los demás archivos de procedimientos)

-- 5. Crear procedimientos transaccionales
:r Proyecto_Lotificadora_SQL_BD2/ProcedimientosTransaccionales.sql

-- 6. Crear vistas
:r Proyecto_Lotificadora_SQL_BD2/Vistas.sql

-- 7. IMPORTANTE: Crear triggers al final
:r Proyecto_Lotificadora_SQL_BD2/Triggers.sql
```

## Verificación

Después de la inicialización, ejecuta el script de prueba:
```sql
:r Proyecto_Lotificadora_SQL_BD2/PruebaFuncionesEscalares.sql
```

## Funcionalidades Automáticas

Una vez conectados los triggers, el sistema automáticamente:

1. **Mantiene áreas actualizadas** - Los bloques siempre tienen áreas calculadas correctamente
2. **Gestiona estados** - Lotes cambian automáticamente entre "Disponible" y "Vendido"
3. **Registra auditoría** - Todas las operaciones críticas quedan registradas
4. **Valida integridad** - Previene operaciones inválidas (ej: eliminar lotes vendidos)
5. **Actualiza saldos** - Los pagos mantienen consistentes los saldos de ventas

## Archivos Relacionados

- `Triggers.sql` - Definición de todos los triggers
- `InicializarBaseDatos.sql` - Script maestro de inicialización
- `server/scripts/init-db.js` - Script Node.js para inicialización automática
- `README_Transacciones.md` - Documentación de procedimientos transaccionales

## Notas Importantes

- **Orden de ejecución**: Los triggers deben ejecutarse al final, después de crear todas las tablas y procedimientos
- **Dependencias**: Algunos triggers dependen de la tabla `Auditoria` para registrar cambios
- **Performance**: Los triggers están optimizados para no afectar el rendimiento de operaciones normales
- **Testing**: Prueba las operaciones CRUD después de conectar los triggers para verificar funcionamiento