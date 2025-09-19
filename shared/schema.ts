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
  serial,
  unique,
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
  role: varchar("role", { enum: ["user", "community_admin", "super_admin", "developer"] }).default("user"),
  
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

// Prompt style rule templates table (renamed from prompt_templates)
export const promptStyleRuleTemplates = pgTable("prompt_stylerule_templates", {
  id: varchar("id").primaryKey(),
  templateId: varchar("template_id"),
  name: varchar("name"),
  template: text("template"),
  description: text("description"),
  category: varchar("category"),
  isCustom: boolean("is_custom"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at"),
  templateType: varchar("template_type"),
  isDefault: boolean("is_default"),
  userId: varchar("user_id").references(() => users.id),
  systemPrompt: text("system_prompt"), // Renamed from master_prompt
  llmProvider: varchar("llm_provider"),
  llmModel: varchar("llm_model"),
  useHappyTalk: boolean("use_happy_talk"),
  compressPrompt: boolean("compress_prompt"),
  compressionLevel: integer("compression_level"),
});

// Character presets table for Quick Prompt
export const characterPresets = pgTable("character_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  gender: varchar("gender"),
  role: varchar("role"),
  description: text("description"),
  isFavorite: boolean("is_favorite").default(false),
  userId: varchar("user_id").references(() => users.id),
  isGlobal: boolean("is_global").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prompt templates table for Quick Prompt
export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id"),
  name: varchar("name").notNull(),
  description: text("description"),
  template: text("template"),
  templateType: varchar("template_type"),
  masterPrompt: text("master_prompt"),
  llmProvider: varchar("llm_provider").default("openai"),
  llmModel: varchar("llm_model").default("gpt-4o"),
  useHappyTalk: boolean("use_happy_talk").default(false),
  compressPrompt: boolean("compress_prompt").default(false),
  compressionLevel: varchar("compression_level").default("medium"),
  userId: varchar("user_id").references(() => users.id),
  isGlobal: boolean("is_global").default(false),
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

// Legacy tables - preserved to prevent data loss during migration
// These tables exist in the database but are not actively used in the current application
export const aesthetics = pgTable("aesthetics", {
  id: varchar("id").primaryKey(),
  original_id: integer("original_id"),
  name: varchar("name"), // Keep as is without length restriction
  description: text("description"),
  era: varchar("era"), // Keep as is without length restriction
  categories: text("categories"), // Keep as text, not array
  tags: text("tags"), // Keep as text, not array
  visual_elements: text("visual_elements"), // Keep as text, not array
  color_palette: text("color_palette"), // Keep as text, not array
  mood_keywords: text("mood_keywords"), // Keep as text, not array
  related_aesthetics: text("related_aesthetics"), // Keep as text, not array
  media_examples: text("media_examples"),
  reference_images: text("reference_images"), // Keep as text, not array
  origin: text("origin"),
  category: varchar("category"),
  usage_count: integer("usage_count"),
  popularity: decimal("popularity", { precision: 5, scale: 2 }), // Match existing precision
  imported_at: timestamp("imported_at"),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});

export const prompt_components = pgTable("prompt_components", {
  id: varchar("id").primaryKey(),
  original_id: integer("original_id"),
  category: varchar("category"), // Keep without length restriction
  value: text("value"),
  description: text("description"),
  subcategory: varchar("subcategory"),
  anatomy_group: varchar("anatomy_group"), // Group for organized display (Subject, Style, Environment, etc.)
  is_nsfw: boolean("is_nsfw").default(false), // Flag for NSFW content
  usage_count: integer("usage_count"),
  order_index: integer("order_index"),
  is_default: boolean("is_default"),
  imported_at: timestamp("imported_at"),
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
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
  // Extended metadata fields for comprehensive import support
  intendedRecipient: varchar("intended_recipient"),
  specificService: varchar("specific_service"),
  styleKeywords: text("style_keywords"),
  difficultyLevel: varchar("difficulty_level"),
  useCase: text("use_case"),
  additionalMetadata: jsonb("additional_metadata"), // For any unmapped fields
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
}, (table) => {
  return {
    uniqueLike: unique().on(table.userId, table.promptId),
  };
});

// Prompt favorites table - tracks user bookmarks/favorites
export const promptFavorites = pgTable("prompt_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  promptId: char("prompt_id", { length: 10 }).notNull().references(() => prompts.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueFavorite: unique().on(table.userId, table.promptId),
  };
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

// Notifications table - tracks notifications for user actions
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Who receives the notification
  type: varchar("type", { 
    enum: ["follow", "like", "fork", "approval", "contribution_approved", "comment", "mention"] 
  }).notNull(),
  message: text("message").notNull(),
  relatedUserId: varchar("related_user_id").references(() => users.id), // Who triggered the notification
  relatedPromptId: char("related_prompt_id", { length: 10 }).references(() => prompts.id), // Related prompt if applicable
  relatedListId: varchar("related_list_id").references(() => codexUserLists.id), // For codex list approvals
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"), // Additional notification-specific data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Index for fetching user's notifications
  index("idx_notifications_user_created").on(table.userId, table.createdAt),
  // Index for unread notifications count
  index("idx_notifications_user_unread").on(table.userId, table.isRead),
]);

// Wordsmith Codex Tables

