// src/pages/Gestion/index.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, CookingPot, Plus, Search, Settings2, ShoppingCart, Pencil, Trash2, BarChart3 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useGestion } from "./useGestion";
import { useAuth } from "../../hooks/useAuth";
import { useBodega } from "../../hooks/useBodega";
import { ViewTab, Producto, Receta } from "./types";
import { cn } from "../../lib/utils";
import { formatMoney } from "../../lib/format";
import { CategoriaSeccion } from "./CategoriaSeccion";
import { ProductoDialog } from "./ProductoDialog";
import { RecetaDialog } from "./RecetaDialog";
import BodegaSelector from "../../components/BodegaSelector";

const ALL_COLUMNS = [
  { key: "bodega", label: "Bodega" },
  { key: "stock_actual", label: "Stock" },
  { key: "stock_min", label: "Mín." },
  { key: "costo_neto", label: "Costo" },
  { key: "costo_bruto", label: "+IVA" },
  { key: "precio_venta", label: "Venta" },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]["key"];
const DEFAULT_COLUMNS = new Set<ColumnKey>(["bodega", "stock_actual", "costo_neto"]);

export default function GestionPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { selectedBodegaId } = useBodega();
  const {
    categorias,
    productos,
    recetas,
    loading,
    refresh,
    deleteReceta,
    getRecetaCosto,
  } = useGestion();

  const [viewTab, setViewTab] = useState<ViewTab>("productos");
  const [visibleCols, setVisibleCols] = useState<Set<ColumnKey>>(new Set(DEFAULT_COLUMNS));
  const [productSearch, setProductSearch] = useState("");
  const [recetaSearch, setRecetaSearch] = useState("");

  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [recetaDialogOpen, setRecetaDialogOpen] = useState(false);
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);

  const calcBrutoFromNeto = (neto: number, iva: number) => Math.round(neto * (1 + iva / 100));

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      if (selectedBodegaId !== "all") {
        const hasBodega = p.bodegas_config?.some((b) => b.bodega_id === selectedBodegaId);
        if (!hasBodega) return false;
      }
      if (productSearch) {
        const q = productSearch.toLowerCase();
        if (!p.nombre.toLowerCase().includes(q) && !p.marca?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [productos, selectedBodegaId, productSearch]);

  const groupedProductos = useMemo(() => {
    const filtered = productos.filter((p) => {
      if (selectedBodegaId !== "all") {
        const hasBodega = p.bodegas_config?.some((b) => b.bodega_id === selectedBodegaId);
        if (!hasBodega) return false;
      }
      if (productSearch) {
        const q = productSearch.toLowerCase();
        if (!p.nombre.toLowerCase().includes(q) && !p.marca?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    return categorias
      .map((c) => ({
        ...c,
        productos: filtered.filter((p) => p.categoria_id === c.id),
      }))
      .filter((c) => c.productos.length > 0);
  }, [productos, categorias, selectedBodegaId, productSearch]);

  const filteredRecetas = useMemo(() => {
    if (!recetaSearch) return recetas;
    const q = recetaSearch.toLowerCase();
    return recetas.filter((r) => r.nombre.toLowerCase().includes(q));
  }, [recetas, recetaSearch]);

  const toggleCol = (col: ColumnKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const openProdDialog = (prod?: Producto) => {
    setEditingProduct(prod ?? null);
    setProdDialogOpen(true);
  };

  const openRecetaDialog = (rec?: Receta) => {
    setEditingReceta(rec ?? null);
    setRecetaDialogOpen(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando catálogo...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-indigo-600" />
          Gestión de Catálogo
        </h1>
        <Button onClick={() => navigate("/informes")} size="sm" variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Informes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-lg bg-secondary p-1 gap-1">
          {[
            { key: "productos" as ViewTab, label: "Productos", icon: Package },
            { key: "recetas" as ViewTab, label: "Recetas", icon: CookingPot },
            { key: "compras" as ViewTab, label: "Compras", icon: ShoppingCart },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                viewTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTOS TAB */}
      {viewTab === "productos" && (
        <section className="space-y-4">
          <CategoriaSeccion categorias={categorias} onUpdate={refresh} />

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="pl-9"
              />
            </div>
            <BodegaSelector />
            <Button size="sm" onClick={() => openProdDialog()}>
              <Plus className="h-4 w-4 mr-1" /> Producto
            </Button>
          </div>

          {groupedProductos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay productos.
            </p>
          ) : (
            groupedProductos.map((cat) => (
              <div key={cat.id}>
                <h3 className="mb-2 text-sm font-semibold">{cat.nombre}</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary text-left">
                        <th className="px-3 py-2 font-semibold">Producto</th>
                        {Array.from(visibleCols).map((col) => (
                          <th key={col} className="px-3 py-2 font-semibold text-right">
                            {ALL_COLUMNS.find((c) => c.key === col)?.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 font-semibold w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.productos.map((p, i) => {
                        const iva = p.iva_porcentaje ?? 19;
                        const neto = p.costo_unitario ?? 0;
                        const bruto = calcBrutoFromNeto(neto, iva);
                        return (
                          <tr
                            key={p.id}
                            className={cn(i % 2 === 1 && "bg-secondary/50")}
                          >
                            <td className="px-3 py-2 font-medium">
                              <div className="flex items-center gap-2">
                                {p.imagen_url && (
                                  <img
                                    src={p.imagen_url}
                                    alt=""
                                    className="h-7 w-7 rounded object-cover"
                                  />
                                )}
                                <span>{p.nombre}</span>
                              </div>
                            </td>
                            {visibleCols.has("bodega") && (
                              <td className="px-3 py-2 text-right">
                                {p.bodegas_config?.length ?? 0}
                              </td>
                            )}
                            {visibleCols.has("costo_neto") && (
                              <td className="px-3 py-2 text-right">
                                {formatMoney(neto)}
                              </td>
                            )}
                            {visibleCols.has("costo_bruto") && (
                              <td className="px-3 py-2 text-right">
                                {formatMoney(bruto)}
                              </td>
                            )}
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => openProdDialog(p)}
                                className="rounded p-1 hover:bg-secondary"
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
        <section className="space-y-4">
          <div className="flex justify-center">
            <Button
              onClick={() => openRecetaDialog()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" /> Nueva Receta
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={recetaSearch}
              onChange={(e) => setRecetaSearch(e.target.value)}
              placeholder="Buscar receta..."
              className="pl-9"
            />
          </div>

          {filteredRecetas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay recetas.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-3 py-2 font-semibold">Receta</th>
                    <th className="px-3 py-2 font-semibold text-right">Costo</th>
                    <th className="px-3 py-2 font-semibold text-right">Precio</th>
                    <th className="px-3 py-2 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecetas.map((r, i) => (
                    <tr
                      key={r.id}
                      className={cn(i % 2 === 1 && "bg-secondary/50")}
                    >
                      <td className="px-3 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          {r.imagen_url && (
                            <img
                              src={r.imagen_url}
                              alt=""
                              className="h-7 w-7 rounded object-cover"
                            />
                          )}
                          <span>{r.nombre}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {formatMoney(getRecetaCosto(r))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatMoney(r.precio)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openRecetaDialog(r)}
                            className="rounded p-1 hover:bg-secondary"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => deleteReceta(r.id)}
                              className="rounded p-1 hover:bg-destructive/10"
                            >
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
        <section className="py-8 text-center text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Sección de Compras - Ver módulo de Compras</p>
        </section>
      )}

      {/* Product Dialog */}
      <ProductoDialog
        open={prodDialogOpen}
        onOpenChange={setProdDialogOpen}
        editingProduct={editingProduct}
        categorias={categorias}
        onSuccess={refresh}
      />

      {/* Receta Dialog */}
      <RecetaDialog
        open={recetaDialogOpen}
        onOpenChange={setRecetaDialogOpen}
        editingReceta={editingReceta}
        productos={productos}
        onSuccess={refresh}
      />
    </div>
  );
}