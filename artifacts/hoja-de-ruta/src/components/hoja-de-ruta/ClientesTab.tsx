import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
  getListClientesQueryKey,
  type Cliente,
} from "../../../../lib/api-client-react/src";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Clock, Plus, X, MapPin } from "lucide-react";

export default function ClientesTab() {
  const qc = useQueryClient();
  const { data: clientes = [], isLoading } = useListClientes({
    query: { queryKey: getListClientesQueryKey() },
  });

  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [nombre, setNombre] = useState("");
  const [dir, setDir] = useState("");
  const [horario, setHorario] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDirs, setEditDirs] = useState<string[]>([]);
  const [editDirInput, setEditDirInput] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editOrdenRuta, setEditOrdenRuta] = useState<string>("");

  const guardar = () => {
    if (!nombre.trim()) { alert("Ingresá el nombre"); return; }
    const dirs = dir.trim() ? [dir.trim()] : [];
    createCliente.mutate(
      { data: { nombre: nombre.trim(), dirs, horario: horario.trim() || undefined } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListClientesQueryKey() });
          setNombre("");
          setDir("");
          setHorario("");
        },
        onError: (err: unknown) => {
          const e = err as { data?: { error?: string } };
          alert(e?.data?.error ?? "Error al guardar cliente");
        },
      }
    );
  };

  const startEdit = (c: Cliente) => {
    setEditingId(c.id);
    setEditDirs([...(c.dirs ?? [])]);
    setEditDirInput("");
    setEditHorario(c.horario ?? "");
    setEditOrdenRuta(c.ordenRuta != null ? String(c.ordenRuta) : "");
  };

  const addEditDir = () => {
    const v = editDirInput.trim();
    if (!v || editDirs.includes(v)) return;
    setEditDirs([...editDirs, v]);
    setEditDirInput("");
  };

  const removeEditDir = (idx: number) => {
    setEditDirs(editDirs.filter((_, i) => i !== idx));
  };

  const saveEdit = (c: Cliente) => {
    const finalDirs = editDirInput.trim()
      ? [...editDirs, editDirInput.trim()]
      : editDirs;
    const ordenNum = editOrdenRuta.trim() ? parseInt(editOrdenRuta.trim()) : null;
    updateCliente.mutate(
      { id: c.id, data: { dirs: finalDirs, horario: editHorario || undefined, ordenRuta: ordenNum } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListClientesQueryKey() });
          setEditingId(null);
        },
      }
    );
  };

  const borrar = (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    deleteCliente.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListClientesQueryKey() });
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="border border-border rounded-lg bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Agregar cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Nombre</Label>
            <Input
              data-testid="input-cli-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Dirección <span className="italic">(opcional)</span></Label>
            <Input
              data-testid="input-cli-dir"
              value={dir}
              onChange={(e) => setDir(e.target.value)}
              placeholder="Dirección principal"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">
            Horario de atención <span className="italic">(opcional)</span>
          </Label>
          <Input
            data-testid="input-cli-horario"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            placeholder="Ej: Lunes a viernes 8:00-12:00, sábados hasta las 11"
            onKeyDown={(e) => e.key === "Enter" && guardar()}
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={guardar} disabled={createCliente.isPending} data-testid="button-guardar-cliente">
            {createCliente.isPending ? "Guardando..." : "+ Guardar cliente"}
          </Button>
        </div>
      </div>

      {/* Clients list */}
      <div className="border border-border rounded-lg bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Clientes guardados
          {!isLoading && <span className="ml-2 font-normal text-muted-foreground">({clientes.length})</span>}
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : clientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay clientes.</p>
        ) : (
          <div className="space-y-2">
            {clientes.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between bg-muted/30 border border-border rounded p-3 gap-3"
                data-testid={`card-cliente-${c.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.nombre}</p>

                  {editingId === c.id && editDirs !== undefined ? (
                    <div className="space-y-2 mt-2">
                      {/* Existing addresses */}
                      {editDirs.length > 0 && (
                        <div className="space-y-1">
                          {editDirs.map((d, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground flex-1 truncate bg-muted/50 rounded px-2 py-1">{d}</span>
                              <button
                                className="text-destructive hover:text-destructive/80 p-0.5 shrink-0"
                                onClick={() => removeEditDir(i)}
                                title="Quitar dirección"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add new address */}
                      <div className="flex items-center gap-1.5">
                        <Input
                          data-testid={`input-edit-dir-${c.id}`}
                          value={editDirInput}
                          onChange={(e) => setEditDirInput(e.target.value)}
                          className="h-7 text-xs"
                          placeholder={editDirs.length === 0 ? "Agregar dirección..." : "Agregar otra dirección..."}
                          onKeyDown={(e) => e.key === "Enter" && addEditDir()}
                          autoFocus={editDirs.length === 0}
                        />
                        <button
                          className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                          onClick={addEditDir}
                          title="Agregar dirección"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      {/* Horario */}
                      <Input
                        data-testid={`input-edit-horario-${c.id}`}
                        value={editHorario}
                        onChange={(e) => setEditHorario(e.target.value)}
                        className="h-7 text-xs"
                        placeholder="Horario de atención (opcional)"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(c)}
                      />
                      {/* Orden en ruta */}
                      <div className="flex items-center gap-2">
                        <Input
                          data-testid={`input-edit-orden-${c.id}`}
                          type="number"
                          min={1}
                          value={editOrdenRuta}
                          onChange={(e) => setEditOrdenRuta(e.target.value)}
                          className="h-7 text-xs w-24"
                          placeholder="Posición en ruta"
                        />
                        <span className="text-xs text-muted-foreground">Posición en ruta (1, 2, 3… — vacío = sin orden)</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(c)} data-testid={`button-save-dir-${c.id}`}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-0.5 mt-0.5">
                      {(c.dirs ?? []).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">(sin dirección)</p>
                      ) : (c.dirs ?? []).length === 1 ? (
                        <p className="text-xs text-muted-foreground">{c.dirs[0]}</p>
                      ) : (
                        <div className="space-y-0.5">
                          {(c.dirs ?? []).map((d, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {d}</p>
                          ))}
                        </div>
                      )}
                      {c.horario && (
                        <p className="text-xs text-sky-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {c.horario}
                        </p>
                      )}
                      {c.ordenRuta != null && (
                        <p className="text-xs text-emerald-700 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Parada #{c.ordenRuta}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {editingId !== c.id && (
                    <button
                      className="text-xs border border-border rounded px-2 py-1 hover:bg-muted flex items-center gap-1 text-muted-foreground"
                      onClick={() => startEdit(c)}
                      data-testid={`button-edit-${c.id}`}
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                  )}
                  <button
                    className="text-destructive hover:text-destructive/80 p-1"
                    onClick={() => borrar(c.id)}
                    data-testid={`button-delete-cliente-${c.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
