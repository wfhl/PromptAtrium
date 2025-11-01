CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"credit_reward" integer NOT NULL,
	"icon_name" varchar,
	"category" varchar NOT NULL,
	"required_count" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"action_type" varchar NOT NULL,
	"target_id" varchar,
	"target_type" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aesthetics" (
	"id" varchar PRIMARY KEY NOT NULL,
	"original_id" integer,
	"name" varchar,
	"description" text,
	"era" varchar,
	"categories" text,
	"tags" text,
	"visual_elements" text,
	"color_palette" text,
	"mood_keywords" text,
	"related_aesthetics" text,
	"media_examples" text,
	"reference_images" text,
	"origin" text,
	"category" varchar,
	"usage_count" integer,
	"popularity" numeric(5, 2),
	"imported_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"user_id" varchar,
	"type" varchar DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "character_presets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"gender" varchar,
	"role" varchar,
	"description" text,
	"is_favorite" boolean DEFAULT false,
	"user_id" varchar,
	"is_global" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex_assembled_strings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"type" varchar DEFAULT 'preset' NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"icon" varchar,
	"color" varchar,
	"order_index" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"parent_category_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "codex_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "codex_contributions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" varchar NOT NULL,
	"category_id" varchar NOT NULL,
	"description" text,
	"examples" text,
	"submitted_by" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"reviewed_by" varchar,
	"review_notes" text,
	"approved_term_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "codex_term_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" varchar NOT NULL,
	"image_url" varchar NOT NULL,
	"caption" text,
	"uploaded_by" varchar,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex_terms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"term" varchar NOT NULL,
	"description" text,
	"examples" text,
	"related_terms" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar,
	"is_official" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex_user_lists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category_id" varchar,
	"is_public" boolean DEFAULT false,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "codex_user_terms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_list_id" varchar NOT NULL,
	"term_id" varchar,
	"custom_term" varchar,
	"custom_description" text,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collection_community_sharing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"shared_by" varchar NOT NULL,
	"shared_at" timestamp DEFAULT now(),
	CONSTRAINT "collection_community_sharing_collection_id_community_id_unique" UNIQUE("collection_id","community_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"user_id" varchar,
	"community_id" varchar,
	"type" varchar DEFAULT 'user' NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"slug" varchar NOT NULL,
	"image_url" varchar,
	"is_active" boolean DEFAULT true,
	"parent_community_id" varchar,
	"level" integer DEFAULT 0,
	"path" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_admins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"assigned_by" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"max_uses" integer DEFAULT 1,
	"current_uses" integer DEFAULT 0,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "community_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source" varchar NOT NULL,
	"reference_id" varchar,
	"reference_type" varchar,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"last_claim_date" timestamp NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_days_claimed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_daily_rewards" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "digital_licenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"prompt_id" char(10) NOT NULL,
	"buyer_id" varchar NOT NULL,
	"license_key" varchar NOT NULL,
	"usage_rights" jsonb DEFAULT '{"personal":true,"commercial":true,"resale":false,"modification":true,"attribution":false}'::jsonb,
	"commercial_use" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "digital_licenses_license_key_unique" UNIQUE("license_key")
);
--> statement-breakpoint
CREATE TABLE "dispute_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"is_admin_message" boolean DEFAULT false NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" varchar NOT NULL,
	"following_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "intended_generators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"user_id" varchar,
	"type" varchar DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "intended_generators_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "marketplace_disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"initiated_by" varchar NOT NULL,
	"initiator_id" varchar NOT NULL,
	"respondent_id" varchar NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"reason" varchar NOT NULL,
	"description" text NOT NULL,
	"resolution" text,
	"refund_amount_cents" integer,
	"credit_refund_amount" integer,
	"escalated_at" timestamp,
	"last_responded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	CONSTRAINT "unique_order_dispute" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" char(10) NOT NULL,
	"seller_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"price_cents" integer,
	"credit_price" integer,
	"accepts_money" boolean DEFAULT true NOT NULL,
	"accepts_credits" boolean DEFAULT true NOT NULL,
	"preview_percentage" integer DEFAULT 20 NOT NULL,
	"tags" text[] DEFAULT '{}',
	"category" varchar,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_prompt_listing" UNIQUE("prompt_id")
);
--> statement-breakpoint
CREATE TABLE "marketplace_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"listing_id" varchar NOT NULL,
	"payment_method" varchar NOT NULL,
	"stripe_payment_intent_id" varchar,
	"amount_cents" integer,
	"credit_amount" integer,
	"platform_fee_cents" integer,
	"platform_fee_credits" integer,
	"seller_payout_cents" integer,
	"seller_payout_credits" integer,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "marketplace_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "marketplace_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"listing_id" varchar NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar,
	"comment" text NOT NULL,
	"verified_purchase" boolean DEFAULT true NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"seller_response" text,
	"seller_responded_at" timestamp,
	"edited_at" timestamp,
	"credits_awarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_order_review" UNIQUE("order_id"),
	CONSTRAINT "unique_user_listing_review" UNIQUE("reviewer_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"message" text NOT NULL,
	"related_user_id" varchar,
	"related_prompt_id" char(10),
	"related_list_id" varchar,
	"related_image_id" varchar,
	"is_read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"owner_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_community_sharing" (
	"prompt_id" char(10) NOT NULL,
	"community_id" varchar NOT NULL,
	"shared_by" varchar NOT NULL,
	"shared_at" timestamp DEFAULT now(),
	CONSTRAINT "prompt_community_sharing_prompt_id_community_id_pk" PRIMARY KEY("prompt_id","community_id")
);
--> statement-breakpoint
CREATE TABLE "prompt_favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"prompt_id" char(10) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "prompt_favorites_user_id_prompt_id_unique" UNIQUE("user_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "prompt_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"prompt_text" text NOT NULL,
	"template_used" varchar,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_saved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_image_contributions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" char(10) NOT NULL,
	"image_url" varchar NOT NULL,
	"contributor_id" varchar NOT NULL,
	"caption" text,
	"is_approved" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"prompt_id" char(10) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "prompt_likes_user_id_prompt_id_unique" UNIQUE("user_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "prompt_ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"prompt_id" char(10) NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_stylerule_templates" (
	"id" varchar PRIMARY KEY NOT NULL,
	"template_id" varchar,
	"name" varchar,
	"template" text,
	"description" text,
	"category" varchar,
	"is_custom" boolean,
	"created_by" varchar,
	"created_at" timestamp,
	"template_type" varchar,
	"is_default" boolean,
	"user_id" varchar,
	"system_prompt" text,
	"llm_provider" varchar,
	"llm_model" varchar,
	"use_happy_talk" boolean,
	"compress_prompt" boolean,
	"compression_level" integer
);
--> statement-breakpoint
CREATE TABLE "prompt_styles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"user_id" varchar,
	"type" varchar DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "prompt_styles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar,
	"name" varchar NOT NULL,
	"description" text,
	"template" text,
	"template_type" varchar,
	"master_prompt" text,
	"llm_provider" varchar DEFAULT 'openai',
	"llm_model" varchar DEFAULT 'gpt-4o',
	"use_happy_talk" boolean DEFAULT false,
	"compress_prompt" boolean DEFAULT false,
	"compression_level" varchar DEFAULT 'medium',
	"user_id" varchar,
	"is_global" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prompt_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"user_id" varchar,
	"type" varchar DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "prompt_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "prompt_components" (
	"id" varchar PRIMARY KEY NOT NULL,
	"original_id" integer,
	"category" varchar,
	"value" text,
	"description" text,
	"subcategory" varchar,
	"anatomy_group" varchar,
	"is_nsfw" boolean DEFAULT false,
	"usage_count" integer,
	"order_index" integer,
	"is_default" boolean,
	"imported_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" char(10) PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar,
	"prompt_type" varchar,
	"prompt_style" varchar,
	"categories" text[],
	"prompt_types" text[],
	"prompt_styles" text[],
	"tags" text[],
	"tags_normalized" text[],
	"is_public" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_hidden" boolean DEFAULT false,
	"is_nsfw" boolean DEFAULT false,
	"status" varchar DEFAULT 'draft',
	"example_images_url" text[],
	"notes" text,
	"author" varchar,
	"source_url" varchar,
	"version" integer DEFAULT 1,
	"branch_of" char(10),
	"usage_count" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"quality_score" numeric(3, 2) DEFAULT '0.00',
	"intended_generator" varchar,
	"intended_generators" text[],
	"recommended_models" text[],
	"technical_params" jsonb,
	"variables" jsonb,
	"intended_recipient" varchar,
	"specific_service" varchar,
	"style_keywords" text,
	"difficulty_level" varchar,
	"use_case" text,
	"additional_metadata" jsonb,
	"project_id" varchar,
	"collection_id" varchar,
	"collection_ids" text[],
	"related_prompts" text[],
	"license" varchar,
	"last_used_at" timestamp,
	"user_id" varchar NOT NULL,
	"sub_community_id" varchar,
	"sub_community_visibility" varchar DEFAULT 'private',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"prompt_content" text NOT NULL,
	"negative_prompt" text
);
--> statement-breakpoint
CREATE TABLE "recommended_models" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"user_id" varchar,
	"type" varchar DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "recommended_models_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"stripe_account_id" varchar,
	"onboarding_status" varchar DEFAULT 'not_started' NOT NULL,
	"business_type" varchar DEFAULT 'individual',
	"tax_info" jsonb,
	"payout_method" varchar,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"total_revenue_cents" integer DEFAULT 0 NOT NULL,
	"total_credits_earned" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"commission_rate" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "seller_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_community_admins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"sub_community_id" varchar NOT NULL,
	"assigned_by" varchar NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sub_community_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar NOT NULL,
	"sub_community_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"max_uses" integer DEFAULT 1,
	"current_uses" integer DEFAULT 0,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"role" varchar DEFAULT 'member',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sub_community_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" varchar NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"credits_claimed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_achievement" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_communities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"community_id" varchar NOT NULL,
	"sub_community_id" varchar,
	"role" varchar DEFAULT 'member',
	"status" varchar DEFAULT 'pending',
	"invited_by" varchar,
	"joined_at" timestamp DEFAULT now(),
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"last_activity" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'user',
	"username" varchar,
	"bio" text,
	"birthday" timestamp,
	"website" varchar,
	"twitter_handle" varchar,
	"github_handle" varchar,
	"linkedin_handle" varchar,
	"instagram_handle" varchar,
	"deviantart_handle" varchar,
	"bluesky_handle" varchar,
	"tiktok_handle" varchar,
	"reddit_handle" varchar,
	"patreon_handle" varchar,
	"custom_socials" jsonb DEFAULT '[]'::jsonb,
	"profile_visibility" varchar DEFAULT 'public',
	"email_visibility" boolean DEFAULT false,
	"show_stats" boolean DEFAULT true,
	"show_birthday" boolean DEFAULT false,
	"show_nsfw" boolean DEFAULT true,
	"has_completed_intro" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_presets" ADD CONSTRAINT "character_presets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_assembled_strings" ADD CONSTRAINT "codex_assembled_strings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_contributions" ADD CONSTRAINT "codex_contributions_category_id_codex_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."codex_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_contributions" ADD CONSTRAINT "codex_contributions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_contributions" ADD CONSTRAINT "codex_contributions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_contributions" ADD CONSTRAINT "codex_contributions_approved_term_id_codex_terms_id_fk" FOREIGN KEY ("approved_term_id") REFERENCES "public"."codex_terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_term_images" ADD CONSTRAINT "codex_term_images_term_id_codex_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."codex_terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_term_images" ADD CONSTRAINT "codex_term_images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_terms" ADD CONSTRAINT "codex_terms_category_id_codex_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."codex_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_terms" ADD CONSTRAINT "codex_terms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_user_lists" ADD CONSTRAINT "codex_user_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_user_lists" ADD CONSTRAINT "codex_user_lists_category_id_codex_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."codex_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_user_terms" ADD CONSTRAINT "codex_user_terms_user_list_id_codex_user_lists_id_fk" FOREIGN KEY ("user_list_id") REFERENCES "public"."codex_user_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codex_user_terms" ADD CONSTRAINT "codex_user_terms_term_id_codex_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."codex_terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_community_sharing" ADD CONSTRAINT "collection_community_sharing_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_community_sharing" ADD CONSTRAINT "collection_community_sharing_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_community_sharing" ADD CONSTRAINT "collection_community_sharing_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_parent_community_id_communities_id_fk" FOREIGN KEY ("parent_community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_admins" ADD CONSTRAINT "community_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_admins" ADD CONSTRAINT "community_admins_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_admins" ADD CONSTRAINT "community_admins_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invites" ADD CONSTRAINT "community_invites_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invites" ADD CONSTRAINT "community_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_rewards" ADD CONSTRAINT "daily_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_licenses" ADD CONSTRAINT "digital_licenses_order_id_marketplace_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."marketplace_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_licenses" ADD CONSTRAINT "digital_licenses_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_licenses" ADD CONSTRAINT "digital_licenses_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_marketplace_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."marketplace_disputes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intended_generators" ADD CONSTRAINT "intended_generators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_order_id_marketplace_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."marketplace_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_respondent_id_users_id_fk" FOREIGN KEY ("respondent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_order_id_marketplace_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."marketplace_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_prompt_id_prompts_id_fk" FOREIGN KEY ("related_prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_list_id_codex_user_lists_id_fk" FOREIGN KEY ("related_list_id") REFERENCES "public"."codex_user_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_community_sharing" ADD CONSTRAINT "prompt_community_sharing_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_community_sharing" ADD CONSTRAINT "prompt_community_sharing_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_community_sharing" ADD CONSTRAINT "prompt_community_sharing_shared_by_users_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_favorites" ADD CONSTRAINT "prompt_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_favorites" ADD CONSTRAINT "prompt_favorites_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_history" ADD CONSTRAINT "prompt_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_image_contributions" ADD CONSTRAINT "prompt_image_contributions_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_image_contributions" ADD CONSTRAINT "prompt_image_contributions_contributor_id_users_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_likes" ADD CONSTRAINT "prompt_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_likes" ADD CONSTRAINT "prompt_likes_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_ratings" ADD CONSTRAINT "prompt_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_ratings" ADD CONSTRAINT "prompt_ratings_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_stylerule_templates" ADD CONSTRAINT "prompt_stylerule_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_styles" ADD CONSTRAINT "prompt_styles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_types" ADD CONSTRAINT "prompt_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_sub_community_id_communities_id_fk" FOREIGN KEY ("sub_community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommended_models" ADD CONSTRAINT "recommended_models_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_community_admins" ADD CONSTRAINT "sub_community_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_community_admins" ADD CONSTRAINT "sub_community_admins_sub_community_id_communities_id_fk" FOREIGN KEY ("sub_community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_community_admins" ADD CONSTRAINT "sub_community_admins_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_community_invites" ADD CONSTRAINT "sub_community_invites_sub_community_id_communities_id_fk" FOREIGN KEY ("sub_community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_community_invites" ADD CONSTRAINT "sub_community_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_communities" ADD CONSTRAINT "user_communities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_communities" ADD CONSTRAINT "user_communities_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_communities" ADD CONSTRAINT "user_communities_sub_community_id_communities_id_fk" FOREIGN KEY ("sub_community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_communities" ADD CONSTRAINT "user_communities_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_achievements_category" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_achievements_active" ON "achievements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_activities_user_created" ON "activities" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activities_created" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activities_action_type" ON "activities" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_collection_community_sharing_collection" ON "collection_community_sharing" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "idx_collection_community_sharing_community" ON "collection_community_sharing" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_collection_community_sharing_user" ON "collection_community_sharing" USING btree ("shared_by");--> statement-breakpoint
CREATE INDEX "idx_collections_user_id" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_communities_parent" ON "communities" USING btree ("parent_community_id");--> statement-breakpoint
CREATE INDEX "idx_communities_path" ON "communities" USING btree ("path");--> statement-breakpoint
CREATE INDEX "idx_communities_level" ON "communities" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_credit_transactions_user_created" ON "credit_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_credit_transactions_type" ON "credit_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_credit_transactions_source" ON "credit_transactions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_daily_rewards_user" ON "daily_rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_digital_licenses_order" ON "digital_licenses" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_digital_licenses_buyer" ON "digital_licenses" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_digital_licenses_prompt" ON "digital_licenses" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_messages_dispute" ON "dispute_messages" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_messages_sender" ON "dispute_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_messages_admin" ON "dispute_messages" USING btree ("is_admin_message");--> statement-breakpoint
CREATE INDEX "idx_dispute_messages_created" ON "dispute_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_follows_follower_following" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "idx_follows_following" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "idx_follows_follower" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_disputes_order" ON "marketplace_disputes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_disputes_initiator" ON "marketplace_disputes" USING btree ("initiator_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_disputes_respondent" ON "marketplace_disputes" USING btree ("respondent_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_disputes_status" ON "marketplace_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_marketplace_disputes_escalated" ON "marketplace_disputes" USING btree ("escalated_at");--> statement-breakpoint
CREATE INDEX "idx_marketplace_listings_prompt" ON "marketplace_listings" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_listings_seller" ON "marketplace_listings" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_listings_status" ON "marketplace_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_marketplace_listings_category" ON "marketplace_listings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_buyer" ON "marketplace_orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_seller" ON "marketplace_orders" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_listing" ON "marketplace_orders" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_status" ON "marketplace_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_marketplace_orders_stripe" ON "marketplace_orders" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_reviews_listing" ON "marketplace_reviews" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_reviews_order" ON "marketplace_reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_reviews_reviewer" ON "marketplace_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_marketplace_reviews_rating" ON "marketplace_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_marketplace_reviews_created" ON "marketplace_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_created" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_prompt_community_sharing_prompt" ON "prompt_community_sharing" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_community_sharing_community" ON "prompt_community_sharing" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_community_sharing_user" ON "prompt_community_sharing" USING btree ("shared_by");--> statement-breakpoint
CREATE INDEX "idx_prompt_contributions_prompt" ON "prompt_image_contributions" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_contributions_contributor" ON "prompt_image_contributions" USING btree ("contributor_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_user_id" ON "prompts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_collection_id" ON "prompts" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_sub_community_id" ON "prompts" USING btree ("sub_community_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_public_created" ON "prompts" USING btree ("is_public","created_at");--> statement-breakpoint
CREATE INDEX "idx_prompts_featured" ON "prompts" USING btree ("is_featured") WHERE "prompts"."is_featured" = true;--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_user" ON "seller_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_status" ON "seller_profiles" USING btree ("onboarding_status");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_sub_community_admins_user" ON "sub_community_admins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sub_community_admins_sub_community" ON "sub_community_admins" USING btree ("sub_community_id");--> statement-breakpoint
CREATE INDEX "idx_sub_community_admins_user_sub_community" ON "sub_community_admins" USING btree ("user_id","sub_community_id");--> statement-breakpoint
CREATE INDEX "idx_sub_community_invites_sub_community" ON "sub_community_invites" USING btree ("sub_community_id");--> statement-breakpoint
CREATE INDEX "idx_sub_community_invites_code" ON "sub_community_invites" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_sub_community_invites_active" ON "sub_community_invites" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_sub_community_invites_created_by" ON "sub_community_invites" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_user" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_completed" ON "user_achievements" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "idx_user_communities_user_id" ON "user_communities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_communities_community_id" ON "user_communities" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "idx_user_communities_sub_community_id" ON "user_communities" USING btree ("sub_community_id");--> statement-breakpoint
CREATE INDEX "idx_user_credits_user" ON "user_credits" USING btree ("user_id");