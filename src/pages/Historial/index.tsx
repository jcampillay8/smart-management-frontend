// src/pages/Historial/index.tsx
import { useHistorial } from "./useHistorial";
import { useBodega } from "../../hooks/useBodega";
import { TablaHistorial } from "./TablaHistorial";
import { FiltrosHistorial } from "./FiltrosHistorial";
import BodegaSelector from "../../components/BodegaSelector";
import { History, Lock } from "lucide-react";

export default function HistorialPage() {
  const { selectedBodegaId, bodegas } = useBodega();
  const { filtered, loading, productos, filtros, computeBeforeAfter, prodName, prodUnit } = useHistorial(
    selectedBodegaId
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Historial de Movimientos</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          <Lock className="h-3 w-3" /> Inmutable
        </span>
      </div>

      <BodegaSelector />

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