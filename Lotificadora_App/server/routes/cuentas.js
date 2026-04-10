import { Router } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_cuentas_listar", { etapaId: req.query.etapaId });
    res.json(result.recordset);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_cuentas_crear", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = { id: req.params.id, ...req.body };
    const result = await executeProcedure("sp_cuentas_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_cuentas_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

router.get(
  "/:id/movimientos",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_cuentas_movimientos", { id: req.params.id });
    res.json(result.recordset);
  })
);

export default router;