/**
 * Endpoint invocable periódicamente (Vercel Cron Jobs en producción, o a
 * mano en desarrollo) para procesar avisos y reasignaciones por
 * incumplimiento de plazo. Protegido por `CRON_SECRET` — sin él
 * configurado, el endpoint rechaza cualquier petición (nunca queda
 * abierto por accidente). Cada ejecución queda registrada en
 * `automation_runs`, visible desde /admin, tanto si tiene éxito como si
 * falla parcialmente.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { automationRuns } from "@/db/schema";
import { processDeadlines } from "@/lib/leads/reassignment-service";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function runJob() {
  const startedAt = new Date();
  const [run] = await db
    .insert(automationRuns)
    .values({ job: "lead-deadlines", startedAt })
    .returning();

  try {
    const summary = await processDeadlines();
    await db
      .update(automationRuns)
      .set({
        finishedAt: new Date(),
        processedCount:
          summary.contactWarningsSent + summary.contactReassignments + summary.quoteWarningsSent + summary.quoteReassignments,
        errorCount: summary.errors.length,
        details: summary,
      })
      .where(eq(automationRuns.id, run.id));
    return { ok: true, summary };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(automationRuns)
      .set({ finishedAt: new Date(), errorCount: 1, details: { error: message } })
      .where(eq(automationRuns.id, run.id));
    return { ok: false, error: message };
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await runJob();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
