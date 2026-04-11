import { Router } from "express";
import proyectosRouter from "./proyectos.js";
import etapasRouter from "./etapas.js";
import bloquesRouter from "./bloques.js";
import lotesRouter from "./lotes.js";
import clientesRouter from "./clientes.js";
import ventasRouter from "./ventas.js";
import pagosRouter from "./pagos.js";
import cuentasRouter from "./cuentas.js";
import reportesRouter from "./reportes.js";
import dashboardRouter from "./dashboard.js";

const router = Router();

router.use("/proyectos", proyectosRouter);
router.use("/etapas", etapasRouter);
router.use("/bloques", bloquesRouter);
router.use("/lotes", lotesRouter);
router.use("/clientes", clientesRouter);
router.use("/ventas", ventasRouter);
router.use("/pagos", pagosRouter);
router.use("/cuentas", cuentasRouter);
router.use("/reportes", reportesRouter);
router.use("/dashboard", dashboardRouter);

export default router;