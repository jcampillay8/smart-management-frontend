import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <h3 className="text-sm font-black uppercase tracking-widest">Escanear Código de Barras</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase">Cerrar</button>
        </div>
        <div className="p-4">
          <div id="reader" className="w-full"></div>
          <p className="text-[10px] text-muted-foreground text-center mt-4 uppercase font-bold tracking-widest">
            Apunta la cámara al código de barras del producto
          </p>
        </div>
      </div>
    </div>
  );
}
