import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { EnhancedCalendar } from "../../components/ui/enhanced-calendar";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, FilterX, ListFilter, Package, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { TipoMovimiento, Producto } from "./types";

const TIPOS: { value: TipoMovimiento; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "conteo", label: "Conteo" },
  { value: "consumo", label: "Consumo" },
  { value: "merma", label: "Merma" },
  { value: "ajuste", label: "Ajuste" },
  { value: "transferencia", label: "Transferencia" },
];

interface Props {
  filtroProducto: string;
  setFiltroProducto: (v: string) => void;
  filtroTipo: TipoMovimiento;
  setFiltroTipo: (v: TipoMovimiento) => void;
  fechaDesde: Date | undefined;
  setFechaDesde: (v: Date | undefined) => void;
  fechaHasta: Date | undefined;
  setFechaHasta: (v: Date | undefined) => void;
  filtroUsuario?: string;
  setFiltroUsuario?: (v: string) => void;
  productos: Producto[];
}

export function FiltrosHistorial({
  filtroProducto,
  setFiltroProducto,
  filtroTipo,
  setFiltroTipo,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  filtroUsuario = "",
  setFiltroUsuario,
  productos,
}: Props) {
  const hasFilters =
    filtroProducto !== "all" ||
    filtroTipo !== "all" ||
    fechaDesde ||
    fechaHasta ||
    filtroUsuario !== "";

  const clearFilters = () => {
    setFiltroProducto("all");
    setFiltroTipo("all");
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    if (setFiltroUsuario) setFiltroUsuario("");
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <div className="relative w-full sm:w-48">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por usuario..."
          className="pl-8"
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario?.(e.target.value)}
        />
      </div>

      <Select value={filtroProducto} onValueChange={setFiltroProducto}>
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="Producto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los productos</SelectItem>
          {productos.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as TipoMovimiento)}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          {TIPOS.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-40 justify-start",
              !fechaDesde && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fechaDesde ? format(fechaDesde, "dd/MM/yyyy") : "Desde"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions={false}>
          <EnhancedCalendar mode="single" selected={fechaDesde} onSelect={setFechaDesde} />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-40 justify-start",
              !fechaHasta && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fechaHasta ? format(fechaHasta, "dd/MM/yyyy") : "Hasta"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions={false}>
          <EnhancedCalendar mode="single" selected={fechaHasta} onSelect={setFechaHasta} />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <FilterX className="h-4 w-4 mr-2" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}