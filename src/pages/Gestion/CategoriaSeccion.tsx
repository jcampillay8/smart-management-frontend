// src/pages/Gestion/CategoriaSeccion.tsx
import { useState } from "react";
import {
  Plus, Pencil, X, Tag,
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package,
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, ShoppingBag, Store,
  Check, Palette, Trash2,
  Beef, Drumstick, Fish, Salad, Sprout, Apple, Banana, Cherry, Citrus, Grape, 
  Leaf, Milk, Sandwich, Soup, Egg, Carrot, Wine, Beer, GlassWater, IceCream, 
  Cake, Lollipop, Wheat, Droplet, Snowflake, Pizza, Martini, Zap, Croissant
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import api from "../../lib/api";
import { toast } from "sonner";
import { Categoria } from "./types";
import { cn } from "../../lib/utils";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";

const ICON_MAP: Record<string, any> = {
  Utensils, ChefHat, Coffee, Flame, Warehouse, Package,
  Box, Archive, Sparkles, Bed, Lamp, Brush, ConciergeBell, Tag, ShoppingBag, Store,
  Beef, Drumstick, Fish, Salad, Sprout, Apple, Banana, Cherry, Citrus, Grape, 
  Leaf, Milk, Sandwich, Soup, Egg, Carrot, Wine, Beer, GlassWater, IceCream, 
  Cake, Lollipop, Wheat, Droplet, Snowflake, Pizza, Martini, Zap, Croissant
};

const CATEGORIZED_ICONS = [
  {
    group: "Alimentos principales",
    icons: [
      { id: "Beef", icon: Beef, label: "Carne" },
      { id: "Drumstick", icon: Drumstick, label: "Pollo" },
      { id: "Fish", icon: Fish, label: "Pescado" },
      { id: "Pizza", icon: Pizza, label: "Pizza" },
      { id: "Salad", icon: Salad, label: "Ensalada" },
      { id: "Soup", icon: Soup, label: "Sopa" },
      { id: "Sprout", icon: Sprout, label: "Vegano" },
      { id: "Leaf", icon: Leaf, label: "Vegetariano" },
      { id: "Zap", icon: Zap, label: "Rápida" },
    ]
  },
  {
    group: "Desayuno / Cafetería",
    icons: [
      { id: "Coffee", icon: Coffee, label: "Café" },
      { id: "Croissant", icon: Croissant, label: "Pan/Bollería" },
      { id: "Egg", icon: Egg, label: "Huevo/Desayuno" },
      { id: "Sandwich", icon: Sandwich, label: "Sandwich" },
      { id: "Cake", icon: Cake, label: "Pastelería" },
    ]
  },
  {
    group: "Bebidas",
    icons: [
      { id: "GlassWater", icon: GlassWater, label: "Agua/Gaseosa" },
      { id: "Beer", icon: Beer, label: "Cerveza" },
      { id: "Wine", icon: Wine, label: "Vino" },
      { id: "Martini", icon: Martini, label: "Cocktail" },
      { id: "Citrus", icon: Citrus, label: "Jugo" },
      { id: "Flame", icon: Flame, label: "Caliente" },
    ]
  },
  {
    group: "Postres",
    icons: [
      { id: "IceCream", icon: IceCream, label: "Helado" },
      { id: "Lollipop", icon: Lollipop, label: "Dulces" },
    ]
  },
  {
    group: "Insumos / Ingredientes",
    icons: [
      { id: "Carrot", icon: Carrot, label: "Verduras" },
      { id: "Apple", icon: Apple, label: "Frutas" },
      { id: "Milk", icon: Milk, label: "Lácteos" },
      { id: "Wheat", icon: Wheat, label: "Harina/Cereales" },
      { id: "Droplet", icon: Droplet, label: "Aceite/Líquido" },
      { id: "Snowflake", icon: Snowflake, label: "Congelados" },
    ]
  },
  {
    group: "General",
    icons: [
      { id: "Utensils", icon: Utensils, label: "Cocina" },
      { id: "ChefHat", icon: ChefHat, label: "Chef" },
      { id: "Warehouse", icon: Warehouse, label: "Bodega" },
      { id: "Package", icon: Package, label: "Paquete" },
      { id: "Box", icon: Box, label: "Caja" },
      { id: "Sparkles", icon: Sparkles, label: "Limpieza" },
      { id: "ShoppingBag", icon: ShoppingBag, label: "Compras" },
      { id: "Store", icon: Store, label: "Tienda" },
      { id: "Tag", icon: Tag, label: "Etiqueta" },
    ]
  }
];

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#64748B",
  "#06B6D4", "#84CC16", "#EAB308", "#D946EF", "#F43F5E", "#14B8A6", "#0EA5E9", "#FACC15", "#A855F7"
];

