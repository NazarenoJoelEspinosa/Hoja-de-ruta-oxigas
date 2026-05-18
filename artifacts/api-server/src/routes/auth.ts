import { Router } from "express";
import { USUARIOS, generarToken } from "../middleware/requireAuth";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { nombre, contrasena } = req.body as { nombre?: string; contrasena?: string };

  if (!nombre || !contrasena) {
    res.status(400).json({ error: "Nombre y contraseña requeridos" });
    return;
  }

  const expected = USUARIOS[nombre];
  if (!expected || expected !== contrasena) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    return;
  }

  const token = await generarToken(nombre);
  res.json({ token, nombre });
});

export default router;
