import {
  useGetHistorial,
  getGetHistorialQueryKey,
  type Pedido,
} from "../../../../lib/api-client-react/src";
import { Skeleton } from "@/components/ui/skeleton";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_CORTO = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function mesLabel(fecha: string): string {
  const [y, m] = fecha.split("-");
  return `${MESES[parseInt(m) - 1]} ${y}`;
}

function diaLabel(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return `${DIAS_CORTO[dt.getDay()]} ${d}/${m}`;
}


function TablaPedidos({ pedidos }: { pedidos: Pedido[] }) {
  if (pedidos.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cliente</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Dirección</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Productos</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Garrafa</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Pedido esp.</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Repartidor</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p: Pedido) => (
            <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20" data-testid={`hist-row-${p.id}`}>
              <td className="px-3 py-2 font-medium">{p.nombre}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">{p.dir ?? "—"}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {p.items.map((it, j) => (
                    <span key={j} className={`text-xs px-1.5 py-0.5 rounded font-medium ${it.tipo === "garrafa" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  // Group by month, preserving order (historial comes sorted desc)
  const porMes: { label: string; dias: typeof historial }[] = [];
  for (const dia of historial) {
    const label = mesLabel(dia.fecha);
    const last = porMes[porMes.length - 1];
    if (last && last.label === label) {
      last.dias.push(dia);
    } else {
      porMes.push({ label, dias: [dia] });
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial de rutas</h2>

      {porMes.map(({ label, dias }) => (
        <div key={label} className="space-y-4">
          {/* Month header */}
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {dias.reduce((n, d) => n + d.pedidos.length, 0)} pedidos
            </span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Days within month */}
          <div className="space-y-5 pl-2">
            {dias.map((dia) => {
              const manana = dia.pedidos.filter((p: Pedido) => p.turno === "manana");
              const tarde = dia.pedidos.filter((p: Pedido) => p.turno === "tarde");

              return (
                <div key={dia.fecha} className="space-y-3">
                  {/* Day header */}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {diaLabel(dia.fecha)}
                  </p>

                  {/* Turno Mañana */}
                  {manana.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">☀ Mañana</span>
                        <span className="text-xs text-muted-foreground">{manana.length} pedido{manana.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="border border-border rounded-lg overflow-hidden bg-card">
                        <TablaPedidos pedidos={manana} />
                      </div>
                    </div>
                  )}

                  {/* Turno Tarde */}
                  {tarde.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">🌆 Tarde</span>
                        <span className="text-xs text-muted-foreground">{tarde.length} pedido{tarde.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="border border-border rounded-lg overflow-hidden bg-card">
                        <TablaPedidos pedidos={tarde} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
