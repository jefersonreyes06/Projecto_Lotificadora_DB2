import { Router } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const result = await executeProcedure("sp_filtrar_gastos", req.query);
        res.json(result.recordset);
    })
);

router.get(
    "/tipos",
    asyncHandler(async (req, res) => {
        const result = await executeProcedure("sp_tipo_gasto_listar", req.query);
        res.json(result.recordset);
    })
);

router.post(
    "/",
    asyncHandler(async (req, res) => {
        const result = await executeProcedure("sp_crear_gasto", req.body);
        res.json(result.recordset ?? result.returnValue ?? { success: true });
    })
);

export default router;