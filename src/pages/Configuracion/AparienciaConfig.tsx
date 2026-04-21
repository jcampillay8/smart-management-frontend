// src/pages/Configuracion/AparienciaConfig.tsx

import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export function AparienciaConfig() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant={theme === "light" ? "default" : "outline"} 
          onClick={() => setTheme("light")}
          className="flex flex-col h-24 gap-2"
        >
          <Sun className="h-6 w-6" />
          <span>Modo Claro</span>
        </Button>
        <Button 
          variant={theme === "dark" ? "default" : "outline"} 
          onClick={() => setTheme("dark")}
          className="flex flex-col h-24 gap-2"
        >
          <Moon className="h-6 w-6" />
          <span>Modo Oscuro</span>
        </Button>
      </div>
    </div>
  );
}