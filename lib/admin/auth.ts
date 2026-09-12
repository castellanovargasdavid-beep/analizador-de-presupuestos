/**
 * Autenticación del panel /admin. Deliberadamente mínima y honesta: hoy
 * existe un único operador (no hay tabla de usuarios, roles ni permisos
 * granulares) — una contraseña compartida por variable de entorno más una
 * cookie de sesión firmada. El día que haga falta más de un admin con
 * permisos distintos, esto se sustituye por un sistema de usuarios real;
 * hasta entonces, fingir un sistema multiusuario sería inventar algo que
 * no existe.
 *
 * Usa Web Crypto (`crypto.subtle`) en vez de el módulo `crypto` de Node
 * porque este código se ejecuta tanto en Server Actions (runtime Node)
 * como en `proxy.ts` (runtime Edge por defecto) — Web Crypto es lo único
 * disponible en ambos.
 */
export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET no está definida. Copia .env.example a .env.local y genera un valor.");
  }
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
}

/** Comparación en tiempo constante: no basta con `===` para no filtrar por temporización cuánto coincide. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);
  const signature = await hmacHex(payload);
  return `${payload}.${signature}`;
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await hmacHex(payload);
  if (!timingSafeEqual(signature, expected)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/** Comparación en tiempo constante de la contraseña, sobre un hash previo para no comparar longitudes distintas directamente. */
export async function isValidAdminPassword(candidate: string): Promise<boolean> {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    throw new Error("ADMIN_PASSWORD no está definida. Copia .env.example a .env.local y define una.");
  }
  const [candidateHash, configuredHash] = await Promise.all([hmacHex(candidate), hmacHex(configured)]);
  return timingSafeEqual(candidateHash, configuredHash);
}
