// src/pages/Consumo/ConsumoCatalog.tsx
import { Search, Package, CookingPot, Plus } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Producto, Receta } from "./types";
import { formatMoney } from "../../lib/format";

interface CatalogProps {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  productos: Producto[];
  recetas: Receta[];
  onAdd: (item: any, type: "producto" | "receta") => void;
}

export function ConsumoCatalog({ busqueda, onBusquedaChange, productos, recetas, onAdd }: CatalogProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar producto o receta..." 
          className="pl-10" 
          value={busqueda} 
          onChange={e => onBusquedaChange(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" /> Productos
          </h2>
          <div className="space-y-2">
            {productos.map(p => (
              <div 
                key={p.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer" 
                onClick={() => onAdd(p, "producto")}
              >
                <div>
                  <p className="font-medium text-sm">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.unidad}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <CookingPot className="h-4 w-4" /> Recetas
          </h2>
          <div className="space-y-2">
            {recetas.map(r => (
              <div 
                key={r.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer" 
                onClick={() => onAdd(r, "receta")}
              >
                <div>
                  <p className="font-medium text-sm">{r.nombre}</p>
                  <p className="text-xs text-muted-foreground">{formatMoney(r.precio)}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}