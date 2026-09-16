/**
 * Autenticación del portal de profesional. Mismo patrón que
 * `lib/admin/auth.ts` (Web Crypto, válido tanto en Node como en el
 * runtime Edge de `proxy.ts`), pero con contraseña propia por
 * profesional (`professionals.passwordHash`) en vez de una única
 * contraseña compartida — cada profesional es una identidad real,
 * fijada por el admin al darlo de alta o al restablecer su acceso.
 */
export const PROFESSIONAL_SESSION_COOKIE = "professional_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas
const PBKDF2_ITERATIONS = 100_000;

function getSessionSecret(): string {
  const secret = process.env.PROFESSIONAL_SESSION_SECRET;
  if (!secret) {
    throw new Error("PROFESSIONAL_SESSION_SECRET no está definida. Copia .env.example a .env.local y genera un valor.");
  }
  return secret;
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Hash de contraseña con PBKDF2-SHA256 (sin dependencias externas). Formato guardado: "salt_hex:hash_hex". */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `${toHex(salt)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return timingSafeEqual(toHex(bits), hashHex);
}

export async function createProfessionalSessionToken(professionalId: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${professionalId}.${expiresAt}`;
  const signature = await hmacHex(getSessionSecret(), payload);
  return `${payload}.${signature}`;
}

/** Devuelve el `professionalId` si el token es válido y no ha expirado, o `null`. */
export async function verifyProfessionalSessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [professionalId, expiresAtRaw, signature] = parts;
  const payload = `${professionalId}.${expiresAtRaw}`;

  const expected = await hmacHex(getSessionSecret(), payload);
  if (!timingSafeEqual(signature, expected)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  return professionalId;
}
