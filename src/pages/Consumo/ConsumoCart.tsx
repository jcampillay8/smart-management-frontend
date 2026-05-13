// src/pages/Consumo/ConsumoCart.tsx
import { useState } from "react";
import { Trash2, ArrowRight, ShoppingCart, X, CookingPot, Package, Minus, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { CartItem, Receta } from "./types";
import { formatMoney } from "../../lib/format";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CartProps {
  cart: CartItem[];
  allRecetas: Receta[];
  productos: any[]; // Add productos here
  saving: boolean;
  onUpdateQty: (id: string, type: string, qty: number) => void;
  onRemove: (id: string, type: string) => void;
  onSubmit: () => void;
  getStock: (id: string) => number;
}

export function ConsumoCart({ cart, allRecetas, productos, saving, onUpdateQty, onRemove, onSubmit, getStock }: CartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const IVA_RATE = 1.19;

  const handleInputChange = (id: string, type: string, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (cleanValue === "") {
      onUpdateQty(id, type, 0);
      return;
    }
    const num = parseInt(cleanValue, 10);
    const max = type === "producto" ? getStock(id) : 9999;
    if (num < 1) onUpdateQty(id, type, 1);
    else if (num > max) onUpdateQty(id, type, max);
    else onUpdateQty(id, type, num);
  };

  const adjustQty = (id: string, type: string, delta: number) => {
    const item = cart.find(i => i.id === id && i.type === type);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + delta);
    const max = type === "producto" ? getStock(id) : 9999;
    onUpdateQty(id, type, Math.min(newQty, max));
  };

  // Grouping logic: Recipes and standalone products
  const recipesInCart = cart.filter(i => i.type === "receta");
  const standaloneProducts = cart.filter(i => i.type === "producto");

  // Calculate totals considering only recipe prices for recipes, and product prices for standalone products
  const totalWithIVA = cart.reduce((sum, item) => {
    const price = item.price || 0;
    return sum + (price * IVA_RATE * item.quantity);
  }, 0);

  const cartContent = (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      <div className="p-4 md:p-6 border-b flex items-center justify-between bg-secondary/10 shrink-0">
        <div>
          <h2 className="font-black text-xl tracking-tighter uppercase">Carrito</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Precios con IVA (19%)</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-secondary rounded-xl transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-6 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest italic">El carrito está vacío</p>
          </div>
        ) : (
          <>
            {/* Recipes Group */}
            {recipesInCart.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-l-2 border-primary pl-2">Recetas Seleccionadas</h3>
                {recipesInCart.map(item => {
                  const receta = allRecetas.find(r => r.id === item.id);
                  return (
                    <div key={item.id} className="bg-secondary/20 rounded-2xl p-3 border border-border/50 space-y-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <CookingPot className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm leading-tight truncate">{item.name}</p>
                              <p className="text-[10px] text-primary font-bold">{formatMoney((item.price || 0) * IVA_RATE * item.quantity)}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => onRemove(item.id, item.type)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 bg-background/50 p-1.5 rounded-xl border border-border/30">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => adjustQty(item.id, item.type, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            value={item.quantity === 0 ? "" : item.quantity} 
                            onChange={e => handleInputChange(item.id, item.type, e.target.value)}
                            className="h-8 w-14 text-center font-bold text-xs bg-transparent border-none focus-visible:ring-0" 
                          />
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => adjustQty(item.id, item.type, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {receta && receta.ingredientes && receta.ingredientes.length > 0 && (
                        <div className="pl-4 border-l border-dashed border-border/50 space-y-1.5">
                          {receta.ingredientes.map((ing, idx) => {
                            const p = productos.find(prod => prod.id === ing.producto_id);
                            return (
                              <div key={idx} className="flex items-center justify-between text-[10px] text-muted-foreground italic">
                                <span className="truncate pr-2">• {p?.nombre || ing.producto_id.split('-').pop()}</span>
                                <span className="shrink-0">{(ing.cantidad * item.quantity).toFixed(2)} {p?.unidad || "und."}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standalone Products Group */}
            {standaloneProducts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-l-2 border-amber-500 pl-2">Insumos Sueltos</h3>
                {standaloneProducts.map(item => {
                  const max = getStock(item.id);
                  return (
                    <div key={item.id} className="flex flex-col gap-3 bg-card p-3 rounded-2xl border shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Package className="h-4 w-4 text-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{item.name}</p>
                            <p className="text-[10px] text-amber-600 font-bold">
                              {formatMoney((item.price || 0) * IVA_RATE * item.quantity)}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => onRemove(item.id, item.type)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-center gap-2 bg-secondary/30 p-1.5 rounded-xl">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-background" onClick={() => adjustQty(item.id, item.type, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input 
                          type="text"
                          inputMode="numeric"
                          value={item.quantity === 0 ? "" : item.quantity} 
                          onChange={e => handleInputChange(item.id, item.type, e.target.value)}
                          className="h-8 w-14 text-center font-bold text-xs bg-transparent border-none focus-visible:ring-0" 
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-background" onClick={() => adjustQty(item.id, item.type, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 md:p-6 pb-12 md:pb-6 bg-secondary/5 border-t space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total</span>
          <span className="text-xl md:text-2xl font-black tracking-tighter text-primary">{formatMoney(totalWithIVA)}</span>
        </div>
        <Button 
          className="w-full gap-3 h-12 md:h-14 font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-primary/20" 
          disabled={cart.length === 0 || saving || cart.some(i => i.quantity <= 0)} 
          onClick={onSubmit}
        >
          {saving ? "Procesando..." : "Registrar Consumo"} <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <aside className="hidden lg:flex flex-col max-h-[calc(100vh-160px)] sticky top-24 rounded-3xl border bg-card shadow-2xl overflow-hidden min-w-[320px] max-w-[380px]">
        {cartContent}
      </aside>

      {/* Mobile/Tablet Floating Button */}
      <div className="lg:hidden">
        <AnimatePresence>
          {cart.length > 0 && !isOpen && (
            <motion.button
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 20 }}
              onClick={() => setIsOpen(true)}
              className="fixed bottom-6 right-6 z-[100] h-16 w-16 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            >
              <ShoppingCart className="h-7 w-7" />
              <span className="absolute -top-1 -right-1 bg-white text-emerald-600 h-6 w-6 rounded-full text-xs font-black flex items-center justify-center border-2 border-emerald-500 shadow-md">
                {cart.length}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]" 
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-x-4 bottom-4 top-[15%] md:inset-x-20 md:bottom-10 md:top-[20%] bg-card rounded-[2.5rem] z-[120] border shadow-2xl overflow-hidden"
              >
                <div className="h-1.5 w-12 bg-muted rounded-full mx-auto mt-4 mb-2 md:hidden" />
                {cartContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}