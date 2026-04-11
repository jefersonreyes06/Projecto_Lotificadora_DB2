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
    const { bloqueId, areaVaras, precioVara, estado = 'Disponible', esEsquina, cercaParque, calleCerrada, frenteAvenida } = req.body;

    const result = await executeProcedure("sp_lotes_crear", {
      BloqueID: bloqueId,
      AreaVaras: areaVaras,
      PrecioVara: precioVara,
      Estado: estado,
      EsEsquina: esEsquina,
      CercaParque: cercaParque,
      CalleCerrada: calleCerrada,
      FrenteAvenida: frenteAvenida,
    });
    res.json(result.recordset[0]);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const params = {
      id: req.params.id,
      BloqueID: req.body.bloqueId || null,
      CodigoLote: req.body.codigoLote || null,
      AreaM2: req.body.areaM2 || null,
      EsEsquina: req.body.esEsquina ?? null,
      CercaParque: req.body.cercaParque ?? null,
      Estado: req.body.estado || null,
      ValorTotal: req.body.valorTotal || null,
    };

    const result = await executeProcedure("sp_lotes_actualizar", params);
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