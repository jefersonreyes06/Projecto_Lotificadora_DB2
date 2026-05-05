import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";

// Extender tipo de Express para incluir user en requests
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email: string };
        }
    }
}

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        // 1️⃣ Obtén token del header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Token no proporcionado" });
            return;
        }

        // 2️⃣ Extrae el token (quita "Bearer ")
        const token = authHeader.substring(7);

        // 3️⃣ Verifica token
        const payload = AuthService.verifyToken(token);

        if (!payload) {
            res.status(401).json({ error: "Token inválido o expirado" });
            return;
        }

        // 4️⃣ Guarda user en req para el siguiente middleware
        req.user = payload;

        // 5️⃣ Continúa al siguiente middleware/controller
        next();
    } catch (error) {
        res.status(500).json({ error: "Error verificando token" });
    }
}