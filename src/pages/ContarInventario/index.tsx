// src/pages/ContarInventario/index.tsx
import { useState, useEffect } from "react";
import { ClipboardCheck, Search, Play, CheckCircle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useBodega } from "../../hooks/useBodega";
import api from "../../lib/api";
import { useContarInventario } from "./useContarInventario";
import { InventarioTable } from "./InventarioTable";
import { InventarioRevision } from "./InventarioRevision";

export default function ContarInventario() {
  const { selectedBodegaId, bodegas } = useBodega();
  const { step, setStep, items, setItems, discrepancias, calcularDiscrepancias } = useContarInventario();
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    api.get("/inventory/products").then(res => setProductos(res.data));
  }, []);

  const addItem = (prodId: string) => {
    setItems([...items, { 
      producto_id: prodId, 
      cantidad_contada: 0, 
      fecha_vencimiento: "", 
      localId: Math.random().toString(36).substr(2, 9) 
    }]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Recuento de Inventario
          </h1>
          <p className="text-muted-foreground text-sm">Sincroniza el stock físico con el sistema.</p>
        </div>
      </header>

      {step === "idle" && (
        <div className="bg-card p-12 border rounded-xl text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Play className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Iniciar nuevo recuento</h2>
          <p className="text-muted-foreground">Selecciona una bodega y comienza a escanear o ingresar productos.</p>
          <Button onClick={() => setStep("counting")} disabled={selectedBodegaId === "all"}>
            Comenzar en {selectedBodegaId === "all" ? "Selecciona una bodega" : "Bodega Actual"}
          </Button>
        </div>
      )}

      {step === "counting" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <InventarioTable 
              items={items} 
              productos={productos} 
              onUpdate={(id, f, v) => setItems(items.map(i => i.localId === id ? {...i, [f]: v} : i))}
              onRemove={(id) => setItems(items.filter(i => i.localId !== id))}
            />
            <Button className="w-full" variant="outline" onClick={() => setStep("idle")}>Cancelar</Button>
          </div>
          <aside className="space-y-4">
             <div className="bg-card p-4 border rounded-xl">
               <h3 className="font-bold mb-4">Añadir Productos</h3>
               {/* Aquí podrías poner un buscador de productos que llame a addItem(id) */}
               <Button className="w-full" onClick={() => calcularDiscrepancias(selectedBodegaId, productos)}>
                 Revisar Diferencias
               </Button>
             </div>
          </aside>
        </div>
      )}

      {step === "reviewing" && (
        <InventarioRevision 
          data={discrepancias} 
          onConfirm={() => { /* Lógica de POST final */ }}
          onBack={() => setStep("counting")}
        />
      )}
    </div>
  );
}