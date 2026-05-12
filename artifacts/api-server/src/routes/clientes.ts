import { Router } from "express";
import { db, clientesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import {
  CreateClienteBody,
  UpdateClienteParams,
  UpdateClienteBody,
  DeleteClienteParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/clientes", async (req, res) => {
  const clientes = await db
    .select()
    .from(clientesTable)
    .orderBy(clientesTable.nombre);
  res.json(clientes);
});

router.post("/clientes", async (req, res) => {
  const parsed = CreateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { nombre, dir } = parsed.data;

  const existing = await db
    .select()
    .from(clientesTable)
    .where(ilike(clientesTable.nombre, nombre))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Ya existe un cliente con ese nombre" });
    return;
  }

  const [cliente] = await db
    .insert(clientesTable)
    .values({ nombre, dir: dir ?? null })
    .returning();

  res.status(201).json(cliente);
});

router.patch("/clientes/:id", async (req, res) => {
  const params = UpdateClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = UpdateClienteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(clientesTable)
    .set(body.data)
    .where(eq(clientesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }

  res.json(updated);
});

router.delete("/clientes/:id", async (req, res) => {
  const params = DeleteClienteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(clientesTable)
    .where(eq(clientesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Cliente no encontrado" });
    return;
  }

  res.status(204).send();
});

export default router;
