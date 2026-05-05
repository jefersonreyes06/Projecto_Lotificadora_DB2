import { Router, Request, Response } from "express";
import { querySql } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const triggerNames = [
      'tr_Lotes_Insert_UpdateAreaBloque',
      'tr_Lotes_Delete_UpdateAreaBloque',
      'tr_Ventas_Insert_UpdateLoteStatus',
      'tr_Ventas_Update_RevertLoteStatus',
      'tr_Pagos_Insert_UpdateCuota',
      'tr_Pagos_Insert_UpdateVentaSaldo',
      'tr_Clientes_Update_Auditoria',
      'tr_Lotes_Delete_ValidateEstado',
      'tr_Ventas_Update_Auditoria',
      'tr_Clientes_Update_ValidateVentas'
    ];

    const placeholders = triggerNames.map((_, index) => `@name${index}`).join(", ");
    const sql = `
      SELECT 
        t.name AS triggerName,
        OBJECT_NAME(t.parent_id) AS tableName,
        CASE WHEN t.is_disabled = 0 THEN 'Activo' ELSE 'Desactivado' END AS status,
        m.definition
      FROM sys.triggers t
      LEFT JOIN sys.sql_modules m ON t.object_id = m.object_id
      WHERE t.name IN (${placeholders})
      ORDER BY t.name;
    `;

    const params = triggerNames.reduce((acc: { [key: string]: string }, name: string, index: number) => {
      acc[`name${index}`] = name;
      return acc;
    }, {});

    const result = await querySql(sql, params);
    res.json(result.recordset);
  })
);

export default router;
