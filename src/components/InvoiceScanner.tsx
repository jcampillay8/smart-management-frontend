import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { Camera, Upload, Loader2, Trash2 } from "lucide-react";

export interface ScannedProduct {
  nombre: string;
  cantidad: number;
  precio: number;
  iva_incluido: boolean;
  iva_porcentaje: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (products: ScannedProduct[]) => void;
}

export default function InvoiceScanner({ open, onOpenChange, onConfirm }: Props) {
  const [scanning, setScanning] = useState(false);
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const [allIva, setAllIva] = useState(false);
  const [editing, setEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await api.post("/purchases/scan-invoice", {
        imageBase64: base64,
        mimeType: file.type,
      });

      const data = response.data;
      if (data?.error) throw new Error(data.error);

      const scanned = (data.products || []).map((p: any) => ({
        nombre: p.nombre || "",
        cantidad: p.cantidad || 1,
        precio: p.precio || 0,
        iva_incluido: p.iva_incluido || false,
        iva_porcentaje: 19,
      }));

      if (scanned.length === 0) {
        toast.error("No se detectaron productos en la imagen");
      } else {
        setProducts(scanned);
        setEditing(true);
        toast.success(`${scanned.length} producto(s) detectados`);
      }
    } catch (e: any) {
      toast.error("Error al escanear: " + (e.response?.data?.detail || e.message || "Error desconocido"));
    } finally {
      setScanning(false);
    }
  };

  const updateProduct = (idx: number, field: keyof ScannedProduct, value: any) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removeProduct = (idx: number) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleAllIva = (checked: boolean) => {
    setAllIva(checked);
    setProducts(prev => prev.map(p => ({ ...p, iva_incluido: checked })));
  };

  const handleConfirm = () => {
    if (products.length === 0) { toast.error("No hay productos"); return; }
    onConfirm(products);
    resetState();
  };

  const resetState = () => {
    setProducts([]);
    setEditing(false);
    setScanning(false);
    setAllIva(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" /> Escanear Factura
          </DialogTitle>
        </DialogHeader>

        {!editing ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sube o toma una foto de una factura. El sistema detectará automáticamente los productos.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="h-auto py-4 gap-3" onClick={() => cameraRef.current?.click()} disabled={scanning}>
                <Camera className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Tomar foto</div>
                  <div className="text-xs text-muted-foreground">Usar la cámara del dispositivo</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto py-4 gap-3" onClick={() => fileRef.current?.click()} disabled={scanning}>
                <Upload className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Subir imagen</div>
                  <div className="text-xs text-muted-foreground">Seleccionar archivo de la galería</div>
                </div>
              </Button>
            </div>
            {scanning && (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Analizando factura...
              </div>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{products.length} producto(s) detectados</p>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Escanear otra</Button>
            </div>

            <div className="grid grid-cols-[1fr_70px_90px_60px_30px] gap-1 text-xs font-semibold text-muted-foreground px-1">
              <span>Producto</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">Precio</span>
              <span className="text-center cursor-pointer" onClick={() => toggleAllIva(!allIva)}>
                <div className="flex items-center justify-center gap-1">
                  <Checkbox checked={allIva} onCheckedChange={toggleAllIva} className="h-3 w-3" />
                  <span>IVA</span>
                </div>
              </span>
              <span></span>
            </div>

            {products.map((p, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_70px_90px_60px_30px] gap-1 items-center">
                <Input value={p.nombre} onChange={(e) => updateProduct(idx, "nombre", e.target.value)}
                  className="h-8 text-xs" placeholder="Producto" />
                <Input type="number" value={p.cantidad} min={0} step="any"
                  onChange={(e) => updateProduct(idx, "cantidad", Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="h-8 text-xs text-right" />
                <Input type="number" value={p.precio} min={0} step="any"
                  onChange={(e) => updateProduct(idx, "precio", Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="h-8 text-xs text-right" />
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => updateProduct(idx, "iva_incluido", !p.iva_incluido)}
                    className={`text-xs font-mono px-1.5 py-0.5 rounded border transition-colors ${
                      p.iva_incluido
                        ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-400 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "bg-muted/30 border-muted text-muted-foreground"
                    }`}
                  >
                    {p.iva_porcentaje}%
                  </button>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeProduct(idx)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}

            <p className="text-xs text-muted-foreground mt-2">
              💡 Click en el porcentaje de IVA para alternar. Gris = monto neto. Verde = IVA incluido.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>Cancelar</Button>
          {editing && (
            <Button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Confirmar productos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
