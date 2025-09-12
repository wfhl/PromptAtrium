import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  char,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["user", "community_admin", "super_admin"] }).default("user"),
  
  // Extended profile fields
  username: varchar("username").unique(),
  bio: text("bio"),
  birthday: timestamp("birthday"),
  website: varchar("website"),
  
  // Preset social media handles
  twitterHandle: varchar("twitter_handle"),
  githubHandle: varchar("github_handle"),
  linkedinHandle: varchar("linkedin_handle"),
  instagramHandle: varchar("instagram_handle"),
  deviantartHandle: varchar("deviantart_handle"),
  blueskyHandle: varchar("bluesky_handle"),
  tiktokHandle: varchar("tiktok_handle"),
  redditHandle: varchar("reddit_handle"),
  patreonHandle: varchar("patreon_handle"),
  
  // Custom social links - array of {platform: string, url: string, handle?: string}
  customSocials: jsonb("custom_socials").default([]),
  
  // Privacy settings
  profileVisibility: varchar("profile_visibility", { 
    enum: ["public", "private"] 
  }).default("public"),
  emailVisibility: boolean("email_visibility").default(false),
  showStats: boolean("show_stats").default(true),
  showBirthday: boolean("show_birthday").default(false),
  showNsfw: boolean("show_nsfw").default(true),
  
  // Onboarding tracking
  hasCompletedIntro: boolean("has_completed_intro").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communities table
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  slug: varchar("slug").notNull().unique(),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User communities membership table
export const userCommunities = pgTable("user_communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  role: varchar("role", { enum: ["member", "admin"] }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Community admins table - tracks which users are admins of which communities
export const communityAdmins = pgTable("community_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Community invites table - tracks invite codes and their usage
export const communityInvites = pgTable("community_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  communityId: varchar("community_id").notNull().references(() => communities.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  maxUses: integer("max_uses").default(1),
  currentUses: integer("current_uses").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Collections table
export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  communityId: varchar("community_id").references(() => communities.id),
  type: varchar("type", { enum: ["user", "community", "global"] }).notNull().default("user"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { enum: ["user", "global"] }).notNull().default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prompt types table
export const promptTypes = pgTable("prompt_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { enum: ["user", "global"] }).notNull().default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prompt styles table
export const promptStyles = pgTable("prompt_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { enum: ["user", "global"] }).notNull().default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Intended generators table
export const intendedGenerators = pgTable("intended_generators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { enum: ["user", "global"] }).notNull().default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recommended models table
export const recommendedModels = pgTable("recommended_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { enum: ["user", "global"] }).notNull().default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Main prompts table
export const prompts = pgTable("prompts", {
  id: char("id", { length: 10 }).primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"),
  promptType: varchar("prompt_type"),
  promptStyle: varchar("prompt_style"),
  categories: text("categories").array(),
  promptTypes: text("prompt_types").array(),
  promptStyles: text("prompt_styles").array(),
  tags: text("tags").array(),
  tagsNormalized: text("tags_normalized").array(),
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),
  isHidden: boolean("is_hidden").default(false),
  isNsfw: boolean("is_nsfw").default(false),
  status: varchar("status", { enum: ["draft", "published", "archived"] }).default("draft"),
  exampleImagesUrl: text("example_images_url").array(),
  notes: text("notes"),
  author: varchar("author"),
  sourceUrl: varchar("source_url"),
  version: integer("version").default(1),
  forkOf: char("fork_of", { length: 10 }),
  usageCount: integer("usage_count").default(0),
  likes: integer("likes").default(0),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }).default("0.00"),
  intendedGenerator: varchar("intended_generator"),
  intendedGenerators: text("intended_generators").array(),
  recommendedModels: text("recommended_models").array(),
  technicalParams: jsonb("technical_params"),
  variables: jsonb("variables"),
  projectId: varchar("project_id").references(() => projects.id),
  collectionId: varchar("collection_id").references(() => collections.id),
  collectionIds: text("collection_ids").array(),
  relatedPrompts: text("related_prompts").array(),
  license: varchar("license"),
  lastUsedAt: timestamp("last_used_at"),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  promptContent: text("prompt_content").notNull(),
  negativePrompt: text("negative_prompt"),
});

// Prompt likes table - tracks individual likes/hearts
export const promptLikes = pgTable("prompt_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  promptId: char("prompt_id", { length: 10 }).notNull().references(() => prompts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prompt favorites table - tracks user bookmarks/favorites
export const promptFavorites = pgTable("prompt_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  promptId: char("prompt_id", { length: 10 }).notNull().references(() => prompts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prompt ratings table
export const promptRatings = pgTable("prompt_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  promptId: char("prompt_id", { length: 10 }).notNull().references(() => prompts.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Follows table - tracks who follows whom
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Composite index for fast lookups of who follows whom
  index("idx_follows_follower_following").on(table.followerId, table.followingId),
  // Index for finding all followers of a user
  index("idx_follows_following").on(table.followingId),
  // Index for finding all users someone follows
  index("idx_follows_follower").on(table.followerId),
]);

// Activities table - tracks user activities for the feed
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  actionType: varchar("action_type", { 
    enum: ["created_prompt", "shared_prompt", "liked_prompt", "favorited_prompt", 
           "followed_user", "joined_community", "created_collection"] 
  }).notNull(),
  targetId: varchar("target_id"), // ID of the prompt, user, collection, etc.
  targetType: varchar("target_type", { 
    enum: ["prompt", "user", "collection", "community"] 
  }),
  metadata: jsonb("metadata"), // Additional data about the activity
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Index for user's activity timeline
  index("idx_activities_user_created").on(table.userId, table.createdAt),
  // Index for fetching recent activities
  index("idx_activities_created").on(table.createdAt),
  // Index for filtering by action type
  index("idx_activities_action_type").on(table.actionType),
]);

// Keyword categories table - for organizing keywords hierarchically (defined first to avoid forward reference)
export const keywordCategories = pgTable("keyword_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  parentId: varchar("parent_id"), // Will add reference in a separate step to avoid circular reference
  icon: varchar("icon"), // Icon identifier for UI
  color: varchar("color"), // Color hex code for UI
  order: integer("order").default(0), // Display order
  level: integer("level").default(0), // Depth in hierarchy
  path: text("path").array().default([]), // Full path from root
  type: varchar("type", { enum: ["system", "user", "community"] }).default("system"),
  userId: varchar("user_id").references(() => users.id),
  communityId: varchar("community_id").references(() => communities.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_keyword_categories_parent").on(table.parentId),
  index("idx_keyword_categories_order").on(table.order),
  index("idx_keyword_categories_type").on(table.type),
]);

// Keywords table - for storing reusable keywords with metadata
export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: varchar("keyword").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => keywordCategories.id),
  synonyms: text("synonyms").array().default([]),
  examples: text("examples").array().default([]),
  relatedKeywords: text("related_keywords").array().default([]),
  frequency: integer("frequency").default(0), // Track usage frequency
  type: varchar("type", { enum: ["system", "user", "community"] }).default("system"),
  userId: varchar("user_id").references(() => users.id), // For user-created keywords
  communityId: varchar("community_id").references(() => communities.id), // For community-specific keywords
  tags: text("tags").array().default([]),
  metadata: jsonb("metadata"), // Store additional properties
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_keywords_keyword").on(table.keyword),
  index("idx_keywords_category").on(table.categoryId),
  index("idx_keywords_user").on(table.userId),
  index("idx_keywords_type").on(table.type),
]);

