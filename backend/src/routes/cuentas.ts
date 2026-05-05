import { Router, Request, Response } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_cuentas_listar", { etapaId: req.query.etapaId });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_cuentas_obtener", { id: req.params.id });
    if (result.recordset && result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: "Cuenta no encontrada" });
    }
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = {
      EtapaID: parseInt(req.body.EtapaID),
      Banco: req.body.Banco,
      NumeroCuenta: req.body.NumeroCuenta,
      TipoCuenta: req.body.TipoCuenta,
      SaldoActual: parseFloat(req.body.SaldoActual) || 0,
      Estado: req.body.Estado
    }
    const result = await executeProcedure("sp_cuentas_crear", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const payload = {
      id: req.params.id,
      EtapaID: parseInt(req.body.EtapaID),
      Banco: req.body.Banco,
      NumeroCuenta: req.body.NumeroCuenta,
      TipoCuenta: req.body.TipoCuenta,
      SaldoActual: parseFloat(req.body.SaldoActual) || 0,
      Estado: req.body.Estado
    }
    const result = await executeProcedure("sp_cuentas_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_cuentas_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

router.get(
  "/:id/movimientos",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_cuentas_movimientos", { id: req.params.id });
    res.json(result.recordset);
  })
);

export default router;