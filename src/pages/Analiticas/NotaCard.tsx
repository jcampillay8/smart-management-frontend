import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, Banknote, Utensils, ConciergeBell, Shield, Search, Box, BadgeCheck, User as UserIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Nota } from "./useNotas";
import api from "../../lib/api";

const API_URL = api.defaults.baseURL;

const CARGO_ICONS: Record<string, any> = {
  "Cajero": Banknote,
  "Cocinero": Utensils,
  "Garzón": ConciergeBell,
  "Administrador": Shield,
  "Supervisor": Search,
  "Bodeguero": Box,
  "Dueño": BadgeCheck,
};

const urgencyBorder = {
  alta: "border-destructive",
  media: "border-amber-500",
  baja: "border-emerald-500",
};

const urgencyBadge = {
  alta: "bg-destructive/10 text-destructive",
  media: "bg-amber-500/10 text-amber-600",
  baja: "bg-emerald-500/10 text-emerald-600",
};

const urgencyLabel = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

function renderContenido(text: string) {
  // Resaltar @menciones
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-primary font-semibold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface Props {
  nota: Nota;
  currentUserId?: number;
  onEdit: (nota: Nota) => void;
  onDelete: (id: string) => void;
  onMention?: (userId: number) => void;
}

export function NotaCard({ nota, currentUserId, onEdit, onDelete, onMention }: Props) {
  const autor = nota.autor;
  const initials = autor?.first_name
    ? `${autor.first_name[0]}${autor.last_name?.[0] || ""}`.toUpperCase()
    : autor?.username?.slice(0, 2).toUpperCase() || "U";

  const displayName = autor?.nombre_visible ||
    (autor?.first_name ? `${autor.first_name} ${autor.last_name || ""}`.trim() : autor?.username) ||
    "Usuario";

  const avatarSrc = autor?.user_image || autor?.avatar_url;
  const isOwner = currentUserId === nota.autor_id;
  const CargoIcon = CARGO_ICONS[autor?.occupation || ""] || UserIcon;

  return (
    <div className={cn(
      "rounded-2xl border bg-card/40 backdrop-blur-md p-5 space-y-4 border-l-[6px] shadow-lg transition-all hover:translate-y-[-2px] hover:shadow-xl",
      urgencyBorder[nota.urgencia]
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <button 
            onClick={() => autor?.id && onMention?.(autor.id)}
            className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0 border border-primary/20 overflow-hidden shadow-inner hover:scale-110 hover:ring-2 hover:ring-primary/40 transition-all active:scale-95"
          >
            {avatarSrc ? (
              <img src={avatarSrc} className="h-full w-full object-cover" alt={displayName} />
            ) : (
              initials
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black tracking-tight truncate">{displayName}</p>
              {autor?.occupation && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary/80 text-[8px] font-black uppercase tracking-tighter text-muted-foreground">
                  <CargoIcon className="h-2.5 w-2.5" />
                  {autor.occupation}
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <span className="opacity-50">Publicado</span>
              {formatDistanceToNow(new Date(nota.created_at), { addSuffix: true, locale: es })}
              {nota.fecha && (
                <>
                  <span className="mx-1">•</span>
                  <span className="text-primary font-bold">Evento: {new Date(nota.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", urgencyBadge[nota.urgencia])}>
            {urgencyLabel[nota.urgencia]}
          </span>
          {isOwner && (
            <div className="flex gap-1">
              <button onClick={() => onEdit(nota)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(nota.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Título y Contenido */}
      <div className="space-y-1.5">
        {nota.titulo && (
          <h4 className="text-sm font-black uppercase tracking-tight text-foreground/90">{nota.titulo}</h4>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground font-medium">
          {renderContenido(nota.contenido)}
        </p>
      </div>
    </div>
  );
}
