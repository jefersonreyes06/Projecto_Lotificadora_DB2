import { Router } from "express";
import { executeProcedure, querySql } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_clientes_listar", { q: req.query.q });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_clientes_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_clientes_crear", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = { id: req.params.id, ...req.body };
    const result = await executeProcedure("sp_clientes_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_clientes_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

router.get(
  "/:id/historial",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM vw_historial_cliente WHERE clienteId = @id", {
      id: req.params.id,
    });
    res.json(result.recordset);
  })
);

export default router;