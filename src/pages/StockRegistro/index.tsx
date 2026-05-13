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
import { SimpleCategoriaSeccion } from "../../components/SimpleCategoriaSeccion";

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

  const isAll = Array.isArray(selectedBodegaIds) && selectedBodegaIds.includes("all");

  const {
    categorias, productos, bodegas, entries, initialEntries, snapshot, loading, saving, setSaving,
    productBodegaMap, updateEntry, isDirty, loadData, today,
    toggleMultiExpiry, addExpiryEntry, removeExpiryEntry, updateExpiryEntry
  } = useStockData(selectedBodegaIds.join(","), (isAll || selectedBodegaIds.length > 1) ? "all" : selectedBodegaIds[0]);

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
  const [showCategories, setShowCategories] = useState(true);
  const [sortOption, setSortOption] = useState<string>("urgency");

  const [transferOpen, setTransferOpen] = useState(false);
  const [mermaOpen, setMermaOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [addingMenuOpen, setAddingMenuOpen] = useState(false);
  const [addingMode, setAddingMode] = useState<"pedidos" | "libre" | "barcode" | "factura">("pedidos");
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  // Persistent expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("inventory_expanded_rows");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleRowExpansion = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem("inventory_expanded_rows", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const filteredProducts = useMemo(() => {
    let list: DisplayProduct[] = [];
    const isMulti = isAll || selectedBodegaIds.length > 1;
    const activeIds = isAll ? visibleBodegas.map(b => b.id) : selectedBodegaIds;
    
    if (isMulti) {
      productos.forEach(p => {
        const productBodegas = Array.from(productBodegaMap?.[p.id] || []);
        productBodegas.forEach(bId => {
          if (!activeIds?.includes?.(bId as string)) return;
          
          const bData = (bodegas || []).find(b => b.id === bId);
          if (!bData) return;
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

    // 3. Ordenamiento
    result.sort((a, b) => {
      if (sortOption === "urgency") {
        const getSeverity = (p: DisplayProduct) => {
          const stockVal = p.stock_actual ?? 0;
          const minVal = p.stock_minimo ?? 0;
          
          let stockSev = 0;
          if (minVal > 0) {
            if (stockVal === 0) stockSev = 1;
            else if (stockVal < minVal) {
              const ratio = (minVal - stockVal) / minVal;
              stockSev = 0.5 + (ratio * 0.4);
            } else {
              stockSev = 0;
            }
          } else if (stockVal === 0) {
            stockSev = 1;
          }

          let expirySev = 0;
          const entry = entries[p._entryKey];
          if (entry) {
            const activeDates = entry.multiExpiry 
              ? entry.expiryEntries.map(ee => ee.fecha_vencimiento).filter(Boolean) as string[]
              : [entry.fecha_vencimiento].filter(Boolean) as string[];

            activeDates.forEach(dateStr => {
              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);
              const expiry = new Date(dateStr + "T00:00:00");
              const diffMs = expiry.getTime() - todayDate.getTime();
              const days = Math.ceil(diffMs / (1000 * 3600 * 24));
              const threshold = p.dias_alerta_vencimiento ?? 15;

              let currentExpSev = 0;
              if (days < 0) currentExpSev = 1;
              else if (days === 0) currentExpSev = 1;
              else if (days <= 7) currentExpSev = 0.9;
              else if (days <= threshold) currentExpSev = 0.5;
              else if (days <= 30) currentExpSev = 0.2;

              expirySev = Math.max(expirySev, currentExpSev);
            });
          }

          return Math.max(stockSev, expirySev);
        };

        const scoreA = getSeverity(a);
        const scoreB = getSeverity(b);
        if (scoreA !== scoreB) return scoreB - scoreA; // Higher severity first
        return a.nombre.localeCompare(b.nombre);
      }
      if (sortOption === "az") return a.nombre.localeCompare(b.nombre);
      if (sortOption === "za") return b.nombre.localeCompare(a.nombre);
      
      const [col, dir] = sortOption.split("_");
      const multiplier = dir === "desc" ? -1 : 1;
      
      if (col === "producto") return a.nombre.localeCompare(b.nombre) * multiplier;
      if (col === "cantidad") return (a.stock_actual - b.stock_actual) * multiplier;
      if (col === "multi") {
        const aMulti = entries[a._entryKey]?.multiExpiry ? 1 : 0;
        const bMulti = entries[b._entryKey]?.multiExpiry ? 1 : 0;
        return (aMulti - bMulti) * multiplier;
      }
      if (col === "vigencia") return (a.vigencia - b.vigencia) * multiplier;
      if (col === "recuento") {
        const aRec = entries[a._entryKey]?.cantidad ? Number(entries[a._entryKey].cantidad) : 0;
        const bRec = entries[b._entryKey]?.cantidad ? Number(entries[b._entryKey].cantidad) : 0;
        return (aRec - bRec) * multiplier;
      }
      // Vencimiento requires parsing dates, simplifying to urgency-like behavior or just relying on urgency
      return 0;
    });

    return result;
  }, [productos, activeBodegaIds, productBodegaMap, searchTerm, snapshot, bodegas, categorias, selectedCategories, sortOption, entries, today]);


  const handleSave = async () => {
    if (!isDirty()) return;
    
    // --- VALIDACIÓN DE VENCIMIENTO SIN CANTIDAD ---
    const invalidProducts: string[] = [];
    const invalidIds = new Set<string>();

    Object.entries(entries).forEach(([key, entry]) => {
      const [prodId] = key.split("::");
      const prod = productos.find(p => p.id === prodId);
      
      let hasIssue = false;
      if (entry.multiExpiry) {
        hasIssue = entry.expiryEntries.some(ee => ee.fecha_vencimiento && (!ee.cantidad || Number(ee.cantidad) === 0));
      } else {
        hasIssue = !!(entry.fecha_vencimiento && (!entry.cantidad || Number(entry.cantidad) === 0));
      }

      if (hasIssue) {
        invalidIds.add(prodId);
        if (prod && !invalidProducts.includes(prod.nombre)) invalidProducts.push(prod.nombre);
      }
    });

    // Si hay problemas, los resaltamos siempre
    setHighlightedIds(invalidIds);

    // Si NO es propietario, bloqueamos el guardado
    if (invalidProducts.length > 0 && !isPropietario) {
      toast.error(`No se puede guardar porque falta agregar cantidad en: ${invalidProducts.join(", ")}`);
      return;
    }

    // Si es propietario, permitiremos el guardado pero informaremos al final

    setHighlightedIds(new Set());
    setSaving(true);
    try {
      const initial = JSON.parse(initialEntries || "{}");
      const movements: any[] = [];

      Object.entries(entries).forEach(([key, entry]) => {
        const [prodId, bodegaIdFromKey] = key.split("::");
        const bId = isAll ? bodegaIdFromKey : selectedBodegaIds[0];
        const prevEntry = initial[key];

        // --- DETECCIÓN DE CAMBIOS REALES ---
        let hasChanged = false;

        if (entry.multiExpiry) {
          // Si antes no era multi o el número de lotes cambió, o cualquier lote cambió
          if (!prevEntry?.multiExpiry) {
            hasChanged = true;
          } else {
            const currentLotes = entry.expiryEntries;
            const prevLotes = prevEntry.expiryEntries || [];
            
            if (currentLotes.length !== prevLotes.length) {
              hasChanged = true;
            } else {
              // Comparar contenido de lotes
              hasChanged = currentLotes.some((ee, idx) => {
                const prevEe = prevLotes[idx];
                return Number(ee.cantidad) !== Number(prevEe?.cantidad) || ee.fecha_vencimiento !== prevEe?.fecha_vencimiento;
              });
            }
          }
        } else {
          // Lógica single expiry
          const prevCant = prevEntry ? prevEntry.cantidad : 0;
          const prevFecha = prevEntry ? prevEntry.fecha_vencimiento : null;
          
          if (Number(entry.cantidad) !== Number(prevCant) || entry.fecha_vencimiento !== prevFecha) {
            hasChanged = true;
          }
        }

        if (!hasChanged) return; // Si no hay cambios, ignoramos este producto

        if (entry.multiExpiry) {
          // 1. Detectar lotes eliminados o con fecha cambiada para anularlos
          if (prevEntry?.expiryEntries) {
            prevEntry.expiryEntries.forEach((oldEe: any) => {
              const exists = entry.expiryEntries.some(newEe => newEe.fecha_vencimiento === oldEe.fecha_vencimiento);
              if (!exists && oldEe.cantidad > 0) {
                movements.push({
                  producto_id: prodId,
                  cantidad: 0,
                  fecha_recuento: today,
                  fecha_vencimiento: oldEe.fecha_vencimiento,
                  tipo_movimiento: "conteo",
                  bodega_id: bId,
                });
              }
            });
          }

          // 2. Registrar lotes actuales
          entry.expiryEntries.forEach(ee => {
            if (ee.cantidad !== undefined && ee.fecha_vencimiento) {
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
        } else {
          // 1. Si antes era multi-lote y ahora no, debemos ANULAR todos los lotes anteriores para consolidar
          if (prevEntry?.multiExpiry && prevEntry.expiryEntries) {
            prevEntry.expiryEntries.forEach((oldEe: any) => {
               movements.push({
                 producto_id: prodId,
                 cantidad: 0,
                 fecha_recuento: today,
                 fecha_vencimiento: oldEe.fecha_vencimiento || null,
                 tipo_movimiento: "conteo",
                 bodega_id: bId,
               });
            });
          } 
          // 2. Si solo cambió la fecha (y no era multi), anulamos el registro anterior
          else if (prevEntry && (prevEntry.fecha_vencimiento || null) !== (entry.fecha_vencimiento || null)) {
             movements.push({
               producto_id: prodId,
               cantidad: 0,
               fecha_recuento: today,
               fecha_vencimiento: prevEntry.fecha_vencimiento || null,
               tipo_movimiento: "conteo",
               bodega_id: bId,
             });
          }

          // 3. Registramos el estado actual consolidado
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

      if (movements.length > 0) {
        await api.post("/inventory/stock/bulk-movements", { movements });
        if (invalidProducts.length > 0) {
          toast.success(`Inventario guardado. Nota: ${invalidProducts.join(", ")} se guardaron con stock 0.`);
        } else {
          toast.success("Inventario guardado");
        }
        loadData();
      } else {
        toast.info("No hay cambios detectados");
      }
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 mb-2">
        <div className="space-y-1 shrink-0 text-center md:text-left w-full md:w-auto">
          <h1 className="text-4xl font-black tracking-tighter">Registro de Stock</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Terminal de Control e Inventario
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <StockActions 
            onOpenTransfer={() => setTransferOpen(true)}
            onOpenMerma={() => setMermaOpen(true)}
            onOpenAdjustment={() => setAdjustmentOpen(true)}
            onOpenAddingMenu={(mode) => { setAddingMode(mode); setAddingMenuOpen(true); }}
            showCategories={showCategories}
            onToggleCategories={() => {
              if (showCategories) setSelectedCategories(new Set());
              setShowCategories(!showCategories);
            }}
            sortOption={sortOption}
            onSortChange={setSortOption}
          />

          {loading ? (
            <div className="flex h-[40vh] items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando Datastore...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Filtro de Categorías Multi-select y Search bar */}
              <div className="flex flex-col gap-4 px-2">
                {showCategories && (
                  <SimpleCategoriaSeccion
                    categorias={categorias}
                    selectedIds={selectedCategories}
                    onToggle={(id) => {
                      const next = new Set(selectedCategories);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      setSelectedCategories(next);
                    }}
                    onClear={() => setSelectedCategories(new Set())}
                  />
                )}

                {/* Buscador: Debajo de las categorías en PC y Mobile */}
                <div className="relative group w-full md:max-w-md">
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
                showCategories={showCategories}
                onSortChange={(col) => {
                  setSortOption(prev => prev === `${col}_asc` ? `${col}_desc` : `${col}_asc`);
                }}
                sortOption={sortOption}
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
                expandedRows={expandedRows}
                onToggleExpand={toggleRowExpansion}
              />
          </>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-xl p-3 px-6 rounded-full border border-white/10 shadow-2xl z-50">
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