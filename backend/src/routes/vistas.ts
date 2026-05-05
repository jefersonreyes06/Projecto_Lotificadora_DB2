import { Router, Request, Response } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// vw_ocupacion_lotes
router.get('/ocupacion-lotes', asyncHandler(async (req: Request, res: Response) => {
  const result = await executeProcedure('sp_vw_ocupacion_lotes', {
    estado: req.query.estado || null,
  });
  res.json(result.recordset);
}));

// vw_resumen_proyectos
router.get('/resumen-proyectos', asyncHandler(async (req: Request, res: Response) => {
  const result = await executeProcedure('sp_vw_resumen_proyectos', {});
  res.json(result.recordset[0]);
}));

export default router;