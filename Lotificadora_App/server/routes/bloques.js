import { Router } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_bloques_listar", {
      etapaId: req.query.etapaId,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_bloques_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_bloques_crear", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = { id: req.params.id, ...req.body };
    const result = await executeProcedure("sp_bloques_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_bloques_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

export default router;