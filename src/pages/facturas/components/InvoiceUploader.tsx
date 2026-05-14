import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onUpload: (files: File[]) => Promise<any>;
  accept?: string;
}

export default function InvoiceUploader({ onUpload, accept = "image/*,.pdf" }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles((prev) => [
      ...prev,
      ...Array.from(newFiles).filter(
        (f) =>
          f.type.startsWith("image/") || f.type === "application/pdf",
      ),
    ]);
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      await onUpload(files);
      setFiles([]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
        />
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
        <p className="text-sm font-medium">
          Arrastra tus facturas aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG, PDF — máximo 10MB por archivo
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {files.length} archivo(s) seleccionado(s)
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
                <button onClick={() => removeFile(i)} className="hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setFiles([])} disabled={uploading}>
              Limpiar
            </Button>
            <Button size="sm" onClick={handleUpload} disabled={uploading} className="gap-2">
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</>
              ) : (
                <><Upload className="h-4 w-4" /> Subir y Procesar</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
