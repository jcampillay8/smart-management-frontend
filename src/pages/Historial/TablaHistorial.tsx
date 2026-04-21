// src/pages/Historial/TablaHistorial.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { RegistroMovimiento } from "./types";
import { cn } from "../../lib/utils";
import { toChileDate, toChileDatetime } from "../../lib/timezone";
import BodegaBadge from "../../components/BodegaBadge";

export function TablaHistorial({ data, productos, bodegas }: { data: RegistroMovimiento[], productos: any[], bodegas: any[] }) {
  const getTipoEstilo = (tipo: string) => {
    switch (tipo) {
      case "merma": return "bg-red-100 text-red-700 border-red-200";
      case "compra": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "conteo": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Movimiento</TableHead>
            <TableHead>Bodega</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead>Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No se encontraron movimientos para los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((r) => (
              <TableRow key={r.id} className="hover:bg-accent/30 transition-colors">
                <TableCell>
                  <div className="font-medium text-xs">{toChileDate(r.created_at)}</div>
                  <div className="text-[10px] text-muted-foreground">{toChileDatetime(r.created_at)}</div>
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {productos.find(p => p.id === r.producto_id)?.nombre || "Cargando..."}
                </TableCell>
                <TableCell>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border", getTipoEstilo(r.tipo_movimiento))}>
                    {r.tipo_movimiento}
                  </span>
                </TableCell>
                <TableCell>
                  <BodegaBadge nombre={bodegas.find(b => b.id === r.bodega_id)?.nombre || ""} />
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {r.cantidad}
                </TableCell>
                <TableCell className="text-[11px] text-muted-foreground">
                  {r.user_display_name || "Sistema"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}