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
  getStock: (id: string) => number;
}

export function ConsumoCart({ cart, saving, onUpdateQty, onRemove, onSubmit, getStock }: CartProps) {
  const handleInputChange = (id: string, type: string, value: string) => {
    // 1. Limpiar el valor para que solo queden números
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (cleanValue === "") {
      onUpdateQty(id, type, 0); // Permitimos temporalmente 0 para que puedan borrar
      return;
    }

    const num = parseInt(cleanValue, 10);
    const max = type === "producto" ? getStock(id) : 9999;

    // 2. Aplicar límites (1 - max)
    if (num < 1) {
      onUpdateQty(id, type, 1);
    } else if (num > max) {
      onUpdateQty(id, type, max);
    } else {
      onUpdateQty(id, type, num);
    }
  };

  return (
    <aside className="rounded-xl border bg-card p-6 shadow-sm flex flex-col h-fit sticky top-6">
      <h2 className="font-bold text-lg mb-4">Carrito de Consumo</h2>
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] mb-4 pr-2">
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">No hay ítems.</p>
        ) : (
          cart.map((item) => {
            const max = item.type === "producto" ? getStock(item.id) : 9999;
            return (
              <div key={`${item.id}-${item.type}`} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {item.type} {item.type === "producto" && `(Máx: ${max})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="text" // Usamos text para controlar mejor la entrada de caracteres
                    inputMode="numeric"
                    value={item.quantity === 0 ? "" : item.quantity} 
                    onChange={e => handleInputChange(item.id, item.type, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="h-9 w-20 text-right font-bold" 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-destructive hover:bg-destructive/10" 
                    onClick={() => onRemove(item.id, item.type)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t pt-4">
        <Button 
          className="w-full gap-2 h-11 font-bold" 
          disabled={cart.length === 0 || saving || cart.some(i => i.quantity <= 0)} 
          onClick={onSubmit}
        >
          {saving ? "Registrando..." : "Registrar Consumo"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}