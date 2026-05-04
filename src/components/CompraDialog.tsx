import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useBodega } from "@/hooks/useBodega";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Sparkles, ListChecks, Search, AlertTriangle, Calendar as CalIcon, Download, ChevronLeft, Mail } from "lucide-react";
import { buildMailto, interpolateTemplate, EmailVariables } from "../lib/email-templates";
import { NotasMenciones } from "./NotasMenciones";
import { toast } from "sonner";
import BodegaBadge from "@/components/BodegaBadge";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { format, addDays, differenceInDays } from "date-fns";
import { buildInventorySnapshot } from "@/lib/inventory";

interface Producto {
  id: string; nombre: string; unidad: string; costo_unitario: number;
  proveedor?: string | null; categoria_id: string;
}

interface CompraItemDraft {
  producto_id: string;
  producto_nombre: string;
  unidad: string;
  cantidad: string;
  precio_unitario: string;
  bodega_id: string | null;
  motivo?: string;
}

interface CompraDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  editingCompra?: any;
}

interface EmailTemplate {
  id: string;
  nombre: string;
  asunto: string;
  cuerpo: string;
}

type Step = "mode" | "manual" | "suggest_bodegas" | "suggest_review" | "review";

export default function CompraDialog({ open, onOpenChange, onSaved, editingCompra }: CompraDialogProps) {
  const { user } = useAuth();
  const { bodegas } = useBodega();
  const [step, setStep] = useState<Step>("mode");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [items, setItems] = useState<CompraItemDraft[]>([]);
  const [search, setSearch] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [selBodegas, setSelBodegas] = useState<Set<string>>(new Set());
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      setStep("mode");
      setItems([]);
      setSearch("");
      setProveedor("");
      setNotas("");
      setSelBodegas(new Set(bodegas.map(b => b.id)));
      loadProds();
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        api.get("/purchases/email-templates/"),
        api.get("/settings/users")
      ]);
      setTemplates(tRes.data || []);
      setUsers(uRes.data || []);
    } catch (e) {
      console.error("Error loading dialog data", e);
    }
  };

  const loadProds = async () => {
    try {
      const response = await api.get("/inventory/products");
      setProductos(response.data ?? []);
    } catch (error) {
      toast.error("Error al cargar productos");
    }
  };

  const filteredProds = useMemo(() => {
    if (!search.trim()) return productos.slice(0, 30);
    const q = search.toLowerCase();
    return productos.filter(p => p.nombre.toLowerCase().includes(q)).slice(0, 30);
  }, [productos, search]);

  const addProduct = (p: Producto, bodegaId: string | null = null, suggested?: number, motivo?: string) => {
    if (items.find(it => it.producto_id === p.id && it.bodega_id === bodegaId)) {
      toast.error("Producto ya agregado para esa bodega");
      return;
    }
    setItems(prev => [...prev, {
      producto_id: p.id,
      producto_nombre: p.nombre,
      unidad: p.unidad,
      cantidad: String(suggested ?? 1),
      precio_unitario: String(p.costo_unitario || 0),
      bodega_id: bodegaId,
      motivo,
    }]);
  };

  const updateItem = (idx: number, key: keyof CompraItemDraft, val: string | null) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  };

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const total = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0);

  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const buildSuggestions = async () => {
    if (selBodegas.size === 0) { toast.error("Selecciona al menos una bodega"); return; }
    setLoadingSuggest(true);
    try {
      const [regsRes, pbRes, evRes] = await Promise.all([
        api.get("/operations/history"),
        api.get("/inventory/product-bodega"),
        api.get("/operations/events"),
      ]);
      const records = (regsRes.data ?? []) as any[];
      const pb = (pbRes.data ?? []) as any[];
      const eventos = (evRes.data ?? []) as any[];
      const now = new Date();
      const draft: CompraItemDraft[] = [];

      for (const bId of Array.from(selBodegas)) {
        const snap = buildInventorySnapshot(records, now.toISOString(), bId);
        const pbInBodega = pb.filter(x => x.bodega_id === bId);
        for (const pbRow of pbInBodega) {
          const prod = productos.find(p => p.id === pbRow.producto_id);
          if (!prod) continue;
          const stock = snap.totalByProduct[prod.id] ?? 0;
          const minimo = pbRow.stock_minimo ?? 0;
          if (stock < minimo) {
            const sugg = Math.max(minimo * 2 - stock, 1);
            draft.push({
              producto_id: prod.id, producto_nombre: prod.nombre, unidad: prod.unidad,
              cantidad: String(Math.round(sugg * 100) / 100),
              precio_unitario: String(prod.costo_unitario || 0),
              bodega_id: bId, motivo: `Bajo stock mín. (${stock}/${minimo})`,
            });
          }
          const lots = snap.lotsByProduct[prod.id] ?? [];
          const expiringSoon = lots.find(l => l.fecha_vencimiento && differenceInDays(new Date(l.fecha_vencimiento + "T00:00:00"), now) <= 3 && l.cantidad > 0);
          if (expiringSoon && !draft.find(d => d.producto_id === prod.id && d.bodega_id === bId)) {
            draft.push({
              producto_id: prod.id, producto_nombre: prod.nombre, unidad: prod.unidad,
              cantidad: String(Math.max(minimo, 1)),
              precio_unitario: String(prod.costo_unitario || 0),
              bodega_id: bId, motivo: `Lote por vencer (rotar)`,
            });
          }
        }
        for (const ev of eventos) {
          const evDate = new Date(ev.fecha + "T00:00:00");
          if (evDate < now || differenceInDays(evDate, now) > 14) continue;
          for (const ep of (ev.evento_productos ?? [])) {
            if (ep.bodega_id && ep.bodega_id !== bId) continue;
            const prod = productos.find(p => p.id === ep.producto_id);
            if (!prod) continue;
            const stock = snap.totalByProduct[prod.id] ?? 0;
            const need = Number(ep.cantidad) || 0;
            if (stock < need) {
              const existing = draft.find(d => d.producto_id === prod.id && d.bodega_id === bId);
              const deficit = Math.max(need - stock, 1);
              if (existing) {
                existing.cantidad = String(Math.max(Number(existing.cantidad) || 0, deficit));
                existing.motivo = (existing.motivo ? existing.motivo + " + " : "") + `Evento "${ev.nombre}"`;
              } else {
                draft.push({
                  producto_id: prod.id, producto_nombre: prod.nombre, unidad: prod.unidad,
                  cantidad: String(deficit), precio_unitario: String(prod.costo_unitario || 0),
                  bodega_id: bId, motivo: `Evento "${ev.nombre}" requiere ${need}`,
                });
              }
            }
          }
        }
      }
      setItems(draft);
      setStep("suggest_review");
    } catch (error) {
      toast.error("Error al generar sugerencias");
    } finally {
      setLoadingSuggest(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return; }
    setSaving(true);
    try {
      const payload = {
        estado: "pendiente",
        fecha: format(new Date(), "yyyy-MM-dd"),
        total,
        proveedor: proveedor.trim() || null,
        notas: notas.trim() || null,
        items: items.map(it => ({
          producto_id: it.producto_id,
          bodega_id: it.bodega_id,
          cantidad: Number(it.cantidad) || 0,
          precio_unitario: Number(it.precio_unitario) || 0,
        }))
      };
      await api.post("/purchases/", payload);
      toast.success("Compra creada como pendiente");
      onOpenChange(false);
      onSaved?.();
    } catch (error: any) {
      toast.error("Error al guardar: " + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const downloadCSV = () => {
    const rows = [["Producto", "Bodega", "Cantidad", "Unidad", "Precio Unit.", "Subtotal", "Motivo"]];
    items.forEach(it => {
      const b = bodegas.find(x => x.id === it.bodega_id);
      rows.push([
        it.producto_nombre,
        b?.nombre ?? "—",
        it.cantidad,
        it.unidad,
        it.precio_unitario,
        String((Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0)),
        it.motivo ?? "",
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compra-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareList = async () => {
    const text = "Lista de compra:\n" + items.map(it => {
      const b = bodegas.find(x => x.id === it.bodega_id);
      return `• ${it.producto_nombre}: ${it.cantidad} ${it.unidad}${b ? ` (${b.nombre})` : ""}`;
    }).join("\n") + `\nTotal estimado: ${formatMoney(total)}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: "Lista de compra", text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Lista copiada al portapapeles");
    }
  };

  const handleSendEmail = () => {
    if (!selectedTemplate) {
      toast.error("Selecciona una plantilla de email");
      return;
    }
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const itemsSummary = items.map(it => `- ${it.producto_nombre}: ${it.cantidad} ${it.unidad}`).join("\n");
    
    const restName = document.querySelector('[title="EasyStock"]')?.textContent || "EasyStock";

    const vars: EmailVariables = {
      restaurante_nombre: restName,
      proveedor_nombre: proveedor || "Proveedor",
      compra_id: "NUEVA",
      total: formatMoney(total),
      items_resumen: itemsSummary
    };

    const subject = interpolateTemplate(template.asunto, vars);
    const body = interpolateTemplate(template.cuerpo, vars);
    
    const mailto = buildMailto(subject, body);
    window.open(mailto, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step !== "mode" && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(step === "review" ? (items.some(i => i.motivo) ? "suggest_review" : "manual") : "mode")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {step === "mode" && "Nueva compra"}
            {step === "manual" && "Compra manual"}
            {step === "suggest_bodegas" && "Sugerencia automática"}
            {step === "suggest_review" && "Sugerencias generadas"}
            {step === "review" && "Confirmar compra"}
          </DialogTitle>
        </DialogHeader>

        {step === "mode" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setStep("manual")}
              className="rounded-lg border-2 p-6 hover:border-primary hover:bg-accent/50 transition-all text-left space-y-2"
            >
              <ListChecks className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">Manual</h3>
              <p className="text-xs text-muted-foreground">Selecciona productos y cantidades a comprar.</p>
            </button>
            <button
              onClick={() => setStep("suggest_bodegas")}
              className="rounded-lg border-2 p-6 hover:border-primary hover:bg-accent/50 transition-all text-left space-y-2"
            >
              <Sparkles className="h-8 w-8 text-purple-500" />
              <h3 className="font-semibold">Sugerencia automática</h3>
              <p className="text-xs text-muted-foreground">El sistema analiza stock, eventos y vencimientos.</p>
            </button>
          </div>
        )}

        {step === "manual" && (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            {search && (
              <div className="max-h-40 overflow-y-auto rounded-md border">
                {filteredProds.map(p => (
                  <button key={p.id} onClick={() => { addProduct(p); setSearch(""); }} className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-accent text-left">
                    <span>{p.nombre}</span>
                    <span className="text-xs text-muted-foreground">{formatMoney(p.costo_unitario)} / {p.unidad}</span>
                  </button>
                ))}
              </div>
            )}
            <ItemsList items={items} bodegas={bodegas} updateItem={updateItem} removeItem={removeItem} total={total} />
            <Button onClick={() => setStep("review")} disabled={items.length === 0} className="w-full">Continuar</Button>
          </div>
        )}

        {step === "suggest_bodegas" && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">¿Qué bodegas necesitas reponer?</p>
            <div className="space-y-2">
              {bodegas.map(b => (
                <label key={b.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-accent/50 cursor-pointer">
                  <Checkbox checked={selBodegas.has(b.id)} onCheckedChange={(v) => {
                    setSelBodegas(prev => { const n = new Set(prev); if (v) n.add(b.id); else n.delete(b.id); return n; });
                  }} />
                  <BodegaBadge nombre={b.nombre} color={(b as any).color} icono={(b as any).icono} />
                </label>
              ))}
            </div>
            <Button onClick={buildSuggestions} disabled={loadingSuggest || selBodegas.size === 0} className="w-full gap-1">
              <Sparkles className="h-4 w-4" /> {loadingSuggest ? "Analizando..." : "Generar sugerencias"}
            </Button>
          </div>
        )}

        {step === "suggest_review" && (
          <div className="space-y-3 pt-2">
            {items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No hay sugerencias por el momento. Tu stock está saludable.</p>
            ) : (
              <ItemsList items={items} bodegas={bodegas} updateItem={updateItem} removeItem={removeItem} total={total} showMotivo />
            )}
            <Button onClick={() => setStep("review")} disabled={items.length === 0} className="w-full">Continuar</Button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Proveedor (opcional)</Label>
              <Input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Ej: Distribuidora..." />
            </div>
            <div className="space-y-1">
              <Label>Notas (opcional)</Label>
              <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Comentarios..." />
            </div>
            <ItemsList items={items} bodegas={bodegas} updateItem={updateItem} removeItem={removeItem} total={total} showMotivo />
            
            <div className="space-y-1 pt-2 border-t">
              <Label className="text-xs">Enviar pedido por Correo (Opcional)</Label>
              <div className="flex gap-2">
                <Select value={selectedTemplate || ""} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar plantilla..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleSendEmail} disabled={!selectedTemplate} className="gap-1">
                  <Mail className="h-4 w-4" /> Enviar
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
               <NotasMenciones 
                  notas={(editingCompra as any)?.notas || []} 
                  usuarios={users.map(u => ({ id: u.guid, nombre: u.username, avatar_url: u.avatar_url }))}
                  onAddNota={(content) => {
                    toast.info("Nota registrada (Local): " + content);
                  }}
               />
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-1"><Download className="h-3.5 w-3.5" /> Descargar</Button>
              <Button variant="outline" size="sm" onClick={shareList} className="gap-1">Compartir</Button>
              <Button onClick={handleSave} disabled={saving} className="ml-auto">{saving ? "Guardando..." : "Guardar como pendiente"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ItemsList({ items, bodegas, updateItem, removeItem, total, showMotivo }: {
  items: CompraItemDraft[];
  bodegas: { id: string; nombre: string }[];
  updateItem: (idx: number, key: keyof CompraItemDraft, val: string | null) => void;
  removeItem: (idx: number) => void;
  total: number;
  showMotivo?: boolean;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Sin productos.</p>;
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div key={idx} className="rounded-md border p-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm flex-1">{it.producto_nombre}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          {showMotivo && it.motivo && (
            <div className="flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{it.motivo}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-1.5 items-end">
            <div>
              <Label className="text-[10px]">Cantidad</Label>
              <Input type="number" min="0" step="any" value={it.cantidad} onChange={e => updateItem(idx, "cantidad", e.target.value)} onFocus={e => e.target.select()} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px]">Precio Unit.</Label>
              <Input type="number" min="0" step="any" value={it.precio_unitario} onChange={e => updateItem(idx, "precio_unitario", e.target.value)} onFocus={e => e.target.select()} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px]">Bodega destino</Label>
              <Select value={it.bodega_id ?? "_none"} onValueChange={v => updateItem(idx, "bodega_id", v === "_none" ? null : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin bodega</SelectItem>
                  {bodegas.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {it.bodega_id && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <BodegaBadge 
                nombre={bodegas.find(b => b.id === it.bodega_id)?.nombre ?? ""} 
                color={(bodegas.find(b => b.id === it.bodega_id) as any)?.color} 
                icono={(bodegas.find(b => b.id === it.bodega_id) as any)?.icono} 
              />
              <span>Subtotal: <strong className="text-foreground">{formatMoney((Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0))}</strong></span>
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-between border-t pt-2 text-sm font-bold">
        <span>Total estimado</span>
        <span>{formatMoney(total)}</span>
      </div>
    </div>
  );
}
