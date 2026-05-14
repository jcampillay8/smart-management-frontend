import { Play, Download, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportFormat } from "../types";
import ExportDropdown from "./ExportDropdown";

interface Props {
  selectedCount: number;
  onProcess: () => void;
  onExport: (format: ExportFormat) => void;
  onWebhook: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export default function BulkActionsBar({
  selectedCount,
  onProcess,
  onExport,
  onWebhook,
  onDelete,
  disabled,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card border shadow-lg">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        {selectedCount} factura(s) seleccionada(s)
      </span>

      <div className="w-px h-6 bg-border mx-1" />

      <Button variant="default" size="sm" onClick={onProcess} disabled={disabled} className="gap-1.5">
        <Play className="h-3.5 w-3.5" /> Procesar
      </Button>

      <ExportDropdown onExport={onExport} disabled={disabled} />

      <Button variant="outline" size="sm" onClick={onWebhook} disabled={disabled} className="gap-1.5">
        <Send className="h-3.5 w-3.5" /> Webhook
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button variant="destructive" size="sm" onClick={onDelete} disabled={disabled} className="gap-1.5">
        <Trash2 className="h-3.5 w-3.5" /> Eliminar
      </Button>
    </div>
  );
}
