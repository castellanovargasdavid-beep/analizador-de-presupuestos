CREATE TYPE "public"."validation_sample_source" AS ENUM('lead_cerrado', 'aportado_manualmente');--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD COLUMN "methodology_doc_path" text;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD COLUMN "geographic_scope" text;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD COLUMN "reviewed_by" text;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD COLUMN "last_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD COLUMN "next_review_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD COLUMN "known_issues" text;--> statement-breakpoint
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_related_lead_id_leads_id_fk" FOREIGN KEY ("related_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_validation_samples" ADD CONSTRAINT "price_validation_samples_related_estimate_id_estimates_id_fk" FOREIGN KEY ("related_estimate_id") REFERENCES "public"."estimates"("id") ON DELETE no action ON UPDATE no action;