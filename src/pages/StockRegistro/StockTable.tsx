// src/pages/StockRegistro/StockTable.tsx

import { StockRow } from "./StockRow";
import { Categoria, DisplayProduct, StockEntry } from "./types";

interface StockTableProps {
  categorias: Categoria[];
  filteredProducts: DisplayProduct[];
  entries: Record<string, StockEntry>;
  canEdit: boolean;
  isViewingAll: boolean;
  onUpdateEntry: (key: string, field: keyof StockEntry, value: any) => void;
  highlightedIds: Set<string>;
}

export function StockTable({
  categorias,
  filteredProducts,
  entries,
  canEdit,
  isViewingAll,
  onUpdateEntry,
  highlightedIds,
}: StockTableProps) {
  // Agrupamos los productos filtrados por categoría
  const groupedProducts = categorias
    .map((c) => ({
      ...c,
      productos: filteredProducts.filter((p) => p.categoria_id === c.id),
    }))
    .filter((c) => c.productos.length > 0);

  return (
    <div className="space-y-6">
      {groupedProducts.map((cat) => (
        <div key={cat.id} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase px-1">
            {cat.nombre}
          </h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 text-left font-medium">Producto</th>
                  <th className="px-4 py-3 text-right font-medium w-32">Cantidad</th>
                  <th className="px-4 py-3 text-left font-medium w-40">Vencimiento</th>
                  <th className="px-4 py-3 text-center font-medium w-10">...</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cat.productos.map((p) => (
                  <StockRow
                    key={p._entryKey}
                    product={p}
                    entry={entries[p._entryKey]}
                    canEdit={canEdit}
                    isViewingAll={isViewingAll}
                    onUpdate={onUpdateEntry}
                    isHighlighted={highlightedIds.has(p.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}