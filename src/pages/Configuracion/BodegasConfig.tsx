import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { LayoutGrid, Plus, Pencil, Trash2, Box, Refrigerator, Container, Warehouse, Truck, Store } from "lucide-react";
import BodegaBadge from "../../components/BodegaBadge";
import { cn } from "../../lib/utils";

import { useBodega } from "../../hooks/useBodega";

interface Bodega {
  id: string;
  nombre: string;
  color?: string;
  icono?: string;
}

const AVAILABLE_COLORS = [
  "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B", "#06B6D4"
];

const AVAILABLE_ICONS = [
  { id: "Box", icon: Box },
  { id: "Refrigerator", icon: Refrigerator },
  { id: "Container", icon: Container },
  { id: "Warehouse", icon: Warehouse },
  { id: "Truck", icon: Truck },
  { id: "Store", icon: Store },
];

export function BodegasConfig() {
  const { refreshBodegas } = useBodega();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBodega, setEditingBodega] = useState<Bodega | null>(null);
  
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#10B981");
  const [icono, setIcono] = useState("Box");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBodegas();
  }, []);

  const loadBodegas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/bodegas");
      setBodegas(res.data || []);
    } catch (e) {
      toast.error("Error al cargar bodegas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingBodega(null);
    setNombre("");
    
    // Pick an unused color or the first one if all used
    const usedColors = new Set(bodegas.map(b => b.color));
    const unusedColor = AVAILABLE_COLORS.find(c => !usedColors.has(c)) || AVAILABLE_COLORS[0];
    
    setColor(unusedColor);
    setIcono("Box");
    setDialogOpen(true);
  };

  const handleOpenEdit = (b: Bodega) => {
    setEditingBodega(b);
    setNombre(b.nombre);
    setColor(b.color || "#10B981");
    setIcono(b.icono || "Box");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      const payload = { nombre, color, icono };
      if (editingBodega) {
        await api.put(`/inventory/bodegas/${editingBodega.id}`, payload);
        toast.success("Bodega actualizada");
      } else {
        await api.post("/inventory/bodegas", payload);
        toast.success("Bodega creada");
      }
      setDialogOpen(false);
      await refreshBodegas();
      loadBodegas();
    } catch (e) {
      toast.error("Error al guardar bodega");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta bodega? Se perderán las configuraciones de stock mínimo asociadas y los registros históricos en esta ubicación.")) return;
    try {
      await api.delete(`/inventory/bodegas/${id}`);
      toast.success("Bodega eliminada");
      await refreshBodegas();
      loadBodegas();
    } catch (e) {
      toast.error("Error al eliminar bodega");
    }
  };

  if (loading) return <div className="animate-pulse text-xs font-bold text-muted-foreground">Sincronizando depósitos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-sm font-black uppercase tracking-tight">Centros de Almacenamiento</h3>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Gestiona tus bodegas y depósitos.</p>
        </div>
        <Button onClick={handleOpenNew} size="sm" className="rounded-xl gap-2 font-black text-[10px] uppercase shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Nueva Bodega
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {bodegas.map(b => (
          <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl border bg-card/50 hover:bg-accent/30 transition-all group border-white/5">
            <BodegaBadge nombre={b.nombre} color={b.color} icono={b.icono} />
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleOpenEdit(b)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDelete(b.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {editingBodega ? "Editar Bodega" : "Nueva Bodega"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del depósito</Label>
              <Input 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                placeholder="Ej: Bodega Central, Cocina..." 
                className="rounded-xl border-2 font-bold"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Color de Identificación</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                      color === c ? "border-primary shadow-lg shadow-primary/30" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ícono Distintivo</Label>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map(i => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setIcono(i.id)}
                    className={cn(
                      "h-10 w-10 rounded-xl border flex items-center justify-center transition-all hover:bg-muted",
                      icono === i.id ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground"
                    )}
                  >
                    <i.icon size={20} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Vista Previa</Label>
               <div className="p-4 border rounded-2xl bg-muted/20 flex justify-center">
                  <BodegaBadge nombre={nombre || "Vista Previa"} color={color} icono={icono} className="text-sm px-4 py-2" />
               </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-black text-[10px] uppercase">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl font-black text-[10px] uppercase shadow-lg shadow-primary/20">
              {saving ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

