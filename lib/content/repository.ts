/**
 * Capa de acceso a datos del contenido editorial gestionable desde
 * /admin (faqs, guías, preguntas). Igual que lib/estimation/repository.ts:
 * el resto del código nunca toca Drizzle directamente para esto.
 */
import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { faqs, seoGuides, seoQuestions } from "@/db/schema";

export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQs de una página concreta (no una guía/pregunta independiente), identificada por `pageKey`. */
export async function listFaqsForPage(pageKey: string): Promise<FaqItem[]> {
  const rows = await db
    .select({ question: faqs.question, answer: faqs.answer })
    .from(faqs)
    .where(and(eq(faqs.pageKey, pageKey), eq(faqs.isActive, true)))
    .orderBy(asc(faqs.sortOrder));
  return rows;
}

export async function listPublishedGuides() {
  return db
    .select({ slug: seoGuides.slug, title: seoGuides.title, summary: seoGuides.summary })
    .from(seoGuides)
    .where(eq(seoGuides.status, "publicado"))
    .orderBy(asc(seoGuides.title));
}

export const getPublishedGuide = cache(async (slug: string) => {
  const [row] = await db
    .select()
    .from(seoGuides)
    .where(and(eq(seoGuides.slug, slug), eq(seoGuides.status, "publicado")))
    .limit(1);
  return row ?? null;
});

export async function listPublishedGuideSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: seoGuides.slug }).from(seoGuides).where(eq(seoGuides.status, "publicado"));
  return rows.map((r) => r.slug);
}

export async function listPublishedQuestions() {
  return db
    .select({ slug: seoQuestions.slug, question: seoQuestions.question, shortAnswer: seoQuestions.shortAnswer })
    .from(seoQuestions)
    .where(eq(seoQuestions.status, "publicado"))
    .orderBy(asc(seoQuestions.question));
}

export const getPublishedQuestion = cache(async (slug: string) => {
  const [row] = await db
    .select()
    .from(seoQuestions)
    .where(and(eq(seoQuestions.slug, slug), eq(seoQuestions.status, "publicado")))
    .limit(1);
  return row ?? null;
});

export async function listPublishedQuestionSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: seoQuestions.slug }).from(seoQuestions).where(eq(seoQuestions.status, "publicado"));
  return rows.map((r) => r.slug);
}
