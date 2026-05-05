import { Router, Request, Response } from "express";
import { executeProcedure, querySql, buildViewQuery } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/ocupacion-lotes",
  asyncHandler(async (req: Request, res: Response) => {
    const { sql, params } = buildViewQuery("vw_ocupacion_lotes", req.query);
    const result = await querySql(sql, params);
    res.json(result.recordset);
  })
);

router.get(
  "/resumen-proyectos",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM vw_resumen_proyectos");
    res.json(result.recordset);
  })
);

router.get(
  "/morosos",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_reporte_morosos", { dias: req.query.dias });
    res.json(result.recordset);
  })
);

router.get(
  "/ingresos",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_ingresos_mes", {
      anio: req.query.anio,
      mes: req.query.mes,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/lotes-etapa/:etapaId",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_lotes_por_etapa(@etapaId)", {
      etapaId: req.params.etapaId,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/clientes-proyecto/:proyectoId",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_clientes_por_proyecto(@proyectoId)", {
      proyectoId: req.params.proyectoId,
    });
    res.json(result.recordset);
  })
);

// NUEVAS FUNCIONES DE TIPO TABLA

router.get(
  "/lotes-disponibles-proyecto/:proyectoId",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_lotes_disponibles_por_proyecto(@proyectoId)", {
      proyectoId: req.params.proyectoId,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/historial-pagos-cliente/:clienteId",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_historial_pagos_cliente(@clienteId)", {
      clienteId: req.params.clienteId,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/cuotas-vencidas",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_cuotas_vencidas()");
    res.json(result.recordset);
  })
);

router.get(
  "/ventas-por-mes/:anio",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_ventas_por_mes(@anio)", {
      anio: req.params.anio,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/estadisticas-lotes-estado",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_estadisticas_lotes_por_estado()");
    res.json(result.recordset);
  })
);

export default router;