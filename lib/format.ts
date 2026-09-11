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
