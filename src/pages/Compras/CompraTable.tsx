// src/pages/Compras/CompraTable.tsx
import { Eye, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { formatMoney } from "../../lib/format";
import { cn } from "../../lib/utils";
import { Compra } from "./types";

interface CompraTableProps {
  compras: Compra[];
  onView: (compra: Compra) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export function CompraTable({ compras, onView, onDelete, isAdmin }: CompraTableProps) {
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "realizada": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "pendiente": return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
          <tr>
            <th className="p-3">Estado</th>
            <th className="p-3">Fecha</th>
            <th className="p-3">Proveedor</th>
            <th className="p-3 text-right">Total</th>
            <th className="p-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {compras.length === 0 ? (
            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay compras en esta categoría.</td></tr>
          ) : (
            compras.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2 capitalize">
                    {getStatusIcon(c.estado)} {c.estado}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{format(new Date(c.fecha), "dd/MM/yyyy")}</td>
                <td className="p-3 font-medium">{c.proveedor || "Sin proveedor"}</td>
                <td className="p-3 text-right font-bold">{formatMoney(c.total)}</td>
                <td className="p-3">
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(c)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}