# Correcciones de Conflictos - Lotes y Clientes

## Problemas Identificados y Resueltos

### 1. **Error: `sp_clientes_listar` no existe**

**Causa**: Había definiciones duplicadas en dos archivos diferentes:
- `ProcedimientosAlmacenados.sql` (con alias snake_case: `nombre_completo`)
- `ProcedimientosAlmacenadosClientes.sql` (con alias camelCase: `nombreCompleto`)

**Solución**:
- ✅ Consolidado en `ConsolidacionCorrecciones.sql`
- ✅ El procedimiento ahora usa `camelCase` (coherente con el resto de la API)
- ✅ Se ejecutará automáticamente durante la inicialización

```sql
-- Retorna columnas con alias camelCase:
- id (ClienteID)
- nombreCompleto
- dni, rtn, telefono, email
- direccion, departamento, municipio
- ocupacion, ingresoMensual, nombreEmpresa
- telefonoEmpresa, aniosEmpleo, fechaRegistro
- estado
```

**Estado**: ✅ CORREGIDO

---

### 2. **Duplicación de Lotes: 4 lotes por 1 (causa: 2 triggers conflictivos)**

**Causa Raíz**: Dos triggers disparaban `AFTER INSERT ON Ventas` y ambos actualizaban Lotes:

1. **Trigger Original** (Triggers.sql):
   ```
   tr_Ventas_Insert_UpdateLoteStatus
   - Cambia Estado del Lote a 'Vendido'
   ```

2. **Trigger Duplicado** (ProcedimientosAlmacenadosVentas.sql):
   ```
   trg_venta_actualizar_lote
   - Hacía lo MISMO que el anterior
   - Causaba ejecución duplicada y cálculos incorrectos
   ```

**Efecto**:
- Cuando se creaba 1 Venta:
  - 1° se disparaba `tr_Ventas_Insert_UpdateLoteStatus` → actualizaba Lote 1 vez
  - 2° se disparaba `trg_venta_actualizar_lote` → actualizaba Lote 2ª vez
  - Esto causaba cálculos duplicados y 4 filas idénticas en algunos casos

**Solución**:
- ✅ **Eliminado** el trigger duplicado `trg_venta_actualizar_lote`
- ✅ **Actualizado** `tr_Ventas_Insert_UpdateLoteStatus` para manejar ambos tipos de venta:
  - **Contado** → Estado = 'Vendido'
  - **Crédito** → Estado = 'Reservado'

**Código actualizado**:
```sql
CREATE OR ALTER TRIGGER tr_Ventas_Insert_UpdateLoteStatus
ON Ventas
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE l
    SET l.Estado = CASE 
                      WHEN i.TipoVenta = 'Contado' THEN 'Vendido'
                      WHEN i.TipoVenta = 'Credito' THEN 'Reservado'
                      ELSE 'Vendido'
                   END,
        l.FechaVenta = GETDATE()
    FROM Lotes l
    INNER JOIN inserted i ON l.LoteID = i.LoteID
    WHERE l.Estado = 'Disponible';
END
```

**Estado**: ✅ CORREGIDO

---

## Archivos Modificados

### 1. **ConsolidacionCorrecciones.sql** (NUEVO)
- Archivo de consolidación que se ejecuta al final de la inicialización
- Elimina triggers conflictivos
- Verifica y crea `sp_clientes_listar` si no existe
- Actualiza triggers consolidados

### 2. **ProcedimientosAlmacenadosVentas.sql** (MODIFICADO)
- **Eliminado**: Trigger `trg_venta_actualizar_lote` (líneas 204-225)
- **Mantenido**: Todos los procedimientos almacenados
- **Añadido**: Comentario explicativo sobre la eliminación

### 3. **InicializarBaseDatos.sql** (MODIFICADO)
- **Añadido**: Referencia a `ConsolidacionCorrecciones.sql` al paso 8
- Ahora ejecuta la consolidación después de todas las definiciones

### 4. **Triggers.sql** (ACTUALIZADO VÍA ConsolidacionCorrecciones.sql)
- Trigger `tr_Ventas_Insert_UpdateLoteStatus` consolidado con lógica mejorada

---

## Cómo Aplicar las Correcciones

### **Opción 1: Nueva instalación completa**
```sql
-- Ejecutar en SQL Server
:r InicializarBaseDatos.sql
```
✅ Todos los cambios se aplican automáticamente

### **Opción 2: Base de datos existente (aplicar solo correcciones)** 
```sql
-- Ejecutar solo el archivo de consolidación
:r ConsolidacionCorrecciones.sql
```

---

## Verificación

Después de aplicar las correcciones, ejecutar:

```sql
-- 1. Verificar que sp_clientes_listar existe
EXEC sp_clientes_listar

-- 2. Verificar trigger ÚNICO en Ventas
SELECT * FROM sys.triggers 
WHERE parent_class_desc = 'OBJECT' 
  AND OBJECT_NAME(parent_id) = 'Ventas'

-- 3. Crear una venta de prueba (debe crear 1 lote, no 4)
EXEC sp_crear_venta_completa 
    @ClienteID = 1, 
    @LoteID = 1, 
    @TipoVenta = 'Contado',
    @Prima = 50000,
    @AniosPlazo = 10,
    @TasaInteresAplicada = 5.5
```

---

## Resumen de Cambios

| Problema | Causa | Solución | Estado |
|----------|-------|----------|--------|
| `sp_clientes_listar` no existe | Duplicados con convenciones distintas | Consolidado en ConsolidacionCorrecciones.sql | ✅ |
| 4 Lotes por 1 | Triggers duplicados AFTER INSERT | Eliminado trg_venta_actualizar_lote | ✅ |
| Cálculos incorrectos | Triggers ejecutándose 2 veces | Consolidado en tr_Ventas_Insert_UpdateLoteStatus | ✅ |

---

**Última actualización**: Abril 11, 2026
