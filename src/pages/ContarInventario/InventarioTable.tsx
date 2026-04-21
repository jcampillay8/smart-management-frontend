// src/pages/ContarInventario/InventarioTable.tsx
import { Trash2, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { CountItem } from "./types";

interface Props {
  items: CountItem[];
  productos: any[];
  onUpdate: (id: string, field: keyof CountItem, value: any) => void;
  onRemove: (id: string) => void;
}

export function InventarioTable({ items, productos, onUpdate, onRemove }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left">Producto</th>
            <th className="p-2 text-center w-32">Cant. Contada</th>
            <th className="p-2 text-center">Vencimiento</th>
            <th className="p-2 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr key={item.localId}>
              <td className="p-2 font-medium">
                {productos.find(p => p.id === item.producto_id)?.nombre || "Cargando..."}
              </td>
              <td className="p-2">
                <Input 
                  type="number" 
                  value={item.cantidad_contada} 
                  onChange={e => onUpdate(item.localId, "cantidad_contada", Number(e.target.value))}
                  className="h-8 text-right"
                />
              </td>
              <td className="p-2">
                <Input 
                  type="date" 
                  value={item.fecha_vencimiento} 
                  onChange={e => onUpdate(item.localId, "fecha_vencimiento", e.target.value)}
                  className="h-8"
                />
              </td>
              <td className="p-2">
                <Button variant="ghost" size="icon" onClick={() => onRemove(item.localId)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}