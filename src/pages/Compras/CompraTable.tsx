// src/pages/Compras/CompraTable.tsx
import { Eye, Trash2, Clock, CheckCircle2, XCircle, Truck, PackageCheck, Pencil, RotateCcw, Share2 } from "lucide-react";
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
  isAdmin?: boolean;
}

export function CompraTable({ compras, subTab, onView, onEdit, onAction, onShare, onDelete, isAdmin }: CompraTableProps) {
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
            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay compras.</td></tr>
          ) : (
            compras.map(c => {
              const isPedido = (c as any).pedido_realizado;
              return (
                <tr 
                  key={c.id} 
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    subTab === "pendientes" && isPedido && "bg-purple-50 dark:bg-purple-950/20"
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2 capitalize">
                      {getStatusIcon(c.estado)}
                      {c.estado}
                      {isPedido && <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full">Pedido</span>}
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