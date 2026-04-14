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
    const params = {
      EtapaID: parseInt(req.body.etapaId), // Ensure it's a number
      Nombre: req.body.nombre,
      AreaTotalVaras: parseFloat(req.body.areaTotalVaras) // Ensure it's a number
    };

    const result = await executeProcedure("sp_bloques_crear", params);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const params = {
      id: req.params.id,
      Nombre: req.body.nombre || null,
      AreaTotalVaras: req.body.areaTotalVaras || null,
      Estado: req.body.estado || null,
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