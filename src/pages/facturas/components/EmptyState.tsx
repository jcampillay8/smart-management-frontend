import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onUpload?: () => void;
}

export default function EmptyState({ onUpload }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Aún no has subido ninguna factura</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
      Sube tu primera factura para empezar a procesarla con IA y llevar el control de tus documentos.
      </p>
      {onUpload && (
        <Button onClick={onUpload} className="gap-2">
          <Upload className="h-4 w-4" /> Subir Factura
        </Button>
      )}
    </div>
  );
}
