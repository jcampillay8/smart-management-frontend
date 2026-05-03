import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { TrendingUp } from "lucide-react";

export default function FinancialVision() {
  return (
    <div className="container mx-auto pb-32 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">Visión Financiera</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Ingeniería de menú y análisis de costos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/resumen-general">
              Volver al Resumen
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/resumen-ejecutivo">
              Resumen Ejecutivo
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/control-perdidas">
              Control de Pérdidas
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-white/10 text-[10px] font-black uppercase">
            <Link to="/reportes/eficiencia-operacional">
              <TrendingUp className="h-4 w-4 mr-2" />
              Eficiencia Operacional
            </Link>
          </Button>
        </div>
      </header>
      
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-lg">Contenido de Visión Financiera próximamente...</p>
      </div>
    </div>
  );
}
