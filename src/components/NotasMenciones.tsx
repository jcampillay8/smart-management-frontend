// src/components/NotasMenciones.tsx

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { MessageSquare, AtSign } from "lucide-react";
import { cn } from "../lib/utils";

interface User {
  id: string;
  nombre: string;
  avatar_url?: string;
}

interface Nota {
  id: string;
  autor: string;
  fecha: string;
  contenido: string;
}

interface Props {
  notas: Nota[];
  usuarios: User[];
  onAddNota: (contenido: string) => void;
}

export function NotasMenciones({ notas, usuarios, onAddNota }: Props) {
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);

  const filteredUsers = useMemo(() => {
    const lastWord = text.split(" ").pop() || "";
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1).toLowerCase();
      return usuarios.filter(u => u.nombre.toLowerCase().includes(query));
    }
    return [];
  }, [text, usuarios]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const lastWord = val.split(" ").pop() || "";
    setShowMentions(lastWord.startsWith("@") && filteredUsers.length > 0);
  };

  const insertMention = (user: User) => {
    const words = text.split(" ");
    words.pop(); // remove the @query
    const newText = [...words, `@${user.nombre} `].join(" ");
    setText(newText);
    setShowMentions(false);
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddNota(text);
    setText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" /> Notas Internas
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {notas.length === 0 ? (
          <p className="text-[10px] italic text-muted-foreground text-center py-4">No hay notas registradas.</p>
        ) : (
          notas.map(n => (
            <div key={n.id} className="p-2 rounded-xl bg-muted/30 border border-border/50 text-[11px]">
               <div className="flex justify-between mb-1 opacity-60">
                 <span className="font-bold">{n.autor}</span>
                 <span>{n.fecha}</span>
               </div>
               <p className="whitespace-pre-wrap">{n.contenido}</p>
            </div>
          ))
        )}
      </div>

      <div className="relative">
        <Textarea 
          value={text}
          onChange={handleInput}
          placeholder="Escribe una nota... usa @ para mencionar"
          className="min-h-[80px] rounded-xl border-2 text-xs bg-background/50"
        />
        
        {showMentions && (
          <div className="absolute bottom-full left-0 mb-1 w-full bg-popover border-2 rounded-xl shadow-2xl overflow-hidden z-50">
            {filteredUsers.map(u => (
              <button 
                key={u.id}
                onClick={() => insertMention(u)}
                className="flex items-center gap-2 w-full p-2 hover:bg-accent text-left transition-colors"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="text-[10px]">{u.nombre.slice(0,2)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold">{u.nombre}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
           <AtSign className={cn("h-4 w-4 text-muted-foreground transition-colors", showMentions && "text-primary")} />
           <Button size="sm" onClick={handleAdd} disabled={!text.trim()} className="h-8 rounded-lg font-black text-[10px] uppercase">
             Añadir Nota
           </Button>
        </div>
      </div>
    </div>
  );
}
