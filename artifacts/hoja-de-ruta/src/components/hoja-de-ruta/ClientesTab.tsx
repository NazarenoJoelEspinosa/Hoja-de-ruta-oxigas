import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
  getListClientesQueryKey,
  type Cliente,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDir, setEditDir] = useState("");

  const guardar = () => {
    if (!nombre.trim()) { alert("Ingresá el nombre"); return; }
    createCliente.mutate(
      { data: { nombre: nombre.trim(), dir: dir.trim() } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListClientesQueryKey() });
          setNombre("");
          setDir("");
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
    setEditDir(c.dir ?? "");
  };

  const saveEdit = (c: Cliente) => {
    updateCliente.mutate(
      { id: c.id, data: { dir: editDir } },
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
            <Label className="text-xs text-muted-foreground mb-1 block">Dirección</Label>
            <Input
              data-testid="input-cli-dir"
              value={dir}
              onChange={(e) => setDir(e.target.value)}
              placeholder="Dirección completa"
              onKeyDown={(e) => e.key === "Enter" && guardar()}
            />
          </div>
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
                className="flex items-center justify-between bg-muted/30 border border-border rounded p-3 gap-3"
                data-testid={`card-cliente-${c.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{c.nombre}</p>
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        data-testid={`input-edit-dir-${c.id}`}
                        value={editDir}
                        onChange={(e) => setEditDir(e.target.value)}
                        className="h-7 text-xs"
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(c)}
                        autoFocus
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(c)} data-testid={`button-save-dir-${c.id}`}>
                        Guardar
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{c.dir || "(sin dirección)"}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
