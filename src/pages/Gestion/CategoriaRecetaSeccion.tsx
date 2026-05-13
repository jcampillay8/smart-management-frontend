// src/pages/Gestion/CategoriaRecetaSeccion.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, Trash2, Pencil, X, Tag, Check,
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package, 
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, ShoppingBag, Store, 
  Beef, Fish, Carrot, Apple, Milk, Egg, Snowflake, Wheat, Soup, Leaf, Droplet, 
  Croissant, Cake, CupSoda, GlassWater, Wine, Martini, Sprout, CookingPot, 
  Candy, Pizza, Sandwich, Salad, IceCream, Cookie, Donut, Heart, Zap, 
  Drumstick, Timer, Citrus, Star, Beer, CheckCircle2, Palette,
  Shrimp, Waves, Bean
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import api from "../../lib/api";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";

const ICON_MAP: Record<string, any> = {
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package, 
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, Tag, ShoppingBag, Store,
  Beef, Fish, Carrot, Apple, Milk, Egg, 
  Snowflake, Wheat, Soup, Leaf, Droplet, Croissant, Cake, CupSoda, GlassWater, 
  Wine, Martini, Sprout, CookingPot, Candy, Pizza, Sandwich, Salad, IceCream, 
  Cookie, Donut, Heart, Zap, Drumstick, Timer, Citrus, Star, Beer, CheckCircle2,
  Shrimp, Waves, Bean
};

const CATEGORIZED_ICONS = [
  {
    group: "🍽️ Comidas principales",
    icons: [
      { id: "Beef", icon: Beef, label: "Hamburguesa" },
      { id: "Pizza", icon: Pizza, label: "Pizza" },
      { id: "Sandwich", icon: Sandwich, label: "Sandwich" },
      { id: "Salad", icon: Salad, label: "Ensalada" },
      { id: "Soup", icon: Soup, label: "Sopa" },
      { id: "Waves", icon: Waves, label: "Pasta" },
      { id: "Fish", icon: Fish, label: "Sushi" },
      { id: "Flame", icon: Flame, label: "Taco" },
    ]
  },
  {
    group: "🥩 Ingredientes principales",
    icons: [
      { id: "Beef", icon: Beef, label: "Carne" },
      { id: "Drumstick", icon: Drumstick, label: "Pollo" },
      { id: "Fish", icon: Fish, label: "Pescado" },
      { id: "Shrimp", icon: Shrimp, label: "Mariscos" },
      { id: "Egg", icon: Egg, label: "Huevo" },
      { id: "Carrot", icon: Carrot, label: "Verduras" },
      { id: "Apple", icon: Apple, label: "Frutas" },
      { id: "Croissant", icon: Croissant, label: "Pan" },
    ]
  },
  {
    group: "🍳 Métodos de preparación",
    icons: [
      { id: "Flame", icon: Flame, label: "Parrilla" },
      { id: "CookingPot", icon: CookingPot, label: "Frito" },
      { id: "ChefHat", icon: ChefHat, label: "Horneado" },
      { id: "Droplet", icon: Droplet, label: "Hervido" },
      { id: "Timer", icon: Timer, label: "Cocción lenta" },
      { id: "Zap", icon: Zap, label: "Picante" },
    ]
  },
  {
    group: "🥤 Bebidas",
    icons: [
      { id: "Coffee", icon: Coffee, label: "Café" },
      { id: "Citrus", icon: Citrus, label: "Jugo" },
      { id: "CupSoda", icon: CupSoda, label: "Bebida gaseosa" },
      { id: "Beer", icon: Beer, label: "Cerveza" },
      { id: "Wine", icon: Wine, label: "Vino" },
      { id: "Martini", icon: Martini, label: "Cóctel" },
    ]
  },
  {
    group: "🍰 Postres",
    icons: [
      { id: "Cake", icon: Cake, label: "Torta" },
      { id: "IceCream", icon: IceCream, label: "Helado" },
      { id: "Cookie", icon: Cookie, label: "Galleta" },
      { id: "Donut", icon: Donut, label: "Dona" },
      { id: "Candy", icon: Candy, label: "Chocolate" },
    ]
  },
  {
    group: "🌱 Dietas y estilos",
    icons: [
      { id: "Sprout", icon: Sprout, label: "Vegano" },
      { id: "Leaf", icon: Leaf, label: "Vegetariano" },
      { id: "Wheat", icon: Wheat, label: "Sin gluten" },
      { id: "Heart", icon: Heart, label: "Saludable" },
    ]
  },
  {
    group: "⭐ Estados y etiquetas",
    icons: [
      { id: "Heart", icon: Heart, label: "Favorito" },
      { id: "Zap", icon: Zap, label: "Más vendido" },
      { id: "Sparkles", icon: Sparkles, label: "Nuevo" },
      { id: "Star", icon: Star, label: "Premium" },
      { id: "Tag", icon: Tag, label: "General" },
    ]
  }
];

const PRESET_COLORS = [
  "#7F1D1D", "#991B1B", "#B91C1C", "#DC2626", "#EF4444",
  "#F97316", "#FB923C", "#EA580C", "#EAB308", "#FACC15",
  "#365314", "#4D7C0F", "#65A30D", "#84CC16", "#22C55E", "#16A34A", "#064E3B",
  "#0F766E", "#14B8A6", "#06B6D4", "#0891B2",
  "#0EA5E9", "#2563EB", "#1D4ED8", "#1E40AF",
  "#6366F1", "#7C3AED", "#8B5CF6", "#9333EA", "#A855F7",
  "#D946EF", "#EC4899", "#F472B6",
  "#78350F", "#92400E", "#451A03",
  "#64748B", "#475569", "#334155", "#1E293B"
];

