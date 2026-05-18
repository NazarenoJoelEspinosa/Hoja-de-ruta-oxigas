import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import pedidosRouter from "./pedidos";
import authRouter from "./auth";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();

// Rutas públicas
router.use(healthRouter);
router.use(authRouter);

// Rutas protegidas
router.use(requireAuth as any);
router.use(clientesRouter);
router.use(pedidosRouter);

export default router;
