import {
  users,
  prompts,
  projects,
  collections,
  categories,
  promptTypes,
  promptStyles,
  intendedGenerators,
  recommendedModels,
  communities,
  userCommunities,
  communityAdmins,
  communityInvites,
  promptLikes,
  promptFavorites,
  promptRatings,
  follows,
  activities,
  type User,
  type UpsertUser,
  type Prompt,
  type InsertPrompt,
  type Project,
  type InsertProject,
  type Collection,
  type InsertCollection,
  type Category,
  type InsertCategory,
  type PromptType,
  type InsertPromptType,
  type PromptStyle,
  type InsertPromptStyle,
  type IntendedGenerator,
  type InsertIntendedGenerator,
  type RecommendedModel,
  type InsertRecommendedModel,
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
  type PromptLike,
  type PromptFavorite,
  type Follow,
  type InsertFollow,
  type Activity,
  type InsertActivity,
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
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  
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
    promptIds?: string[];
  }): Promise<Prompt[]>;
  getPrompt(id: string): Promise<Prompt | undefined>;
  getPromptWithUser(id: string): Promise<any>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: string, prompt: Partial<InsertPrompt>): Promise<Prompt>;
  deletePrompt(id: string): Promise<void>;
  getPromptRelatedData(id: string): Promise<{
    likesCount: number;
    favoritesCount: number;
    ratingsCount: number;
  }>;
  forkPrompt(promptId: string, userId: string): Promise<Prompt>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Collection operations
  getCollections(options?: { userId?: string; communityId?: string; type?: string; isPublic?: boolean; search?: string; limit?: number; offset?: number; }): Promise<Collection[]>;
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
  removeAllFavorites(promptId: string): Promise<void>;
  checkIfLiked(userId: string, promptId: string): Promise<boolean>;
  checkIfFavorited(userId: string, promptId: string): Promise<boolean>;
  ratePrompt(rating: InsertPromptRating): Promise<PromptRating>;
  getUserFavorites(userId: string): Promise<PromptFavorite[]>;
  getUserLikes(userId: string): Promise<PromptLike[]>;
  
  // Stats
  getUserStats(userId: string): Promise<{
    totalPrompts: number;
    totalLikes: number;
    collections: number;
    forksCreated: number;
  }>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string, limit?: number, offset?: number): Promise<User[]>;
  getFollowing(userId: string, limit?: number, offset?: number): Promise<User[]>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  getFollowedUsersPrompts(userId: string, limit?: number, offset?: number): Promise<Prompt[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(options?: {
    userId?: string;
    actionType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<any[]>;
  getUserActivities(userId: string, limit?: number, offset?: number): Promise<any[]>;
  getFollowedUsersActivities(userId: string, limit?: number, offset?: number): Promise<Activity[]>;

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

  // Category operations
  getCategories(options?: { userId?: string; type?: string; isActive?: boolean }): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Prompt type operations
  getPromptTypes(options?: { userId?: string; type?: string; isActive?: boolean }): Promise<PromptType[]>;
  getPromptType(id: string): Promise<PromptType | undefined>;
  getPromptTypeByName(name: string): Promise<PromptType | undefined>;
  createPromptType(promptType: InsertPromptType): Promise<PromptType>;
  updatePromptType(id: string, promptType: Partial<InsertPromptType>): Promise<PromptType>;
  deletePromptType(id: string): Promise<void>;

  // Prompt style operations
  getPromptStyles(options?: { userId?: string; type?: string; isActive?: boolean }): Promise<PromptStyle[]>;
  getPromptStyle(id: string): Promise<PromptStyle | undefined>;
  getPromptStyleByName(name: string): Promise<PromptStyle | undefined>;
  createPromptStyle(promptStyle: InsertPromptStyle): Promise<PromptStyle>;
  updatePromptStyle(id: string, promptStyle: Partial<InsertPromptStyle>): Promise<PromptStyle>;
  deletePromptStyle(id: string): Promise<void>;

  // Intended generator operations
  getIntendedGenerators(options?: { userId?: string; type?: string; isActive?: boolean }): Promise<IntendedGenerator[]>;
  getIntendedGenerator(id: string): Promise<IntendedGenerator | undefined>;
  getIntendedGeneratorByName(name: string): Promise<IntendedGenerator | undefined>;
  createIntendedGenerator(generator: InsertIntendedGenerator): Promise<IntendedGenerator>;
  updateIntendedGenerator(id: string, generator: Partial<InsertIntendedGenerator>): Promise<IntendedGenerator>;
  deleteIntendedGenerator(id: string): Promise<void>;

  // Recommended model operations
  getRecommendedModels(options?: { userId?: string; type?: string; isActive?: boolean }): Promise<RecommendedModel[]>;
  getRecommendedModel(id: string): Promise<RecommendedModel | undefined>;
  getRecommendedModelByName(name: string): Promise<RecommendedModel | undefined>;
  createRecommendedModel(model: InsertRecommendedModel): Promise<RecommendedModel>;
  updateRecommendedModel(id: string, model: Partial<InsertRecommendedModel>): Promise<RecommendedModel>;
  deleteRecommendedModel(id: string): Promise<void>;
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
    const existingUser = userData.id ? await this.getUser(userData.id) : null;
    const isNewUser = !existingUser;

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          // Only update fields that should come from auth provider
          // Don't overwrite user-customized fields like firstName and lastName
          email: userData.email,
          profileImageUrl: userData.profileImageUrl,
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Prompt operations
  async getPrompts(options: {
    userId?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
    category?: string;
    status?: string;
    statusNotEqual?: string;
    tags?: string[];
    categories?: string[];
    promptTypes?: string[];
    promptStyles?: string[];
    intendedGenerators?: string[];
    collectionIds?: string[];
    collectionId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    promptIds?: string[];
    showNsfw?: boolean;
  } = {}): Promise<any[]> {
    // Build conditions first
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
    
    if (options.status) {
      conditions.push(eq(prompts.status, options.status as any));
    }
    
    if (options.statusNotEqual) {
      conditions.push(sql`${prompts.status} != ${options.statusNotEqual}`);
    }
    
    if (options.tags && options.tags.length > 0) {
      conditions.push(sql`${prompts.tags} && ${options.tags}`);
    }
    
    // Add filtering for new array fields
    if (options.categories && options.categories.length > 0) {
      conditions.push(sql`${prompts.categories} && ${options.categories}`);
    }
    
    if (options.promptTypes && options.promptTypes.length > 0) {
      conditions.push(sql`${prompts.promptTypes} && ${options.promptTypes}`);
    }
    
    if (options.promptStyles && options.promptStyles.length > 0) {
      conditions.push(sql`${prompts.promptStyles} && ${options.promptStyles}`);
    }
    
    if (options.intendedGenerators && options.intendedGenerators.length > 0) {
      conditions.push(sql`${prompts.intendedGenerators} && ${options.intendedGenerators}`);
    }
    
    if (options.collectionIds && options.collectionIds.length > 0) {
      conditions.push(sql`${prompts.collectionIds} && ${options.collectionIds}`);
    }
    
    // Filter by single collectionId field
    if (options.collectionId) {
      conditions.push(eq(prompts.collectionId, options.collectionId));
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
    
    if (options.promptIds && options.promptIds.length > 0) {
      conditions.push(inArray(prompts.id, options.promptIds));
    }
    
    // Filter NSFW content based on user preference
    if (options.showNsfw === false) {
      conditions.push(eq(prompts.isNsfw, false));
    }

    // Build query step by step to avoid TypeScript issues
    let queryBuilder = db.select({
      id: prompts.id,
      name: prompts.name,
      description: prompts.description,
      category: prompts.category,
      promptType: prompts.promptType,
      promptStyle: prompts.promptStyle,
      categories: prompts.categories,
      promptTypes: prompts.promptTypes,
      promptStyles: prompts.promptStyles,
      tags: prompts.tags,
      tagsNormalized: prompts.tagsNormalized,
      isPublic: prompts.isPublic,
      isFeatured: prompts.isFeatured,
      isNsfw: prompts.isNsfw,
      status: prompts.status,
      exampleImagesUrl: prompts.exampleImagesUrl,
      notes: prompts.notes,
      author: prompts.author,
      sourceUrl: prompts.sourceUrl,
      version: prompts.version,
      forkOf: prompts.forkOf,
      usageCount: prompts.usageCount,
      likes: prompts.likes,
      qualityScore: prompts.qualityScore,
      intendedGenerator: prompts.intendedGenerator,
      intendedGenerators: prompts.intendedGenerators,
      recommendedModels: prompts.recommendedModels,
      technicalParams: prompts.technicalParams,
      variables: prompts.variables,
      projectId: prompts.projectId,
      collectionId: prompts.collectionId,
      collectionIds: prompts.collectionIds,
      relatedPrompts: prompts.relatedPrompts,
      license: prompts.license,
      lastUsedAt: prompts.lastUsedAt,
      userId: prompts.userId,
      createdAt: prompts.createdAt,
      updatedAt: prompts.updatedAt,
      promptContent: prompts.promptContent,
      negativePrompt: prompts.negativePrompt,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(prompts)
    .leftJoin(users, eq(prompts.userId, users.id))
    .$dynamic();
    
    // Apply conditions if any
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }
    
    // Apply ordering
    queryBuilder = queryBuilder.orderBy(desc(prompts.updatedAt));
    
    // Apply limit if specified
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }
    
    // Apply offset if specified
    if (options.offset) {
      queryBuilder = queryBuilder.offset(options.offset);
    }
    
    return await queryBuilder;
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, id));
    return prompt;
  }

  async getPromptWithUser(id: string): Promise<any> {
    const [result] = await db
      .select({
        id: prompts.id,
        name: prompts.name,
        description: prompts.description,
        category: prompts.category,
        promptType: prompts.promptType,
        promptStyle: prompts.promptStyle,
        categories: prompts.categories,
        promptTypes: prompts.promptTypes,
        promptStyles: prompts.promptStyles,
        tags: prompts.tags,
        tagsNormalized: prompts.tagsNormalized,
        isPublic: prompts.isPublic,
        isFeatured: prompts.isFeatured,
        isNsfw: prompts.isNsfw,
        status: prompts.status,
        exampleImagesUrl: prompts.exampleImagesUrl,
        notes: prompts.notes,
        author: prompts.author,
        sourceUrl: prompts.sourceUrl,
        version: prompts.version,
        forkOf: prompts.forkOf,
        usageCount: prompts.usageCount,
        likes: prompts.likes,
        qualityScore: prompts.qualityScore,
        intendedGenerator: prompts.intendedGenerator,
        intendedGenerators: prompts.intendedGenerators,
        recommendedModels: prompts.recommendedModels,
        technicalParams: prompts.technicalParams,
        variables: prompts.variables,
        projectId: prompts.projectId,
        collectionId: prompts.collectionId,
        collectionIds: prompts.collectionIds,
        relatedPrompts: prompts.relatedPrompts,
        license: prompts.license,
        lastUsedAt: prompts.lastUsedAt,
        userId: prompts.userId,
        createdAt: prompts.createdAt,
        updatedAt: prompts.updatedAt,
        promptContent: prompts.promptContent,
        negativePrompt: prompts.negativePrompt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(prompts)
      .leftJoin(users, eq(prompts.userId, users.id))
      .where(eq(prompts.id, id));
    
    return result;
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
    // First delete all related records to avoid foreign key constraint violations
    // Delete all likes for this prompt
    await db.delete(promptLikes).where(eq(promptLikes.promptId, id));
    
    // Delete all favorites for this prompt
    await db.delete(promptFavorites).where(eq(promptFavorites.promptId, id));
    
    // Delete all ratings for this prompt
    await db.delete(promptRatings).where(eq(promptRatings.promptId, id));
    
    // Delete all activities related to this prompt
    await db.delete(activities).where(
      and(
        eq(activities.targetId, id),
        eq(activities.targetType, "prompt")
      )
    );
    
    // Now delete the prompt itself
    await db.delete(prompts).where(eq(prompts.id, id));
  }

  async getPromptRelatedData(id: string): Promise<{
    likesCount: number;
    favoritesCount: number;
    ratingsCount: number;
  }> {
    // Count likes for this prompt
    const likesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(promptLikes)
      .where(eq(promptLikes.promptId, id));
    
    // Count favorites for this prompt
    const favoritesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(promptFavorites)
      .where(eq(promptFavorites.promptId, id));
    
    // Count ratings for this prompt
    const ratingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(promptRatings)
      .where(eq(promptRatings.promptId, id));
    
    return {
      likesCount: Number(likesResult[0]?.count || 0),
      favoritesCount: Number(favoritesResult[0]?.count || 0),
      ratingsCount: Number(ratingsResult[0]?.count || 0),
    };
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
      tags: originalPrompt.tags || [],
      tagsNormalized: originalPrompt.tagsNormalized || [],
      isPublic: false,
      isFeatured: false,
      status: "draft" as const,
      exampleImagesUrl: originalPrompt.exampleImagesUrl || [],
      notes: originalPrompt.notes,
      author: originalPrompt.author,
      sourceUrl: originalPrompt.sourceUrl,
      version: 1,
      forkOf: originalPrompt.id,
      intendedGenerator: originalPrompt.intendedGenerator,
      recommendedModels: originalPrompt.recommendedModels || [],
      technicalParams: originalPrompt.technicalParams as any,
      variables: originalPrompt.variables as any,
      projectId: originalPrompt.projectId,
      collectionId: null,
      relatedPrompts: originalPrompt.relatedPrompts || [],
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
  async getCollections(options: { userId?: string; communityId?: string; type?: string; isPublic?: boolean; search?: string; limit?: number; offset?: number; } = {}): Promise<(Collection & { promptCount?: number })[]> {
    let query = db.select().from(collections).$dynamic();
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(collections.userId, options.userId));
    }
    
    if (options.communityId) {
      conditions.push(eq(collections.communityId, options.communityId));
    }
    
    if (options.type) {
      conditions.push(eq(collections.type, options.type as any));
    }
    
    if (options.isPublic !== undefined) {
      conditions.push(eq(collections.isPublic, options.isPublic));
    }
    
    if (options.search) {
      conditions.push(
        or(
          ilike(collections.name, `%${options.search}%`),
          ilike(collections.description, `%${options.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    let collectionsQuery = query.orderBy(desc(collections.updatedAt));
    
    if (options.limit) {
      collectionsQuery = collectionsQuery.limit(options.limit);
    }
    
    if (options.offset) {
      collectionsQuery = collectionsQuery.offset(options.offset);
    }
    
    const collectionsData = await collectionsQuery;
    
    // Add prompt count for each collection
    const collectionsWithCount = await Promise.all(
      collectionsData.map(async (collection) => {
        const promptCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(prompts)
          .where(eq(prompts.collectionId, collection.id))
          .then(result => result[0]?.count || 0);
        
        return {
          ...collection,
          promptCount
        };
      })
    );
    
    return collectionsWithCount;
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
        imageUrl: communities.imageUrl,
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

  async getCommunityMembers(communityId: string): Promise<any[]> {
    return await db
      .select({
        id: userCommunities.id,
        userId: userCommunities.userId,
        communityId: userCommunities.communityId,
        role: userCommunities.role,
        joinedAt: userCommunities.joinedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(userCommunities)
      .leftJoin(users, eq(userCommunities.userId, users.id))
      .where(eq(userCommunities.communityId, communityId));
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
      .from(promptLikes)
      .where(and(eq(promptLikes.userId, userId), eq(promptLikes.promptId, promptId)));

    if (existing) {
      await db.delete(promptLikes).where(eq(promptLikes.id, existing.id));
      await db.update(prompts).set({ likes: sql`${prompts.likes} - 1` }).where(eq(prompts.id, promptId));
      return false;
    } else {
      await db.insert(promptLikes).values({ userId, promptId });
      await db.update(prompts).set({ likes: sql`${prompts.likes} + 1` }).where(eq(prompts.id, promptId));
      return true;
    }
  }

  async toggleFavorite(userId: string, promptId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(promptFavorites)
      .where(and(eq(promptFavorites.userId, userId), eq(promptFavorites.promptId, promptId)));

    if (existing) {
      await db.delete(promptFavorites).where(eq(promptFavorites.id, existing.id));
      return false;
    } else {
      await db.insert(promptFavorites).values({ userId, promptId });
      return true;
    }
  }

  async removeAllFavorites(promptId: string): Promise<void> {
    // Remove all bookmarks/favorites for this prompt
    await db.delete(promptFavorites).where(eq(promptFavorites.promptId, promptId));
  }

  async checkIfLiked(userId: string, promptId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(promptLikes)
      .where(and(eq(promptLikes.userId, userId), eq(promptLikes.promptId, promptId)));
    return !!existing;
  }

  async checkIfFavorited(userId: string, promptId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(promptFavorites)
      .where(and(eq(promptFavorites.userId, userId), eq(promptFavorites.promptId, promptId)));
    return !!existing;
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

  async getUserLikes(userId: string): Promise<PromptLike[]> {
    return await db.select().from(promptLikes).where(eq(promptLikes.userId, userId));
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

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    // Check if already following
    const existingFollow = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .limit(1);
    
    if (existingFollow.length > 0) {
      return existingFollow[0];
    }

    const [follow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();
    
    // Create activity for follow
    await this.createActivity({
      userId: followerId,
      actionType: "followed_user",
      targetId: followingId,
      targetType: "user",
    });
    
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .limit(1);
    
    return !!follow;
  }

  async getFollowers(userId: string, limit: number = 50, offset: number = 0): Promise<User[]> {
    const followersResult = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(limit)
      .offset(offset);
    
    return followersResult.map(r => r.user);
  }

  async getFollowing(userId: string, limit: number = 50, offset: number = 0): Promise<User[]> {
    const followingResult = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt))
      .limit(limit)
      .offset(offset);
    
    return followingResult.map(r => r.user);
  }

  async getFollowerCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));
    
    return result?.count || 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    return result?.count || 0;
  }

  async getFollowedUsersPrompts(userId: string, limit: number = 50, offset: number = 0): Promise<Prompt[]> {
    // Get the IDs of users that the current user follows
    const followingIds = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    if (followingIds.length === 0) {
      return [];
    }
    
    const followingUserIds = followingIds.map(f => f.followingId);
    
    // Get public prompts from followed users, ordered by creation date
    const followedPrompts = await db
      .select({
        prompt: prompts,
        creator: users,
      })
      .from(prompts)
      .innerJoin(users, eq(prompts.userId, users.id))
      .where(and(
        inArray(prompts.userId, followingUserIds),
        eq(prompts.isPublic, true)
      ))
      .orderBy(desc(prompts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return followedPrompts.map(r => ({
      ...r.prompt,
      creator: r.creator
    } as Prompt & { creator: User }));
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    
    return newActivity;
  }

  async getActivities(options: {
    userId?: string;
    actionType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Activity[]> {
    const conditions: any[] = [];
    
    if (options.userId) {
      conditions.push(eq(activities.userId, options.userId));
    }
    
    if (options.actionType) {
      conditions.push(sql`${activities.actionType} = ${options.actionType}`);
    }
    
    let query = db.select().from(activities).$dynamic();
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(activities.createdAt)) as any;
    
    if (options.limit) {
      query = query.limit(options.limit) as any;
    }
    
    if (options.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getRecentActivities(limit: number = 20): Promise<any[]> {
    const recentActivities = await db
      .select({
        activity: activities,
        user: users,
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
    
    // Fetch related entities for each activity
    const enrichedActivities = await Promise.all(
      recentActivities.map(async (r) => {
        const activity = { ...r.activity, user: r.user } as any;
        
        // Fetch target entity based on targetType
        if (activity.targetId && activity.targetType) {
          try {
            switch (activity.targetType) {
              case 'prompt':
                const prompt = await this.getPrompt(activity.targetId);
                if (prompt) {
                  activity.targetEntity = {
                    id: prompt.id,
                    name: prompt.title || 'Untitled Prompt',
                    isPublic: prompt.isPublic
                  };
                }
                break;
              
              case 'user':
                const targetUser = await this.getUser(activity.targetId);
                if (targetUser) {
                  activity.targetEntity = {
                    id: targetUser.id,
                    username: targetUser.username,
                    firstName: targetUser.firstName,
                    lastName: targetUser.lastName
                  };
                }
                break;
              
              case 'collection':
                const collection = await this.getCollection(activity.targetId);
                if (collection) {
                  activity.targetEntity = {
                    id: collection.id,
                    name: collection.name,
                    isPublic: collection.isPublic
                  };
                }
                break;
              
              case 'community':
                const community = await this.getCommunity(activity.targetId);
                if (community) {
                  activity.targetEntity = {
                    id: community.id,
                    name: community.name,
                    slug: community.slug
                  };
                }
                break;
            }
          } catch (error) {
            console.error(`Failed to fetch ${activity.targetType} ${activity.targetId}:`, error);
            // Entity might be deleted, continue without it
          }
        }
        
        return activity;
      })
    );
    
    return enrichedActivities;
  }

  async getUserActivities(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const userActivities = await db
      .select({
        activity: activities,
        user: users,
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Fetch related entities for each activity
    const enrichedActivities = await Promise.all(
      userActivities.map(async (r) => {
        const activity = { ...r.activity, user: r.user } as any;
        
        // Fetch target entity based on targetType
        if (activity.targetId && activity.targetType) {
          try {
            switch (activity.targetType) {
              case 'prompt':
                const prompt = await this.getPrompt(activity.targetId);
                if (prompt) {
                  activity.targetEntity = {
                    id: prompt.id,
                    name: prompt.title || 'Untitled Prompt',
                    isPublic: prompt.isPublic
                  };
                }
                break;
              
              case 'user':
                const targetUser = await this.getUser(activity.targetId);
                if (targetUser) {
                  activity.targetEntity = {
                    id: targetUser.id,
                    username: targetUser.username,
                    firstName: targetUser.firstName,
                    lastName: targetUser.lastName
                  };
                }
                break;
              
              case 'collection':
                const collection = await this.getCollection(activity.targetId);
                if (collection) {
                  activity.targetEntity = {
                    id: collection.id,
                    name: collection.name,
                    isPublic: collection.isPublic
                  };
                }
                break;
              
              case 'community':
                const community = await this.getCommunity(activity.targetId);
                if (community) {
                  activity.targetEntity = {
                    id: community.id,
                    name: community.name,
                    slug: community.slug
                  };
                }
                break;
            }
          } catch (error) {
            console.error(`Failed to fetch ${activity.targetType} ${activity.targetId}:`, error);
            // Entity might be deleted, continue without it
          }
        }
        
        return activity;
      })
    );
    
    return enrichedActivities;
  }

  async getFollowedUsersActivities(userId: string, limit: number = 50, offset: number = 0): Promise<Activity[]> {
    // Get the IDs of users that the current user follows
    const followingIds = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    if (followingIds.length === 0) {
      return [];
    }
    
    const followingUserIds = followingIds.map(f => f.followingId);
    
    // Get activities from followed users
    const followedActivities = await db
      .select({
        activity: activities,
        user: users,
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .where(inArray(activities.userId, followingUserIds))
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .offset(offset);
    
    return followedActivities.map(r => ({
      ...r.activity,
      user: r.user
    } as Activity & { user: User }));
  }

  // User management operations (for Super Admin)
  async getAllUsers(options: {
    search?: string;
    role?: UserRole;
    communityId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<User[]> {
    // Explicitly select user columns to ensure consistent return type
    let query = db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      username: users.username,
      bio: users.bio,
      birthday: users.birthday,
      website: users.website,
      twitterHandle: users.twitterHandle,
      githubHandle: users.githubHandle,
      linkedinHandle: users.linkedinHandle,
      instagramHandle: users.instagramHandle,
      deviantartHandle: users.deviantartHandle,
      blueskyHandle: users.blueskyHandle,
      tiktokHandle: users.tiktokHandle,
      redditHandle: users.redditHandle,
      patreonHandle: users.patreonHandle,
      customSocials: users.customSocials,
      profileVisibility: users.profileVisibility,
      emailVisibility: users.emailVisibility,
      showStats: users.showStats,
      showBirthday: users.showBirthday,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).$dynamic();

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

    if (options.communityId) {
      // If filtering by community, join with userCommunities but only select user columns
      query = query.innerJoin(userCommunities, eq(users.id, userCommunities.userId));
      conditions.push(eq(userCommunities.communityId, options.communityId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
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
    let query = db.select().from(communityInvites).$dynamic();

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

  // Category operations
  async getCategories(options: { userId?: string; type?: string; isActive?: boolean } = {}): Promise<Category[]> {
    let query = db.select().from(categories).$dynamic();
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(categories.userId, options.userId));
    }
    
    if (options.type) {
      conditions.push(eq(categories.type, options.type as any));
    }
    
    if (options.isActive !== undefined) {
      conditions.push(eq(categories.isActive, options.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Prompt type operations
  async getPromptTypes(options: { userId?: string; type?: string; isActive?: boolean } = {}): Promise<PromptType[]> {
    let query = db.select().from(promptTypes).$dynamic();
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(promptTypes.userId, options.userId));
    }
    
    if (options.type) {
      conditions.push(eq(promptTypes.type, options.type as any));
    }
    
    if (options.isActive !== undefined) {
      conditions.push(eq(promptTypes.isActive, options.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(promptTypes.name);
  }

  async getPromptType(id: string): Promise<PromptType | undefined> {
    const [promptType] = await db.select().from(promptTypes).where(eq(promptTypes.id, id));
    return promptType;
  }

  async getPromptTypeByName(name: string): Promise<PromptType | undefined> {
    const [promptType] = await db.select().from(promptTypes).where(eq(promptTypes.name, name));
    return promptType;
  }

  async createPromptType(promptType: InsertPromptType): Promise<PromptType> {
    const [newPromptType] = await db.insert(promptTypes).values(promptType).returning();
    return newPromptType;
  }

  async updatePromptType(id: string, promptType: Partial<InsertPromptType>): Promise<PromptType> {
    const [updatedPromptType] = await db
      .update(promptTypes)
      .set({ ...promptType, updatedAt: new Date() })
      .where(eq(promptTypes.id, id))
      .returning();
    return updatedPromptType;
  }

  async deletePromptType(id: string): Promise<void> {
    await db.delete(promptTypes).where(eq(promptTypes.id, id));
  }

  // Prompt style operations
  async getPromptStyles(options: { userId?: string; type?: string; isActive?: boolean } = {}): Promise<PromptStyle[]> {
    let query = db.select().from(promptStyles).$dynamic();
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(promptStyles.userId, options.userId));
    }
    
    if (options.type) {
      conditions.push(eq(promptStyles.type, options.type as any));
    }
    
    if (options.isActive !== undefined) {
      conditions.push(eq(promptStyles.isActive, options.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(promptStyles.name);
  }

  async getPromptStyle(id: string): Promise<PromptStyle | undefined> {
    const [promptStyle] = await db.select().from(promptStyles).where(eq(promptStyles.id, id));
    return promptStyle;
  }

  async getPromptStyleByName(name: string): Promise<PromptStyle | undefined> {
    const [promptStyle] = await db.select().from(promptStyles).where(eq(promptStyles.name, name));
    return promptStyle;
  }

  async createPromptStyle(promptStyle: InsertPromptStyle): Promise<PromptStyle> {
    const [newPromptStyle] = await db.insert(promptStyles).values(promptStyle).returning();
    return newPromptStyle;
  }

  async updatePromptStyle(id: string, promptStyle: Partial<InsertPromptStyle>): Promise<PromptStyle> {
    const [updatedPromptStyle] = await db
      .update(promptStyles)
      .set({ ...promptStyle, updatedAt: new Date() })
      .where(eq(promptStyles.id, id))
      .returning();
    return updatedPromptStyle;
  }

  async deletePromptStyle(id: string): Promise<void> {
    await db.delete(promptStyles).where(eq(promptStyles.id, id));
  }

  // Intended generator operations
  async getIntendedGenerators(options: { userId?: string; type?: string; isActive?: boolean } = {}): Promise<IntendedGenerator[]> {
    let query = db.select().from(intendedGenerators).$dynamic();
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(intendedGenerators.userId, options.userId));
    }
    
    if (options.type) {
      conditions.push(eq(intendedGenerators.type, options.type as any));
    }
    
    if (options.isActive !== undefined) {
      conditions.push(eq(intendedGenerators.isActive, options.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(intendedGenerators.name);
  }

  async getIntendedGenerator(id: string): Promise<IntendedGenerator | undefined> {
    const [generator] = await db.select().from(intendedGenerators).where(eq(intendedGenerators.id, id));
    return generator;
  }

  async getIntendedGeneratorByName(name: string): Promise<IntendedGenerator | undefined> {
    const [generator] = await db.select().from(intendedGenerators).where(eq(intendedGenerators.name, name));
    return generator;
  }

  async createIntendedGenerator(generator: InsertIntendedGenerator): Promise<IntendedGenerator> {
    const [newGenerator] = await db.insert(intendedGenerators).values(generator).returning();
    return newGenerator;
  }

  async updateIntendedGenerator(id: string, generator: Partial<InsertIntendedGenerator>): Promise<IntendedGenerator> {
    const [updatedGenerator] = await db
      .update(intendedGenerators)
      .set({ ...generator, updatedAt: new Date() })
      .where(eq(intendedGenerators.id, id))
      .returning();
    return updatedGenerator;
  }

  async deleteIntendedGenerator(id: string): Promise<void> {
    await db.delete(intendedGenerators).where(eq(intendedGenerators.id, id));
  }

  // Recommended model operations
  async getRecommendedModels(options: { userId?: string; type?: string; isActive?: boolean } = {}): Promise<RecommendedModel[]> {
    let query = db.select().from(recommendedModels).$dynamic();
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(recommendedModels.userId, options.userId));
    }
    
    if (options.type) {
      conditions.push(eq(recommendedModels.type, options.type as any));
    }
    
    if (options.isActive !== undefined) {
      conditions.push(eq(recommendedModels.isActive, options.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(recommendedModels.name);
  }

  async getRecommendedModel(id: string): Promise<RecommendedModel | undefined> {
    const [model] = await db.select().from(recommendedModels).where(eq(recommendedModels.id, id));
    return model;
  }

  async getRecommendedModelByName(name: string): Promise<RecommendedModel | undefined> {
    const [model] = await db.select().from(recommendedModels).where(eq(recommendedModels.name, name));
    return model;
  }

  async createRecommendedModel(model: InsertRecommendedModel): Promise<RecommendedModel> {
    const [newModel] = await db.insert(recommendedModels).values(model).returning();
    return newModel;
  }

  async updateRecommendedModel(id: string, model: Partial<InsertRecommendedModel>): Promise<RecommendedModel> {
    const [updatedModel] = await db
      .update(recommendedModels)
      .set({ ...model, updatedAt: new Date() })
      .where(eq(recommendedModels.id, id))
      .returning();
    return updatedModel;
  }

  async deleteRecommendedModel(id: string): Promise<void> {
    await db.delete(recommendedModels).where(eq(recommendedModels.id, id));
  }
}

export const storage = new DatabaseStorage();