// Prompt templates table - for storing reusable templates with placeholders
export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  template: text("template").notNull(), // Template with {{placeholders}}
  placeholders: jsonb("placeholders").default([]), // Array of {name, description, type, default, options}
  categoryId: varchar("category_id").references(() => keywordCategories.id),
  tags: text("tags").array().default([]),
  examples: jsonb("examples").default([]), // Array of example usage with filled placeholders
  variables: jsonb("variables").default({}), // Pre-defined variable values
  type: varchar("type", { enum: ["system", "user", "community", "shared"] }).default("user"),
  visibility: varchar("visibility", { enum: ["private", "public", "community"] }).default("private"),
  userId: varchar("user_id").references(() => users.id),
  communityId: varchar("community_id").references(() => communities.id),
  forkedFrom: varchar("forked_from"), // Will add reference in relations to avoid circular reference
  usageCount: integer("usage_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_prompt_templates_user").on(table.userId),
  index("idx_prompt_templates_category").on(table.categoryId),
  index("idx_prompt_templates_type").on(table.type),
  index("idx_prompt_templates_visibility").on(table.visibility),
]);

// User custom synonyms table - for user-specific keyword synonyms
export const userCustomSynonyms = pgTable("user_custom_synonyms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  keywordId: varchar("keyword_id").notNull().references(() => keywords.id),
  synonym: varchar("synonym").notNull(),
  description: text("description"),
  isPreferred: boolean("is_preferred").default(false), // Mark as preferred over default
  context: varchar("context"), // Optional context where this synonym applies
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_synonyms_user").on(table.userId),
  index("idx_user_synonyms_keyword").on(table.keywordId),
  index("idx_user_synonyms_synonym").on(table.synonym),
]);

