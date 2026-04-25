// src/pages/Eventos/EventoDialog.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import { useEventos } from "./useEventos";
import { Evento, EventoItem } from "./types";

interface EventoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvento: Evento | null;
  onSuccess: () => void;
}

export function EventoDialog({ open, onOpenChange, editingEvento, onSuccess }: EventoDialogProps) {
  const { createEvento, updateEvento, recetas } = useEventos();
  
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [eventoItems, setEventoItems] = useState<EventoItem[]>([]);
  const [valorPublico, setValorPublico] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isEditing = !!editingEvento;

  useEffect(() => {
    if (!open) {
      setNombre("");
      setFecha(new Date());
      setEventoItems([]);
      setValorPublico("");
    } else if (editingEvento) {
      setNombre(editingEvento.nombre);
      setFecha(new Date(editingEvento.fecha));
      setEventoItems([...editingEvento.items]);
      setValorPublico(editingEvento.valor_publico ? String(editingEvento.valor_publico) : "");
    }
  }, [open, editingEvento]);

  const addProductoSimple = (prodId: string) => {
    if (!prodId) return;
    setEventoItems(prev => [...prev, { producto_id: prodId, cantidad: 1, bodega_id: "" }]);
  };

  const removeItem = (index: number) => {
    setEventoItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQty = (index: number, qty: number) => {
    const newItems = [...eventoItems];
    newItems[index].cantidad = qty;
    setEventoItems(newItems);
  };

  const handleSave = async () => {
    if (!nombre.trim()) { toast.error("Ingresa un nombre para el evento"); return; }
    if (eventoItems.length === 0) { toast.error("Agrega al menos un producto"); return; }
    
    const fechaStr = format(fecha, "yyyy-MM-dd");
    const valorPub = valorPublico.trim() ? Number(valorPublico) : undefined;

    setSaving(true);
    try {
      if (isEditing) {
        await updateEvento(editingEvento.id, nombre.trim(), fechaStr, eventoItems, [], valorPub);
      } else {
        await createEvento(nombre.trim(), fechaStr, eventoItems, [], valorPub);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error: " + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">Nombre del evento</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Cena 50 personas" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Fecha</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="mt-1 w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(fecha, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" side="bottom">
                <Calendar mode="single" selected={fecha} onSelect={d => { if (d) { setFecha(d); setCalendarOpen(false); } }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-sm font-medium">Precio Venta Neto (opcional)</Label>
            <Input type="number" min="0" step="any" placeholder="Ej: 500000"
              value={valorPublico} onChange={e => setValorPublico(e.target.value)}
              className="mt-1" />
          </div>
          <div className="border-t pt-3 space-y-3">
            <Label className="text-sm font-medium">Productos</Label>
            <Select onValueChange={addProductoSimple}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Agregar producto..." />
              </SelectTrigger>
              <SelectContent>
                {/* Productos would be loaded from useEventos in a full implementation */}
              </SelectContent>
            </Select>
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
              {eventoItems.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground italic">No hay productos añadidos</p>}
              {eventoItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-card">
                  <span className="text-sm flex-1 truncate font-medium">{item.producto_id}</span>
                  <Input type="number" min="0" step="any" value={item.cantidad}
                    onChange={e => updateItemQty(i, Number(e.target.value))}
                    className="h-8 w-20 text-right text-sm" />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}