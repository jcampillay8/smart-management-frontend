// src/pages/Dashboard/index.tsx
import { useAuth } from "../../hooks/useAuth";
import { useDashboard } from "./useDashboard";
import { StatsGrid } from "./StatsGrid";
import { UltimosMovimientos } from "./UltimosMovimientos";
import { AlertasList } from "./AlertasList";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const { stockTotal, alertasCriticas, eventosSemana, movimientos, loading } = useDashboard();

  return (
    <div className="space-y-10 pb-10">
      <motion.header 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">
          Hola, <span className="text-primary">{user?.firstName || user?.username}</span> 👋
        </h1>
        <p className="text-muted-foreground text-lg italic">
          Esto es lo que está pasando en tu inventario hoy.
        </p>
      </motion.header>

      {/* Grid de KPIs */}
      <StatsGrid stats={{ stockTotal, alertasCriticas, eventosSemana }} />

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Columna Principal: Tabla de Actividad */}
        <div className="lg:col-span-2 space-y-6">
          <UltimosMovimientos movimientos={movimientos} loading={loading} />
        </div>

        {/* Columna Lateral: Alertas y Accesos Rápidos */}
        <div className="space-y-6">
          <AlertasList cantidad={alertasCriticas} />
          
          <div className="glass-card p-6 rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <h3 className="font-bold mb-2">Acceso Rápido</h3>
            <p className="text-sm opacity-80 mb-4">¿Llegó mercadería nueva?</p>
            <button className="w-full py-3 bg-white text-primary font-bold rounded-xl hover:bg-opacity-90 transition-all">
              Registrar Compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}