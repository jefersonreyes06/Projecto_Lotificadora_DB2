import { Router, Request, Response } from "express";
import { executeProcedure, querySql, executeScalarFunction } from "../utils/sql.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get(
  "/dashboard",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeScalarFunction("fn_ContarProyectosActivos");
    res.json({ total: result });
  })
);


router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {

    const result = await executeProcedure("sp_proyectos_listar", {
      proyectoId: req.query.proyectoId,
    });
    res.json(result.recordset);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_proyectos_obtener", { id: req.params.id });
    res.json(result.recordset[0] ?? null);
  })
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_proyectos_crear", req.body);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { Nombre, UbicacionLegal, MaxAniosFinanciamiento, Estado } = req.body;
    const payload = {
      id: req.params.id,
      Nombre,
      UbicacionLegal,
      MaxAniosFinanciamiento,
      Estado
    };

    //const payload = { id: req.params.id, ...req.body }; Esto generaba un error porque da la fecha 
    // como un parametro adicional, y el procedimiento no lo esperaba. Al desestructurar manualmente, solo se envían los campos necesarios.

    const result = await executeProcedure("sp_proyectos_actualizar", payload);
    res.json(result.recordset ?? result.returnValue);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await executeProcedure("sp_proyectos_eliminar", { id: req.params.id });
    res.json(result.recordset ?? { deletedId: req.params.id });
  })
);

export default router;