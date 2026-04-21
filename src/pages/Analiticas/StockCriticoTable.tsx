// src/pages/Analiticas/StockCriticoTable.tsx

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, ArrowRight } from "lucide-react";
import { ProductoAnalitico } from "./types";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";

interface Props {
  data: ProductoAnalitico[];
}

export function StockCriticoTable({ data }: Props) {
  const navigate = useNavigate();

  // Función para calcular el color de la barra de progreso
  const getProgressColor = (current: number, min: number) => {
    if (current <= 0) return "bg-destructive";
    if (current <= min * 0.5) return "bg-orange-500";
    return "bg-amber-500";
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          Productos bajo Stock Mínimo
        </h3>
        <Badge variant="destructive">{data.length} alertas activas</Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Estado / Salud</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Todo bajo control. No hay productos en stock crítico.
                </TableCell>
              </TableRow>
            ) : (
              data.map((prod) => {
                const ratio = prod.stock_minimo > 0 ? (prod.cantidad / prod.stock_minimo) * 100 : 0;
                const cappedRatio = Math.min(Math.max(ratio, 5), 100); // Para visualización mínima del 5%

                return (
                  <TableRow key={prod.id}>
                    <TableCell>
                      <div className="font-medium">{prod.nombre}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{prod.bodega_nombre}</div>
                    </TableCell>
                    <TableCell className="w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span className={cn(prod.cantidad <= 0 ? "text-destructive" : "text-orange-600")}>
                            {prod.cantidad <= 0 ? "Agotado" : "Bajo Mínimo"}
                          </span>
                          <span>{Math.round(ratio)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", getProgressColor(prod.cantidad, prod.stock_minimo))}
                            style={{ width: `${cappedRatio}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {prod.cantidad} <span className="text-[10px] font-normal text-muted-foreground">{prod.unidad}</span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {prod.stock_minimo} {prod.unidad}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate("/compras")}
                        title="Ir a compras"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}