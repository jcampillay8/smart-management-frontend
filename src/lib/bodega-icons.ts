// src/lib/bodega-icons.ts
import { 
  Warehouse, 
  Truck, 
  Package, 
  Box, 
  Building2, 
  Archive, 
  Container,
  Store,
  ShoppingBag,
  Layers
} from "lucide-react";

/**
 * Retorna el ícono Lucide correspondiente al nombre de una bodega.
 * Busca primero por coincidencia de nombre, luego por palabras clave.
 */
export function getBodegaIcon(nombre: string) {
  const lower = nombre.toLowerCase();

  if (lower.includes("principal") || lower.includes("main")) return Warehouse;
  if (lower.includes("tránsito") || lower.includes("transito") || lower.includes("transit")) return Truck;
  if (lower.includes("producto") || lower.includes("product")) return Package;
  if (lower.includes("caja") || lower.includes("box")) return Box;
  if (lower.includes("edificio") || lower.includes("local")) return Building2;
  if (lower.includes("archivo") || lower.includes("archive")) return Archive;
  if (lower.includes("contenedor") || lower.includes("container")) return Container;
  if (lower.includes("tienda") || lower.includes("store")) return Store;
  if (lower.includes("bolsa") || lower.includes("bag")) return ShoppingBag;

  return Layers;
}

export const BODEGA_ICONS = {
  Warehouse,
  Truck,
  Package,
  Box,
  Building2,
  Archive,
  Container,
  Store,
  ShoppingBag,
  Layers,
};

export type BodegaIconName = keyof typeof BODEGA_ICONS;
