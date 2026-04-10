import { Router } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_pagos_listar", { ventaId: req.query.ventaId });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_pagos_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_registrar_pago", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.post(
  "/cierre-diario",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_cierre_caja_diario", { fecha: req.body.fecha });
    res.json(result.recordset);
  })
);

router.get(
  "/:id/factura",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_pago_factura", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

export default router;