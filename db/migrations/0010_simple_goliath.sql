CREATE TYPE "public"."lead_property_type" AS ENUM('piso', 'casa', 'local', 'otro');--> statement-breakpoint
CREATE TYPE "public"."lead_urgency" AS ENUM('normal', 'urgente');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "property_type" "lead_property_type";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "urgency" "lead_urgency";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "current_state" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "approx_dimensions" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "user_stated_budget" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "service_types" ADD COLUMN "what_included" text;--> statement-breakpoint
ALTER TABLE "service_types" ADD COLUMN "what_excluded" text;