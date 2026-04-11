import { Router } from "express";
import { executeProcedure, querySql } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_listar");
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_obtener_por_id", { VentaID: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_insertar", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = { VentaID: req.params.id, ...req.body };
    const result = await executeProcedure("sp_ventas_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_eliminar", { VentaID: req.params.id });
    res.json(result.recordset ?? result.returnValue);
  })
);

// Ruta para listar lotes disponibles
router.get(
  "/lotes/disponibles",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_lotes_disponibles");
    res.json(result.recordset);
  })
);

// ------------------
router.post(
  "/:id/plan-pagos",
  asyncHandler(async (req, res) => {
    const payload = { ventaId: req.params.id, ...req.body };
    const result = await executeProcedure("sp_generar_plan_pagos", payload);
    res.json(result.recordset);
  })
);

router.get(
  "/:id/plan-pagos",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM fn_plan_pagos(@id)", { id: req.params.id });
    res.json(result.recordset);
  })
);

router.get(
  "/:id/amortizacion",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM fn_tabla_amortizacion(@id)", { id: req.params.id });
    res.json(result.recordset);
  })
);

router.get(
  "/:id/cuotas-pendientes",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM fn_tabla_pagos_pendientes(@id)", { id: req.params.id });
    res.json(result.recordset);
  })
);

export default router;