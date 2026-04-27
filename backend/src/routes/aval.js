import { Router } from "express";
import { executeProcedure, querySql } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// Listar Avales con búsqueda opcional
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_aval_listar", { q: req.query.q });
    res.json(result.recordset);
  })
);

// Obtener cliente por DNI
router.get(
  "/dni/:dni",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_aval_obtener_por_dni", { dni: req.params.dni });
    res.json(result.recordset[0] ?? null);
  })
);

// Obtener cliente por ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_aval_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const capacidadPago = req.body.ingreso_mensual
      ? parseFloat(req.body.ingreso_mensual) * 0.3
      : null;

    const params = {
      NombreCompleto: `${req.body.nombre} ${req.body.apellido}`,
      DNI: req.body.dni,
      RTN: req.body.rtn || null,
      Telefono: req.body.telefono,
      Email: req.body.correo || null,
      Direccion: req.body.direccion || null,
      Departamento: req.body.departamento || null,
      Municipio: req.body.municipio || null,
      Ocupacion: req.body.cargo || null,
      NombreEmpresa: req.body.empresa || null,
      TelefonoEmpresa: req.body.telefono_trabajo || null,
      AniosEmpleo: req.body.anios_laborando || null,
      IngresoMensual: req.body.ingreso_mensual || null,
      CapacidadPago: capacidadPago,
    };

    const result = await executeProcedure("sp_aval_crear", params);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    // Calcular capacidad de pago si se proporciona ingreso
    const capacidadPago = req.body.ingreso_mensual ? parseFloat(req.body.ingreso_mensual) * 0.3 : null;

    const params = {
      id: req.params.id,
      NombreCompleto: req.body.nombreCompleto || null,
      DNI: req.body.dni || null,
      RTN: req.body.rtn || null,
      Telefono: req.body.telefono || null,
      TelefonoAlt: req.body.telefono_alt || null,
      Email: req.body.correo || null,
      Direccion: req.body.direccion || null,
      Departamento: req.body.departamento || null,
      Municipio: req.body.municipio || null,
      EstadoCivil: req.body.estado_civil || null,
      Genero: req.body.genero || null,
      Ocupacion: req.body.cargo || null,
      FechaNacimiento: req.body.fecha_nacimiento || null,
      NombreEmpresa: req.body.empresa || null,
      TelefonoEmpresa: req.body.telefono_trabajo || null,
      AniosEmpleo: req.body.anios_laborando || null,
      IngresoMensual: req.body.ingreso_mensual || null,
      CapacidadPago: capacidadPago,
      Estado: req.body.estado || null,
    };

    const result = await executeProcedure("sp_aval_actualizar", params);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_aval_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

router.get(
  "/:id/historial",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM vw_historial_aval WHERE clienteId = @id", {
      id: req.params.id,
    });
    res.json(result.recordset);
  })
);

export default router;