import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import pedidosRouter from "./pedidos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientesRouter);
router.use(pedidosRouter);

export default router;
