// src/pages/StockRegistro/index.tsx

import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useBodega } from "../../hooks/useBodega";
import { useStockData } from "./useStockData";
import { StockTable } from "./StockTable";
import { StockActions } from "./StockActions";
import { MermaDialog } from "./MermaDialog";
import { TransferDialog } from "./TransferDialog";
import { Button } from "../../components/ui/button";
import { Save, ClipboardList } from "lucide-react";
import BodegaSelector from "../../components/BodegaSelector";
import api from "../../lib/api";
import { toast } from "sonner";
import { DisplayProduct } from "./types";

export default function StockRegistro() {
  const { selectedBodegaId: activeBodegaId } = useBodega();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedBodegaId = queryParams.get("bodegaId") || activeBodegaId || "all";

  // 1. Hook de datos
  const {
    categorias, productos, entries, loading, saving, setSaving,
    productBodegaMap, updateEntry, isDirty, loadData, today
  } = useStockData(selectedBodegaId, activeBodegaId || "");

  // 2. Estados locales de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [mermaOpen, setMermaOpen] = useState(false);
  const [highlightedIds] = useState<Set<string>>(new Set());

  // 3. Lógica de Filtrado
  const filteredProducts = useMemo(() => {
    let list: DisplayProduct[] = [];
    if (selectedBodegaId === "all") {
      // Si vemos todas, aplanamos productos por bodega
      productos.forEach(p => {
        const productBodegas = Array.from(productBodegaMap[p.id] || []);
        productBodegas.forEach(bId => {
          list.push({ ...p, _entryKey: `${p.id}::${bId}`, _bodegaName: bId });
        });
      });
    } else {
      list = productos
        .filter(p => productBodegaMap[p.id]?.has(selectedBodegaId))
        .map(p => ({ ...p, _entryKey: p.id }));
    }

    if (!searchTerm) return list;
    return list.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [productos, selectedBodegaId, productBodegaMap, searchTerm]);

  // 4. Acción de Guardado Masivo
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
        } else if (entry.cantidad) {
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
      toast.success("Inventario actualizado");
      loadData();
    } catch (error) {
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando inventario...</div>;

  return (
    <div className="container mx-auto pb-24 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Stock</h1>
          <p className="text-muted-foreground text-sm">Control de existencias y vencimientos</p>
        </div>
        <BodegaSelector />
      </header>

      <StockActions 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenTransfer={() => setTransferOpen(true)}
        onOpenMerma={() => setMermaOpen(true)}
        isViewingAll={selectedBodegaId === "all"}
      />

      <StockTable 
        categorias={categorias}
        filteredProducts={filteredProducts}
        entries={entries}
        canEdit={selectedBodegaId !== "all" || !!activeBodegaId}
        isViewingAll={selectedBodegaId === "all"}
        onUpdateEntry={updateEntry}
        highlightedIds={highlightedIds}
      />

      {/* Barra de acciones flotante */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-background/80 backdrop-blur-md p-3 rounded-full border shadow-xl z-50">
        <Button variant="outline" className="rounded-full gap-2">
          <ClipboardList className="h-4 w-4" /> Historial
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!isDirty() || saving} 
          className="rounded-full gap-2 px-8"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      <MermaDialog 
        open={mermaOpen} 
        onOpenChange={setMermaOpen}
        productos={productos}
        bodegas={[]} // Aquí deberías pasar la lista de bodegas si la tienes en el contexto
        productBodegaMap={productBodegaMap}
        onSuccess={loadData}
      />

      <TransferDialog 
        open={transferOpen}
        onOpenChange={setTransferOpen}
        productos={productos}
        bodegas={[]} // Igual aquí
        productBodegaMap={productBodegaMap}
        onSuccess={loadData}
      />
    </div>
  );
}