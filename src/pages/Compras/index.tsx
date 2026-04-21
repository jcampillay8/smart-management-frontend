// src/pages/Compras/index.tsx
import { useState } from "react";
import { ShoppingCart, Plus, BarChart3 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { useCompras } from "./useCompras";
import { CompraTable } from "./CompraTable";
import { CompraDetailDialog } from "./CompraDetailDialog";
import CompraDialog from "../../components/CompraDialog"; // El que usas para crear
import { SubTab, Compra } from "./types";

export default function Compras() {
  const { isAdmin } = useAuth();
  const { compras, loading, deleteCompra, loadAll } = useCompras();
  const [subTab, setSubTab] = useState<SubTab>("realizadas");
  const [viewing, setViewing] = useState<Compra | null>(null);
  const [compraDialog, setCompraDialog] = useState(false);

  const filtered = compras.filter(c => c.estado === subTab);

  if (loading) return <div className="p-8 text-center">Cargando compras...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary" /> Gestión de Compras
        </h1>
        <Button onClick={() => setCompraDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Compra
        </Button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {(["realizadas", "pendientes", "canceladas"] as SubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap",
              subTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <CompraTable 
          compras={filtered} 
          onView={setViewing} 
          onDelete={deleteCompra} 
          isAdmin={!!isAdmin} 
        />
      </div>

      {/* Diálogos */}
      <CompraDetailDialog 
        compra={viewing} 
        onClose={() => setViewing(null)} 
      />
      
      <CompraDialog 
        open={compraDialog} 
        onOpenChange={setCompraDialog} 
        onSaved={loadAll} 
      />
    </div>
  );
}