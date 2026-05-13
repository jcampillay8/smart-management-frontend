// src/pages/Gestion/CategoriaSeccion.tsx - Fixed imports
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlarmClock,
  Archive,
  Apple,
  BadgeCheck,
  BadgeDollarSign,
  Banana,
  Bed,
  Beef,
  Beer,
  BellRing,
  Bike,
  Box,
  Brush,
  Cake,
  Calendar,
  Candy,
  Carrot,
  Check,
  CheckCircle2,
  ChefHat,
  Cherry,
  AlertCircle,
  ClipboardList,
  Clock,
  Coffee,
  ConciergeBell,
  Cookie,
  CookingPot,
  CreditCard,
  Croissant,
  CupSoda,
  Citrus,
  Donut,
  Droplet,
  Drumstick,
  Egg,
  Fish,
  Flame,
  Folder,
  Forklift,
  GlassWater,
  Grape,
  Ham,
  Heart,
  IceCream,
  Lamp,
  Leaf,
  Lollipop,
  Martini,
  Milk,
  Package,
  PackageOpen,
  Palette,
  Pencil,
  Phone,
  Pizza,
  Plus,
  Receipt,
  Salad,
  Sandwich,
  ScanBarcode,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  Soup,
  Sparkles,
  Sprout,
  Star,
  Store,
  Table2,
  Tag,
  Timer,
  Trash2,
  AlertTriangle,
  Truck,
  Users,
  Utensils,
  Wallet,
  Warehouse,
  Wheat,
  Wine,
  Zap,
  Shrimp,
  Container,
  Waves,
  Bean,
  Cylinder
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
  Cake, Lollipop, Wheat, Droplet, Snowflake, Pizza, Martini, Zap, Croissant,
  Shrimp, Container, Cookie, Waves, Bean, Cylinder
};

const CATEGORIZED_ICONS = [
  {
    group: "🍽️ Alimentos",
    icons: [
      { id: "ShoppingBag", icon: ShoppingBag, label: "Abarrotes" },
      { id: "Beef", icon: Beef, label: "Carnes" },
      { id: "Fish", icon: Fish, label: "Pescados" },
      { id: "Shrimp", icon: Shrimp, label: "Mariscos" },
      { id: "Carrot", icon: Carrot, label: "Verduras" },
      { id: "Apple", icon: Apple, label: "Frutas" },
      { id: "Milk", icon: Milk, label: "Lácteos" },
      { id: "Pizza", icon: Pizza, label: "Quesos" },
      { id: "Egg", icon: Egg, label: "Huevos" },
      { id: "Snowflake", icon: Snowflake, label: "Congelados" },
      { id: "Container", icon: Container, label: "Enlatados" },
      { id: "Wheat", icon: Wheat, label: "Cereales y granos" },
      { id: "Waves", icon: Waves, label: "Pastas y fideos" },
      { id: "Cookie", icon: Cookie, label: "Harinas y mezclas" },
      { id: "Cylinder", icon: Cylinder, label: "Condimentos y especias" },
      { id: "Droplet", icon: Droplet, label: "Aceites y grasas" },
      { id: "Soup", icon: Soup, label: "Salsas y bases" },
      { id: "Archive", icon: Archive, label: "Conservas y encurtidos" },
      { id: "Croissant", icon: Croissant, label: "Panadería" },
      { id: "Cake", icon: Cake, label: "Repostería y pastelería" },
    ]
  },

  {
    group: "🥤 Bebidas",
    icons: [
      { id: "CupSoda", icon: CupSoda, label: "Bebidas" },
      { id: "GlassWater", icon: GlassWater, label: "Aguas y hielo" },
      { id: "Coffee", icon: Coffee, label: "Bebidas calientes" },
      { id: "Wine", icon: Wine, label: "Alcoholes y licores" },
      { id: "Martini", icon: Martini, label: "Insumos de bar" },
      { id: "Bean", icon: Bean, label: "Insumos de cafetería" },
    ]
  },

  {
    group: "🧼 Operación y limpieza",
    icons: [
      { id: "Sparkles", icon: Sparkles, label: "Limpieza y aseo" },
      { id: "Trash2", icon: Trash2, label: "Desechables" },
      { id: "Package", icon: Package, label: "Material de empaque" },
      { id: "Utensils", icon: Utensils, label: "Utensilios y menaje" },
      { id: "ChefHat", icon: ChefHat, label: "Insumos de cocina" },
    ]
  },

  {
    group: "🌱 Especiales",
    icons: [
      { id: "Sprout", icon: Sprout, label: "Productos veganos" },
      { id: "Leaf", icon: Leaf, label: "Productos vegetarianos" },
      { id: "CookingPot", icon: CookingPot, label: "Alimentos preparados" },
      { id: "Candy", icon: Candy, label: "Aperitivos y snacks" },
    ]
  },

  {
    group: "General / UI",
    icons: [
      { id: "Warehouse", icon: Warehouse, label: "Bodega" },
      { id: "Box", icon: Box, label: "Cajas" },
      { id: "ClipboardList", icon: ClipboardList, label: "Control" },
      { id: "Truck", icon: Truck, label: "Logística" },
      { id: "ShoppingCart", icon: ShoppingCart, label: "Ventas" },
      { id: "Tag", icon: Tag, label: "Etiqueta" },
      { id: "Star", icon: Star, label: "Favorito" },
      { id: "Clock", icon: Clock, label: "Historial" },
    ]
  }
];

