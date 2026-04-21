// src/pages/Login/LoginForm.tsx

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loader2, Lock, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  error: string;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  error, 
  submitting, 
  handleSubmit 
}: Props) {
  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full max-w-sm">
      {/* Campo de Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider ml-1">
          Usuario o Email
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            className="h-12 pl-10 bg-background/50 border-white/10 backdrop-blur-md focus:ring-primary/20 transition-all"
            required
          />
        </div>
      </div>

      {/* Campo de Contraseña */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">
            Contraseña
          </Label>
          <button type="button" className="text-[10px] font-bold text-primary hover:underline">
            ¿Olvidaste tu clave?
          </button>
        </div>
        <div className="relative group">
          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 pl-10 bg-background/50 border-white/10 backdrop-blur-md focus:ring-primary/20 transition-all"
            required
          />
        </div>
      </div>

      {/* Alerta de Error con Animación */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold text-center">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón de Acción */}
      <Button 
        type="submit" 
        className="w-full h-12 font-black text-base shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all" 
        disabled={submitting}
      >
        {submitting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Verificando...</span>
          </div>
        ) : (
          "Ingresar al Panel"
        )}
      </Button>

      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          Acceso Restringido a Personal Autorizado
        </p>
      </div>
    </form>
  );
}