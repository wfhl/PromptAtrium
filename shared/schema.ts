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
  role: varchar("role", { enum: ["user", "moderator", "admin"] }).default("user"),
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

// Collections table
export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Main prompts table
export const prompts = pgTable("prompts", {
  id: char("id", { length: 10 }).primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category"),
  promptContent: text("prompt_content").notNull(),
  negativePrompt: text("negative_prompt"),
  promptType: varchar("prompt_type"),
  promptStyle: varchar("prompt_style"),
  tags: text("tags").array(),
  tagsNormalized: text("tags_normalized").array(),
  isPublic: boolean("is_public").default(true),
  isFeatured: boolean("is_featured").default(false),
  status: varchar("status", { enum: ["draft", "published", "archived"] }).default("draft"),
  exampleImagesUrl: text("example_images_url").array(),
  notes: text("notes"),
  author: varchar("author"),
  sourceUrl: varchar("source_url"),
  version: integer("version").default(1),
  forkOf: char("fork_of", { length: 10 }).references(() => prompts.id),
  usageCount: integer("usage_count").default(0),
  likes: integer("likes").default(0),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }).default("0.00"),
  intendedGenerator: varchar("intended_generator"),
  recommendedModels: text("recommended_models").array(),
  technicalParams: jsonb("technical_params"),
  variables: jsonb("variables"),
  projectId: varchar("project_id").references(() => projects.id),
  collectionId: varchar("collection_id").references(() => collections.id),
  relatedPrompts: text("related_prompts").array(),
  license: varchar("license"),
  lastUsedAt: timestamp("last_used_at"),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prompt favorites table
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  prompts: many(prompts),
  projects: many(projects),
  collections: many(collections),
  favorites: many(promptFavorites),
  ratings: many(promptRatings),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  user: one(users, { fields: [prompts.userId], references: [users.id] }),
  project: one(projects, { fields: [prompts.projectId], references: [projects.id] }),
  collection: one(collections, { fields: [prompts.collectionId], references: [collections.id] }),
  parentPrompt: one(prompts, { fields: [prompts.forkOf], references: [prompts.id] }),
  favorites: many(promptFavorites),
  ratings: many(promptRatings),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  prompts: many(prompts),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, { fields: [collections.userId], references: [users.id] }),
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

export const insertPromptRatingSchema = createInsertSchema(promptRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertPromptRating = z.infer<typeof insertPromptRatingSchema>;
export type PromptRating = typeof promptRatings.$inferSelect;
export type PromptFavorite = typeof promptFavorites.$inferSelect;
