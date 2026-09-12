"use server";

import { headers } from "next/headers";
import { createLead } from "./repository";
import { leadFormSchema } from "./validation";
import { logEvent } from "@/lib/analytics/repository";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/security/rate-limit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";

export interface SubmitLeadArgs {
  estimateId: string;
  comparisonId?: string | null;
  sessionId: string;
  entryPath: string;
  path: string;
}

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  errorKind?: ErrorKind;
}

const FALLBACK_MESSAGE = "No se ha podido registrar la solicitud ahora mismo. Inténtalo de nuevo en unos minutos.";

export async function submitLeadAction(
  args: SubmitLeadArgs,
  rawForm: unknown,
): Promise<ActionResult<{ hasCoverage: boolean }>> {
  const ip = clientIpFromHeaders(await headers());
  const { allowed } = await checkRateLimit(`lead:${ip}`, { limit: 5, windowSeconds: 60 * 60 });
  if (!allowed) {
    return {
      ok: false,
      errorKind: "unavailable",
      error: "Se han enviado demasiadas solicitudes desde este origen. Inténtalo de nuevo más tarde.",
    };
  }

  const parsed = leadFormSchema.safeParse(rawForm);
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  if (parsed.data.website) {
    // Honeypot relleno: casi con certeza un bot. Fingimos éxito para no
    // darle ninguna pista de que se ha detectado, sin escribir nada.
    return { ok: true, data: { hasCoverage: false } };
  }

  try {
    const { leadId, matchedProfessionals } = await createLead({
      estimateId: args.estimateId,
      comparisonId: args.comparisonId,
      form: parsed.data,
      entryPath: args.entryPath,
    });

    await logEvent({
      eventType: "lead_submitted",
      sessionId: args.sessionId,
      entryPath: args.entryPath,
      path: args.path,
      estimateId: args.estimateId,
      comparisonId: args.comparisonId ?? undefined,
      leadId,
      metadata: { matchedProfessionals },
    });

    return { ok: true, data: { hasCoverage: matchedProfessionals > 0 } };
  } catch (err) {
    const safe = toSafeError(err, "submitLeadAction", FALLBACK_MESSAGE);
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }
}
