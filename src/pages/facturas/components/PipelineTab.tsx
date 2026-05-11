import { useState } from "react";
import { Play, CheckCircle, Clock, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Invoice } from "../types";
import InvoiceUploader from "./InvoiceUploader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  invoices: Invoice[];
  loading: boolean;
  onUpload: (files: File[]) => Promise<any>;
  onProcess: (id: string) => void;
  processingIds?: Set<string>;
}

export default function PipelineTab({ invoices, loading, onUpload, onProcess, processingIds }: Props) {
  const pending = invoices.filter((i) => !i.processed);
  const processed = invoices.filter((i) => i.processed);

  return (
    <div className="space-y-6">
      <InvoiceUploader onUpload={onUpload} />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Cola de Procesamiento
          {pending.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({pending.length} pendiente(s))
            </span>
          )}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Cargando...
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border rounded-xl">
            <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
            <p className="text-sm font-medium">No hay facturas pendientes</p>
            <p className="text-xs text-muted-foreground mt-1">
              Todas las facturas han sido procesadas
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {pending.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card"
              >
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {inv.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.created_at
                      ? new Date(inv.created_at).toLocaleString("es-CL")
                      : "Recién subido"}
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onProcess(inv.id)}
                  disabled={processingIds?.has(inv.id)}
                >
                  {processingIds?.has(inv.id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  {processingIds?.has(inv.id) ? "Procesando..." : "Procesar"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {processed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Procesados Recientemente
          </h3>
          <div className="space-y-1.5">
            {processed.slice(0, 10).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {inv.vendor_name || inv.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {inv.invoice_number || "Sin folio"} — Confianza:{" "}
                    {inv.confidence_score != null
                      ? `${(inv.confidence_score * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                </div>
                {inv.audit_flags && inv.audit_flags.length > 0 && (
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
