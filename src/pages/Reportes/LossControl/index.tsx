import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { AlertTriangle, RefreshCw, BarChart3, TrendingDown, Activity } from "lucide-react";
import { useLossControl } from "./useLossControl";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export default function LossControl() {
  const { summary, mermaByMotivo, topProductos, anomalias, loading, error, refresh } = useLossControl();

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
          <h1 className="text-4xl font-black tracking-tighter">Control de Pérdidas</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Monitoreo y análisis de mermas
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
            <Link to="/reportes/eficiencia-operacional">Eficiencia Operacional</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/vision-financiera">Visión Financiera</Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico Merma por Motivo - Barras Verticales */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Merma por Motivo (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mermaByMotivo}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="motivo" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value}%`, 'Porcentaje']}
              />
              <Bar dataKey="porcentaje" radius={[8, 8, 0, 0]}>
                {mermaByMotivo.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 Productos con Más Merma */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingDown size={18} /> Top 10 Productos con Merma</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {topProductos.map((prod, i) => (
              <div key={prod.producto_id} className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                    i < 3 ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500"
                  )}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{prod.nombre}</p>
                    <p className="text-xs text-muted-foreground">{prod.bodega_nombre}</p>
                  </div>
                </div>
                <span className="font-bold text-red-500">{prod.cantidad_total} unidades</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalías Detectadas */}
      <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Activity size={18} /> Anomalías Detectadas</h3>
        <div className="space-y-3">
          {anomalias.map((anomalia) => (
            <div key={anomalia.producto_id} className="p-4 rounded-xl bg-red-500/10 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-red-500">{anomalia.nombre}</p>
                <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full">
                  +{anomalia.diferencia_porcentual}% vs histórico
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Merma Actual</p>
                  <p className="font-bold">{anomalia.merma_actual}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Promedio Histórico</p>
                  <p className="font-bold">{anomalia.promedio_historico}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Desviación</p>
                  <p className="font-bold">{anomalia.desviacion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de Mermas por Motivo (Tabla) */}
      {summary && (
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4">Resumen de Mermas por Motivo</h3>
          <div className="space-y-2">
            {summary.mermas_por_motivo.map((item, i) => (
              <div key={item.motivo} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="font-medium text-sm">{item.motivo}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{item.cantidad_total} unidades</span>
                  <span className="text-sm font-bold">{item.porcentaje}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
