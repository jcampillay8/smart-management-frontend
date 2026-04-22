// src/pages/StockRegistro/TransferDialog.tsx

import { useState, useEffect } from "react";
import api from "../../../lib/api";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Producto } from "../types";

interface TransferItem {
  producto_id: string;
  cantidad: string;
  fecha_vencimiento: string;
}

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  bodegas: { id: string; nombre: string }[];
  productBodegaMap: Record<string, Set<string>>;
  onSuccess: () => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  productos,
  bodegas,
  productBodegaMap,
  onSuccess,
}: TransferDialogProps) {
  const [saving, setSaving] = useState(false);
  const [transferOrigen, setTransferOrigen] = useState("");
  const [transferDestino, setTransferDestino] = useState("");
  const [transferItems, setTransferItems] = useState<TransferItem[]>([
    { producto_id: "", cantidad: "", fecha_vencimiento: "" },
  ]);

  const today = new Date().toISOString().split("T")[0];

  // Resetear formulario al cerrar
  useEffect(() => {
    if (!open) {
      setTransferOrigen("");
      setTransferDestino("");
      setTransferItems([{ producto_id: "", cantidad: "", fecha_vencimiento: "" }]);
    }
  }, [open]);

  const handleAddItem = () => {
    setTransferItems([...transferItems, { producto_id: "", cantidad: "", fecha_vencimiento: "" }]);
  };

  const handleRemoveItem = (idx: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof TransferItem, value: string) => {
    const newItems = [...transferItems];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setTransferItems(newItems);
  };

  const handleTransfer = async () => {
    const validItems = transferItems.filter(i => i.producto_id && i.cantidad && Number(i.cantidad) > 0);
    
    if (validItems.length === 0 || !transferOrigen || !transferDestino || transferOrigen === transferDestino) {
      toast.error("Completa los datos de transferencia correctamente");
      return;
    }

    setSaving(true);
    const movements: any[] = [];
    
    validItems.forEach(item => {
      // Entrada en destino
      movements.push({
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad),
        fecha_recuento: today,
        fecha_vencimiento: item.fecha_vencimiento || null,
        tipo_movimiento: "transferencia",
        bodega_id: transferDestino,
      });
      // Salida de origen
      movements.push({
        producto_id: item.producto_id,
        cantidad: Number(item.cantidad),
        fecha_recuento: today,
        fecha_vencimiento: item.fecha_vencimiento || null,
        tipo_movimiento: "transferencia",
        bodega_id: transferOrigen,
        descripcion_merma: "salida" 
      });
    });

    try {
      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Transferencia realizada con éxito");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al procesar la transferencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transferencia entre Bodegas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bodega Origen</Label>
              <Select value={transferOrigen} onValueChange={setTransferOrigen}>
                <SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger>
                <SelectContent>
                  {bodegas.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bodega Destino</Label>
              <Select value={transferDestino} onValueChange={setTransferDestino}>
                <SelectTrigger><SelectValue placeholder="Destino" /></SelectTrigger>
                <SelectContent>
                  {bodegas.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Productos a transferir</Label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {transferItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end border-b pb-2 sm:border-0">
                  <div className="flex-1 space-y-1">
                    <Select 
                      value={item.producto_id} 
                      onValueChange={(v) => updateItem(idx, "producto_id", v)}
                      disabled={!transferOrigen}
                    >
                      <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                      <SelectContent>
                        {productos
                          .filter(p => productBodegaMap[p.id]?.has(transferOrigen))
                          .map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Input 
                      type="number" 
                      placeholder="Cant" 
                      value={item.cantidad} 
                      onChange={(e) => updateItem(idx, "cantidad", e.target.value)} 
                    />
                  </div>
                  <div className="w-36">
                    <Input 
                      type="date" 
                      value={item.fecha_vencimiento} 
                      onChange={(e) => updateItem(idx, "fecha_vencimiento", e.target.value)} 
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveItem(idx)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddItem} 
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" /> Agregar otro producto
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleTransfer} disabled={saving}>
            {saving ? "Procesando..." : "Ejecutar Transferencia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}