// src/pages/StockRegistro/components/StockTable.tsx
import { StockRow } from "./StockRow";
import { cn } from "../../../lib/utils";
// Nota: Asegúrate de crear este componente o eliminar el import si no lo usas aún
// import { StockRowMobile } from "./StockRowMobile"; 
import { Categoria, DisplayProduct, StockEntry } from "../types";
import { Package2 } from "lucide-react";

/**
 * Esta constante es la clave para la alineación. 
 * Define anchos fijos y proporcionales que deben ser respetados tanto por <thead> como por <tbody>.
 */
export const TABLE_GRID_LAYOUT = "grid grid-cols-[minmax(200px,2.5fr)_140px_100px_160px_minmax(160px,2fr)_80px] gap-2 items-center px-4";

interface StockTableProps {
  categorias: Categoria[];
  filteredProducts: DisplayProduct[];
  entries: Record<string, StockEntry>;
  canEdit: boolean;
  isViewingAll: boolean;
  onUpdateEntry: (key: string, field: keyof StockEntry, value: any) => void;
  highlightedIds: Set<string>;
  toggleMultiExpiry: (key: string, checked: boolean) => void;
  updateExpiryEntry: (key: string, idx: number, field: string, value: any) => void;
  removeExpiryEntry: (key: string, idx: number) => void;
  addExpiryEntry: (key: string) => void;
}

export function StockTable({
  categorias,
  filteredProducts,
  entries,
  canEdit,
  isViewingAll,
  onUpdateEntry,
  highlightedIds,
  toggleMultiExpiry,
  updateExpiryEntry,
  removeExpiryEntry,
  addExpiryEntry
}: StockTableProps) {
  
  // Agrupación de productos por categoría para la visualización por secciones
  const groupedProducts = categorias
    .map((c) => ({
      ...c,
      productos: filteredProducts.filter((p) => p.categoria_id === c.id),
    }))
    .filter((c) => c.productos.length > 0);

  // Estado vacío si no hay coincidencias de búsqueda o filtros
  if (groupedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-[2rem] border-2 border-dashed border-white/5">
        <Package2 className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">
          Sin registros en el inventario actual
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {groupedProducts.map((cat) => (
        <div key={cat.id} className="space-y-6">
          {/* Encabezado de Categoría Estilizado */}
          <div className="flex items-center gap-4 px-1">
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
              {cat.nombre}
            </h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent"></div>
          </div>

          {/* CONTENEDOR DE TABLA DESKTOP */}
          <div className="hidden md:block rounded-3xl border border-white/10 bg-[#0f0f0f]/40 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="w-full">
              {/* HEADER: Usa el TABLE_GRID_LAYOUT para alinear con las filas */}
              <div className={cn(
                TABLE_GRID_LAYOUT, 
                "py-4 bg-white/[0.03] border-b border-white/5"
              )}>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Producto</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cantidad / Mín.</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unidad</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recuento</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vencimiento</span>
                <span className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Multi</span>
              </div>
              
              {/* BODY: Las filas se renderizan dentro de un div para mejor control del scroll si fuera necesario */}
              <div className="divide-y divide-white/5">
                {cat.productos.map((p) => (
                  <StockRow
                    key={p._entryKey}
                    product={p}
                    entry={entries[p._entryKey]}
                    canEdit={canEdit}
                    isViewingAll={isViewingAll}
                    onUpdate={onUpdateEntry}
                    isHighlighted={highlightedIds.has(p.id)}
                    toggleMultiExpiry={toggleMultiExpiry}
                    updateExpiryEntry={updateExpiryEntry}
                    removeExpiryEntry={removeExpiryEntry}
                    addExpiryEntry={addExpiryEntry}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* VISTA MÓVIL (Opcional, implementada como lista de cards) */}
          <div className="md:hidden space-y-4">
             {cat.productos.map((p) => (
               <div key={p._entryKey} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                 <p className="font-bold text-sm text-primary">{p.nombre}</p>
                 {/* Aquí puedes simplificar los inputs para móvil */}
               </div>
             ))}
          </div>
        </div>
      ))}
    </div>
  );
}