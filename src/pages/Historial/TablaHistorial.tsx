// src/pages/Historial/TablaHistorial.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { RegistroMovimiento, TipoMovimiento } from "./types";
import { cn } from "../../lib/utils";
import { toChileDate, toChileDatetime } from "../../lib/timezone";
import BodegaBadge from "../../components/BodegaBadge";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const tipoBadgeClass = (t: string) => {
  switch (t) {
    case "conteo":
      return "bg-primary/10 text-primary";
    case "consumo":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-400";
    case "merma":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-400";
    case "ajuste":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-400";
    case "transferencia":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400";
    default:
      return "bg-secondary text-muted-foreground";
  }
};

const tipoLabel = (t: string) => {
  const map: Record<string, string> = {
    conteo: "Conteo",
    consumo: "Consumo",
    merma: "Merma",
    ajuste: "Ajuste",
    transferencia: "Transferencia",
  };
  return map[t] ?? t;
};

interface Props {
  data: RegistroMovimiento[];
  computeBeforeAfter: (r: RegistroMovimiento) => { before: number; after: number } | null;
  prodUnit: (id: string) => string;
}

export function TablaHistorial({ data, computeBeforeAfter, prodUnit }: Props) {
  const { isAdmin } = useAuth();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary">
            <TableHead className="whitespace-nowrap">Fecha y hora</TableHead>
            <TableHead className="whitespace-nowrap">Producto</TableHead>
            <TableHead className="whitespace-nowrap">Tipo</TableHead>
            <TableHead className="whitespace-nowrap">Bodega</TableHead>
            <TableHead className="text-right whitespace-nowrap">Cantidad</TableHead>
            {isAdmin && <TableHead className="whitespace-nowrap">Usuario</TableHead>}
            <TableHead className="whitespace-nowrap">Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No hay registros.
              </TableCell>
            </TableRow>
          ) : (
            data.map((r) => {
              const ba = computeBeforeAfter(r);
              const unit = prodUnit(r.producto_id);
              return (
                <TableRow key={r.id} className="hover:bg-secondary/30">
                  <TableCell className="whitespace-nowrap">
                    <div>{toChileDate(r.created_at)}</div>
                    <div className="text-xs text-muted-foreground">{toChileDatetime(r.created_at)}</div>
                  </TableCell>
                  <TableCell className="font-medium">{r.nombre_producto || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        tipoBadgeClass(r.tipo_movimiento)
                      )}
                    >
                      {tipoLabel(r.tipo_movimiento)}
                      {r.tipo_movimiento === "transferencia" && r.descripcion_merma === "salida" && " ↑"}
                      {r.tipo_movimiento === "transferencia" && r.descripcion_merma !== "salida" && " ↓"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <BodegaBadge nombre={r.nombre_bodega || ""} />
                  </TableCell>
                  <TableCell className="text-right font-bold whitespace-nowrap">
                    {ba && ba.before !== ba.after ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-muted-foreground font-normal">{ba.before} {unit}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {ba.after} {unit}
                        </span>
                      </span>
                    ) : (
                      <>
                        {r.cantidad} {unit}
                      </>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-muted-foreground text-xs">
                      {r.user_display_name || "Sistema"}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {r.motivo_merma || "—"}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}