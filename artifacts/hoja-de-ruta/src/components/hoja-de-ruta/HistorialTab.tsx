import {
  useGetHistorial,
  getGetHistorialQueryKey,
  type Pedido,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fechaLinda } from "@/lib/dates";

export default function HistorialTab() {
  const { data: historial = [], isLoading } = useGetHistorial({
    query: { queryKey: getGetHistorialQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="border border-border rounded-lg bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay registros todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial de rutas</h2>
      {historial.map((dia) => (
        <div key={dia.fecha} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground border-b border-border pb-1">
            {fechaLinda(dia.fecha)}
          </p>
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Turno orig.</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Productos</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Garrafa</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Pedido esp.</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Repartidor</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Entregado</th>
                  </tr>
                </thead>
                <tbody>
                  {dia.pedidos.map((p: Pedido) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20" data-testid={`hist-row-${p.id}`}>
                      <td className="px-3 py-2 font-medium">{p.nombre}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.turno === "manana" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}>
                          {p.turno === "manana" ? "☀ Mañana" : "🌆 Tarde"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {p.items.map((it, j) => (
                            <span
                              key={j}
                              className={`text-xs px-1.5 py-0.5 rounded font-medium ${it.tipo === "garrafa" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}
                            >
                              {it.cant}x {it.prod}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {p.tieneGarrafa && p.garrafaEstado ? (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.garrafaEstado === "paga" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                            {p.garrafaEstado === "paga" ? "✓ Paga" : "Pendiente"}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        {p.tienePedido ? (
                          <div>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-medium">Pedido</span>
                            {p.nota && <p className="text-xs text-muted-foreground mt-0.5 max-w-[120px] truncate">{p.nota}</p>}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs hidden sm:table-cell">{p.rep}</td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {p.fechaOrigen === p.fechaActual ? "Mismo día" : `→ ${p.fechaActual}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
