// src/pages/Configuracion/AreasOperativasConfig.tsx
import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import {
  Layers, Plus, Pencil, Trash2, Warehouse, ShieldCheck, Users, CheckCircle2, Circle
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAreaOperativa, AreaOperativa } from "../../hooks/useAreaOperativa";
import { useBodega, Bodega } from "../../hooks/useBodega";

interface UserOption { id: number; email: string; username: string; }

export function AreasOperativasConfig() {
  const { areas, refreshAreas } = useAreaOperativa();
  const { allBodegas: bodegas } = useBodega();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaOperativa | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nombre, setNombre] = useState("");
  const [selectedBodegasIds, setSelectedBodegasIds] = useState<string[]>([]);
  const [bodegaConsumoId, setBodegaConsumoId] = useState("");
  const [selectedUsuariosIds, setSelectedUsuariosIds] = useState<number[]>([]);

  useEffect(() => {
    api.get("/user/admin/all").then(r => setUsers(r.data ?? [])).catch(() => {});
  }, []);

  const openNew = () => {
    setEditingArea(null);
    setNombre("");
    setSelectedBodegasIds([]);
    setBodegaConsumoId("");
    setSelectedUsuariosIds([]);
    setDialogOpen(true);
  };

  const openEdit = (area: AreaOperativa) => {
    setEditingArea(area);
    setNombre(area.nombre);
    setSelectedBodegasIds(area.bodegas_ids);
    setBodegaConsumoId(area.bodega_consumo_id);
    setSelectedUsuariosIds(area.usuarios_ids);
    setDialogOpen(true);
  };

  const toggleBodega = (id: string) => {
    setSelectedBodegasIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // If bodega_consumo was deselected, reset it
      if (!next.includes(bodegaConsumoId)) setBodegaConsumoId("");
      return next;
    });
  };

  const toggleUsuario = (id: number) => {
    setSelectedUsuariosIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!nombre.trim()) { toast.error("El nombre es requerido"); return; }
    if (!bodegaConsumoId) { toast.error("Debes seleccionar una bodega de consumo"); return; }
    if (!selectedBodegasIds.includes(bodegaConsumoId)) {
      toast.error("La bodega de consumo debe estar incluida en las bodegas del área");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        bodega_consumo_id: bodegaConsumoId,
        bodegas_ids: selectedBodegasIds,
        usuarios_ids: selectedUsuariosIds,
      };
      if (editingArea) {
        await api.put(`/settings/areas/${editingArea.id}`, payload);
        toast.success("Área operativa actualizada");
      } else {
        await api.post("/settings/areas", payload);
        toast.success("Área operativa creada");
      }
      setDialogOpen(false);
      await refreshAreas();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta área operativa? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/settings/areas/${id}`);
      toast.success("Área eliminada");
      await refreshAreas();
    } catch (e) {
      toast.error("Error al eliminar el área");
    }
  };

  const consumoBodega = (area: AreaOperativa) => bodegas.find(b => b.id === area.bodega_consumo_id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5 text-center md:text-left">
          <h3 className="text-sm font-black uppercase tracking-tight">Áreas Operativas</h3>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
            Agrupa bodegas y usuarios bajo un contexto de operación.
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="rounded-xl gap-2 font-black text-[10px] uppercase shadow-lg shadow-primary/20 w-full md:w-auto">
          <Plus className="h-4 w-4" /> Nueva Área
        </Button>
      </div>

      {areas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
          <Layers className="h-8 w-8 opacity-30" />
          <p className="text-xs font-bold uppercase tracking-wide">Sin áreas operativas</p>
          <p className="text-[10px]">Crea una para empezar a agrupar bodegas y usuarios.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {areas.map(area => {
          const cb = consumoBodega(area);
          return (
            <div
              key={area.id}
              className="relative flex flex-col gap-3 p-4 rounded-2xl border bg-card/50 hover:bg-accent/20 transition-all group border-white/5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{area.nombre}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      {area.bodegas_ids.length} bodega{area.bodegas_ids.length !== 1 ? "s" : ""}  ·  {area.usuarios_ids.length} usuario{area.usuarios_ids.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(area)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(area.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Bodega de consumo badge */}
              {cb && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${cb.color ?? "#10B981"}15`, color: cb.color ?? "#10B981" }}>
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">
                    Consumo: {cb.nombre}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {editingArea ? "Editar Área Operativa" : "Nueva Área Operativa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Área</Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Restaurante Principal, Cafetería..."
                className="rounded-xl border-2 font-bold"
              />
            </div>

            {/* Bodegas */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Warehouse className="h-3.5 w-3.5" /> Bodegas Asociadas
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {bodegas.map(b => {
                  const active = selectedBodegasIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBodega(b.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all text-left",
                        active ? "bg-primary/10 border-primary text-primary" : "hover:bg-secondary border-border text-muted-foreground"
                      )}
                    >
                      {active ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">{b.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bodega de consumo */}
            {selectedBodegasIds.length > 0 && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-500" /> Bodega de Consumo <span className="text-amber-500">*</span>
                </Label>
                <p className="text-[10px] text-muted-foreground -mt-1">
                  El stock se descuenta exclusivamente de esta bodega al registrar consumos.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {bodegas.filter(b => selectedBodegasIds.includes(b.id)).map(b => {
                    const active = bodegaConsumoId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBodegaConsumoId(b.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all text-left",
                          active
                            ? "bg-amber-500/10 border-amber-500 text-amber-600"
                            : "hover:bg-secondary border-border text-muted-foreground"
                        )}
                      >
                        {active ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
                        <span className="truncate">{b.nombre}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Usuarios */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Usuarios Asignados
              </Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {users.map(u => {
                  const active = selectedUsuariosIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleUsuario(u.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all",
                        active ? "bg-primary/10 border-primary" : "hover:bg-secondary border-border"
                      )}
                    >
                      <div className={cn("h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black", active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                        {(u.username?.[0] ?? u.email[0]).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-bold truncate", active ? "text-primary" : "")}>{u.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="ml-auto shrink-0">
                        {active ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground/30" />}
                      </div>
                    </button>
                  );
                })}
                {users.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No hay usuarios disponibles</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-black text-[10px] uppercase">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl font-black text-[10px] uppercase shadow-lg shadow-primary/20">
              {saving ? "Guardando..." : editingArea ? "Actualizar" : "Crear Área"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
