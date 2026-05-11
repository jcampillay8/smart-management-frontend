import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, X } from "lucide-react";
import { facturasApi } from "../facturasApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  fileType: "image" | "pdf";
  filename: string;
}

export default function InvoicePreview({ open, onOpenChange, invoiceId, fileType, filename }: Props) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const loadImage = async () => {
    if (imageData || fileType !== "image") return;
    setLoading(true);
    try {
      const data = await facturasApi.getOptimizedImage(invoiceId);
      setImageData(data.optimized_image);
    } catch {
      setImageData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setZoom(1); onOpenChange(v); }}>
      <DialogContent
        className="sm:max-w-4xl max-h-[90vh] overflow-hidden"
        onOpenAutoFocus={loadImage}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-medium truncate">{filename}</DialogTitle>
          <div className="flex items-center gap-1">
            {fileType === "image" && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 rounded-lg min-h-[400px]">
          {fileType === "image" ? (
            loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Cargando imagen...
              </div>
            ) : imageData ? (
              <img
                src={imageData}
                alt={filename}
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No se pudo cargar la imagen</p>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">Vista previa no disponible para PDF</p>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Descargar PDF
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
