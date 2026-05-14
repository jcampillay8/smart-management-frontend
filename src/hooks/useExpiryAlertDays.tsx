import { useEffect, useState } from "react";
import api from "../lib/api";

const DEFAULT_DAYS = 5;
const STORAGE_KEY = "expiry_alert_days";
const EVENT_NAME = "expiry-alert-days-changed";

let cachedDays: number | null = null;

function readCached(): number {
  if (cachedDays !== null) return cachedDays;
  if (typeof window !== "undefined") {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v) {
      const n = Number(v);
      if (!Number.isNaN(n) && n > 0) {
        cachedDays = n;
        return n;
      }
    }
  }
  return DEFAULT_DAYS;
}

export function getExpiryAlertDaysSync(): number {
  return readCached();
}

export function useExpiryAlertDays() {
  const [days, setDays] = useState<number>(readCached());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/settings/restaurant");
        if (cancelled) return;
        const value = res.data?.dias_alerta_vencimiento;
        if (typeof value === "number" && value > 0) {
          cachedDays = value;
          try {
            window.localStorage.setItem(STORAGE_KEY, String(value));
          } catch {}
          setDays(value);
        }
      } catch (error) {
        console.error("Error fetching expiry alert days:", error);
      }
    })();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number" && detail > 0) {
        cachedDays = detail;
        setDays(detail);
      }
    };
    window.addEventListener(EVENT_NAME, handler as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT_NAME, handler as EventListener);
    };
  }, []);

  return days;
}

export function broadcastExpiryAlertDays(value: number) {
  cachedDays = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
}
