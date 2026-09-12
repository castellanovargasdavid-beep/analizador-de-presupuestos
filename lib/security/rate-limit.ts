import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export interface RateLimitOptions {
  /** Máximo de intentos permitidos dentro de la ventana. */
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Contador de ventana fija en Postgres (sin Redis): una fila por `key`,
 * upsert atómico en una sola sentencia — si la ventana anterior ya
 * caducó, se reinicia a 1; si no, se incrementa. No hay condición de
 * carrera entre leer y escribir porque todo ocurre en el propio UPDATE.
 *
 * `key` debe incluir tanto la acción como el identificador del que la
 * pide (p. ej. `lead:203.0.113.4`) para no compartir cupo entre acciones
 * distintas ni entre usuarios distintos.
 */
export async function checkRateLimit(key: string, { limit, windowSeconds }: RateLimitOptions): Promise<RateLimitResult> {
  const result = await db.execute<{ count: number }>(sql`
    insert into rate_limit_buckets (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      window_start = case
        when rate_limit_buckets.window_start < now() - (${windowSeconds} || ' seconds')::interval then now()
        else rate_limit_buckets.window_start
      end,
      count = case
        when rate_limit_buckets.window_start < now() - (${windowSeconds} || ' seconds')::interval then 1
        else rate_limit_buckets.count + 1
      end
    returning count
  `);

  const count = Number(result.rows[0]?.count ?? 1);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

/**
 * IP del cliente a partir de las cabeceras que pone el proxy delante de
 * Next.js (Vercel, o cualquier balanceador estándar). Sin proxy delante
 * (desarrollo local) no hay cabecera — se usa una clave fija en su lugar,
 * lo que agrupa a todos los clientes locales bajo un mismo cupo en vez de
 * fallar o desactivar el límite por completo.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "sin-proxy";
}

