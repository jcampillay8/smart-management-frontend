// src/pages/Gestion/RecetaDialog.tsx
import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Plus, Trash2, CookingPot, Info, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { formatMoney } from "../../lib/format";
import { useBodega } from "../../hooks/useBodega";
import { Producto, Receta } from "./types";
import BodegaBadge from "../../components/BodegaBadge";
import ImageUpload from "../../components/ImageUpload";

interface RecetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  editingReceta?: Receta | null;
  onSuccess: () => void;
}

export function RecetaDialog({ open, onOpenChange, productos, editingReceta, onSuccess }: RecetaDialogProps) {
  const { bodegas } = useBodega();
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("0");
  const [categoriaRecetaId, setCategoriaRecetaId] = useState<string>("");
  const [ivaIncluido, setIvaIncluido] = useState(false);
  const [ivaPorcentaje, setIvaPorcentaje] = useState("19");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [ingredientes, setIngredientes] = useState<{ producto_id: string; bodega_id: string; cantidad: string }[]>([]);
  const [searchPerBodega, setSearchPerBodega] = useState<Record<string, string>>({});
  const [searchFocus, setSearchFocus] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editingReceta) {
        setNombre(editingReceta.nombre);
        setPrecio(String(editingReceta.precio));
        setCategoriaRecetaId(editingReceta.categoria_receta_id ?? "");
        setIvaIncluido(editingReceta.iva_incluido ?? false);
        setIvaPorcentaje(String(editingReceta.iva_porcentaje ?? 19));
        setImagenUrl(editingReceta.imagen_url ?? null);
        setIngredientes(
          (editingReceta.ingredientes || []).map(i => ({
            producto_id: i.producto_id,
            bodega_id: i.bodega_id,
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
    setSearchPerBodega({});
  };

  const addIngrediente = (bodegaId: string, productoId: string) => {
    if (ingredientes.find(i => i.producto_id === productoId && i.bodega_id === bodegaId)) {
      toast.error("Producto ya agregado desde esta bodega");
      return;
    }
    setIngredientes([...ingredientes, { producto_id: productoId, bodega_id: bodegaId, cantidad: "1" }]);
    setSearchPerBodega(prev => ({ ...prev, [bodegaId]: "" }));
    setSearchFocus(null);
  };

  const updateIngrediente = (index: number, field: string, value: string | number) => {
    const newIngredientes = [...ingredientes];
    newIngredientes[index] = { ...newIngredientes[index], [field]: String(value) };
    setIngredientes(newIngredientes);
  };

  const removeIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const getProductsForBodega = (bodegaId: string) => {
    return productos.filter(p => {
      const hasBodega = p.bodegas_config?.some(b => b.bodega_id === bodegaId);
      if (!hasBodega) return false;
      const search = searchPerBodega[bodegaId]?.toLowerCase() || "";
      if (!search) return true;
      return p.nombre.toLowerCase().includes(search);
    });
  };

  const costoEstimado = useMemo(() => {
    return ingredientes.reduce((sum, ing) => {
      const prod = productos.find(p => p.id === ing.producto_id);
      return sum + (prod?.costo_unitario ?? 0) * (Number(ing.cantidad) || 0);
    }, 0);
  }, [ingredientes, productos]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const validIngredientes = ingredientes.filter(i => i.producto_id && i.bodega_id && Number(i.cantidad) > 0);
    if (validIngredientes.length === 0) {
      toast.error("Agrega al menos un ingrediente");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        precio: Number(precio) || 0,
        categoria_receta_id: categoriaRecetaId || null,
        iva_incluido: ivaIncluido,
        iva_porcentaje: Number(ivaPorcentaje),
        imagen_url: imagenUrl,
        ingredientes: validIngredientes.map(i => ({
          producto_id: i.producto_id,
          bodega_id: i.bodega_id,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CookingPot className="h-5 w-5 text-indigo-500" />
            {editingReceta ? "Editar Receta" : "Nueva Receta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <ImageUpload currentUrl={imagenUrl} onUploaded={setImagenUrl} folder="recipes" />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Hamburguesa Especial" />
            </div>
            <div className="space-y-2">
              <Label>Precio de venta ($)</Label>
              <Input type="number" min="0" step="any" value={precio} onChange={e => setPrecio(e.target.value)} onFocus={e => e.target.select()} />
            </div>
          </div>

          <div className="flex items-center gap-3 border rounded-md p-3">
            <Checkbox id="receta-iva" checked={ivaIncluido} onCheckedChange={c => setIvaIncluido(!!c)} />
            <label htmlFor="receta-iva" className="text-sm cursor-pointer flex-1">¿Precio incluye IVA?</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">IVA:</span>
              <Input type="number" min="0" max="100" value={ivaPorcentaje} onChange={e => setIvaPorcentaje(e.target.value)} className="h-7 w-16 text-right text-xs" />
              <span className="text-xs">%</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ingredientes por Bodega</Label>
            {bodegas.map(bodega => {
              const searchKey = bodega.id;
              const searchVal = searchPerBodega[searchKey] || "";
              const isFocused = searchFocus === searchKey;
              const prodsInBodega = getProductsForBodega(bodega.id);

              return (
                <div key={bodega.id} className="space-y-2">
                  <BodegaBadge nombre={bodega.nombre} />
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto..."
                      value={searchVal}
                      onChange={e => setSearchPerBodega(prev => ({ ...prev, [searchKey]: e.target.value }))}
                      onFocus={() => setSearchFocus(searchKey)}
                      onBlur={() => setTimeout(() => setSearchFocus(null), 200)}
                      className="pl-8 h-8 text-sm"
                    />
                    {isFocused && prodsInBodega.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
                        {prodsInBodega.slice(0, 10).map(p => (
                          <button
                            key={p.id}
                            className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent"
                            onMouseDown={() => addIngrediente(bodega.id, p.id)}
                          >
                            {p.nombre} <span className="text-muted-foreground">({p.unidad})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {ingredientes.filter(i => i.bodega_id === bodega.id).map((ing, idx) => {
                    const globalIdx = ingredientes.findIndex(i => i.producto_id === ing.producto_id && i.bodega_id === ing.bodega_id);
                    const prod = productos.find(p => p.id === ing.producto_id);
                    return (
                      <div key={idx} className="flex items-center gap-2 pl-2">
                        <span className="text-sm flex-1 truncate">{prod?.nombre ?? "?"}</span>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={ing.cantidad}
                          onChange={e => updateIngrediente(globalIdx, "cantidad", e.target.value)}
                          className="h-8 w-20 text-right text-sm"
                          placeholder="Cant."
                        />
                        <span className="text-xs text-muted-foreground w-10">{prod?.unidad ?? ""}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeIngrediente(globalIdx)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {ingredientes.length > 0 && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              Costo estimado: {formatMoney(costoEstimado)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {editingReceta && (
            <Button 
              variant="destructive" 
              size="sm" 
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
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? "Guardando..." : editingReceta ? "Guardar cambios" : "Crear receta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}