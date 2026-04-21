// src/pages/Dashboard/StatsGrid.tsx
import { motion } from "framer-motion";
import { Package, AlertTriangle, Calendar, TrendingUp } from "lucide-react";

export function StatsGrid({ stats }: { stats: any }) {
  const items = [
    { label: "Stock Total", value: stats.stockTotal, icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Alertas Críticas", value: stats.alertasCriticas, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Eventos Próximos", value: stats.eventosSemana, icon: Calendar, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Ventas Estimadas", value: "$4.2M", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl"
        >
          <div className={`${item.bg} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
            <item.icon size={24} />
          </div>
          <p className="text-muted-foreground font-medium text-sm">{item.label}</p>
          <h3 className="text-3xl font-black mt-1">{item.value}</h3>
        </motion.div>
      ))}
    </div>
  );
}