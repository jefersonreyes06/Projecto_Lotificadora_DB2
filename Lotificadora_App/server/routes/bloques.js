import { Router } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// Rutas para bloques

// Listar bloques por etapa
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_bloques_listar", {
      etapaId: req.query.etapaId || null,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_bloques_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const etapaId = req.body.EtapaID || req.body.etapaId;
    const nombreBloque = req.body.Bloque || req.body.nombre || req.body.Bloque;
    const area = req.body.AreaTotalVaras || req.body.areaTotalVaras;

    const payload = {
      EtapaID: parseInt(etapaId), 
      Bloque: nombreBloque,
      AreaTotalVaras: parseFloat(area)
    };


    const result = await executeProcedure("sp_bloques_crear", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const params = {
      BloqueID: req.params.id,
      Bloque: req.body.Bloque || null,
      AreaTotalVaras: req.body.AreaTotalVaras || null
    };

    const result = await executeProcedure("sp_bloques_actualizar", params);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await executeProcedure("sp_bloques_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

export default router;