const PRESET_COLORS = [
  // Rojos
  "#7F1D1D",
  "#991B1B",
  "#B91C1C",
  "#DC2626",
  "#EF4444",

  // Naranjas / Amarillos
  "#F97316",
  "#FB923C",
  "#EA580C",
  "#EAB308",
  "#FACC15",

  // Verdes
  "#365314",
  "#4D7C0F",
  "#65A30D",
  "#84CC16",
  "#22C55E",
  "#16A34A",
  "#064E3B",

  // Turquesas / Cyan
  "#0F766E",
  "#14B8A6",
  "#06B6D4",
  "#0891B2",

  // Azules
  "#0EA5E9",
  "#2563EB",
  "#1D4ED8",
  "#1E40AF",

  // Morados
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#9333EA",
  "#A855F7",

  // Rosas
  "#D946EF",
  "#EC4899",
  "#F472B6",

  // Cafés
  "#78350F",
  "#92400E",
  "#451A03",

  // Grises
  "#64748B",
  "#475569",
  "#334155",
  "#1E293B",

  // Extras útiles para UI moderna
  "#111827",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB"
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
      {/* INLINE CATEGORY STRIP - Mobile: 2 rows horizontal scroll, Desktop: flex-wrap center */}
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar md:overflow-visible text-center">
        <div className="flex justify-center md:flex-wrap items-center gap-2 py-3 px-4 min-w-max md:min-w-0 mx-auto">
          <div className="grid grid-flow-col grid-rows-2 gap-2 md:contents">
            {categorias.map(cat => {
              const isSelected = selectedIds.has(cat.id);
              return (
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
                      "flex items-center gap-1.5 px-3 py-1.5 h-8 border cursor-pointer select-none transition-all duration-200 whitespace-nowrap",
                      isSelected ? "scale-105 font-black" : "hover:scale-105 hover:bg-secondary/50"
                    )}
                  >
                    <CategoryIcon name={cat.icono} className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{cat.nombre}</span>
                    <div
                      className="hidden group-hover:flex items-center ml-1 border-l pl-1.5 gap-1"
                      style={{ borderColor: isSelected ? "rgba(255,255,255,0.3)" : cat.color ? `${cat.color}40` : undefined }}
                      onClick={e => { e.stopPropagation(); openEdit(cat); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </div>
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          {/* ADD NEW button */}
          <button
            onClick={openNew}
            className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-all hover:scale-110 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
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

            {/* Icono */}
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