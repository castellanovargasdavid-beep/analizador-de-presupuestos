/**
 * Capa de acceso a datos del catálogo multi-servicio (categorías →
 * profesiones → servicios). Separada de lib/estimation/repository.ts a
 * propósito: esto es navegación/SEO, no el motor de precios — un servicio
 * puede existir aquí sin tener todavía ninguna regla de precio.
 */
import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db/client";
import { professions, serviceCategories, serviceTypes } from "@/db/schema";

export type ServiceAvailability = "disponible" | "solo_solicitud" | "proximamente";

export interface CatalogServiceSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  availabilityStatus: ServiceAvailability;
}

export interface CatalogProfessionSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  services: CatalogServiceSummary[];
}

export interface CatalogCategorySummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  professions: CatalogProfessionSummary[];
}

/**
 * Árbol completo del catálogo público: categorías activas → profesiones
 * publicadas → servicios activos. Un único query por tabla (sin N+1) y
 * ensamblado en memoria — el volumen (decenas de filas, no miles) no
 * justifica nada más elaborado.
 */
export const listCatalogTree = cache(async (): Promise<CatalogCategorySummary[]> => {
  const [categoryRows, professionRows, serviceRows] = await Promise.all([
    db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.isActive, true))
      .orderBy(asc(serviceCategories.name)),
    db
      .select()
      .from(professions)
      .where(eq(professions.status, "publicado"))
      .orderBy(asc(professions.sortOrder), asc(professions.name)),
    db.select().from(serviceTypes).where(eq(serviceTypes.isActive, true)).orderBy(asc(serviceTypes.name)),
  ]);

  const servicesByProfessionId = new Map<string, CatalogServiceSummary[]>();
  for (const s of serviceRows) {
    if (!s.professionId) continue;
    const list = servicesByProfessionId.get(s.professionId) ?? [];
    list.push({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      availabilityStatus: s.availabilityStatus,
    });
    servicesByProfessionId.set(s.professionId, list);
  }

  const professionsByCategoryId = new Map<string, CatalogProfessionSummary[]>();
  for (const p of professionRows) {
    const list = professionsByCategoryId.get(p.categoryId) ?? [];
    list.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      iconKey: p.iconKey,
      services: servicesByProfessionId.get(p.id) ?? [],
    });
    professionsByCategoryId.set(p.categoryId, list);
  }

  return categoryRows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    iconKey: c.iconKey,
    professions: professionsByCategoryId.get(c.id) ?? [],
  }));
});

export async function listCategorySlugs(): Promise<string[]> {
  const rows = await db.select({ slug: serviceCategories.slug }).from(serviceCategories).where(eq(serviceCategories.isActive, true));
  return rows.map((r) => r.slug);
}

export const getCategoryBySlug = cache(async (slug: string) => {
  const tree = await listCatalogTree();
  return tree.find((c) => c.slug === slug) ?? null;
});

export async function listProfessionSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: professions.slug }).from(professions).where(eq(professions.status, "publicado"));
  return rows.map((r) => r.slug);
}

/**
 * Búsqueda global por slug de profesión (no por categoría): el slug de
 * `professions` es único por categoría a nivel de esquema, pero en la
 * práctica no se repite entre categorías porque el nombre de una profesión
 * es el mismo en todo el catálogo — ver validación de unicidad global en
 * lib/admin/catalog/validation.ts al crear una nueva.
 */
export const getProfessionBySlug = cache(async (slug: string) => {
  const [profession] = await db
    .select()
    .from(professions)
    .where(and(eq(professions.slug, slug), eq(professions.status, "publicado")))
    .limit(1);
  if (!profession) return null;

  const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, profession.categoryId)).limit(1);
  const services = await db
    .select()
    .from(serviceTypes)
    .where(and(eq(serviceTypes.professionId, profession.id), eq(serviceTypes.isActive, true)))
    .orderBy(asc(serviceTypes.name));

  return { profession, category, services };
});

/** Servicio concreto por categoría+slug, para las páginas de solicitud directa. */
export const getServiceTypeBySlug = cache(async (categorySlug: string, serviceSlug: string) => {
  const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.slug, categorySlug)).limit(1);
  if (!category) return null;
  const [service] = await db
    .select()
    .from(serviceTypes)
    .where(and(eq(serviceTypes.categoryId, category.id), eq(serviceTypes.slug, serviceSlug), eq(serviceTypes.isActive, true)))
    .limit(1);
  return service ?? null;
});
