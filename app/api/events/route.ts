import { z } from "zod";
import { logEvent } from "@/lib/analytics/repository";

const eventSchema = z.object({
  eventType: z.enum([
    "page_view",
    "calculator_start",
    "calculator_step",
    "estimate_result_view",
    "comparison_result_view",
    "lead_form_opened",
    "lead_submitted",
    "wizard_abandoned",
    "internal_search",
  ]),
  sessionId: z.string().trim().min(1).max(200),
  entryPath: z.string().trim().min(1).max(2000),
  path: z.string().trim().min(1).max(2000),
  estimateId: z.string().uuid().optional(),
  comparisonId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * `sendBeacon` envía el body como Blob de texto: puede llegar sin
 * `Content-Type: application/json`, así que parseamos el texto crudo en
 * lugar de depender de `request.json()`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  try {
    await logEvent(parsed.data);
  } catch {
    // La analítica nunca debe generar un error visible para quien la dispara.
  }

  return new Response(null, { status: 204 });
}
