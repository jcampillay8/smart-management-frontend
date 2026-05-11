// src/pages/Gestion/CategoriaRecetaSeccion.tsx
import { useState, useEffect } from "react";
import {
  Plus, Trash2, Pencil, ChevronDown, X, Tag,
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package,
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, ShoppingBag, Store,
  Check, Palette
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import api from "../../lib/api";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Badge } from "../../components/ui/badge";

const ICON_MAP: Record<string, any> = {
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package,
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, Tag, ShoppingBag, Store
};

const AVAILABLE_ICONS = [
  { id: "Utensils", icon: Utensils, label: "Cocina" },
  { id: "ChefHat", icon: ChefHat, label: "Chef" },
  { id: "Coffee", icon: Coffee, label: "Café" },
  { id: "Flame", icon: Flame, label: "Fuego" },
  { id: "Warehouse", icon: Warehouse, label: "Bodega" },
  { id: "Package", icon: Package, label: "Paquete" },
  { id: "Box", icon: Box, label: "Caja" },
  { id: "Archive", icon: Archive, label: "Archivo" },
  { id: "Sparkles", icon: Sparkles, label: "Limpieza" },
  { id: "Bed", icon: Bed, label: "Cama" },
  { id: "Lamp", icon: Lamp, label: "Lámpara" },
  { id: "Brush", icon: Brush, label: "Brocha" },
  { id: "ConciergeBell", icon: ConciergeBell, label: "Recepción" },
  { id: "Tag", icon: Tag, label: "Etiqueta" },
  { id: "ShoppingBag", icon: ShoppingBag, label: "Compras" },
  { id: "Store", icon: Store, label: "Tienda" },
];

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#64748B",
];

export function CategoriaRecetaSeccion({ categorias, onUpdate }: { categorias: any[], onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("gestion_receta_categorias_open");
    return saved === "true";
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    color: PRESET_COLORS[6],
    icono: "ChefHat"
  });

  useEffect(() => {
    localStorage.setItem("gestion_receta_categorias_open", String(isOpen));
  }, [isOpen]);

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    try {
      if (editingId) {
        await api.put(`/operations/recipes/categories/${editingId}`, form);
        toast.success("Categoría actualizada");
      } else {
        await api.post("/operations/recipes/categories", form);
        toast.success("Categoría creada");
      }
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error("Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await api.delete(`/operations/recipes/categories/${id}`);
      onUpdate();
      toast.success("Categoría eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({
      nombre: cat.nombre,
      color: cat.color || PRESET_COLORS[6],
      icono: cat.icono || "ChefHat"
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ nombre: "", color: PRESET_COLORS[6], icono: "ChefHat" });
  };

  const CategoryIcon = ({ name, className }: { name?: string, className?: string }) => {
    const Icon = name && ICON_MAP[name] ? ICON_MAP[name] : ChefHat;
    return <Icon className={className} />;
  };

  return (
    <div className="w-full flex flex-col items-start gap-3 mt-4">
      {/* Botonera Principal: Toggle + Botón Añadir */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "gap-2 h-9 border-violet-500/40 text-violet-400 hover:bg-violet-500/10 transition-all",
            isOpen && "bg-violet-600 text-white border-violet-600 hover:bg-violet-700"
          )}
        >
          <ChefHat className="h-4 w-4" />
          <span className="font-medium">Categorías Recetas</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
        </Button>

        {/* Popover del Botón "+" (Cuadrado) */}
        <Popover open={isEditing} onOpenChange={(open) => !open && resetForm()}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-dashed border-violet-500/40 text-violet-400 hover:bg-violet-500/10"
              onClick={() => setIsEditing(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{editingId ? "Editar Categoría" : "Nueva Categoría"}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre</label>
                <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="h-8" autoFocus />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Palette className="h-3 w-3" /> Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={cn("h-6 w-6 rounded-full border", form.color === c ? "ring-2 ring-violet-500 ring-offset-2" : "border-transparent")} style={{ backgroundColor: c }}>
                      {form.color === c && <Check className="h-3 w-3 text-white m-auto" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Ícono</label>
                <div className="grid grid-cols-8 gap-1 border rounded-md p-1 bg-secondary/20">
                  {AVAILABLE_ICONS.map(item => (
                    <button key={item.id} onClick={() => setForm({ ...form, icono: item.id })} className={cn("p-1.5 rounded-sm hover:bg-secondary transition-colors", form.icono === item.id ? "bg-violet-600 text-white" : "text-muted-foreground")}>
                      <item.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full h-8 text-sm bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSave}>
                {editingId ? "Guardar Cambios" : "Crear Categoría"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Listado de Categorías (se despliega debajo) */}
      {isOpen && categorias.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-violet-500/5 border border-dashed border-violet-500/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {categorias.map(cat => (
            <div key={cat.id} className="group relative">
              <Badge
                variant="outline"
                style={{
                  backgroundColor: cat.color ? `${cat.color}10` : undefined,
                  color: cat.color || undefined,
                  borderColor: cat.color ? `${cat.color}30` : undefined,
                }}
                className="flex items-center gap-2 px-3 py-1 h-8 transition-all cursor-default"
              >
                <CategoryIcon name={cat.icono} className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">{cat.nombre}</span>
                <div className="flex items-center ml-1 border-l border-current/20 pl-1.5 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(cat)} className="hover:scale-110"><Pencil className="h-3 w-3" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="hover:scale-110 text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}