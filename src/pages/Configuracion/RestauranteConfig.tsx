// src/pages/Configuracion/RestauranteConfig.tsx
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Upload } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

export function RestauranteConfig({ settings, onUpdate }: { settings: any, onUpdate: () => void }) {
  const [nombre, setNombre] = useState(settings.nombre);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveName = async () => {
    try {
      await api.put("/settings/restaurant", { nombre });
      toast.success("Nombre actualizado");
      onUpdate();
    } catch (e) { toast.error("Error al guardar"); }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground">Nombre del Negocio</label>
        <div className="flex gap-2">
          <Input value={nombre} onChange={e => setNombre(e.target.value)} />
          <Button onClick={saveName}>Guardar</Button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground">Logo Principal</label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center overflow-hidden">
            {settings.logo_url ? <img src={settings.logo_url} className="h-full w-full object-contain" /> : <Store className="h-6 w-6 text-muted-foreground" />}
          </div>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Cambiar Logo
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={async (e) => {
             // Lógica de upload aquí (ver archivo original)
          }} />
        </div>
      </div>
    </div>
  );
}