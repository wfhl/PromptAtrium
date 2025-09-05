import {
  users,
  prompts,
  projects,
  collections,
  communities,
  userCommunities,
  communityAdmins,
  communityInvites,
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
  type Community,
  type InsertCommunity,
  type UserCommunity,
  type InsertUserCommunity,
  type CommunityAdmin,
  type InsertCommunityAdmin,
  type CommunityInvite,
  type InsertCommunityInvite,
  type PromptRating,
  type InsertPromptRating,
  type PromptFavorite,
  type UserRole,
  type CommunityRole,
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
  getCollections(options?: { userId?: string; communityId?: string; type?: string }): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, collection: Partial<InsertCollection>): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  
  // Community operations
  getCommunities(): Promise<Community[]>;
  getManagedCommunities(userId: string): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  getCommunityBySlug(slug: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, community: Partial<InsertCommunity>): Promise<Community>;
  deleteCommunity(id: string): Promise<void>;
  
  // Community membership operations
  joinCommunity(userId: string, communityId: string, role?: CommunityRole): Promise<UserCommunity>;
  leaveCommunity(userId: string, communityId: string): Promise<void>;
  getUserCommunities(userId: string): Promise<UserCommunity[]>;
  getCommunityMembers(communityId: string): Promise<UserCommunity[]>;
  updateCommunityMemberRole(userId: string, communityId: string, role: CommunityRole): Promise<UserCommunity>;
  isCommunityMember(userId: string, communityId: string): Promise<boolean>;
  isCommunityAdmin(userId: string, communityId: string): Promise<boolean>;
  
  // User role operations
  updateUserRole(userId: string, role: UserRole): Promise<User>;
  
  // Social operations
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

  // User management operations (for Super Admin)
  getAllUsers(options?: {
    search?: string;
    role?: UserRole;
    communityId?: string;
    limit?: number;
    offset?: number;
  }): Promise<User[]>;
  searchUsers(query: string, limit?: number): Promise<User[]>;

  // Community admin operations
  assignCommunityAdmin(data: InsertCommunityAdmin): Promise<CommunityAdmin>;
  removeCommunityAdmin(userId: string, communityId: string): Promise<void>;
  getCommunityAdmins(communityId: string): Promise<CommunityAdmin[]>;
  getUserCommunityAdminRoles(userId: string): Promise<CommunityAdmin[]>;

  // Invite system operations
  createInvite(invite: InsertCommunityInvite): Promise<CommunityInvite>;
  getInviteByCode(code: string): Promise<CommunityInvite | undefined>;
  useInvite(code: string): Promise<CommunityInvite>;
  getActiveInvites(communityId: string): Promise<CommunityInvite[]>;
  getAllInvites(options?: {
    communityId?: string;
    createdBy?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CommunityInvite[]>;
  deactivateInvite(id: string): Promise<void>;
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
    // Check if user exists before upserting
    const existingUser = await this.getUser(userData.id);
    const isNewUser = !existingUser;

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

    // Auto-join new users to the PromptAtrium General community
    if (isNewUser) {
      try {
        const generalCommunity = await this.getCommunityBySlug("general");
        if (generalCommunity) {
          await this.joinCommunity(user.id, generalCommunity.id, "member");
        }
      } catch (error) {
        console.error("Failed to auto-join user to general community:", error);
        // Don't throw error - user creation should still succeed even if community join fails
      }
    }

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
  async getCollections(options: { userId?: string; communityId?: string; type?: string } = {}): Promise<Collection[]> {
    let query = db.select().from(collections);
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(collections.userId, options.userId));
    }
    
    if (options.communityId) {
      conditions.push(eq(collections.communityId, options.communityId));
    }
    
    if (options.type) {
      conditions.push(eq(collections.type, options.type));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(collections.updatedAt));
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
  async getCommunities(): Promise<Community[]> {
    return await db.select().from(communities).where(eq(communities.isActive, true)).orderBy(desc(communities.createdAt));
  }

  async getManagedCommunities(userId: string): Promise<Community[]> {
    return await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        slug: communities.slug,
        isActive: communities.isActive,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
      })
      .from(communities)
      .innerJoin(communityAdmins, eq(communities.id, communityAdmins.communityId))
      .where(and(eq(communityAdmins.userId, userId), eq(communities.isActive, true)))
      .orderBy(desc(communities.createdAt));
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.slug, slug));
    return community;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db.insert(communities).values(community).returning();
    return newCommunity;
  }

  async updateCommunity(id: string, community: Partial<InsertCommunity>): Promise<Community> {
    const [updatedCommunity] = await db
      .update(communities)
      .set({ ...community, updatedAt: new Date() })
      .where(eq(communities.id, id))
      .returning();
    return updatedCommunity;
  }

  async deleteCommunity(id: string): Promise<void> {
    await db.update(communities).set({ isActive: false }).where(eq(communities.id, id));
  }

  // Community membership operations
  async joinCommunity(userId: string, communityId: string, role: CommunityRole = "member"): Promise<UserCommunity> {
    const [membership] = await db.insert(userCommunities).values({
      userId,
      communityId,
      role,
    }).returning();
    return membership;
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    await db.delete(userCommunities).where(
      and(eq(userCommunities.userId, userId), eq(userCommunities.communityId, communityId))
    );
  }

  async getUserCommunities(userId: string): Promise<UserCommunity[]> {
    return await db.select().from(userCommunities).where(eq(userCommunities.userId, userId));
  }

  async getCommunityMembers(communityId: string): Promise<UserCommunity[]> {
    return await db.select().from(userCommunities).where(eq(userCommunities.communityId, communityId));
  }

  async updateCommunityMemberRole(userId: string, communityId: string, role: CommunityRole): Promise<UserCommunity> {
    const [updatedMembership] = await db
      .update(userCommunities)
      .set({ role })
      .where(and(eq(userCommunities.userId, userId), eq(userCommunities.communityId, communityId)))
      .returning();
    return updatedMembership;
  }

  async isCommunityMember(userId: string, communityId: string): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(userCommunities)
      .where(and(eq(userCommunities.userId, userId), eq(userCommunities.communityId, communityId)));
    return !!membership;
  }

  async isCommunityAdmin(userId: string, communityId: string): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(userCommunities)
      .where(
        and(
          eq(userCommunities.userId, userId),
          eq(userCommunities.communityId, communityId),
          eq(userCommunities.role, "admin")
        )
      );
    return !!membership;
  }

  // User role operations
  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Social operations
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

  // User management operations (for Super Admin)
  async getAllUsers(options: {
    search?: string;
    role?: UserRole;
    communityId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<User[]> {
    let query = db.select().from(users);

    const conditions: any[] = [];
    
    if (options.search) {
      conditions.push(
        or(
          ilike(users.email, `%${options.search}%`),
          ilike(users.firstName, `%${options.search}%`),
          ilike(users.lastName, `%${options.search}%`)
        )
      );
    }

    if (options.role) {
      conditions.push(eq(users.role, options.role));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (options.communityId) {
      // If filtering by community, join with userCommunities
      query = query
        .innerJoin(userCommunities, eq(users.id, userCommunities.userId))
        .where(eq(userCommunities.communityId, options.communityId));
    }

    query = query.orderBy(desc(users.createdAt));

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          ilike(users.email, `%${query}%`),
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`)
        )
      )
      .limit(limit);
  }

  // Community admin operations
  async assignCommunityAdmin(data: InsertCommunityAdmin): Promise<CommunityAdmin> {
    const [admin] = await db
      .insert(communityAdmins)
      .values(data)
      .returning();
    return admin;
  }

  async removeCommunityAdmin(userId: string, communityId: string): Promise<void> {
    await db
      .delete(communityAdmins)
      .where(
        and(
          eq(communityAdmins.userId, userId),
          eq(communityAdmins.communityId, communityId)
        )
      );
  }

  async getCommunityAdmins(communityId: string): Promise<CommunityAdmin[]> {
    return await db
      .select()
      .from(communityAdmins)
      .where(eq(communityAdmins.communityId, communityId));
  }

  async getUserCommunityAdminRoles(userId: string): Promise<CommunityAdmin[]> {
    return await db
      .select()
      .from(communityAdmins)
      .where(eq(communityAdmins.userId, userId));
  }

  // Invite system operations
  async createInvite(invite: InsertCommunityInvite): Promise<CommunityInvite> {
    const [newInvite] = await db
      .insert(communityInvites)
      .values(invite)
      .returning();
    return newInvite;
  }

  async getInviteByCode(code: string): Promise<CommunityInvite | undefined> {
    const [invite] = await db
      .select()
      .from(communityInvites)
      .where(eq(communityInvites.code, code));
    return invite;
  }

  async useInvite(code: string): Promise<CommunityInvite> {
    const [invite] = await db
      .update(communityInvites)
      .set({
        currentUses: sql`current_uses + 1`,
        updatedAt: new Date(),
      })
      .where(eq(communityInvites.code, code))
      .returning();
    return invite;
  }

  async getActiveInvites(communityId: string): Promise<CommunityInvite[]> {
    return await db
      .select()
      .from(communityInvites)
      .where(
        and(
          eq(communityInvites.communityId, communityId),
          eq(communityInvites.isActive, true),
          or(
            sql`expires_at IS NULL`,
            sql`expires_at > NOW()`
          )
        )
      )
      .orderBy(desc(communityInvites.createdAt));
  }

  async getAllInvites(options: {
    communityId?: string;
    createdBy?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<CommunityInvite[]> {
    let query = db.select().from(communityInvites);

    const conditions: any[] = [];
    
    if (options.communityId) {
      conditions.push(eq(communityInvites.communityId, options.communityId));
    }

    if (options.createdBy) {
      conditions.push(eq(communityInvites.createdBy, options.createdBy));
    }

    if (options.isActive !== undefined) {
      conditions.push(eq(communityInvites.isActive, options.isActive));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(communityInvites.createdAt));

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async deactivateInvite(id: string): Promise<void> {
    await db
      .update(communityInvites)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(communityInvites.id, id));
  }
}

export const storage = new DatabaseStorage();
