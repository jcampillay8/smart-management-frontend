// src/pages/Gestion/index.tsx
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, CookingPot, Plus, Search, Settings2, ShoppingCart, Pencil, Trash2, BarChart3, AlertTriangle, ArrowUpDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useGestion } from "./useGestion";
import { useAuth } from "../../hooks/useAuth";
import { useBodega } from "../../hooks/useBodega";
import { ViewTab, Producto, Receta } from "./types";
import { cn } from "../../lib/utils";
import { formatMoney } from "../../lib/format";
import { CategoriaSeccion } from "./CategoriaSeccion";
import { CategoriaRecetaSeccion } from "./CategoriaRecetaSeccion";
import { ProductoDialog } from "./ProductoDialog";
import { RecetaDialog } from "./RecetaDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from "../../components/ui/dropdown-menu";
import { LayoutPanelTop } from "lucide-react";
import Compras from "../Compras";
import GestionarMerma from "../GestionarMerma";
import ProveedoresPage from "../Proveedores";
import BodegaSelector from "../../components/BodegaSelector";
import BodegaBadge from "../../components/BodegaBadge";
import { AreaSelector } from "../../components/AreaSelector";
import { useAreaOperativa } from "../../hooks/useAreaOperativa";
import { ProductoDashboard } from "./ProductoDashboard";

const ALL_COLUMNS = [
  { key: "bodega", label: "Bodega" },
  { key: "stock_actual", label: "Stock Actual" },
  { key: "stock_min", label: "Stock Mínimo" },
  { key: "ubicacion", label: "Ubicación" },
  { key: "precio_venta", label: "Precio Venta" },
  { key: "vigencia", label: "Vigencia" },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]["key"];
const DEFAULT_COLUMNS: ColumnKey[] = ["bodega", "stock_actual"];

const ALL_RECETA_COLUMNS = [
  { key: "costo", label: "Costo" },
  { key: "precio_venta", label: "Precio Venta" },
  { key: "stock_bodega", label: "Stock por Bodega" },
  { key: "consumo_dia", label: "Consumo Día" },
  { key: "consumo_semana", label: "Consumo Semanal" },
  { key: "consumo_mes", label: "Consumo Mensual" },
] as const;

type RecetaColumnKey = typeof ALL_RECETA_COLUMNS[number]["key"];
const DEFAULT_RECETA_COLUMNS: RecetaColumnKey[] = ["costo", "precio_venta", "stock_bodega"];


const SECTION_CONFIG = {
  productos: {
    title: "Gestión de Productos",
    subtitle: "Catálogo de productos e insumos",
    icon: Package,
    color: "#eab308", // yellow-500
  },
  recetas: {
    title: "Gestión de Recetas",
    subtitle: "Catálogo de recetas y preparaciones",
    icon: CookingPot,
    color: "#a855f7", // purple-500
  },
  compras: {
    title: "Gestión de Compras",
    subtitle: "Gestión de pedidos y proveedores",
    icon: ShoppingCart,
    color: "#10b981", // emerald-500
  },
  mermas: {
    title: "Gestión de Mermas",
    subtitle: "Control y análisis de pérdidas de inventario",
    icon: AlertTriangle,
    color: "#ef4444", // red-500
  },
} as const;