const CategoryIcon = ({ name, className }: { name?: string; className?: string }) => {
  const Icon = name && ICON_MAP[name] ? ICON_MAP[name] : Tag;
  return <Icon className={className} />;
};

interface CategoriaSeccionProps {
  categorias: Categoria[];
  onUpdate: () => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function CategoriaSeccion({ categorias, onUpdate, selectedIds, onToggle }: CategoriaSeccionProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [form, setForm] = useState<{ nombre: string; color: string; icono: string }>({
    nombre: "", color: PRESET_COLORS[3], icono: "Tag"
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openNew = () => {
    setEditingCat(null);
    setForm({ nombre: "", color: PRESET_COLORS[3], icono: "Tag" });
    setConfirmDelete(false);
    setEditDialogOpen(true);
  };

  const openEdit = (cat: Categoria) => {
    setEditingCat(cat);
    setForm({ nombre: cat.nombre, color: cat.color || PRESET_COLORS[3], icono: cat.icono || "Tag" });
    setConfirmDelete(false);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    try {
      if (editingCat) {
        await api.put(`/inventory/categories/${editingCat.id}`, form);
        toast.success("Categoría actualizada");
      } else {
        await api.post("/inventory/categories", form);
        toast.success("Categoría creada");
      }
      setEditDialogOpen(false);
      onUpdate();
    } catch {
      toast.error("Error al guardar categoría");
    }
  };

  const handleDelete = async () => {
    if (!editingCat) return;
    try {
      await api.delete(`/inventory/categories/${editingCat.id}`);
      toast.success("Categoría eliminada");
      setEditDialogOpen(false);
      onUpdate();
    } catch {
      toast.error("Error al eliminar categoría");
    }
  };

  return (
    <>
      {/* INLINE CATEGORY STRIP */}
      <div className="flex flex-wrap justify-center items-center gap-2 py-3 px-4">
        {categorias.map(cat => {
          const isSelected = selectedIds.has(cat.id);
          return (
            <div key={cat.id} className="group relative">
              <Badge
                onClick={() => onToggle(cat.id)}
                style={{
                  backgroundColor: isSelected
                    ? cat.color || "#6366F1"
                    : cat.color ? `${cat.color}18` : undefined,
                  color: isSelected ? "#fff" : cat.color || undefined,
                  borderColor: cat.color ? `${cat.color}40` : undefined,
                  boxShadow: isSelected && cat.color ? `0 0 12px ${cat.color}50` : undefined,
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 h-8 border cursor-pointer select-none transition-all duration-200",
                  isSelected ? "scale-105 font-black" : "hover:scale-105 hover:bg-secondary/50"
                )}
              >
                <CategoryIcon name={cat.icono} className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{cat.nombre}</span>
                {/* Hover: edit button slides in */}
                <div
                  className="hidden group-hover:flex items-center ml-1 border-l pl-1.5 gap-1"
                  style={{ borderColor: isSelected ? "rgba(255,255,255,0.3)" : cat.color ? `${cat.color}40` : undefined }}
                  onClick={e => { e.stopPropagation(); openEdit(cat); }}
                >
                  <Pencil className="h-3 w-3" />
                </div>
              </Badge>
            </div>
          );
        })}

        {/* ADD NEW button */}
        <button
          onClick={openNew}
          className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-all hover:scale-110"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* EDIT / CREATE DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-widest">
              {editingCat ? "Editar Categoría" : "Nueva Categoría"}
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

            {/* Nombre */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
              <Input
                placeholder="Ej: Cocina, Bebidas..."
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                className="h-9 font-bold"
                autoFocus
              />
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Palette className="h-3 w-3" /> Color
              </Label>
              <div className="flex flex-wrap gap-2">
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

            {/* Icono */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ícono</Label>
              <div className="border rounded-xl p-3 bg-secondary/20 max-h-[250px] overflow-y-auto space-y-4 custom-scrollbar">
                {CATEGORIZED_ICONS.map(group => (
                  <div key={group.group} className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/70 border-b border-border/50 pb-1">
                      {group.group}
                    </p>
                    <div className="grid grid-cols-6 gap-1">
                      {group.icons.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setForm({ ...form, icono: item.id })}
                          title={item.label}
                          className={cn(
                            "p-2 rounded-lg hover:bg-secondary transition-all flex items-center justify-center",
                            form.icono === item.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
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
            {/* DELETE — only when editing, with confirmation */}
            <div>
              {editingCat && !confirmDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 gap-1.5"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </Button>
              )}
              {editingCat && confirmDelete && (
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
              <Button size="sm" onClick={handleSave}>
                {editingCat ? "Guardar" : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}