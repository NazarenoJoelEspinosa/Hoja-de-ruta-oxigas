import { Request, Response, NextFunction } from "express";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env["JWT_SECRET"] ?? "dev-secret-cambiar-en-produccion"
);

export const USUARIOS: Record<string, string> = {
  Nazareno: "Alessio1906",
  Graciela: "Alessio1906",
  Gladys:   "Alessio1906",
  Mariano:  "Alessio1906",
};

export async function generarToken(nombre: string): Promise<string> {
  return new SignJWT({ nombre })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  try {
    const { payload } = await jwtVerify(header.slice(7), SECRET);
    (req as any).usuario = payload["nombre"] as string;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
