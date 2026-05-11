import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Play, Trash2, Eye, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Invoice, LineItem } from "./types";
import { facturasApi } from "./facturasApi";
import InvoiceStatusBadge from "./components/InvoiceStatusBadge";
import AuditWarnings from "./components/AuditWarnings";
import LineItemsEditor from "./components/LineItemsEditor";
import InvoicePreview from "./components/InvoicePreview";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    facturasApi.getById(id)
      .then((data) => setInvoice(data.invoice || data))
      .catch((e) => {
        toast.error("Error al cargar factura");
        navigate("/facturas");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleProcess = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      const data = await facturasApi.process(id);
      if (data.invoice) setInvoice(data.invoice);
      toast.success(data.message || "Factura procesada");
    } catch (e: any) {
      toast.error("Error al procesar: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!id || !invoice) return;
    setSaving(true);
    try {
      const data = await facturasApi.update(id, {
        vendor_name: invoice.vendor_name,
        vendor_tax_id: invoice.vendor_tax_id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        total_amount: invoice.total_amount,
        tax_amount: invoice.tax_amount,
        currency: invoice.currency,
        transaction_type: invoice.transaction_type,
        category: invoice.category,
        description: invoice.description,
        line_items: invoice.line_items,
      });
      if (data.invoice) setInvoice(data.invoice);
      toast.success("Factura actualizada");
    } catch (e: any) {
      toast.error("Error al guardar: " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("¿Eliminar esta factura?")) return;
    try {
      await facturasApi.delete(id);
      toast.success("Factura eliminada");
      navigate("/facturas");
    } catch (e: any) {
      toast.error("Error al eliminar");
    }
  };

  const updateField = (field: string, value: any) => {
    if (!invoice) return;
    setInvoice({ ...invoice, [field]: value });
  };

  const updateLineItems = (items: LineItem[]) => {
    if (!invoice) return;
    setInvoice({ ...invoice, line_items: items });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/facturas")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold truncate max-w-md">
            {invoice.vendor_name || invoice.filename}
          </h1>
          <InvoiceStatusBadge processed={invoice.processed} confidence={invoice.confidence_score} />
        </div>
        <div className="flex items-center gap-2">
          {invoice.file_type && (
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Vista Previa
            </Button>
          )}
          {!invoice.processed && (
            <Button variant="default" size="sm" onClick={handleProcess} disabled={processing} className="gap-1.5">
              {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {processing ? "Procesando..." : "Procesar"}
            </Button>
          )}
          <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </Button>
        </div>
      </div>

      {invoice.audit_flags && invoice.audit_flags.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-xs">Alertas de auditoría</span>
            <AuditWarnings warnings={invoice.audit_flags} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Proveedor">
            <input
              value={invoice.vendor_name || ""}
              onChange={(e) => updateField("vendor_name", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            />
          </Field>
          <Field label="RUT">
            <input
              value={invoice.vendor_tax_id || ""}
              onChange={(e) => updateField("vendor_tax_id", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            />
          </Field>
          <Field label="Folio">
            <input
              value={invoice.invoice_number || ""}
              onChange={(e) => updateField("invoice_number", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            />
          </Field>
          <Field label="Fecha">
            <input
              type="date"
              value={invoice.invoice_date?.split("T")[0] || ""}
              onChange={(e) => updateField("invoice_date", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="Tipo">
            <select
              value={invoice.transaction_type || ""}
              onChange={(e) => updateField("transaction_type", e.target.value || null)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            >
              <option value="">Seleccionar...</option>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </Field>
          <Field label="Categoría">
            <input
              value={invoice.category || ""}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            />
          </Field>
          <Field label="Moneda">
            <input
              value={invoice.currency || "CLP"}
              onChange={(e) => updateField("currency", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            />
          </Field>
          <Field label="Total">
            <input
              type="number"
              value={invoice.total_amount ?? ""}
              onChange={(e) => updateField("total_amount", e.target.value ? Number(e.target.value) : null)}
              className="w-full h-9 px-3 rounded-lg border text-sm bg-background"
            />
          </Field>
        </div>
      </div>

      <Field label="Descripción">
        <textarea
          value={invoice.description || ""}
          onChange={(e) => updateField("description", e.target.value)}
          className="w-full h-20 px-3 py-2 rounded-lg border text-sm bg-background resize-none"
        />
      </Field>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Líneas de Producto</h3>
        <div className="rounded-xl border p-4">
          <LineItemsEditor items={invoice.line_items || []} onChange={updateLineItems} />
        </div>
      </div>

      <InvoicePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoiceId={invoice.id}
        fileType={invoice.file_type}
        filename={invoice.filename}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
