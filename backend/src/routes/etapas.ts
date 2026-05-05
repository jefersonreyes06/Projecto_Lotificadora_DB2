import { Router, Request, Response } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_etapas_listar", {
      proyectoId: req.query.proyectoId,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_etapas_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_etapas_crear", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = { EtapaID: req.params.id, ...req.body };
    const result = await executeProcedure("sp_etapas_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_etapas_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

router.get(
  "/:id/cuentas",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_etapas_cuentas", { id: req.params.id });
    res.json(result.recordset);
  })
);

export default router;