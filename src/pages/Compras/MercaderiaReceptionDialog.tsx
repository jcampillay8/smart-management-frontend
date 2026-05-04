// src/pages/Compras/MercaderiaReceptionDialog.tsx
import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { 
  FileText, ScanBarcode, Keyboard, ChevronRight, 
  AlertCircle, CheckCircle2, ShoppingCart, Trash2,
  Calendar, Info, Mail, AlertTriangle, ArrowLeft,
  XCircle, Package
} from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";
import { toast } from "sonner";
import { Compra, CompraItem } from "./types";
import { formatMoney } from "../../lib/format";
import { BarcodeScanner } from "../../components/BarcodeScanner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  compra: Compra | null;
  onSuccess: () => void;
}

type ReceptionMode = "invoice" | "barcode" | "manual";

interface ReceivedItem extends CompraItem {
  received_qty: number;
  received_cost_neto: number;
  received_cost_bruto: number;
  expiration_date?: string;
  is_verified: boolean;
}

export function MercaderiaReceptionDialog({ open, onOpenChange, compra, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<ReceptionMode | null>(null);
  const [items, setItems] = useState<ReceivedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanningFor, setScanningFor] = useState<string | null>(null); // producto_id

  useEffect(() => {
    if (open && compra) {
      loadItems();
    } else {
      setStep(1);
      setMode(null);
      setItems([]);
    }
  }, [open, compra]);

  const loadItems = async () => {
    if (!compra) return;
    setLoading(true);
    try {
      const res = await api.get(`/purchases/${compra.id}`);
      const baseItems = res.data.items || [];
      setItems(baseItems.map((item: CompraItem) => ({
        ...item,
        received_qty: item.cantidad,
        received_cost_neto: item.precio_unitario,
        received_cost_bruto: Math.round(item.precio_unitario * 1.19),
        is_verified: false
      })));
    } catch (e) {
      toast.error("Error al cargar items del pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<ReceivedItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleScanInvoice = () => {
    setMode("invoice");
    setStep(3);
    toast.info("Escaneando factura... (Simulado)");
    // Aquí iría la lógica de OCR real
  };

  const handleFinalize = async () => {
    if (!compra) return;
    const discrepancies = items.filter(i => i.received_qty !== i.cantidad);
    
    if (discrepancies.length > 0) {
      setStep(5); // Ir a manejo de discrepancias
      return;
    }

    submitReception();
  };

  const submitReception = async (action?: "modify_order" | "reject_order") => {
    if (!compra) return;
    setLoading(true);
    try {
      // 1. Guardar la recepción
      await api.post(`/purchases/${compra.id}/receive`, {
        items: items.map(i => ({
          producto_id: i.producto_id,
          cantidad_recibida: i.received_qty,
          costo_neto: i.received_cost_neto,
          fecha_vencimiento: i.expiration_date
        })),
        action
      });

      // 2. Notificar al proveedor si es necesario
      if (action) {
        toast.info("Enviando correo al proveedor...");
        // Esto se gatillaría en el backend según el endpoint de arriba
      }

      toast.success("Mercadería recibida correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al procesar la recepción");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 py-4">
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-start gap-4">
        <div className="bg-primary/10 p-2 rounded-lg">
          <ShoppingCart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Confirmar Pedido</h3>
          <p className="text-sm text-muted-foreground">
            Vas a recibir la mercadería para el pedido de <b>{compra?.proveedor || "Proveedor desconocido"}</b> del día <b>{compra?.fecha}</b>.
          </p>
          <p className="text-sm font-semibold text-primary mt-1">Total esperado: {formatMoney(compra?.total || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button size="lg" className="h-20 justify-between px-6 bg-emerald-600 hover:bg-emerald-700" onClick={() => setStep(2)}>
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-8 w-8" />
            <div className="text-left">
              <p className="font-bold text-lg">Sí, empezar recepción</p>
              <p className="text-xs opacity-90">Comenzar el proceso de verificación de items.</p>
            </div>
          </div>
          <ChevronRight className="h-6 w-6" />
        </Button>
        <Button size="lg" variant="outline" className="h-16 justify-start gap-4 px-6" onClick={() => onOpenChange(false)}>
          <XCircle className="h-6 w-6 text-muted-foreground" />
          <div className="text-left">
            <p className="font-semibold">No, volver atrás</p>
          </div>
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">¿Cómo deseas ingresar los datos?</h3>
        <p className="text-sm text-muted-foreground">Elige el método de entrada preferido.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={handleScanInvoice}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-left"
        >
          <div className="bg-blue-100 p-3 rounded-xl">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Escanear Factura</p>
            <p className="text-sm text-muted-foreground">Extrae productos, cantidades y precios automáticamente.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button 
          onClick={() => { setMode("barcode"); setStep(3); }}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
        >
          <div className="bg-indigo-100 p-3 rounded-xl">
            <ScanBarcode className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Escaneo Código de Barras</p>
            <p className="text-sm text-muted-foreground">Valida cada producto escaneando su código.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button 
          onClick={() => { setMode("manual"); setStep(3); }}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
        >
          <div className="bg-amber-100 p-3 rounded-xl">
            <Keyboard className="h-8 w-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">Ingreso Manual</p>
            <p className="text-sm text-muted-foreground">Digita las cantidades y precios de forma tradicional.</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      
      <Button variant="ghost" className="w-full gap-2" onClick={() => setStep(1)}>
        <ArrowLeft className="h-4 w-4" /> Volver a confirmación
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Verificación de Productos</h3>
          <p className="text-xs text-muted-foreground">Edita los datos reales que llegaron en la factura/despacho.</p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1">
          {mode === "invoice" && <FileText className="h-3 w-3" />}
          {mode === "barcode" && <ScanBarcode className="h-3 w-3" />}
          {mode === "manual" && <Keyboard className="h-3 w-3" />}
          {mode === "invoice" ? "Factura" : mode === "barcode" ? "Barras" : "Manual"}
        </Badge>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className={cn(
            "p-3 rounded-xl border-2 transition-all space-y-3",
            item.received_qty === item.cantidad ? "border-emerald-500/30 bg-emerald-50/20" : "border-border"
          )}>
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-primary">
                  {item.producto_nombre?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm leading-none">{item.producto_nombre}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Esperado: {item.cantidad} • ${item.precio_unitario}</p>
                </div>
              </div>
              {mode === "barcode" && (
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-primary/10 text-primary" onClick={() => { setScanningFor(item.id); setShowScanner(true); }}>
                  <ScanBarcode className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cantidad Recibida</Label>
                <Input 
                  type="number" 
                  value={item.received_qty} 
                  onChange={e => handleUpdateItem(item.id, { received_qty: Number(e.target.value) })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Costo Neto (Factura)</Label>
                <Input 
                  type="number" 
                  value={item.received_cost_neto} 
                  onChange={e => handleUpdateItem(item.id, { received_cost_neto: Number(e.target.value) })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Vencimiento</Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    value={item.expiration_date || ""} 
                    onChange={e => handleUpdateItem(item.id, { expiration_date: e.target.value })}
                    className="h-8 text-[10px] px-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Atrás</Button>
        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => setStep(4)}>Continuar</Button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const totalExpected = items.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0);
    const totalReceived = items.reduce((acc, i) => acc + (i.received_qty * i.received_cost_neto), 0);
    const diff = totalReceived - totalExpected;
    const hasDiscrepancy = items.some(i => i.received_qty !== i.cantidad);

    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold">Resumen de Recepción</h3>
          <p className="text-sm text-muted-foreground">Verifica los totales antes de ingresar al inventario.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-secondary/50 border space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Pedido</p>
            <p className="text-lg font-bold">{formatMoney(totalExpected)}</p>
          </div>
          <div className={cn(
            "p-4 rounded-2xl border space-y-1",
            diff === 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
          )}>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Factura</p>
            <p className={cn("text-lg font-bold", diff === 0 ? "text-emerald-700" : "text-amber-700")}>{formatMoney(totalReceived)}</p>
          </div>
        </div>

        {hasDiscrepancy && (
          <div className="bg-amber-100/50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-amber-800">Diferencias detectadas</p>
              <p className="text-amber-700">Se han encontrado items con cantidades distintas a lo pedido. Al finalizar se te preguntará cómo proceder con estas diferencias.</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button className="w-full h-12 text-lg font-bold" onClick={handleFinalize}>
            {hasDiscrepancy ? "Continuar a Discrepancias" : "Finalizar e Ingresar"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setStep(3)}>Revisar Items</Button>
        </div>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3 text-amber-600">
        <div className="bg-amber-100 p-2 rounded-lg">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Manejo de Discrepancias</h3>
          <p className="text-sm text-muted-foreground">¿Cómo deseas proceder con las diferencias?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => submitReception("modify_order")}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 transition-all text-left"
        >
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg text-indigo-900">Modificar Pedido y Notificar</p>
            <p className="text-sm text-indigo-700">Acepta lo recibido, actualiza el pedido y envía un email al proveedor con el resumen de faltantes/sobrantes.</p>
          </div>
        </button>

        <button 
          onClick={() => submitReception("reject_order")}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-destructive/50 hover:bg-destructive/5 transition-all text-left"
        >
          <div className="bg-destructive/10 p-3 rounded-xl">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg text-destructive">Rechazar Pedido (Stand By)</p>
            <p className="text-sm text-muted-foreground">Si hay productos en factura que no llegaron, rechaza la recepción y notifica el rechazo total al proveedor.</p>
          </div>
        </button>
      </div>

      <Button variant="ghost" className="w-full" onClick={() => setStep(4)}>Volver al resumen</Button>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                step === 1 ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "h-2 w-2 rounded-full",
                step === 2 ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "h-2 w-2 rounded-full",
                step === 3 ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "h-2 w-2 rounded-full",
                step === 4 ? "bg-primary" : "bg-muted"
              )} />
              <div className={cn(
                "h-2 w-2 rounded-full",
                step === 5 ? "bg-primary" : "bg-muted"
              )} />
            </div>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Recibir Mercadería
            </DialogTitle>
            <DialogDescription>
              Paso {step} de 5
            </DialogDescription>
          </DialogHeader>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

        </DialogContent>
      </Dialog>

      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => {
            setShowScanner(false);
            if (scanningFor) {
              toast.success("Producto identificado por código");
              // Aquí podrías marcar como verificado o incrementar cantidad
              handleUpdateItem(scanningFor, { is_verified: true });
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "outline" ? "border text-foreground" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </div>
  );
}

