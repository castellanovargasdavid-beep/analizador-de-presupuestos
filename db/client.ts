import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Instanciación perezosa a propósito: importar este módulo nunca falla
 * (así los tests que no necesitan la base de datos pueden coexistir con
 * los que sí, sin que un DATABASE_URL ausente tumbe la recolección de
 * tests). El error solo aparece si de verdad se intenta usar `db` sin
 * configurar la variable de entorno.
 */
let instance: NodePgDatabase<typeof schema> & { $client: Pool } | undefined;

function getDb() {
  if (!instance) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL no está definida. Copia .env.example a .env.local y apunta a tu Postgres de desarrollo.",
      );
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    instance = drizzle(pool, { schema });
  }
  return instance;
}

export const db: NodePgDatabase<typeof schema> & { $client: Pool } = new Proxy({} as never, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