export default function GestionPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { selectedBodegaIds, bodegas } = useBodega();
  const { selectedArea } = useAreaOperativa();
  const isAll = Array.isArray(selectedBodegaIds) && selectedBodegaIds.includes("all");

  const {
    categorias,
    categoriasRecetas,
    productos,
    recetas,
    loading,
    refresh,
    deleteReceta,
    getRecetaCosto,
  } = useGestion(selectedArea?.id);

  const [viewTab, setViewTab] = useState<ViewTab | "mermas">("productos");
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() => {
    const saved = localStorage.getItem("gestion_visible_columns_v2");
    if (saved) {
      try { return new Set(JSON.parse(saved)); } catch { return new Set(DEFAULT_COLUMNS); }
    }
    return new Set(DEFAULT_COLUMNS);
  });

  const [showCategories, setShowCategories] = useState(true);

  useEffect(() => {
    localStorage.setItem("gestion_visible_columns_v2", JSON.stringify(Array.from(visibleCols)));
  }, [visibleCols]);

  const [visibleRecetaCols, setVisibleRecetaCols] = useState<Set<RecetaColumnKey>>(() => {
    const saved = localStorage.getItem("gestion_visible_receta_columns");
    if (saved) {
      try { return new Set(JSON.parse(saved)); } catch { return new Set(DEFAULT_RECETA_COLUMNS); }
    }
    return new Set(DEFAULT_RECETA_COLUMNS);
  });

  useEffect(() => {
    localStorage.setItem("gestion_visible_receta_columns", JSON.stringify(Array.from(visibleRecetaCols)));
  }, [visibleRecetaCols]);

  const toggleRecetaCol = (col: RecetaColumnKey) => {
    setVisibleRecetaCols(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem("gestion_show_categories", JSON.stringify(showCategories));
    if (!showCategories) {
      setSelectedCategoryIds(new Set());
    }
  }, [showCategories]);

  const [showRecetaCategories, setShowRecetaCategories] = useState(true);

  useEffect(() => {
    localStorage.setItem("gestion_show_receta_categories", JSON.stringify(showRecetaCategories));
  }, [showRecetaCategories]);

  const [productSearch, setProductSearch] = useState("");
  const [recetaSearch, setRecetaSearch] = useState("");
  const [compraSubTab, setCompraSubTab] = useState<"listado" | "proveedores">("listado");

  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [recetaDialogOpen, setRecetaDialogOpen] = useState(false);
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);
  const [dashboardProducto, setDashboardProducto] = useState<Producto | null>(null);

  // Multi-select category filter
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const toggleCategory = useCallback((id: string) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const [selectedRecetaCategoryIds, setSelectedRecetaCategoryIds] = useState<Set<string>>(new Set());
  const toggleRecetaCategory = useCallback((id: string) => {
    setSelectedRecetaCategoryIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const [productSortConfig, setProductSortConfig] = useState<{ key: "nombre" | "stock" | "precio" | "vigencia", direction: "asc" | "desc" }>({
    key: "nombre",
    direction: "asc"
  });

  const [recetaSortConfig, setRecetaSortConfig] = useState<{ key: "nombre" | "precio" | "stock", direction: "asc" | "desc" }>({
    key: "nombre",
    direction: "asc"
  });

  // --- Typewriter Animation Logic ---
  const [headerTitle, setHeaderTitle] = useState(SECTION_CONFIG[viewTab as keyof typeof SECTION_CONFIG]?.title || "Gestión");
  const [headerSubtitle, setHeaderSubtitle] = useState(SECTION_CONFIG[viewTab as keyof typeof SECTION_CONFIG]?.subtitle || "");
  const [subtitleVisible, setSubtitleVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const targetTitle = SECTION_CONFIG[viewTab as keyof typeof SECTION_CONFIG]?.title || "Gestión";
  const targetSubtitle = SECTION_CONFIG[viewTab as keyof typeof SECTION_CONFIG]?.subtitle || "";

  // Cursor blink effect
  useEffect(() => {
    const timer = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (headerTitle === targetTitle) return;

    let isCancelled = false;

    const animate = async () => {
      setIsAnimating(true);
      setSubtitleVisible(false); // Start fading out subtitle

      // Find common prefix
      let commonPrefix = "";
      for (let i = 0; i < headerTitle.length && i < targetTitle.length; i++) {
        if (headerTitle[i] === targetTitle[i]) {
          commonPrefix += headerTitle[i];
        } else {
          break;
        }
      }

      // Delete suffix
      let current = headerTitle;
      const deleteStartSpeed = 80;
      const deleteEndSpeed = 20;
      const deleteSteps = current.length - commonPrefix.length;

      for (let i = 0; i < deleteSteps; i++) {
        if (isCancelled) return;
        // Slow to fast: delay decreases as we delete
        const delay = deleteStartSpeed - (i / deleteSteps) * (deleteStartSpeed - deleteEndSpeed);
        await new Promise(r => setTimeout(r, delay));
        current = current.slice(0, -1);
        setHeaderTitle(current);
      }

      // Wait for subtitle fade out to be complete before switching text
      await new Promise(r => setTimeout(r, 200));
      setHeaderSubtitle(targetSubtitle);
      setSubtitleVisible(true); // Start fading in new subtitle

      // Type new suffix
      const newSuffix = targetTitle.substring(commonPrefix.length);
      const typeStartSpeed = 100;
      const typeEndSpeed = 10;
      const typeSteps = newSuffix.length;

      for (let i = 0; i < typeSteps; i++) {
        if (isCancelled) return;
        // Slow to fast: delay decreases as we type
        const delay = typeStartSpeed - (i / typeSteps) * (typeStartSpeed - typeEndSpeed);
        await new Promise(r => setTimeout(r, delay));
        current += newSuffix[i];
        setHeaderTitle(current);
      }
      setIsAnimating(false);
    };

    animate();
    return () => { isCancelled = true; };
  }, [targetTitle, targetSubtitle]);
  // ----------------------------------

  const filteredGroupedProductos = useMemo(() => {
    const filtered = productos.filter(p => {
      // Bodega filter
      if (!isAll) {
        const hasBodega = p.bodegas_config?.some(b => selectedBodegaIds?.includes?.(b.bodega_id));
        if (!hasBodega) return false;
      }
      // Category filter
      if (selectedCategoryIds.size > 0 && !selectedCategoryIds.has(p.categoria_id)) return false;
      // Text search
      if (productSearch) {
        const q = productSearch.toLowerCase();
        if (!p.nombre.toLowerCase().includes(q) && !p.marca?.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    const sortedFiltered = [...filtered].sort((a, b) => {
      const { key, direction } = productSortConfig;
      const multiplier = direction === "asc" ? 1 : -1;

      if (key === "nombre") return a.nombre.localeCompare(b.nombre) * multiplier;

      if (key === "stock") {
        const stockA = a.bodegas_config?.reduce((sum, bc) => sum + ((isAll || selectedBodegaIds.includes(bc.bodega_id)) ? (bc.stock_actual || 0) : 0), 0) || 0;
        const stockB = b.bodegas_config?.reduce((sum, bc) => sum + ((isAll || selectedBodegaIds.includes(bc.bodega_id)) ? (bc.stock_actual || 0) : 0), 0) || 0;
        return (stockA - stockB) * multiplier;
      }

      if (key === "precio") {
        return ((a.precio_venta || 0) - (b.precio_venta || 0)) * multiplier;
      }

      if (key === "vigencia") {
        // Sort by how soon it expires. null/no expiry = infinity (goes to bottom)
        const dateA = a.proxima_expiracion ? new Date(a.proxima_expiracion + "T00:00:00").getTime() : Infinity;
        const dateB = b.proxima_expiracion ? new Date(b.proxima_expiracion + "T00:00:00").getTime() : Infinity;
        return (dateA - dateB) * multiplier;
      }

      return 0;
    });

    const result = categorias
      .map(c => ({ ...c, productos: sortedFiltered.filter(p => p.categoria_id === c.id) }))
      .filter(c => c.productos.length > 0);

    if (!showCategories) {
      return [{
        id: "unified",
        nombre: "Todos los Productos",
        color: "#6366f1", // indigo-500
        productos: sortedFiltered
      }];
    }
    return result;
  }, [productos, categorias, isAll, selectedBodegaIds, selectedCategoryIds, productSearch, showCategories, productSortConfig]);

  const filteredRecetas = useMemo(() => {
    let result = recetas;

    // Area filter
    if (selectedArea) {
      result = result.filter(r => r.areas_operativas_ids?.includes(selectedArea.id));
    }

    // Category filter
    if (selectedRecetaCategoryIds.size > 0) {
      result = result.filter(r => selectedRecetaCategoryIds.has(r.categoria_receta_id));
    }

    // Text search
    if (recetaSearch) {
      const q = recetaSearch.toLowerCase();
      result = result.filter(r => r.nombre.toLowerCase().includes(q));
    }

    // Sorting
    const sorted = [...result].sort((a, b) => {
      const { key, direction } = recetaSortConfig;
      if (key === "nombre") {
        return direction === "asc"
          ? a.nombre.localeCompare(b.nombre)
          : b.nombre.localeCompare(a.nombre);
      }
      if (key === "precio") {
        return direction === "asc"
          ? (a.precio || 0) - (b.precio || 0)
          : (b.precio || 0) - (a.precio || 0);
      }
      if (key === "stock") {
        const stockA = a.disponibilidad_por_bodega?.reduce((acc, b) => acc + b.cantidad, 0) || 0;
        const stockB = b.disponibilidad_por_bodega?.reduce((acc, b) => acc + b.cantidad, 0) || 0;
        return (direction === "asc" ? stockA - stockB : stockB - stockA);
      }
      return 0;
    });

    const grouped = categoriasRecetas
      .map(c => ({ ...c, recetas: sorted.filter(r => r.categoria_receta_id === c.id) }))
      .filter(c => c.recetas.length > 0);

    if (!showRecetaCategories) {
      return [{
        id: "unified",
        nombre: "Todas las Recetas",
        color: "#9333ea",
        recetas: sorted
      }];
    }

    return grouped;
  }, [recetas, recetaSearch, selectedArea, selectedRecetaCategoryIds, recetaSortConfig, categoriasRecetas, showRecetaCategories]);

  const toggleCol = (col: ColumnKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const openProdDialog = (prod?: Producto) => { setEditingProduct(prod ?? null); setProdDialogOpen(true); };
  const openRecetaDialog = (rec?: Receta) => { setEditingReceta(rec ?? null); setRecetaDialogOpen(true); };

  // Build bodega lookup map
  const bodegaMap = useMemo(() => {
    const m: Record<string, typeof bodegas[0]> = {};
    bodegas.forEach(b => { m[b.id] = b; });
    return m;
  }, [bodegas]);

  const tabStyles = {
    productos: { gradient: "from-yellow-500/10", border: "border-yellow-500/20" },
    recetas: { gradient: "from-purple-500/10", border: "border-purple-500/20" },
    compras: { gradient: "from-emerald-500/10", border: "border-emerald-500/20" },
    mermas: { gradient: "from-red-500/10", border: "border-red-500/20" },
  };

  const currentStyle = tabStyles[viewTab as keyof typeof tabStyles] || { gradient: "from-transparent", border: "border-transparent" };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando Catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Dynamic Background Gradient */}
      <div className={cn(
        "absolute -top-10 -mx-10 inset-x-0 bg-gradient-to-b to-background pointer-events-none transition-colors duration-700 h-[600px]",
        currentStyle.gradient
      )} />

      <div className="relative space-y-6">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end gap-4 px-2 mb-2">
          <div className="space-y-1 shrink-0 w-full md:w-[420px] flex flex-col items-center md:items-start">
            <div className="flex items-center justify-start gap-3 transition-all duration-500 ease-in-out relative whitespace-nowrap">
              {(() => {
                const Icon = SECTION_CONFIG[viewTab as keyof typeof SECTION_CONFIG]?.icon || Package;
                const color = SECTION_CONFIG[viewTab as keyof typeof SECTION_CONFIG]?.color || "currentColor";
                return <Icon className={cn("h-7 w-7 md:h-8 md:w-8 transition-all duration-700", isAnimating && "scale-110 opacity-70")} style={{ color }} />;
              })()}

              <h1 className="text-3xl md:text-4xl font-black tracking-tighter min-h-[44px] flex items-center relative">
                {/* Phantom: Define el ancho del contenedor basado en el texto final */}
                <span className="invisible select-none pointer-events-none" aria-hidden="true">
                  {targetTitle}
                </span>
                {/* Animación real: Posicionada absoluta para no afectar el ancho mientras se escribe */}
                <span className="absolute left-0 flex items-center">
                  {headerTitle}
                  <span
                    className={cn(
                      "ml-1 inline-block w-[3px] h-[0.8em] transition-opacity duration-100",
                      showCursor ? "opacity-100" : "opacity-0"
                    )}
                    style={{ backgroundColor: SECTION_CONFIG[viewTab as keyof typeof SECTION_CONFIG]?.color }}
                  />
                </span>
              </h1>
            </div>
            <p className={cn(
              "text-muted-foreground text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
              subtitleVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
            )}>
              {headerSubtitle}
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="grid grid-cols-2 md:flex items-center rounded-xl bg-secondary/30 p-1 gap-1.5 border border-border/50 shadow-inner w-full md:w-auto">
              {[
                { key: "productos", label: "Productos", icon: Package, activeColor: "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20", hoverColor: "hover:text-yellow-500" },
                { key: "recetas", label: "Recetas", icon: CookingPot, activeColor: "bg-purple-500 text-white shadow-lg shadow-purple-500/20", hoverColor: "hover:text-purple-500" },
                { key: "compras", label: "Compras", icon: ShoppingCart, activeColor: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20", hoverColor: "hover:text-emerald-500" },
                { key: "mermas", label: "Mermas", icon: AlertTriangle, activeColor: "bg-red-500 text-white shadow-lg shadow-red-500/20", hoverColor: "hover:text-red-500" },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setViewTab(tab.key as any)}
                  className={cn(
                    "flex items-center justify-center md:justify-start gap-2 rounded-lg px-3 md:px-4 py-1.5 md:py-2 text-[10px] font-black transition-all duration-300 uppercase tracking-widest min-h-[32px] md:min-h-[40px]",
                    viewTab === tab.key
                      ? cn(tab.activeColor, "scale-[1.02] md:scale-105")
                      : cn("text-muted-foreground", tab.hoverColor, "hover:bg-background/80")
                  )}
                >
                  <tab.icon className="h-3 w-3 md:h-4 md:w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* PRODUCTOS TAB */}
        {viewTab === "productos" && (
          <section className="space-y-4 px-2">
            {/* TOOLBAR PC */}
            <div className="hidden md:flex items-center gap-4 bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl relative z-50">
              <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-xl border border-input shadow-inner">
                <AreaSelector />
                <BodegaSelector />
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl transition-all active:scale-95">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Ordenar por</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "nombre" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "nombre", direction: "asc" })}
                    >
                      Nombre A-Z
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "nombre" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "nombre", direction: "desc" })}
                    >
                      Nombre Z-A
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "stock" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "stock", direction: "asc" })}
                    >
                      Stock: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "stock" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "stock", direction: "desc" })}
                    >
                      Stock: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "precio" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "precio", direction: "asc" })}
                    >
                      Precio: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "precio" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "precio", direction: "desc" })}
                    >
                      Precio: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "vigencia" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "vigencia", direction: "asc" })}
                    >
                      Vigencia: Más próximo
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "vigencia" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "vigencia", direction: "desc" })}
                    >
                      Vigencia: Más lejano
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={showCategories ? "default" : "outline"}
                  size="sm"
                  className="h-10 gap-2 rounded-xl transition-all active:scale-95"
                  onClick={() => {
                    if (showCategories) setSelectedCategoryIds(new Set());
                    setShowCategories(!showCategories);
                  }}
                >
                  <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Categorías</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl transition-all active:scale-95">
                      <LayoutPanelTop className="h-4 w-4" />
                      <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Columnas</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {ALL_COLUMNS.map(col => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleCols.has(col.key)}
                        onCheckedChange={() => toggleCol(col.key)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative flex-1 group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-yellow-500/10 transition-colors group-focus-within:bg-yellow-500/20">
                  <Search className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <Input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="pl-10 h-10 bg-background border-input rounded-xl text-sm font-medium transition-all focus:ring-yellow-500/20 w-full"
                />
              </div>

              <Button size="sm" onClick={() => openProdDialog()} className="h-10 px-4 gap-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20 transition-all active:scale-95">
                <Plus className="h-4 w-4" />
                <span className="font-black uppercase text-[10px] tracking-widest">Producto</span>
              </Button>
            </div>

            {/* TOOLBAR MOBILE */}
            <div className="flex md:hidden flex-col gap-3 bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl relative z-50">
              <div className="flex items-center gap-1.5 bg-muted/50 p-1.5 rounded-xl border border-input shadow-inner">
                <div className="flex-1 min-w-0">
                  <AreaSelector buttonClassName="w-full min-w-0 truncate rounded-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <BodegaSelector className="w-full min-w-0 truncate rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 w-full rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-input">
                      <ArrowUpDown className="h-4 w-4" />
                      <span>Ordenar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "nombre" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "nombre", direction: "asc" })}
                    >
                      Nombre A-Z
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "nombre" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "nombre", direction: "desc" })}
                    >
                      Nombre Z-A
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "stock" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "stock", direction: "asc" })}
                    >
                      Stock: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "stock" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "stock", direction: "desc" })}
                    >
                      Stock: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "precio" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "precio", direction: "asc" })}
                    >
                      Precio: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "precio" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "precio", direction: "desc" })}
                    >
                      Precio: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "vigencia" && productSortConfig.direction === "asc"}
                      onCheckedChange={() => setProductSortConfig({ key: "vigencia", direction: "asc" })}
                    >
                      Vigencia: Más próximo
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={productSortConfig.key === "vigencia" && productSortConfig.direction === "desc"}
                      onCheckedChange={() => setProductSortConfig({ key: "vigencia", direction: "desc" })}
                    >
                      Vigencia: Más lejano
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={showCategories ? "default" : "outline"}
                  size="sm"
                  className="h-10 w-full rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-input"
                  onClick={() => {
                    if (showCategories) setSelectedCategoryIds(new Set());
                    setShowCategories(!showCategories);
                  }}
                >
                  <Settings2 className="h-4 w-4" />
                  <span>Cat.</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 w-full rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-input">
                      <LayoutPanelTop className="h-4 w-4" />
                      <span>Cols.</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {ALL_COLUMNS.map(col => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleCols.has(col.key)}
                        onCheckedChange={() => toggleCol(col.key)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" onClick={() => openProdDialog()} className="h-10 w-full rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20">
                  <Plus className="h-4 w-4" />
                  <span>Producto</span>
                </Button>
              </div>

              {/* Categories visible on mobile only if active */}
              {showCategories && (
                <CategoriaSeccion
                  categorias={categorias}
                  onUpdate={refresh}
                  selectedIds={selectedCategoryIds}
                  onToggle={toggleCategory}
                />
              )}

              {/* Search below categories on mobile */}
              <div className="relative w-full group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-yellow-500/10 transition-colors group-focus-within:bg-yellow-500/20">
                  <Search className="h-3.5 w-3.5 text-yellow-500" />
                </div>
                <Input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="pl-10 h-10 w-full rounded-xl bg-background border-input text-sm font-medium transition-all focus:ring-yellow-500/20"
                />
              </div>
            </div>

            {/* PC CATEGORY FILTER */}
            <div className="hidden md:block">
              {showCategories && (
                <CategoriaSeccion
                  categorias={categorias}
                  onUpdate={refresh}
                  selectedIds={selectedCategoryIds}
                  onToggle={toggleCategory}
                />
              )}
            </div>

            {/* PRODUCT TABLE */}
            {filteredGroupedProductos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {selectedCategoryIds.size > 0 ? "No hay productos en las categorías seleccionadas." : "No hay productos."}
              </p>
            ) : (
              filteredGroupedProductos.map(cat => (
                <div key={cat.id} className="space-y-1">
                  {/* Category header with icon + color */}
                  <div className="flex items-center gap-4 px-1 py-2">
                    <div
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20"
                      style={{ color: cat.color || "var(--primary)", borderColor: cat.color ? `${cat.color}40` : undefined }}
                    >
                      <span>{cat.nombre}</span>
                      <span className="opacity-50 font-normal tracking-normal">({cat.productos.length})</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent"></div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50 text-left">
                          <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider">Producto</th>
                          {Array.from(visibleCols).map(col => (
                            <th key={col} className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">
                              {ALL_COLUMNS.find(c => c.key === col)?.label}
                            </th>
                          ))}
                          <th className="px-4 py-2.5 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {cat.productos.map((p, i) => {
                          // Only show bodegas that are in the current area context AND in the current selection
                          const relevantBodegas = (p.bodegas_config || []).filter(bc => {
                            const b = bodegaMap?.[bc?.bodega_id];
                            if (!b) return false; // Important: Skip bodegas not in current area
                            return isAll ? true : selectedBodegaIds?.includes?.(bc.bodega_id);
                          });

                          return (
                            <tr
                              key={p.id}
                              className={cn(
                                "border-t border-border/30 cursor-pointer transition-colors hover:bg-primary/5 active:bg-primary/10",
                                i % 2 === 1 && "bg-secondary/20"
                              )}
                              onClick={() => setDashboardProducto(p)}
                            >
                              {/* Product name + image */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {p.imagen_url && (
                                    <img src={p.imagen_url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                                  )}
                                  <div>
                                    <div className="font-semibold text-sm">{p.nombre}</div>
                                    {p.marca && <div className="text-[10px] text-muted-foreground">{p.marca}</div>}
                                  </div>
                                </div>
                              </td>

                              {Array.from(visibleCols).map(col => {
                                if (col === "bodega") {
                                  return (
                                    <td key={col} className="px-4 py-3">
                                      <div className="flex flex-col gap-1.5 items-end">
                                        {relevantBodegas.length === 0 ? (
                                          <span className="text-[10px] text-muted-foreground">—</span>
                                        ) : (
                                          relevantBodegas.map(bc => {
                                            const b = bodegaMap[bc.bodega_id];
                                            if (!b) return null;
                                            return (
                                              <div key={bc.bodega_id} className="flex items-center gap-2">
                                                <BodegaBadge nombre={b.nombre} color={b.color} icono={b.icono} />
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </td>
                                  );
                                }
                                if (col === "stock_actual") {
                                  return (
                                    <td key={col} className="px-4 py-3">
                                      <div className="flex flex-col gap-1.5 items-end">
                                        {relevantBodegas.length === 0 ? (
                                          <span className="text-[10px] text-muted-foreground">—</span>
                                        ) : (
                                          relevantBodegas.map(bc => (
                                            <span key={bc.bodega_id} className="text-sm font-bold tabular-nums h-6 flex items-center">
                                              {bc.stock_actual ?? 0}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </td>
                                  );
                                }
                                if (col === "stock_min") {
                                  return (
                                    <td key={col} className="px-4 py-3">
                                      <div className="flex flex-col gap-1.5 items-end">
                                        {relevantBodegas.length === 0 ? (
                                          <span className="text-[10px] text-muted-foreground">—</span>
                                        ) : (
                                          relevantBodegas.map(bc => (
                                            <span key={bc.bodega_id} className="text-[11px] text-muted-foreground tabular-nums h-6 flex items-center">
                                              {bc.stock_minimo ?? 0}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </td>
                                  );
                                }
                                if (col === "ubicacion") {
                                  return (
                                    <td key={col} className="px-4 py-3">
                                      <div className="flex flex-col gap-1.5 items-end">
                                        {relevantBodegas.length === 0 ? (
                                          <span className="text-[10px] text-muted-foreground">—</span>
                                        ) : (
                                          relevantBodegas.map(bc => {
                                            const coord = `${bc.coordenada_letra ?? ""}${bc.coordenada_numero ?? ""}`;
                                            return (
                                              <span key={bc.bodega_id} className="text-[11px] text-muted-foreground uppercase h-6 flex items-center">
                                                {coord || "—"}
                                              </span>
                                            );
                                          })
                                        )}
                                      </div>
                                    </td>
                                  );
                                }
                                if (col === "precio_venta") {
                                  return (
                                    <td key={col} className="px-4 py-3 text-right font-semibold">
                                      {p.precio_venta ? formatMoney(p.precio_venta) : <span className="text-[10px] text-muted-foreground">—</span>}
                                    </td>
                                  );
                                }
                                if (col === "vigencia") {
                                  const getVigenciaText = (dateStr?: string | null) => {
                                    if (!dateStr) return "—";
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const target = new Date(dateStr + "T00:00:00");
                                    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

                                    if (diffDays < 0) return "Vencido";
                                    if (diffDays === 0) return "Vence hoy";
                                    if (diffDays === 1) return "Vence mañana";
                                    return `Vence en ${diffDays} días`;
                                  };
                                  const vigenciaText = getVigenciaText(p.proxima_expiracion);
                                  const isCritical = p.proxima_expiracion && (
                                    new Date(p.proxima_expiracion + "T00:00:00").getTime() < new Date().setHours(0, 0, 0, 0)
                                  );
                                  const isSoon = p.proxima_expiracion && !isCritical && (
                                    Math.ceil((new Date(p.proxima_expiracion + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 3600 * 24)) <= (p.dias_alerta_vencimiento ?? 15)
                                  );

                                  return (
                                    <td key={col} className={cn(
                                      "px-4 py-3 text-right font-bold text-[11px]",
                                      isCritical ? "text-red-500" : isSoon ? "text-orange-500" : "text-muted-foreground"
                                    )}>
                                      {vigenciaText}
                                    </td>
                                  );
                                }
                                return null;
                              })}

                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openProdDialog(p); }}
                                  className="rounded-lg p-1.5 hover:bg-secondary transition-colors"
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* RECETAS TAB */}
        {viewTab === "recetas" && (
          <section className="space-y-4 px-2">
            {/* TOOLBAR PC */}
            <div className="hidden md:flex items-center gap-4 bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl relative z-50">
              <div className="bg-muted/50 p-1.5 rounded-xl border border-input shadow-inner">
                <AreaSelector />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showRecetaCategories ? "default" : "outline"}
                  size="sm"
                  className="h-10 gap-2 rounded-xl transition-all active:scale-95"
                  onClick={() => {
                    if (showRecetaCategories) setSelectedRecetaCategoryIds(new Set());
                    setShowRecetaCategories(!showRecetaCategories);
                  }}
                >
                  <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Categorías</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl transition-all active:scale-95">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Ordenar por</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "nombre" && recetaSortConfig.direction === "asc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "nombre", direction: "asc" })}
                    >
                      Nombre A-Z
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "nombre" && recetaSortConfig.direction === "desc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "nombre", direction: "desc" })}
                    >
                      Nombre Z-A
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "precio" && recetaSortConfig.direction === "asc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "precio", direction: "asc" })}
                    >
                      Precio: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "precio" && recetaSortConfig.direction === "desc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "precio", direction: "desc" })}
                    >
                      Precio: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "stock" && recetaSortConfig.direction === "asc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "stock", direction: "asc" })}
                    >
                      Stock: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "stock" && recetaSortConfig.direction === "desc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "stock", direction: "desc" })}
                    >
                      Stock: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl transition-all active:scale-95">
                      <LayoutPanelTop className="h-4 w-4" />
                      <span className="hidden sm:inline font-bold uppercase text-[10px] tracking-widest">Columnas</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {ALL_RECETA_COLUMNS.map(col => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleRecetaCols.has(col.key)}
                        onCheckedChange={() => toggleRecetaCol(col.key)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative flex-1 group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-primary/10 transition-colors group-focus-within:bg-primary/20">
                  <Search className="h-3.5 w-3.5 text-primary" />
                </div>
                <Input
                  placeholder="Buscar recetas..."
                  value={recetaSearch}
                  onChange={e => setRecetaSearch(e.target.value)}
                  className="pl-10 h-10 bg-background border-input rounded-xl text-sm font-medium transition-all focus:ring-primary/20 w-full"
                />
              </div>

              <Button onClick={() => openRecetaDialog()} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-black h-10 px-4 gap-2 rounded-xl shadow-lg shadow-purple-500/10 transition-all active:scale-95 text-[10px] uppercase tracking-widest">
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Receta</span>
              </Button>
            </div>

            {/* TOOLBAR MOBILE */}
            <div className="flex md:hidden flex-col gap-3 bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl relative z-50">
              <div className="bg-muted/50 p-1.5 rounded-xl border border-input shadow-inner w-full">
                <AreaSelector buttonClassName="min-w-0 w-full rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 w-full rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-input">
                      <ArrowUpDown className="h-4 w-4" />
                      <span>Ordenar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "nombre" && recetaSortConfig.direction === "asc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "nombre", direction: "asc" })}
                    >
                      Nombre A-Z
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "nombre" && recetaSortConfig.direction === "desc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "nombre", direction: "desc" })}
                    >
                      Nombre Z-A
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "precio" && recetaSortConfig.direction === "asc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "precio", direction: "asc" })}
                    >
                      Precio: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "precio" && recetaSortConfig.direction === "desc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "precio", direction: "desc" })}
                    >
                      Precio: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "stock" && recetaSortConfig.direction === "asc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "stock", direction: "asc" })}
                    >
                      Stock: Menor a Mayor
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={recetaSortConfig.key === "stock" && recetaSortConfig.direction === "desc"}
                      onCheckedChange={() => setRecetaSortConfig({ key: "stock", direction: "desc" })}
                    >
                      Stock: Mayor a Menor
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant={showRecetaCategories ? "default" : "outline"}
                  size="sm"
                  className="h-10 w-full rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-input"
                  onClick={() => {
                    if (showRecetaCategories) setSelectedRecetaCategoryIds(new Set());
                    setShowRecetaCategories(!showRecetaCategories);
                  }}
                >
                  <Settings2 className="h-4 w-4" />
                  <span>Cat.</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 w-full rounded-xl gap-2 font-black uppercase text-[10px] tracking-widest border-input">
                      <LayoutPanelTop className="h-4 w-4" />
                      <span>Cols.</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {ALL_RECETA_COLUMNS.map(col => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={visibleRecetaCols.has(col.key)}
                        onCheckedChange={() => toggleRecetaCol(col.key)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={() => openRecetaDialog()} size="sm" className="bg-purple-500 hover:bg-purple-600 text-white font-black h-10 w-full rounded-xl gap-2 text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/10 transition-all active:scale-95">
                  <Plus className="h-4 w-4" /> <span>Receta</span>
                </Button>
              </div>

              {/* Categories visible on mobile only if active */}
              {showRecetaCategories && (
                <CategoriaRecetaSeccion
                  categorias={categoriasRecetas}
                  onUpdate={refresh}
                  selectedIds={selectedRecetaCategoryIds}
                  onToggle={toggleRecetaCategory}
                />
              )}

              <div className="relative w-full group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-purple-500/10 transition-colors group-focus-within:bg-purple-500/20">
                  <Search className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <Input
                  placeholder="Buscar recetas..."
                  value={recetaSearch}
                  onChange={e => setRecetaSearch(e.target.value)}
                  className="pl-10 h-11 bg-background border-input rounded-xl text-sm font-medium transition-all focus:ring-purple-500/20 w-full"
                />
              </div>
            </div>

            {/* PC CATEGORY FILTER */}
            <div className="hidden md:block">
              {showRecetaCategories && (
                <CategoriaRecetaSeccion
                  categorias={categoriasRecetas}
                  onUpdate={refresh}
                  selectedIds={selectedRecetaCategoryIds}
                  onToggle={toggleRecetaCategory}
                />
              )}
            </div>


            {filteredRecetas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay recetas.</p>
            ) : (
              filteredRecetas.map(cat => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center gap-4 px-1 py-2">
                    <div
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20"
                      style={{ color: cat.color || "var(--primary)", borderColor: cat.color ? `${cat.color}40` : undefined }}
                    >
                      <span>{cat.nombre}</span>
                      <span className="opacity-50 font-normal tracking-normal">({cat.recetas.length})</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent"></div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50 text-left">
                          <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider">Receta</th>
                          {visibleRecetaCols.has("costo") && <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Costo</th>}
                          {visibleRecetaCols.has("precio_venta") && <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Precio</th>}
                          {visibleRecetaCols.has("stock_bodega") && <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Stock por Bodega</th>}
                          {visibleRecetaCols.has("consumo_dia") && <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Cons. Día</th>}
                          {visibleRecetaCols.has("consumo_semana") && <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Cons. Sem</th>}
                          {visibleRecetaCols.has("consumo_mes") && <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Cons. Mes</th>}
                          <th className="px-4 py-2.5 w-20" />
                        </tr>
                      </thead>
                      <tbody>
                        {cat.recetas.map((r, i) => (
                          <tr key={r.id} className={cn("border-t border-border/30", i % 2 === 1 && "bg-secondary/20")}>
                            <td className="px-4 py-3 font-medium">
                              <div className="flex items-center gap-2">
                                {r.imagen_url && <img src={r.imagen_url} alt="" className="h-7 w-7 rounded-lg object-cover" />}
                                <span>{r.nombre}</span>
                              </div>
                            </td>
                            {visibleRecetaCols.has("costo") && <td className="px-4 py-3 text-right text-muted-foreground">{formatMoney(getRecetaCosto(r))}</td>}
                            {visibleRecetaCols.has("precio_venta") && <td className="px-4 py-3 text-right font-semibold">{formatMoney(r.precio)}</td>}
                            {visibleRecetaCols.has("stock_bodega") && (
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1.5 items-end">
                                  {!r.disponibilidad_por_bodega || r.disponibilidad_por_bodega.length === 0 ? (
                                    <span className="text-[10px] text-muted-foreground">—</span>
                                  ) : (
                                    r.disponibilidad_por_bodega.map(disp => {
                                      const b = bodegaMap[disp.bodega_id];
                                      return (
                                        <div key={disp.bodega_id} className="flex items-center gap-2 h-6">
                                          <span className={cn(
                                            "text-xs font-black tabular-nums",
                                            disp.cantidad <= 0 ? "text-red-500" : disp.cantidad < 5 ? "text-orange-500" : "text-emerald-500"
                                          )}>
                                            {disp.cantidad}
                                          </span>
                                          {b && <BodegaBadge nombre={b.nombre} color={b.color} icono={b.icono} />}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </td>
                            )}
                            {visibleRecetaCols.has("consumo_dia") && (
                              <td className="px-4 py-3 text-right">
                                <span className={cn("text-xs font-bold tabular-nums", (r.consumo_diario ?? 0) > 0 ? "text-primary" : "text-muted-foreground/50")}>
                                  {r.consumo_diario ?? 0}
                                </span>
                              </td>
                            )}
                            {visibleRecetaCols.has("consumo_semana") && (
                              <td className="px-4 py-3 text-right">
                                <span className={cn("text-xs font-bold tabular-nums", (r.consumo_semana ?? 0) > 0 ? "text-primary" : "text-muted-foreground/50")}>
                                  {r.consumo_semana ?? 0}
                                </span>
                              </td>
                            )}
                            {visibleRecetaCols.has("consumo_mes") && (
                              <td className="px-4 py-3 text-right">
                                <span className={cn("text-xs font-bold tabular-nums", (r.consumo_mensual ?? 0) > 0 ? "text-primary" : "text-muted-foreground/50")}>
                                  {r.consumo_mensual ?? 0}
                                </span>
                              </td>
                            )}
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => openRecetaDialog(r)} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </button>
                                {isAdmin && (
                                  <button onClick={() => deleteReceta(r.id)} className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors">
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* COMPRAS TAB */}
        {viewTab === "compras" && (
          <section className="space-y-4 px-2">
            <div className="flex justify-center border-b pb-2 mb-4">
              <div className="flex gap-4">
                {(["listado", "proveedores"] as const).map(sub => (
                  <button
                    key={sub}
                    onClick={() => setCompraSubTab(sub)}
                    className={cn(
                      "pb-1 text-sm font-semibold transition-colors border-b-2 capitalize",
                      compraSubTab === sub ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {sub === "listado" ? "Listado de Compras" : "Proveedores"}
                  </button>
                ))}
              </div>
            </div>
            {compraSubTab === "listado" ? <Compras /> : <ProveedoresPage />}
          </section>
        )}

        {/* MERMAS TAB */}
        {viewTab === "mermas" && <GestionarMerma />}

        {/* Dialogs */}
        <ProductoDialog
          open={prodDialogOpen}
          onOpenChange={setProdDialogOpen}
          editingProduct={editingProduct}
          categorias={categorias}
          onSuccess={refresh}
        />
        <RecetaDialog
          open={recetaDialogOpen}
          onOpenChange={setRecetaDialogOpen}
          editingReceta={editingReceta}
          productos={productos}
          categorias={categoriasRecetas}
          onSuccess={refresh}
        />

        {/* Product Analytics Dashboard */}
        <ProductoDashboard
          producto={dashboardProducto}
          open={!!dashboardProducto}
          onClose={() => setDashboardProducto(null)}
        />
      </div>
    </div>
  );
}