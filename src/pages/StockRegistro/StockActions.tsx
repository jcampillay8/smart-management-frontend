// src/pages/StockRegistro/StockActions.tsx

import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { 
  PackagePlus, 
  ArrowLeftRight, 
  AlertTriangle, 
  Search 
} from "lucide-react";
import { Input } from "../../components/ui/input";

interface StockActionsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenTransfer: () => void;
  onOpenMerma: () => void;
  isViewingAll: boolean;
}

export function StockActions({
  searchTerm,
  onSearchChange,
  onOpenTransfer,
  onOpenMerma,
  isViewingAll
}: StockActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
        <Button 
          variant="outline" 
          onClick={() => navigate("/compras")}
          className="gap-2"
        >
          <PackagePlus className="h-4 w-4" />
          <span className="hidden sm:inline">Entrada de Stock</span>
        </Button>

        <Button 
          variant="outline" 
          onClick={onOpenTransfer}
          className="gap-2"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span className="hidden sm:inline">Transferir</span>
        </Button>

        <Button 
          variant="destructive" 
          onClick={onOpenMerma}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Merma</span>
        </Button>
      </div>
    </div>
  );
}