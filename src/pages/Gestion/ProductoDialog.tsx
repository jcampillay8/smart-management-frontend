// src/pages/Gestion/ProductoDialog.tsx

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useBodega } from "../../hooks/useBodega";
import { Categoria, Producto } from "./types";

interface ProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: Categoria[];
  editingProducto?: Producto | null;
  onSuccess: () => void;
}

export function ProductoDialog({ open, onOpenChange, categorias, editingProducto, onSuccess }: ProductoDialogProps) {
  const { bodegas } = useBodega();
  const [saving, setSaving] = useState(false);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidad, setUnidad] = useState("unidades");
  const [costo, setCosto] = useState("");
  const [bodegasConfig, setBodegasConfig] = useState<{ bodega_id: string; stock_minimo: number }[]>([]);

  // Efecto para cargar datos si estamos editando
  useEffect(() => {
    if (open) {
      if (editingProducto) {
        setNombre(editingProducto.nombre);
        setCategoriaId(editingProducto.categoria_id);
        setUnidad(editingProducto.unidad);
        setCosto(editingProducto.costo_unitario.toString());
        setBodegasConfig(editingProducto.bodegas_config || []);
      } else {
        resetForm();
      }
    }
  }, [open, editingProducto]);

  const resetForm = () => {
    setNombre("");
    setCategoriaId("");
    setUnidad("unidades");
    setCosto("");
    // Por defecto, inicializamos la config de bodegas con las bodegas existentes y stock 0
    setBodegasConfig(bodegas.map(b => ({ bodega_id: b.id, stock_minimo: 0 })));
  };

  const handleStockMinimoChange = (bodegaId: string, value: number) => {
    setBodegasConfig(prev => {
      const exists = prev.find(c => c.bodega_id === bodegaId);
      if (exists) {
        return prev.map(c => c.bodega_id === bodegaId ? { ...c, stock_minimo: value } : c);
      }
      return [...prev, { bodega_id: bodegaId, stock_minimo: value }];
    });
  };

  const handleSave = async () => {
    if (!nombre || !categoriaId || !costo) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre,
        categoria_id: categoriaId,
        unidad,
        costo_unitario: Number(costo),
        bodegas_config: bodegasConfig
      };

      if (editingProducto) {
        await api.put(`/inventory/products/${editingProducto.id}`, payload);
        toast.success("Producto actualizado");
      } else {
        await api.post("/inventory/products", payload);
        toast.success("Producto creado");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProducto ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Producto *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Coca Cola 350cc" />
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidad de Medida</Label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidades">Unidades (un)</SelectItem>
                  <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                  <SelectItem value="lt">Litros (lt)</SelectItem>
                  <SelectItem value="gr">Gramos (gr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Costo Unitario *</Label>
              <Input type="number" value={costo} onChange={e => setCosto(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Alertas de Stock Mínimo por Bodega</Label>
            <div className="grid gap-2">
              {bodegas.map(bodega => {
                const config = bodegasConfig.find(c => c.bodega_id === bodega.id);
                return (
                  <div key={bodega.id} className="flex items-center justify-between bg-secondary/20 p-2 rounded-lg">
                    <span className="text-sm font-medium">{bodega.nombre}</span>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        className="w-20 h-8 text-right" 
                        value={config?.stock_minimo || 0}
                        onChange={e => handleStockMinimoChange(bodega.id, Number(e.target.value))}
                      />
                      <span className="text-xs text-muted-foreground">{unidad}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : editingProducto ? "Actualizar" : "Crear Producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}