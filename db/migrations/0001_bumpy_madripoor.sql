CREATE TYPE "public"."budget_line_category" AS ENUM('equipo', 'mano_obra', 'extras', 'otros');--> statement-breakpoint
CREATE TABLE "budget_comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_budget_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_budget_id" uuid NOT NULL,
	"label" text NOT NULL,
	"category" "budget_line_category" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_budgets" ALTER COLUMN "estimate_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_budgets" ADD COLUMN "comparison_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_budgets" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "user_budgets" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "budget_comparisons" ADD CONSTRAINT "budget_comparisons_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_budget_lines" ADD CONSTRAINT "user_budget_lines_user_budget_id_user_budgets_id_fk" FOREIGN KEY ("user_budget_id") REFERENCES "public"."user_budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_budgets" ADD CONSTRAINT "user_budgets_comparison_id_budget_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "public"."budget_comparisons"("id") ON DELETE no action ON UPDATE no action;