import { useHistorial } from "./useHistorial";
import { useBodega } from "../../hooks/useBodega";
import { TablaHistorial } from "./TablaHistorial";
import { FiltrosHistorial } from "./FiltrosHistorial";
import { AreaSelector } from "../../components/AreaSelector";
import BodegaSelector from "../../components/BodegaSelector";
import { History, Lock, Download } from "lucide-react";
import { Button } from "../../components/ui/button";

export default function HistorialPage() {
  const { selectedBodegaId, bodegas } = useBodega();
  const { filtered, loading, productos, filtros, computeBeforeAfter, prodName, prodUnit } = useHistorial(
    selectedBodegaId
  );

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    
    const headers = ["Fecha", "Bodega", "Producto", "Tipo", "Cantidad", "Usuario", "Notas"];
    const rows = filtered.map(r => {
      const pName = r.nombre_producto || prodName(r.producto_id);
      const bName = r.nombre_bodega || "—";
      const uName = r.user_display_name || "Sistema";
      const notas = [r.motivo_merma, r.descripcion_merma].filter(Boolean).join(" - ");
      
      let cantidadStr = r.cantidad.toString();
      if (r.tipo_movimiento === "conteo") {
        const ba = computeBeforeAfter(r);
        if (ba) {
          cantidadStr = `${ba.before} -> ${ba.after}`;
        }
      }
      
      return [
        r.fecha_recuento,
        bName,
        pName,
        r.tipo_movimiento,
        cantidadStr,
        uName,
        notas
      ].map(v => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_inventario_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter">Historial</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            Auditoría y Trazabilidad de Inventario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            <Lock className="h-3 w-3" /> Inmutable
          </span>
          <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-2 flex-wrap px-2">
        <AreaSelector />
        <BodegaSelector />
      </div>

      <FiltrosHistorial
        filtroProducto={filtros.filtroProducto}
        setFiltroProducto={filtros.setFiltroProducto}
        filtroTipo={filtros.filtroTipo}
        setFiltroTipo={filtros.setFiltroTipo}
        fechaDesde={filtros.fechaDesde}
        setFechaDesde={filtros.setFechaDesde}
        fechaHasta={filtros.fechaHasta}
        setFechaHasta={filtros.setFechaHasta}
        productos={productos}
      />

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Cargando historial...</div>
      ) : (
        <>
          <TablaHistorial
            data={filtered}
            computeBeforeAfter={computeBeforeAfter}
            prodUnit={prodUnit}
          />
          <p className="text-xs text-muted-foreground">
            Mostrando {filtered.length} de {filtered.length} registros
          </p>
        </>
      )}
    </div>
  );
}