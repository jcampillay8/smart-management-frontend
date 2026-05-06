// src/pages/Gestion/CategoriaSeccion.tsx - Fixed imports
import { useState } from "react";
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
  Zap
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
      { id: "Sandwich", icon: Sandwich, label: "Sandwich" },
      { id: "Ham", icon: Ham, label: "Cerdo" },
      { id: "ChefHat", icon: ChefHat, label: "Gourmet" },
      { id: "CookingPot", icon: CookingPot, label: "Casera" },
      { id: "Flame", icon: Flame, label: "Parrilla" },
      { id: "Zap", icon: Zap, label: "Comida rápida" },
      { id: "Leaf", icon: Leaf, label: "Vegetariano" },
      { id: "Sprout", icon: Sprout, label: "Vegano" },
      { id: "Wheat", icon: Wheat, label: "Pasta/Cereales" },
      { id: "Wheat", icon: Wheat, label: "Arroz" },
    ]
  },

  {
    group: "Desayuno / Cafetería",
    icons: [
      { id: "Coffee", icon: Coffee, label: "Café" },
      { id: "Croissant", icon: Croissant, label: "Pan/Bollería" },
      { id: "Egg", icon: Egg, label: "Huevo/Desayuno" },
      { id: "Cake", icon: Cake, label: "Pastelería" },
      { id: "Milk", icon: Milk, label: "Lácteos" },
      { id: "Cookie", icon: Cookie, label: "Galletas" },
      { id: "CupSoda", icon: CupSoda, label: "Bebidas frías" },
      { id: "Donut", icon: Donut, label: "Donas" },
      { id: "Candy", icon: Candy, label: "Snacks dulces" },
    ]
  },

  {
    group: "Bebidas",
    icons: [
      { id: "GlassWater", icon: GlassWater, label: "Agua/Gaseosa" },
      { id: "Beer", icon: Beer, label: "Cerveza" },
      { id: "Wine", icon: Wine, label: "Vino" },
      { id: "Martini", icon: Martini, label: "Cocktail" },
      { id: "Coffee", icon: Coffee, label: "Café" },
      { id: "Citrus", icon: Citrus, label: "Jugos" },
      { id: "CupSoda", icon: CupSoda, label: "Refrescos" },
      { id: "Milk", icon: Milk, label: "Batidos" },
      { id: "Flame", icon: Flame, label: "Bebidas calientes" },
      { id: "Snowflake", icon: Snowflake, label: "Bebidas frías" },
    ]
  },

  {
    group: "Postres",
    icons: [
      { id: "IceCream", icon: IceCream, label: "Helado" },
      { id: "Cake", icon: Cake, label: "Tortas" },
      { id: "Candy", icon: Candy, label: "Dulces" },
      { id: "Cookie", icon: Cookie, label: "Galletas" },
      { id: "Donut", icon: Donut, label: "Donas" },
      { id: "Lollipop", icon: Lollipop, label: "Caramelos" },
      { id: "Cherry", icon: Cherry, label: "Frutales" },
    ]
  },

  {
    group: "Ingredientes / Insumos",
    icons: [
      { id: "Carrot", icon: Carrot, label: "Verduras" },
      { id: "Apple", icon: Apple, label: "Frutas" },
      { id: "Milk", icon: Milk, label: "Lácteos" },
      { id: "Wheat", icon: Wheat, label: "Harina/Cereales" },
      { id: "Droplet", icon: Droplet, label: "Aceite/Líquidos" },
      { id: "Snowflake", icon: Snowflake, label: "Congelados" },
      { id: "Beef", icon: Beef, label: "Carnes" },
      { id: "Fish", icon: Fish, label: "Mariscos/Pescados" },
      { id: "Egg", icon: Egg, label: "Huevos" },
      { id: "Leaf", icon: Leaf, label: "Hierbas" },
      { id: "Leaf", icon: Leaf, label: "Condimentos" },
      { id: "PackageOpen", icon: PackageOpen, label: "Empaquetados" },
    ]
  },

  {
    group: "Operaciones / Inventario",
    icons: [
      { id: "Warehouse", icon: Warehouse, label: "Bodega" },
      { id: "Package", icon: Package, label: "Paquetes" },
      { id: "Box", icon: Box, label: "Cajas" },
      { id: "ClipboardList", icon: ClipboardList, label: "Control" },
      { id: "ScanBarcode", icon: ScanBarcode, label: "Código de barras" },
      { id: "Truck", icon: Truck, label: "Despachos" },
      { id: "Forklift", icon: Forklift, label: "Carga" },
      { id: "ShoppingCart", icon: ShoppingCart, label: "Pedidos" },
      { id: "ShoppingBag", icon: ShoppingBag, label: "Compras" },
      { id: "AlarmClock", icon: AlarmClock, label: "Vencimientos" },
      { id: "Timer", icon: Timer, label: "Producción" },
      { id: "Archive", icon: Archive, label: "Almacenamiento" },
    ]
  },

  {
    group: "Restaurante / Servicio",
    icons: [
      { id: "Utensils", icon: Utensils, label: "Cocina" },
      { id: "ChefHat", icon: ChefHat, label: "Chef" },
      { id: "Store", icon: Store, label: "Local" },
      { id: "BellRing", icon: BellRing, label: "Atención" },
      { id: "Users", icon: Users, label: "Clientes" },
      { id: "Receipt", icon: Receipt, label: "Boletas" },
      { id: "Wallet", icon: Wallet, label: "Caja" },
      { id: "CreditCard", icon: CreditCard, label: "Pagos" },
      { id: "BadgeDollarSign", icon: BadgeDollarSign, label: "Ventas" },
      { id: "Table2", icon: Table2, label: "Mesas" },
      { id: "Phone", icon: Phone, label: "Pedidos telefónicos" },
      { id: "Bike", icon: Bike, label: "Delivery" },
    ]
  },

  {
    group: "General",
    icons: [
      { id: "Tag", icon: Tag, label: "Etiqueta" },
      { id: "Star", icon: Star, label: "Destacado" },
      { id: "Heart", icon: Heart, label: "Favorito" },
      { id: "Sparkles", icon: Sparkles, label: "Premium" },
      { id: "ShieldCheck", icon: ShieldCheck, label: "Seguro" },
      { id: "BadgeCheck", icon: BadgeCheck, label: "Verificado" },
      { id: "AlertCircle", icon: AlertCircle, label: "Advertencia" },
      { id: "AlertTriangle", icon: AlertTriangle, label: "Crítico" },
      { id: "CheckCircle2", icon: CheckCircle2, label: "Correcto" },
      { id: "Clock", icon: Clock, label: "Pendiente" },
      { id: "Calendar", icon: Calendar, label: "Calendario" },
      { id: "Folder", icon: Folder, label: "Categoría" },
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
                </div>
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