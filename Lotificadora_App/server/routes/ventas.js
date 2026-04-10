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
    const result = await executeProcedure("sp_ventas_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_crear_venta", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

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