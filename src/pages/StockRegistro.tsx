import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBodega } from "../hooks/useBodega";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { toast } from "sonner";
import { Search, Save, AlertTriangle, ClipboardList, Settings2, Plus, Trash2, CalendarIcon, ArrowLeftRight, PackagePlus } from "lucide-react";
import { cn } from "../lib/utils";
import { format, differenceInDays } from "date-fns";
import { buildInventorySnapshot, type InventoryMovementRecord } from "../lib/inventory";
import BodegaSelector from "../components/BodegaSelector";
import BodegaBadge from "../components/BodegaBadge";

interface Categoria { id: string; nombre: string }
interface Producto { id: string; nombre: string; categoria_id: string; unidad: string; stock_minimo: number }

interface ExpiryEntry { fecha_vencimiento: string; cantidad: string }

interface StockEntry {
  cantidad: string;
  fecha_recuento: string;
  fecha_vencimiento: string;
  multiExpiry: boolean;
  expiryEntries: ExpiryEntry[];
}

const MOTIVOS_MERMA = [
  { value: "vencimiento", label: "Vencimiento" },
  { value: "daño", label: "Daño" },
  { value: "error", label: "Error" },
  { value: "otro", label: "Otro" },
];

export default function StockRegistro() {
  const { user, isAdmin, isSupervisor, hasMermaPermission } = useAuth();
  const { selectedBodegaId, setSelectedBodegaId, activeBodegaIdForInsert, bodegas } = useBodega();
  const navigate = useNavigate();
  const location = useLocation();
  const isViewingAll = selectedBodegaId === "all";
  const canEditInventory = (isAdmin || isSupervisor) && !isViewingAll;
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [entries, setEntries] = useState<Record<string, StockEntry>>({});
  const [initialEntries, setInitialEntries] = useState<string>(""); 
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [busqueda, setBusqueda] = useState("");
  const [saving, setSaving] = useState(false);
  const [mermaMenuOpen, setMermaMenuOpen] = useState(false);
  const [mermaDialogOpen, setMermaDialogOpen] = useState(false);
  const [motivoMerma, setMotivoMerma] = useState("");
  const [mermaProducto, setMermaProducto] = useState("");
  const [mermaCantidad, setMermaCantidad] = useState("");
  const [mermaFechaVencimiento, setMermaFechaVencimiento] = useState("");
  const [mermaDescripcion, setMermaDescripcion] = useState("");
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [mermaBodega, setMermaBodega] = useState("");
  const [mermaProductStock, setMermaProductStock] = useState<number | null>(null);
  const [mermaLotDates, setMermaLotDates] = useState<string[]>([]);
  const [mermaAllLots, setMermaAllLots] = useState<{ fecha_vencimiento: string; cantidad: number }[]>([]);

  // Add stock dialog
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [addStockBodega, setAddStockBodega] = useState("");
  const [addStockProducto, setAddStockProducto] = useState("");
  const [addStockCantidad, setAddStockCantidad] = useState("");
  const [addStockFechaRecuento, setAddStockFechaRecuento] = useState(new Date().toISOString().split("T")[0]);
  const [addStockFechaVencimiento, setAddStockFechaVencimiento] = useState("");

  const [productoBodegas, setProductoBodegas] = useState<{ producto_id: string; bodega_id: string; stock_minimo: number }[]>([]);

  // Transfer state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  interface TransferItem {
    producto_id: string;
    cantidad: string;
    fecha_vencimiento: string;
  }
  const [transferItems, setTransferItems] = useState<TransferItem[]>([{ producto_id: "", cantidad: "", fecha_vencimiento: "" }]);
  const [transferOrigen, setTransferOrigen] = useState("");
  const [transferDestino, setTransferDestino] = useState("");

  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  interface DuplicateInfo {
    prodId: string;
    prodName: string;
    fecha_vencimiento: string;
    indices: number[];
    totalQty: number;
  }
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const INVARIANT_UNITS = new Set(["kg", "g", "mg", "L", "mL"]);
  const pluralizeUnit = (unit: string, qty: number): string => {
    if (INVARIANT_UNITS.has(unit)) return unit;
    if (qty === 1) return unit;
    if (unit.endsWith("dad") || unit.endsWith("ción") || unit.endsWith("sión")) return unit + "es";
    if (unit === "unidad") return "unidades";
    if (unit.endsWith("z")) return unit.slice(0, -1) + "ces";
    if (unit.match(/[aeiou]$/)) return unit + "s";
    return unit + "es";
  };

  const getExpiryDaysLines = (entry: StockEntry, unidad: string): { text: string; className: string }[] => {
    if (entry.multiExpiry) {
      return entry.expiryEntries
        .filter(e => e.fecha_vencimiento)
        .map(e => {
          const days = differenceInDays(new Date(e.fecha_vencimiento + "T00:00:00"), new Date(today + "T00:00:00"));
          const qty = Number(e.cantidad) || 0;
          const unitStr = pluralizeUnit(unidad, qty);
          const className = days <= 0 ? "text-destructive" : days <= 5 ? "text-amber-600" : "text-muted-foreground";
          const text = days <= 0
            ? `${qty} ${unitStr} vencidos`
            : `${qty} ${unitStr} vencen en ${days} días`;
          return { text, className };
        });
    }
    const date = entry.fecha_vencimiento;
    if (!date) return [];
    const days = differenceInDays(new Date(date + "T00:00:00"), new Date(today + "T00:00:00"));
    const className = days <= 0 ? "text-destructive" : days <= 5 ? "text-amber-600" : "text-muted-foreground";
    const text = days <= 0 ? "Vencido" : `Vence en ${days} días`;
    return [{ text, className }];
  };

  const isDirty = useCallback(() => {
    if (!initialEntries) return false;
    return JSON.stringify(entries) !== initialEntries;
  }, [entries, initialEntries]);

  useEffect(() => { loadData(); }, [selectedBodegaId]);

  useEffect(() => {
    const state = location.state as any;
    if (!state) return;
    if (state.switchBodega) {
      const targetBodega = bodegas.find(b => b.id === state.switchBodega);
      if (targetBodega) setSelectedBodegaId(state.switchBodega);
    }
    if (state.highlightProducts && Array.isArray(state.highlightProducts)) {
      const productNames = state.highlightProducts
        .map((id: string) => productos.find(p => p.id === id)?.nombre)
        .filter(Boolean);
      if (productNames.length === 1) setBusqueda(productNames[0]);
      else if (productNames.length > 1) {
        setFiltroCategoria("all");
        setBusqueda("");
        setHighlightedIds(new Set(state.highlightProducts));
      }
      window.history.replaceState({}, document.title);
    }
    if (state.openMerma && state.mermaProducts) {
      const mermaProds = state.mermaProducts;
      if (mermaProds.length > 0) {
        const first = mermaProds[0];
        setMermaProducto(first.id);
        setMermaCantidad(String(first.cantidad));
        setMotivoMerma("vencimiento");
        if (first.fecha_vencimiento) setMermaFechaVencimiento(first.fecha_vencimiento);
        setMermaDialogOpen(true);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, productos]);

  useEffect(() => {
    if (!mermaProducto || !mermaBodega) { setMermaProductStock(null); setMermaLotDates([]); setMermaAllLots([]); return; }
    (async () => {
      try {
        const res = await api.get(`/inventory/history/?producto_id=${mermaProducto}&bodega_id=${mermaBodega}`);
        const data = res.data;
        const snapshot = buildInventorySnapshot(data as InventoryMovementRecord[], undefined, mermaBodega);
        setMermaProductStock(snapshot.totalByProduct[mermaProducto] ?? 0);
        const lots = snapshot.lotsByProduct[mermaProducto] ?? [];
        setMermaAllLots(lots.filter(l => l.cantidad > 0));
        setMermaLotDates(lots.filter(l => l.fecha_vencimiento && l.fecha_vencimiento <= today && l.cantidad > 0).map(l => l.fecha_vencimiento));
      } catch (e) {
        console.error("Error loading merma product data", e);
      }
    })();
  }, [mermaProducto, mermaBodega]);

  const [productBodegaMap, setProductBodegaMap] = useState<Record<string, Set<string>>>({});

  const loadData = async () => {
    try {
      const [catRes, prodRes, recordsRes, bodRes] = await Promise.all([
        api.get("/inventory/categories"),
        api.get("/inventory/products"),
        api.get("/inventory/history/"), // Need to ensure this gets enough records
        api.get("/inventory/bodegas"),
      ]);

      setCategorias(catRes.data);
      setProductos(prodRes.data);
      
      // Map products to bodegas (using bodegas_config from products)
      const pbMap: Record<string, Set<string>> = {};
      prodRes.data.forEach((p: any) => {
        pbMap[p.id] = new Set(p.bodegas_config?.map((bc: any) => bc.bodega_id) || []);
      });
      setProductBodegaMap(pbMap);

      const allRecords = recordsRes.data as InventoryMovementRecord[];
      const loadedBodegas = bodRes.data;

      const init: Record<string, StockEntry> = {};
      if (selectedBodegaId === "all") {
        for (const bodega of loadedBodegas) {
          const snapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), bodega.id);
          prodRes.data.forEach((p: Producto) => {
            const lots = (snapshot.lotsByProduct[p.id] ?? []).filter(l => l.cantidad > 0);
            if (lots.length === 0) return;
            const hasMulti = lots.length > 1;
            const firstLot = lots[0];
            init[`${p.id}::${bodega.id}`] = {
              cantidad: !hasMulti && firstLot ? String(firstLot.cantidad) : "",
              fecha_recuento: today,
              fecha_vencimiento: !hasMulti && firstLot ? firstLot.fecha_vencimiento : "",
              multiExpiry: hasMulti,
              expiryEntries: hasMulti
                ? lots.map((lot) => ({ fecha_vencimiento: lot.fecha_vencimiento, cantidad: String(lot.cantidad) }))
                : [],
            };
          });
        }
      } else {
        const snapshot = buildInventorySnapshot(allRecords, new Date().toISOString(), selectedBodegaId);
        prodRes.data.forEach((p: Producto) => {
          const lots = (snapshot.lotsByProduct[p.id] ?? []).filter(l => l.cantidad > 0);
          const hasMulti = lots.length > 1;
          const firstLot = lots[0];
          init[p.id] = {
            cantidad: !hasMulti && firstLot ? String(firstLot.cantidad) : "",
            fecha_recuento: today,
            fecha_vencimiento: !hasMulti && firstLot ? firstLot.fecha_vencimiento : "",
            multiExpiry: hasMulti,
            expiryEntries: hasMulti
              ? lots.map((lot) => ({ fecha_vencimiento: lot.fecha_vencimiento, cantidad: String(lot.cantidad) }))
              : [],
          };
        });
      }

      setEntries(init);
      setInitialEntries(JSON.stringify(init));
    } catch (error) {
      toast.error("Error al cargar datos");
    }
  };

  const updateEntry = (prodId: string, field: keyof StockEntry, value: any) => {
    setEntries((prev) => ({ ...prev, [prodId]: { ...prev[prodId], [field]: value } }));
  };

  const toggleMultiExpiry = (prodId: string, checked: boolean) => {
    setEntries((prev) => {
      const entry = prev[prodId];
      return {
        ...prev,
        [prodId]: {
          ...entry,
          multiExpiry: checked,
          expiryEntries: checked && entry.expiryEntries.length === 0
            ? [{ fecha_vencimiento: entry.fecha_vencimiento || "", cantidad: entry.cantidad || "" }]
            : entry.expiryEntries,
        },
      };
    });
  };

  const addExpiryEntry = (prodId: string) => {
    setEntries((prev) => ({
      ...prev,
      [prodId]: { ...prev[prodId], expiryEntries: [...prev[prodId].expiryEntries, { fecha_vencimiento: "", cantidad: "" }] },
    }));
  };

  const removeExpiryEntry = (prodId: string, idx: number) => {
    setEntries((prev) => ({
      ...prev,
      [prodId]: { ...prev[prodId], expiryEntries: prev[prodId].expiryEntries.filter((_, i) => i !== idx) },
    }));
  };

  const updateExpiryEntry = (prodId: string, idx: number, field: keyof ExpiryEntry, value: string) => {
    setEntries((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        expiryEntries: prev[prodId].expiryEntries.map((e, i) => i === idx ? { ...e, [field]: value } : e),
      },
    }));
  };

  type DisplayProduct = Producto & { _entryKey: string; _bodegaName?: string };

  const filteredProducts: DisplayProduct[] = (() => {
    let items: DisplayProduct[];
    if (isViewingAll) {
      items = [];
      Object.keys(entries).forEach(key => {
        if (!key.includes("::")) return;
        const [prodId, bodegaId] = key.split("::");
        const prod = productos.find(p => p.id === prodId);
        if (!prod) return;
        const bodega = bodegas.find(b => b.id === bodegaId);
        items.push({ ...prod, _entryKey: key, _bodegaName: bodega?.nombre ?? "" });
      });
    } else {
      items = productos
        .filter(p => {
          const bodegaSet = productBodegaMap[p.id];
          if (!bodegaSet || !bodegaSet.has(selectedBodegaId)) return false;
          return true;
        })
        .map(p => ({ ...p, _entryKey: p.id }));
    }
    return items.filter(p => {
      if (filtroCategoria !== "all" && p.categoria_id !== filtroCategoria) return false;
      if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  })();

  const groupedProducts = categorias
    .map((c) => ({ ...c, productos: filteredProducts.filter((p) => p.categoria_id === c.id) }))
    .filter((c) => c.productos.length > 0);

  const buildAndSaveRecords = async (data: Record<string, StockEntry>) => {
    if (!user) return;
    setSaving(true);
    const movements: any[] = [];
    Object.entries(data).forEach(([prodId, e]) => {
      const realProdId = prodId.split("::")[0];
      const realBodegaId = prodId.split("::")[1] || activeBodegaIdForInsert;
      
      if (e.multiExpiry && e.expiryEntries.length > 0) {
        e.expiryEntries.forEach((exp) => {
          if (exp.cantidad === "") return;
          movements.push({
            producto_id: realProdId, cantidad: Number(exp.cantidad), fecha_recuento: e.fecha_recuento || today,
            fecha_vencimiento: exp.fecha_vencimiento || null, tipo_movimiento: "conteo",
            bodega_id: realBodegaId,
          });
        });
      } else {
        if (e.cantidad === "") return;
        movements.push({
          producto_id: realProdId, cantidad: Number(e.cantidad), fecha_recuento: e.fecha_recuento || today,
          fecha_vencimiento: e.fecha_vencimiento || null, tipo_movimiento: "conteo",
          bodega_id: realBodegaId,
        });
      }
    });

    try {
      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Cambios guardados exitosamente");
      loadData();
    } catch (error) {
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!canEditInventory) { toast.error("No tienes permiso para modificar el inventario."); return; }
    if (!isDirty()) { toast.info("No hay cambios para guardar"); return; }
    await buildAndSaveRecords(entries);
  };

  const confirmMerma = async () => {
    if (!mermaBodega || !motivoMerma || !mermaProducto || !mermaCantidad || Number(mermaCantidad) <= 0) {
      toast.error("Completa todos los campos obligatorios"); return;
    }
    setSaving(true);
    try {
      await api.post("/inventory/stock/bulk-movements", {
        movements: [{
          producto_id: mermaProducto, cantidad: Number(mermaCantidad), fecha_recuento: today,
          fecha_vencimiento: mermaFechaVencimiento || null, tipo_movimiento: "merma",
          motivo_merma: motivoMerma, descripcion_merma: mermaDescripcion || null,
          bodega_id: mermaBodega,
        }]
      });
      toast.success("Merma registrada");
      setMermaDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Error al registrar merma");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStock = async () => {
    if (!addStockBodega || !addStockProducto || !addStockCantidad || Number(addStockCantidad) <= 0) {
      toast.error("Completa todos los campos"); return;
    }
    try {
      await api.post("/inventory/stock/bulk-movements", {
        movements: [{
          producto_id: addStockProducto, cantidad: Number(addStockCantidad),
          bodega_id: addStockBodega, tipo_movimiento: "entrada",
          fecha_recuento: addStockFechaRecuento || today,
          fecha_vencimiento: addStockFechaVencimiento || null,
        }]
      });
      toast.success("Stock agregado");
      setAddStockDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Error al agregar stock");
    }
  };

  const handleTransfer = async () => {
    const validItems = transferItems.filter(i => i.producto_id && i.cantidad && Number(i.cantidad) > 0);
    if (validItems.length === 0 || !transferOrigen || !transferDestino || transferOrigen === transferDestino) {
      toast.error("Completa los datos de transferencia correctamente"); return;
    }

    const movements: any[] = [];
    validItems.forEach(item => {
      movements.push({
        producto_id: item.producto_id, cantidad: Number(item.cantidad), fecha_recuento: today,
        fecha_vencimiento: item.fecha_vencimiento || null, tipo_movimiento: "transferencia",
        bodega_id: transferDestino,
      });
      movements.push({
        producto_id: item.producto_id, cantidad: Number(item.cantidad), fecha_recuento: today,
        fecha_vencimiento: item.fecha_vencimiento || null, tipo_movimiento: "transferencia",
        bodega_id: transferOrigen, descripcion_merma: "salida"
      });
    });

    try {
      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Transferencia exitosa");
      setTransferDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Error en la transferencia");
    }
  };

  const getPerBodegaMinimo = (prodId: string, bodegaId: string) => {
    const p = productos.find(x => x.id === prodId) as any;
    return p?.bodegas_config?.find((bc: any) => bc.bodega_id === bodegaId)?.stock_minimo ?? 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">Registro de Stock</h1>
        <div className="flex w-full sm:w-auto justify-between sm:justify-end gap-2">
          {!isViewingAll && (
            <Button onClick={() => setAddStockDialogOpen(true)} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Entrada
            </Button>
          )}
          <Button onClick={() => setTransferDialogOpen(true)} variant="outline" size="sm" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" /> Transferir
          </Button>
          <Button onClick={() => setMermaDialogOpen(true)} variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
            <AlertTriangle className="h-4 w-4" /> Merma
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BodegaSelector />
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
        </div>
      </div>

      {groupedProducts.map((cat) => (
        <div key={cat.id} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase px-1">{cat.nombre}</h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Producto</th>
                  <th className="px-4 py-3 text-right font-medium w-32">Cantidad</th>
                  <th className="px-4 py-3 text-left font-medium w-40">Vencimiento</th>
                  <th className="px-4 py-3 text-center font-medium w-10">...</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cat.productos.map((p) => {
                  const entry = entries[p._entryKey];
                  if (!entry) return null;
                  const rowStatus = "normal"; // logic can be added
                  return (
                    <tr key={p._entryKey} className={cn(highlightedIds.has(p.id) && "bg-primary/10 animate-pulse")}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.nombre}</div>
                        {isViewingAll && <div className="text-[10px]"><BodegaBadge nombre={p._bodegaName || ""} /></div>}
                        {getExpiryDaysLines(entry, p.unidad).map((line, i) => (
                          <div key={i} className={cn("text-[10px] font-medium", line.className)}>{line.text}</div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!entry.multiExpiry ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input type="number" value={entry.cantidad} onChange={(e) => updateEntry(p._entryKey, "cantidad", e.target.value)} 
                              className="h-8 w-20 text-right" disabled={!canEditInventory} />
                            <span className="text-xs text-muted-foreground">{p.unidad}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-primary">Múltiples lotes</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!entry.multiExpiry ? (
                          <Input type="date" value={entry.fecha_vencimiento} onChange={(e) => updateEntry(p._entryKey, "fecha_vencimiento", e.target.value)}
                            className="h-8 text-xs" disabled={!canEditInventory} />
                        ) : (
                          <div className="space-y-1">
                            {entry.expiryEntries.map((exp, idx) => (
                              <div key={idx} className="flex gap-1 items-center">
                                <Input type="date" value={exp.fecha_vencimiento} onChange={(e) => updateExpiryEntry(p._entryKey, idx, "fecha_vencimiento", e.target.value)} className="h-7 text-[10px]" />
                                <Input type="number" value={exp.cantidad} onChange={(e) => updateExpiryEntry(p._entryKey, idx, "cantidad", e.target.value)} className="h-7 w-12 text-right text-[10px]" />
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExpiryEntry(p._entryKey, idx)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={() => addExpiryEntry(p._entryKey)}>+ Lote</Button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Checkbox checked={entry.multiExpiry} onCheckedChange={(c) => toggleMultiExpiry(p._entryKey, !!c)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving || !isDirty()} className="shadow-lg gap-2">
          <Save className="h-4 w-4" /> {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Merma Dialog */}
      <Dialog open={mermaDialogOpen} onOpenChange={setMermaDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Merma</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bodega</Label>
              <Select value={mermaBodega} onValueChange={setMermaBodega}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{bodegas.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={mermaProducto} onValueChange={setMermaProducto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{productos.filter(p => productBodegaMap[p.id]?.has(mermaBodega)).map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input type="number" value={mermaCantidad} onChange={(e) => setMermaCantidad(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={motivoMerma} onValueChange={setMotivoMerma}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MOTIVOS_MERMA.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha Vencimiento (opcional)</Label>
              <Input type="date" value={mermaFechaVencimiento} onChange={(e) => setMermaFechaVencimiento(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMermaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmMerma} disabled={saving}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Transferencia entre Bodegas</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origen</Label>
                <Select value={transferOrigen} onValueChange={setTransferOrigen}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{bodegas.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Select value={transferDestino} onValueChange={setTransferDestino}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{bodegas.map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Productos</Label>
              {transferItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Select value={item.producto_id} onValueChange={(v) => {
                      const newItems = [...transferItems];
                      newItems[idx].producto_id = v;
                      setTransferItems(newItems);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                      <SelectContent>{productos.filter(p => productBodegaMap[p.id]?.has(transferOrigen)).map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input type="number" placeholder="Cant" className="w-20" value={item.cantidad} onChange={(e) => {
                    const newItems = [...transferItems];
                    newItems[idx].cantidad = e.target.value;
                    setTransferItems(newItems);
                  }} />
                  <Input type="date" className="w-32" value={item.fecha_vencimiento} onChange={(e) => {
                    const newItems = [...transferItems];
                    newItems[idx].fecha_vencimiento = e.target.value;
                    setTransferItems(newItems);
                  }} />
                  <Button variant="ghost" size="icon" onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setTransferItems([...transferItems, { producto_id: "", cantidad: "", fecha_vencimiento: "" }])}>+ Agregar producto</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleTransfer}>Transferir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
