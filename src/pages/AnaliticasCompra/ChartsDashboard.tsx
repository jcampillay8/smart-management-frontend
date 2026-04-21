// src/pages/AnaliticasCompra/ChartsDashboard.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoney } from "../../lib/format";

export function ChartsDashboard({ data }: { data: any[] }) {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-bold mb-6 text-muted-foreground uppercase tracking-wider">
        Distribución de Gasto por Producto (Top 8)
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip 
              formatter={(val: number) => [formatMoney(val), "Total"]}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}