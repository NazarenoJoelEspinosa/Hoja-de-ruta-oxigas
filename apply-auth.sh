#!/bin/bash
# Correr desde la raíz del repo: bash apply-auth.sh
# Agrega login, JWT, creadoPor en pedidos, horario y generado por en impresión

set -e
BASE="/c/Users/Server/Downloads/Route-Plan"
cd "$BASE"

# ─── 1. Middleware JWT ────────────────────────────────────────────────────────
mkdir -p artifacts/api-server/src/middleware

cat > artifacts/api-server/src/middleware/requireAuth.ts << 'ENDOFFILE'
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
ENDOFFILE

echo "✓ middleware/requireAuth.ts"

# ─── 2. Ruta de login ─────────────────────────────────────────────────────────
cat > artifacts/api-server/src/routes/auth.ts << 'ENDOFFILE'
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
ENDOFFILE

echo "✓ routes/auth.ts"

# ─── 3. Actualizar routes/index.ts ───────────────────────────────────────────
cat > artifacts/api-server/src/routes/index.ts << 'ENDOFFILE'
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
ENDOFFILE

echo "✓ routes/index.ts"

# ─── 4. Actualizar routes/pedidos.ts — agregar creadoPor ─────────────────────
cat > artifacts/api-server/src/routes/pedidos.ts << 'ENDOFFILE'
import { Router } from "express";
import { db, pedidosTable } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
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
    pedidos = await db.select().from(pedidosTable).orderBy(pedidosTable.id);
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
  const creadoPor = (req as any).usuario as string | undefined;

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
      creadoPor: creadoPor ?? null,
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

router.get("/pedidos/futuros", async (req, res) => {
  const today = new Date();
  const fecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const pedidos = await db
    .select()
    .from(pedidosTable)
    .where(gt(pedidosTable.fechaActual, fecha))
    .orderBy(pedidosTable.fechaActual, pedidosTable.turno, pedidosTable.id);

  const grouped: Record<string, typeof pedidos> = {};
  for (const pedido of pedidos) {
    if (!grouped[pedido.fechaActual]) grouped[pedido.fechaActual] = [];
    grouped[pedido.fechaActual].push(pedido);
  }

  const result = Object.keys(grouped)
    .sort()
    .map((f) => ({ fecha: f, pedidos: grouped[f] }));

  res.json(result);
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
ENDOFFILE

echo "✓ routes/pedidos.ts"

# ─── 5. Agregar creadoPor al schema de DB ────────────────────────────────────
cat > lib/db/src/schema/pedidos.ts << 'ENDOFFILE'
import { pgTable, bigserial, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pedidoItemSchema = z.object({
  tipo: z.enum(["garrafa", "gas"]),
  prod: z.string(),
  cant: z.number().int().min(1),
});

export type PedidoItem = z.infer<typeof pedidoItemSchema>;

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
});

export const insertPedidoSchema = createInsertSchema(pedidosTable).omit({ id: true }).extend({
  items: z.array(pedidoItemSchema),
});
export type InsertPedido = z.infer<typeof insertPedidoSchema>;
export type Pedido = typeof pedidosTable.$inferSelect;
ENDOFFILE

echo "✓ lib/db/src/schema/pedidos.ts"

# ─── 6. Agregar jose a api-server package.json ───────────────────────────────
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('artifacts/api-server/package.json', 'utf8'));
pkg.dependencies['jose'] = '^5.0.0';
fs.writeFileSync('artifacts/api-server/package.json', JSON.stringify(pkg, null, 2));
console.log('✓ api-server/package.json');
"

# ─── 7. AuthContext frontend ──────────────────────────────────────────────────
mkdir -p artifacts/hoja-de-ruta/src/context

cat > artifacts/hoja-de-ruta/src/context/AuthContext.tsx << 'ENDOFFILE'
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { setBaseUrl, setAuthTokenGetter } from "../../../../lib/api-client-react/src";

const API_URL = import.meta.env.VITE_API_URL ?? "";

interface AuthState {
  token: string | null;
  nombre: string | null;
}

