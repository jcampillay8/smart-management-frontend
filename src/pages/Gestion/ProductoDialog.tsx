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
import { Categoria, Producto } from "./types";
import BodegaBadge from "../../components/BodegaBadge";

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
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidad, setUnidad] = useState("unidad");
  const [costoNeto, setCostoNeto] = useState("0");
  const [ivaPorcentaje, setIvaPorcentaje] = useState("19");
  const [costoBruto, setCostoBruto] = useState("0");
  const [precioVenta, setPrecioVenta] = useState("");
  const [marca, setMarca] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [codigoBarra, setCodigoBarra] = useState("");
  const [factorConversion, setFactorConversion] = useState("");
  const [unidadConversion, setUnidadConversion] = useState("");
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);

  const [bodegaChecked, setBodegaChecked] = useState<Record<string, boolean>>({});
  const [bodegaMinimos, setBodegaMinimos] = useState<Record<string, string>>({});
  const [bodegaCoordLetra, setBodegaCoordLetra] = useState<Record<string, string>>({});
  const [bodegaCoordNumero, setBodegaCoordNumero] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setNombre(editingProduct.nombre);
        setCategoriaId(editingProduct.categoria_id);
        setUnidad(editingProduct.unidad);
        setCostoNeto(String(editingProduct.costo_unitario));
        setIvaPorcentaje(String(editingProduct.iva_porcentaje ?? 19));
        const iva = editingProduct.iva_porcentaje ?? 19;
        setCostoBruto(String(Math.round(editingProduct.costo_unitario * (1 + iva / 100))));
        setPrecioVenta(editingProduct.precio_venta ? String(editingProduct.precio_venta) : "");
        setMarca(editingProduct.marca ?? "");
        setProveedor(editingProduct.proveedor ?? "");
        setCodigoBarra(editingProduct.codigo_barra ?? "");
        setFactorConversion(editingProduct.factor_conversion ? String(editingProduct.factor_conversion) : "");
        setUnidadConversion(editingProduct.unidad_conversion ?? "");
        setImagenUrl(editingProduct.imagen_url ?? null);

        const checked: Record<string, boolean> = {};
        const mins: Record<string, string> = {};
        const coordL: Record<string, string> = {};
        const coordN: Record<string, string> = {};
        editingProduct.bodegas_config?.forEach(b => {
          checked[b.bodega_id] = true;
          mins[b.bodega_id] = String(b.stock_minimo);
        });
        setBodegaChecked(checked);
        setBodegaMinimos(mins);
        setBodegaCoordLetra(coordL);
        setBodegaCoordNumero(coordN);
      } else {
        resetForm();
      }
    }
  }, [open, editingProduct]);

  const resetForm = () => {
    setNombre("");
    setCategoriaId(categorias[0]?.id ?? "");
    setUnidad("unidad");
    setCostoNeto("0");
    setIvaPorcentaje("19");
    setCostoBruto("0");
    setPrecioVenta("");
    setMarca("");
    setProveedor("");
    setCodigoBarra("");
    setFactorConversion("");
    setUnidadConversion("");
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
  };

  const calcBrutoFromNeto = (neto: number, iva: number) => Math.round(neto * (1 + iva / 100));
  const calcNetoFromBruto = (bruto: number, iva: number) => Math.round(bruto / (1 + iva / 100));

  const handleCostoNetoChange = (val: string) => {
    setCostoNeto(val);
    setCostoBruto(String(calcBrutoFromNeto(Number(val) || 0, Number(ivaPorcentaje) || 0)));
  };

  const handleCostoBrutoChange = (val: string) => {
    setCostoBruto(val);
    setCostoNeto(String(calcNetoFromBruto(Number(val) || 0, Number(ivaPorcentaje) || 0)));
  };

  const handleIvaChange = (val: string) => {
    setIvaPorcentaje(val);
    setCostoBruto(String(calcBrutoFromNeto(Number(costoNeto) || 0, Number(val) || 0)));
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
        costo_unitario: Number(costoNeto),
        iva_incluido: false,
        iva_porcentaje: Number(ivaPorcentaje),
        precio_venta: precioVenta ? Number(precioVenta) : null,
        marca: marca.trim() || null,
        proveedor: proveedor.trim() || null,
        codigo_barra: codigoBarra.trim() || null,
        factor_conversion: factorConversion ? Number(factorConversion) : null,
        unidad_conversion: unidadConversion.trim() || null,
        imagen_url: imagenUrl,
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

          <div className="space-y-3 border rounded-md p-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Bodegas</Label>
            <div className="grid gap-2">
              <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 px-1">
                <span className="text-[10px] text-muted-foreground">Bodega</span>
                <span className="text-[10px] text-muted-foreground text-right">Stock mín.</span>
                <span className="text-[10px] text-muted-foreground text-right">Coord.</span>
              </div>
              {bodegas.map(bodega => (
                <div key={bodega.id} className="space-y-1">
                  <div className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={!!bodegaChecked[bodega.id]}
                        onCheckedChange={c => setBodegaChecked(prev => ({ ...prev, [bodega.id]: !!c }))}
                      />
                      <BodegaBadge nombre={bodega.nombre} />
                    </label>
                    <Input
                      type="number"
                      min="0"
                      disabled={!bodegaChecked[bodega.id]}
                      value={bodegaMinimos[bodega.id] ?? "0"}
                      onChange={e => setBodegaMinimos(prev => ({ ...prev, [bodega.id]: e.target.value }))}
                      className="h-8 text-right text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        value={bodegaCoordLetra[bodega.id] ?? ""}
                        onChange={e => setBodegaCoordLetra(prev => ({ ...prev, [bodega.id]: e.target.value.toUpperCase() }))}
                        placeholder="A"
                        disabled={!bodegaChecked[bodega.id]}
                        className="h-8 w-12 text-center text-sm uppercase"
                        maxLength={2}
                      />
                      <Input
                        value={bodegaCoordNumero[bodega.id] ?? ""}
                        onChange={e => setBodegaCoordNumero(prev => ({ ...prev, [bodega.id]: e.target.value }))}
                        placeholder="1"
                        disabled={!bodegaChecked[bodega.id]}
                        className="h-8 w-12 text-center text-sm"
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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

          {unidad === "unidad" && (
            <div className="border rounded-md p-3 space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Factor de conversión (opcional)</Label>
              <p className="text-xs text-muted-foreground">Ej: 1 unidad = 900 mL</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Equivale a</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={factorConversion}
                    onChange={e => setFactorConversion(e.target.value)}
                    placeholder="900"
                    className="h-8 text-sm"
                  />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor (opcional)</Label>
              <Input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Ej: Distribuidora ABC" />
            </div>
            <div className="space-y-2">
              <Label>Código de barra (opcional)</Label>
              <Input value={codigoBarra} onChange={e => setCodigoBarra(e.target.value)} placeholder="Escanear o ingresar..." />
            </div>
          </div>

          <div className="border rounded-md p-3 space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Costos</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Costo Neto</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={costoNeto}
                  onChange={e => handleCostoNetoChange(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">IVA %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={ivaPorcentaje}
                  onChange={e => handleIvaChange(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Costo + IVA</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={costoBruto}
                  onChange={e => handleCostoBrutoChange(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Precio de Venta (opcional)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={precioVenta}
                onChange={e => setPrecioVenta(e.target.value)}
                onFocus={e => e.target.select()}
                placeholder="No aplica"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear Producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}