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
    const { cuotaId, montoRecibido, metodoPago, numeroDeposito, cuentaBancariaId, usuarioCajaId, observaciones } = req.body;
    
    // Transaccional: sp_registrar_pago_completo
    // Valida cuota, registra pago, actualiza saldos y genera factura en una sola transacción.
    const result = await executeProcedure("sp_registrar_pago_completo", {
      CuotaID: cuotaId,
      MontoRecibido: montoRecibido,
      MetodoPago: metodoPago,
      NumeroDeposito: numeroDeposito,
      CuentaBancariaID: cuentaBancariaId,
      UsuarioCajaID: usuarioCajaId,
      Observaciones: observaciones
    });
    res.json(result.recordset[0]);
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