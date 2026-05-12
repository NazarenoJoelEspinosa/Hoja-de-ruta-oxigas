import { Router } from "express";
import { db, pedidosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListPedidosQueryParams,
  CreatePedidoBody,
  UpdatePedidoParams,
  UpdatePedidoBody,
  DeletePedidoParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/pedidos", async (req, res) => {
  const parsed = ListPedidosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let pedidos;
  if (parsed.data.fecha) {
    pedidos = await db
      .select()
      .from(pedidosTable)
      .where(eq(pedidosTable.fechaActual, parsed.data.fecha))
      .orderBy(pedidosTable.id);
  } else {
    pedidos = await db
      .select()
      .from(pedidosTable)
      .orderBy(pedidosTable.id);
  }

  res.json(pedidos);
});

router.post("/pedidos", async (req, res) => {
  const parsed = CreatePedidoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [pedido] = await db
    .insert(pedidosTable)
    .values({
      nombre: data.nombre,
      dir: data.dir ?? null,
      rep: data.rep,
      turno: data.turno,
      tienePedido: data.tienePedido ?? false,
      nota: data.nota ?? null,
      tieneGarrafa: data.tieneGarrafa ?? false,
      garrafaEstado: data.garrafaEstado ?? null,
      items: data.items,
      fechaOrigen: data.fechaOrigen,
      fechaActual: data.fechaActual,
    })
    .returning();

  res.status(201).json(pedido);
});

router.patch("/pedidos/:id", async (req, res) => {
  const params = UpdatePedidoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = UpdatePedidoBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.turno !== undefined) updateData.turno = body.data.turno;
  if (body.data.fechaActual !== undefined) updateData.fechaActual = body.data.fechaActual;
  if (body.data.garrafaEstado !== undefined) updateData.garrafaEstado = body.data.garrafaEstado;
  if (body.data.nota !== undefined) updateData.nota = body.data.nota;
  if (body.data.tienePedido !== undefined) updateData.tienePedido = body.data.tienePedido;

  const [updated] = await db
    .update(pedidosTable)
    .set(updateData)
    .where(eq(pedidosTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  res.json(updated);
});

router.delete("/pedidos/:id", async (req, res) => {
  const params = DeletePedidoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(pedidosTable)
    .where(eq(pedidosTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Pedido no encontrado" });
    return;
  }

  res.status(204).send();
});

router.get("/pedidos/stats/today", async (req, res) => {
  const today = new Date();
  const fecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const pedidos = await db
    .select()
    .from(pedidosTable)
    .where(eq(pedidosTable.fechaActual, fecha));

  const totalManana = pedidos.filter((p) => p.turno === "manana").length;
  const totalTarde = pedidos.filter((p) => p.turno === "tarde").length;
  const totalPedidos = pedidos.length;
  const garrafasPendientes = pedidos.filter(
    (p) => p.tieneGarrafa && p.garrafaEstado === "pendiente"
  ).length;
  const garrafasPagas = pedidos.filter(
    (p) => p.tieneGarrafa && p.garrafaEstado === "paga"
  ).length;

  res.json({ totalManana, totalTarde, totalPedidos, garrafasPendientes, garrafasPagas });
});

router.get("/pedidos/historial", async (req, res) => {
  const pedidos = await db.select().from(pedidosTable).orderBy(pedidosTable.id);

  const grouped: Record<string, typeof pedidos> = {};
  for (const pedido of pedidos) {
    if (!grouped[pedido.fechaOrigen]) grouped[pedido.fechaOrigen] = [];
    grouped[pedido.fechaOrigen].push(pedido);
  }

  const result = Object.keys(grouped)
    .sort()
    .reverse()
    .map((fecha) => ({ fecha, pedidos: grouped[fecha] }));

  res.json(result);
});

export default router;
