import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { User, JWTPayload } from "../types";

export class AuthService {
    // 1️⃣ HASH DE CONTRASEÑA (cuando el usuario se registra)
    static async hashPassword(password: string): Promise<string> {
        // bcrypt.hash(texto, rounds)
        // rounds = 10 → más lento pero más seguro
        return await bcrypt.hash(password, 10);
    }

    // 2️⃣ COMPARAR CONTRASEÑA (cuando el usuario inicia sesión)
    static async verifyPassword(
        password: string,
        hash: string
    ): Promise<boolean> {
        // Retorna true/false
        return await bcrypt.compare(password, hash);
    }

    // 3️⃣ GENERAR JWT
    static generateToken(user: User): string {
        const payload: JWTPayload = {
            id: user.id,
            email: user.email,
        };

        return jwt.sign(payload, process.env.JWT_SECRET!, {
            expiresIn: (process.env.JWT_EXPIRATION || "2h") as jwt.SignOptions["expiresIn"],
        });
    }

    // 4️⃣ VERIFICAR JWT
    static verifyToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET!
            ) as JWTPayload;
            return decoded;
        } catch {
            return null; // Token inválido o expirado
        }
    }
}