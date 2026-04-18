/**
 * Timezone helpers – Santiago de Chile (America/Santiago)
 */

const TZ = "America/Santiago";

/** Format a UTC/ISO date string to Chilean date dd/MM/yyyy */
export function toChileDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("es-CL", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Format a UTC/ISO date string to Chilean time HH:mm */
export function toChileDatetime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("es-CL", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Get current date in Chile as YYYY-MM-DD */
export function chileToday(): string {
  const d = new Date();
  const parts = d.toLocaleDateString("en-CA", { timeZone: TZ }); // en-CA gives YYYY-MM-DD
  return parts;
}

/** Get current Date object adjusted to Chile timezone offset */
export function chileNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}
