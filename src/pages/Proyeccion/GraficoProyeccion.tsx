// src/pages/Proyeccion/GraficoProyeccion.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { ProyeccionDataPoint } from "./types";

export function GraficoProyeccion({ data, stockMinimo }: { data: ProyeccionDataPoint[], stockMinimo: number }) {
  return (
    <div className="h-[350px] w-full bg-card border rounded-xl p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
          <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
          />
          {/* Línea de stock mínimo (Punto crítico) */}
          <ReferenceLine y={stockMinimo} stroke="red" strokeDasharray="3 3" label={{ position: 'right', value: 'Mínimo', fill: 'red', fontSize: 10 }} />
          
          <Line 
            type="monotone" 
            dataKey="stock" 
            stroke="#6366f1" 
            strokeWidth={3} 
            dot={(props) => props.payload.events?.length > 0 ? <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" /> : <></>}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}