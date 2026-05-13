// src/pages/Configuracion/AparienciaConfig.tsx
import { useTheme, Theme } from "@/hooks/useTheme";
import { Sun, Moon, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeOption {
  id: Theme;
  label: string;
  description: string;
  icon: React.ElementType;
  preview: {
    bg: string;
    sidebar: string;
    card: string;
    accent: string;
    text: string;
    subtext: string;
    border: string;
    glow?: string;
  };
  badge?: string;
}

const THEMES: ThemeOption[] = [
  {
    id: "light",
    label: "Modo Claro",
    description: "Interfaz limpia y luminosa. Ideal para ambientes bien iluminados.",
    icon: Sun,
    preview: {
      bg: "#f0f4ff",
      sidebar: "#ffffff",
      card: "#ffffff",
      accent: "#1a9e6e",
      text: "#0d1525",
      subtext: "#6b7280",
      border: "#e5e7eb",
    },
  },
  {
    id: "dark",
    label: "Modo Oscuro",
    description: "Fondo profundo que descansa la vista. Perfecto para trabajar de noche.",
    icon: Moon,
    preview: {
      bg: "#0a0f1e",
      sidebar: "#0d1526",
      card: "#0f1a2e",
      accent: "#2ecc8f",
      text: "#e8f0fe",
      subtext: "#7c8fb0",
      border: "#1e2d48",
    },
  },
  {
    id: "cosmic-blue",
    label: "Cosmic Blue",
    description: "Universo profundo con acentos de neón cian y aurora boreal. Futurista.",
    icon: Sparkles,
    badge: "NUEVO",
    preview: {
      bg: "#060d1c",
      sidebar: "#080f1e",
      card: "#0a1326",
      accent: "#00e5ff",
      text: "#d4eeff",
      subtext: "#6699bb",
      border: "#0e2040",
      glow: "#00e5ff",
    },
  },
];

function MiniPreview({ p }: { p: ThemeOption["preview"] }) {
  return (
    <div
      className="w-full h-28 rounded-xl overflow-hidden border relative"
      style={{ backgroundColor: p.bg, borderColor: p.border }}
    >
      {/* Sidebar strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-10 flex flex-col items-center gap-1.5 pt-2"
        style={{ backgroundColor: p.sidebar, borderRight: `1px solid ${p.border}` }}
      >
        {/* Nav dots */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === 1 ? 22 : 14,
              height: 5,
              backgroundColor: i === 1 ? p.accent : p.border,
              boxShadow: i === 1 && p.glow ? `0 0 6px ${p.glow}88` : undefined,
            }}
          />
        ))}
      </div>

      {/* Main area */}
      <div className="ml-10 p-2.5 flex flex-col gap-1.5">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-1">
          <div className="rounded" style={{ width: 40, height: 6, backgroundColor: p.text + "cc" }} />
          <div
            className="rounded-full"
            style={{ width: 22, height: 6, backgroundColor: p.accent, boxShadow: p.glow ? `0 0 5px ${p.glow}88` : undefined }}
          />
        </div>

        {/* Cards row */}
        <div className="flex gap-1.5">
          {[p.accent, p.subtext, p.subtext].map((c, i) => (
            <div
              key={i}
              className="flex-1 rounded-lg"
              style={{
                backgroundColor: p.card,
                border: `1px solid ${p.border}`,
                height: 32,
                boxShadow: i === 0 && p.glow ? `0 0 8px ${p.glow}44` : undefined,
              }}
            >
              <div className="p-1">
                <div className="rounded" style={{ width: "60%", height: 4, backgroundColor: c, opacity: i === 0 ? 0.9 : 0.5 }} />
                <div className="rounded mt-1" style={{ width: "80%", height: 3, backgroundColor: p.text, opacity: 0.25 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Table rows */}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex items-center gap-1 rounded"
            style={{ backgroundColor: p.card, border: `1px solid ${p.border}`, padding: "3px 5px" }}
          >
            <div className="rounded-full" style={{ width: 7, height: 7, backgroundColor: p.accent, opacity: 0.7 }} />
            <div className="flex-1 rounded" style={{ height: 3, backgroundColor: p.text, opacity: 0.2 }} />
            <div className="rounded" style={{ width: 16, height: 3, backgroundColor: p.subtext, opacity: 0.4 }} />
          </div>
        ))}
      </div>

      {/* Glow nebula overlay for cosmic */}
      {p.glow && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 80% 20%, ${p.glow}14 0%, transparent 55%),
                         radial-gradient(ellipse at 20% 80%, #8855ff14 0%, transparent 50%)`,
          }}
        />
      )}
    </div>
  );
}

export function AparienciaConfig() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 py-2 max-w-2xl">
      <div>
        <h3 className="text-sm font-bold mb-0.5">Tema de Interfaz</h3>
        <p className="text-xs text-muted-foreground">
          Elige el aspecto visual de toda la aplicación.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {THEMES.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "relative group text-left rounded-2xl border-2 p-4 transition-all duration-200 focus:outline-none",
                isActive
                  ? t.id === "cosmic-blue"
                    ? "border-[#00e5ff] shadow-[0_0_20px_#00e5ff30]"
                    : "border-primary shadow-md shadow-primary/20"
                  : "border-border hover:border-primary/40 hover:shadow-sm"
              )}
              style={{
                backgroundColor: isActive ? t.preview.card + "66" : undefined,
              }}
            >
              {/* Badge NEW */}
              {t.badge && (
                <span
                  className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${t.preview.accent}22`,
                    color: t.preview.accent,
                    border: `1px solid ${t.preview.accent}44`,
                  }}
                >
                  {t.badge}
                </span>
              )}

              {/* Mini preview */}
              <MiniPreview p={t.preview} />

              {/* Label row */}
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: isActive ? t.preview.accent : undefined }}
                    />
                    <span className="text-sm font-bold truncate">{t.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{t.description}</p>
                </div>

                {/* Check mark */}
                {isActive && (
                  <div
                    className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: t.preview.accent }}
                  >
                    <Check className="h-3 w-3" style={{ color: t.preview.bg }} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}