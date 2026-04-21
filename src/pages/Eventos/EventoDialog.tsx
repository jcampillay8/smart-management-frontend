// src/pages/Eventos/EventoDialog.tsx

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar";
import { cn } from "../../lib/utils";
import { Producto, EventoItem } from "./types";

interface EventoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  recetas: any[];
  onSuccess: () => void;
}

export function EventoDialog({ open, onOpenChange, productos, recetas, onSuccess }: EventoDialogProps) {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [eventoItems, setEventoItems] = useState<EventoItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      setNombre("");
      setFecha(new Date());
      setEventoItems([]);
    }
  }, [open]);

  const addProducto = (prodId: string) => {
    if (!prodId) return;
    setEventoItems([...eventoItems, { producto_id: prodId, cantidad: 1, bodega_id: "all" }]);
  };

  const addReceta = (recetaId: string) => {
    const receta = recetas.find(r => r.id === recetaId);
    if (!receta) return;
    const newItems = receta.ingredientes.map((ing: any) => ({
      producto_id: ing.producto_id,
      cantidad: ing.cantidad,
      bodega_id: ing.bodega_id
    }));
    setEventoItems([...eventoItems, ...newItems]);
    toast.success(`Ingredientes de ${receta.nombre} añadidos`);
  };

  const handleSave = async () => {
    if (!nombre || !fecha || eventoItems.length === 0) {
      toast.error("Completa el nombre, fecha y añade al menos un producto");
      return;
    }

    setSaving(true);
    try {
      await api.post("/operations/events/", {
        nombre,
        fecha: format(fecha, "yyyy-MM-dd"),
        productos: eventoItems
      });
      toast.success("Evento programado con éxito");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Error al guardar el evento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programar Nuevo Evento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Evento</Label>
              <Input 
                placeholder="Ej: Matrimonio Familia Rojas" 
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !fecha && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fecha} onSelect={setFecha} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <hr />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Añadir Producto</Label>
              <Select onValueChange={addProducto}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {productos.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargar desde Receta</Label>
              <Select onValueChange={addReceta}>
                <SelectTrigger><SelectValue placeholder="Seleccionar receta..." /></SelectTrigger>
                <SelectContent>
                  {recetas.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Detalle de Insumos</Label>
            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
              {eventoItems.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground italic">No hay productos añadidos</p>}
              {eventoItems.map((item, i) => {
                const p = productos.find(prod => prod.id === item.producto_id);
                return (
                  <div key={i} className="flex items-center gap-3 p-2 bg-card">
                    <span className="text-sm flex-1 truncate font-medium">{p?.nombre || "Cargando..."}</span>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        className="w-20 h-8 text-right" 
                        value={item.cantidad} 
                        onChange={e => {
                          const newItems = [...eventoItems];
                          newItems[i].cantidad = Number(e.target.value);
                          setEventoItems(newItems);
                        }} 
                      />
                      <span className="text-xs text-muted-foreground w-8">{p?.unidad}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => setEventoItems(eventoItems.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Programar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}