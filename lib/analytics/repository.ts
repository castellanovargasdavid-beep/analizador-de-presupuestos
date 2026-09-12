import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { analyticsEvents } from "@/db/schema";
import type { AnalyticsEventPayload } from "./events";

export async function logEvent(payload: AnalyticsEventPayload): Promise<void> {
  await db.insert(analyticsEvents).values({
    eventType: payload.eventType,
    sessionId: payload.sessionId,
    entryPath: payload.entryPath,
    path: payload.path,
    estimateId: payload.estimateId ?? null,
    comparisonId: payload.comparisonId ?? null,
    leadId: payload.leadId ?? null,
    metadata: payload.metadata ?? null,
  });
}

export interface LandingPageFunnelRow {
  entryPath: string;
  pageViews: number;
  calculatorStarts: number;
  results: number;
  leads: number;
  /**
   * leads / pageViews. Es una TASA de conversión, no un importe de dinero:
   * no fijamos un valor en euros por lead hasta que exista un acuerdo
   * comercial real con profesionales que lo determine (ver docs/05). Quien
   * lea este informe multiplica `leads` por ese valor el día que exista,
   * no antes.
   */
  leadRate: number;
}

/**
 * "Qué páginas SEO producen dinero" — en términos de leads reales, no de
 * una cifra de revenue inventada. `entryPath` es la primera página que
 * vio la sesión (atribución de primer toque, ver lib/analytics/track.ts).
 */
export async function getLandingPageFunnelStats(): Promise<LandingPageFunnelRow[]> {
  const result = await db.execute<{
    entry_path: string;
    page_views: string;
    calculator_starts: string;
    results: string;
    leads: string;
  }>(sql`
    select
      entry_path,
      count(distinct case when event_type = 'page_view' then session_id end) as page_views,
      count(distinct case when event_type = 'calculator_start' then session_id end) as calculator_starts,
      count(distinct case when event_type in ('estimate_result_view', 'comparison_result_view') then session_id end) as results,
      count(case when event_type = 'lead_submitted' then 1 end) as leads
    from analytics_events
    group by entry_path
    order by leads desc, page_views desc
  `);

  return result.rows.map((row) => {
    const pageViews = Number(row.page_views);
    const leads = Number(row.leads);
    return {
      entryPath: row.entry_path,
      pageViews,
      calculatorStarts: Number(row.calculator_starts),
      results: Number(row.results),
      leads,
      leadRate: pageViews > 0 ? leads / pageViews : 0,
    };
  });
}
