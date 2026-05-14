import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineItem } from "../types";

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export default function LineItemsEditor({ items, onChange }: Props) {
  const add = () => {
    onChange([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const update = (idx: number, field: keyof LineItem, value: any) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const next = { ...item, [field]: value };
      if (field === "quantity" || field === "unit_price") {
        next.total = (next.quantity || 0) * (next.unit_price || 0);
      }
      return next;
    });
    onChange(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_60px_90px_90px_30px] gap-1 text-xs font-semibold text-muted-foreground px-1">
        <span>Descripción</span>
        <span className="text-right">Cant.</span>
        <span className="text-right">Precio</span>
        <span className="text-right">Subtotal</span>
        <span />
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_60px_90px_90px_30px] gap-1 items-center">
          <Input
            value={item.description || ""}
            onChange={(e) => update(idx, "description", e.target.value)}
            className="h-8 text-xs"
            placeholder="Producto / servicio"
          />
          <Input
            type="number"
            value={item.quantity || 1}
            min={0}
            step="any"
            onChange={(e) => update(idx, "quantity", Number(e.target.value))}
            className="h-8 text-xs text-right"
          />
          <Input
            type="number"
            value={item.unit_price || 0}
            min={0}
            step="any"
            onChange={(e) => update(idx, "unit_price", Number(e.target.value))}
            className="h-8 text-xs text-right"
          />
          <div className="text-right text-xs font-mono tabular-nums text-muted-foreground pr-2">
            ${(item.total || 0).toLocaleString("es-CL")}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(idx)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" size="sm" onClick={add} className="gap-1 text-xs h-8">
          <Plus className="h-3 w-3" /> Agregar línea
        </Button>
        <div className="text-sm font-semibold">
          Total: ${subtotal.toLocaleString("es-CL")}
        </div>
      </div>
    </div>
  );
}
