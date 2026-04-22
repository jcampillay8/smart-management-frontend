// src/pages/StockRegistro/index.tsx

import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useBodega } from "../../hooks/useBodega";
import { useStockData } from "./hooks/useStockData"; 
import { StockTable } from "./components/StockTable"; 
import { StockActions } from "./components/StockActions"; 
import { MermaDialog } from "./dialogs/MermaDialog"; 
import { TransferDialog } from "./dialogs/TransferDialog"; 
import { AdjustmentDialog } from "./dialogs/AdjustmentDialog"; 
import { QuickMovePanel } from "./components/QuickMovePanel"; 
import { Button } from "../../components/ui/button";
import { Save, History, PanelRight } from "lucide-react"; // CAMBIADO: LayoutPanelRight -> PanelRight
import BodegaSelector from "../../components/BodegaSelector";
import api from "../../lib/api";
import { toast } from "sonner";
import { DisplayProduct } from "./types";
import { cn } from "../../lib/utils"

export default function StockRegistro() {
  const { selectedBodegaId: activeBodegaId } = useBodega();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedBodegaId = queryParams.get("bodegaId") || activeBodegaId || "all";

  const {
    categorias, productos, bodegas, entries, snapshot, loading, saving, setSaving,
    productBodegaMap, updateEntry, isDirty, loadData, today,
    toggleMultiExpiry, addExpiryEntry, removeExpiryEntry, updateExpiryEntry
  } = useStockData(selectedBodegaId, activeBodegaId || "");

  const [searchTerm, setSearchTerm] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [mermaOpen, setMermaOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false); // Estado para ocultar panel
  const [highlightedIds] = useState<Set<string>>(new Set());

// src/pages/StockRegistro/index.tsx

const filteredProducts = useMemo(() => {
  let list: DisplayProduct[] = [];
  
  if (selectedBodegaId === "all") {
    productos.forEach(p => {
      const productBodegas = Array.from(productBodegaMap[p.id] || []);
      productBodegas.forEach(bId => {
        const bodegaName = bodegas.find(b => b.id === bId)?.nombre || bId;
        
        // Calculamos el stock actual para esta bodega específica desde el snapshot
        const stockEnBodega = snapshot?.stockByProduct[p.id] || 0;

        list.push({ 
          ...p, 
          _entryKey: `${p.id}::${bId}`, 
          _bodegaName: bodegaName,
          _lotesDisponibles: snapshot?.lotsByProduct[p.id] || [],
          stock_actual: stockEnBodega // <-- SOLUCIÓN: Asignamos el valor requerido
        });
      });
    });
  } else {
    list = productos
      .filter(p => productBodegaMap[p.id]?.has(selectedBodegaId))
      .map(p => ({ 
        ...p, 
        _entryKey: p.id,
        _lotesDisponibles: snapshot?.lotsByProduct[p.id] || [],
        stock_actual: snapshot?.stockByProduct[p.id] || 0 // <-- SOLUCIÓN
      }));
  }

  return searchTerm 
    ? list.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) 
    : list;
}, [productos, selectedBodegaId, productBodegaMap, searchTerm, snapshot, bodegas]);

  const handleSave = async () => {
    if (!isDirty()) return;
    setSaving(true);
    try {
      const movements: any[] = [];
      Object.entries(entries).forEach(([key, entry]) => {
        const [prodId, bodegaIdFromKey] = key.split("::");
        const bId = selectedBodegaId === "all" ? bodegaIdFromKey : selectedBodegaId;

        if (entry.multiExpiry) {
          entry.expiryEntries.forEach(ee => {
            if (ee.cantidad && ee.fecha_vencimiento) {
              movements.push({
                producto_id: prodId,
                cantidad: Number(ee.cantidad),
                fecha_recuento: today,
                fecha_vencimiento: ee.fecha_vencimiento,
                tipo_movimiento: "recuento",
                bodega_id: bId,
              });
            }
          });
        } else if (entry.cantidad !== "") {
          movements.push({
            producto_id: prodId,
            cantidad: Number(entry.cantidad),
            fecha_recuento: today,
            fecha_vencimiento: entry.fecha_vencimiento || null,
            tipo_movimiento: "recuento",
            bodega_id: bId,
          });
        }
      });
      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Inventario sincronizado");
      loadData();
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando Datastore...</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto pb-32 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">Registro de Stock</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Terminal de Control e Inventario
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={cn(
              "rounded-xl border-white/10 text-[10px] font-black uppercase transition-all",
              showQuickActions && "bg-primary text-primary-foreground"
            )}
          >
            <PanelRight className="h-4 w-4 mr-2" />
            Acciones Rápidas
          </Button>
          <div className="bg-muted/50 p-2 rounded-2xl border border-white/5 shadow-inner">
            <BodegaSelector />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lógica de grid dinámico para que la tabla se expanda */}
        <div className={cn(
          "transition-all duration-500 space-y-6",
          showQuickActions ? "lg:col-span-9" : "lg:col-span-12"
        )}>
          <StockActions 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onOpenTransfer={() => setTransferOpen(true)}
            onOpenMerma={() => setMermaOpen(true)}
            onOpenAdjustment={() => setAdjustmentOpen(true)}
            isViewingAll={selectedBodegaId === "all"}
          />

          <StockTable 
            categorias={categorias}
            filteredProducts={filteredProducts}
            entries={entries}
            canEdit={selectedBodegaId !== "all"}
            isViewingAll={selectedBodegaId === "all"}
            onUpdateEntry={updateEntry}
            highlightedIds={highlightedIds}
            toggleMultiExpiry={toggleMultiExpiry}
            addExpiryEntry={addExpiryEntry}
            removeExpiryEntry={removeExpiryEntry}
            updateExpiryEntry={updateExpiryEntry}
          />
        </div>

        {showQuickActions && (
          <aside className="lg:col-span-3 animate-in slide-in-from-right duration-500">
            <QuickMovePanel />
          </aside>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-xl p-3 px-6 rounded-full border border-white/10 shadow-2xl z-50">
        <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-white gap-2 text-[10px] font-black uppercase">
          <History className="h-4 w-4" />
          Log
        </Button>
        <div className="h-6 w-[1px] bg-white/10" />
        <Button 
          onClick={handleSave} 
          disabled={!isDirty() || saving} 
          className="rounded-full gap-3 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
        >
          <Save className={cn("h-4 w-4", saving && "animate-spin")} />
          {saving ? "Guardando..." : "Sincronizar"}
        </Button>
      </div>

      <MermaDialog open={mermaOpen} onOpenChange={setMermaOpen} productos={productos} bodegas={bodegas} productBodegaMap={productBodegaMap} onSuccess={loadData} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} productos={productos} bodegas={bodegas} productBodegaMap={productBodegaMap} onSuccess={loadData} />
      <AdjustmentDialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen} productos={productos} bodegas={bodegas} onSuccess={loadData} />
    </div>
  );
}