interface AuthContextType extends AuthState {
  login: (nombre: string, contrasena: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    token: localStorage.getItem("token"),
    nombre: localStorage.getItem("usuario"),
  }));

  useEffect(() => {
    setBaseUrl(API_URL || null);
    setAuthTokenGetter(() => auth.token);
  }, [auth.token]);

  const login = async (nombre: string, contrasena: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, contrasena }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Error al iniciar sesión");
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", data.nombre);
    setAuth({ token: data.token, nombre: data.nombre });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setAuth({ token: null, nombre: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
ENDOFFILE

echo "✓ context/AuthContext.tsx"

# ─── 8. Página de login ───────────────────────────────────────────────────────
cat > artifacts/hoja-de-ruta/src/pages/login.tsx << 'ENDOFFILE'
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const USUARIOS = ["Nazareno", "Graciela", "Gladys", "Mariano"];

export default function Login() {
  const { login } = useAuth();
  const [nombre, setNombre] = useState(USUARIOS[0]);
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(nombre, contrasena);
    } catch (err: any) {
      setError(err.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border rounded-xl shadow-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">Hoja de Ruta</h1>
          <p className="text-sm text-muted-foreground mt-1">Distribución de Garrafas y Gases</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuario</label>
            <select
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {USUARIOS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
ENDOFFILE

echo "✓ pages/login.tsx"

# ─── 9. Actualizar App.tsx con auth ──────────────────────────────────────────
cat > artifacts/hoja-de-ruta/src/App.tsx << 'ENDOFFILE'
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";

const queryClient = new QueryClient();

function Router() {
  const { token } = useAuth();

  if (!token) return <Login />;

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
ENDOFFILE

echo "✓ App.tsx"

# ─── 10. Actualizar main.tsx (ya no necesita setBaseUrl aquí) ────────────────
cat > artifacts/hoja-de-ruta/src/main.tsx << 'ENDOFFILE'
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
ENDOFFILE

echo "✓ main.tsx"

# ─── 11. Actualizar dashboard.tsx — mostrar usuario y botón logout ────────────
cat > artifacts/hoja-de-ruta/src/pages/dashboard.tsx << 'ENDOFFILE'
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HojaDeRutaTab from "@/components/hoja-de-ruta/HojaDeRutaTab";
import HistorialTab from "@/components/hoja-de-ruta/HistorialTab";
import ClientesTab from "@/components/hoja-de-ruta/ClientesTab";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("hoja");
  const { nombre, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary uppercase">Hoja de Ruta</h1>
            <p className="text-sm text-muted-foreground">Distribución de Garrafas y Gases</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 sm:flex-none">
              <TabsList className="w-full sm:w-auto grid grid-cols-3">
                <TabsTrigger value="hoja">Ruta de Hoy</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                <TabsTrigger value="clientes">Clientes</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <span className="hidden sm:inline font-medium text-foreground">{nombre}</span>
              <button
                onClick={logout}
                title="Cerrar sesión"
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="hoja" className="mt-0 outline-none">
            <HojaDeRutaTab />
          </TabsContent>
          <TabsContent value="historial" className="mt-0 outline-none">
            <HistorialTab />
          </TabsContent>
          <TabsContent value="clientes" className="mt-0 outline-none">
            <ClientesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
ENDOFFILE

echo "✓ pages/dashboard.tsx"

# ─── 12. Actualizar print.ts — horario + generado por ────────────────────────
cat > artifacts/hoja-de-ruta/src/lib/print.ts << 'ENDOFFILE'
export const printShift = (
  title: string,
  dateStr: string,
  orders: any[],
  generadoPor?: string
) => {
  const content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Hoja de Ruta - ${title} - ${dateStr}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; font-size: 14px; color: #111; }
        h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
        table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
        th, td { border: 1px solid #999; padding: 8px 12px; text-align: left; vertical-align: top; }
        th { background-color: #eee; font-weight: bold; }
        .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-right: 4px; }
        .pink { background-color: #fce7f3; color: #be185d; }
        .orange { background-color: #fef3c7; color: #b45309; }
        .green { background-color: #dcfce7; color: #15803d; }
        .horario { font-size: 12px; color: #555; margin-top: 2px; }
        .footer { margin-top: 24px; font-size: 13px; color: #555; border-top: 1px solid #ccc; padding-top: 10px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <h1>Hoja de Ruta: ${title} (${dateStr})</h1>
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Cliente</th>
            <th>Dirección</th>
            <th>Horario</th>
            <th>Productos</th>
            <th>Garrafa</th>
            <th>Repartidor</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((o, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${o.nombre}</strong></td>
              <td>${o.dir || '-'}</td>
              <td>${o.horarioCliente ? `<span class="horario">${o.horarioCliente}</span>` : '-'}</td>
              <td>
                ${o.items.map((i: any) => `<div>${i.cant}x ${i.prod}</div>`).join('')}
              </td>
              <td>
                ${o.tieneGarrafa ? `<span class="tag ${o.garrafaEstado === 'paga' ? 'green' : 'orange'}">${o.garrafaEstado === 'paga' ? 'Pagada' : 'Pendiente'}</span>` : '-'}
              </td>
              <td>${o.rep}</td>
              <td>${o.tienePedido ? `<span class="tag pink">Especial</span> ${o.nota || ''}` : (o.nota || '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${generadoPor ? `<div class="footer">Generado por: <strong>${generadoPor}</strong></div>` : ''}
      <script>
        window.onload = () => { window.print(); window.close(); }
      </script>
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(content);
    win.document.close();
  }
};
ENDOFFILE

echo "✓ lib/print.ts"

# ─── 13. Agregar alias AuthContext al vite.config.ts ─────────────────────────
cat > artifacts/hoja-de-ruta/vite.config.ts << 'ENDOFFILE'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "../../../../lib/api-client-react/src": path.resolve(import.meta.dirname, "../../lib/api-client-react/src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});
ENDOFFILE

echo "✓ vite.config.ts"

# ─── 14. Regenerar lockfile ───────────────────────────────────────────────────
echo ""
echo "Regenerando lockfile..."
pnpm install --no-frozen-lockfile 2>/dev/null || true

# ─── 15. Commit y push ────────────────────────────────────────────────────────
git add -A
git commit -m "feat: login JWT, creadoPor en pedidos, horario y generado por en impresión"
git push

echo ""
echo "✅ LISTO. Ahora:"
echo "1. En Railway → api-server → Variables → agregar: JWT_SECRET = oxigas-secret-2026"
echo "2. En Railway → Postgres → Data → Query → correr:"
echo "   ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS creado_por text;"
