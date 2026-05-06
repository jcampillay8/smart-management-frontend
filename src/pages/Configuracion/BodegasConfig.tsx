import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { 
  LayoutGrid, Plus, Pencil, Trash2, Box, Refrigerator, Container, 
  Warehouse, Truck, Store, Archive, Package, Snowflake, Thermometer,
  ChefHat, Utensils, Coffee, Wine, GlassWater, ShoppingBag, Tag,
  Layers, Droplets, Flame, Zap, Shield, MapPin, Home,
  Bed, Bell, Key, DoorOpen, Bath, Wifi, Tv, Armchair, Dumbbell, Waves,
  Monitor, Printer, FileText, PenTool, Headset, Calendar, Calculator, Mail,
  Stethoscope, Siren, Power, Plug, Wrench, Lightbulb, ChevronLeft, ChevronRight
} from "lucide-react";
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
  "#7F1D1D", "#EF4444", "#F97316", "#EAB308", "#84CC16", "#22C55E", 
  "#064E3B", "#14B8A6", "#0891B2", "#0EA5E9", "#2563EB", "#6366F1", 
  "#8B5CF6", "#D946EF", "#EC4899", "#78350F", "#451A03", "#64748B"
];

const AVAILABLE_ICONS = [
  { id: "Warehouse", icon: Warehouse },
  { id: "Box", icon: Box },
  { id: "Package", icon: Package },
  { id: "Archive", icon: Archive },
  { id: "Container", icon: Container },
  { id: "Refrigerator", icon: Refrigerator },
  { id: "Snowflake", icon: Snowflake },
  { id: "Thermometer", icon: Thermometer },
  { id: "ChefHat", icon: ChefHat },
  { id: "Utensils", icon: Utensils },
  { id: "Coffee", icon: Coffee },
  { id: "Wine", icon: Wine },
  { id: "GlassWater", icon: GlassWater },
  { id: "Store", icon: Store },
  { id: "Truck", icon: Truck },
  { id: "ShoppingBag", icon: ShoppingBag },
  { id: "Tag", icon: Tag },
  { id: "Layers", icon: Layers },
  { id: "Droplets", icon: Droplets },
  { id: "Flame", icon: Flame },
  { id: "Zap", icon: Zap },
  { id: "Shield", icon: Shield },
  { id: "MapPin", icon: MapPin },
  { id: "Home", icon: Home },
  { id: "Bed", icon: Bed },
  { id: "Bell", icon: Bell },
  { id: "Key", icon: Key },
  { id: "DoorOpen", icon: DoorOpen },
  { id: "Bath", icon: Bath },
  { id: "Wifi", icon: Wifi },
  { id: "Tv", icon: Tv },
  { id: "Armchair", icon: Armchair },
  { id: "Dumbbell", icon: Dumbbell },
  { id: "Waves", icon: Waves },
  { id: "Monitor", icon: Monitor },
  { id: "Printer", icon: Printer },
  { id: "FileText", icon: FileText },
  { id: "PenTool", icon: PenTool },
  { id: "Headset", icon: Headset },
  { id: "Calendar", icon: Calendar },
  { id: "Calculator", icon: Calculator },
  { id: "Mail", icon: Mail },
  { id: "Stethoscope", icon: Stethoscope },
  { id: "Siren", icon: Siren },
  { id: "Power", icon: Power },
  { id: "Plug", icon: Plug },
  { id: "Wrench", icon: Wrench },
  { id: "Lightbulb", icon: Lightbulb },
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
  const [iconPage, setIconPage] = useState(0);
  const iconsPerPage = 24;
  const totalPages = Math.ceil(AVAILABLE_ICONS.length / iconsPerPage);

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
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ícono Distintivo</Label>
                <div className="hidden md:flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setIconPage(p => Math.max(0, p - 1))}
                    disabled={iconPage === 0}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">{iconPage + 1} / {totalPages}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setIconPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={iconPage === totalPages - 1}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Mobile: Scroll horizontal / PC: Paginated Grid */}
              <div className="relative group w-full overflow-hidden">
                <div className="md:hidden grid grid-rows-3 grid-flow-col overflow-x-auto gap-2 pb-3 px-1 scroll-smooth custom-scrollbar touch-pan-x min-h-[120px] w-full">
                  {AVAILABLE_ICONS.map(i => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setIcono(i.id)}
                      className={cn(
                        "h-9 w-9 shrink-0 rounded-xl border flex items-center justify-center transition-all",
                        icono === i.id ? "bg-primary/10 border-primary text-primary" : "bg-muted/30 border-transparent text-muted-foreground"
                      )}
                    >
                      <i.icon size={18} />
                    </button>
                  ))}
                </div>

                <div className="hidden md:grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.slice(iconPage * iconsPerPage, (iconPage + 1) * iconsPerPage).map(i => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => setIcono(i.id)}
                      className={cn(
                        "h-11 w-11 rounded-xl border flex items-center justify-center transition-all hover:bg-muted",
                        icono === i.id ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground"
                      )}
                    >
                      <i.icon size={20} />
                    </button>
                  ))}
                </div>
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

