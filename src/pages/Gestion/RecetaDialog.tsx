// src/pages/Gestion/RecetaDialog.tsx

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Plus, Trash2, CookingPot, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { formatMoney } from "../../lib/format";
import { useBodega } from "../../hooks/useBodega";
import { Producto, Receta } from "./types";

interface RecetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  editingReceta?: Receta | null;
  onSuccess: () => void;
}

export function RecetaDialog({ open, onOpenChange, productos, editingReceta, onSuccess }: RecetaDialogProps) {
  const { bodegas } = useBodega();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [ingredientes, setIngredientes] = useState<{ producto_id: string; cantidad: number; bodega_id: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editingReceta) {
        setNombre(editingReceta.nombre);
        setPrecio(editingReceta.precio.toString());
        setIngredientes(editingReceta.ingredientes || []);
      } else {
        resetForm();
      }
    }
  }, [open, editingReceta]);

  const resetForm = () => {
    setNombre("");
    setPrecio("");
    setIngredientes([]);
  };

  const addIngrediente = () => {
    setIngredientes([...ingredientes, { producto_id: "", cantidad: 1, bodega_id: bodegas[0]?.id || "" }]);
  };

  const updateIngrediente = (index: number, field: string, value: any) => {
    const newIngredientes = [...ingredientes];
    newIngredientes[index] = { ...newIngredientes[index], [field]: value };
    setIngredientes(newIngredientes);
  };

  const removeIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  // Cálculo de costo dinámico
  const costoEstimado = ingredientes.reduce((sum, ing) => {
    const prod = productos.find(p => p.id === ing.producto_id);
    return sum + (prod?.costo_unitario ?? 0) * (ing.cantidad || 0);
  }, 0);

  const handleSave = async () => {
    if (!nombre || ingredientes.length === 0) {
      toast.error("Nombre e ingredientes son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre,
        precio: Number(precio) || 0,
        ingredientes: ingredientes.filter(i => i.producto_id !== "")
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
    } catch (error) {
      toast.error("Error al guardar la receta");
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
            {editingReceta ? "Editar Receta" : "Crear Nueva Receta"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre de la Receta / Plato</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Hamburguesa Especial" />
            </div>
            <div className="space-y-2">
              <Label>Precio de Venta (Opcional)</Label>
              <Input type="number" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold uppercase text-muted-foreground">Ingredientes e Insumos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngrediente} className="h-8 gap-1">
                <Plus className="h-3 w-3" /> Añadir
              </Button>
            </div>

            <div className="space-y-2">
              {ingredientes.map((ing, index) => (
                <div key={index} className="flex gap-2 items-end bg-muted/30 p-3 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Producto</Label>
                    <Select value={ing.producto_id} onValueChange={(v) => updateIngrediente(index, "producto_id", v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Insumo..." /></SelectTrigger>
                      <SelectContent>
                        {productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-20 space-y-1">
                    <Label className="text-[10px]">Cantidad</Label>
                    <Input 
                      type="number" 
                      className="h-8" 
                      value={ing.cantidad} 
                      onChange={e => updateIngrediente(index, "cantidad", Number(e.target.value))} 
                    />
                  </div>

                  <div className="w-32 space-y-1">
                    <Label className="text-[10px]">Bodega Descuento</Label>
                    <Select value={ing.bodega_id} onValueChange={(v) => updateIngrediente(index, "bodega_id", v)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {bodegas.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeIngrediente(index)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de Costos */}
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-700">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">Costo de producción:</span>
            </div>
            <span className="text-xl font-bold text-indigo-900">{formatMoney(costoEstimado)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? "Guardando..." : editingReceta ? "Actualizar Receta" : "Crear Receta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}