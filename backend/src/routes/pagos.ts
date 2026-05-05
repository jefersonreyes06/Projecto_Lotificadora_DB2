import { Router, Request, Response } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
/**
 * LISTAR PAGOS CON FILTROS OPCIONALES
 * GET /pagos
 * Query params: ventaId, clienteId, fechaInicio, fechaFin, metodoPago
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { ventaId, clienteId, fechaInicio, fechaFin, metodoPago } = req.query;
    const result = await executeProcedure("sp_pagos_listar", {
      VentaID: ventaId || null,
      ClienteID: clienteId || null,
      FechaInicio: fechaInicio || null,
      FechaFin: fechaFin || null,
      MetodoPago: metodoPago || null
    });
    res.json(result.recordset);
  })
);


// OBTENER UNA VISTA CON TODAS LAS CUENTAS PENDIENTES DE PAGO (CRÉDITOS ACTIVOS)
router.get(
  "/prestamos-activos",
  asyncHandler(async (req: Request, res: Response) => {
    const { Estado, Cliente } = req.query;

    const result = await executeProcedure("sp_ver_cuentas", {
      Estado: Estado === "null" || !Estado ? null : Estado,
      Cliente: Cliente === "null" || !Cliente ? null : Cliente,
    });

    const dataToSend = result && result.recordset ? result.recordset : [];
    res.json(dataToSend);
  })
);

/**
 * OBTENER LOTES DISPONIBLES AL CRÉDITO
 * GET /pagos/lotes/disponibles
 * Query params: dni, numeroLote, loteId
 */
router.get(
  "/lotes/disponibles",
  asyncHandler(async (req: Request, res: Response) => {
    const { dni, numeroLote, loteId } = req.query;
    const result = await executeProcedure("sp_lotes_disponibles_credito", {
      DNI: dni || null,
      NumeroLote: numeroLote || null,
      LoteID: loteId || null
    });
    res.json(result.recordset);
  })
);

/**
 * OBTENER PLAN DE PAGOS (CUOTAS) DE UNA VENTA
 * GET /pagos/plan-pagos/:ventaId
 */
router.get(
  "/plan-pagos/:ventaId",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_obtener_plan_pagos", {
      VentaID: req.params.ventaId || null
    });
    res.json(result.recordset);
  })
);

/**
 * OBTENER DETALLE DE UN PAGO ESPECÍFICO
 * GET /pagos/:id
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_pagos_obtener", {
      PagoID: req.params.id || null
    });
    res.json(result.recordset[0] ?? null);
  })
);

// ACTUALIZAR UN PAGO EXISTENTE (POR EJEMPLO, PARA REGISTRAR UN PAGO DE CUOTA)
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const params = {
      VentaID: req.params.id, // el id viene de la URL
      TipoPago: req.body.TipoPago || null,
      MontoRecibido: req.body.MontoRecibido || 0
    };

    const result = await executeProcedure("sp_generar_pago_cuota", params);
    res.json(result.recordset ?? result.returnValue);
  })
);

/*
 * REGISTRAR UN NUEVO PAGO (TRANSACCIONAL)
 * POST /pagos
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      cuotaId,
      montoRecibido,
      metodoPago,
      numeroDeposito,
      cuentaBancariaId,
      usuarioCajaId,
      observaciones,
      fechaPago
    } = req.body;

    // Validar parámetros requeridos
    if (!cuotaId || !montoRecibido || !metodoPago || !usuarioCajaId) {
      return res.status(400).json({
        error: "Parámetros requeridos faltantes: cuotaId, montoRecibido, metodoPago, usuarioCajaId"
      });
    }

    // Transaccional: sp_registrar_pago_completo
    // Valida cuota, registra pago, actualiza saldos y genera factura en una sola transacción
    const result = await executeProcedure("sp_registrar_pago_completo", {
      CuotaID: parseInt(cuotaId),
      MontoRecibido: parseFloat(montoRecibido),
      MetodoPago: metodoPago,
      NumeroDeposito: numeroDeposito || null,
      CuentaBancariaID: cuentaBancariaId || null,
      UsuarioCajaID: parseInt(usuarioCajaId),
      Observaciones: observaciones || null,
      FechaPago: fechaPago || null
    });
    res.json(result.recordset[0]);
  })
);

/**
 * OBTENER FACTURA DE UN PAGO
 * GET /pagos/:id/factura
 */
router.get(
  "/:id/factura",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_pago_factura", {
      PagoID: req.params.id || null
    });
    res.json(result.recordset[0] ?? null);
  })
);

/**
 * REGISTRAR CIERRE DE CAJA DIARIO
 * POST /pagos/cierre-diario
 * Body: {
 *   usuarioCajaId?: number,
 *   fechaCierre?: date,
 *   turno?: string
 * }
 */
router.post(
  "/cierre-diario",
  asyncHandler(async (req: Request, res: Response) => {
    const { usuarioCajaId, fechaCierre } = req.body;

    const result = await executeProcedure("sp_cierre_caja_diario", {
      UsuarioCajaID: usuarioCajaId || 1,
      FechaCierre: fechaCierre || null
    });
    res.json(result.recordset[0]);
  })
);

router.post("/registrar", async (req, res) => {
  const { VentaID, ClienteID, MontoRecibido } = req.body;

  const result = await executeProcedure("sp_abono_cuota_cascada", {
    ClienteID: ClienteID,
    VentaID: VentaID,
    MontoAbono: MontoRecibido,
    TipoAbono: "Cuota",
  });

  res.json(result.recordset ?? result.returnValue);
})

export default router;