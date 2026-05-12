# Hoja de Ruta

App de gestión de rutas de entrega de garrafas y gases para una distribuidora argentina.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/hoja-de-ruta run dev` — run the frontend (port 21163)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/clientes.ts` — Clientes table schema
- `lib/db/src/schema/pedidos.ts` — Pedidos table schema (items stored as JSONB)
- `artifacts/api-server/src/routes/clientes.ts` — Clientes CRUD routes
- `artifacts/api-server/src/routes/pedidos.ts` — Pedidos routes + stats + historial
- `artifacts/hoja-de-ruta/src/components/hoja-de-ruta/` — Main tab components

## Architecture decisions

- Pedidos `items` stored as JSONB array (flexible, no join table needed)
- `fechaActual` vs `fechaOrigen`: original date stored separately so history is always accurate even when orders are moved to future shifts
- Single-page app with 3 tabs (Hoja de Ruta / Historial / Clientes)
- Print functionality opens a new window with static HTML (no React dependency)
- Repartidores are hardcoded: José and Claudio (simple for this scale)

## Product

- **Hoja de Ruta tab**: Add delivery orders with client autocomplete, product builder (garrafas/gases), shift assignment (mañana/tarde), garrafa payment tracking, special order notes. View today's orders split by shift with actions to move orders forward/backward across shifts and days.
- **Historial tab**: Browse all past orders grouped by original date.
- **Clientes tab**: Manage client list with names and addresses.
- Print-ready shift sheets accessible from each turno header.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always run codegen before using updated types
- The `items` JSONB column uses camelCase in the app but snake_case for the DB columns (Drizzle handles mapping)
- `fechaOrigen` = when order was created; `fechaActual` = current scheduled delivery date

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
