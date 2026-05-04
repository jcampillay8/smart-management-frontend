// src/pages/StockRegistro/dialogs/AddingMercaderiaDialog.tsx

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { 
  PackagePlus, Plus, Barcode, Upload, 
  ChevronRight, Truck, Clock, AlertTriangle, 
  PackageCheck, Search, X
} from "lucide-react";
import { cn } from "../../../lib/utils";
import api from "../../../lib/api";
import { toast } from "sonner";
import { formatMoney } from "../../../lib/format";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "pedidos" | "libre" | "barcode" | "factura";
  onSuccess: () => void;
}

interface Compra {
  id: string;
  proveedor: string | null;
  fecha: string;
  total: number;
  estado: string;
  pedido_realizado: boolean;
}

export function AddingMercaderiaDialog({ open, onOpenChange, onSuccess }: Props) {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [stage, setStage] = useState<"select_order" | "select_method">("select_order");

  useEffect(() => {
    if (open) {
      setStage("select_order");
      setSelectedCompra(null);
      loadPendingPurchases();
    }
  }, [open]);

  const loadPendingPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get("/purchases/");
      const pending = res.data.filter((c: any) => c.estado === "pendiente");
      setCompras(pending);
    } catch (e) {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (compra: Compra) => {
    setSelectedCompra(compra);
    setStage("select_method");
  };

  const handleMethodAction = async (method: "factura" | "barcode" | "manual") => {
    if (!selectedCompra) return;

    if (method === "manual") {
      try {
        await api.patch(`/purchases/${selectedCompra.id}/receive`);
        toast.success("Mercadería ingresada manualmente");
        onSuccess();
        onOpenChange(false);
      } catch (e: any) {
        toast.error("Error al recibir: " + (e.response?.data?.detail || e.message));
      }
    } else {
      toast.info(`Método ${method} próximamente disponible.`);
    }
  };

  const filteredCompras = compras.filter(c => 
    (c.proveedor || "").toLowerCase().includes(search.toLowerCase())
  );

  const renderContent = () => {
    if (stage === "select_order") {
      return (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por proveedor..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse">Cargando pedidos...</div>
          ) : filteredCompras.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/20">
              No hay pedidos pendientes de ingreso.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredCompras.map(c => {
                 const isPedidoHecho = (c as any).pedido_realizado;
                 return (
                  <button 
                    key={c.id} 
                    onClick={() => handleSelectOrder(c)}
                    className={cn(
                      "group p-4 rounded-2xl border-2 transition-all relative overflow-hidden text-left",
                      isPedidoHecho 
                        ? "border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50" 
                        : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/50"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black uppercase rounded-bl-xl",
                      isPedidoHecho ? "bg-purple-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {isPedidoHecho ? "Pedido Hecho" : "Borrador"}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "p-2 rounded-xl",
                        isPedidoHecho ? "bg-purple-500/20 text-purple-600" : "bg-amber-500/20 text-amber-600"
                      )}>
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate">{c.proveedor || "Sin Proveedor"}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">{c.fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-black">{formatMoney(c.total)}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                 );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 py-2">
        <div className="mb-4 p-4 rounded-2xl bg-muted/50 border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pedido seleccionado</p>
          <div className="flex justify-between items-center">
            <span className="font-bold">{selectedCompra?.proveedor || "Sin Proveedor"}</span>
            <span className="font-black text-primary">{formatMoney(selectedCompra?.total || 0)}</span>
          </div>
        </div>

        <button
          onClick={() => handleMethodAction("factura")}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50 transition-all group"
        >
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-600 group-hover:scale-110 transition-transform">
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-sm">Subir Factura</h4>
            <p className="text-xs text-muted-foreground">Procesar documento (OCR)</p>
          </div>
        </button>

        <button
          onClick={() => handleMethodAction("barcode")}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50 transition-all group"
        >
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-600 group-hover:scale-110 transition-transform">
            <Barcode className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-sm">Escanear Código</h4>
            <h4 className="text-xs text-muted-foreground">Validar items con cámara</h4>
          </div>
        </button>

        <button
          onClick={() => handleMethodAction("manual")}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50 transition-all group"
        >
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-600 group-hover:scale-110 transition-transform">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-sm">Registro Manual</h4>
            <p className="text-xs text-muted-foreground">Ingreso directo sin validación</p>
          </div>
        </button>

        <Button 
          variant="ghost" 
          onClick={() => setStage("select_order")}
          className="mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground"
        >
          <X className="h-3 w-3 mr-2" /> Cambiar pedido
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-[2rem] border-white/10 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <PackagePlus className="h-6 w-6" />
            </div>
            {stage === "select_order" ? "Recibir Mercadería" : "Método de Ingreso"}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {stage === "select_order" 
              ? "Selecciona un pedido pendiente para ingresar al stock"
              : "Elige cómo quieres validar el ingreso de los productos"}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter className="sm:justify-start pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Cerrar Terminal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Sub-componente Input local para evitar errores de importación si no está en ui/
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
