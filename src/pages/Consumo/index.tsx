// src/pages/Consumo/index.tsx
import { useState } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { History, Eye, ChevronDown, Layers } from "lucide-react";
import { useAreaOperativa } from "../../hooks/useAreaOperativa";
import { useAuth } from "../../hooks/useAuth";
import { useConsumo } from "./useConsumo";
import { ConsumoCatalog } from "./ConsumoCatalog";
import { ConsumoCart } from "./ConsumoCart";
import { ConsumoLog } from "./ConsumoLog";
import { ConsumoEditDialog } from "./ConsumoEditDialog";
import { ConsumptionRecord } from "./types";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { cn } from "../../lib/utils";

import { AreaSelector } from "../../components/AreaSelector";

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Consumo() {
  const { selectedArea } = useAreaOperativa();
  const { isAdmin } = useAuth();

  const bodegaId = selectedArea?.bodega_consumo_id || "none";

  const { 
    productos, categorias, categoriasRecetas, recetas, cart, loading, saving, 
    setSaving, setCart, addToCart, removeFromCart, updateQuantity,
    getStock, getAlertStatus, getRecipeAvailability, groupedProducts, groupedRecetas, consumptionLog, refreshLog,
    updateConsumo, deleteConsumo
  } = useConsumo(
    bodegaId,
    selectedArea?.id ?? null
  );
  
  const [busqueda, setBusqueda] = useState("");
  const [viewMode, setViewMode] = useState<"productos" | "recetas">("recetas");
  const [editRecord, setEditRecord] = useState<ConsumptionRecord | null>(null);
  const [showLogMobile, setShowLogMobile] = useState(false);

  const filteredProds = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleConsumoSubmit = async () => {
    if (cart.length === 0) return;

    const areaId = selectedArea?.id;
    const bodegaConsumoId = selectedArea?.bodega_consumo_id;

    if (!bodegaConsumoId) {
      toast.error("El área seleccionada no tiene una bodega de consumo configurada");
      return;
    }

    if (!areaId && cart.some(i => i.type === "receta")) {
      toast.error("Selecciona un Área Operativa para consumir recetas");
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // We process one by one or in bulk where possible. 
      // Current backend only has bulk for products. Recipes are individual.
      
      const productMovements = cart.filter(i => i.type === "producto").map(item => {
        const stock = getStock(item.id);
        if (item.quantity > stock) {
          throw new Error(`Stock insuficiente para ${item.name}`);
        }
        return {
          producto_id: item.id,
          cantidad: item.quantity,
          tipo_movimiento: "consumo",
          bodega_id: bodegaConsumoId,
          fecha_recuento: today,
        };
      });

      // 1. Bulk products
      if (productMovements.length > 0) {
        await api.post("/inventory/stock/bulk-movements", { movements: productMovements });
      }

      // 2. Individual recipes (sequential for safety, or Promise.all)
      const recipeItems = cart.filter(i => i.type === "receta");
      for (const r of recipeItems) {
        await api.post(`/operations/recipes/${r.id}/consume?area_id=${areaId}&cantidad=${r.quantity}`);
      }

      toast.success("Consumo registrado");
      setCart([]);
      await refreshLog();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || e.message || "Error al registrar consumo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: ConsumptionRecord) => {
    if (confirm("¿Estás seguro de eliminar este registro? El stock se devolverá.")) {
      await deleteConsumo(record.id);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
          <div className="space-y-1 text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tighter">Registro de Consumos</h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Preparaciones y uso de insumos
            </p>
          </div>
        </div>
      </header>

      {/* Selectores y Toggle Row */}
      <div className="bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl relative z-[50]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
            <div className="flex w-full md:w-auto items-center gap-1.5 bg-muted/50 p-1.5 rounded-xl border border-input shadow-inner min-w-0">
              <div className="flex-1 min-w-0">
                <AreaSelector buttonClassName="w-full min-w-0 truncate" />
              </div>
            </div>
            
            <div className="hidden md:flex items-center rounded-xl bg-muted/50 p-1 border border-input shadow-inner">
              <button
                onClick={() => setViewMode("recetas")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === "recetas" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-muted-foreground hover:text-purple-500"
                )}
              >
                Recetas
              </button>
              <button
                onClick={() => setViewMode("productos")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  viewMode === "productos" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "text-muted-foreground hover:text-yellow-500"
                )}
              >
                Productos
              </button>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="hidden md:flex gap-2 h-10 px-4 rounded-xl border-input hover:bg-secondary transition-all font-black text-[10px] uppercase tracking-widest shadow-sm" 
            onClick={() => setShowLogMobile(true)}
          >
            <History className="h-4 w-4" /> Ver Historial
          </Button>
        </div>
      </div>

        {/* LAYOUT MÓVIL: Toggle y Historial debajo de los selectores */}
        <div className="flex md:hidden items-center justify-between w-full gap-3 mt-4">
          <div className="flex items-center rounded-xl bg-muted/50 p-1 border border-input shadow-inner flex-1">
            <button
              onClick={() => setViewMode("recetas")}
              className={cn(
                "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === "recetas" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-muted-foreground"
              )}
            >
              Recetas
            </button>
            <button
              onClick={() => setViewMode("productos")}
              className={cn(
                "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === "productos" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "text-muted-foreground"
              )}
            >
              Productos
            </button>
          </div>
          <Button 
            variant="outline" 
            className="gap-2 h-11 px-4 rounded-xl border-input font-black text-[10px] uppercase tracking-widest" 
            onClick={() => setShowLogMobile(true)}
          >
            <History className="h-4 w-4" /> Historial
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ConsumoCatalog 
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            productos={viewMode === "productos" ? productos : []}
            recetas={viewMode === "recetas" ? recetas : []}
            categorias={viewMode === "productos" ? categorias : categoriasRecetas}
            groupedItems={viewMode === "productos" ? groupedProducts : groupedRecetas}
            onAdd={addToCart}
            getStock={getStock}
            getAlertStatus={getAlertStatus}
            getRecipeAvailability={getRecipeAvailability}
            viewMode={viewMode}
          />
        </div>
        
        <div className="lg:col-span-1">
          <ConsumoCart 
            cart={cart}
            allRecetas={recetas}
            productos={productos}
            saving={saving}
            onUpdateQty={updateQuantity}
            onRemove={removeFromCart}
            onSubmit={handleConsumoSubmit}
            getStock={getStock}
          />
        </div>
      </div>

      <Dialog open={showLogMobile} onOpenChange={setShowLogMobile}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-transparent border-0">
          <ConsumoLog 
            records={consumptionLog}
            onRefresh={refreshLog}
            onEdit={(r) => { setEditRecord(r); setShowLogMobile(false); }}
            onDelete={handleDelete}
          />
        </DialogContent>
      </Dialog>

      <ConsumoEditDialog
        open={!!editRecord}
        onOpenChange={(v) => !v && setEditRecord(null)}
        record={editRecord}
        onSave={updateConsumo}
      />
    </div>
  );
}