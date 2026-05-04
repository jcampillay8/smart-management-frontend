// src/pages/Compras/CompraTable.tsx
import { Eye, Trash2, Clock, CheckCircle2, XCircle, Truck, PackageCheck, Pencil, RotateCcw, Share2, AlertTriangle, Hourglass } from "lucide-react";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { formatMoney } from "../../lib/format";
import { cn } from "../../lib/utils";
import { Compra, SubTab, ConfirmAction } from "./types";

interface CompraTableProps {
  compras: Compra[];
  subTab: SubTab;
  onView: (compra: Compra) => void;
  onEdit?: (compra: Compra) => void;
  onAction?: (action: ConfirmAction) => void;
  onShare?: (compra: Compra) => void;
  onDelete?: (id: string) => void;
  onIncidencia?: (compra: Compra) => void;
  isAdmin?: boolean;
}

function EstadoBadge({ compra }: { compra: Compra }) {
  const tiene_incidencia = (compra as any).tiene_incidencia;
  const pedido_realizado = (compra as any).pedido_realizado;

  if (tiene_incidencia) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 px-2 py-0.5 rounded-full">
        <AlertTriangle className="h-3 w-3" /> Con Incidencia
      </span>
    );
  }
  switch (compra.estado) {
    case "pendiente":
      return pedido_realizado
        ? <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-2 py-0.5 rounded-full"><Truck className="h-3 w-3" /> Realizado</span>
        : <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full"><Hourglass className="h-3 w-3" /> Pendiente</span>;
    case "realizada":
    case "recibida":
      return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" /> Recibida</span>;
    case "cancelada":
    case "canceladas":
      return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" /> Cancelada</span>;
    default:
      return <span className="text-xs text-muted-foreground capitalize">{compra.estado}</span>;
  }
}

export function CompraTable({ compras, subTab, onView, onEdit, onAction, onShare, onDelete, onIncidencia, isAdmin }: CompraTableProps) {
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
            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay compras.</td></tr>
          ) : (
            compras.map(c => {
              const tiene_incidencia = (c as any).tiene_incidencia;
              const isPedido = (c as any).pedido_realizado;
              return (
                <tr
                  key={c.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    tiene_incidencia && "bg-orange-50 dark:bg-orange-950/20",
                    !tiene_incidencia && subTab === "pendientes" && isPedido && "bg-purple-50 dark:bg-purple-950/20"
                  )}
                >
                  <td className="p-3">
                    <EstadoBadge compra={c} />
                  </td>
                  <td className="p-3 text-muted-foreground">{format(new Date(c.fecha), "dd/MM/yyyy")}</td>
                  <td className="p-3 font-medium">{c.proveedor || "Sin proveedor"}</td>
                  <td className="p-3 text-right font-bold">{formatMoney(c.total)}</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Botón naranja de incidencia */}
                      {tiene_incidencia && onIncidencia && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600" onClick={() => onIncidencia(c)}>
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      )}

                      {subTab === "pendientes" && onEdit && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {onAction && !isPedido && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-600" onClick={() => onAction({ kind: "pedido", id: c.id })}>
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                          {onAction && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => onAction({ kind: "ingresar", id: c.id })}>
                              <PackageCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {onAction && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => onAction({ kind: "cancel", id: c.id })}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}

                      {subTab === "realizadas" && onShare && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShare(c)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}

                      {subTab === "canceladas" && onAction && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => onAction({ kind: "restore", id: c.id })}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}

                      {onDelete && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

