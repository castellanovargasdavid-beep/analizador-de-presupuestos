CREATE TYPE "public"."lead_payment_status" AS ENUM('no_aplica', 'pendiente', 'pagado');--> statement-breakpoint
CREATE TYPE "public"."lead_purchase_intent" AS ENUM('explorando', 'comparando_presupuestos', 'listo_para_contratar');--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'nuevo'::text;--> statement-breakpoint
DROP TYPE "public"."lead_status";--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('nuevo', 'validado', 'descartado', 'asignado', 'enviado', 'contactado', 'sin_cobertura', 'cerrado', 'con_incidencia');--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'nuevo'::"public"."lead_status";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "status" SET DATA TYPE "public"."lead_status" USING "status"::"public"."lead_status";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "desired_timeframe" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "purchase_intent" "lead_purchase_intent";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "range_acknowledged" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "discard_reason" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "validated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "sent_to_professional_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contacted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contact_outcome" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "agreed_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "payment_status" "lead_payment_status" DEFAULT 'no_aplica' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "payment_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "payment_registered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "incident_notes" text;