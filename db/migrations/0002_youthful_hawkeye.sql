ALTER TABLE "user_budgets" DROP CONSTRAINT "user_budgets_estimate_id_estimates_id_fk";
--> statement-breakpoint
ALTER TABLE "user_budgets" DROP COLUMN "estimate_id";