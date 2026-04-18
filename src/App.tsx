import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { BodegaProvider } from "./hooks/useBodega";
import { UndoRedoProvider } from "./hooks/useUndoRedo";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";

// Pages
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import StockRegistro from "./pages/StockRegistro";
import Consumo from "./pages/Consumo";
import Gestion from "./pages/Gestion";
import Analiticas from "./pages/Analiticas";
import GestionarMerma from "./pages/GestionarMerma";
import Informes from "./pages/Informes";
import Proyeccion from "./pages/Proyeccion";
import Historial from "./pages/Historial";
import Eventos from "./pages/Eventos";
import Configuracion from "./pages/Configuracion";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
         <div className="h-12 w-12 animate-spin rounded-2xl border-4 border-primary border-t-transparent shadow-lg shadow-primary/20" />
         <p className="text-sm font-medium animate-pulse">Iniciando sistema...</p>
      </div>
    </div>
  );
  return session ? <>{children}</> : <Navigate to="/login" replace />;
};

import { ThemeProvider } from "./hooks/useTheme";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UndoRedoProvider>
          <BodegaProvider>
            <TooltipProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                    <Route path="/" element={<StockRegistro />} />
                    <Route path="/consumo" element={<Consumo />} />
                    <Route path="/analiticas" element={<Analiticas />} />
                    <Route path="/gestion" element={<Gestion />} />
                    <Route path="/gestionar-merma" element={<GestionarMerma />} />
                    <Route path="/informes" element={<Informes />} />
                    <Route path="/proyeccion" element={<Proyeccion />} />
                    <Route path="/historial" element={<Historial />} />
                    <Route path="/eventos" element={<Eventos />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </BodegaProvider>
        </UndoRedoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
