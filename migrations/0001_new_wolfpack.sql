-- Add the new PayPal email column
ALTER TABLE "seller_profiles" ADD COLUMN IF NOT EXISTS "paypal_email" varchar;--> statement-breakpoint
-- First, update any existing "manual" values to "stripe" as a safe default
UPDATE "seller_profiles" SET "payout_method" = 'stripe' WHERE "payout_method" = 'manual';--> statement-breakpoint
-- Now we need to update the enum constraint
-- First drop the old constraint if it exists
ALTER TABLE "seller_profiles" DROP CONSTRAINT IF EXISTS "seller_profiles_payout_method_check";--> statement-breakpoint
-- Add the new constraint with updated enum values
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_payout_method_check" CHECK ("payout_method" IN ('stripe', 'paypal'));--> statement-breakpoint
-- Set defaults
ALTER TABLE "seller_profiles" ALTER COLUMN "payout_method" SET DEFAULT 'stripe';--> statement-breakpoint
ALTER TABLE "seller_profiles" ALTER COLUMN "payout_method" SET NOT NULL;