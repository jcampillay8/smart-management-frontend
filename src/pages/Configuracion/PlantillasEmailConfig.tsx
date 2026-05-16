import { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Mail, Plus, Pencil, Trash2, HelpCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { cn } from "../../lib/utils";

interface PlantillaEmail {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
}

const VARIABLES_DISPONIBLES = [
  { label: "Restaurante", value: "[Restaurante]", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { label: "Proveedor", value: "[Proveedor]", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  { label: "Items/Productos", value: "[Items]", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { label: "Motivo/Incidencia", value: "[Motivo]", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  { label: "Fecha Actual", value: "[Fecha]", color: "bg-slate-500/10 text-slate-600 border-slate-200" },
];

const DEFAULT_BODY = `Estimados [Proveedor],

Junto con saludar cordialmente, les escribimos desde [Restaurante] para realizar el siguiente pedido de insumos con fecha [Fecha]:

DETALLES DEL PEDIDO:
------------------------------------------
[Items]
------------------------------------------

Solicitamos confirmar la recepción de este correo e indicarnos el tiempo estimado de entrega y el monto total a cancelar.

Cualquier duda o comentario, favor contactarnos por esta misma vía.

Atentamente,

Administración
[Restaurante]
Sistema de Gestión EasyStock`;

export function PlantillasEmailConfig() {
  const [plantillas, setPlantillas] = useState<PlantillaEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaEmail | null>(null);

  const [nombre, setNombre] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [saving, setSaving] = useState(false);
  const [varsOpen, setVarsOpen] = useState(false);
  
  const asuntoRef = useRef<HTMLInputElement>(null);
  const cuerpoRef = useRef<HTMLTextAreaElement>(null);
  const [lastFocus, setLastFocus] = useState<"asunto" | "cuerpo">("cuerpo");

  useEffect(() => {
    loadPlantillas();
  }, []);

  const loadPlantillas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/purchases/email-templates");
      setPlantillas(res.data);
    } catch (e: any) {
      toast.error("Error al cargar plantillas de correo");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingPlantilla(null);
    setNombre("");
    setAsunto("Pedido de Insumos - [Restaurante]");
    setCuerpo(DEFAULT_BODY);
    setDialogOpen(true);
    setVarsOpen(false);
  };

  const openEdit = (p: PlantillaEmail) => {
    setEditingPlantilla(p);
    setNombre(p.nombre);
    setAsunto(p.asunto);
    setCuerpo(p.cuerpo);
    setDialogOpen(true);
    setVarsOpen(false);
  };

  const insertVariable = (variable: string) => {
    if (lastFocus === "asunto") {
      const el = asuntoRef.current;
      if (!el) return;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const newValue = asunto.substring(0, start) + variable + asunto.substring(end);
      setAsunto(newValue);
      
      // Re-focus and set cursor after insert (next tick)
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      const el = cuerpoRef.current;
      if (!el) return;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const newValue = cuerpo.substring(0, start) + variable + cuerpo.substring(end);
      setCuerpo(newValue);

      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !asunto || !cuerpo) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    
    setSaving(true);
    try {
      const payload = { nombre, asunto, cuerpo };
      if (editingPlantilla) {
        await api.put(`/purchases/email-templates/${editingPlantilla.id}`, payload);
        toast.success("Plantilla actualizada");
      } else {
        await api.post("/purchases/email-templates", payload);
        toast.success("Plantilla creada");
      }
      setDialogOpen(false);
      loadPlantillas();
    } catch (e: any) {
      toast.error("Error al guardar plantilla");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta plantilla?")) return;
    try {
      await api.delete(`/purchases/email-templates/${id}`);
      toast.success("Plantilla eliminada");
      loadPlantillas();
    } catch (e) {
      toast.error("Error al eliminar plantilla");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground animate-pulse">Cargando plantillas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Plantillas de Correo</h3>
          <p className="text-xs text-muted-foreground">Administra los mensajes predeterminados para enviar a proveedores.</p>
        </div>
        <Button size="sm" onClick={openNew} className="gap-1 rounded-xl shadow-sm">
          <Plus className="h-4 w-4" /> Nueva Plantilla
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {plantillas.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-2 text-center py-8 border rounded-2xl border-dashed bg-muted/20">
            No hay plantillas creadas todavía.
          </p>
        ) : (
          plantillas.map(p => (
            <div key={p.id} className="border rounded-2xl p-5 bg-card hover:shadow-md transition-all duration-300 space-y-3 flex flex-col group">
              <div className="flex justify-between items-start gap-2">
                <div className="font-bold text-sm truncate flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                  </div>
                  {p.nombre}
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Asunto</p>
                <p className="text-xs font-semibold line-clamp-1">{p.asunto}</p>
              </div>
              <div className="pt-3 border-t border-border/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Cuerpo</p>
                <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed italic">
                  "{p.cuerpo}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-primary" />
               {editingPlantilla ? "Editar Plantilla" : "Crear Nueva Plantilla"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Nombre de la Plantilla</Label>
              <Input 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                placeholder="Ej: Pedido Semanal de Frutas..." 
                className="rounded-xl"
                autoFocus 
              />
            </div>

            {/* Collapsible Variables */}
            <Collapsible open={varsOpen} onOpenChange={setVarsOpen} className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
               <CollapsibleTrigger asChild>
                 <button type="button" className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors">
                   <div className="flex items-center gap-2">
                     <HelpCircle className="h-4 w-4 text-primary" />
                     <span className="text-xs font-bold uppercase tracking-tight">Variables dinámicas</span>
                   </div>
                   {varsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                 </button>
               </CollapsibleTrigger>
               <CollapsibleContent className="px-4 pb-4">
                 <p className="text-[10px] text-muted-foreground mb-3 leading-tight">
                   Haz clic en una variable para insertarla en la posición actual del cursor:
                 </p>
                 <div className="flex flex-wrap gap-2">
                   {VARIABLES_DISPONIBLES.map(v => (
                     <button
                       key={v.value}
                       type="button"
                       onClick={() => insertVariable(v.value)}
                       className={cn(
                         "px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all hover:scale-105 active:scale-95 shadow-sm",
                         v.color
                       )}
                     >
                       {v.label}
                     </button>
                   ))}
                 </div>
               </CollapsibleContent>
            </Collapsible>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Asunto del Correo</Label>
              <Input 
                ref={asuntoRef}
                value={asunto} 
                onFocus={() => setLastFocus("asunto")}
                onChange={e => setAsunto(e.target.value)} 
                placeholder="Ej: Nuevo pedido para [Nombre Restaurante]" 
                className="rounded-xl font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Cuerpo del Correo</Label>
              <Textarea 
                ref={cuerpoRef}
                value={cuerpo} 
                onFocus={() => setLastFocus("cuerpo")}
                onChange={e => setCuerpo(e.target.value)} 
                placeholder="Escribe el mensaje estándar aquí..." 
                className="min-h-[200px] resize-none rounded-2xl leading-relaxed text-sm"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                {saving ? "Guardando..." : "Guardar Plantilla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

