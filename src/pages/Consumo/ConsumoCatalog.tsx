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
  viewMode: "productos" | "recetas";
}

export function ConsumoCatalog({ 
  busqueda, 
  onBusquedaChange, 
  productos, 
  recetas, 
  categorias,
  groupedProducts,
  onAdd, 
  getStock,
  viewMode
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

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {viewMode === "productos" ? (
          filteredProducts.map(cat => (
            cat.productos.map(p => {
              const stock = getStock(p.id);
              const status = getStockStatus(stock, p.stock_minimo);
              return (
                <div 
                  key={p.id} 
                  className={cn(
                    "group relative aspect-square flex flex-col items-center justify-center p-2 rounded-2xl border bg-card transition-all cursor-pointer active:scale-95 shadow-sm hover:shadow-md",
                    status === "empty" && "border-destructive/30 bg-destructive/5",
                    status === "low" && "border-amber-400/30 bg-amber-500/5",
                    status === "normal" && "hover:border-primary/50"
                  )} 
                  onClick={() => onAdd(p, "producto")}
                >
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover mb-1 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Package className={cn(
                      "h-8 w-8 mb-1 transition-colors",
                      status === "empty" ? "text-destructive/50" : status === "low" ? "text-amber-500/50" : "text-muted-foreground/50"
                    )} />
                  )}
                  <p className="text-[10px] md:text-[11px] font-black uppercase text-center leading-tight line-clamp-2 px-1">
                    {p.nombre}
                  </p>
                  <div className={cn(
                    "absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm",
                    status === "empty" ? "bg-destructive text-white" : status === "low" ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
                  )}>
                    {stock}
                  </div>
                </div>
              );
            })
          ))
        ) : (
          filteredRecs.map(r => (
            <div 
              key={r.id} 
              className="group relative aspect-square flex flex-col items-center justify-center p-2 rounded-2xl border bg-card transition-all cursor-pointer active:scale-95 shadow-sm hover:shadow-md hover:border-primary/50" 
              onClick={() => onAdd(r, "receta")}
            >
              {r.imagen_url ? (
                <img src={r.imagen_url} alt="" className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover mb-1 group-hover:scale-110 transition-transform" />
              ) : (
                <CookingPot className="h-8 w-8 mb-1 text-muted-foreground/50" />
              )}
              <p className="text-[10px] md:text-[11px] font-black uppercase text-center leading-tight line-clamp-2 px-1">
                {r.nombre}
              </p>
              <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black shadow-sm">
                REC
              </div>
            </div>
          ))
        )}
      </div>
      {(viewMode === "productos" ? filteredProducts.length === 0 : filteredRecs.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            No se encontraron {viewMode}
          </p>
        </div>
      )}
    </div>
  );
}