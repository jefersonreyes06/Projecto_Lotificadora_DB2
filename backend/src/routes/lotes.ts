import { Router, Request, Response } from "express";
import { executeProcedure, querySql } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/disponibles",
  asyncHandler(async (req: Request, res: Response) => {
    const proyectoId = req.query.proyectoId ? Number(req.query.proyectoId) : null;
    const etapaId = req.query.etapaId ? Number(req.query.etapaId) : null;
    const bloqueId = req.query.bloqueId ? Number(req.query.bloqueId) : null;


    /* const pool = await sql.connect(config);
 
     const result = await pool.request()
       .input('ProyectoID', sql.Int, proyectoId)
       .input('EtapaID', sql.Int, etapaId)
       .input('BloqueID', sql.Int, bloqueId)
       .query(`
           SELECT *
           FROM vw_lotes_disponibles
           WHERE (@ProyectoID IS NULL OR ProyectoID = @ProyectoID)
             AND (@EtapaID IS NULL OR EtapaID = @EtapaID)
             AND (@BloqueID IS NULL OR BloqueID = @BloqueID)
         `);
 */
    const sql = `SELECT * FROM vw_lotes_disponibles WHERE (@ProyectoID IS NULL OR ProyectoID = @proyectoId) AND (@EtapaID IS NULL OR EtapaID = @etapaId) AND (@BloqueID IS NULL OR BloqueID = @bloqueId);`;

    const result = await querySql(sql, {
      proyectoId: proyectoId ?? null,
      etapaId: etapaId ?? null,
      bloqueId: bloqueId ?? null,
    });
    res.json(result.recordset);
  })
);


router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_lotes_listar", {
      bloqueId: req.query.bloqueId || null,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/NumeroLote",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_buscar_numero_lote", { NumeroLote: req.query.NumeroLote });
    res.json(result.recordset ?? null);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_lotes_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);



router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_lotes_crear", {
      BloqueID: req.body.BloqueID,
      AreaVaras: req.body.AreaVaras,
      Estado: req.body.Estado || 'Disponible',
      Caracteristicas: req.body.Caracteristicas || null,
    });
    res.json(result.recordset[0]);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { BloqueID, AreaVaras, Estado = 'Disponible' } = req.body;

    const result = await executeProcedure("sp_lotes_actualizar", {
      id: req.params.id,
      BloqueID: BloqueID,
      AreaVaras: AreaVaras,
      Estado: Estado
    });

    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_lotes_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

router.get(
  "/:id/valor",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await querySql("SELECT * FROM fn_valor_lote(@id)", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

export default router;