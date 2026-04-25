// src/pages/Gestion/CategoriaSeccion.tsx
import { useState } from "react";
import { Plus, Trash2, Pencil, ChevronDown, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import api from "../../lib/api";
import { toast } from "sonner";
import { Categoria } from "./types";
import { cn } from "../../lib/utils";

export function CategoriaSeccion({ categorias, onUpdate }: { categorias: Categoria[], onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const [nuevaCat, setNuevaCat] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const handleAdd = async () => {
    if (!nuevaCat.trim()) return;
    await api.post("/inventory/categories", { nombre: nuevaCat.trim() });
    setNuevaCat("");
    onUpdate();
    toast.success("Categoría creada");
  };

  const handleEdit = async (id: string) => {
    if (!editNombre.trim()) return;
    await api.put(`/inventory/categories/${id}`, { nombre: editNombre.trim() });
    setEditingId(null);
    setEditNombre("");
    onUpdate();
    toast.success("Categoría actualizada");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await api.delete(`/inventory/categories/${id}`);
    onUpdate();
    toast.success("Categoría eliminada");
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  const filteredCategorias = categorias.filter(c => 
    selectedCategories.size === 0 || selectedCategories.has(c.id)
  );

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent/50 transition-colors rounded-t-lg"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Categorías
        </h2>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <div className="space-y-2 px-3 pb-3">
          <div className="flex gap-2">
            <Input 
              placeholder="Nueva categoría..." 
              value={nuevaCat} 
              onChange={e => setNuevaCat(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              className="h-8 text-sm"
            />
            <Button onClick={handleAdd} size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => {
              const isEditing = editingId === cat.id;
              return isEditing ? (
                <div key={cat.id} className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={editNombre}
                    onChange={e => setEditNombre(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleEdit(cat.id)}
                    className="h-8 text-sm w-32"
                  />
                  <Button size="icon" className="h-8 w-8" onClick={() => handleEdit(cat.id)}>
                    ✓
                  </Button>
                  <Button size="icon" className="h-8 w-8" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  key={cat.id}
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors",
                    selectedCategories.has(cat.id) 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <span onClick={() => toggleCategory(cat.id)}>{cat.nombre}</span>
                  <button 
                    onClick={() => { setEditingId(cat.id); setEditNombre(cat.nombre); }} 
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)} 
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {filteredCategorias.length === 0 && categorias.length > 0 && (
            <p className="text-xs text-muted-foreground">No hay categorías que coincidan con los filtros.</p>
          )}
        </div>
      )}
    </div>
  );
}