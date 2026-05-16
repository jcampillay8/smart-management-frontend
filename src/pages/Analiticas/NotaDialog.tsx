// src/pages/Analiticas/NotaDialog.tsx
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import api from "../../lib/api";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_visible?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingNota?: { id: string; titulo?: string; contenido: string; urgencia: string; fecha?: string; menciones: { user_id: number }[] } | null;
  onSave: (data: { titulo: string; contenido: string; urgencia: string; fecha?: string; menciones: number[] }) => Promise<void>;
  saving: boolean;
}

const urgencias = [
  { key: "alta", label: "Alta", className: "border-destructive text-destructive bg-destructive/10 hover:bg-destructive/20" },
  { key: "media", label: "Media", className: "border-amber-500 text-amber-600 bg-amber-500/10 hover:bg-amber-500/20" },
  { key: "baja", label: "Baja", className: "border-emerald-500 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20" },
];

export function NotaDialog({ open, onOpenChange, editingNota, onSave, saving }: Props) {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [urgencia, setUrgencia] = useState("media");
  const [fecha, setFecha] = useState("");
  const [menciones, setMenciones] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get("/user/admin/all");
        setAllUsers(res.data);
        
        if (open && editingNota) {
          setUrgencia(editingNota.urgencia || "media");
          const mentionIds = editingNota.menciones.map(m => m.user_id);
          setMenciones(mentionIds);

          if (editingNota.id === "new" && mentionIds.length > 0) {
            setTitulo("");
            const mentionedUser = res.data.find((u: User) => u.id === mentionIds[0]);
            if (mentionedUser) {
              const name = mentionedUser.nombre_visible?.replace(" ", "_") ||
                `${mentionedUser.first_name}_${mentionedUser.last_name}`.replace(" ", "_") ||
                mentionedUser.username;
              setContenido(`@${name} `);
            } else {
              setContenido("");
            }
          } else {
            setTitulo(editingNota.titulo || "");
            setContenido(editingNota.contenido || "");
            setFecha(editingNota.fecha ? editingNota.fecha.split("T")[0] : "");
          }
        } else if (open) {
          setTitulo("");
          setContenido("");
          setUrgencia("media");
          setFecha("");
          setMenciones([]);
        }
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };

    if (open) {
      loadUsers();
    }
  }, [open, editingNota]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContenido(val);

    // Detect @
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const lastAt = textBefore.lastIndexOf("@");
    
    if (lastAt !== -1) {
      const query = textBefore.slice(lastAt + 1);
      // Solo mostrar si no hay espacios entre @ y el cursor
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMention(true);
      } else {
        setShowMention(false);
      }
    } else {
      setShowMention(false);
    }
  };

  const insertMention = (user: User) => {
    const name = user.nombre_visible?.replace(" ", "_") ||
      `${user.first_name}_${user.last_name}`.replace(" ", "_") ||
      user.username;

    const cursor = textareaRef.current?.selectionStart || contenido.length;
    const textBefore = contenido.slice(0, cursor);
    const withoutAt = textBefore.replace(/@\w*$/, "");
    const newText = `${withoutAt}@${name} ${contenido.slice(cursor)}`;
    setContenido(newText);

    if (!menciones.includes(user.id)) {
      setMenciones(prev => [...prev, user.id]);
    }
    setShowMention(false);
    textareaRef.current?.focus();
  };

  const filteredUsers = allUsers.filter(u => {
    const q = mentionQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.first_name.toLowerCase().includes(q) ||
      (u.nombre_visible || "").toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!contenido.trim()) return;
    await onSave({ titulo, contenido, urgencia, fecha: fecha || undefined, menciones });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingNota ? "Editar nota" : "Nueva nota"}</DialogTitle>
          <DialogDescription className="sr-only">Escribe y configura la urgencia de la nota</DialogDescription>
        </DialogHeader>

        {/* Título y Urgencia chips */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título de la nota (opcional)</label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Incidencia en cocina, Recordatorio pedido..."
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nivel de Urgencia</label>
            <div className="flex gap-2">
              {urgencias.map(u => (
                <button
                  key={u.key}
                  onClick={() => setUrgencia(u.key)}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all",
                    u.className,
                    urgencia === u.key ? "ring-2 ring-offset-1 ring-current scale-[1.02] shadow-sm" : "opacity-40"
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Fecha (Opcional para el futuro) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha del Evento (opcional)</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <p className="text-[9px] text-muted-foreground ml-1 italic">Selecciona una fecha si la nota se refiere a un suceso futuro.</p>
        </div>

        {/* Textarea con @menciones */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={contenido}
            onChange={handleChange}
            placeholder="Escribe una nota... usa @ para mencionar usuarios"
            rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {showMention && filteredUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredUsers.slice(0, 6).map(u => (
                <button
                  key={u.id}
                  onMouseDown={e => { e.preventDefault(); insertMention(u); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary text-left text-sm"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                    {u.first_name?.[0]}{u.last_name?.[0]}
                  </div>
                  <span>{u.nombre_visible || `${u.first_name} ${u.last_name}`.trim() || u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving || !contenido.trim()} className="w-full">
          {saving ? "Guardando..." : editingNota ? "Guardar cambios" : "Publicar nota"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
