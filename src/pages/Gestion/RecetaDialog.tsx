// src/pages/Gestion/RecetaDialog.tsx
import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Plus, Trash2, CookingPot, Info, Search, Layers, CheckCircle2, Circle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { formatMoney } from "../../lib/format";
import { useBodega } from "../../hooks/useBodega";
import { useAreaOperativa } from "../../hooks/useAreaOperativa";
import { Producto, Receta } from "./types";
import BodegaBadge from "../../components/BodegaBadge";
import ImageUpload from "../../components/ImageUpload";
import { cn } from "../../lib/utils";

interface RecetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  categorias: any[];
  editingReceta?: Receta | null;
  onSuccess: () => void;
}

export function RecetaDialog({ open, onOpenChange, productos, categorias, editingReceta, onSuccess }: RecetaDialogProps) {
  const { areas } = useAreaOperativa();
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("0");
  const [categoriaRecetaId, setCategoriaRecetaId] = useState<string>("");
  const [ivaIncluido, setIvaIncluido] = useState(false);
  const [ivaPorcentaje, setIvaPorcentaje] = useState("19");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  
  const [selectedAreasIds, setSelectedAreasIds] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState<{ producto_id: string; cantidad: string }[]>([]);
  const [busquedaProd, setBusquedaProd] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingReceta) {
        setNombre(editingReceta.nombre);
        setPrecio(String(editingReceta.precio));
        setCategoriaRecetaId(editingReceta.categoria_receta_id ?? "");
        setIvaIncluido(editingReceta.iva_incluido ?? false);
        setIvaPorcentaje(String(editingReceta.iva_porcentaje ?? 19));
        setImagenUrl(editingReceta.imagen_url ?? null);
        setSelectedAreasIds(editingReceta.areas_operativas_ids || []);
        setIngredientes(
          (editingReceta.ingredientes || []).map(i => ({
            producto_id: i.producto_id,
            cantidad: String(i.cantidad),
          }))
        );
      } else {
        resetForm();
      }
    }
  }, [open, editingReceta]);

  const resetForm = () => {
    setNombre("");
    setPrecio("0");
    setCategoriaRecetaId("");
    setIvaIncluido(false);
    setIvaPorcentaje("19");
    setImagenUrl(null);
    setIngredientes([]);
    setSelectedAreasIds([]);
    setBusquedaProd("");
  };

  const toggleArea = (id: string) => {
    setSelectedAreasIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Bodegas belonging to selected areas
  const activeBodegasIds = useMemo(() => {
    const ids = new Set<string>();
    areas.filter(a => selectedAreasIds.includes(a.id)).forEach(a => {
      a.bodegas_ids.forEach(bid => ids.add(bid));
    });
    return Array.from(ids);
  }, [areas, selectedAreasIds]);

  // Products available in active bodegas
  const filteredProductos = useMemo(() => {
    if (selectedAreasIds.length === 0) return [];
    return productos.filter(p => {
      // Check if product is in at least one of the active bodegas
      const hasStock = p.bodegas_config?.some(bc => 
        activeBodegasIds.includes(bc.bodega_id) && bc.stock_actual > 0
      );
      if (!hasStock) return false;
      
      const search = busquedaProd.toLowerCase();
      return p.nombre.toLowerCase().includes(search);
    });
  }, [productos, selectedAreasIds, activeBodegasIds, busquedaProd]);

  const addIngrediente = (productoId: string) => {
    if (ingredientes.find(i => i.producto_id === productoId)) {
      toast.error("Producto ya agregado");
      return;
    }
    setIngredientes([...ingredientes, { producto_id: productoId, cantidad: "1" }]);
    setBusquedaProd("");
    setShowProductSearch(false);
  };

  const updateIngrediente = (index: number, field: string, value: string | number) => {
    const newIngredientes = [...ingredientes];
    newIngredientes[index] = { ...newIngredientes[index], [field]: String(value) };
    setIngredientes(newIngredientes);
  };

  const removeIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const costoEstimado = useMemo(() => {
    return ingredientes.reduce((sum, ing) => {
      const prod = productos.find(p => p.id === ing.producto_id);
      return sum + (prod?.costo_unitario ?? 0) * (Number(ing.cantidad) || 0);
    }, 0);
  }, [ingredientes, productos]);

  const handleSave = async () => {
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (selectedAreasIds.length === 0) { toast.error("Selecciona al menos un Área Operativa"); return; }

    const validIngredientes = ingredientes.filter(i => i.producto_id && Number(i.cantidad) > 0);
    if (validIngredientes.length === 0) { toast.error("Agrega al menos un ingrediente"); return; }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        precio: Number(precio) || 0,
        categoria_receta_id: categoriaRecetaId === "none" ? null : categoriaRecetaId || null,
        iva_incluido: ivaIncluido,
        iva_porcentaje: Number(ivaPorcentaje),
        imagen_url: imagenUrl,
        areas_operativas_ids: selectedAreasIds,
        ingredientes: validIngredientes.map(i => ({
          producto_id: i.producto_id,
          cantidad: Number(i.cantidad),
        })),
      };

      if (editingReceta) {
        await api.put(`/operations/recipes/${editingReceta.id}`, payload);
        toast.success("Receta actualizada");
      } else {
        await api.post("/operations/recipes", payload);
        toast.success("Receta creada");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Error al guardar la receta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CookingPot className="h-5 w-5 text-primary" />
            {editingReceta ? "Editar Receta" : "Nueva Receta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <ImageUpload currentUrl={imagenUrl} onUploaded={setImagenUrl} folder="recipes" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Hamburguesa Especial" className="rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría Receta</Label>
              <Select value={categoriaRecetaId} onValueChange={setCategoriaRecetaId}>
                <SelectTrigger className="rounded-xl border-2 font-bold"><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categorias.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio de venta ($)</Label>
            <Input type="number" min="0" step="any" value={precio} onChange={e => setPrecio(e.target.value)} onFocus={e => e.target.select()} className="rounded-xl border-2 font-bold" />
          </div>

          {/* ÁREAS OPERATIVAS SELECTOR */}
          <div className="space-y-3 p-4 bg-muted/20 rounded-2xl border-2 border-dashed">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" /> Áreas Operativas Disponibles
            </Label>
            <div className="flex flex-wrap gap-2">
              {areas.map(a => {
                const active = selectedAreasIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleArea(a.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all",
                      active ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {a.nombre}
                  </button>
                );
              })}
            </div>
            {selectedAreasIds.length === 0 && (
              <p className="text-[10px] text-destructive font-bold flex items-center gap-1">
                <Info className="h-3 w-3" /> Selecciona al menos un área para agregar ingredientes
              </p>
            )}
          </div>

          {/* INGREDIENTES */}
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ingredientes</Label>
            
            {selectedAreasIds.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto con stock en áreas seleccionadas..."
                  value={busquedaProd}
                  onChange={e => setBusquedaProd(e.target.value)}
                  onFocus={() => setShowProductSearch(true)}
                  onBlur={() => setTimeout(() => setShowProductSearch(false), 200)}
                  className="pl-8 h-10 rounded-xl border-2 font-bold"
                />
                {showProductSearch && filteredProductos.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border bg-card shadow-2xl p-1">
                    {filteredProductos.slice(0, 15).map(p => (
                      <button
                        key={p.id}
                        className="w-full px-4 py-2 text-xs font-bold text-left hover:bg-accent rounded-lg flex justify-between items-center"
                        onMouseDown={() => addIngrediente(p.id)}
                      >
                        <span>{p.nombre}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{p.unidad}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {ingredientes.map((ing, idx) => {
                const prod = productos.find(p => p.id === ing.producto_id);
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{prod?.nombre ?? "Producto desconocido"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={ing.cantidad}
                        onChange={e => updateIngrediente(idx, "cantidad", e.target.value)}
                        onFocus={e => e.target.select()}
                        className="h-8 w-20 text-right font-black text-xs rounded-lg"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground w-10 uppercase">{prod?.unidad ?? ""}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => removeIngrediente(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {ingredientes.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Costo Total Estimado</span>
              <span className="text-lg font-black tracking-tighter text-primary">{formatMoney(costoEstimado)}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-black text-[10px] uppercase">Cancelar</Button>
          {editingReceta && (
            <Button 
              variant="ghost" 
              className="rounded-xl h-10 w-10 p-0 text-destructive hover:bg-destructive/10" 
              onClick={async () => {
                if (!confirm("¿Eliminar esta receta?")) return;
                await api.delete(`/operations/recipes/${editingReceta.id}`);
                toast.success("Receta eliminada");
                onSuccess();
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="rounded-xl font-black text-[10px] uppercase shadow-lg shadow-primary/20">
            {saving ? "Guardando..." : editingReceta ? "Guardar cambios" : "Crear receta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}