// src/pages/GestionarMerma/MermaRegisterDialog.tsx

import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useBodega } from "../../hooks/useBodega";
import { format } from "date-fns";

const MOTIVOS = [
  { value: "vencimiento", label: "Vencimiento" },
  { value: "daño", label: "Daño" },
  { value: "error", label: "Error" },
  { value: "otro", label: "Otro" },
];

interface MermaRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MermaRegisterDialog({ open, onOpenChange, onSuccess }: MermaRegisterDialogProps) {
  // Eliminamos activeBodegaId y traemos bodegas (la lista completa) del contexto
  const { selectedBodegaId, bodegas } = useBodega();
  
  const [productos, setProductos] = useState<any[]>([]);
  const [selectedProdId, setSelectedProdId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("__none__");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [allRecords, setAllRecords] = useState([]);

  useEffect(() => {
    if (open) {
      loadInitialData();
    } else {
      resetForm();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      const [prodRes, histRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/inventory/history/")
      ]);
      setProductos(prodRes.data);
      setAllRecords(histRes.data);
    } catch (e) {
      toast.error("Error al cargar datos para el registro");
    }
  };

  const resetForm = () => {
    setSelectedProdId("");
    setCantidad("");
    setFechaVencimiento("__none__");
    setDescripcion("");
  };

  // Determinamos qué ID de bodega usar para los cálculos y el envío
  const targetBodegaId = useMemo(() => {
    if (selectedBodegaId !== "all") return selectedBodegaId;
    // Si es "all", intentamos usar la primera bodega de la lista como fallback
    return bodegas.length > 0 ? bodegas[0].id : null;
  }, [selectedBodegaId, bodegas]);

  const availableLots = useMemo(() => {
    if (!selectedProdId || !allRecords.length || !targetBodegaId) return [];
    const snapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), targetBodegaId);
    return (snapshot.lotsByProduct[selectedProdId] || []).filter(l => l.cantidad > 0);
  }, [selectedProdId, allRecords, targetBodegaId]);

  const handleRegister = async () => {
    if (!selectedProdId || !cantidad || Number(cantidad) <= 0) {
      toast.error("Ingresa un producto y cantidad válida");
      return;
    }

    if (!targetBodegaId) {
      toast.error("No hay una bodega seleccionada para aplicar la merma");
      return;
    }

    setSaving(true);
    try {
      await api.post("/inventory/stock/bulk-movements", {
        movements: [{
          producto_id: selectedProdId,
          cantidad: Number(cantidad),
          tipo_movimiento: "merma",
          bodega_id: targetBodegaId,
          fecha_recuento: new Date().toISOString().split("T")[0],
          fecha_vencimiento: fechaVencimiento === "__none__" ? null : fechaVencimiento,
          descripcion_merma: descripcion
        }]
      });

      toast.success("Merma registrada correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al registrar la merma");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Merma</DialogTitle>
          {selectedBodegaId === "all" && bodegas.length > 0 && (
            <p className="text-[10px] text-amber-600 bg-amber-50 p-1 rounded border border-amber-200">
              Nota: Al estar en vista global, la merma se aplicará a: <strong>{bodegas[0].nombre}</strong>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={selectedProdId} onValueChange={setSelectedProdId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={cantidad} 
                onChange={e => setCantidad(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Lote / Vencimiento</Label>
              <Select value={fechaVencimiento} onValueChange={setFechaVencimiento} disabled={!selectedProdId}>
                <SelectTrigger>
                  <SelectValue placeholder="Cualquier lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin lote específico</SelectItem>
                  {availableLots.map(l => (
                    <SelectItem key={l.fecha_vencimiento} value={l.fecha_vencimiento}>
                      {l.fecha_vencimiento} ({l.cantidad} disp.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción / Motivo</Label>
            <Textarea 
              placeholder="Ej: Producto vencido, envase dañado..." 
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleRegister} disabled={saving} className="bg-destructive hover:bg-destructive/90">
            {saving ? "Registrando..." : "Confirmar Merma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}