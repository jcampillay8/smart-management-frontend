import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { BodegaProvider } from "./hooks/useBodega";
import { AreaOperativaProvider } from "./hooks/useAreaOperativa";
import { UndoRedoProvider } from "./hooks/useUndoRedo";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";

// Pages
import Login from "./pages/Login/index";
import AppLayout from "./components/AppLayout";
import StockRegistro from "./pages/StockRegistro/index";
import Consumo from "./pages/Consumo/index";
import Gestion from "./pages/Gestion/index";
import Analiticas from "./pages/Analiticas/index";
import Actividades from "./pages/Actividades/index";
import GestionarMerma from "./pages/GestionarMerma/index";
import Informes from "./pages/Informes/index";
import Proyeccion from "./pages/Proyeccion/index";
import Historial from "./pages/Historial/index";
import Eventos from "./pages/Eventos/index";
import Configuracion from "./pages/Configuracion/index";
import Compras from "./pages/Compras/index";
import ContarInventario from "./pages/ContarInventario/index";
import Proveedores from "./pages/Proveedores/index";
import ExecutiveOverview from "./pages/Reportes/ExecutiveOverview/index";
import LossControl from "./pages/Reportes/LossControl/index";
import OperationalEfficiency from "./pages/Reportes/OperationalEfficiency/index";
import FinancialVision from "./pages/Reportes/FinancialVision/index";
import PanelEjecutivo from "./pages/Reportes/ResumenGeneral/index";

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
                    <Route path="/reportes/resumen-general" element={<Informes />} />
                    <Route path="/proyeccion" element={<Proyeccion />} />
                    <Route path="/historial" element={<Historial />} />
                    <Route path="/eventos" element={<Eventos />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/compras" element={<Compras />} />
                    <Route path="/proveedores" element={<Proveedores />} />
                    <Route path="/contar-inventario" element={<ContarInventario />} />
                    <Route path="/reportes/panel-ejecutivo" element={<PanelEjecutivo />} />
                    <Route path="/reportes/resumen-ejecutivo" element={<ExecutiveOverview />} />
                    <Route path="/reportes/control-perdidas" element={<LossControl />} />
                    <Route path="/reportes/eficiencia-operacional" element={<OperationalEfficiency />} />
                    <Route path="/reportes/vision-financiera" element={<FinancialVision />} />
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