// Categories for organizing terms (e.g., "Styles", "Lighting", "Aesthetics", etc.)
export const codexCategories = pgTable("codex_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"), // Icon name for UI display (e.g., "palette", "camera", "sun")
  color: varchar("color"), // Color for UI display (e.g., "blue", "green", "purple")
  orderIndex: integer("order_index").default(0),
  isActive: boolean("is_active").default(true),
  parentCategoryId: varchar("parent_category_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual terms/wildcards within categories
export const codexTerms = pgTable("codex_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => codexCategories.id),
  term: varchar("term").notNull(),
  description: text("description"),
  examples: text("examples"), // Example usage of the term
  relatedTerms: jsonb("related_terms").default([]), // Array of related term IDs
  metadata: jsonb("metadata").default({}), // Additional metadata for the term
  createdBy: varchar("created_by").references(() => users.id),
  isOfficial: boolean("is_official").default(false), // Whether this is an official term vs user-contributed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-curated wildcard lists
export const codexUserLists = pgTable("codex_user_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => codexCategories.id), // Optional category association
  isPublic: boolean("is_public").default(false),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Terms in user lists (many-to-many relationship)
export const codexUserTerms = pgTable("codex_user_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userListId: varchar("user_list_id").notNull().references(() => codexUserLists.id, { onDelete: 'cascade' }),
  termId: varchar("term_id").references(() => codexTerms.id), // Can be null for custom terms
  customTerm: varchar("custom_term"), // User's custom term if not from official list
  customDescription: text("custom_description"),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Example images for terms (for future implementation)
export const codexTermImages = pgTable("codex_term_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  termId: varchar("term_id").notNull().references(() => codexTerms.id),
  imageUrl: varchar("image_url").notNull(),
  caption: text("caption"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User contributions for new terms
export const codexContributions = pgTable("codex_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  term: varchar("term").notNull(),
  categoryId: varchar("category_id").notNull().references(() => codexCategories.id),
  description: text("description"),
  examples: text("examples"),
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  approvedTermId: varchar("approved_term_id").references(() => codexTerms.id), // If approved, links to created term
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// User's assembled strings (both presets and wildcards)
export const codexAssembledStrings = pgTable("codex_assembled_strings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  type: varchar("type", { enum: ["preset", "wildcard"] }).notNull().default("preset"), // Distinguish between presets and wildcards
  content: text("content").notNull(), // Changed from stringContent to match database
  metadata: jsonb("metadata").default({}), // Stores termsUsed and other metadata
  isPublic: boolean("is_public").default(false), // For future sharing functionality
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  notifications: many(notifications, { relationName: "recipient" }),
  triggeredNotifications: many(notifications, { relationName: "trigger" }),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id], relationName: "recipient" }),
  relatedUser: one(users, { fields: [notifications.relatedUserId], references: [users.id], relationName: "trigger" }),
  relatedPrompt: one(prompts, { fields: [notifications.relatedPromptId], references: [prompts.id] }),
  relatedList: one(codexUserLists, { fields: [notifications.relatedListId], references: [codexUserLists.id] }),
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

export const insertPromptStyleRuleTemplateSchema = createInsertSchema(promptStyleRuleTemplates).omit({
  id: true,
  createdAt: true,
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

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Codex insert schemas
export const insertCodexCategorySchema = createInsertSchema(codexCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCodexTermSchema = createInsertSchema(codexTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCodexUserListSchema = createInsertSchema(codexUserLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCodexUserTermSchema = createInsertSchema(codexUserTerms).omit({
  id: true,
  createdAt: true,
});

export const insertCodexTermImageSchema = createInsertSchema(codexTermImages).omit({
  id: true,
  createdAt: true,
});

export const insertCodexContributionSchema = createInsertSchema(codexContributions).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  approvedTermId: true,
});

export const insertCodexAssembledStringSchema = createInsertSchema(codexAssembledStrings).omit({
  id: true,
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
export type InsertPromptStyleRuleTemplate = z.infer<typeof insertPromptStyleRuleTemplateSchema>;
export type PromptStyleRuleTemplate = typeof promptStyleRuleTemplates.$inferSelect;
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
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Codex types
export type InsertCodexCategory = z.infer<typeof insertCodexCategorySchema>;
export type CodexCategory = typeof codexCategories.$inferSelect;
export type InsertCodexTerm = z.infer<typeof insertCodexTermSchema>;
export type CodexTerm = typeof codexTerms.$inferSelect;
export type InsertCodexUserList = z.infer<typeof insertCodexUserListSchema>;
export type CodexUserList = typeof codexUserLists.$inferSelect;
export type InsertCodexUserTerm = z.infer<typeof insertCodexUserTermSchema>;
export type CodexUserTerm = typeof codexUserTerms.$inferSelect;
export type InsertCodexTermImage = z.infer<typeof insertCodexTermImageSchema>;
export type CodexTermImage = typeof codexTermImages.$inferSelect;
export type InsertCodexContribution = z.infer<typeof insertCodexContributionSchema>;
export type CodexContribution = typeof codexContributions.$inferSelect;
export type InsertCodexAssembledString = z.infer<typeof insertCodexAssembledStringSchema>;
export type CodexAssembledString = typeof codexAssembledStrings.$inferSelect;

// Bulk operation types
export type BulkEditPrompt = z.infer<typeof bulkEditPromptSchema>;
export type BulkOperation = z.infer<typeof bulkOperationSchema>;
export type BulkOperationResult = z.infer<typeof bulkOperationResultSchema>;
export type BulkOperationType = BulkOperation["operation"];

// User role types
export type UserRole = "user" | "community_admin" | "super_admin" | "developer";
export type CommunityRole = "member" | "admin";
export type CollectionType = "user" | "community" | "global";
