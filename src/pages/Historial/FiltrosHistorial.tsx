// src/pages/Historial/FiltrosHistorial.tsx

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar } from "../../components/ui/calendar"; // O EnhancedCalendar según tu lib
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, FilterX, ListFilter } from "lucide-react";
import { cn } from "../../lib/utils";
import { TipoMovimiento } from "./types";

interface Props {
  tipo: TipoMovimiento;
  setTipo: (tipo: TipoMovimiento) => void;
  fecha: Date | undefined;
  setFecha: (fecha: Date | undefined) => void;
}

export function FiltrosHistorial({ tipo, setTipo, fecha, setFecha }: Props) {
  
  const clearFilters = () => {
    setTipo("all");
    setFecha(new Date());
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/20 p-4 rounded-xl border">
      {/* Selector de Tipo de Movimiento */}
      <div className="space-y-1.5 w-full md:w-64">
        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1">
          <ListFilter className="h-3 w-3" /> Tipo de Movimiento
        </label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimiento)}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los movimientos</SelectItem>
            <SelectItem value="conteo">📦 Conteos (Inventario)</SelectItem>
            <SelectItem value="consumo">🍽️ Consumos</SelectItem>
            <SelectItem value="merma">🗑️ Mermas / Bajas</SelectItem>
            <SelectItem value="compra">🛒 Compras / Entradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selector de Fecha */}
      <div className="space-y-1.5 w-full md:w-64">
        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" /> Fecha de Registro
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-background",
                !fecha && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fecha ? format(fecha, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fecha}
              onSelect={setFecha}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Botón de Limpiar */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={clearFilters}
        className="text-muted-foreground hover:text-primary h-10 px-3"
      >
        <FilterX className="h-4 w-4 mr-2" />
        Limpiar
      </Button>
    </div>
  );
}