export const SITE_URL = "https://www.presupuestoclaro.es";
export const SITE_NAME = "Presupuesto Claro";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
