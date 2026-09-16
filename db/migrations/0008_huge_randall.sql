CREATE TYPE "public"."service_availability" AS ENUM('disponible', 'solo_solicitud', 'proximamente');--> statement-breakpoint
CREATE TABLE "professions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_key" text,
	"status" "content_status" DEFAULT 'borrador' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professions_category_id_slug_unique" UNIQUE("category_id","slug")
);
--> statement-breakpoint
CREATE TABLE "service_interest_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_type_id" uuid NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "estimate_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "service_categories" ADD COLUMN "icon_key" text;--> statement-breakpoint
ALTER TABLE "service_types" ADD COLUMN "profession_id" uuid;--> statement-breakpoint
ALTER TABLE "service_types" ADD COLUMN "availability_status" "service_availability" DEFAULT 'proximamente' NOT NULL;--> statement-breakpoint
ALTER TABLE "professions" ADD CONSTRAINT "professions_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_interest_signups" ADD CONSTRAINT "service_interest_signups_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_profession_id_professions_id_fk" FOREIGN KEY ("profession_id") REFERENCES "public"."professions"("id") ON DELETE no action ON UPDATE no action;