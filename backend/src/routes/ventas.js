import { Router } from "express";
import { executeProcedure, querySql } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_listar");
    res.json(result.recordset);
  })
);

router.get(
  "/estadisticas",
  asyncHandler(async (req, res) => {
    // Use direct SQL queries since procedures might not exist
    const [totalResult, contadoResult, creditoResult, moraResult] = await Promise.all([
      querySql("SELECT COUNT(*) as total FROM Ventas WHERE Estado <> 'Cancelada'"),
      querySql("SELECT COUNT(*) as total FROM Ventas WHERE TipoVenta = 'Contado' AND Estado <> 'Cancelada'"),
      querySql("SELECT COUNT(*) as total FROM Ventas WHERE TipoVenta = 'Credito' AND Estado <> 'Cancelada'"),
      querySql(`
        SELECT COUNT(DISTINCT v.VentaID) as total
        FROM Ventas v
        INNER JOIN PlanPagos pp ON v.VentaID = pp.VentaID
        WHERE v.TipoVenta = 'Credito'
          AND v.Estado = 'Activa'
          AND pp.Estado <> 'Pagada'
          AND pp.FechaVencimiento < GETDATE()
      `)
    ]);

    res.json({
      total_ventas: totalResult.recordset[0].total,
      total_contado: contadoResult.recordset[0].total,
      total_credito: creditoResult.recordset[0].total,
      total_mora: moraResult.recordset[0].total
    });
  })
);


router.post(
  "/",
  asyncHandler(async (req, res) => {
    if (req.body.TipoVenta === "Credito") {
      var MontoFinanciado = req.body.MontoTotal - (req.body.Prima || 0);
      var aniosPlazo = req.body.AniosPlazo || 0;
      var tasaInteres = req.body.TasaInteresAplicada || 12.0;
      var cuotaMensualEstimada = (MontoFinanciado * (tasaInteres / 100)) / (1 - Math.pow(1 + (tasaInteres / 100), -aniosPlazo * 12));
    }

    const params = {
      ClienteID: req.body.ClienteID,
      BeneficiarioID: req.body.BeneficiarioID,
      AvalID: req.body.AvalID,
      UsuarioID: 1, // Cambiar por ID real del usuario autenticado
      LoteID: req.body.LoteID,
      TipoVenta: req.body.TipoVenta,
      MontoTotal: req.body.MontoTotal,
      Prima: req.body.Prima || 0,
      MontoFinanciado: MontoFinanciado || 0,
      AniosPlazo: aniosPlazo || 0,
      TasaInteresAplicada: tasaInteres || 12.0,
      CuotaMensualEstimada: cuotaMensualEstimada || 0,
      Estado: req.body.TipoVenta === "Contado" ? "Finalizada" : "En Proceso"
    };

    const result = await executeProcedure("sp_crear_venta_lote", params);
    res.json(result.recordset[0]);
  })
);


// Cancelar venta completa (transaccional)
router.post(
  "/:id/cancelar",
  asyncHandler(async (req, res) => {
    const { motivoCancelacion } = req.body;
    const result = await executeProcedure("sp_cancelar_venta_completa", {
      VentaID: req.params.id,
      MotivoCancelacion: motivoCancelacion || 'Cancelación solicitada por usuario'
    });
    res.json(result.recordset[0]);
  })
);

// Ruta para listar lotes disponibles
router.get(
  "/lotes/disponibles",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_lotes_disponibles");
    res.json(result.recordset);
  })
);




// ====================
// ESTADÍSTICAS DE VENTAS
// ====================

router.get(
  "/estadisticas/contado",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_contar_contado");
    res.json({ total: result.recordset[0]?.total_contado ?? 0 });
  })
);

router.get(
  "/estadisticas/credito",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_contar_credito");
    res.json({ total: result.recordset[0]?.total_credito ?? 0 });
  })
);

router.get(
  "/estadisticas/mora",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_contar_mora");
    res.json({ total: result.recordset[0]?.total_mora ?? 0 });
  })
);

router.get(
  "/estadisticas",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_estadisticas");
    res.json(result.recordset[0] ?? {
      total_ventas: 0,
      total_contado: 0,
      total_credito: 0,
      total_mora: 0
    });
  })
);


router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_obtener_por_id", { VentaID: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.get(
  "/:id/plan-pagos",
  asyncHandler(async (req, res) => {
    const result = await querySql(
      `SELECT * FROM fn_plan_pago_cliente(${parseInt(req.params.id)})`
    );

    res.json(result.recordset ?? null);
  })
);

router.get(
  "/:id/cuotas-pendientes",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM fn_tabla_pagos_pendientes(@id)", { id: req.params.id });
    res.json(result.recordset);
  })
);
// ------------------
router.post(
  "/:id/plan-pagos",
  asyncHandler(async (req, res) => {
    const payload = { ventaId: req.params.id, ...req.body };

    // Transaccional: sp_generar_plan_pagos
    // Genera el plan de pagos completo para la venta.
    const result = await executeProcedure("sp_generar_plan_pagos", payload);
    res.json(result.recordset);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = { VentaID: req.params.id, ...req.body };
    const result = await executeProcedure("sp_ventas_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ventas_eliminar", { VentaID: req.params.id });
    res.json(result.recordset ?? result.returnValue);
  })
);

export default router;