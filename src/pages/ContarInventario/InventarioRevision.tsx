// src/pages/ContarInventario/InventarioRevision.tsx

import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { AlertTriangle, ArrowLeft, CheckCircle, Download } from "lucide-react";
import { formatMoney } from "../../lib/format";
import { cn } from "../../lib/utils";
import { Discrepancia } from "./types";
import BodegaBadge from "../../components/BodegaBadge";
import * as XLSX from "xlsx";

interface InventarioRevisionProps {
  data: Discrepancia[];
  onConfirm: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

export function InventarioRevision({ data, onConfirm, onBack, isSaving }: InventarioRevisionProps) {
  
  // Cálculo de totales para el resumen
  const stats = useMemo(() => {
    return data.reduce((acc, curr) => ({
      totalImpacto: acc.totalImpacto + curr.impacto_clp,
      faltantes: acc.faltantes + (curr.diferencia < 0 ? 1 : 0),
      sobrantes: acc.sobrantes + (curr.diferencia > 0 ? 1 : 0)
    }), { totalImpacto: 0, faltantes: 0, sobrantes: 0 });
  }, [data]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Discrepancias");
    XLSX.writeFile(wb, `Revision_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Impacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 border rounded-xl shadow-sm">
          <p className="text-sm text-muted-foreground">Impacto Económico Total</p>
          <p className={cn("text-2xl font-bold", stats.totalImpacto >= 0 ? "text-emerald-600" : "text-destructive")}>
            {stats.totalImpacto > 0 ? "+" : ""}{formatMoney(stats.totalImpacto)}
          </p>
        </div>
        <div className="bg-card p-4 border rounded-xl shadow-sm">
          <p className="text-sm text-muted-foreground">Productos con Faltante</p>
          <p className="text-2xl font-bold text-amber-600">{stats.faltantes}</p>
        </div>
        <div className="bg-card p-4 border rounded-xl shadow-sm">
          <p className="text-sm text-muted-foreground">Productos con Sobrante</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sobrantes}</p>
        </div>
      </div>

      {/* Alerta de Seguridad */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Revisión de Seguridad</p>
          <p>Al confirmar, el sistema generará movimientos de ajuste automáticos para que el stock del sistema coincida con lo contado. Esta acción no se puede deshacer.</p>
        </div>
      </div>

      {/* Tabla de Detalles */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Sistema</TableHead>
              <TableHead className="text-right">Contado</TableHead>
              <TableHead className="text-right">Diferencia</TableHead>
              <TableHead className="text-right">Impacto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">
                  {item.producto_nombre}
                  <div className="md:hidden mt-1">
                    <BodegaBadge nombre={item.bodega_nombre} />
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {item.stock_sistema} {item.unidad}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.stock_contado} {item.unidad}
                </TableCell>
                <TableCell className={cn("text-right font-bold", item.diferencia < 0 ? "text-destructive" : "text-emerald-600")}>
                  {item.diferencia > 0 ? "+" : ""}{item.diferencia}
                </TableCell>
                <TableCell className={cn("text-right font-bold", item.impacto_clp < 0 ? "text-destructive" : "text-emerald-600")}>
                  {formatMoney(item.impacto_clp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Botonera */}
      <div className="flex flex-col md:flex-row justify-between gap-4 pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSaving} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver a editar conteo
        </Button>
        
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" /> Exportar Planilla
          </Button>
          <Button onClick={onConfirm} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {isSaving ? "Sincronizando..." : "Confirmar y Sincronizar Stock"} <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}