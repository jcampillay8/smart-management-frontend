// src/pages/Informes/ExportadorInformes.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Calendar as CalendarIcon, FileStack } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { ExportMode } from "./types";

export function ExportadorInformes() {
  const [exportMode, setExportMode] = useState<ExportMode>("single");
  const [singleDate, setSingleDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [rangeStart, setRangeStart] = useState<string>(format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd"));
  const [rangeEnd, setRangeEnd] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    toast.info("Generando informe detallado...");

    const dateFrom = exportMode === "single" ? singleDate : rangeStart;
    const dateTo = exportMode === "single" ? singleDate : rangeEnd;

    try {
      // Petición al endpoint de historial con filtros de fecha
      const res = await api.get(`/inventory/history?fecha_desde=${dateFrom}&fecha_hasta=${dateTo}`);
      const data = res.data;

      if (!data || data.length === 0) {
        toast.error("No hay movimientos en el rango seleccionado");
        return;
      }

      // Construcción del CSV con encabezados técnicos
      let csv = "\uFEFF"; // BOM para asegurar compatibilidad con acentos en Excel
      csv += "Fecha,Producto,Tipo,Cantidad,Bodega,Usuario,Motivo/Detalle\n";
      
      data.forEach((r: any) => {
        const row = [
          r.created_at,
          r.producto_id, // Podrías mapear el nombre aquí si pasas la lista de productos
          r.tipo_movimiento,
          r.cantidad,
          r.bodega_id,
          r.user_display_name || "Sistema",
          `"${(r.motivo_merma || r.descripcion_merma || "").replace(/"/g, '""')}"`
        ];
        csv += row.join(",") + "\n";
      });

      // Descarga del archivo
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `informe_inventario_${dateFrom}_al_${dateTo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Informe descargado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el archivo");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-6 border-primary/10 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <FileStack className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Exportador de Datos</h2>
          <p className="text-xs text-muted-foreground">Descarga los registros de movimientos en formato CSV para Excel.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="space-y-2 w-full md:w-40">
          <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Rango</label>
          <Select value={exportMode} onValueChange={(v: ExportMode) => setExportMode(v)}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Un solo día</SelectItem>
              <SelectItem value="range">Rango de fechas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {exportMode === "single" ? (
          <div className="space-y-2 w-full md:w-48">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Fecha</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="date" 
                value={singleDate} 
                onChange={(e) => setSingleDate(e.target.value)} 
                className="pl-9 bg-background"
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2 w-full md:w-auto">
            <div className="space-y-2 flex-1 md:w-44">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Desde</label>
              <Input 
                type="date" 
                value={rangeStart} 
                onChange={(e) => setRangeStart(e.target.value)} 
                className="bg-background"
              />
            </div>
            <div className="space-y-2 flex-1 md:w-44">
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Hasta</label>
              <Input 
                type="date" 
                value={rangeEnd} 
                onChange={(e) => setRangeEnd(e.target.value)} 
                className="bg-background"
              />
            </div>
          </div>
        )}

        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full md:w-auto px-6 shadow-md transition-all hover:shadow-lg active:scale-95"
        >
          {isExporting ? (
            "Procesando..."
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" /> Descargar CSV
            </>
          )}
        </Button>
      </div>
    </section>
  );
}