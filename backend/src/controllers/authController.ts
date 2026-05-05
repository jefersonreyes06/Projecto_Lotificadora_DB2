import type { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { querySql } from "../utils/sql.js";
import type { LoginRequest, AuthResponse } from "../types";

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        try {
            // 1️⃣ Obtén email y password del request
            const { email, password } = req.body as LoginRequest;

            // 2️⃣ Valida que vienen datos
            if (!email || !password) {
                res.status(400).json({ error: "Email y password requeridos" });
                return;
            }

            // 3️⃣ BUSCA USUARIO EN BD
            const result = await querySql("SELECT * FROM usuarios WHERE Email = @email", { email });
            const user = result.recordset[0];

            if (!user) {
                res.status(401).json({ error: "Credenciales inválidas" });
                return;
            }

            // 4️⃣ Verifica contraseña
            const isValid = await AuthService.verifyPassword(
                password,
                user.PasswordHash
            );

            if (!isValid) {
                res.status(401).json({ error: "Credenciales inválidas" });
                return;
            }

            // 5️⃣ Genera token
            const token = AuthService.generateToken({ ...user, id: String(user.UsuarioID) });

            // 6️⃣ Responde con token
            const response: AuthResponse = {
                token,
                user: {
                    id: String(user.UsuarioID),
                    email: user.Email,
                },
            };

            res.json(response);
        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}