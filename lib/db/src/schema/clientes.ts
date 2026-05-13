import { pgTable, bigserial, text, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientesTable = pgTable("clientes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nombre: text("nombre").notNull(),
  dirs: json("dirs").$type<string[]>().notNull().default([]),
  horario: text("horario"),
});

export const insertClienteSchema = createInsertSchema(clientesTable).omit({ id: true });
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientesTable.$inferSelect;
