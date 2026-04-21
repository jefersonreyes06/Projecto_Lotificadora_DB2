import { Router } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { poolConnect, pool } from "../config/db.js";

const router = Router();
/**
 * LISTAR PAGOS CON FILTROS OPCIONALES
 * GET /pagos
 * Query params: ventaId, clienteId, fechaInicio, fechaFin, metodoPago
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
    const pool = await poolConnect;
    const result = await pool.request().query("SELECT * FROM vw_prestamos_activos");
    res.json(result.recordset);
  })
);

/**
 * OBTENER LOTES DISPONIBLES AL CRÉDITO
 * GET /pagos/lotes/disponibles
 * Query params: dni, numeroLote, loteId
 */
router.get(
  "/lotes/disponibles",
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_obtener_plan_pagos", { 
      VentaID: parseInt(req.params.ventaId)
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
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_pagos_obtener", { 
      PagoID: parseInt(req.params.id)
    });
    res.json(result.recordset[0] ?? null);
  })
);

// ACTUALIZAR UN PAGO EXISTENTE (POR EJEMPLO, PARA REGISTRAR UN PAGO DE CUOTA)
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    console.log("Actualizar pago:", req.body);

    const params = {
      VentaID: req.params.id, // el id viene de la URL
      TipoPago: req.body.TipoPago || null,
      MontoRecibido: req.body.MontoRecibido || 0
    };

    const result = await executeProcedure("sp_generar_pago_cuota", params);
    res.json(result.recordset ?? result.returnValue);
  })
);

/**
 * REGISTRAR UN NUEVO PAGO (TRANSACCIONAL)
 * POST /pagos
 * Body: {
 *   cuotaId: number,
 *   montoRecibido: decimal,
 *   metodoPago: string ('Efectivo', 'Deposito', 'Transferencia'),
 *   numeroDeposito?: string,
 *   cuentaBancariaId?: number,
 *   usuarioCajaId: number,
 *   observaciones?: string,
 *   fechaPago?: date
 * }
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
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
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_pago_factura", { 
      PagoID: parseInt(req.params.id)
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
  asyncHandler(async (req, res) => {
    const { usuarioCajaId, fechaCierre } = req.body;
    console.log("Ejecutando cierre diario para fecha:", fechaCierre, "UsuarioCajaID:", usuarioCajaId);
    
    const result = await executeProcedure("sp_cierre_caja_diario", { 
      UsuarioCajaID: usuarioCajaId || 1,
      FechaCierre: fechaCierre || null
    });
    res.json(result.recordset[0]);
  })
);

/**
 * OBTENER RESUMEN DE CAJA DIARIO
 * GET /pagos/caja/resumen
 * Query params: fechaCierre, usuarioCajaId
 */

router.get("/cierre", (req, res) => {
  console.log("🔥 ENTRO AL ENDPOINT /cierre");
  console.log("QUERY:", req.query);

  res.json({ ok: true });
});
/*
router.get(
  "/cierre",
  asyncHandler(async (req, res) => {
    console.log("Obteniendo resumen de caja diario con params:", req.query);
    const { fechaCierre, usuarioCajaId } = req.query;

    console.log("QUERY:", req.query);

    const result = await executeProcedure("sp_resumen_caja_diario", {
      fechaCierre: fechaCierre || null,
      usuarioCajaId: usuarioCajaId || null
    });

    console.log("RESULT COMPLETO:", result);

    res.json(result.recordset);
  })
);*/
router.get("/__test__", (req, res) => {
  console.log("🔥 ROUTER INDEX FUNCIONA");
  res.json({ ok: true });
});

export default router;