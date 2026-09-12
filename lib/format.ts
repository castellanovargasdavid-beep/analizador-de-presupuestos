const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEUR(value: number): string {
  return eur.format(Math.round(value));
}

export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** `"2026-09-11"` -> `"11 de septiembre de 2026"`. Devuelve el original si no es una fecha ISO válida. */
export function formatDateEs(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    parsed,
  );
}
