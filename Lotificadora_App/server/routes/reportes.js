import { Router } from "express";
import { executeProcedure, querySql, buildViewQuery } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/ocupacion-lotes",
  asyncHandler(async (req, res) => {
    const { sql, params } = buildViewQuery("vw_ocupacion_lotes", req.query);
    const result = await querySql(sql, params);
    res.json(result.recordset);
  })
);

router.get(
  "/resumen-proyectos",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM vw_resumen_proyectos");
    res.json(result.recordset);
  })
);

router.get(
  "/morosos",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_reporte_morosos", { dias: req.query.dias });
    res.json(result.recordset);
  })
);

router.get(
  "/ingresos",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_ingresos_mes", {
      anio: req.query.anio,
      mes: req.query.mes,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/lotes-etapa/:etapaId",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM fn_lotes_por_etapa(@etapaId)", {
      etapaId: req.params.etapaId,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/clientes-proyecto/:proyectoId",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM fn_clientes_por_proyecto(@proyectoId)", {
      proyectoId: req.params.proyectoId,
    });
    res.json(result.recordset);
  })
);

export default router;