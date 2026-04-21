import { useState, useRef } from "react";
import api from "@/lib/api";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_SIZE = 800; // max dimension in pixels
const QUALITY = 0.8;

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
        "image/webp",
        QUALITY
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

interface ImageUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string | null) => void;
  folder?: string;
  className?: string;
}

export default function ImageUpload({ currentUrl, onUploaded, folder = "products", className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    setUploading(true);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append("file", resized, "upload.webp");

      const response = await api.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { url } = response.data;
      setPreview(url);
      onUploaded(url);
    } catch (err: any) {
      toast.error("Error al subir imagen: " + (err.response?.data?.detail ?? err.message ?? ""));
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeImage = () => {
    setPreview(null);
    onUploaded(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {preview ? (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-3 text-center"
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground/50 shrink-0" />
          <div className="flex flex-1 flex-col items-start gap-1">
            <span className="text-xs text-muted-foreground">Arrastra o selecciona</span>
            <div className="flex gap-1.5">
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-3 w-3" /> Galería
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => cameraRef.current?.click()} disabled={uploading}>
                <Camera className="h-3 w-3" /> Cámara
              </Button>
            </div>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
      {uploading && <p className="text-xs text-muted-foreground animate-pulse">Subiendo imagen...</p>}
    </div>
  );
}
