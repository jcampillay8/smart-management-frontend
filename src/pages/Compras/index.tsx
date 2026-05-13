// src/pages/Compras/index.tsx
import { useState } from "react";
import { ShoppingCart, Plus, BarChart3, Clock, CheckCircle2, XCircle, Truck, PackageCheck, Upload, Share2, Pencil, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { useCompras } from "./useCompras";
import { CompraTable } from "./CompraTable";
import { CompraDetailDialog } from "./CompraDetailDialog";
import CompraDialog from "../../components/CompraDialog";
import { SubTab, Compra, ConfirmAction, ConfirmInfo } from "./types";

import { IncidenciaDialog } from "./IncidenciaDialog";
import { MercaderiaReceptionDialog } from "./MercaderiaReceptionDialog";

export default function Compras() {
  const { isAdmin } = useAuth();
  const { 
    compras, loading, loadAll, 
    deleteCompra, cancelCompra, restoreCompra, 
    markPedido, receiveCompra 
  } = useCompras();
  
  const [subTab, setSubTab] = useState<SubTab>("pendientes");
  const [viewing, setViewing] = useState<Compra | null>(null);
  const [compraDialog, setCompraDialog] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [incidenciaTarget, setIncidenciaTarget] = useState<Compra | null>(null);
  const [receptionTarget, setReceptionTarget] = useState<Compra | null>(null);

  const filtered = compras.filter(c => c.estado === subTab);

  const confirmInfo: Record<ConfirmAction["kind"], ConfirmInfo> = {
    delete: {
      title: "¿Eliminar esta compra?",
      description: "Esta acción no se puede deshacer. Se eliminarán todos los items asociados.",
      actionLabel: "Eliminar",
      danger: true,
    },
    cancel: {
      title: "¿Cancelar esta compra?",
      description: "La compra se moverá a la sección de canceladas. Podrás restaurarla más tarde.",
      actionLabel: "Cancelar compra",
      danger: true,
    },
    restore: {
      title: "¿Restaurar esta compra?",
      description: "La compra volverá a la sección de pendientes.",
      actionLabel: "Restaurar",
    },
    pedido: {
      title: "¿Confirmar pedido?",
      description: "El pedido quedará marcado como realizado al proveedor. La tarjeta cambiará de color.",
      actionLabel: "Sí, hacer pedido",
    },
    ingresar: {
      title: "¿Ingresar mercadería?",
      description: "Se abrirá el asistente de recepción para verificar los productos.",
      actionLabel: "Sí, abrir asistente",
    },
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    const { kind, id } = confirmAction;
    if (kind === "delete") await deleteCompra(id);
    if (kind === "cancel") await cancelCompra(id);
    if (kind === "restore") await restoreCompra(id);
    if (kind === "pedido") await markPedido(id);
    if (kind === "ingresar") {
      const comp = compras.find(c => c.id === id);
      if (comp) setReceptionTarget(comp);
    }
    setConfirmAction(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card backdrop-blur-md p-4 rounded-2xl border border-input shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Sub-tabs PC/Mobile */}
          <div className="flex gap-1 rounded-xl bg-muted/50 p-1.5 border border-input shadow-inner overflow-x-auto flex-1">
            {([
              { key: "pendientes", icon: Clock },
              { key: "realizadas", icon: CheckCircle2 },
              { key: "canceladas", icon: XCircle },
            ] as { key: SubTab; icon: any }[]).map(tab => {
              const Icon = tab.icon;
              const isActive = subTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSubTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> 
                  {tab.key === "pendientes" ? "Pendientes" : tab.key === "realizadas" ? "Recibidas" : "Canceladas"}
                </button>
              );
            })}
          </div>

          <Button 
            onClick={() => setCompraDialog(true)} 
            className="h-10 px-4 gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10 transition-all active:scale-95 font-black text-[10px] uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Nueva Compra
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-xl border shadow-sm">
        <CompraTable 
          compras={filtered} 
          subTab={subTab}
          onView={setViewing} 
          onEdit={(c) => { setEditingCompra(c); setCompraDialog(true); }}
          onAction={(action) => setConfirmAction(action)}
          onShare={(c) => {
            const text = `Compra ${c.fecha}\nProveedor: ${c.proveedor || "N/A"}\nTotal: $${c.total}`;
            navigator.clipboard.writeText(text);
          }}
          onDelete={isAdmin ? deleteCompra : undefined}
          onIncidencia={setIncidenciaTarget}
        />
      </div>

      {/* Detail Dialog */}
      <CompraDetailDialog 
        compra={viewing} 
        onClose={() => setViewing(null)} 
      />

      {/* Create/Edit Dialog */}
      <CompraDialog 
        open={compraDialog} 
        onOpenChange={(open) => { 
          setCompraDialog(open); 
          if (!open) setEditingCompra(null); 
        }} 
        editingCompra={editingCompra}
        onSaved={loadAll} 
      />

      {/* Confirm Alert Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-bold">{confirmInfo[confirmAction.kind].title}</h2>
            <p className="text-sm text-muted-foreground">{confirmInfo[confirmAction.kind].description}</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
              <Button 
                onClick={runConfirmAction}
                className={cn(confirmInfo[confirmAction.kind].danger && "bg-destructive text-destructive-foreground")}
              >
                {confirmInfo[confirmAction.kind].actionLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Incidencia Dialog */}
      {incidenciaTarget && (
        <IncidenciaDialog
          open={!!incidenciaTarget}
          onOpenChange={(open) => !open && setIncidenciaTarget(null)}
          compraId={incidenciaTarget.id}
          proveedorEmail={""} // Se podría traer del listado de proveedores si se vinculara por ID
          proveedorNombre={incidenciaTarget.proveedor || ""}
          total={incidenciaTarget.total}
          onResolved={() => {
            loadAll();
          }}
        />
      )}

      {/* Mercaderia Reception Dialog */}
      <MercaderiaReceptionDialog
        open={!!receptionTarget}
        onOpenChange={(open) => !open && setReceptionTarget(null)}
        compra={receptionTarget}
        onSuccess={() => {
          loadAll();
          setReceptionTarget(null);
        }}
      />
    </div>
  );
}