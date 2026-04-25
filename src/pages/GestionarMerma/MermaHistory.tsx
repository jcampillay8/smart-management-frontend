// src/pages/GestionarMerma/MermaHistory.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { format } from "date-fns";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import BodegaBadge from "../../components/BodegaBadge";
import { useState } from "react";

interface MermaHistoryProps {
  mermas: any[];
  productos: any[];
  busqueda: string;
  getProductName: (id: string) => string;
  getProductUnit: (id: string) => string;
}

export function MermaHistory({ mermas, productos, busqueda, getProductName, getProductUnit }: MermaHistoryProps) {
  const { isAdmin, isSupervisor } = useAuth();
  const canEdit = isAdmin || isSupervisor;
  const [filtroMotivo, setFiltroMotivo] = useState("all");
  const [filtroBodega, setFiltroBodega] = useState("all");
  const [descDialog, setDescDialog] = useState(false);
  const [descText, setDescText] = useState("");

  const filtered = mermas.filter(m => {
    const p = productos.find(prod => prod.id === m.producto_id);
    if (p && busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroMotivo !== "all" && m.motivo_merma !== filtroMotivo) return false;
    if (filtroBodega !== "all" && m.bodega_id !== filtroBodega) return false;
    return true;
  });

  const openDesc = (m: any) => {
    const fecha = m.fecha_vencimiento 
      ? format(new Date(m.fecha_vencimiento + "T00:00:00"), "dd/MM/yyyy")
      : "Sin fecha de vencimiento";
    const lotInfo = `Lote: ${fecha}`;
    const desc = m.descripcion_merma || "Sin descripción adicional";
    setDescText(`${lotInfo}\n\n${desc}`);
    setDescDialog(true);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary">
          <TableHead>Producto</TableHead>
          <TableHead>Bodega</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead>Motivo</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-center">Detalles</TableHead>
          {canEdit && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
              No hay registros de merma
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((m, i) => (
            <TableRow key={m.id} className={i % 2 === 1 ? "bg-secondary/50" : ""}>
              <TableCell className="font-medium">{getProductName(m.producto_id)}</TableCell>
              <TableCell>
                <BodegaBadge nombre={m.bodega_id ? (m.bodega_id?.nombre || "") : ""} />
              </TableCell>
              <TableCell className="text-right font-bold text-destructive">
                {m.cantidad} {getProductUnit(m.producto_id)}
              </TableCell>
              <TableCell className="capitalize">{m.motivo_merma || "—"}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                {format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell className="text-center">
                <button onClick={() => openDesc(m)} className="rounded p-1 hover:bg-secondary">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </button>
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button className="rounded p-1 hover:bg-secondary">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="rounded p-1 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}