/**
 * Codificación del estado de una estimación/comparación en un identificador
 * de URL, sin base de datos.
 *
 * Decisión deliberada de esta fase (UX/frontend): todavía no existe la capa
 * de persistencia de la Fase 3 del roadmap (Postgres + Drizzle), así que
 * `/resultado/[id]` y `/comparar/[id]` codifican el propio estado en el id
 * (base64url del JSON de entrada), en vez de guardar una fila y devolver un
 * UUID. La página sigue siendo compartible por URL y noindex,follow tal
 * como se decidió. Cuando se construya la Fase 3, este módulo se sustituye
 * por lectura/escritura real en `Estimation` / `UserBudget`, manteniendo el
 * mismo contrato de `encode`/`decode` para no tocar las páginas.
 */

function toBase64Url(json: string): string {
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(id: string): string {
  const base64 = id.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

export function encodeState<T>(payload: T): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeState<T>(id: string): T | null {
  try {
    return JSON.parse(fromBase64Url(id)) as T;
  } catch {
    return null;
  }
}