// Keyword usage history table - track how keywords are used
export const keywordUsageHistory = pgTable("keyword_usage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  keywordId: varchar("keyword_id").notNull().references(() => keywords.id),
  promptId: char("prompt_id", { length: 10 }).references(() => prompts.id),
  templateId: varchar("template_id").references(() => promptTemplates.id),
  context: text("context"), // The prompt or template where it was used
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_keyword_usage_user").on(table.userId),
  index("idx_keyword_usage_keyword").on(table.keywordId),
  index("idx_keyword_usage_created").on(table.createdAt),
]);

// Template usage history table - track template usage
export const templateUsageHistory = pgTable("template_usage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: varchar("template_id").notNull().references(() => promptTemplates.id),
  promptId: char("prompt_id", { length: 10 }).references(() => prompts.id),
  filledValues: jsonb("filled_values"), // The values used to fill the template
  output: text("output"), // The generated prompt
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_template_usage_user").on(table.userId),
  index("idx_template_usage_template").on(table.templateId),
  index("idx_template_usage_created").on(table.createdAt),
]);

// Prompt components table - imported from Excel with 24k+ entries
export const promptComponents = pgTable("prompt_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalId: integer("original_id"), // From the Excel file
  category: varchar("category").notNull(), // artform, photo_type, etc.
  value: text("value").notNull(), // The actual component value
  description: text("description"),
  subcategory: varchar("subcategory"),
  usageCount: integer("usage_count").default(0),
  orderIndex: integer("order_index").default(0),
  isDefault: boolean("is_default").default(false),
  importedAt: timestamp("imported_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_prompt_components_category").on(table.category),
  index("idx_prompt_components_subcategory").on(table.subcategory),
  index("idx_prompt_components_value").on(table.value),
  index("idx_prompt_components_usage").on(table.usageCount),
]);

