import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useBodega } from "../hooks/useBodega";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Search, CookingPot, Package, History, Trash2, ArrowRight } from "lucide-react";
import { formatMoney } from "../lib/format";
import { cn } from "../lib/utils";
import BodegaBadge from "../components/BodegaBadge";
import BodegaSelector from "../components/BodegaSelector";

interface Producto { id: string; nombre: string; unidad: string; categoria_id: string; stock_minimo: number; costo_unitario: number; bodegas_config: any[] }
interface Receta { id: string; nombre: string; precio: number; ingredientes: { producto_id: string; cantidad: number; bodega_id: string }[] }

export default function Consumo() {
  const { user } = useAuth();
  const { selectedBodegaId, bodegas } = useBodega();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carrito de consumo
  const [cart, setCart] = useState<{ id: string; type: "producto" | "receta"; quantity: number; name: string; unit?: string }[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prodRes, recetaRes] = await Promise.all([
        api.get("/inventory/products"),
        api.get("/operations/recipes/"),
      ]);
      setProductos(prodRes.data);
      setRecetas(recetaRes.data);
    } catch (e) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any, type: "producto" | "receta") => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => i.id === item.id && i.type === type ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, type, quantity: 1, name: item.nombre, unit: type === "producto" ? item.unidad : "serv." }];
    });
    toast.success(`${item.nombre} agregado`);
  };

  const removeFromCart = (id: string, type: string) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const updateQuantity = (id: string, type: string, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => prev.map(i => i.id === id && i.type === type ? { ...i, quantity: qty } : i));
  };

  const handleConsumo = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const movements: any[] = [];
      for (const item of cart) {
        if (item.type === "producto") {
          movements.push({
            producto_id: item.id,
            cantidad: item.quantity,
            tipo_movimiento: "consumo",
            bodega_id: selectedBodegaId === "all" ? bodegas[0]?.id : selectedBodegaId,
            fecha_recuento: new Date().toISOString().split("T")[0]
          });
        } else {
          // Recetas se manejan como una serie de movimientos de productos
          const receta = recetas.find(r => r.id === item.id);
          if (receta) {
            receta.ingredientes.forEach(ing => {
              movements.push({
                producto_id: ing.producto_id,
                cantidad: ing.cantidad * item.quantity,
                tipo_movimiento: "consumo",
                bodega_id: ing.bodega_id,
                fecha_recuento: new Date().toISOString().split("T")[0]
              });
            });
          }
        }
      }

      await api.post("/inventory/stock/bulk-movements", { movements });
      toast.success("Consumo registrado correctamente");
      setCart([]);
    } catch (e) {
      toast.error("Error al registrar consumo");
    } finally {
      setSaving(false);
    }
  };

  const filteredProductos = productos.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const filteredRecetas = recetas.filter(r => r.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Registro de Consumo
        </h1>
      </div>

      <BodegaSelector />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar producto o receta..." className="pl-10" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" /> Productos
              </h2>
              <div className="space-y-2">
                {filteredProductos.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer" onClick={() => addToCart(p, "producto")}>
                    <div>
                      <p className="font-medium text-sm">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">{p.unidad}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                <CookingPot className="h-4 w-4" /> Recetas
              </h2>
              <div className="space-y-2">
                {filteredRecetas.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer" onClick={() => addToCart(r, "receta")}>
                    <div>
                      <p className="font-medium text-sm">{r.nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatMoney(r.precio)}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="rounded-xl border bg-card p-6 shadow-sm flex flex-col h-fit sticky top-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            Carrito de Consumo
          </h2>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] mb-4 pr-2">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No hay ítems agregados.</p>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.id}-${item.type}`} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={item.quantity} onChange={e => updateQuantity(item.id, item.type, Number(e.target.value))} className="h-7 w-16 text-right" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id, item.type)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t pt-4 space-y-4">
            <Button className="w-full gap-2" disabled={cart.length === 0 || saving} onClick={handleConsumo}>
              {saving ? "Registrando..." : "Registrar Consumo"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
