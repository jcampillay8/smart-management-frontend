// src/pages/Configuracion/types.ts
export interface UserWithRole {
  id: number;
  email: string;
  role: string;
  hasMermaPermiso?: boolean;
}

export type Theme = "light" | "dark";

export interface RestaurantSettings {
  nombre: string;
  logo_url: string | null;
}