// Aesthetics database table - imported from Excel with 1.8k+ entries
export const aesthetics = pgTable("aesthetics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalId: integer("original_id"), // From the Excel file
  name: varchar("name").notNull().unique(),
  description: text("description"),
  era: varchar("era"),
  categories: text("categories"), // Could be multiple, stored as comma-separated
  tags: text("tags"), // Comma-separated tags
  visualElements: text("visual_elements"),
  colorPalette: text("color_palette"),
  moodKeywords: text("mood_keywords"),
  relatedAesthetics: text("related_aesthetics"),
  mediaExamples: text("media_examples"),
  referenceImages: text("reference_images"), // Paths to reference images
  origin: text("origin"),
  category: varchar("category"),
  usageCount: integer("usage_count").default(0),
  popularity: decimal("popularity", { precision: 5, scale: 2 }).default("0.00"),
  importedAt: timestamp("imported_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_aesthetics_name").on(table.name),
  index("idx_aesthetics_era").on(table.era),
  index("idx_aesthetics_category").on(table.category),
  index("idx_aesthetics_usage").on(table.usageCount),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  prompts: many(prompts),
  projects: many(projects),
  collections: many(collections),
  favorites: many(promptFavorites),
  ratings: many(promptRatings),
  communityMemberships: many(userCommunities),
  communityAdminRoles: many(communityAdmins),
  createdInvites: many(communityInvites),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  activities: many(activities),
  keywords: many(keywords),
  keywordCategories: many(keywordCategories),
  promptTemplates: many(promptTemplates),
  customSynonyms: many(userCustomSynonyms),
  keywordUsageHistory: many(keywordUsageHistory),
  templateUsageHistory: many(templateUsageHistory),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  members: many(userCommunities),
  collections: many(collections),
  admins: many(communityAdmins),
  invites: many(communityInvites),
}));

export const userCommunitiesRelations = relations(userCommunities, ({ one }) => ({
  user: one(users, { fields: [userCommunities.userId], references: [users.id] }),
  community: one(communities, { fields: [userCommunities.communityId], references: [communities.id] }),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  user: one(users, { fields: [prompts.userId], references: [users.id] }),
  project: one(projects, { fields: [prompts.projectId], references: [projects.id] }),
  collection: one(collections, { fields: [prompts.collectionId], references: [collections.id] }),
  parentPrompt: one(prompts, { fields: [prompts.forkOf], references: [prompts.id], relationName: "promptForks" }),
  childPrompts: many(prompts, { relationName: "promptForks" }),
  favorites: many(promptFavorites),
  ratings: many(promptRatings),
  likes: many(promptLikes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  prompts: many(prompts),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, { fields: [collections.userId], references: [users.id] }),
  community: one(communities, { fields: [collections.communityId], references: [communities.id] }),
  prompts: many(prompts),
}));

export const promptFavoritesRelations = relations(promptFavorites, ({ one }) => ({
  user: one(users, { fields: [promptFavorites.userId], references: [users.id] }),
  prompt: one(prompts, { fields: [promptFavorites.promptId], references: [prompts.id] }),
}));

