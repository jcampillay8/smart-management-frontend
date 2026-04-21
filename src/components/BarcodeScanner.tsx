import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ScanLine, Loader2, Search } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: { id: string; nombre: string; unidad: string; codigo_barra?: string | null }[];
  onProductFound: (productoId: string) => void;
  onCreateNew: (codigoBarra: string) => void;
}

export default function BarcodeScanner({ open, onOpenChange, productos, onProductFound, onCreateNew }: Props) {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [foundProduct, setFoundProduct] = useState<{ id: string; nombre: string; unidad: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!open) stopCamera();
    return () => stopCamera();
  }, [open, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);

      // Try BarcodeDetector API if available
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"]
        });
        const scanLoop = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              stopCamera();
              searchCode(code);
              return;
            }
          } catch { /* continue scanning */ }
          if (streamRef.current) requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
      } else {
        toast.info("Tu navegador no soporta detección automática. Ingresa el código manualmente.");
        stopCamera();
      }
    } catch {
      toast.error("No se pudo acceder a la cámara");
    }
  };

  const searchCode = (code: string) => {
    const product = productos.find(p => p.codigo_barra === code);
    if (product) {
      setFoundProduct(product);
      setNotFound(false);
      setManualCode(code);
    } else {
      setFoundProduct(null);
      setNotFound(true);
      setManualCode(code);
    }
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) { toast.error("Ingresa un código"); return; }
    searchCode(manualCode.trim());
  };

  const handleSelect = () => {
    if (foundProduct) {
      onProductFound(foundProduct.id);
      resetState();
      onOpenChange(false);
    }
  };

  const handleCreate = () => {
    onCreateNew(manualCode);
    resetState();
    onOpenChange(false);
  };

  const resetState = () => {
    setManualCode("");
    setFoundProduct(null);
    setNotFound(false);
    stopCamera();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-indigo-600" /> Escanear Código de Barra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {scanning ? (
            <div className="relative">
              <video ref={videoRef} className="w-full rounded-lg border" autoPlay playsInline muted style={{ minHeight: 240 }} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-0.5 bg-red-500 animate-pulse" />
              </div>
              <Button variant="outline" size="sm" className="absolute bottom-2 right-2" onClick={stopCamera}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="h-auto py-4 gap-3" onClick={startCamera}>
                <ScanLine className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Usar cámara</div>
                  <div className="text-xs text-muted-foreground">Escanear con la cámara del dispositivo</div>
                </div>
              </Button>

              <div className="flex gap-2">
                <Input placeholder="Ingresar código manualmente..." value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()} />
                <Button variant="outline" onClick={handleManualSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {foundProduct && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-700 p-3">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                ✓ Producto encontrado
              </p>
              <p className="text-sm mt-1">{foundProduct.nombre} ({foundProduct.unidad})</p>
            </div>
          )}

          {notFound && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/60 dark:border-amber-700 p-3 space-y-2">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Código no encontrado: {manualCode}
              </p>
              <p className="text-xs text-muted-foreground">
                ¿Deseas crear un nuevo producto con este código de barra?
              </p>
              <Button size="sm" variant="outline" onClick={handleCreate} className="border-amber-400 text-amber-700">
                Crear nuevo producto
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>Cancelar</Button>
          {foundProduct && (
            <Button onClick={handleSelect} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Seleccionar producto
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
