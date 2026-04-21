// src/pages/AnaliticasCompra/index.tsx

import { ChevronLeft, TrendingUp, Calendar, ShoppingCart } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAnaliticasCompra } from "./useAnaliticasCompra";
import { ChartsDashboard } from "./ChartsDashboard";
import { RecurrenciaLista } from "./RecurrenciaLista";
import { formatMoney } from "../../lib/format";

interface Props {
  onBack: () => void;
  compras: any[];
  items: any[];
  productos: any[];
}

export default function AnaliticasCompraPage({ onBack, compras, items, productos }: Props) {
  const { statsMes, chartData, productosRecurrentes } = useAnaliticasCompra(compras, items, productos);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Análisis de Compras</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Resumen de abastecimiento histórico
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Gasto Mes Actual</p>
          <p className="text-2xl font-black text-emerald-900">{formatMoney(statsMes.gastoTotal)}</p>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
          <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Órdenes Realizadas</p>
          <p className="text-2xl font-black text-indigo-900">{statsMes.conteo} Facturas</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartsDashboard data={chartData} />
        </div>
        <div>
          <RecurrenciaLista data={productosRecurrentes} />
        </div>
      </div>
    </div>
  );
}