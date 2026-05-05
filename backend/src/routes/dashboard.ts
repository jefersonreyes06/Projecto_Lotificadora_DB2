import { Router, Request, Response } from "express";
import { executeScalarFunction } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

// Contar proyectos activos
router.get(
  "/proyectos-activos",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeScalarFunction("fn_ContarProyectosActivos");
    res.json({ total: result });
  })
);

// Contar ventas del mes actual
router.get(
  "/ventas-mes-actual",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeScalarFunction("fn_VentasMesActual");
    res.json({ total: result });
  })
);

// Contar lotes disponibles
router.get(
  "/lotes-disponibles",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeScalarFunction("fn_LotesDisponibles");
    res.json({ total: result });
  })
);

// Contar pagos pendientes
router.get(
  "/pagos-pendientes",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeScalarFunction("fn_PagosPendientes");
    res.json({ total: result });
  })
);

// Calcular ingresos del mes actual
router.get(
  "/ingresos-mes-actual",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeScalarFunction("fn_IngresosMesActual");
    res.json({ total: result });
  })
);

export default router;
