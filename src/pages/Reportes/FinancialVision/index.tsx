import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { TrendingUp, RefreshCw, DollarSign, Calculator, Percent, ShoppingCart } from "lucide-react";
import { useFinancialVision } from "./useFinancialVision";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  "Estrellas": "#22c55e",
  "Caballos de batalla": "#3b82f6",
  "Puzzles": "#eab308",
  "Perros": "#ef4444",
};

export default function FinancialVision() {
  const { summary, matrizMenu, breakEven, primeCost, variacionPrecios, loading, error, refresh } = useFinancialVision();

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargando Datos...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-[60vh] items-center justify-center text-red-500">
      <p>Error: {error}</p>
    </div>
  );

  return (
    <div className="container mx-auto pb-32 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">Visión Financiera</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Ingeniería de menú y análisis de costos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={refresh} className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/resumen-general">Volver al Resumen</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/resumen-ejecutivo">Resumen Ejecutivo</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/control-perdidas">Control de Pérdidas</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/eficiencia-operacional">
              <TrendingUp className="h-4 w-4 mr-2" />
              Eficiencia Operacional
            </Link>
          </Button>
        </div>
      </header>

      {/* KPIs Financieros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {breakEven && (
          <>
            <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
              <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Gastos Fijos</h3>
              <p className="text-3xl font-black mt-2">${breakEven.gastos_fijos.toLocaleString()}</p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
              <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Punto Equilibrio</h3>
              <p className="text-3xl font-black mt-2">${breakEven.punto_equilibrio.toLocaleString()}</p>
            </div>
          </>
        )}
        {primeCost && (
          <>
            <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
              <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Prime Cost</h3>
              <p className={cn("text-3xl font-black mt-2", primeCost.prime_cost_porcentaje > 70 ? "text-red-500" : "text-green-500")}>
                {primeCost.prime_cost_porcentaje}%
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
              <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Costo Alimentos</h3>
              <p className="text-3xl font-black mt-2">${primeCost.costo_alimentos.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Matriz de Menú (Ingeniería de Menú) */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Calculator size={18} /> Matriz de Menú</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {matrizMenu.map((plato) => (
              <div key={plato.receta_id} className="p-4 bg-background/50 rounded-xl border-l-4" style={{ borderColor: CATEGORY_COLORS[plato.categoria] || "#666" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{plato.nombre}</p>
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-bold"
                    style={{ 
                      backgroundColor: `${CATEGORY_COLORS[plato.categoria]}20`,
                      color: CATEGORY_COLORS[plato.categoria] 
                    }}
                  >
                    {plato.categoria}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Precio Venta</p>
                    <p className="font-bold">${plato.precio_venta.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Costo Receta</p>
                    <p className="font-bold">${plato.costo_receta.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Margen %</p>
                    <p className={cn("font-bold", plato.margen_porcentaje < 70 ? "text-red-500" : "text-green-500")}>
                      {plato.margen_porcentaje}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Margen por Plato */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><DollarSign size={18} /> Margen por Plato</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={matrizMenu} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Margen']}
              />
              <Bar dataKey="margen" radius={[0, 8, 8, 0]}>
                {matrizMenu.map((plato, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[plato.categoria] || "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prime Cost Detalle */}
      {primeCost && (
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Percent size={18} /> Análisis de Prime Cost</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-background/50 rounded-xl">
              <p className="text-muted-foreground text-xs">Costo Alimentos</p>
              <p className="text-2xl font-black mt-1">${primeCost.costo_alimentos.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-xl">
              <p className="text-muted-foreground text-xs">Costo Labor</p>
              <p className="text-2xl font-black mt-1">${primeCost.costo_labor.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-xl">
              <p className="text-muted-foreground text-xs">Total Prime Cost</p>
              <p className="text-2xl font-black mt-1">${primeCost.total_prime_cost.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-xl">
              <p className="text-muted-foreground text-xs">Ventas Totales</p>
              <p className="text-2xl font-black mt-1">${primeCost.ventas_totales.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-xl">
              <p className="text-muted-foreground text-xs">Prime Cost %</p>
              <p className={cn("text-2xl font-black mt-1", primeCost.prime_cost_porcentaje > 70 ? "text-red-500" : "text-green-500")}>
                {primeCost.prime_cost_porcentaje}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Variación de Precios */}
      {variacionPrecios.length > 0 && (
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Variación de Precios</h3>
          <div className="space-y-3">
            {variacionPrecios.map((item) => (
              <div key={item.producto_id} className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
                <div>
                  <p className="font-medium text-sm">{item.nombre}</p>
                  {item.proveedor_nombre && (
                    <p className="text-xs text-muted-foreground">{item.proveedor_nombre}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm line-through text-muted-foreground">${item.precio_anterior}</span>
                  <span className="font-bold text-green-500">${item.precio_actual}</span>
                  <span className={cn("text-xs px-2 py-1 rounded-full", item.porcentaje_cambio > 0 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500")}>
                    {item.porcentaje_cambio > 0 ? "+" : ""}{item.porcentaje_cambio}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
