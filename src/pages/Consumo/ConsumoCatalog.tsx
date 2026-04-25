// src/pages/Consumo/ConsumoCatalog.tsx
import { useState } from "react";
import { Search, Package, CookingPot, Plus, AlertTriangle } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Categoria, Producto, Receta } from "./types";
import { formatMoney } from "../../lib/format";
import { cn } from "../../lib/utils";

interface CatalogProps {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  productos: Producto[];
  recetas: Receta[];
  categorias: Categoria[];
  groupedProducts: { id: string; nombre: string; productos: Producto[] }[];
  onAdd: (item: any, type: "producto" | "receta") => void;
  getStock: (productoId: string) => number;
}

export function ConsumoCatalog({ 
  busqueda, 
  onBusquedaChange, 
  productos, 
  recetas, 
  categorias,
  groupedProducts,
  onAdd, 
  getStock 
}: CatalogProps) {
  const [filtroCategoria, setFiltroCategoria] = useState("all");

  const filteredProducts = groupedProducts.filter(cat => {
    if (filtroCategoria !== "all" && cat.id !== filtroCategoria) return false;
    return cat.productos.length > 0;
  });

  const filteredRecs = recetas.filter(r => !busqueda || r.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const getStockStatus = (stock: number, min: number) => {
    if (stock === 0) return "empty";
    if (stock <= min) return "low";
    return "normal";
  };

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar producto o receta..." 
          className="pl-10" 
          value={busqueda} 
          onChange={e => onBusquedaChange(e.target.value)} 
        />
      </div>

      <div className="flex gap-2">
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" /> Productos
          </h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredProducts.map(cat => (
              <div key={cat.id}>
                <h3 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 mt-4">{cat.nombre}</h3>
                {cat.productos.map(p => {
                  const stock = getStock(p.id);
                  const status = getStockStatus(stock, p.stock_minimo);
                  return (
                    <div 
                      key={p.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer",
                        status === "empty" && "border-destructive/50 bg-destructive/10",
                        status === "low" && "border-amber-400/50 bg-amber-500/10"
                      )} 
                      onClick={() => onAdd(p, "producto")}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.unidad}</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-sm font-bold",
                          status === "empty" && "text-destructive",
                          status === "low" && "text-amber-600",
                          status === "normal" && "text-muted-foreground"
                        )}>
                          {stock} {p.unidad}
                        </span>
                        {status === "empty" && (
                          <AlertTriangle className="h-3 w-3 text-destructive ml-2 inline" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay productos.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <CookingPot className="h-4 w-4" /> Recetas
          </h2>
          <div className="space-y-2">
            {filteredRecs.map(r => (
              <div 
                key={r.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer" 
                onClick={() => onAdd(r, "receta")}
              >
                <div>
                  <p className="font-medium text-sm">{r.nombre}</p>
                  <p className="text-xs text-muted-foreground">{formatMoney(r.precio)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {r.ingredientes?.length || 0} ingred.
                  </p>
                </div>
              </div>
            ))}
            {filteredRecs.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay recetas.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}