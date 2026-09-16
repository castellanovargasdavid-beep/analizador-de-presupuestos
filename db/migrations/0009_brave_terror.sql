CREATE TYPE "public"."lead_actor_type" AS ENUM('sistema', 'admin', 'profesional', 'usuario');--> statement-breakpoint
CREATE TYPE "public"."lead_quote_status" AS ENUM('enviado', 'rechazado_por_usuario', 'no_necesario');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms', 'whatsapp', 'interno');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pendiente', 'simulado', 'enviado', 'fallido');--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'en_validacion';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'en_cola';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'notificado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'visto';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'aceptado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'contacto_pendiente';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'contacto_confirmado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'presupuesto_pendiente';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'presupuesto_enviado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'en_revision_usuario';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'ganado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'perdido';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'rechazado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'expirado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'reasignacion_pendiente';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'reasignado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'cancelado';--> statement-breakpoint
ALTER TYPE "public"."lead_status" ADD VALUE 'invalido';--> statement-breakpoint
CREATE TABLE "automation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_professional_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"vat_pct" numeric(5, 4),
	"estimated_duration_days" integer,
	"line_items" jsonb,
	"conditions" text,
	"observations" text,
	"validity_days" integer,
	"status" "lead_quote_status" DEFAULT 'enviado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"from_status" "lead_status",
	"to_status" "lead_status" NOT NULL,
	"actor_type" "lead_actor_type" NOT NULL,
	"actor_id" text,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_key" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"recipient" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"lead_id" uuid,
	"professional_id" uuid,
	"status" "notification_status" DEFAULT 'pendiente' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "responded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contact_deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contact_warning_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contact_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "contact_method" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "requires_site_visit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "quote_deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "quote_warning_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "deadline_paused_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "deadline_pause_reason" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "reassignment_pending_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "reassigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "reassignment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "reassignment_reason" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "duplicate_of_lead_id" uuid;--> statement-breakpoint
ALTER TABLE "professionals" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "professionals" ADD COLUMN "max_concurrent_leads" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "professionals" ADD COLUMN "paused_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "professionals" ADD COLUMN "pause_reason" text;--> statement-breakpoint
ALTER TABLE "professionals" ADD COLUMN "notification_preferences" jsonb;--> statement-breakpoint
ALTER TABLE "professionals" ADD COLUMN "last_activity_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lead_professional_exclusions" ADD CONSTRAINT "lead_professional_exclusions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_professional_exclusions" ADD CONSTRAINT "lead_professional_exclusions_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_quotes" ADD CONSTRAINT "lead_quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_quotes" ADD CONSTRAINT "lead_quotes_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE no action ON UPDATE no action;