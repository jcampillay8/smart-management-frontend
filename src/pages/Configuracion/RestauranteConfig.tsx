// src/pages/Configuracion/RestauranteConfig.tsx
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Upload } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

const API_URL = api.defaults.baseURL;

export function RestauranteConfig({ settings, onUpdate }: { settings: any, onUpdate: () => void }) {
  const [nombre, setNombre] = useState(settings.nombre);
  const [diasAlerta, setDiasAlerta] = useState(settings.dias_alerta_vencimiento || 5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveSettings = async () => {
    try {
      await api.put("/settings/restaurant", { 
        nombre,
        dias_alerta_vencimiento: Number(diasAlerta)
      });
      toast.success("Configuración actualizada");
      window.dispatchEvent(new CustomEvent("restaurant-config-changed"));
      onUpdate();
    } catch (e) { toast.error("Error al guardar"); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/settings/restaurant/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Logo actualizado");
      window.dispatchEvent(new CustomEvent("restaurant-config-changed"));
      onUpdate();
    } catch (error) {
      toast.error("Error al subir el logo");
    }
  };

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground">Nombre del Negocio</label>
        <Input 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          className="rounded-xl border-2"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground">Alerta de Vencimiento (Días)</label>
        <div className="flex items-center gap-4">
           <Input 
            type="number"
            value={diasAlerta} 
            onChange={e => setDiasAlerta(Number(e.target.value))} 
            className="rounded-xl border-2 w-24"
          />
          <p className="text-[10px] text-muted-foreground font-medium uppercase italic">
            Los productos se marcarán en naranja cuando falten estos días para expirar.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={saveSettings} className="w-full rounded-xl font-black text-[10px] uppercase">Guardar Cambios Generales</Button>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground">Logo Principal</label>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl border-2 bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url.startsWith('http') ? settings.logo_url : `${API_URL}${settings.logo_url}`} 
                className="h-full w-full object-contain" 
              />
            ) : (
              <Store className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
            <Upload className="h-4 w-4 mr-2" /> Cambiar Logo
          </Button>
          <input 
            ref={fileInputRef} 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleLogoUpload} 
          />
        </div>
      </div>
    </div>
  );
}