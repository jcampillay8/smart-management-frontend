import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { TrendingUp, RefreshCw, TrendingDown, Package, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";
import { useExecutiveOverview } from "./useExecutiveOverview";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

export default function ExecutiveOverview() {
  const { data, mermaByMotivo, insights, lowStock, loading, error, refresh } = useExecutiveOverview();

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
          <h1 className="text-4xl font-black tracking-tighter">Resumen Ejecutivo</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Indicadores clave de rendimiento y métricas
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
            <Link to="/reportes/control-perdidas">Control de Pérdidas</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/eficiencia-operacional">
              <TrendingUp className="h-4 w-4 mr-2" />
              Eficiencia Operacional
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/vision-financiera">Visión Financiera</Link>
          </Button>
        </div>
      </header>

      {/* KPIs Grid */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
            <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Valor Inventario</h3>
            <p className="text-3xl font-black mt-2">${data.valor_total_inventario.toLocaleString()}</p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
            <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">% Merma</h3>
            <p className={cn("text-3xl font-black mt-2", data.porcentaje_merma > 10 ? "text-red-500" : "text-green-500")}>
              {data.porcentaje_merma}%
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
            <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Stock Total (Unidades)</h3>
            <p className="text-3xl font-black mt-2">{data.stock_total_unidades.toLocaleString()}</p>
          </div>
          <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
            <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Rotación Promedio</h3>
            <p className="text-3xl font-black mt-2">{data.rotacion_promedio}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico Merma por Motivo - Barras Horizontales */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Merma por Motivo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mermaByMotivo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" />
              <YAxis dataKey="motivo" type="category" width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Productos con Merma */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingDown size={18} /> Top Productos con Merma</h3>
          <div className="space-y-3">
            {data?.top_mermas_productos.map((prod, i) => (
              <div key={prod.producto_id} className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{prod.nombre}</p>
                    <p className="text-xs text-muted-foreground">{prod.motivo_principal}</p>
                  </div>
                </div>
                <span className="font-bold text-red-500">{prod.cantidad_merma} unidades</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights IA */}
      <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Lightbulb size={18} /> Insights Automáticos (IA)</h3>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className={cn(
              "p-4 rounded-xl border-l-4",
              insight.tipo === "fuga_dinero" && "bg-red-500/10 border-red-500",
              insight.tipo === "sobrestock" && "bg-yellow-500/10 border-yellow-500",
              insight.tipo === "oportunidad" && "bg-green-500/10 border-green-500",
            )}>
              <p className="text-sm font-medium">{insight.mensaje}</p>
              {insight.impacto_estimado && (
                <p className="text-xs text-muted-foreground mt-1">Impacto estimado: ${insight.impacto_estimado}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Productos Bajo Stock */}
      <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Productos Bajo Stock</h3>
        <div className="space-y-3">
          {lowStock.map((prod) => (
            <div key={prod.producto_id} className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
              <div>
                <p className="font-medium text-sm">{prod.nombre}</p>
                <p className="text-xs text-muted-foreground">{prod.bodega_nombre}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-500">{prod.stock_actual} / {prod.stock_minimo}</p>
                <p className="text-xs text-muted-foreground">Stock Mín: {prod.stock_minimo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
