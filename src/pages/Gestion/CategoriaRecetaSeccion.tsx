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
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#64748B", // Slate
];

export function CategoriaRecetaSeccion({ categorias, onUpdate }: { categorias: any[], onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("gestion_receta_categorias_open");
    return saved === "true";
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ nombre: string, color: string, icono: string }>({
    nombre: "",
    color: PRESET_COLORS[6], // Violet default
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
        toast.success("Categoría de receta actualizada");
      } else {
        await api.post("/operations/recipes/categories", form);
        toast.success("Categoría de receta creada");
      }
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error("Error al guardar categoría");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await api.delete(`/operations/recipes/categories/${id}`);
    onUpdate();
    toast.success("Categoría eliminada");
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
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "gap-2 h-9 border-violet-500/30 text-violet-600 hover:bg-violet-500/10",
          isOpen && "bg-violet-500 text-white hover:bg-violet-600"
        )}
      >
        <ChefHat className="h-4 w-4" />
        <span className="hidden sm:inline">Categorías Recetas</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center gap-1.5">
            {categorias.map(cat => (
              <div key={cat.id} className="group relative">
                <Badge
                  variant="secondary"
                  style={{ 
                    backgroundColor: cat.color ? `${cat.color}15` : undefined,
                    color: cat.color || undefined,
                    borderColor: cat.color ? `${cat.color}40` : undefined,
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 h-7 border hover:bg-secondary transition-all cursor-default"
                >
                  <CategoryIcon name={cat.icono} className="h-3.5 w-3.5" />
                  {cat.nombre}
                  <div className="hidden group-hover:flex items-center ml-1 border-l pl-1 gap-1">
                    <button onClick={() => startEdit(cat)} className="hover:text-foreground">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </Badge>
              </div>
            ))}

            <Popover open={isEditing} onOpenChange={(open) => !open && resetForm()}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full hover:bg-violet-500/10 text-violet-500"
                  onClick={() => setIsEditing(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {editingId ? "Editar Categoría" : "Nueva Categoría"}
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Nombre</label>
                    <Input 
                      placeholder="Ej: Tragos, Platos Fondo..." 
                      value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                      <Palette className="h-3 w-3" /> Color
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm({ ...form, color: c })}
                          className={cn(
                            "h-6 w-6 rounded-full border transition-transform hover:scale-110 flex items-center justify-center",
                            form.color === c ? "ring-2 ring-primary ring-offset-1" : "border-transparent"
                          )}
                          style={{ backgroundColor: c }}
                        >
                          {form.color === c && <Check className="h-3 w-3 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Ícono</label>
                    <div className="grid grid-cols-8 gap-1 border rounded-md p-1 bg-secondary/20">
                      {AVAILABLE_ICONS.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setForm({ ...form, icono: item.id })}
                          title={item.label}
                          className={cn(
                            "p-1.5 rounded-sm hover:bg-secondary transition-colors flex items-center justify-center",
                            form.icono === item.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full h-8 text-sm bg-violet-600 hover:bg-violet-700" onClick={handleSave}>
                    {editingId ? "Guardar Cambios" : "Crear Categoría"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </>
  );
}