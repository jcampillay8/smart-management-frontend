// src/pages/Configuracion/SoporteConfig.tsx

import { useState } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { MessageSquare, Send, Heart, Coffee } from "lucide-react";

export function SoporteConfig() {
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!mensaje.trim()) return;
    setSending(true);
    try {
      // Usamos el endpoint de incidencias generales o uno de soporte
      await api.post("/operations/support-ticket", { contenido: mensaje });
      toast.success("Mensaje enviado. ¡Gracias por tu feedback!");
      setMensaje("");
    } catch (e) {
      toast.error("Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" /> Soporte y Feedback
        </h3>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">¿Tienes problemas o sugerencias? Escríbenos directamente.</p>
      </div>

      <div className="space-y-4 rounded-2xl border-2 border-dashed p-4 bg-muted/5">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tu mensaje</Label>
          <Textarea 
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder="Describe tu problema, error detectado o sugerencia de nueva función..."
            className="min-h-[120px] rounded-xl border-2 bg-background/50 resize-none"
          />
        </div>
        <Button onClick={handleSend} disabled={sending || !mensaje.trim()} className="w-full rounded-xl gap-2 font-black text-[10px] uppercase">
          <Send className="h-3.5 w-3.5" />
          {sending ? "Enviando..." : "Enviar Comentario"}
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center pt-4 space-y-2 opacity-40 grayscale hover:grayscale-0 transition-all hover:opacity-100">
        <p className="text-[8px] font-black uppercase tracking-widest text-center">Built with passion for EasyStock Team</p>
        <div className="flex items-center gap-4">
           <Heart className="h-4 w-4 text-red-500 fill-red-500" />
           <Coffee className="h-4 w-4 text-amber-600" />
        </div>
      </div>
    </div>
  );
}
