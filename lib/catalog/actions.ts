"use server";

import { headers } from "next/headers";
import { db } from "@/db/client";
import { leads, serviceInterestSignups } from "@/db/schema";
import { resolveRegionId } from "@/lib/estimation/repository";
import { LEAD_CONSENT_VERSION } from "@/lib/leads/validation";
import { processNewLead } from "@/lib/leads/intake-service";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/security/rate-limit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { directLeadFormSchema, notifyMeFormSchema } from "./validation";

export interface ActionResult<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
  errorKind?: ErrorKind;
}

const FALLBACK_MESSAGE = "No se ha podido completar esto ahora mismo. Inténtalo de nuevo en unos minutos.";

/** "Avísame cuando esté disponible" — nunca se comparte con ningún profesional, solo mide interés. */
export async function notifyMeAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ip = clientIpFromHeaders(await headers());
  const { allowed } = await checkRateLimit(`notify:${ip}`, { limit: 10, windowSeconds: 60 * 60 });
  if (!allowed) {
    return { ok: false, errorKind: "unavailable", error: "Demasiadas solicitudes. Inténtalo de nuevo más tarde." };
  }

  const parsed = notifyMeFormSchema.safeParse({
    serviceTypeId: formData.get("serviceTypeId"),
    email: formData.get("email"),
    website: formData.get("website"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  if (parsed.data.website) {
    return { ok: true }; // honeypot: fingimos éxito, no escribimos nada
  }

  try {
    await db.insert(serviceInterestSignups).values({
      serviceTypeId: parsed.data.serviceTypeId,
      email: parsed.data.email,
    });
  } catch (err) {
    const safe = toSafeError(err, "notifyMeAction", FALLBACK_MESSAGE);
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  return { ok: true };
}

/**
 * Solicitud de presupuesto para un servicio `solo_solicitud`: sin
 * calculadora ni rango orientativo, porque todavía no hay datos fiables
 * para calcularlo. `estimateId` queda a null a propósito — nunca se
 * inventa una estimación para poder crear el lead.
 */
export async function submitDirectLeadAction(
  serviceTypeId: string,
  rawForm: unknown,
): Promise<ActionResult<{ leadId: string }>> {
  const ip = clientIpFromHeaders(await headers());
  const { allowed } = await checkRateLimit(`direct-lead:${ip}`, { limit: 5, windowSeconds: 60 * 60 });
  if (!allowed) {
    return {
      ok: false,
      errorKind: "unavailable",
      error: "Se han enviado demasiadas solicitudes desde este origen. Inténtalo de nuevo más tarde.",
    };
  }

  const parsed = directLeadFormSchema.safeParse(rawForm);
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  if (parsed.data.website) {
    return { ok: true, data: { leadId: "" } }; // honeypot: fingimos éxito, no escribimos nada
  }

  try {
    const regionId = await resolveRegionId(parsed.data.regionSlug);
    const [lead] = await db
      .insert(leads)
      .values({
        estimateId: null,
        serviceTypeId,
        regionId,
        contactName: parsed.data.contactName,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone ?? null,
        description: parsed.data.description,
        propertyType: parsed.data.propertyType ?? null,
        urgency: parsed.data.urgency ?? null,
        desiredTimeframe: parsed.data.desiredTimeframe ?? null,
        currentState: parsed.data.currentState ?? null,
        approxDimensions: parsed.data.approxDimensions ?? null,
        userStatedBudget: parsed.data.userStatedBudget ?? null,
        status: "nuevo",
        consentVersion: LEAD_CONSENT_VERSION,
        consentAcceptedAt: new Date(),
      })
      .returning();

    await processNewLead(lead.id);

    return { ok: true, data: { leadId: lead.id } };
  } catch (err) {
    const safe = toSafeError(err, "submitDirectLeadAction", FALLBACK_MESSAGE);
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }
}
