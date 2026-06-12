import { pgTable, bigserial, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pedidoItemSchema = z.object({
  tipo: z.enum(["garrafa", "gas"]),
  prod: z.string(),
  cant: z.number().int().min(1),
});

export type PedidoItem = z.infer<typeof pedidoItemSchema>;

export const ESTADO_ENTREGA_VALUES = ["Pendiente", "Entregado", "No encontrado", "Reprogramado"] as const;
export type EstadoEntrega = typeof ESTADO_ENTREGA_VALUES[number];

export const pedidosTable = pgTable("pedidos", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nombre: text("nombre").notNull(),
  dir: text("dir"),
  rep: text("rep").notNull(),
  turno: text("turno").notNull(),
  tienePedido: boolean("tiene_pedido").default(false).notNull(),
  nota: text("nota"),
  tieneGarrafa: boolean("tiene_garrafa").default(false).notNull(),
  garrafaEstado: text("garrafa_estado"),
  items: jsonb("items").notNull().$type<PedidoItem[]>(),
  fechaOrigen: text("fecha_origen").notNull(),
  fechaActual: text("fecha_actual").notNull(),
  creadoPor: text("creado_por"),
  estadoEntrega: text("estado_entrega").default("Pendiente").notNull(),
});

export const insertPedidoSchema = createInsertSchema(pedidosTable).omit({ id: true }).extend({
  items: z.array(pedidoItemSchema),
});
export type InsertPedido = z.infer<typeof insertPedidoSchema>;
export type Pedido = typeof pedidosTable.$inferSelect;
