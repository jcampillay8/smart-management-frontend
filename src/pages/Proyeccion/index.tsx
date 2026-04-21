// src/pages/Proyeccion/index.tsx
import { useState } from "react";
import { TrendingUp, Package, Search, Calendar } from "lucide-react";
import { useProyeccion } from "./useProyeccion";
import { GraficoProyeccion } from "./GraficoProyeccion";
import { EventosImpacto } from "./EventosImpacto";
import { Input } from "../../components/ui/input";

export default function ProyeccionPage() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  // Aquí vendrían tus datos de API (puedes usar useInventory y useEventos)
  const { chartData, diasProyeccion, setDiasProyeccion } = useProyeccion(selectedProduct, 100, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-indigo-500" /> Proyección de Disponibilidad
        </h1>
        <p className="text-sm text-muted-foreground">Simulación de quiebre de stock basada en eventos próximos.</p>
      </header>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Panel Lateral de Búsqueda */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar insumo..." className="pl-9" />
          </div>
          <div className="p-4 border rounded-xl bg-muted/20">
            <h3 className="text-xs font-bold uppercase mb-2">Parámetros</h3>
            <label className="text-[10px] text-muted-foreground">Días a proyectar: {diasProyeccion}</label>
            <input 
              type="range" min="7" max="30" 
              value={diasProyeccion} 
              onChange={(e) => setDiasProyeccion(parseInt(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </aside>

        {/* Visualización Principal */}
        <main className="lg:col-span-3 space-y-6">
          {selectedProduct ? (
            <>
              <GraficoProyeccion data={chartData} stockMinimo={selectedProduct.stock_minimo} />
              <EventosImpacto data={chartData} unidad={selectedProduct.unidad} />
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-20" />
              <p>Selecciona un producto para ver su proyección de stock</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}