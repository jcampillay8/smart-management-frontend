// src/pages/Gestion/index.tsx
import { useState } from "react";
import { CookingPot, Package, Settings2, Search, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useGestion } from "./useGestion";
import { CategoriaSeccion } from "./CategoriaSeccion";
import { ProductoDialog } from "./ProductoDialog";
import { RecetaDialog } from "./RecetaDialog";

export default function GestionPage() {
  const { categorias, productos, recetas, loading, refresh } = useGestion();
  const [busqueda, setBusqueda] = useState("");
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [recetaDialogOpen, setRecetaDialogOpen] = useState(false);

  if (loading) return <div className="p-8 text-center">Cargando catálogo...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings2 className="h-8 w-8 text-indigo-600" /> Gestión de Catálogo
          </h1>
          <p className="text-muted-foreground">Configura tus productos, recetas y reglas de negocio.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => setProdDialogOpen(true)} variant="outline" className="gap-2">
             <Package className="h-4 w-4" /> Nuevo Producto
           </Button>
           <Button onClick={() => setRecetaDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
             <Plus className="h-4 w-4" /> Nueva Receta
           </Button>
        </div>
      </header>

      <CategoriaSeccion categorias={categorias} onUpdate={refresh} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Aquí irían las listas simplificadas de Productos y Recetas */}
        <section className="space-y-4">
           <h3 className="font-bold flex items-center gap-2"><Package className="h-5 w-5"/> Productos</h3>
           {/* Mapeo de productos... */}
        </section>
        
        <section className="space-y-4">
           <h3 className="font-bold flex items-center gap-2"><CookingPot className="h-5 w-5"/> Recetas</h3>
           {/* Mapeo de recetas... */}
        </section>
      </div>

      <ProductoDialog 
        open={prodDialogOpen} 
        onOpenChange={setProdDialogOpen} 
        categorias={categorias} 
        onSuccess={refresh} 
      />

      <RecetaDialog 
        open={recetaDialogOpen} 
        onOpenChange={setRecetaDialogOpen} 
        productos={productos} 
        onSuccess={refresh} 
      />
    </div>
  );
}