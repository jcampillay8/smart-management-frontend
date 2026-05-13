import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "dark" | "light" | "cosmic-blue";

const ALL_THEMES: Theme[] = ["light", "dark", "cosmic-blue"];

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void; // kept for backward compat (light↔dark cycle)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  // Remove all known theme classes first
  root.classList.remove(...ALL_THEMES);
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "cosmic-blue") {
    root.classList.add("cosmic-blue");
  }
  // "light" → no class needed (default :root vars)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && ALL_THEMES.includes(saved)) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);

  // Legacy toggle: only cycles light/dark (Navbar button)
  const toggleTheme = () =>
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
