import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { Camera, Upload, Loader2, Trash2, Check, AlertTriangle, Search } from "lucide-react";
import BodegaBadge from "@/components/BodegaBadge";

interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  costo_unitario: number;
}

interface Bodega {
  id: string;
  nombre: string;
}

interface ScannedIngredient {
  nombre: string;
  cantidad: number;
  unidad: string;
}

interface MatchedIngredient {
  scannedName: string;
  cantidad: number;
  unidad: string;
  producto_id: string;
  bodega_id: string;
  matched: boolean;
  stockByBodega: Record<string, number>;
  availableBodegas: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
  bodegas: Bodega[];
  productBodegaMap: Record<string, Set<string>>;
  stockByProduct: Record<string, Record<string, number>>;
  onConfirm: (nombre: string, ingredientes: { producto_id: string; bodega_id: string; cantidad: number }[]) => void;
}

type Step = "upload" | "scanning" | "matching" | "missing-warning";

export default function RecipeScanner({ open, onOpenChange, productos, bodegas, productBodegaMap, stockByProduct, onConfirm }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [recipeName, setRecipeName] = useState("");
  const [ingredients, setIngredients] = useState<MatchedIngredient[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<MatchedIngredient[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setRecipeName("");
    setIngredients([]);
    setMissingIngredients([]);
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setStep("scanning");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await api.post("/ai/scan-recipe", {
        imageBase64: base64, mimeType: file.type
      });

      const data = response.data;
      if (data?.error) throw new Error(data.error);

      const scannedIngredients: ScannedIngredient[] = data.ingredients || [];
      if (scannedIngredients.length === 0) {
        toast.error("No se detectaron ingredientes en la imagen");
        setStep("upload");
        return;
      }

      setRecipeName(data.recipe_name || "Receta escaneada");
      
      const matched = matchIngredients(scannedIngredients);
      setIngredients(matched);
      setStep("matching");
      toast.success(`${scannedIngredients.length} ingrediente(s) detectados`);
    } catch (e: any) {
      toast.error("Error al escanear: " + (e.response?.data?.detail || e.message || "Error desconocido"));
      setStep("upload");
    }
  };

  const matchIngredients = (scanned: ScannedIngredient[]): MatchedIngredient[] => {
    return scanned.map(s => {
      const normalizedName = s.nombre.toLowerCase().trim();
      let match = productos.find(p => p.nombre.toLowerCase() === normalizedName);
      if (!match) {
        match = productos.find(p => p.nombre.toLowerCase().includes(normalizedName) || normalizedName.includes(p.nombre.toLowerCase()));
      }

      const availableBodegas = match ? Array.from(productBodegaMap[match.id] ?? []) : [];
      const stockMap: Record<string, number> = {};
      if (match) {
        availableBodegas.forEach(bid => {
          stockMap[bid] = stockByProduct[match!.id]?.[bid] ?? 0;
        });
      }

      return {
        scannedName: s.nombre,
        cantidad: s.cantidad,
        unidad: s.unidad,
        producto_id: match?.id ?? "",
        bodega_id: availableBodegas[0] ?? "",
        matched: !!match,
        stockByBodega: stockMap,
        availableBodegas,
      };
    });
  };

  const updateIngredient = (idx: number, field: Partial<MatchedIngredient>) => {
    setIngredients(prev => prev.map((ing, i) => {
      if (i !== idx) return ing;
      const updated = { ...ing, ...field };
      if (field.producto_id && field.producto_id !== ing.producto_id) {
        const newBodegas = Array.from(productBodegaMap[field.producto_id] ?? []);
        const newStock: Record<string, number> = {};
        newBodegas.forEach(bid => {
          newStock[bid] = stockByProduct[field.producto_id!]?.[bid] ?? 0;
        });
        updated.availableBodegas = newBodegas;
        updated.stockByBodega = newStock;
        updated.bodega_id = newBodegas[0] ?? "";
        updated.matched = true;
      }
      return updated;
    }));
  };

  const removeIngredient = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    const valid = ingredients.filter(i => i.producto_id && i.bodega_id);
    const missing = ingredients.filter(i => !i.producto_id);
    
    if (valid.length === 0 && missing.length === 0) {
      toast.error("No hay ingredientes para guardar");
      return;
    }

    const insufficient = valid.filter(i => {
      const stock = i.stockByBodega[i.bodega_id] ?? 0;
      return stock < i.cantidad;
    });

    if (insufficient.length > 0 || missing.length > 0) {
      setMissingIngredients([...insufficient, ...missing]);
      setStep("missing-warning");
    } else {
      saveRecipe(valid);
    }
  };

  const saveRecipe = (validIngredients?: MatchedIngredient[]) => {
    const toSave = validIngredients ?? ingredients.filter(i => i.producto_id && i.bodega_id);
    onConfirm(
      recipeName,
      toSave.map(i => ({ producto_id: i.producto_id, bodega_id: i.bodega_id, cantidad: i.cantidad }))
    );
    resetState();
    onOpenChange(false);
  };

  const getProductStock = (prodId: string, bodegaId: string) => {
    const prod = productos.find(p => p.id === prodId);
    const stock = stockByProduct[prodId]?.[bodegaId] ?? 0;
    return `${stock} ${prod?.unidad ?? ""}`;
  };

  return (
    <>
      <Dialog open={open && step !== "missing-warning"} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-indigo-600" /> Escanear Receta
            </DialogTitle>
          </DialogHeader>

          {step === "upload" && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Sube o toma una foto de una receta. El sistema detectará los ingredientes automáticamente.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="h-auto py-4 gap-3" onClick={() => cameraRef.current?.click()}>
                  <Camera className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Tomar foto</div>
                    <div className="text-xs text-muted-foreground">Usar la cámara del dispositivo</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 gap-3" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Subir imagen</div>
                    <div className="text-xs text-muted-foreground">Seleccionar archivo de la galería</div>
                  </div>
                </Button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
            </div>
          )}

          {step === "scanning" && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Analizando receta...</p>
            </div>
          )}

          {step === "matching" && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Nombre de la receta</Label>
                <Input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="Nombre de la receta" />
              </div>

              <div className="space-y-3">
                <Label>Ingredientes detectados</Label>
                {ingredients.map((ing, idx) => {
                  const prod = productos.find(p => p.id === ing.producto_id);
                  return (
                    <div key={idx} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {ing.matched ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <span className="text-sm font-medium">{ing.scannedName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number" min="0" step="any"
                            value={ing.cantidad}
                            onChange={(e) => updateIngredient(idx, { cantidad: Number(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                            className="h-7 w-16 text-right text-xs"
                          />
                          <span className="text-xs text-muted-foreground w-8">{prod?.unidad ?? ing.unidad}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeIngredient(idx)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <Select value={ing.producto_id} onValueChange={(v) => updateIngredient(idx, { producto_id: v })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccionar producto del inventario..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre} ({p.unidad})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {ing.producto_id && ing.availableBodegas.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Select value={ing.bodega_id} onValueChange={(v) => updateIngredient(idx, { bodega_id: v })}>
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Bodega..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ing.availableBodegas.map(bid => {
                                const b = bodegas.find(bb => bb.id === bid);
                                return (
                                  <SelectItem key={bid} value={bid}>
                                    {b?.nombre ?? bid} — Stock: {getProductStock(ing.producto_id, bid)}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {ing.bodega_id && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              Stock: {getProductStock(ing.producto_id, ing.bodega_id)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === "matching" && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>Cancelar</Button>
              <Button onClick={handleConfirm} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Confirmar receta
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={step === "missing-warning"} onOpenChange={(o) => { if (!o) setStep("matching"); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ingredientes faltantes
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Los siguientes ingredientes no están disponibles o tienen stock insuficiente:</p>
                <div className="space-y-1">
                  {missingIngredients.map((ing, idx) => {
                    const prod = productos.find(p => p.id === ing.producto_id);
                    const stock = ing.bodega_id ? (ing.stockByBodega[ing.bodega_id] ?? 0) : 0;
                    return (
                      <div key={idx} className="text-sm rounded-md border bg-muted/50 p-2">
                        <span className="font-medium">{prod?.nombre ?? ing.scannedName}</span>
                        {ing.producto_id ? (
                          <span className="text-muted-foreground"> — necesitas {ing.cantidad} {prod?.unidad ?? ing.unidad}, solo hay {stock} {prod?.unidad ?? ing.unidad}</span>
                        ) : (
                          <span className="text-muted-foreground"> — no encontrado en inventario</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStep("matching")}>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={() => saveRecipe()}>Guardar de todas formas</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
