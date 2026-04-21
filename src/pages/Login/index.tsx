// src/pages/Login/index.tsx
import { useLogin } from "./useLogin";
import { LoginBranding } from "./LoginBranding";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { email, setEmail, password, setPassword, error, submitting, handleSubmit } = useLogin();

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-secondary/30">
      <LoginBranding />
      
      <main className="flex items-center justify-center p-6 md:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Bienvenido</h2>
            <p className="text-muted-foreground">Ingresa al panel de control de inventario.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Usuario o Email</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="h-12 bg-background/50 backdrop-blur-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 bg-background/50 backdrop-blur-sm"
                required
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold text-center"
              >
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full h-12 font-bold text-base shadow-lg shadow-primary/20" disabled={submitting}>
              {submitting ? "Validando..." : "Ingresar al Sistema"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground pt-4">
            © {new Date().getFullYear()} Easy Stock Control. Todos los derechos reservados.
          </p>
        </motion.div>
      </main>
    </div>
  );
}