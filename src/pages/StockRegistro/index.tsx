// src/pages/StockRegistro/index.tsx

import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useBodega } from "../../hooks/useBodega";
import { useAuth } from "../../hooks/useAuth";
import { useStockData } from "./hooks/useStockData"; 
import { StockTable } from "./components/StockTable"; 
import { StockActions } from "./components/StockActions"; 
import { MermaDialog } from "./dialogs/MermaDialog"; 
import { TransferDialog } from "./dialogs/TransferDialog"; 
import { AdjustmentDialog } from "./dialogs/AdjustmentDialog"; 
import { AddingMercaderiaDialog } from "./dialogs/AddingMercaderiaDialog";
import { QuickMovePanel } from "./components/QuickMovePanel"; 
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Save, History, PanelRight, Search } from "lucide-react"; // CAMBIADO: LayoutPanelRight -> PanelRight
import BodegaSelector from "../../components/BodegaSelector";
import { AreaSelector } from "../../components/AreaSelector";
import api from "../../lib/api";
import { toast } from "sonner";
import { DisplayProduct } from "./types";
import { cn } from "../../lib/utils"
import { CategoryIcon } from "../../lib/icons";

export default function StockRegistro() {
  const { selectedBodegaIds: activeBodegaIds, bodegas: visibleBodegas } = useBodega();
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlBodegaId = queryParams.get("bodegaId");
  
  const selectedBodegaIds = useMemo(() => {
    if (urlBodegaId) return [urlBodegaId];
    return activeBodegaIds;
  }, [urlBodegaId, activeBodegaIds]);

  const isAll = selectedBodegaIds.includes("all");

  const {
    categorias, productos, bodegas, entries, snapshot, loading, saving, setSaving,
    productBodegaMap, updateEntry, isDirty, loadData, today,
    toggleMultiExpiry, addExpiryEntry, removeExpiryEntry, updateExpiryEntry
  } = useStockData((isAll || selectedBodegaIds.length > 1) ? "all" : selectedBodegaIds[0], (isAll || selectedBodegaIds.length > 1) ? "all" : selectedBodegaIds[0]);

  const isPropietario = user?.role?.toLowerCase() === "propietario";

  // Aviso de cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [mermaOpen, setMermaOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [addingMenuOpen, setAddingMenuOpen] = useState(false);
  const [addingMode, setAddingMode] = useState<"pedidos" | "libre" | "barcode" | "factura">("pedidos");
  const [highlightedIds] = useState<Set<string>>(new Set());

  const filteredProducts = useMemo(() => {
    let list: DisplayProduct[] = [];
    const isMulti = isAll || selectedBodegaIds.length > 1;
    const activeIds = isAll ? visibleBodegas.map(b => b.id) : selectedBodegaIds;
    
    if (isMulti) {
      productos.forEach(p => {
        const productBodegas = Array.from(productBodegaMap[p.id] || []);
        productBodegas.forEach(bId => {
          if (!activeIds.includes(bId)) return;
          
          const bData = bodegas.find(b => b.id === bId);
          const config = p.bodegas_config?.find(bc => bc.bodega_id === bId);
          const entryKey = `${p.id}::${bId}`;
          const entry = entries[entryKey];
          
          // Calcular stock actual sumando lotes si es multiExpiry, o usando la cantidad
          let currentStock = 0;
          if (entry) {
            if (entry.multiExpiry) {
              currentStock = entry.expiryEntries.reduce((sum, ee) => sum + (Number(ee.cantidad) || 0), 0);
            } else {
              currentStock = Number(entry.cantidad) || 0;
            }
          }
          
          list.push({ 
            ...p, 
            _entryKey: entryKey, 
            _bodegaName: bData?.nombre || bId,
            _bodegaColor: bData?.color,
            _bodegaIcon: bData?.icono,
            stock_minimo: config ? config.stock_minimo : p.stock_minimo,
            stock_actual: currentStock,
            _lotesDisponibles: entry?.expiryEntries || []
          });
        });
      });
    } else {
      list = productos
        .filter(p => {
           const productBodegas = productBodegaMap[p.id];
           return selectedBodegaIds.some(id => productBodegas?.has(id));
        })
        .map(p => {
          const bId = selectedBodegaIds[0];
          const config = p.bodegas_config?.find(bc => bc.bodega_id === bId);
          const entry = entries[p.id];
          
          let currentStock = 0;
          if (entry) {
            if (entry.multiExpiry) {
              currentStock = entry.expiryEntries.reduce((sum, ee) => sum + (Number(ee.cantidad) || 0), 0);
            } else {
              currentStock = Number(entry.cantidad) || 0;
            }
          }

          return { 
            ...p, 
            _entryKey: p.id,
            stock_minimo: config ? config.stock_minimo : p.stock_minimo,
            stock_actual: currentStock,
            _lotesDisponibles: entry?.expiryEntries || []
          };
        });
    }

    // --- LÓGICA DE FILTRADO HÍBRIDO ---
    let result = list;

    // 1. Filtrar por categorías seleccionadas (Multi-select)
    if (selectedCategories.size > 0) {
      result = result.filter(p => selectedCategories.has(p.categoria_id));
    }

    // 2. Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => {
        const matchNombre = p.nombre.toLowerCase().includes(term);
        const categoriaDelProducto = categorias.find(c => c.id === p.categoria_id);
        const matchCategoria = categoriaDelProducto?.nombre.toLowerCase().includes(term);
        const matchBarcode = p.codigo_barra?.toLowerCase().includes(term);
        return matchNombre || matchCategoria || matchBarcode;
      });
    }

    return result;
  }, [productos, activeBodegaIds, productBodegaMap, searchTerm, snapshot, bodegas, categorias, selectedCategories]);

  const handleSave = async () => {
    if (!isDirty()) return;
    setSaving(true);
    try {
      const movements: any[] = [];
      Object.entries(entries).forEach(([key, entry]) => {
        const [prodId, bodegaIdFromKey] = key.split("::");
        const bId = isAll ? bodegaIdFromKey : selectedBodegaIds[0];

        if (entry.multiExpiry) {
          entry.expiryEntries.forEach(ee => {
            if (ee.cantidad && ee.fecha_vencimiento) {
              movements.push({
                producto_id: prodId,
                cantidad: Number(ee.cantidad),
                fecha_recuento: today,
                fecha_vencimiento: ee.fecha_vencimiento,
                tipo_movimiento: "conteo",
                bodega_id: bId,
              });
            }
          });
        } else if (entry.cantidad !== 0) {
          movements.push({
            producto_id: prodId,
            cantidad: Number(entry.cantidad),
            fecha_recuento: today,
            fecha_vencimiento: entry.fecha_vencimiento || null,
            tipo_movimiento: "conteo",
            bodega_id: bId,
          });
        }
      });
      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Inventario guardado");
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
    <div className="space-y-6 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 mb-2">
        <div className="space-y-1 shrink-0">
          <h1 className="text-4xl font-black tracking-tighter">Registro de Stock</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Terminal de Control e Inventario
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <StockActions 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onOpenTransfer={() => setTransferOpen(true)}
            onOpenMerma={() => setMermaOpen(true)}
            onOpenAdjustment={() => setAdjustmentOpen(true)}
            onOpenAddingMenu={(mode) => { setAddingMode(mode); setAddingMenuOpen(true); }}
          />

          {/* Filtro de Categorías Multi-select */}
          <div className="flex flex-col gap-4 px-2">
            <div className="flex flex-wrap gap-2">
              {categorias.map(cat => {
                const isSelected = selectedCategories.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const next = new Set(selectedCategories);
                      if (isSelected) next.delete(cat.id);
                      else next.add(cat.id);
                      setSelectedCategories(next);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-sm",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                        : "bg-card text-muted-foreground border-input hover:border-primary/50"
                    )}
                    style={isSelected ? {} : { color: cat.color || undefined, borderColor: cat.color ? `${cat.color}40` : undefined }}
                  >
                    <CategoryIcon name={cat.icono} className="h-3.5 w-3.5" />
                    {cat.nombre}
                  </button>
                );
              })}
              {selectedCategories.size > 0 && (
                <button 
                  onClick={() => setSelectedCategories(new Set())}
                  className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>

            {/* Buscador MÓVIL: Debajo de las categorías */}
            <div className="md:hidden relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-primary/10 transition-colors group-focus-within:bg-primary/20">
                <Search className="h-3.5 w-3.5 text-primary" />
              </div>
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-card border-input rounded-xl text-sm font-medium shadow-sm transition-all focus:ring-primary/20 w-full"
              />
            </div>
          </div>

          <StockTable 
            categorias={categorias}
            filteredProducts={filteredProducts}
            entries={entries}
            canEdit={isPropietario || (!isAll && selectedBodegaIds.length === 1)}
            isViewingAll={isAll || selectedBodegaIds.length > 1}
            onUpdateEntry={updateEntry}
            highlightedIds={highlightedIds}
            toggleMultiExpiry={toggleMultiExpiry}
            addExpiryEntry={addExpiryEntry}
            removeExpiryEntry={removeExpiryEntry}
            updateExpiryEntry={updateExpiryEntry}
          />
        </div>
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
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <MermaDialog open={mermaOpen} onOpenChange={setMermaOpen} productos={productos} bodegas={bodegas} productBodegaMap={productBodegaMap} onSuccess={loadData} />
      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} productos={productos} bodegas={bodegas} productBodegaMap={productBodegaMap} onSuccess={loadData} />
      <AdjustmentDialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen} productos={productos} bodegas={bodegas} onSuccess={loadData} />
      <AddingMercaderiaDialog 
        open={addingMenuOpen} 
        onOpenChange={setAddingMenuOpen} 
        mode={addingMode} 
        onSuccess={loadData} 
      />
    </div>
  );
}