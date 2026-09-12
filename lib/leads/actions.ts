"use server";

import { createLead } from "./repository";
import { leadFormSchema } from "./validation";
import { logEvent } from "@/lib/analytics/repository";

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
}

export async function submitLeadAction(
  args: SubmitLeadArgs,
  rawForm: unknown,
): Promise<ActionResult<{ hasCoverage: boolean }>> {
  const parsed = leadFormSchema.safeParse(rawForm);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
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
    return { ok: false, error: err instanceof Error ? err.message : "No se ha podido registrar la solicitud." };
  }
}
