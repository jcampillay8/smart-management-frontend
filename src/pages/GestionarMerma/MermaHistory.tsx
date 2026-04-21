// src/pages/GestionarMerma/MermaHistory.tsx

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { format } from "date-fns";

interface MermaHistoryProps {
  mermas: any[];
  productos: any[];
  busqueda: string;
}

export function MermaHistory({ mermas, productos, busqueda }: MermaHistoryProps) {
  const filtered = mermas.filter(m => {
    const p = productos.find(prod => prod.id === m.producto_id);
    return p?.nombre.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead>Motivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
              No se encontraron registros de merma.
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((m) => {
            const p = productos.find(prod => prod.id === m.producto_id);
            return (
              <TableRow key={m.id}>
                <TableCell className="text-xs">
                  {format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell className="font-medium">{p?.nombre || "Cargando..."}</TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  -{m.cantidad}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground italic">
                  {m.descripcion_merma || "Sin descripción"}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}