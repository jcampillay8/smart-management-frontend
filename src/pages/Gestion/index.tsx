// src/pages/Gestion/index.tsx
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, CookingPot, Plus, Search, Settings2, ShoppingCart, Pencil, Trash2, BarChart3, AlertTriangle } from "lucide-react";
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

const ALL_COLUMNS = [
  { key: "bodega", label: "Bodega" },
  { key: "stock_actual", label: "Stock Actual" },
  { key: "stock_min", label: "Stock Mínimo" },
  { key: "ubicacion", label: "Ubicación" },
  { key: "precio_venta", label: "Precio Venta" },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]["key"];
const DEFAULT_COLUMNS: ColumnKey[] = ["bodega", "stock_actual"];

export default function GestionPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { selectedBodegaIds, bodegas } = useBodega();
  const { selectedArea } = useAreaOperativa();
  const isAll = selectedBodegaIds.includes("all");

  const {
    categorias,
    categoriasRecetas,
    productos,
    recetas,
    loading,
    refresh,
    deleteReceta,
    getRecetaCosto,
  } = useGestion();

  const [viewTab, setViewTab] = useState<ViewTab | "mermas">("productos");
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(() => {
    const saved = localStorage.getItem("gestion_visible_columns_v2");
    if (saved) {
      try { return new Set(JSON.parse(saved)); } catch { return new Set(DEFAULT_COLUMNS); }
    }
    return new Set(DEFAULT_COLUMNS);
  });
  
  const [showCategories, setShowCategories] = useState(() => {
    const saved = localStorage.getItem("gestion_show_categories");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("gestion_visible_columns_v2", JSON.stringify(Array.from(visibleCols)));
  }, [visibleCols]);

  useEffect(() => {
    localStorage.setItem("gestion_show_categories", JSON.stringify(showCategories));
  }, [showCategories]);

  const [showRecetaCategories, setShowRecetaCategories] = useState(() => {
    const saved = localStorage.getItem("gestion_show_receta_categories");
    return saved ? JSON.parse(saved) : false;
  });

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

  // Multi-select category filter
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const toggleCategory = useCallback((id: string) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filteredGroupedProductos = useMemo(() => {
    const filtered = productos.filter(p => {
      // Bodega filter
      if (!isAll) {
        const hasBodega = p.bodegas_config?.some(b => selectedBodegaIds.includes(b.bodega_id));
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

    return categorias
      .map(c => ({ ...c, productos: filtered.filter(p => p.categoria_id === c.id) }))
      .filter(c => c.productos.length > 0);
  }, [productos, categorias, isAll, selectedBodegaIds, selectedCategoryIds, productSearch]);

  const filteredRecetas = useMemo(() => {
    let result = recetas;
    if (selectedArea) {
      result = result.filter(r => r.areas_operativas_ids?.includes(selectedArea.id));
    }
    if (!recetaSearch) return result;
    const q = recetaSearch.toLowerCase();
    return result.filter(r => r.nombre.toLowerCase().includes(q));
  }, [recetas, recetaSearch, selectedArea]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-indigo-600" />
          Gestión de Catálogo
        </h1>
        <Button onClick={() => navigate("/informes")} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analíticas e Informes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
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
                "flex items-center justify-center md:justify-start gap-2 rounded-lg px-3 md:px-4 py-2 text-[10px] font-black transition-all duration-300 uppercase tracking-widest min-h-[40px]",
                viewTab === tab.key
                  ? cn(tab.activeColor, "scale-[1.02] md:scale-105")
                  : cn("text-muted-foreground", tab.hoverColor, "hover:bg-background/80")
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTOS TAB */}
      {viewTab === "productos" && (
        <section className="space-y-4 px-2">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <AreaSelector />
            <BodegaSelector />
            
            <Button 
              variant={showCategories ? "default" : "outline"} 
              size="sm" 
              className="h-9 gap-2"
              onClick={() => setShowCategories(!showCategories)}
            >
              <span className="hidden sm:inline">Categorías</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <LayoutPanelTop className="h-4 w-4" />
                  <span className="hidden sm:inline">Columnas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {ALL_COLUMNS.map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleCols.has(col.key)}
                    onCheckedChange={() => toggleCol(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="relative flex-1 min-w-[120px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="pl-9 h-9"
              />
            </div>
            <Button size="sm" onClick={() => openProdDialog()} className="h-9">
              <Plus className="h-4 w-4 mr-1" /> <span>Producto</span>
            </Button>
          </div>

          {/* INLINE CATEGORY FILTER */}
          {showCategories && (
            <CategoriaSeccion
              categorias={categorias}
              onUpdate={refresh}
              selectedIds={selectedCategoryIds}
              onToggle={toggleCategory}
            />
          )}

          {/* PRODUCT TABLE */}
          {filteredGroupedProductos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {selectedCategoryIds.size > 0 ? "No hay productos en las categorías seleccionadas." : "No hay productos."}
            </p>
          ) : (
            filteredGroupedProductos.map(cat => (
              <div key={cat.id} className="space-y-1">
                {/* Category header with icon + color */}
                <div className="flex items-center gap-2 px-1 py-1">
                  <div
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                    style={{
                      backgroundColor: cat.color ? `${cat.color}15` : undefined,
                      color: cat.color || undefined,
                      borderColor: cat.color ? `${cat.color}35` : undefined,
                    }}
                  >
                    <span>{cat.nombre}</span>
                    <span className="opacity-50 font-normal">({cat.productos.length})</span>
                  </div>
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
                        // Only show bodegas that are in the current selection
                        const relevantBodegas = p.bodegas_config?.filter(bc =>
                          isAll ? true : selectedBodegaIds.includes(bc.bodega_id)
                        ) ?? [];

                        return (
                          <tr key={p.id} className={cn("border-t border-border/30", i % 2 === 1 && "bg-secondary/20")}>
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
                                  <td key={col} className="px-4 py-3 text-right text-[11px] text-muted-foreground">
                                    {relevantBodegas.map(bc => `${bc.coordenada_letra ?? ""}${bc.coordenada_numero ?? ""}`).filter(Boolean).join(", ") || "—"}
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
                              return null;
                            })}

                            <td className="px-4 py-3 text-right">
                              <button onClick={() => openProdDialog(p)} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
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
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <AreaSelector />
            <Button 
              variant={showRecetaCategories ? "default" : "outline"} 
              size="sm" 
              className="h-9 gap-2"
              onClick={() => setShowRecetaCategories(!showRecetaCategories)}
            >
              <span className="hidden sm:inline">Categorías</span>
            </Button>
            
            <div className="relative flex-1 min-w-[120px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recetas..."
                value={recetaSearch}
                onChange={e => setRecetaSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            <Button onClick={() => openRecetaDialog()} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 gap-2">
              <Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Receta</span>
            </Button>
          </div>

          {/* INLINE CATEGORY FILTER */}
          {showRecetaCategories && (
            <CategoriaRecetaSeccion categorias={categoriasRecetas} onUpdate={refresh} />
          )}

          {filteredRecetas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay recetas.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-left">
                    <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider">Receta</th>
                    <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Costo</th>
                    <th className="px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-right">Precio</th>
                    <th className="px-4 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRecetas.map((r, i) => (
                    <tr key={r.id} className={cn("border-t border-border/30", i % 2 === 1 && "bg-secondary/20")}>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {r.imagen_url && <img src={r.imagen_url} alt="" className="h-7 w-7 rounded-lg object-cover" />}
                          <span>{r.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatMoney(getRecetaCosto(r))}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(r.precio)}</td>
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
    </div>
  );
}
