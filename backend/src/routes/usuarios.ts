import { Router } from "express";
import { executeProcedure } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
    "/",
    asyncHandler(async (req: Request, res: Response) => {
        const payload = req.body;

        const result = await executeProcedure("sp_usuario_obtener", { payload });
        //res.json(result.recordset);
    })
);

export default router;