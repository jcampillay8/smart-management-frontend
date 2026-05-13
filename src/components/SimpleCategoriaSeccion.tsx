// src/components/SimpleCategoriaSeccion.tsx
import { motion } from "framer-motion";
import { Categoria } from "../pages/Gestion/types";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import * as LucideIcons from "lucide-react";
import { Tag } from "lucide-react";

const CategoryIcon = ({ name, className }: { name?: string; className?: string }) => {
  const Icon = name && (LucideIcons as any)[name] ? (LucideIcons as any)[name] : Tag;
  return <Icon className={className} />;
};

interface SimpleCategoriaSeccionProps {
  categorias: Categoria[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SimpleCategoriaSeccion({ 
  categorias, 
  selectedIds, 
  onToggle, 
  onClear,
  className 
}: SimpleCategoriaSeccionProps) {
  return (
    <div className={cn("w-full overflow-x-auto pb-2 custom-scrollbar", className)}>
      <div className="flex justify-center md:flex-wrap items-center gap-2 py-3 px-4 min-w-max md:min-w-0 mx-auto">
        <div className="grid grid-flow-col grid-rows-2 gap-2 md:contents">
          {categorias.map(cat => {
            const isSelected = selectedIds.has(cat.id);
            return (
              <motion.div 
                key={cat.id} 
                layout="position"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                  mass: 1.2,
                }}
                className="group relative"
              >
                <Badge
                  onClick={() => onToggle(cat.id)}
                  style={{
                    backgroundColor: isSelected
                      ? cat.color || "#6366F1"
                      : cat.color ? `${cat.color}15` : undefined,
                    color: isSelected ? "#fff" : cat.color || undefined,
                    borderColor: cat.color ? `${cat.color}40` : undefined,
                    boxShadow: isSelected && cat.color ? `0 0 12px ${cat.color}40` : undefined,
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 h-8 border cursor-pointer select-none transition-all duration-200 whitespace-nowrap rounded-xl",
                    isSelected ? "scale-105 font-black border-transparent" : "hover:scale-105 hover:bg-secondary/50"
                  )}
                >
                  <CategoryIcon name={cat.icono} className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{cat.nombre}</span>
                </Badge>
              </motion.div>
            );
          })}
        </div>
        
        {onClear && selectedIds.size > 0 && (
          <button 
            onClick={onClear}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-colors shrink-0 h-8 flex items-center border border-destructive/20 ml-2"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
