// src/pages/Compras/IncidenciaDialog.tsx
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { AlertTriangle, Clock, MinusCircle, PackageX, XCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";
import { toast } from "sonner";
import { buildMailto, interpolateTemplate, EmailVariables } from "../../lib/email-templates";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Label } from "../../components/ui/label";

export interface IncidenciaOption {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const OPTIONS: IncidenciaOption[] = [
  {
    key: "ingresar_mas_tarde",
    label: "Ingresar más tarde",
    description: "Dejar pendiente. Se registrará la incidencia pero el stock no se modifica ahora.",
    icon: Clock,
    color: "border-amber-500 text-amber-600",
  },
  {
    key: "descontar_pedido",
    label: "Descontar del pedido",
    description: "Ajustar el pedido a la cantidad realmente recibida y notificar al proveedor.",
    icon: MinusCircle,
    color: "border-blue-500 text-blue-600",
  },
  {
    key: "pedido_completo_luego",
    label: "Pedido completo más tarde",
    description: "El proveedor enviará el resto de la mercadería en otro despacho.",
    icon: PackageX,
    color: "border-purple-500 text-purple-600",
  },
  {
    key: "rechazar",
    label: "Rechazar pedido",
    description: "Devolver todo el pedido al proveedor y cancelar la compra.",
    icon: XCircle,
    color: "border-destructive text-destructive",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  compraId: string;
  proveedorEmail?: string;
  proveedorNombre?: string;
  total?: number;
  onResolved: () => void;
}

interface EmailTemplate {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
}

export function IncidenciaDialog({ open, onOpenChange, compraId, proveedorEmail, proveedorNombre, total, onResolved }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const res = await api.get("/purchases/email-templates/");
      setTemplates(res.data || []);
    } catch (e) {
      console.error("Error loading templates", e);
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/purchases/${compraId}/incidencia`, {
        tipo: selected,
        titulo: OPTIONS.find(o => o.key === selected)?.label || selected,
        detalle: { opcion: selected },
      });

      if (selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          const restName = document.querySelector('[title="EasyStock"]')?.textContent || "EasyStock";
          const vars: Partial<EmailVariables> = {
            restaurante_nombre: restName,
            proveedor_nombre: proveedorNombre || "Proveedor",
            compra_id: compraId.slice(0, 8),
            total: total ? `$${total.toLocaleString("es-CL")}` : "$0",
            items_resumen: `Incidencia: ${OPTIONS.find(o => o.key === selected)?.label}`
          };

          const subject = interpolateTemplate(template.asunto, vars);
          const body = interpolateTemplate(template.cuerpo, vars);
          const mailto = buildMailto(subject, body, proveedorEmail);
          window.open(mailto, "_blank");
        }
      } else if (selected === "descontar_pedido" || selected === "rechazar") {
        const body = selected === "rechazar"
          ? `Estimado/a ${proveedorNombre || "proveedor"},\n\nLamentablemente debemos rechazar el pedido recibido. Por favor coordinar la devolución.\n\nSaludos.`
          : `Estimado/a ${proveedorNombre || "proveedor"},\n\nSe ha detectado una diferencia de cantidad en el pedido recibido. Solicitamos el ajuste correspondiente.\n\nSaludos.`;

        const mailto = buildMailto(
          "Incidencia en pedido",
          body,
          proveedorEmail
        );
        window.open(mailto, "_blank");
      }

      toast.success("Incidencia registrada correctamente");
      onResolved();
      onOpenChange(false);
    } catch (e) {
      toast.error("Error al registrar la incidencia");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" /> Resolver Incidencia
          </DialogTitle>
          <DialogDescription>
            Se detectó una diferencia entre la cantidad pedida y la recibida. Elige cómo proceder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all",
                selected === opt.key
                  ? `${opt.color} bg-current/5`
                  : "border-border hover:border-muted-foreground/50"
              )}
            >
              <opt.icon className={cn("h-5 w-5 mt-0.5 shrink-0", selected === opt.key ? "" : "text-muted-foreground")} />
              <div className="min-w-0">
                <p className={cn("font-semibold text-sm", selected === opt.key ? "" : "text-foreground")}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {templates.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <Label className="text-xs">Usar plantilla de email (Opcional)</Label>
            <Select value={selectedTemplate || ""} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin plantilla (usar predeterminada)</SelectItem>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!selected || saving}
            onClick={handleConfirm}
          >
            {saving ? "Procesando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
