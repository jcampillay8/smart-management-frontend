// src/pages/Actividades/index.tsx
import { useState } from "react";
import { useNotas } from "../Analiticas/useNotas";
import { useAuth } from "../../hooks/useAuth";
import { NotaCard } from "../Analiticas/NotaCard";
import { NotaDialog } from "../Analiticas/NotaDialog";
import { RefreshCw, Plus, StickyNote } from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export default function ActividadesPage() {
  const { user } = useAuth();
  const { notas, loading, saving, refresh, createNota, updateNota, deleteNota } = useNotas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<any | null>(null);

  const handleSave = async (data: { titulo: string; contenido: string; urgencia: string; fecha?: string; menciones: number[] }) => {
    try {
      if (editingNota && editingNota.id !== "new") {
        await updateNota(editingNota.id, data);
        toast.success("Nota actualizada");
      } else {
        await createNota(data);
        toast.success("Nota publicada");
      }
      setEditingNota(null);
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving note:", err);
      toast.error("Error al guardar la nota");
    }
  };

  const handleMention = (userId: number) => {
    setEditingNota({
      id: "new",
      contenido: "",
      urgencia: "media",
      menciones: [{ user_id: userId }]
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta nota?")) return;
    try {
      await deleteNota(id);
      toast.success("Nota eliminada");
    } catch {
      toast.error("Error al eliminar la nota");
    }
  };

  const handleEdit = (nota: any) => {
    setEditingNota(nota);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 mb-2">
        <div className="space-y-1 shrink-0">
          <h1 className="text-4xl font-black tracking-tighter">Panel de actividades</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Notas del Equipo y Seguimiento Interno
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin mr-2 h-4 w-4" : "mr-2 h-4 w-4"} /> Actualizar
          </Button>
          <Button size="sm" onClick={() => { setEditingNota(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nueva nota
          </Button>
        </div>
      </header>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-10">Cargando actividades...</p>
        ) : notas.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed rounded-xl">
            <StickyNote className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No hay actividades registradas aún.</p>
          </div>
        ) : (
          notas.map(nota => (
            <NotaCard
              key={nota.id}
              nota={nota}
              currentUserId={user?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMention={handleMention}
            />
          ))
        )}
      </div>

      <NotaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingNota={editingNota}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
