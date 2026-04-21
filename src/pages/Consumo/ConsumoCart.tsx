// src/pages/Consumo/ConsumoCart.tsx
import { Trash2, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { CartItem } from "./types";

interface CartProps {
  cart: CartItem[];
  saving: boolean;
  onUpdateQty: (id: string, type: string, qty: number) => void;
  onRemove: (id: string, type: string) => void;
  onSubmit: () => void;
}

export function ConsumoCart({ cart, saving, onUpdateQty, onRemove, onSubmit }: CartProps) {
  return (
    <aside className="rounded-xl border bg-card p-6 shadow-sm flex flex-col h-fit sticky top-6">
      <h2 className="font-bold text-lg mb-4">Carrito de Consumo</h2>
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] mb-4 pr-2">
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">No hay ítems.</p>
        ) : (
          cart.map((item) => (
            <div key={`${item.id}-${item.type}`} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{item.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={item.quantity} 
                  onChange={e => onUpdateQty(item.id, item.type, Number(e.target.value))} 
                  className="h-7 w-16 text-right" 
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive" 
                  onClick={() => onRemove(item.id, item.type)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t pt-4">
        <Button 
          className="w-full gap-2" 
          disabled={cart.length === 0 || saving} 
          onClick={onSubmit}
        >
          {saving ? "Registrando..." : "Registrar Consumo"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}