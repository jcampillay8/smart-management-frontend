import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBodega } from "../hooks/useBodega";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { Plus, Pencil, Trash2, Search, CookingPot } from "lucide-react";
import { formatMoney } from "../lib/format";
import BodegaBadge from "../components/BodegaBadge";

interface Categoria { id: string; nombre: string }
interface Producto { 
  id: string; 
  nombre: string; 
  categoria_id: string; 
  unidad: string; 
  costo_unitario: number; 
  iva_incluido?: boolean; 
  iva_porcentaje?: number;
  bodegas_config: { bodega_id: string; stock_minimo: number }[];
}
interface Receta {
  id: string; 
  nombre: string; 
  precio: number; 
  iva_incluido?: boolean; 
  iva_porcentaje?: number;
  ingredientes: { id: string; producto_id: string; bodega_id: string; cantidad: number }[];
}

export default function Gestion() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { bodegas } = useBodega();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingReceta, setSavingReceta] = useState(false);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<string | null>(null);
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);

  const [catNombre, setCatNombre] = useState("");
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);

  const [prodDialog, setProdDialog] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  const [prodNombre, setProdNombre] = useState("");
  const [prodCategoria, setProdCategoria] = useState("");
  const [prodUnidad, setProdUnidad] = useState("unidad");
  const [prodMinimoPrincipal, setProdMinimoPrincipal] = useState("0");
  const [prodMinimoTransito, setProdMinimoTransito] = useState("0");
  const [prodCosto, setProdCosto] = useState("0");
  const [prodBodegaPrincipal, setProdBodegaPrincipal] = useState(false);
  const [prodBodegaTransito, setProdBodegaTransito] = useState(false);
  const [prodIvaIncluido, setProdIvaIncluido] = useState(false);
  const [prodIvaPorcentaje, setProdIvaPorcentaje] = useState("19");

  // Receta state
  const [recetaDialog, setRecetaDialog] = useState(false);
  const [editingReceta, setEditingReceta] = useState<Receta | null>(null);
  const [recetaNombre, setRecetaNombre] = useState("");
  const [recetaPrecio, setRecetaPrecio] = useState("0");
  const [recetaIvaIncluido, setRecetaIvaIncluido] = useState(false);
  const [recetaIvaPorcentaje, setRecetaIvaPorcentaje] = useState("19");
  const [recetaIngredientes, setRecetaIngredientes] = useState<{ producto_id: string; bodega_id: string; cantidad: string }[]>([]);
  const [recetaSearch, setRecetaSearch] = useState<Record<string, string>>({});
  const [recetaSearchFocus, setRecetaSearchFocus] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [catRes, prodRes, recetasRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/products"),
        api.get("/operations/recipes/"),
      ]);
      setCategorias(catRes.data);
      setProductos(prodRes.data);
      setRecetas(recetasRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
      console.error(error);
    }
  };

  if (!authLoading && !isAdmin) return <Navigate to="/" replace />;

  const handleAddCategory = async () => {
    if (!catNombre.trim()) { toast.error("Ingresa un nombre para la categoría"); return; }
    try {
      if (editingCat) {
        await api.put(`/inventory/categories/${editingCat.id}`, { nombre: catNombre.trim() });
        setEditingCat(null);
      } else {
        await api.post("/inventory/categories", { nombre: catNombre.trim() });
      }
      setCatNombre("");
      loadData();
      toast.success("Categoría guardada");
    } catch (error) {
      toast.error("Error al guardar categoría");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.delete(`/inventory/categories/${id}`);
      toast.success("Categoría eliminada");
      loadData();
    } catch (error) {
      toast.error("Error al eliminar categoría");
    }
  };

  const principalBodega = bodegas.find(b => b.nombre === "Bodega Principal");
  const transitoBodega = bodegas.find(b => b.nombre === "Bodega Tránsito");

  const getPerBodegaMinimo = (prod: Producto, bodegaId: string) => {
    const pb = prod.bodegas_config?.find(x => x.bodega_id === bodegaId);
    return pb?.stock_minimo ?? 0;
  };

  const openProdDialog = (prod?: Producto) => {
    if (prod) {
      setEditingProd(prod);
      setProdNombre(prod.nombre);
      setProdCategoria(prod.categoria_id);
      setProdUnidad(prod.unidad);
      setProdCosto(String(prod.costo_unitario));
      setProdIvaIncluido(prod.iva_incluido ?? false);
      setProdIvaPorcentaje(String(prod.iva_porcentaje ?? 19));
      
      setProdMinimoPrincipal(String(principalBodega ? getPerBodegaMinimo(prod, principalBodega.id) : 0));
      setProdMinimoTransito(String(transitoBodega ? getPerBodegaMinimo(prod, transitoBodega.id) : 0));
      
      setProdBodegaPrincipal(!!prod.bodegas_config?.some(bc => bc.bodega_id === principalBodega?.id));
      setProdBodegaTransito(!!prod.bodegas_config?.some(bc => bc.bodega_id === transitoBodega?.id));
    } else {
      setEditingProd(null);
      setProdNombre("");
      setProdCategoria(categorias[0]?.id ?? "");
      setProdUnidad("unidad");
      setProdMinimoPrincipal("0");
      setProdMinimoTransito("0");
      setProdCosto("0");
      setProdBodegaPrincipal(false);
      setProdBodegaTransito(true);
      setProdIvaIncluido(false);
      setProdIvaPorcentaje("19");
    }
    setConfirmDeleteProdId(null);
    setProdDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!prodNombre.trim() || !prodCategoria) return;
    if (!prodBodegaPrincipal && !prodBodegaTransito) { toast.error("Selecciona al menos una bodega"); return; }

    setSavingProduct(true);
    
    const bodegas_config = [];
    if (prodBodegaTransito && transitoBodega) {
      bodegas_config.push({ bodega_id: transitoBodega.id, stock_minimo: Number(prodMinimoTransito) });
    }
    if (prodBodegaPrincipal && principalBodega) {
      bodegas_config.push({ bodega_id: principalBodega.id, stock_minimo: Number(prodMinimoPrincipal) });
    }

    const payload = {
      nombre: prodNombre.trim(),
      categoria_id: prodCategoria,
      unidad: prodUnidad,
      costo_unitario: Number(prodCosto),
      iva_incluido: prodIvaIncluido,
      iva_porcentaje: Number(prodIvaPorcentaje),
      bodegas_config
    };

    try {
      if (editingProd) {
        await api.put(`/inventory/products/${editingProd.id}`, payload);
      } else {
        await api.post("/inventory/products", payload);
      }
      setProdDialog(false);
      toast.success(editingProd ? "Producto actualizado" : "Producto creado");
      loadData();
    } catch (error) {
      toast.error("Error al guardar producto");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.delete(`/inventory/products/${id}`);
      toast.success("Producto eliminado");
      loadData();
    } catch (error) {
      toast.error("Error al eliminar producto");
    }
  };

  const openRecetaDialog = (receta?: Receta) => {
    if (receta) {
      setEditingReceta(receta);
      setRecetaNombre(receta.nombre);
      setRecetaPrecio(String(receta.precio));
      setRecetaIvaIncluido(receta.iva_incluido ?? false);
      setRecetaIvaPorcentaje(String(receta.iva_porcentaje ?? 19));
      setRecetaIngredientes(receta.ingredientes.map(i => ({
        producto_id: i.producto_id, bodega_id: i.bodega_id, cantidad: String(i.cantidad),
      })));
    } else {
      setEditingReceta(null);
      setRecetaNombre("");
      setRecetaPrecio("0");
      setRecetaIvaIncluido(false);
      setRecetaIvaPorcentaje("19");
      setRecetaIngredientes([]);
    }
    setRecetaSearch({});
    setRecetaSearchFocus(null);
    setRecetaDialog(true);
  };

  const handleSaveReceta = async () => {
    if (!recetaNombre.trim()) { toast.error("Ingresa un nombre"); return; }
    const validIngredientes = recetaIngredientes.filter(i => i.producto_id && i.bodega_id && Number(i.cantidad) > 0);
    if (validIngredientes.length === 0) { toast.error("Agrega al menos un ingrediente"); return; }
    
    setSavingReceta(true);
    const payload = {
      nombre: recetaNombre.trim(),
      precio: Number(recetaPrecio),
      iva_incluido: recetaIvaIncluido,
      iva_porcentaje: Number(recetaIvaPorcentaje),
      ingredientes: validIngredientes.map(i => ({
        producto_id: i.producto_id,
        bodega_id: i.bodega_id,
        cantidad: Number(i.cantidad)
      }))
    };

    try {
      if (editingReceta) {
        await api.put(`/operations/recipes/${editingReceta.id}`, payload);
      } else {
        await api.post("/operations/recipes/", payload);
      }
      setRecetaDialog(false);
      toast.success("Receta guardada");
      loadData();
    } catch (error) {
      toast.error("Error al guardar receta");
    } finally {
      setSavingReceta(false);
    }
  };

  const handleDeleteReceta = async (id: string) => {
    try {
      await api.delete(`/operations/recipes/${id}`);
      toast.success("Receta eliminada");
      loadData();
    } catch (error) {
      toast.error("Error al eliminar receta");
    }
  };

  const addIngredientFromBodega = (bodegaId: string, productoId: string) => {
    const already = recetaIngredientes.find(i => i.producto_id === productoId && i.bodega_id === bodegaId);
    if (already) { toast.error("Este producto ya está agregado desde esta bodega"); return; }
    setRecetaIngredientes(prev => [...prev, { producto_id: productoId, bodega_id: bodegaId, cantidad: "1" }]);
    setRecetaSearch({});
    setRecetaSearchFocus(null);
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const groupedProducts = categorias
    .filter(c => selectedCategories.size === 0 || selectedCategories.has(c.id))
    .map((c) => ({ ...c, productos: productos.filter((p) => p.categoria_id === c.id) }))
    .filter((c) => c.productos.length > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Gestión de Inventario</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categorías</h2>
        <div className="flex gap-2">
          <Input placeholder="Nombre de categoría" value={catNombre} onChange={(e) => setCatNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} className="max-w-xs" />
          <Button onClick={handleAddCategory} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> {editingCat ? "Actualizar" : "Agregar"}
          </Button>
          {editingCat && (
            <Button variant="ghost" size="sm" onClick={() => { setEditingCat(null); setCatNombre(""); }}>Cancelar</Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => {
            const isSelected = selectedCategories.has(c.id);
            return (
              <div key={c.id} className={cn(
                "flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors",
                isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary hover:bg-secondary/80"
              )}>
                <span onClick={() => toggleCategory(c.id)}>{c.nombre}</span>
                <button onClick={() => { setEditingCat(c); setCatNombre(c.nombre); }} className="ml-1 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
        {editingCat && (
          <div className="flex gap-2 items-center">
            <Button variant="ghost" size="sm" onClick={() => { setEditingCat(null); setCatNombre(""); }}>Cancelar</Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(editingCat.id)}>
              <Trash2 className="h-3 w-3 mr-1" /> Eliminar
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Productos</h2>
          <div className="flex gap-2">
            <Dialog open={prodDialog} onOpenChange={setProdDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1" onClick={() => openProdDialog()}>
                  <Plus className="h-4 w-4" /> Nuevo producto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProd ? "Editar producto" : "Nuevo producto"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label>Nombre</Label>
                    <Input value={prodNombre} onChange={(e) => setProdNombre(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Categoría</Label>
                    <Select value={prodCategoria} onValueChange={setProdCategoria}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Bodegas</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Checkbox id="bodega-transito" checked={prodBodegaTransito}
                          onCheckedChange={(checked) => setProdBodegaTransito(!!checked)} />
                        <label htmlFor="bodega-transito" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                          <BodegaBadge nombre="Bodega Tránsito" />
                        </label>
                        {prodBodegaTransito && (
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-xs text-muted-foreground">Mín:</span>
                            <Input type="number" min="0" value={prodMinimoTransito} onChange={(e) => setProdMinimoTransito(e.target.value)} className="h-8 w-20 text-right text-sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox id="bodega-principal" checked={prodBodegaPrincipal}
                          onCheckedChange={(checked) => setProdBodegaPrincipal(!!checked)} />
                        <label htmlFor="bodega-principal" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                          <BodegaBadge nombre="Bodega Principal" />
                        </label>
                        {prodBodegaPrincipal && (
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-xs text-muted-foreground">Mín:</span>
                            <Input type="number" min="0" value={prodMinimoPrincipal} onChange={(e) => setProdMinimoPrincipal(e.target.value)} className="h-8 w-20 text-right text-sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Unidad</Label>
                      <Select value={prodUnidad} onValueChange={setProdUnidad}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["unidad", "kg", "g", "L", "mL", "docena"].map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Costo unitario ($)</Label>
                      <Input type="number" min="0" step="any" value={prodCosto} onChange={(e) => setProdCosto(e.target.value)}
                        onFocus={(e) => e.target.select()} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border rounded-md p-3">
                    <Checkbox id="prod-iva" checked={prodIvaIncluido}
                      onCheckedChange={(checked) => setProdIvaIncluido(!!checked)} />
                    <label htmlFor="prod-iva" className="text-sm cursor-pointer flex-1">¿Precio incluye IVA?</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">IVA:</span>
                      <Input type="number" min="0" max="100" value={prodIvaPorcentaje}
                        onChange={(e) => setProdIvaPorcentaje(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="h-7 w-16 text-right text-xs" />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  {editingProd && (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProduct} className="flex-1" disabled={savingProduct}>
                        {savingProduct ? "Guardando..." : "Guardar cambios"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteProdId(editingProd.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {!editingProd && (
                    <Button onClick={handleSaveProduct} className="w-full" disabled={savingProduct}>
                      {savingProduct ? "Creando..." : "Crear producto"}
                    </Button>
                  )}
                  {confirmDeleteProdId && (
                    <div className="border border-destructive/50 rounded-md p-3 space-y-2">
                      <p className="text-sm text-destructive font-medium">¿Eliminar este producto permanentemente?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setConfirmDeleteProdId(null)}>Cancelar</Button>
                        <Button variant="destructive" size="sm" onClick={() => { handleDeleteProduct(confirmDeleteProdId); setProdDialog(false); }}>
                          Confirmar eliminación
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => openRecetaDialog()}>
              <CookingPot className="h-4 w-4" /> Nueva Receta
            </Button>
          </div>
        </div>

        {groupedProducts.map((cat) => (
          <div key={cat.id}>
            <h3 className="mb-1 text-sm font-semibold">{cat.nombre}</h3>
            <div className="overflow-x-auto rounded-lg border mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary text-left">
                    <th className="px-3 py-2 font-semibold">Producto</th>
                    <th className="px-3 py-2 font-semibold">Bodega</th>
                    <th className="px-3 py-2 font-semibold text-right">Stock mín.</th>
                    <th className="px-3 py-2 font-semibold text-right">Costo unit.</th>
                    <th className="px-3 py-2 font-semibold text-right w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cat.productos.map((p, i) => {
                    const hasTransito = p.bodegas_config?.some(bc => bc.bodega_id === transitoBodega?.id);
                    const hasPrincipal = p.bodegas_config?.some(bc => bc.bodega_id === principalBodega?.id);
                    const minimoT = getPerBodegaMinimo(p, transitoBodega?.id ?? "");
                    const minimoP = getPerBodegaMinimo(p, principalBodega?.id ?? "");

                    return (
                      <tr key={p.id} className={i % 2 === 1 ? "bg-secondary/50" : ""}>
                        <td className="px-3 py-2 font-medium">{p.nombre}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-0.5">
                            {hasTransito && <BodegaBadge nombre="Bodega Tránsito" />}
                            {hasPrincipal && <BodegaBadge nombre="Bodega Principal" />}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="space-y-0.5 text-xs">
                            {hasTransito && (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-emerald-600 font-medium">T:</span>
                                <span className="font-bold">{minimoT} {p.unidad}</span>
                              </div>
                            )}
                            {hasPrincipal && (
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-indigo-600 font-medium">P:</span>
                                <span className="font-bold">{minimoP} {p.unidad}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">{formatMoney(p.costo_unitario)}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => openProdDialog(p)} className="rounded p-1 hover:bg-secondary">
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
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recetas</h2>
        {recetas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay recetas creadas.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="px-3 py-2 font-semibold">Receta</th>
                  <th className="px-3 py-2 font-semibold text-right">Precio</th>
                  <th className="px-3 py-2 font-semibold text-right">Ingredientes</th>
                  <th className="px-3 py-2 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recetas.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 1 ? "bg-secondary/50" : ""}>
                    <td className="px-3 py-2 font-medium">{r.nombre}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(r.precio)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{r.ingredientes?.length ?? 0}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => openRecetaDialog(r)} className="rounded p-1 hover:bg-secondary">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={recetaDialog} onOpenChange={setRecetaDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CookingPot className="h-5 w-5 text-indigo-500" />
              {editingReceta ? "Editar receta" : "Nueva receta"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={recetaNombre} onChange={(e) => setRecetaNombre(e.target.value)} placeholder="Ej: Hamburguesa clásica" />
              </div>
              <div className="space-y-1">
                <Label>Precio de venta ($)</Label>
                <Input type="number" min="0" step="any" value={recetaPrecio} onChange={(e) => setRecetaPrecio(e.target.value)}
                  onFocus={(e) => e.target.select()} />
              </div>
            </div>
            <div className="flex items-center gap-3 border rounded-md p-3">
              <Checkbox id="receta-iva" checked={recetaIvaIncluido}
                onCheckedChange={(checked) => setRecetaIvaIncluido(!!checked)} />
              <label htmlFor="receta-iva" className="text-sm cursor-pointer flex-1">¿Precio incluye IVA?</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">IVA:</span>
                <Input type="number" min="0" max="100" value={recetaIvaPorcentaje}
                  onChange={(e) => setRecetaIvaPorcentaje(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="h-7 w-16 text-right text-xs" />
                <span className="text-xs">%</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Ingredientes</Label>
              {bodegas.map(bodega => {
                const searchKey = bodega.id;
                const searchVal = recetaSearch[searchKey] ?? "";
                const isFocused = recetaSearchFocus === searchKey;
                const prodsInBodega = productos.filter(p =>
                  p.bodegas_config?.some(bc => bc.bodega_id === bodega.id) &&
                  (!searchVal || p.nombre.toLowerCase().includes(searchVal.toLowerCase()))
                );

                return (
                  <div key={bodega.id} className="space-y-2">
                    <BodegaBadge nombre={bodega.nombre} />
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Buscar producto..." value={searchVal}
                        onChange={(e) => setRecetaSearch(prev => ({ ...prev, [searchKey]: e.target.value }))}
                        onFocus={() => setRecetaSearchFocus(searchKey)}
                        onBlur={() => setTimeout(() => setRecetaSearchFocus(null), 200)}
                        className="pl-8 h-8 text-sm" />
                      {isFocused && prodsInBodega.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
                          {prodsInBodega.map(p => (
                            <button key={p.id} className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent"
                              onMouseDown={() => addIngredientFromBodega(bodega.id, p.id)}>
                              {p.nombre} <span className="text-muted-foreground">({p.unidad})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {recetaIngredientes.filter(i => i.bodega_id === bodega.id).map((ing) => {
                      const globalIdx = recetaIngredientes.indexOf(ing);
                      const prod = productos.find(p => p.id === ing.producto_id);
                      return (
                        <div key={globalIdx} className="flex items-center gap-2 pl-2">
                          <span className="text-sm flex-1 truncate">{prod?.nombre ?? "?"}</span>
                          <Input type="number" min="0" step="any" value={ing.cantidad}
                            onChange={(e) => setRecetaIngredientes(prev => prev.map((item, i) => i === globalIdx ? { ...item, cantidad: e.target.value } : item))}
                            className="h-8 w-20 text-right text-sm" placeholder="Cant." />
                          <span className="text-xs text-muted-foreground w-10">{prod?.unidad ?? ""}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRecetaIngredientes(prev => prev.filter((_, i) => i !== globalIdx))}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {recetaIngredientes.length > 0 && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                Costo estimado: {formatMoney(recetaIngredientes.reduce((sum, i) => {
                  const prod = productos.find(p => p.id === i.producto_id);
                  return sum + (prod?.costo_unitario ?? 0) * (Number(i.cantidad) || 0);
                }, 0))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecetaDialog(false)}>Cancelar</Button>
            {editingReceta && (
              <Button variant="destructive" size="sm" onClick={() => { handleDeleteReceta(editingReceta.id); setRecetaDialog(false); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleSaveReceta} disabled={savingReceta} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {savingReceta ? "Guardando..." : editingReceta ? "Guardar cambios" : "Crear receta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
