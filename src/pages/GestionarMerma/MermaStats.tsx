// src/pages/GestionarMerma/MermaStats.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "../../lib/format";
import { TrendingDown, DollarSign } from "lucide-react";

export function MermaStats({ data, totalLost }: { data: any[], totalLost: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-card p-6 rounded-xl border shadow-sm flex items-center gap-4">
        <div className="p-3 bg-destructive/10 rounded-full text-destructive">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">Pérdida Total (Periodo)</p>
          <h3 className="text-2xl font-bold">{formatMoney(totalLost)}</h3>
        </div>
      </div>

      <div className="lg:col-span-2 bg-card p-4 rounded-xl border shadow-sm h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="fecha_recuento" hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="cantidad" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}