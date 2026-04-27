// src/pages/Proveedores/index.tsx
import { useState } from "react";
import { Building2, Plus, Pencil, Trash2, Phone, Mail, MapPin, User } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useProveedores } from "./useProveedores";
import { Proveedor } from "./types";
import { ProveedorDialog } from "./ProveedorDialog";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "sonner";

export default function ProveedoresPage() {
  const { isAdmin } = useAuth();
  const { proveedores, loading, saving, refresh, createProveedor, updateProveedor, deleteProveedor } = useProveedores();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openDialog = (p?: Proveedor) => {
    setEditingProveedor(p ?? null);
    setDialogOpen(true);
  };

  const handleSave = async (data: Partial<Proveedor>) => {
    if (editingProveedor) {
      await updateProveedor(editingProveedor.id, data);
    } else {
      await createProveedor(data);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProveedor(id);
    setConfirmDeleteId(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Proveedores
        </h1>
        {isAdmin && (
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="h-4 w-4" /> Agregar proveedor
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Cargando...</p>
      ) : proveedores.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No hay proveedores registrados</p>
          {isAdmin && <p className="text-xs text-muted-foreground mt-1">Presiona "Agregar proveedor" para comenzar</p>}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {proveedores.map((p) => (
            <div key={p.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-semibold truncate">{p.nombre_empresa}</h3>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setConfirmDeleteId(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              {p.rut && <p className="text-xs text-muted-foreground">RUT: {p.rut}</p>}
              <div className="space-y-1 text-xs">
                {p.nombre_contacto && (
                  <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" /> {p.nombre_contacto}</div>
                )}
                {p.telefono && (
                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" /> {p.telefono}</div>
                )}
                {p.email && (
                  <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /> <span className="truncate">{p.email}</span></div>
                )}
                {p.direccion && (
                  <div className="flex items-start gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" /> <span className="break-words">{p.direccion}</span></div>
                )}
              </div>
              {confirmDeleteId === p.id && (
                <div className="border border-destructive/50 rounded-md p-2 space-y-2 mt-2">
                  <p className="text-xs text-destructive font-medium">¿Eliminar este proveedor?</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Confirmar</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ProveedorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingProveedor={editingProveedor}
        onSave={handleSave}
        saving={saving}
      />
    </section>
  );
}