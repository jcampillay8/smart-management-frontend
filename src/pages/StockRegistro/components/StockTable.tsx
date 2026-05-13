// src/pages/StockRegistro/components/StockTable.tsx
import { StockRow } from "./StockRow";
import { StockRowMobile } from "./StockRowMobile";
import { cn } from "../../../lib/utils";
import { Categoria, DisplayProduct, StockEntry } from "../types";
import { Package2, ArrowDown, ArrowUp } from "lucide-react";
import { CategoryIcon } from "../../../lib/icons";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Esta constante es la clave para la alineación. 
 * Define anchos fijos y proporcionales que deben ser respetados tanto por <thead> como por <tbody>.
 */
export const TABLE_GRID_LAYOUT = "grid grid-cols-[minmax(200px,2.5fr)_160px_80px_140px_60px_110px_140px] gap-4 items-center px-6";

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
  showCategories: boolean;
  sortOption: string;
  onSortChange: (col: string) => void;
  expandedRows: Set<string>;
  onToggleExpand: (key: string) => void;
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
  addExpiryEntry,
  showCategories,
  sortOption,
  onSortChange,
  expandedRows,
  onToggleExpand
}: StockTableProps) {
  
  // Agrupación de productos por categoría para la visualización por secciones
  const groupedProducts = categorias
    .map((c) => ({
      ...c,
      productos: filteredProducts.filter((p) => p.categoria_id === c.id),
    }))
    .filter((c) => c.productos.length > 0);

  const SortIndicator = ({ col }: { col: string }) => {
    if (sortOption === `${col}_asc`) return <ArrowUp className="h-3 w-3 text-primary inline-block" />;
    if (sortOption === `${col}_desc`) return <ArrowDown className="h-3 w-3 text-primary inline-block" />;
    return null;
  };

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-[2rem] border-2 border-dashed border-input">
      <Package2 className="h-12 w-12 text-muted-foreground/20 mb-4" />
      <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">
        Sin registros en el inventario actual
      </p>
    </div>
  );

  const renderTableHeader = () => (
    <div className={cn(
      TABLE_GRID_LAYOUT, 
      "py-4 bg-muted/30 border-b border-input select-none"
    )}>
      <span 
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1"
        onClick={() => onSortChange('producto')}
      >
        Producto <SortIndicator col="producto" />
      </span>
      <span 
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1"
        onClick={() => onSortChange('cantidad')}
      >
        Cantidad / Mín. <SortIndicator col="cantidad" />
      </span>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unidad</span>
      <span 
        className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-center gap-1"
        onClick={() => onSortChange('vencimiento')}
      >
        Vencimiento <SortIndicator col="vencimiento" />
      </span>
      <span 
        className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-center gap-1"
        onClick={() => onSortChange('multi')}
      >
        Multi <SortIndicator col="multi" />
      </span>
      <span 
        className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-center gap-1"
        onClick={() => onSortChange('vigencia')}
      >
        Vigencia <SortIndicator col="vigencia" />
      </span>
      <span 
        className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-center gap-1"
        onClick={() => onSortChange('recuento')}
      >
        Recuento <SortIndicator col="recuento" />
      </span>
    </div>
  );

  const renderProductList = (productsToRender: DisplayProduct[]) => (
    <>
      <div className="hidden md:block rounded-3xl border border-input bg-card overflow-hidden shadow-xl">
        <div className="w-full">
          {renderTableHeader()}
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {productsToRender.map((p) => (
                <motion.div
                  key={p._entryKey}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                >
                  <StockRow
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
                    isExpanded={expandedRows.has(p._entryKey)}
                    onToggleExpand={() => onToggleExpand(p._entryKey)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {productsToRender.map((p) => (
            <StockRowMobile
              key={p._entryKey}
              product={p}
              entry={entries[p._entryKey]}
              canEdit={canEdit}
              isHighlighted={highlightedIds.has(p.id)}
              onUpdate={onUpdateEntry}
              toggleMultiExpiry={toggleMultiExpiry}
              addExpiryEntry={addExpiryEntry}
              removeExpiryEntry={removeExpiryEntry}
              updateExpiryEntry={updateExpiryEntry}
            />
          ))}
      </div>
    </>
  );

  if (!showCategories) {
    if (filteredProducts.length === 0) return renderEmpty();
    return (
      <div className="space-y-6 pb-20">
        {renderProductList(filteredProducts)}
      </div>
    );
  }

  if (groupedProducts.length === 0) return renderEmpty();

  return (
    <div className="space-y-16 pb-20">
      {groupedProducts.map((cat) => (
        <div key={cat.id} className="space-y-6">
          <div className="flex items-center gap-4 px-1">
            <div 
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20"
              style={{ color: cat.color || "var(--primary)", borderColor: cat.color ? `${cat.color}40` : undefined }}
            >
              <CategoryIcon name={cat.icono} className="h-3.5 w-3.5" />
              {cat.nombre}
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 via-primary/5 to-transparent"></div>
          </div>
          {renderProductList(cat.productos)}
        </div>
      ))}
    </div>
  );
}