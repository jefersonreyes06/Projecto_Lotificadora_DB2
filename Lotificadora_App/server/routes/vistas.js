/*import { Router } from "express";
import { querySql } from "../utils/sql.js";

const router = Router();

// Ruta para obtener ocupación de lotes por etapa
router.get("/ocupacion-lotes", async (req, res) => {
  try {
    const result = await querySql("SELECT * FROM vw_ocupacion_lotes");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener resumen ejecutivo de proyectos
router.get("/resumen-proyectos", async (req, res) => {
  try {
    const result = await querySql("SELECT * FROM vw_resumen_proyectos");
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

// routes/vistas.js
const router = require('express').Router();
const { executeProcedure } = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// vw_ocupacion_lotes
router.get('/ocupacion-lotes', asyncHandler(async (req, res) => {
  const result = await executeProcedure('sp_vw_ocupacion_lotes', {
    estado: req.query.estado || null,
  });
  res.json(result.recordset);
}));

// vw_resumen_proyectos
router.get('/resumen-proyectos', asyncHandler(async (req, res) => {
  const result = await executeProcedure('sp_vw_resumen_proyectos', {});
  res.json(result.recordset[0]);
}));

module.exports = router;




//export default router;