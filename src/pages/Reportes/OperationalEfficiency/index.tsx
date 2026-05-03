import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { RefreshCw, ArrowRightLeft, AlertTriangle, BarChart3 } from "lucide-react";
import { useOperationalEfficiency } from "./useOperationalEfficiency";
import { cn } from "../../../lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const COLORES = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6"];

export default function OperationalEfficiency() {
  const { summary, rotacionProductos, transferencias, alertasPuntoPedido, loading, error, refresh } = useOperationalEfficiency();

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
          <h1 className="text-4xl font-black tracking-tighter">Eficiencia Operacional</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Rotación de inventario y puntos de pedido
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
            <Link to="/reportes/control-perdidas">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Control de Pérdidas
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/vision-financiera">Visión Financiera</Link>
          </Button>
        </div>
      </header>

      {/* KPI: Rotación Promedio */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5 md:col-span-2 lg:col-span-1">
            <h3 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Rotación Promedio General</h3>
            <p className="text-3xl font-black mt-2">{summary.rotacion_promedio_general}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Rotación por Producto */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Rotación por Producto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rotacionProductos.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" />
              <YAxis dataKey="nombre" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="rotacion" radius={[0, 8, 8, 0]}>
                {rotacionProductos.slice(0, 10).map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transferencias Recientes */}
        <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><ArrowRightLeft size={18} /> Transferencias Recientes</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {transferencias.map((transf: any) => (
              <div key={transf.id} className="p-3 bg-background/50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{transf.producto_nombre}</p>
                  <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded-full">
                    {transf.cantidad} unidades
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{transf.bodega_origen}</span>
                  <span>→</span>
                  <span>{transf.bodega_destino}</span>
                  <span className="ml-auto">{new Date(transf.fecha).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas de Punto de Pedido */}
      <div className="p-6 rounded-2xl bg-secondary/50 border border-white/5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Alertas Punto de Pedido</h3>
        <div className="space-y-3">
          {alertasPuntoPedido.map((alerta: any) => (
            <div key={alerta.producto_id} className={cn(
              "p-4 rounded-xl border-l-4",
              alerta.diferencia < 0 ? "bg-red-500/10 border-red-500" : "bg-yellow-500/10 border-yellow-500"
            )}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{alerta.nombre}</p>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full font-bold",
                  alerta.diferencia < 0 ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                )}>
                  {alerta.diferencia < 0 ? "Por debajo" : "Cerca del punto"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Stock Actual</p>
                  <p className="font-bold">{alerta.stock_actual}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Punto de Pedido</p>
                  <p className="font-bold">{alerta.punto_pedido}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Diferencia</p>
                  <p className={cn("font-bold", alerta.diferencia < 0 ? "text-red-500" : "text-yellow-500")}>
                    {alerta.diferencia}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
