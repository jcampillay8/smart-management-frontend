// src/pages/Gestion/ProductoDialog.tsx
import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useBodega } from "../../hooks/useBodega";
import { useProveedores } from "../Proveedores/useProveedores";
import { Categoria, Producto } from "./types";
import BodegaBadge from "../../components/BodegaBadge";
import { BarcodeScanner } from "../../components/BarcodeScanner";
import { Camera, DollarSign, AlertTriangle } from "lucide-react";

interface ProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorias: Categoria[];
  editingProduct: Producto | null;
  onSuccess: () => void;
}

const UNIDADES = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "L", label: "Litros (L)" },
  { value: "mL", label: "Mililitros (mL)" },
  { value: "docena", label: "Docena" },
];

export function ProductoDialog({ open, onOpenChange, categorias, editingProduct, onSuccess }: ProductoDialogProps) {
  const { bodegas } = useBodega();
  const { proveedores } = useProveedores();
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidad, setUnidad] = useState("unidad");
  const [precioVenta, setPrecioVenta] = useState("");
  const [marca, setMarca] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [codigoBarra, setCodigoBarra] = useState("");
  const [sku, setSku] = useState("");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const [bodegaChecked, setBodegaChecked] = useState<Record<string, boolean>>({});
  const [bodegaMinimos, setBodegaMinimos] = useState<Record<string, string>>({});
  const [bodegaCoordLetra, setBodegaCoordLetra] = useState<Record<string, string>>({});
  const [bodegaCoordNumero, setBodegaCoordNumero] = useState<Record<string, string>>({});
  const [factorConversion, setFactorConversion] = useState("1");
  const [unidadConversion, setUnidadConversion] = useState("mL");
  const [diasAlertaVencimiento, setDiasAlertaVencimiento] = useState("15");

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setNombre(editingProduct.nombre);
        setCategoriaId(editingProduct.categoria_id);
        setUnidad(editingProduct.unidad);
        setPrecioVenta(editingProduct.precio_venta ? String(editingProduct.precio_venta) : "");
        setMarca(editingProduct.marca ?? "");
        setProveedorId(editingProduct.proveedor_id ?? "none");
        setCodigoBarra(editingProduct.codigo_barra ?? "");
        setSku(editingProduct.sku ?? "");
        setImagenUrl(editingProduct.imagen_url ?? null);

        const checked: Record<string, boolean> = {};
        const mins: Record<string, string> = {};
        const coordL: Record<string, string> = {};
        const coordN: Record<string, string> = {};
        editingProduct.bodegas_config?.forEach(b => {
          checked[b.bodega_id] = true;
          mins[b.bodega_id] = String(b.stock_minimo);
          coordL[b.bodega_id] = b.coordenada_letra ?? "";
          coordN[b.bodega_id] = b.coordenada_numero ?? "";
        });
        setBodegaChecked(checked);
        setBodegaMinimos(mins);
        setBodegaCoordLetra(coordL);
        setBodegaCoordNumero(coordN);
        setFactorConversion(editingProduct.factor_conversion ? String(editingProduct.factor_conversion) : "1");
        setUnidadConversion(editingProduct.unidad_conversion ?? "mL");
        setDiasAlertaVencimiento(String(editingProduct.dias_alerta_vencimiento ?? 15));
      } else {
        resetForm();
      }
    }
  }, [open, editingProduct]);

  const resetForm = () => {
    setNombre("");
    setCategoriaId(categorias[0]?.id ?? "");
    setUnidad("unidad");
    setPrecioVenta("");
    setMarca("");
    setProveedorId("");
    setCodigoBarra("");
    setSku("");
    setImagenUrl(null);

    const checked: Record<string, boolean> = {};
    const mins: Record<string, string> = {};
    const coordL: Record<string, string> = {};
    const coordN: Record<string, string> = {};
    bodegas.forEach((b, i) => {
      checked[b.id] = i === 0;
      mins[b.id] = "0";
      coordL[b.id] = "";
      coordN[b.id] = "";
    });
    setBodegaChecked(checked);
    setBodegaMinimos(mins);
    setBodegaCoordLetra(coordL);
    setBodegaCoordNumero(coordN);
    setFactorConversion("1");
    setUnidadConversion("mL");
    setDiasAlertaVencimiento("15");
  };

  const handleSave = async () => {
    if (!nombre.trim() || !categoriaId) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    const selectedBodegaIds = Object.entries(bodegaChecked).filter(([, v]) => v).map(([k]) => k);
    if (selectedBodegaIds.length === 0) {
      toast.error("Selecciona al menos una bodega");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        categoria_id: categoriaId,
        unidad,
        costo_unitario: 0,
        iva_incluido: false,
        iva_porcentaje: 19,
        precio_venta: precioVenta ? Number(precioVenta) : null,
        marca: marca.trim() || null,
        proveedor_id: proveedorId === "none" || !proveedorId ? null : proveedorId,
        codigo_barra: codigoBarra.trim() || null,
        sku: sku.trim() || null,
        imagen_url: imagenUrl,
        factor_conversion: Number(factorConversion) || 1,
        unidad_conversion: unidad === "unidad" ? unidadConversion : null,
        dias_alerta_vencimiento: Number(diasAlertaVencimiento) || 0,
        bodegas_config: selectedBodegaIds.map(bid => ({
          bodega_id: bid,
          stock_minimo: Number(bodegaMinimos[bid] ?? 0),
          coordenada_letra: bodegaCoordLetra[bid]?.trim() || null,
          coordenada_numero: bodegaCoordNumero[bid]?.trim() || null,
        })),
      };
      if (editingProduct) {
        await api.put(`/inventory/products/${editingProduct.id}`, payload);
        toast.success("Producto actualizado");
      } else {
        await api.post("/inventory/products", payload);
        toast.success("Producto creado");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Nombre + Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Coca Cola 350cc" />
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PRECIO DE VENTA — Opcional */}
          <div className="border rounded-xl p-4 bg-blue-500/5 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <Label className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">
                Precio de Venta{" "}
                <span className="text-muted-foreground font-normal normal-case tracking-normal text-xs">(opcional)</span>
              </Label>
            </div>
            <Input
              type="number"
              value={precioVenta}
              onFocus={e => e.target.select()}
              onChange={e => setPrecioVenta(e.target.value)}
              placeholder="Sin definir — se podrá agregar al registrar compras"
              className="h-10 font-bold border-blue-200 dark:border-blue-500/30 focus:border-blue-500 bg-background/50"
            />
            <p className="text-[10px] text-muted-foreground">
              El costo unitario se actualizará automáticamente al escanear facturas de compra.
            </p>
          </div>

          {/* Bodegas */}
          <div className="space-y-3 border rounded-lg p-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Bodegas</Label>
            <div className="grid gap-2">
              <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 px-1">
                <span className="text-[10px] text-muted-foreground">Bodega</span>
                <span className="text-[10px] text-muted-foreground text-right">Stock mín.</span>
                <span className="text-[10px] text-muted-foreground text-right">Ubicación</span>
              </div>
              {bodegas.map(bodega => (
                <div key={bodega.id} className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={!!bodegaChecked[bodega.id]}
                      onCheckedChange={c => setBodegaChecked(prev => ({ ...prev, [bodega.id]: !!c }))}
                    />
                    <BodegaBadge nombre={bodega.nombre} color={bodega.color} icono={bodega.icono} />
                  </label>
                  <Input
                    type="number" min="0"
                    disabled={!bodegaChecked[bodega.id]}
                    value={bodegaMinimos[bodega.id] ?? "0"}
                    onFocus={e => e.target.select()}
                    onChange={e => setBodegaMinimos(prev => ({ ...prev, [bodega.id]: e.target.value }))}
                    className="h-8 text-right text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      value={bodegaCoordLetra[bodega.id] ?? ""}
                      onFocus={e => e.target.select()}
                      onChange={e => setBodegaCoordLetra(prev => ({ ...prev, [bodega.id]: e.target.value.toUpperCase() }))}
                      placeholder="A" disabled={!bodegaChecked[bodega.id]}
                      className="h-8 w-12 text-center text-sm uppercase" maxLength={2}
                    />
                    <Input
                      value={bodegaCoordNumero[bodega.id] ?? ""}
                      onFocus={e => e.target.select()}
                      onChange={e => setBodegaCoordNumero(prev => ({ ...prev, [bodega.id]: e.target.value }))}
                      placeholder="1" disabled={!bodegaChecked[bodega.id]}
                      className="h-8 w-12 text-center text-sm" maxLength={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unidad + Marca */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marca (opcional)</Label>
              <Input value={marca} onChange={e => setMarca(e.target.value)} placeholder="Ej: Colun, Nestlé" />
            </div>
          </div>

          {/* Factor de conversión */}
          {unidad === "unidad" && (
            <div className="border rounded-md p-3 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Factor de conversión (opcional)</Label>
              <p className="text-xs text-muted-foreground">Ej: 1 unidad = 900 mL</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Equivale a</Label>
                  <Input type="number" min="0" step="any" value={factorConversion}
                    onChange={e => setFactorConversion(e.target.value)} placeholder="900" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidad</Label>
                  <Select value={unidadConversion} onValueChange={setUnidadConversion}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {UNIDADES.slice(1).map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Días de Alerta de Vencimiento */}
          <div className="border border-orange-200 dark:border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <Label className="text-[10px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-300">
                Alerta de Vencimiento Anticipada
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                value={diasAlertaVencimiento}
                onChange={e => setDiasAlertaVencimiento(e.target.value)}
                className="h-10 w-24 font-bold border-orange-200 dark:border-orange-500/30 focus:border-orange-500 bg-background/50"
              />
              <p className="text-[11px] text-muted-foreground">
                El sistema mostrará advertencias (color naranja parpadeante) <span className="font-bold text-orange-700 dark:text-orange-300">{diasAlertaVencimiento} días antes</span> de que el producto venza.
              </p>
            </div>
          </div>

          {/* Proveedor + Código de barra */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor (opcional)</Label>
              <Select value={proveedorId} onValueChange={setProveedorId}>
                <SelectTrigger className="h-10 bg-background border rounded-xl">
                  <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {proveedores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre_empresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Código de Barra</Label>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowScanner(true)}>
                  <Camera className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input 
                value={codigoBarra} 
                onChange={e => setCodigoBarra(e.target.value)} 
                placeholder="Escanea o escribe..."
                className="h-10 font-mono text-xs" 
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
          <div>
            {editingProduct && (
              <Button variant="destructive" size="sm" className="h-9 font-bold px-4"
                onClick={async () => {
                  if (confirm(`¿Estás seguro de eliminar "${editingProduct.nombre}"? Esta acción no se puede deshacer.`)) {
                    try {
                      await api.delete(`/inventory/products/${editingProduct.id}`);
                      toast.success("Producto eliminado");
                      onSuccess();
                      onOpenChange(false);
                    } catch (e) {
                      toast.error("Error al eliminar producto");
                    }
                  }
                }}>
                Eliminar Producto
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear Producto"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => { setCodigoBarra(code); setShowScanner(false); toast.success(`Código detectado: ${code}`); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </Dialog>
  );
}