export function CategoriaRecetaSeccion({ 
  categorias, 
  onUpdate,
  selectedIds = new Set(),
  onToggle
}: { 
  categorias: any[], 
  onUpdate: () => void,
  selectedIds?: Set<string>,
  onToggle?: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("gestion_receta_categorias_open");
    return saved === "true";
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<{ nombre: string, color: string, icono: string }>({
    nombre: "",
    color: "#8B5CF6", // Violet default
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
      setEditDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      toast.error("Error al guardar categoría");
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await api.delete(`/operations/recipes/categories/${editingId}`);
      toast.success("Categoría eliminada");
      setEditDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Error al eliminar categoría");
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({
      nombre: cat.nombre,
      color: cat.color || "#8B5CF6",
      icono: cat.icono || "ChefHat"
    });
    setConfirmDelete(false);
    setEditDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ nombre: "", color: "#8B5CF6", icono: "ChefHat" });
    setConfirmDelete(false);
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ nombre: "", color: "#8B5CF6", icono: "ChefHat" });
    setConfirmDelete(false);
  };

  const CategoryIcon = ({ name, className }: { name?: string, className?: string }) => {
    const Icon = name && ICON_MAP[name] ? ICON_MAP[name] : ChefHat;
    return <Icon className={className} />;
  };

  return (
    <>
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar md:overflow-visible text-center">
        <div className="flex justify-center md:flex-wrap items-center gap-2 py-3 px-4 min-w-max md:min-w-0 mx-auto">
          <div className="grid grid-flow-col grid-rows-2 gap-2 md:contents">
            {categorias.map(cat => (
              <motion.div 
                key={cat.id} 
                layout="position"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                  mass: 1.2,
                }}
                className="group relative"
              >
                <Badge
                  variant="secondary"
                  onClick={() => onToggle?.(cat.id)}
                  style={{ 
                    backgroundColor: selectedIds.has(cat.id)
                      ? cat.color 
                      : (cat.color ? `${cat.color}15` : undefined),
                    color: selectedIds.has(cat.id)
                      ? "white"
                      : (cat.color || undefined),
                    borderColor: cat.color ? `${cat.color}40` : undefined,
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 h-8 border transition-all cursor-pointer whitespace-nowrap",
                    selectedIds.has(cat.id) ? "shadow-md scale-105 z-10" : "hover:bg-secondary"
                  )}
                >
                  <CategoryIcon name={cat.icono} className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{cat.nombre}</span>
                  <div 
                    className="hidden group-hover:flex items-center ml-1 border-l pl-1.5 gap-1" 
                    style={{ borderColor: selectedIds.has(cat.id) ? "rgba(255,255,255,0.3)" : (cat.color ? `${cat.color}40` : undefined) }}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEdit(cat); }} 
                      className={cn("transition-colors", selectedIds.has(cat.id) ? "hover:text-white/80" : "hover:text-foreground")}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                </Badge>
              </motion.div>
            ))}
          </div>

          <button
            onClick={openNew}
            className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-violet-500 hover:text-violet-500 transition-all hover:scale-110 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest text-violet-600">
              {editingId ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="flex justify-center">
              <Badge
                style={{
                  backgroundColor: `${form.color}20`,
                  color: form.color,
                  borderColor: `${form.color}40`,
                }}
                className="flex items-center gap-2 px-4 py-2 border text-sm font-bold"
              >
                <CategoryIcon name={form.icono} className="h-4 w-4" />
                {form.nombre || "Vista previa"}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
              <Input 
                placeholder="Ej: Tragos, Platos Fondo..." 
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                className="h-9 font-bold"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Palette className="h-3 w-3" /> Color
              </Label>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                      form.color === c ? "border-foreground scale-110 shadow-lg" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {form.color === c && <Check className="h-3.5 w-3.5 text-white stroke-[4px]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ícono</Label>
              <div className="border rounded-xl p-3 bg-secondary/20 max-h-[160px] overflow-y-auto space-y-4 custom-scrollbar">
                {CATEGORIZED_ICONS.map(group => (
                  <div key={group.group} className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/70 border-b border-border/50 pb-1">
                      {group.group}
                    </p>
                    <div className="grid grid-cols-6 gap-1">
                      {group.icons.map(item => (
                        <button
                          key={`${group.group}-${item.id}-${item.label}`}
                          onClick={() => setForm({ ...form, icono: item.id })}
                          title={item.label}
                          className={cn(
                            "p-2 rounded-lg hover:bg-secondary transition-all flex items-center justify-center",
                            form.icono === item.id ? "bg-violet-500 text-white shadow-md" : "text-muted-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between items-center w-full gap-2">
            <div>
              {editingId && !confirmDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 gap-1.5"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </Button>
              )}
              {editingId && confirmDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-destructive font-bold">¿Confirmar?</span>
                  <Button variant="destructive" size="sm" className="h-7 text-[10px]" onClick={handleDelete}>
                    Sí, eliminar
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setConfirmDelete(false)}>
                    No
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSave}>
                {editingId ? "Guardar" : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}