export const promptRatingsRelations = relations(promptRatings, ({ one }) => ({
  user: one(users, { fields: [promptRatings.userId], references: [users.id] }),
  prompt: one(prompts, { fields: [promptRatings.promptId], references: [prompts.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "following" }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

export const communityAdminsRelations = relations(communityAdmins, ({ one }) => ({
  user: one(users, { fields: [communityAdmins.userId], references: [users.id] }),
  community: one(communities, { fields: [communityAdmins.communityId], references: [communities.id] }),
  assignedByUser: one(users, { fields: [communityAdmins.assignedBy], references: [users.id] }),
}));

export const communityInvitesRelations = relations(communityInvites, ({ one }) => ({
  community: one(communities, { fields: [communityInvites.communityId], references: [communities.id] }),
  createdByUser: one(users, { fields: [communityInvites.createdBy], references: [users.id] }),
}));

// Keyword dictionary relations
export const keywordsRelations = relations(keywords, ({ one, many }) => ({
  category: one(keywordCategories, { fields: [keywords.categoryId], references: [keywordCategories.id] }),
  user: one(users, { fields: [keywords.userId], references: [users.id] }),
  community: one(communities, { fields: [keywords.communityId], references: [communities.id] }),
  customSynonyms: many(userCustomSynonyms),
  usageHistory: many(keywordUsageHistory),
}));

export const keywordCategoriesRelations = relations(keywordCategories, ({ one, many }) => ({
  parent: one(keywordCategories, { 
    fields: [keywordCategories.parentId], 
    references: [keywordCategories.id],
    relationName: "categoryHierarchy"
  }),
  children: many(keywordCategories, { relationName: "categoryHierarchy" }),
  keywords: many(keywords),
  promptTemplates: many(promptTemplates),
  user: one(users, { fields: [keywordCategories.userId], references: [users.id] }),
  community: one(communities, { fields: [keywordCategories.communityId], references: [communities.id] }),
}));

export const promptTemplatesRelations = relations(promptTemplates, ({ one, many }) => ({
  category: one(keywordCategories, { fields: [promptTemplates.categoryId], references: [keywordCategories.id] }),
  user: one(users, { fields: [promptTemplates.userId], references: [users.id] }),
  community: one(communities, { fields: [promptTemplates.communityId], references: [communities.id] }),
  forkedFromTemplate: one(promptTemplates, { 
    fields: [promptTemplates.forkedFrom], 
    references: [promptTemplates.id],
    relationName: "templateForks"
  }),
  forks: many(promptTemplates, { relationName: "templateForks" }),
  usageHistory: many(templateUsageHistory),
}));

export const userCustomSynonymsRelations = relations(userCustomSynonyms, ({ one }) => ({
  user: one(users, { fields: [userCustomSynonyms.userId], references: [users.id] }),
  keyword: one(keywords, { fields: [userCustomSynonyms.keywordId], references: [keywords.id] }),
}));

export const keywordUsageHistoryRelations = relations(keywordUsageHistory, ({ one }) => ({
  user: one(users, { fields: [keywordUsageHistory.userId], references: [users.id] }),
  keyword: one(keywords, { fields: [keywordUsageHistory.keywordId], references: [keywords.id] }),
  prompt: one(prompts, { fields: [keywordUsageHistory.promptId], references: [prompts.id] }),
  template: one(promptTemplates, { fields: [keywordUsageHistory.templateId], references: [promptTemplates.id] }),
}));

export const templateUsageHistoryRelations = relations(templateUsageHistory, ({ one }) => ({
  user: one(users, { fields: [templateUsageHistory.userId], references: [users.id] }),
  template: one(promptTemplates, { fields: [templateUsageHistory.templateId], references: [promptTemplates.id] }),
  prompt: one(prompts, { fields: [templateUsageHistory.promptId], references: [prompts.id] }),
}));

// Insert schemas
export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  likes: true,
  qualityScore: true,
  lastUsedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromptTypeSchema = createInsertSchema(promptTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromptStyleSchema = createInsertSchema(promptStyles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIntendedGeneratorSchema = createInsertSchema(intendedGenerators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecommendedModelSchema = createInsertSchema(recommendedModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserCommunitySchema = createInsertSchema(userCommunities).omit({
  id: true,
  joinedAt: true,
});

export const insertCommunityAdminSchema = createInsertSchema(communityAdmins).omit({
  id: true,
  assignedAt: true,
});

export const insertCommunityInviteSchema = createInsertSchema(communityInvites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentUses: true,
});

export const insertPromptRatingSchema = createInsertSchema(promptRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Keyword dictionary insert schemas
export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  frequency: true,
});

export const insertKeywordCategorySchema = createInsertSchema(keywordCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  level: true,
  path: true,
});

export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  rating: true,
});

export const insertUserCustomSynonymSchema = createInsertSchema(userCustomSynonyms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKeywordUsageHistorySchema = createInsertSchema(keywordUsageHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateUsageHistorySchema = createInsertSchema(templateUsageHistory).omit({
  id: true,
  createdAt: true,
});

export const insertPromptComponentSchema = createInsertSchema(promptComponents).omit({
  id: true,
  importedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAestheticSchema = createInsertSchema(aesthetics).omit({
  id: true,
  importedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Bulk edit schemas - only fields that can be bulk edited
export const bulkEditPromptSchema = z.object({
  // Fields that can be bulk edited
  categories: z.array(z.string()).optional(),
  promptTypes: z.array(z.string()).optional(),
  promptStyles: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  collectionIds: z.array(z.string()).optional(),
  license: z.string().optional(),
  intendedGenerators: z.array(z.string()).optional(),
  recommendedModels: z.array(z.string()).optional(),
  // Fields that will be auto-updated
  updatedAt: z.date().optional(),
});

export const bulkOperationSchema = z.object({
  promptIds: z.array(z.string()).min(1, "At least one prompt must be selected"),
  operation: z.enum([
    "update",
    "delete", 
    "archive",
    "unarchive",
    "publish",
    "draft",
    "makePublic",
    "makePrivate",
    "like",
    "unlike",
    "favorite",
    "unfavorite",
    "export"
  ]),
  updateData: bulkEditPromptSchema.optional(),
});

export const bulkOperationResultSchema = z.object({
  total: z.number(),
  success: z.number(),
  failed: z.number(),
  errors: z.array(z.object({
    promptId: z.string(),
    error: z.string(),
  })),
  results: z.array(z.object({
    promptId: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  })),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertPromptType = z.infer<typeof insertPromptTypeSchema>;
export type PromptType = typeof promptTypes.$inferSelect;
export type InsertPromptStyle = z.infer<typeof insertPromptStyleSchema>;
export type PromptStyle = typeof promptStyles.$inferSelect;
export type InsertIntendedGenerator = z.infer<typeof insertIntendedGeneratorSchema>;
export type IntendedGenerator = typeof intendedGenerators.$inferSelect;
export type InsertRecommendedModel = z.infer<typeof insertRecommendedModelSchema>;
export type RecommendedModel = typeof recommendedModels.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Community = typeof communities.$inferSelect;
export type InsertUserCommunity = z.infer<typeof insertUserCommunitySchema>;
export type UserCommunity = typeof userCommunities.$inferSelect;
export type InsertCommunityAdmin = z.infer<typeof insertCommunityAdminSchema>;
export type CommunityAdmin = typeof communityAdmins.$inferSelect;
export type InsertCommunityInvite = z.infer<typeof insertCommunityInviteSchema>;
export type CommunityInvite = typeof communityInvites.$inferSelect;
export type InsertPromptRating = z.infer<typeof insertPromptRatingSchema>;
export type PromptRating = typeof promptRatings.$inferSelect;
export type PromptLike = typeof promptLikes.$inferSelect;
export type PromptFavorite = typeof promptFavorites.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Bulk operation types
export type BulkEditPrompt = z.infer<typeof bulkEditPromptSchema>;
export type BulkOperation = z.infer<typeof bulkOperationSchema>;
export type BulkOperationResult = z.infer<typeof bulkOperationResultSchema>;
export type BulkOperationType = BulkOperation["operation"];

// User role types
export type UserRole = "user" | "community_admin" | "super_admin";
export type CommunityRole = "member" | "admin";
export type CollectionType = "user" | "community" | "global";

// Keyword dictionary types
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type KeywordCategory = typeof keywordCategories.$inferSelect;
export type InsertKeywordCategory = z.infer<typeof insertKeywordCategorySchema>;
export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type UserCustomSynonym = typeof userCustomSynonyms.$inferSelect;
export type InsertUserCustomSynonym = z.infer<typeof insertUserCustomSynonymSchema>;
export type KeywordUsageHistory = typeof keywordUsageHistory.$inferSelect;
export type InsertKeywordUsageHistory = z.infer<typeof insertKeywordUsageHistorySchema>;
export type TemplateUsageHistory = typeof templateUsageHistory.$inferSelect;
export type InsertTemplateUsageHistory = z.infer<typeof insertTemplateUsageHistorySchema>;
export type KeywordType = "system" | "user" | "community";
export type TemplateType = "system" | "user" | "community" | "shared";
export type TemplateVisibility = "private" | "public" | "community";

// Prompt component and aesthetic types
export type PromptComponent = typeof promptComponents.$inferSelect;
export type InsertPromptComponent = z.infer<typeof insertPromptComponentSchema>;
export type Aesthetic = typeof aesthetics.$inferSelect;
export type InsertAesthetic = z.infer<typeof insertAestheticSchema>;
