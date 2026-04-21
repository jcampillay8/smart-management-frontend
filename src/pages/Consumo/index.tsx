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

export default function Consumo() {
  const { selectedBodegaId, bodegas } = useBodega();
  const { 
    productos, recetas, cart, loading, saving, 
    setSaving, setCart, addToCart, removeFromCart, updateQuantity 
  } = useConsumo();
  
  const [busqueda, setBusqueda] = useState("");

  const handleConsumoSubmit = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const movements: any[] = [];
      const today = new Date().toISOString().split("T")[0];

      for (const item of cart) {
        if (item.type === "producto") {
          movements.push({
            producto_id: item.id,
            cantidad: item.quantity,
            tipo_movimiento: "consumo",
            bodega_id: selectedBodegaId === "all" ? bodegas[0]?.id : selectedBodegaId,
            fecha_recuento: today
          });
        } else {
          const receta = recetas.find(r => r.id === item.id);
          receta?.ingredientes.forEach(ing => {
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

      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Consumo registrado");
      setCart([]);
    } catch (e) {
      toast.error("Error al registrar consumo");
    } finally {
      setSaving(false);
    }
  };

  const filteredProds = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const filteredRecs = recetas.filter(r => r.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Registro de Consumo
        </h1>
      </div>

      <BodegaSelector />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ConsumoCatalog 
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          productos={filteredProds}
          recetas={filteredRecs}
          onAdd={addToCart}
        />
        <ConsumoCart 
          cart={cart}
          saving={saving}
          onUpdateQty={updateQuantity}
          onRemove={removeFromCart}
          onSubmit={handleConsumoSubmit}
        />
      </div>
    </div>
  );
}