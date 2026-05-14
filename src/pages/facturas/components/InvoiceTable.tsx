import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Trash2, Play, Loader2 } from "lucide-react";
import { Invoice } from "../types";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import AuditWarnings from "./AuditWarnings";

interface Props {
  invoices: Invoice[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onProcess: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  processingIds?: Set<string>;
}

export default function InvoiceTable({
  invoices,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onProcess,
  onDelete,
  loading,
  processingIds,
}: Props) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
        Cargando facturas...
      </div>
    );
  }

  if (invoices.length === 0) return null;

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={invoices.length > 0 && selectedIds.size === invoices.length}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
            <TableHead className="w-28">Fecha</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="w-24">Folio</TableHead>
            <TableHead className="w-28">Categoría</TableHead>
            <TableHead className="w-28 text-right">Importe</TableHead>
            <TableHead className="w-24">Estado</TableHead>
            <TableHead className="w-20 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/facturas/${inv.id}`)}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(inv.id)}
                  onCheckedChange={() => onToggleSelect(inv.id)}
                />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("es-CL") : "-"}
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium truncate max-w-[200px]">
                  {inv.vendor_name || "-"}
                </div>
                {inv.audit_flags && inv.audit_flags.length > 0 && (
                  <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
                    <AuditWarnings warnings={inv.audit_flags} />
                  </div>
                )}
              </TableCell>
              <TableCell className="text-xs font-mono">{inv.invoice_number || "-"}</TableCell>
              <TableCell className="text-xs">{inv.category || "-"}</TableCell>
              <TableCell className="text-right text-sm font-medium tabular-nums">
                {inv.total_amount != null
                  ? `$${inv.total_amount.toLocaleString("es-CL")}`
                  : "-"}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge processed={inv.processed} confidence={inv.confidence_score} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/facturas/${inv.id}`)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {!inv.processed && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onProcess(inv.id)} disabled={processingIds?.has(inv.id)}>
                      {processingIds?.has(inv.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(inv.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
