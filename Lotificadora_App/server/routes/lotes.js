import { Router } from "express";
import { executeProcedure, querySql, buildViewQuery } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/disponibles",
  asyncHandler(async (req, res) => {
    const { sql, params } = buildViewQuery("vw_lotes_disponibles", req.query);
    const result = await querySql(sql, params);
    res.json(result.recordset);
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_lotes_listar", {
      bloqueId: req.query.bloqueId || null,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_lotes_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_lotes_crear", {
      BloqueID: req.body.BloqueID,
      AreaVaras: req.body.AreaVaras,
      Estado: req.body.Estado || 'Disponible',
    });
    res.json(result.recordset[0]);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { BloqueID, AreaVaras, Estado = 'Disponible'} = req.body;

    const result = await executeProcedure("sp_lotes_actualizar", {
      id: req.params.id,
      BloqueID: BloqueID,
      AreaVaras: AreaVaras,
      Estado: Estado
    });
    
    /*const params = {
      //id: req.params.id,
      BloqueID: bloqueId,
      AreaVaras: areaVaras,
      Estado: estado,
    };

    const result = await executeProcedure("sp_lotes_actualizar", params);*/
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_lotes_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

router.get(
  "/:id/valor",
  asyncHandler(async (req, res) => {
    const result = await querySql("SELECT * FROM fn_valor_lote(@id)", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

export default router;