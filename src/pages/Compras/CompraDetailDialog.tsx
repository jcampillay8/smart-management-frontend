// src/pages/Compras/CompraDetailDialog.tsx

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { format } from "date-fns";
import { formatMoney } from "../../lib/format";
import { Compra, CompraItem } from "./types";
import { Loader2, FileText, Calendar, Store, Truck } from "lucide-react";

interface CompraDetailDialogProps {
  compra: Compra | null;
  onClose: () => void;
}

export function CompraDetailDialog({ compra, onClose }: CompraDetailDialogProps) {
  const [items, setItems] = useState<CompraItem[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (compra) {
      loadDetail();
    } else {
      setItems([]);
    }
  }, [compra]);

  const loadDetail = async () => {
    if (!compra) return;
    setLoading(true);
    try {
      const [itemsRes, prodRes] = await Promise.all([
        api.get(`/purchases/${compra.id}`),
        api.get("/inventory/products")
      ]);
      setItems(itemsRes.data.items || []);
      setProductos(prodRes.data);
    } catch (error) {
      toast.error("Error al cargar el detalle");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (id: string) => {
    return productos.find(p => p.id === id)?.nombre || "Producto no encontrado";
  };

  const getBodegaName = (id: string | null) => {
    if (!id) return "—";
    return "Bodega"; // Simplified for now
  };

  return (
    <Dialog open={!!compra} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalle de Compra
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Cargando...</p>
          </div>
        ) : compra && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg text-sm">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Fecha: 
                  <span className="text-foreground font-medium">{format(new Date(compra.fecha), "dd/MM/yyyy")}</span>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Store className="h-3.5 w-3.5" /> Proveedor: 
                  <span className="text-foreground font-medium">{compra.proveedor || "No especificado"}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" /> Pedido: 
                  <span className={compra.pedido_realizado ? "text-purple-600 font-medium" : "text-muted-foreground"}>
                    {compra.pedido_realizado ? "Realizado" : "Pendiente"}
                  </span>
                </p>
                {compra.factura_url && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Factura: 
                    <a href={compra.factura_url} target="_blank" rel="noreferrer" className="text-primary underline">Ver documento</a>
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground font-medium">
                  <tr>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-left">Bodega</th>
                    <th className="px-4 py-2 text-right">Cant.</th>
                    <th className="px-4 py-2 text-right">Precio Unit.</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-2 font-medium">{getProductName(it.producto_id)}</td>
                      <td className="px-4 py-2">{getBodegaName(it.bodega_id)}</td>
                      <td className="px-4 py-2 text-right">{it.cantidad}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(it.precio_unitario)}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatMoney(it.cantidad * it.precio_unitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-secondary/50 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right">Total</td>
                    <td className="px-4 py-2 text-right text-primary">
                      {formatMoney(compra.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {compra.notas && (
              <div className="bg-blue-50/50 p-3 rounded border border-blue-100">
                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Notas</p>
                <p className="text-sm text-blue-900">{compra.notas}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}