// src/pages/Gestion/CategoriaSeccion.tsx
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import api from "../../lib/api";
import { toast } from "sonner";
import { Categoria } from "./types";

export function CategoriaSeccion({ categorias, onUpdate }: { categorias: Categoria[], onUpdate: () => void }) {
  const [nuevaCat, setNuevaCat] = useState("");

  const handleAdd = async () => {
    if (!nuevaCat) return;
    await api.post("/inventory/categories", { nombre: nuevaCat });
    setNuevaCat("");
    onUpdate();
    toast.success("Categoría creada");
  };

  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
      <h2 className="font-bold text-lg">Categorías</h2>
      <div className="flex gap-2">
        <Input placeholder="Nueva categoría..." value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} />
        <Button onClick={handleAdd} size="icon"><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => (
          <div key={cat.id} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm">
            {cat.nombre}
            <button onClick={async () => { 
                await api.delete(`/inventory/categories/${cat.id}`); 
                onUpdate(); 
            }} className="text-destructive hover:text-red-700">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}