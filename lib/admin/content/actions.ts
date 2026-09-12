"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { faqs, seoGuides, seoQuestions } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { toSafeError, type ErrorKind } from "@/lib/errors/safe-message";
import { parseGuideBodyText, parseRelatedLinksText, parseDetailText } from "@/lib/content/body-text";
import { faqFormSchema, guideFormSchema, questionFormSchema } from "./validation";

export interface ActionResult {
  ok: boolean;
  error?: string;
  errorKind?: ErrorKind;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function saveGuideAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = guideFormSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    metaDescription: formData.get("metaDescription"),
    intro: formData.get("intro"),
    bodyText: formData.get("bodyText"),
    ctaHref: formData.get("ctaHref"),
    ctaLabel: formData.get("ctaLabel"),
    relatedLinksText: formData.get("relatedLinksText"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { id, bodyText, relatedLinksText, ...rest } = parsed.data;
  const body = parseGuideBodyText(bodyText);
  const relatedLinks = parseRelatedLinksText(relatedLinksText ?? "");

  try {
    if (id) {
      const [existing] = await db.select({ status: seoGuides.status, version: seoGuides.version, publishedAt: seoGuides.publishedAt }).from(seoGuides).where(eq(seoGuides.id, id)).limit(1);
      const version = (existing?.version ?? 0) + 1;
      const publishedAt =
        rest.status === "publicado" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);
      await db
        .update(seoGuides)
        .set({ ...rest, body, relatedLinks, version, publishedAt, updatedAt: new Date() })
        .where(eq(seoGuides.id, id));
      await recordAudit({ action: "update", entityType: "seo_guide", entityId: id, summary: `Editada guía "${rest.title}" (v${version})` });
    } else {
      const publishedAt = rest.status === "publicado" ? new Date() : null;
      const [row] = await db
        .insert(seoGuides)
        .values({ ...rest, body, relatedLinks, version: 1, publishedAt })
        .returning({ id: seoGuides.id });
      await recordAudit({ action: "create", entityType: "seo_guide", entityId: row.id, summary: `Creada guía "${rest.title}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveGuideAction", "No se ha podido guardar la guía.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/guias");
  revalidatePath("/guias");
  revalidatePath(`/guias/${rest.slug}`);
  return { ok: true };
}

export async function saveQuestionAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = questionFormSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    question: formData.get("question"),
    shortAnswer: formData.get("shortAnswer"),
    detailText: formData.get("detailText"),
    relatedLinksText: formData.get("relatedLinksText"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const { id, detailText, relatedLinksText, ...rest } = parsed.data;
  const detail = parseDetailText(detailText);
  const relatedLinks = parseRelatedLinksText(relatedLinksText ?? "");

  try {
    if (id) {
      const [existing] = await db.select({ status: seoQuestions.status, version: seoQuestions.version, publishedAt: seoQuestions.publishedAt }).from(seoQuestions).where(eq(seoQuestions.id, id)).limit(1);
      const version = (existing?.version ?? 0) + 1;
      const publishedAt =
        rest.status === "publicado" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);
      await db
        .update(seoQuestions)
        .set({ ...rest, detail, relatedLinks, version, publishedAt, updatedAt: new Date() })
        .where(eq(seoQuestions.id, id));
      await recordAudit({ action: "update", entityType: "seo_question", entityId: id, summary: `Editada pregunta "${rest.question}" (v${version})` });
    } else {
      const publishedAt = rest.status === "publicado" ? new Date() : null;
      const [row] = await db
        .insert(seoQuestions)
        .values({ ...rest, detail, relatedLinks, version: 1, publishedAt })
        .returning({ id: seoQuestions.id });
      await recordAudit({ action: "create", entityType: "seo_question", entityId: row.id, summary: `Creada pregunta "${rest.question}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveQuestionAction", "No se ha podido guardar la pregunta.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/preguntas");
  revalidatePath("/preguntas");
  revalidatePath(`/preguntas/${rest.slug}`);
  return { ok: true };
}

export async function saveFaqAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = faqFormSchema.safeParse({
    id: formData.get("id") || undefined,
    pageKey: formData.get("pageKey"),
    question: formData.get("question"),
    answer: formData.get("answer"),
    sortOrder: formData.get("sortOrder"),
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, errorKind: "validation", error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  try {
    if (parsed.data.id) {
      await db.update(faqs).set({ ...parsed.data, updatedAt: new Date() }).where(eq(faqs.id, parsed.data.id));
      await recordAudit({ action: "update", entityType: "faq", entityId: parsed.data.id, summary: `Editada FAQ de "${parsed.data.pageKey}"` });
    } else {
      const [row] = await db.insert(faqs).values(parsed.data).returning({ id: faqs.id });
      await recordAudit({ action: "create", entityType: "faq", entityId: row.id, summary: `Creada FAQ en "${parsed.data.pageKey}"` });
    }
  } catch (err) {
    const safe = toSafeError(err, "saveFaqAction", "No se ha podido guardar la FAQ.");
    return { ok: false, error: safe.message, errorKind: safe.kind };
  }

  revalidatePath("/admin/faqs");
  return { ok: true };
}
