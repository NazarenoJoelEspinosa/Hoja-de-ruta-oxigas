import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListClientes,
  useListPedidos,
  useGetFuturos,
  useCreatePedido,
  useCreateCliente,
  useUpdatePedido,
  useUpdateCliente,
  useDeletePedido,
  getListClientesQueryKey,
  getListPedidosQueryKey,
  getGetTodayStatsQueryKey,
  getGetFuturosQueryKey,
  type Cliente,
  type Pedido,
  type PedidoItem,
  type HistorialDia,
} from "../../../../lib/api-client-react/src";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { printShift } from "@/lib/print";
import { useAuth } from "@/context/AuthContext";
import { getTodayKey, fechaLinda, sumarDia, restarDia } from "@/lib/dates";
import { Printer, Trash2, ChevronRight, ChevronLeft, Plus, X, Clock, GripVertical, MapPin } from "lucide-react";

const GARRAFAS = [
  "Garrafa 10 kg Total",
  "Garrafa 10 kg YPF",
  "Garrafa 15 kg",
  "Garrafa 45 kg",
  "Garrafa Clark Total",
  "Garrafa Clark YPF",
];
const GASES = [
  "Mix20",
  "Gas Carbónico",
  "Oxígeno",
  "Nitrógeno",
  "Mix310",
  "Argón",
  "Acetileno",
];

// Unidad de medida de cada gas: m³ para los gases "de línea", kg para acetileno y CO2.
const GAS_UNIDADES: Record<string, string> = {
  "Oxígeno": "m³",
  "Argón": "m³",
  "Mix20": "m³",
  "Mix310": "m³",
  "Nitrógeno": "m³",
  "Acetileno": "kg",
  "Gas Carbónico": "kg",
};

function formatItem(it: PedidoItem): string {
  if (it.tipo === "garrafa") return `${it.cant}x ${it.prod}`;
  const unidad = GAS_UNIDADES[it.prod] ?? "";
  const base = `${it.cant}x ${it.prod}`;
  if (it.tamano === null || it.tamano === undefined) return base;
  return `${base} (${it.tamano}${unidad ? " " + unidad : ""} c/u)`;
}

