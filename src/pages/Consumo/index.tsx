// src/pages/Consumo/index.tsx
import { useState } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { History } from "lucide-react";
import { useBodega } from "../../hooks/useBodega";
import BodegaSelector from "../../components/BodegaSelector";
import { useConsumo } from "./useConsumo";
import { ConsumoCatalog } from "./ConsumoCatalog";
import { ConsumoCart } from "./ConsumoCart";
import { ConsumoLog } from "./ConsumoLog";

export default function Consumo() {
  const { selectedBodegaId, bodegas } = useBodega();
  const { 
    productos, categorias, recetas, cart, loading, saving, 
    setSaving, setCart, addToCart, removeFromCart, updateQuantity,
    getStock, groupedProducts, consumptionLog, refreshLog
  } = useConsumo(selectedBodegaId === "all" ? "all" : selectedBodegaId);
  
  const [busqueda, setBusqueda] = useState("");

  const filteredProds = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const filteredRecs = recetas.filter(r => 
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleConsumoSubmit = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const movements: any[] = [];
      const today = new Date().toISOString().split("T")[0];

      for (const item of cart) {
        if (item.type === "producto") {
          const stock = getStock(item.id);
          if (item.quantity > stock) {
            toast.error(`Stock insuficiente para ${item.name} (disponible: ${stock})`);
            setSaving(false);
            return;
          }
          movements.push({
            producto_id: item.id,
            cantidad: item.quantity,
            tipo_movimiento: "consumo",
            bodega_id: selectedBodegaId === "all" ? bodegas[0]?.id : selectedBodegaId,
            fecha_recuento: today
          });
        } else {
          const receta = recetas.find(r => r.id === item.id);
          if (receta?.ingredientes) {
            for (const ing of receta.ingredientes) {
              const ingStock = getStock(ing.producto_id);
              const needed = ing.cantidad * item.quantity;
              if (needed > ingStock) {
                toast.error(`Stock insuficiente para ingrediente de ${item.name}`);
                setSaving(false);
                return;
              }
            }
            receta.ingredientes.forEach(ing => {
              movements.push({
                producto_id: ing.producto_id,
                cantidad: ing.cantidad * item.quantity,
                tipo_movimiento: "consumo",
                bodega_id: ing.bodega_id,
                fecha_recuento: today
              });
            });
          }
        }
      }

      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Consumo registrado");
      setCart([]);
      refreshLog();
    } catch (e: any) {
      toast.error(e.message || "Error al registrar consumo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Registro de Consumo
        </h1>
      </div>

      <BodegaSelector />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ConsumoCatalog 
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          productos={filteredProds}
          recetas={filteredRecs}
          categorias={categorias}
          groupedProducts={groupedProducts}
          onAdd={addToCart}
          getStock={getStock}
        />
        
        <div className="lg:col-span-2">
          <ConsumoCart 
            cart={cart}
            saving={saving}
            onUpdateQty={updateQuantity}
            onRemove={removeFromCart}
            onSubmit={handleConsumoSubmit}
          />
        </div>

        <ConsumoLog 
          records={consumptionLog}
          onRefresh={refreshLog}
        />
      </div>
    </div>
  );
}