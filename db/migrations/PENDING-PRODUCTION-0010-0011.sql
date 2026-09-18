-- Migraciones pendientes de aplicar en producción (Neon): 0010 + 0011.
-- Generadas por drizzle-kit, concatenadas aquí solo para facilitar
-- pegarlas de una vez en el editor SQL de Neon. Son PURAMENTE ADITIVAS:
-- nuevos tipos enum, nuevas columnas nullable, una tabla nueva con FKs a
-- tablas ya existentes. No borran ni recodifican ningún dato existente.
--
-- Causa del fallo de build de Vercel: app/[categoria]/[servicio]/page.tsx
-- llama en build time (generateStaticParams / listCatalogTree) a una
-- consulta que ya incluye service_types.what_included/what_excluded
-- (añadidas en 0010) y pricing_rules.methodology_doc_path y compañía
-- (añadidas en 0011) — columnas que solo existen en el Postgres local de
-- desarrollo, nunca se aplicaron en Neon.
--
-- Cómo aplicarlo:
--   1. Abre el editor SQL de tu proyecto en Neon (console.neon.tech).
--   2. Pega y ejecuta todo este archivo de una vez.
--   3. Verifica con: SELECT what_included FROM service_types LIMIT 1;
--      y: SELECT id FROM price_validation_samples LIMIT 1;
--      (ambas deben ejecutarse sin error, aunque devuelvan 0 filas).
--   4. Vuelve a lanzar el deploy en Vercel (o "Redeploy" el mismo commit).

-- ===== 0010_simple_goliath =====
CREATE TYPE "public"."lead_property_type" AS ENUM('piso', 'casa', 'local', 'otro');
CREATE TYPE "public"."lead_urgency" AS ENUM('normal', 'urgente');
ALTER TABLE "leads" ADD COLUMN "property_type" "lead_property_type";
ALTER TABLE "leads" ADD COLUMN "urgency" "lead_urgency";
ALTER TABLE "leads" ADD COLUMN "current_state" text;
ALTER TABLE "leads" ADD COLUMN "approx_dimensions" text;
ALTER TABLE "leads" ADD COLUMN "user_stated_budget" numeric(10, 2);
ALTER TABLE "service_types" ADD COLUMN "what_included" text;
ALTER TABLE "service_types" ADD COLUMN "what_excluded" text;

-- ===== 0011_naive_lady_vermin =====
CREATE TYPE "public"."validation_sample_source" AS ENUM('lead_cerrado', 'aportado_manualmente');
CREATE TABLE "price_validation_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type_id" uuid NOT NULL,
	"region_id" uuid,
	"source" "validation_sample_source" NOT NULL,
	"related_lead_id" uuid,
	"related_estimate_id" uuid,
	"project_characteristics" text,
	"final_price_with_vat" numeric(10, 2) NOT NULL,
	"includes_vat" boolean NOT NULL,
	"includes_materials" boolean NOT NULL,
	"required_visit" boolean NOT NULL,
	"had_unexpected_issues" boolean DEFAULT false NOT NULL,
	"quote_date" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "pricing_rules" ADD COLUMN "methodology_doc_path" text;
ALTER TABLE "pricing_rules" ADD COLUMN "geographic_scope" text;
ALTER TABLE "pricing_rules" ADD COLUMN "reviewed_by" text;
ALTER TABLE "pricing_rules" ADD COLUMN "last_reviewed_at" timestamp with time zone;
ALTER TABLE "pricing_rules" ADD COLUMN "next_review_due_at" timestamp with time zone;
ALTER TABLE "pricing_rules" ADD COLUMN "known_issues" text;
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_related_lead_id_leads_id_fk" FOREIGN KEY ("related_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_related_estimate_id_estimates_id_fk" FOREIGN KEY ("related_estimate_id") REFERENCES "public"."estimates"("id") ON DELETE no action ON UPDATE no action;