export default function HojaDeRutaTab() {
  const today = getTodayKey();
  const { nombre: usuarioActual } = useAuth();
  const qc = useQueryClient();

  const { data: clientes = [], isLoading: loadingClientes } = useListClientes({
    query: { queryKey: getListClientesQueryKey() },
  });
  const { data: pedidos = [], isLoading: loadingPedidos } = useListPedidos(
    { fecha: today },
    { query: { queryKey: getListPedidosQueryKey({ fecha: today }) } }
  );
  const { data: futuros = [] } = useGetFuturos({
    query: { queryKey: getGetFuturosQueryKey() },
  });

  const createPedido = useCreatePedido();
  const createCliente = useCreateCliente();
  const updatePedido = useUpdatePedido();
  const deletePedido = useDeletePedido();
  const updateCliente = useUpdateCliente();

  // Form state
  const [nombre, setNombre] = useState("");
  const [dir, setDir] = useState("");
  const [horarioCliente, setHorarioCliente] = useState<string | null>(null);
  const [clienteEnDB, setClienteEnDB] = useState(false);
  const [rep, setRep] = useState("Jose");
  const [turno, setTurno] = useState<"manana" | "tarde">("manana");
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [itemTipo, setItemTipo] = useState<"garrafa" | "gas">("garrafa");
  const [itemProd, setItemProd] = useState(GARRAFAS[0]);
  const [itemCant, setItemCant] = useState("1");
  const [itemTamano, setItemTamano] = useState("");
  const [garrafaEstado, setGarrafaEstado] = useState<"pendiente" | "paga">("pendiente");
  const [tienePedido, setTienePedido] = useState(false);
  const [nota, setNota] = useState("");
  const [fechaAgendada, setFechaAgendada] = useState(today);
  const [suggestions, setSuggestions] = useState<Cliente[]>([]);
  const [showSug, setShowSug] = useState(false);
  const sugRef = useRef<HTMLDivElement>(null);

  const hayGarrafa = items.some((it) => it.tipo === "garrafa");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) {
        setShowSug(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onNombreInput = (val: string) => {
    setNombre(val);
    setClienteEnDB(false);
    if (!val) { setSuggestions([]); setShowSug(false); return; }
    const matches = clientes.filter((c) =>
      c.nombre.toLowerCase().includes(val.toLowerCase())
    );
    setSuggestions(matches);
    setShowSug(matches.length > 0);
  };

  const selectCliente = (c: Cliente, addr?: string) => {
    setNombre(c.nombre);
    if (addr !== undefined) {
      setDir(addr);
    } else {
      const dirs = c.dirs ?? [];
      setDir(dirs.length === 1 ? dirs[0] : "");
    }
    setHorarioCliente(c.horario ?? null);
    setClienteEnDB(true);
    setShowSug(false);
  };

  const addItem = () => {
    const cant = parseInt(itemCant, 10) || 1;
    let tamano: number | undefined;
    if (itemTipo === "gas") {
      const raw = itemTamano.trim().replace(",", ".");
      const parsed = raw === "" ? NaN : parseFloat(raw);
      tamano = Number.isNaN(parsed) ? undefined : parsed;
    }
    setItems([...items, { tipo: itemTipo, prod: itemProd, cant, tamano }]);
    setItemCant("1");
    setItemTamano("");
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const limpiar = () => {
    setNombre(""); setDir(""); setHorarioCliente(null); setClienteEnDB(false); setRep("Jose"); setTurno("manana");
    setItems([]); setItemTipo("garrafa"); setItemProd(GARRAFAS[0]); setItemCant("1"); setItemTamano("");
    setGarrafaEstado("pendiente"); setTienePedido(false); setNota(""); setFechaAgendada(today);
  };

  const guardar = () => {
    if (!nombre.trim()) { alert("Completá el nombre del cliente"); return; }
    createPedido.mutate(
      {
        data: {
          nombre: nombre.trim(),
          dir: dir.trim() || undefined,
          rep,
          turno,
          tienePedido,
          nota: tienePedido ? nota : undefined,
          tieneGarrafa: hayGarrafa,
          garrafaEstado: hayGarrafa ? garrafaEstado : undefined,
          items,
          fechaOrigen: today,
          fechaActual: fechaAgendada,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListPedidosQueryKey({ fecha: today }) });
          qc.invalidateQueries({ queryKey: getListPedidosQueryKey() });
          qc.invalidateQueries({ queryKey: getGetTodayStatsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetFuturosQueryKey() });

          // Auto-guardar cliente si no existe todavía
          const nombreTrim = nombre.trim();
          const dirTrim = dir.trim();
          const yaExiste = clientes.some(
            (c) => c.nombre.toLowerCase() === nombreTrim.toLowerCase()
          );
          if (!yaExiste && nombreTrim) {
            createCliente.mutate(
              { data: { nombre: nombreTrim, dirs: dirTrim ? [dirTrim] : [] } },
              {
                onSuccess: () => {
                  qc.invalidateQueries({ queryKey: getListClientesQueryKey() });
                },
              }
            );
          }

          limpiar();
        },
      }
    );
  };

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getListPedidosQueryKey({ fecha: today }) });
    qc.invalidateQueries({ queryKey: getGetTodayStatsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetFuturosQueryKey() });
  };

  const moverAdelante = (p: Pedido) => {
    let newTurno = p.turno;
    let newFecha = p.fechaActual;
    if (p.turno === "manana") {
      newTurno = "tarde";
    } else {
      newTurno = "manana";
      newFecha = sumarDia(p.fechaActual);
    }
    updatePedido.mutate(
      { id: p.id, data: { turno: newTurno, fechaActual: newFecha } },
      { onSuccess: invalidateAll }
    );
  };

  const moverAtras = (p: Pedido) => {
    let newTurno = p.turno;
    let newFecha = p.fechaActual;
    if (p.turno === "tarde") {
      newTurno = "manana";
    } else {
      const diaAnt = restarDia(p.fechaActual);
      if (diaAnt < today) { alert("No se puede volver más atrás de hoy"); return; }
      newTurno = "tarde";
      newFecha = diaAnt;
    }
    updatePedido.mutate(
      { id: p.id, data: { turno: newTurno, fechaActual: newFecha } },
      { onSuccess: invalidateAll }
    );
  };

  const borrar = (id: number) => {
    if (!confirm("¿Eliminar este pedido?")) return;
    deletePedido.mutate(
      { id },
      { onSuccess: invalidateAll }
    );
  };

  const saveOrder = (items: { nombre: string; orden: number }[]) => {
    const seen = new Set<string>();
    items.forEach(({ nombre, orden }) => {
      if (seen.has(nombre)) return;
      seen.add(nombre);
      const cliente = clientes.find((c) => c.nombre === nombre);
      if (cliente) {
        updateCliente.mutate(
          { id: cliente.id, data: { ordenRuta: orden } },
          { onSuccess: () => qc.invalidateQueries({ queryKey: getListClientesQueryKey() }) }
        );
      }
    });
  };

  const pedidosManana = pedidos.filter((p) => p.turno === "manana");
  const pedidosTarde = pedidos.filter((p) => p.turno === "tarde");

  const prodOptions = itemTipo === "garrafa" ? GARRAFAS : GASES;

  return (
    <div className="space-y-6">
      {/* Nuevo Pedido Form */}
      <div className="border border-border rounded-lg bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Nuevo pedido</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Cliente autocomplete */}
          <div className="relative" ref={sugRef}>
            <Label className="text-xs text-muted-foreground mb-1 block">Cliente</Label>
            <Input
              data-testid="input-cliente"
              value={nombre}
              onChange={(e) => onNombreInput(e.target.value)}
              onFocus={() => nombre && setShowSug(suggestions.length > 0)}
              placeholder="Escribí el nombre..."
              autoComplete="off"
            />
            {showSug && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded shadow-md max-h-48 overflow-y-auto">
                {suggestions.map((c) => (
                  (c.dirs ?? []).length > 1 ? (
                    <div key={c.id}>
                      <div className="px-3 pt-2 pb-1 text-sm font-medium text-foreground select-none">
                        {c.nombre}
                        {c.horario && <span className="text-xs text-sky-600 ml-2">🕐 {c.horario}</span>}
                      </div>
                      {(c.dirs ?? []).map((addr, i) => (
                        <div
                          key={i}
                          className="pl-5 pr-3 py-1.5 cursor-pointer hover:bg-muted text-xs text-muted-foreground border-t border-border/30 last:border-b last:border-border/30"
                          onMouseDown={() => selectCliente(c, addr)}
                        >
                          → {addr}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      key={c.id}
                      className="px-3 py-2 cursor-pointer hover:bg-muted text-sm"
                      onMouseDown={() => selectCliente(c)}
                    >
                      <span className="font-medium">{c.nombre}</span>
                      {(c.dirs ?? [])[0] && <span className="text-muted-foreground text-xs ml-2">— {(c.dirs ?? [])[0]}</span>}
                      {c.horario && (
                        <span className="text-xs text-sky-600 ml-2 block">🕐 {c.horario}</span>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Dirección</Label>
            {clienteEnDB ? (
              <div className="flex items-center gap-2 rounded border border-border bg-muted/40 px-3 py-2 min-h-[36px]">
                <span className="flex-1 text-sm text-foreground">{dir || <span className="italic text-muted-foreground">Sin dirección</span>}</span>
              </div>
            ) : (
              <Input
                data-testid="input-dir"
                value={dir}
                onChange={(e) => setDir(e.target.value)}
                placeholder="Se completa automático"
              />
            )}
          </div>
        </div>

        {clienteEnDB && (
          <p className="text-xs text-muted-foreground -mt-1">
            Dirección y horario del cliente guardado.{" "}
            <span className="text-sky-600">Para editar, usá la pestaña Clientes.</span>
          </p>
        )}

        {clienteEnDB && horarioCliente && (
          <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Horario: <strong>{horarioCliente}</strong></span>
          </div>
        )}
        {!clienteEnDB && horarioCliente && (
          <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>Horario del cliente: <strong>{horarioCliente}</strong></span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Repartidor</Label>
            <Select value={rep} onValueChange={setRep}>
              <SelectTrigger data-testid="select-rep">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jose">José</SelectItem>
                <SelectItem value="Claudio">Claudio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Turno</Label>
            <Select value={turno} onValueChange={(v) => setTurno(v as "manana" | "tarde")}>
              <SelectTrigger data-testid="select-turno">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manana">☀ Mañana</SelectItem>
                <SelectItem value="tarde">🌆 Tarde</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Fecha de entrega</Label>
          <input
            type="date"
            value={fechaAgendada}
            min={today}
            onChange={(e) => setFechaAgendada(e.target.value || today)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            data-testid="input-fecha-agendada"
          />
          {fechaAgendada > today && (
            <p className="text-xs text-amber-600 mt-1">⏰ Este pedido quedará en Postergados hasta el {fechaAgendada}</p>
          )}
        </div>

        {/* Product builder */}
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs text-muted-foreground">Productos — opcional, dejá vacío si es solo una visita o cobro</p>
          <div className="grid grid-cols-[1fr_2fr_70px_90px_auto] gap-2 items-end">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo</Label>
              <Select
                value={itemTipo}
                onValueChange={(v) => {
                  const t = v as "garrafa" | "gas";
                  setItemTipo(t);
                  setItemProd(t === "garrafa" ? GARRAFAS[0] : GASES[0]);
                  setItemTamano("");
                }}
              >
                <SelectTrigger data-testid="select-item-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="garrafa">Garrafa</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Producto</Label>
              <Select value={itemProd} onValueChange={setItemProd}>
                <SelectTrigger data-testid="select-item-prod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prodOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {itemTipo === "gas" ? "Tubos" : "Cant."}
              </Label>
              <Input
                data-testid="input-item-cant"
                type="number"
                min={1}
                step={1}
                value={itemCant}
                onChange={(e) => setItemCant(e.target.value)}
              />
            </div>
            <div>
              {itemTipo === "gas" ? (
                <>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Tamaño{GAS_UNIDADES[itemProd] ? ` (${GAS_UNIDADES[itemProd]})` : ""}
                  </Label>
                  <Input
                    data-testid="input-item-tamano"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    placeholder="opcional, ej: 6.2"
                    value={itemTamano}
                    onChange={(e) => setItemTamano(e.target.value)}
                  />
                </>
              ) : (
                <div className="h-9" />
              )}
            </div>
            <Button variant="outline" size="sm" onClick={addItem} data-testid="button-add-item" className="h-9">
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>

          {itemTipo === "gas" && (
            <p className="text-xs text-muted-foreground">
              Ej: 2 tubos de Oxígeno de 6 m³ c/u → cargá esta línea, y si tenés otro tubo de otro tamaño (ej: 8 m³), agregalo como una línea aparte.
            </p>
          )}

          {items.length > 0 && (
            <div className="bg-muted rounded p-2 space-y-1">
              {items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                  <span className="flex items-center gap-2">
                    <ItemBadge tipo={it.tipo} />
                    {it.prod}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">
                      {it.tipo === "garrafa"
                        ? `x${it.cant}`
                        : it.tamano === null || it.tamano === undefined
                        ? `x${it.cant} (sin medida)`
                        : `x${it.cant} de ${it.tamano}${GAS_UNIDADES[it.prod] ? " " + GAS_UNIDADES[it.prod] : ""}`}
                    </span>
                    <button
                      className="text-destructive hover:text-destructive/80"
                      onClick={() => removeItem(i)}
                      data-testid={`button-remove-item-${i}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Garrafa estado */}
        {hayGarrafa && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <Label className="text-xs font-medium text-blue-700 mb-2 block">Estado de garrafa</Label>
            <Select value={garrafaEstado} onValueChange={(v) => setGarrafaEstado(v as "pendiente" | "paga")}>
              <SelectTrigger data-testid="select-garrafa-estado" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Garrafa pendiente de pago</SelectItem>
                <SelectItem value="paga">Garrafa pagada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Pedido especial */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm" data-testid="toggle-pedido-especial">
            <input
              type="checkbox"
              checked={tienePedido}
              onChange={(e) => setTienePedido(e.target.checked)}
              className="rounded"
            />
            Tiene pedido especial (nota)
          </label>
          {tienePedido && (
            <Textarea
              data-testid="textarea-nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: pedir factura, entregar también alambre, etc."
              rows={2}
            />
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={limpiar} data-testid="button-limpiar">
            Limpiar
          </Button>
          <Button size="sm" onClick={guardar} disabled={createPedido.isPending} data-testid="button-guardar">
            {createPedido.isPending ? "Guardando..." : "✓ Guardar pedido"}
          </Button>
        </div>
      </div>

      {/* Turno Mañana */}
      <TurnoSection
        label="☀ Mañana"
        turno="manana"
        pedidos={pedidosManana}
        clientes={clientes}
        usuario={usuarioActual}
        loading={loadingPedidos}
        today={today}
        onAdelante={moverAdelante}
        onAtras={moverAtras}
        onBorrar={borrar}
        onSaveOrder={saveOrder}
        fecha={fechaLinda(today)}
      />

      {/* Turno Tarde */}
      <TurnoSection
        label="🌆 Tarde"
        turno="tarde"
        pedidos={pedidosTarde}
        clientes={clientes}
        usuario={usuarioActual}
        loading={loadingPedidos}
        today={today}
        onAdelante={moverAdelante}
        onAtras={moverAtras}
        onBorrar={borrar}
        onSaveOrder={saveOrder}
        fecha=""
      />

      {/* Postergados */}
      {futuros.length > 0 && (
        <PostergadosSection
          dias={futuros}
          onTraerDeVuelta={moverAtras}
          onBorrar={borrar}
        />
      )}
    </div>
  );
}

function ItemBadge({ tipo }: { tipo: "garrafa" | "gas" }) {
  if (tipo === "garrafa") {
    return <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">Garrafa</span>;
  }
  return <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-medium">Gas</span>;
}

function GarrafaBadge({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <span className="text-muted-foreground">—</span>;
  if (estado === "paga") {
    return <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-medium">✓ Pagada</span>;
  }
  return <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">Pendiente</span>;
}

function TurnoSection({
  label, turno, pedidos, clientes, usuario, loading, today, onAdelante, onAtras, onBorrar, onSaveOrder, fecha,
}: {
  label: string;
  turno: "manana" | "tarde";
  pedidos: Pedido[];
  clientes: Cliente[];
  usuario: string | null;
  loading: boolean;
  today: string;
  onAdelante: (p: Pedido) => void;
  onAtras: (p: Pedido) => void;
  onBorrar: (id: number) => void;
  onSaveOrder: (items: { nombre: string; orden: number }[]) => void;
  fecha: string;
}) {
  const [localOrder, setLocalOrder] = useState<number[]>([]);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState<{ done: number; total: number } | null>(null);

  const pedidoIds = pedidos.map((p) => p.id).sort().join(",");

  useEffect(() => {
    const sorted = [...pedidos].sort((a, b) => {
      const oa = clientes.find((c) => c.nombre === a.nombre)?.ordenRuta ?? null;
      const ob = clientes.find((c) => c.nombre === b.nombre)?.ordenRuta ?? null;
      if (oa === null && ob === null) return 0;
      if (oa === null) return 1;
      if (ob === null) return -1;
      return oa - ob;
    });
    setLocalOrder(sorted.map((p) => p.id));
    setOrderChanged(false);
  }, [pedidoIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayPedidos = useMemo(() => {
    const map = new Map(pedidos.map((p) => [p.id, p]));
    const ordered = localOrder.map((id) => map.get(id)).filter(Boolean) as Pedido[];
    const extras = pedidos.filter((p) => !localOrder.includes(p.id));
    return [...ordered, ...extras];
  }, [localOrder, pedidos]);

  const handleDrop = (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;
    setLocalOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(draggedId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
    setDraggedId(null);
    setDragOverId(null);
    setOrderChanged(true);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizeProgress({ done: 0, total: displayPedidos.length });
    try {
      const { optimizeRoute } = await import("@/lib/routeOptimizer");
      const optimized = await optimizeRoute(displayPedidos, (done, total) => {
        setOptimizeProgress({ done, total });
      });
      setLocalOrder((optimized as Pedido[]).map((p) => p.id));
      setOrderChanged(true);
    } catch {
      alert("No se pudo calcular la ruta. Verificá la conexión a internet.");
    } finally {
      setIsOptimizing(false);
      setOptimizeProgress(null);
    }
  };

  const handleSaveOrder = () => {
    const updates = displayPedidos.map((p, i) => ({ nombre: p.nombre, orden: i + 1 }));
    onSaveOrder(updates);
    setOrderChanged(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${turno === "manana" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}>
          {label}
        </span>
        {fecha && <span className="text-sm text-muted-foreground">{fecha}</span>}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {orderChanged && (
            <button
              className="text-xs border border-emerald-300 bg-emerald-50 rounded px-2.5 py-1 hover:bg-emerald-100 text-emerald-800 font-medium"
              onClick={handleSaveOrder}
            >
              💾 Guardar orden
            </button>
          )}
          {!loading && pedidos.length > 0 && (
            <button
              className="flex items-center gap-1 text-xs border border-border rounded px-2.5 py-1 hover:bg-muted text-muted-foreground disabled:opacity-50"
              onClick={handleOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing && optimizeProgress
                ? `Geocodificando… ${optimizeProgress.done}/${optimizeProgress.total}`
                : <><MapPin className="h-3.5 w-3.5" /> Optimizar ruta</>}
            </button>
          )}
          <button
            className="flex items-center gap-1 text-xs border border-border rounded px-2.5 py-1 hover:bg-muted text-muted-foreground"
            onClick={() => {
              const enriched = displayPedidos.map((p) => ({
                ...p,
                horarioCliente: clientes.find((c) => c.nombre === p.nombre)?.horario ?? null,
              }));
              printShift(label, today, enriched, usuario ?? undefined);
            }}
            data-testid={`button-print-${turno}`}
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Sin pedidos para este turno</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-2 py-2 w-6"></th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Dirección</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Horario</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Productos</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Garrafa</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Pedido especial</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Rep.</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden lg:table-cell">Origen</th>
                  <th className="px-3 py-2 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {displayPedidos.map((p, i) => {
                  const lblAd = p.turno === "manana" ? "→ Tarde" : "→ Mañana sig.";
                  const lblAt = p.turno === "tarde" ? "← Mañana" : "← Tarde ant.";
                  const puedeAtras = !(p.turno === "manana" && p.fechaActual === today);
                  const esAnterior = p.fechaOrigen !== p.fechaActual;
                  const isDragging = draggedId === p.id;
                  const isDragOver = dragOverId === p.id;

                  return (
                    <tr
                      key={p.id}
                      draggable
                      onDragStart={() => setDraggedId(p.id)}
                      onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverId(p.id); }}
                      onDrop={() => handleDrop(p.id)}
                      className={`border-b border-border last:border-0 transition-colors ${isDragging ? "opacity-40 bg-muted/30" : isDragOver ? "bg-primary/5 border-t-2 border-t-primary" : "hover:bg-muted/20"}`}
                      data-testid={`row-pedido-${p.id}`}
                    >
                      <td className="px-2 py-2 text-muted-foreground cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 opacity-40 hover:opacity-80" />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{p.nombre}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">{p.dir}</td>
                      <td className="px-3 py-2 text-xs text-sky-700 hidden md:table-cell whitespace-nowrap">
                        {clientes.find((c) => c.nombre === p.nombre)?.horario ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {p.items.length === 0 ? (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">Solo visita</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {p.items.map((it, j) => (
                              <span
                                key={j}
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${it.tipo === "garrafa" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}
                              >
                                {formatItem(it)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {p.tieneGarrafa ? <GarrafaBadge estado={p.garrafaEstado} /> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        {p.tienePedido ? (
                          <div>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-medium">Pedido</span>
                            {p.nota && <p className="text-xs text-muted-foreground mt-0.5 max-w-[140px] truncate">{p.nota}</p>}
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap hidden sm:table-cell">{p.rep}</td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        {esAnterior
                          ? <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Desde {p.fechaOrigen}</span>
                          : <span className="text-xs text-muted-foreground">Hoy</span>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {puedeAtras && (
                            <button
                              className="text-xs border border-border rounded px-1.5 py-0.5 hover:bg-muted text-primary"
                              onClick={() => onAtras(p)}
                              title={lblAt}
                              data-testid={`button-atras-${p.id}`}
                            >
                              <ChevronLeft className="h-3.5 w-3.5 inline" /> {lblAt}
                            </button>
                          )}
                          <button
                            className="text-xs border border-amber-300 bg-amber-50 rounded px-1.5 py-0.5 hover:bg-amber-100 text-amber-800"
                            onClick={() => onAdelante(p)}
                            title={lblAd}
                            data-testid={`button-adelante-${p.id}`}
                          >
                            {lblAd} <ChevronRight className="h-3.5 w-3.5 inline" />
                          </button>
                          <button
                            className="text-destructive hover:text-destructive/80 p-0.5"
                            onClick={() => onBorrar(p.id)}
                            data-testid={`button-borrar-${p.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PostergadosSection({
  dias,
  onTraerDeVuelta,
  onBorrar,
}: {
  dias: HistorialDia[];
  onTraerDeVuelta: (p: Pedido) => void;
  onBorrar: (id: number) => void;
}) {
  const total = dias.reduce((acc, d) => acc + d.pedidos.length, 0);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-rose-500" />
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
          Postergados
        </span>
        <span className="text-sm text-muted-foreground">{total} pedido{total !== 1 ? "s" : ""} en días futuros</span>
      </div>

      <div className="border border-rose-200 rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-rose-50/60">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Dirección</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Turno</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Productos</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {dias.map((dia) =>
                dia.pedidos.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-rose-50/30">
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {fechaLinda(dia.fecha)}
                    </td>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{p.nombre}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">{p.dir ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.turno === "manana" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"}`}>
                        {p.turno === "manana" ? "☀ Mañana" : "🌆 Tarde"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.items.map((it, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {formatItem(it)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          className="text-xs border border-sky-300 bg-sky-50 rounded px-1.5 py-0.5 hover:bg-sky-100 text-sky-800 whitespace-nowrap"
                          onClick={() => onTraerDeVuelta(p)}
                          title="Traer de vuelta al turno anterior"
                        >
                          <ChevronLeft className="h-3.5 w-3.5 inline" /> Traer
                        </button>
                        <button
                          className="text-destructive hover:text-destructive/80 p-0.5"
                          onClick={() => onBorrar(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
