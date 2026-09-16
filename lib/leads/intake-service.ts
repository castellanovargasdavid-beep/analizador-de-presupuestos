/**
 * Qué pasa justo después de crear un lead (público, vía formulario): una
 * validación básica automática, detección de duplicados evidentes, y el
 * primer intento de asignación. Separado de `repository.ts` (que solo
 * inserta la fila) para que la máquina de estados formal
 * (`lib/leads/state-machine.ts`) sea el único sitio que decide adónde va
 * un lead nuevo.
 */
import { and, desc, eq, gt, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { transitionLead, recordLeadNote } from "./lifecycle-service";
import { assignLead } from "./assignment-service";

const DUPLICATE_WINDOW_HOURS = 24;

/**
 * Mismo email + mismo servicio en las últimas 24h. No bloquea la
 * creación del lead (podría ser un usuario real insistiendo, o dos
 * personas de la misma casa) — solo lo marca para que un admin lo revise.
 */
async function detectDuplicate(leadId: string, contactEmail: string, serviceTypeId: string): Promise<string | null> {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000);
  const [existing] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.contactEmail, contactEmail), eq(leads.serviceTypeId, serviceTypeId), ne(leads.id, leadId), gt(leads.createdAt, since)))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  return existing?.id ?? null;
}

/**
 * Se llama justo después de insertar un lead nuevo (estado `nuevo`).
 * Valida lo básico, detecta duplicados, y prueba a asignarlo. Si algo
 * falla a mitad, el lead queda en un estado honesto (nunca oculto) para
 * que un admin lo revise — nunca lanza hacia el llamador (crear el lead
 * ya tuvo éxito; esto es un paso posterior).
 */
export async function processNewLead(leadId: string): Promise<void> {
  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return;

    const duplicateOfLeadId = await detectDuplicate(leadId, lead.contactEmail, lead.serviceTypeId);
    if (duplicateOfLeadId) {
      await recordLeadNote({
        leadId,
        actorType: "sistema",
        reason: "Posible duplicado detectado (mismo email y servicio en las últimas 24h).",
        metadata: { duplicateOfLeadId },
        extraFields: { duplicateOfLeadId },
      });
    }

    // Validación automática básica: los datos ya pasaron por Zod al enviarse
    // (formato de contacto, consentimiento, descripción mínima), así que
    // aquí solo se confirma el paso formal de "validado" en la máquina de
    // estados — no hay ninguna comprobación adicional que hacer todavía.
    await transitionLead({
      leadId,
      toStatus: "validado",
      actorType: "sistema",
      reason: "Validación automática: datos de contacto y consentimiento correctos.",
    });

    const result = await assignLead(leadId);
    if (!result.assigned) {
      await transitionLead({
        leadId,
        toStatus: "sin_cobertura",
        actorType: "sistema",
        reason: "Sin profesionales verificados y elegibles para este servicio/zona en este momento.",
      });
    }
  } catch (err) {
    // No relanzamos: el lead ya se ha guardado. Se deja constancia de la
    // incidencia para que un admin lo revise en vez de perder el lead.
    await recordLeadNote({
      leadId,
      actorType: "sistema",
      reason: `Error al procesar automáticamente el lead: ${err instanceof Error ? err.message : String(err)}`,
    }).catch(() => {
      /* si ni siquiera esto puede escribirse, no hay nada más que hacer aquí */
    });
  }
}
