// src/pages/Configuracion/RestauranteConfig.tsx
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Upload } from "lucide-react";
import api from "../../lib/api";
import { toast } from "sonner";

const API_URL = api.defaults.baseURL;

const TIPO_NEGOCIO_OPTIONS = [
  "Almacén", "Bar", "Bazar", "Hostal", "Hotel", "Motel", "Pub", "Restobar", "Restaurante"
].sort();

export function RestauranteConfig({ settings, onUpdate }: { settings: any, onUpdate: () => void }) {
  const [nombre, setNombre] = useState(settings.nombre);
  const [tipoNegocio, setTipoNegocio] = useState(settings.tipo_negocio || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveSettings = async () => {
    try {
      await api.put("/settings/restaurant", { 
        nombre,
        tipo_negocio: tipoNegocio,
        dias_alerta_vencimiento: settings.dias_alerta_vencimiento || 5
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side: Business Info */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Tipo de Negocio</label>
            <select 
              value={tipoNegocio}
              onChange={e => setTipoNegocio(e.target.value)}
              className="w-full h-11 rounded-xl border-2 bg-background px-3 text-sm font-medium focus:border-primary transition-colors outline-none appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
            >
              <option value="" disabled>Seleccione el tipo de negocio</option>
              {TIPO_NEGOCIO_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground font-medium uppercase italic">
              Esta selección determinará el prefijo destacado en el nombre de tu negocio.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Nombre del Negocio</label>
            <Input 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              placeholder="Ej: La Fábrica"
              className="h-11 rounded-xl border-2 font-bold text-lg"
            />
          </div>
        </div>

        {/* Right Side / Top (Mobile): Logo */}
        <div className="w-full md:w-48 space-y-2 shrink-0">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Logo Principal</label>
          <div className="flex flex-row md:flex-col items-center gap-4 bg-muted/20 p-4 rounded-2xl border-2 border-dashed">
            <div className="h-20 w-20 rounded-xl border-2 bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {settings.logo_url ? (
                <img 
                  src={settings.logo_url.startsWith('http') ? settings.logo_url : `${API_URL}${settings.logo_url}`} 
                  className="h-full w-full object-contain p-1" 
                />
              ) : (
                <Store className="h-8 w-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest h-9 bg-background">
                <Upload className="h-3.5 w-3.5 mr-2" /> Cambiar
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
      </div>

      <div className="pt-2">
        <Button onClick={saveSettings} className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
          Guardar Cambios del Negocio
        </Button>
      </div>
    </div>
  );
}