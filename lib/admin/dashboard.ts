import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { estimates, faqs, leads, pricingRules, professionals, seoGuides, seoQuestions } from "@/db/schema";

export interface DashboardStats {
  totalEstimates: number;
  leadsByStatus: { status: string; count: number }[];
  activePricingRuleVersion: number | null;
  publishedGuides: number;
  publishedQuestions: number;
  activeFaqs: number;
  activeProfessionals: number;
  totalProfessionals: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    [{ total: totalEstimates }],
    leadsRows,
    [activeRule],
    [{ total: publishedGuides }],
    [{ total: publishedQuestions }],
    [{ total: activeFaqs }],
    [{ total: activeProfessionals }],
    [{ total: totalProfessionals }],
  ] = await Promise.all([
    db.select({ total: count() }).from(estimates),
    db.select({ status: leads.status, total: count() }).from(leads).groupBy(leads.status),
    db.select().from(pricingRules).where(eq(pricingRules.isActive, true)).orderBy(sql`${pricingRules.version} desc`).limit(1),
    db.select({ total: count() }).from(seoGuides).where(eq(seoGuides.status, "publicado")),
    db.select({ total: count() }).from(seoQuestions).where(eq(seoQuestions.status, "publicado")),
    db.select({ total: count() }).from(faqs).where(eq(faqs.isActive, true)),
    db.select({ total: count() }).from(professionals).where(eq(professionals.isActive, true)),
    db.select({ total: count() }).from(professionals),
  ]);

  return {
    totalEstimates,
    leadsByStatus: leadsRows.map((r) => ({ status: r.status, count: r.total })),
    activePricingRuleVersion: activeRule?.version ?? null,
    publishedGuides,
    publishedQuestions,
    activeFaqs,
    activeProfessionals,
    totalProfessionals,
  };
}
