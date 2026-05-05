import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// POST /auth/login
router.post(
    "/login",
    asyncHandler(AuthController.login)
);

// GET /auth/me (ruta protegida de ejemplo)
router.get("/me", authMiddleware, (req, res) => {
    res.json(req.user);
});

export default router;