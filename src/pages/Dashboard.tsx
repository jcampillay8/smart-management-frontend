import { motion } from "framer-motion";
import { 
  TrendingUp, Package, AlertTriangle, 
  Calendar, ArrowRight, ClipboardCheck 
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const stats = [
  { label: "Stock Total", value: "1,240", sub: "Unidades", icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Ventas del Mes", value: "$4.2M", sub: "+12.5% vs mes ant.", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  { label: "Alertas Críticas", value: "3", sub: "Productos por vencer", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  { label: "Eventos Próximos", value: "5", sub: "Esta semana", icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Hola, <span className="text-primary">{user?.firstName || user?.username}</span> 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Aquí tienes un resumen de lo que está pasando en tu inventario hoy.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-3xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-secondary text-muted-foreground">Actualizado</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            <p className="text-xs text-muted-foreground mt-2">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Actividad Reciente
            </h2>
            <button className="text-sm text-primary font-bold flex items-center gap-1 hover:underline">
              Ver todo <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="glass-card rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Acción</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Producto</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">Entrada de Stock</td>
                    <td className="px-6 py-4 text-sm">Harina de Trigo 5kg</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">Hoy, 14:30</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-success/10 text-success text-[10px] font-bold uppercase">Completado</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Alertas Críticas</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="glass-card p-4 rounded-2xl flex gap-4 items-center border-l-4 border-l-destructive">
                <div className="h-10 w-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Aceite de Oliva 1L</p>
                  <p className="text-xs text-muted-foreground">Quedan solo 2 unidades (Bajo mínimo)</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-4 glass-card rounded-2xl text-primary font-bold hover:bg-primary hover:text-white transition-all">
            Gestionar Mermas
          </button>
        </div>
      </div>
    </div>
  );
}
