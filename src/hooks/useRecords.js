import { useEffect, useState } from "react";

export function useRecords(storageKey) {
  const [records, setRecords] = useState(() => leerRecords(storageKey));

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  }, [records, storageKey]);

  return [records, setRecords];
}

function leerRecords(storageKey) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("No se pudo leer el historial", error);
    return [];
  }
}
