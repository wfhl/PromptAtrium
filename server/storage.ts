import {
  users,
  prompts,
  projects,
  collections,
  promptFavorites,
  promptRatings,
  type User,
  type UpsertUser,
  type Prompt,
  type InsertPrompt,
  type Project,
  type InsertProject,
  type Collection,
  type InsertCollection,
  type PromptRating,
  type InsertPromptRating,
  type PromptFavorite,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Prompt operations
  getPrompts(options?: {
    userId?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
    category?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Prompt[]>;
  getPrompt(id: string): Promise<Prompt | undefined>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: string, prompt: Partial<InsertPrompt>): Promise<Prompt>;
  deletePrompt(id: string): Promise<void>;
  forkPrompt(promptId: string, userId: string): Promise<Prompt>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Collection operations
  getCollections(userId: string): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  
  // Community operations
  toggleLike(userId: string, promptId: string): Promise<boolean>;
  toggleFavorite(userId: string, promptId: string): Promise<boolean>;
  ratePrompt(rating: InsertPromptRating): Promise<PromptRating>;
  getUserFavorites(userId: string): Promise<PromptFavorite[]>;
  
  // Stats
  getUserStats(userId: string): Promise<{
    totalPrompts: number;
    totalLikes: number;
    collections: number;
    forksCreated: number;
  }>;
}

function generatePromptId(): string {
  return randomBytes(5).toString('hex');
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Prompt operations
  async getPrompts(options: {
    userId?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
    category?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Prompt[]> {
    let query = db.select().from(prompts);
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(prompts.userId, options.userId));
    }
    
    if (options.isPublic !== undefined) {
      conditions.push(eq(prompts.isPublic, options.isPublic));
    }
    
    if (options.isFeatured) {
      conditions.push(eq(prompts.isFeatured, true));
    }
    
    if (options.category) {
      conditions.push(eq(prompts.category, options.category));
    }
    
    if (options.tags && options.tags.length > 0) {
      conditions.push(sql`${prompts.tags} && ${options.tags}`);
    }
    
    if (options.search) {
      conditions.push(
        or(
          ilike(prompts.name, `%${options.search}%`),
          ilike(prompts.description, `%${options.search}%`),
          ilike(prompts.promptContent, `%${options.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(prompts.updatedAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
    return prompt;
  }

  async createPrompt(prompt: InsertPrompt): Promise<Prompt> {
    const id = generatePromptId();
    const [newPrompt] = await db
      .insert(prompts)
      .values({ ...prompt, id })
      .returning();
    return newPrompt;
  }

  async updatePrompt(id: string, prompt: Partial<InsertPrompt>): Promise<Prompt> {
    const [updatedPrompt] = await db
      .update(prompts)
      .set({ ...prompt, updatedAt: new Date() })
      .where(eq(prompts.id, id))
      .returning();
    return updatedPrompt;
  }

  async deletePrompt(id: string): Promise<void> {
    await db.delete(prompts).where(eq(prompts.id, id));
  }

  async forkPrompt(promptId: string, userId: string): Promise<Prompt> {
    const [originalPrompt] = await db.select().from(prompts).where(eq(prompts.id, promptId));
    if (!originalPrompt) {
      throw new Error("Prompt not found");
    }

    const forkedPrompt: InsertPrompt = {
      name: `${originalPrompt.name} (Fork)`,
      description: originalPrompt.description,
      category: originalPrompt.category,
      promptContent: originalPrompt.promptContent,
      negativePrompt: originalPrompt.negativePrompt,
      promptType: originalPrompt.promptType,
      promptStyle: originalPrompt.promptStyle,
      tags: originalPrompt.tags,
      tagsNormalized: originalPrompt.tagsNormalized,
      isPublic: false,
      isFeatured: false,
      status: "draft",
      exampleImagesUrl: originalPrompt.exampleImagesUrl,
      notes: originalPrompt.notes,
      author: originalPrompt.author,
      sourceUrl: originalPrompt.sourceUrl,
      version: 1,
      forkOf: originalPrompt.id,
      intendedGenerator: originalPrompt.intendedGenerator,
      recommendedModels: originalPrompt.recommendedModels,
      technicalParams: originalPrompt.technicalParams,
      variables: originalPrompt.variables,
      projectId: originalPrompt.projectId,
      collectionId: null,
      relatedPrompts: originalPrompt.relatedPrompts,
      license: originalPrompt.license,
      userId,
    };

    return await this.createPrompt(forkedPrompt);
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.ownerId, userId)).orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Collection operations
  async getCollections(userId: string): Promise<Collection[]> {
    return await db.select().from(collections).where(eq(collections.userId, userId)).orderBy(desc(collections.updatedAt));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [newCollection] = await db.insert(collections).values(collection).returning();
    return newCollection;
  }

  async updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection> {
    const [updatedCollection] = await db
      .update(collections)
      .set({ ...collection, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();
    return updatedCollection;
  }

  async deleteCollection(id: string): Promise<void> {
    await db.delete(collections).where(eq(collections.id, id));
  }

  // Community operations
  async toggleLike(userId: string, promptId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(promptFavorites)
      .where(and(eq(promptFavorites.userId, userId), eq(promptFavorites.promptId, promptId)));

    if (existing) {
      await db.delete(promptFavorites).where(eq(promptFavorites.id, existing.id));
      await db.update(prompts).set({ likes: sql`${prompts.likes} - 1` }).where(eq(prompts.id, promptId));
      return false;
    } else {
      await db.insert(promptFavorites).values({ userId, promptId });
      await db.update(prompts).set({ likes: sql`${prompts.likes} + 1` }).where(eq(prompts.id, promptId));
      return true;
    }
  }

  async toggleFavorite(userId: string, promptId: string): Promise<boolean> {
    return await this.toggleLike(userId, promptId);
  }

  async ratePrompt(rating: InsertPromptRating): Promise<PromptRating> {
    const [existingRating] = await db
      .select()
      .from(promptRatings)
      .where(and(eq(promptRatings.userId, rating.userId), eq(promptRatings.promptId, rating.promptId)));

    if (existingRating) {
      const [updatedRating] = await db
        .update(promptRatings)
        .set({ ...rating, updatedAt: new Date() })
        .where(eq(promptRatings.id, existingRating.id))
        .returning();
      return updatedRating;
    } else {
      const [newRating] = await db.insert(promptRatings).values(rating).returning();
      return newRating;
    }
  }

  async getUserFavorites(userId: string): Promise<PromptFavorite[]> {
    return await db.select().from(promptFavorites).where(eq(promptFavorites.userId, userId));
  }

  // Stats
  async getUserStats(userId: string): Promise<{
    totalPrompts: number;
    totalLikes: number;
    collections: number;
    forksCreated: number;
  }> {
    const [userPrompts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts)
      .where(eq(prompts.userId, userId));

    const [userLikes] = await db
      .select({ sum: sql<number>`sum(${prompts.likes})` })
      .from(prompts)
      .where(eq(prompts.userId, userId));

    const [userCollections] = await db
      .select({ count: sql<number>`count(*)` })
      .from(collections)
      .where(eq(collections.userId, userId));

    const [userForks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts)
      .where(and(eq(prompts.userId, userId), sql`${prompts.forkOf} IS NOT NULL`));

    return {
      totalPrompts: userPrompts?.count || 0,
      totalLikes: userLikes?.sum || 0,
      collections: userCollections?.count || 0,
      forksCreated: userForks?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
