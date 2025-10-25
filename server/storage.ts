import {
  users,
  prompts,
  projects,
  collections,
  categories,
  promptTypes,
  promptStyles,
  promptStyleRuleTemplates,
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
  notifications,
  prompt_components,
  aesthetics,
  promptHistory,
  promptImageContributions,
  userCredits,
  creditTransactions,
  dailyRewards,
  sellerProfiles,
  marketplaceListings,
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
  type PromptStyleRuleTemplate,
  type InsertPromptStyleRuleTemplate,
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
  type Notification,
  type InsertNotification,
  type PromptHistory,
  type InsertPromptHistory,
  type UserRole,
  type CommunityRole,
  type UserCredits,
  type InsertUserCredits,
  type CreditTransaction,
  type InsertCreditTransaction,
  type DailyReward,
  type InsertDailyReward,
  codexCategories,
  codexTerms,
  codexUserLists,
  codexUserTerms,
  codexTermImages,
  codexContributions,
  codexAssembledStrings,
  type CodexCategory,
  type InsertCodexCategory,
  type CodexTerm,
  type InsertCodexTerm,
  type CodexUserList,
  type InsertCodexUserList,
  type CodexUserTerm,
  type InsertCodexUserTerm,
  type CodexTermImage,
  type InsertCodexTermImage,
  type CodexContribution,
  type InsertCodexContribution,
  type CodexAssembledString,
  type InsertCodexAssembledString,
  type PromptImageContribution,
  type InsertPromptImageContribution,
  characterPresets,
  type CharacterPreset,
  type InsertCharacterPreset,
  type SellerProfile,
  type InsertSellerProfile,
  type MarketplaceListing,
  type InsertMarketplaceListing,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike, inArray, isNull, gte } from "drizzle-orm";
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
    recommendedModels?: string[];
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
  contributeImagesToPrompt(promptId: string, imageUrls: string[], contributorId: string): Promise<Prompt>;
  
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
  cleanupDuplicateLikes(): Promise<{ duplicatesRemoved: number; promptsFixed: number }>;
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

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  markNotificationRead(notificationId: string, userId: string): Promise<Notification>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  deleteNotification(id: string): Promise<void>;

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
  
  getPromptStyleRuleTemplates(options?: { userId?: string; category?: string; isDefault?: boolean }): Promise<PromptStyleRuleTemplate[]>;
  getPromptStyleRuleTemplate(id: string): Promise<PromptStyleRuleTemplate | undefined>;
  getPromptStyleRuleTemplateByName(name: string): Promise<PromptStyleRuleTemplate | undefined>;
  createPromptStyleRuleTemplate(promptStyleRuleTemplate: InsertPromptStyleRuleTemplate): Promise<PromptStyleRuleTemplate>;
  updatePromptStyleRuleTemplate(id: string, promptStyleRuleTemplate: Partial<InsertPromptStyleRuleTemplate>): Promise<PromptStyleRuleTemplate>;
  deletePromptStyleRuleTemplate(id: string): Promise<void>;

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

  // Prompt history operations
  savePromptToHistory(history: InsertPromptHistory): Promise<PromptHistory>;
  getPromptHistory(userId: string, options?: { limit?: number; offset?: number }): Promise<PromptHistory[]>;
  getRecentPromptHistory(userId: string, limit?: number): Promise<PromptHistory[]>;
  deletePromptHistory(id: string, userId: string): Promise<void>;
  clearPromptHistory(userId: string): Promise<void>;
  markPromptAsSaved(historyId: string, userId: string): Promise<void>;

  // Wordsmith Codex operations - Using prompt_components and aesthetics tables
  getWordsmithCategories(): Promise<{ id: string; name: string; termCount: number; anatomyGroup?: string; subcategories?: string[] }[]>;
  getPromptComponents(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    userId?: string; // To check user's NSFW preference
  }): Promise<any[]>;
  getAesthetics(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;
  getWordsmithTerms(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    excludeAesthetics?: boolean;
    userId?: string; // To check user's NSFW preference
  }): Promise<any[]>;

  // Codex Assembled String operations (keep for string assembly feature)
  getCodexAssembledStrings(userId: string, type?: "preset" | "wildcard"): Promise<CodexAssembledString[]>;
  getCodexAssembledString(id: string): Promise<CodexAssembledString | undefined>;
  createCodexAssembledString(assembledString: InsertCodexAssembledString): Promise<CodexAssembledString>;
  updateCodexAssembledString(id: string, updates: Partial<InsertCodexAssembledString>): Promise<CodexAssembledString>;
  deleteCodexAssembledString(id: string): Promise<void>;

  // Character preset operations
  getCharacterPresets(options?: { userId?: string; isGlobal?: boolean }): Promise<CharacterPreset[]>;
  getCharacterPreset(id: string): Promise<CharacterPreset | undefined>;
  createCharacterPreset(preset: InsertCharacterPreset): Promise<CharacterPreset>;
  updateCharacterPreset(id: string, preset: Partial<InsertCharacterPreset>): Promise<CharacterPreset>;
  deleteCharacterPreset(id: string, userId: string): Promise<void>;
  toggleCharacterPresetFavorite(id: string, userId: string): Promise<CharacterPreset>;

  // Credit system operations
  getUserCredits(userId: string): Promise<UserCredits>;
  getCreditBalance(userId: string): Promise<number>;
  addCredits(userId: string, amount: number, source: string, description?: string, referenceId?: string, referenceType?: string): Promise<CreditTransaction>;
  spendCredits(userId: string, amount: number, source: string, description?: string, referenceId?: string, referenceType?: string): Promise<CreditTransaction>;
  getCreditTransactionHistory(userId: string, options?: { limit?: number; offset?: number }): Promise<CreditTransaction[]>;
  getDailyReward(userId: string): Promise<DailyReward | undefined>;
  claimDailyReward(userId: string): Promise<{ reward: number; streak: number; streakBonus?: number }>;
  checkFirstPromptBonus(userId: string): Promise<boolean>;
  checkProfileCompletionBonus(userId: string): Promise<boolean>;
  initializeUserCredits(userId: string): Promise<UserCredits>;
  
  // Marketplace operations - Seller profiles
  getSellerProfile(userId: string): Promise<SellerProfile | undefined>;
  createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile>;
  updateSellerProfile(userId: string, profile: Partial<InsertSellerProfile>): Promise<SellerProfile>;
  completeSellerOnboarding(userId: string, data: {
    businessType: 'individual' | 'business';
    taxInfo: {
      taxId?: string;
      vatNumber?: string;
      businessName?: string;
      businessAddress?: string;
    };
    payoutMethod: 'stripe' | 'manual';
  }): Promise<SellerProfile>;
  
  // Marketplace operations - Listings
  createListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing>;
  updateListing(id: string, listing: Partial<InsertMarketplaceListing>, userId: string): Promise<MarketplaceListing>;
  getListingById(id: string): Promise<MarketplaceListing | undefined>;
  getListingWithDetails(id: string): Promise<any>;
  getListingsByUser(userId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<MarketplaceListing[]>;
  getActiveListings(options?: { category?: string; search?: string; limit?: number; offset?: number }): Promise<MarketplaceListing[]>;
  getMarketplaceListings(options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPriceCents?: number;
    maxPriceCents?: number;
    minCredits?: number;
    maxCredits?: number;
    sortBy?: 'newest' | 'price_low_high' | 'price_high_low' | 'most_popular';
    acceptsMoney?: boolean;
    acceptsCredits?: boolean;
  }): Promise<{ listings: any[]; total: number }>;
  getFeaturedListings(limit?: number): Promise<any[]>;
  getMarketplaceCategories(): Promise<{ category: string; count: number }[]>;
  getSimilarListings(listingId: string, limit?: number): Promise<any[]>;
  getListingPreview(promptId: string, previewPercentage: number): Promise<string>;
  deleteListing(id: string, userId: string): Promise<void>;
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
      conditions.push(sql`${prompts.tags} && ARRAY[${sql.raw(options.tags.map(t => `'${t.replace(/'/g, "''")}'`).join(','))}]::text[]`);
    }
    
    // Add filtering for new array fields
    if (options.categories && options.categories.length > 0) {
      // Check both the array field and the singular field for backward compatibility
      conditions.push(
        or(
          // Check if the categories array contains any of the requested categories
          sql`${prompts.categories} && ARRAY[${sql.raw(options.categories.map(c => `'${c.replace(/'/g, "''")}'`).join(','))}]::text[]`,
          // Also check the singular category field for backward compatibility
          inArray(prompts.category, options.categories)
        )
      );
    }
    
    if (options.promptTypes && options.promptTypes.length > 0) {
      // Check both the array field and the singular field for backward compatibility
      conditions.push(
        or(
          // Check if the promptTypes array contains any of the requested types
          sql`${prompts.promptTypes} && ARRAY[${sql.raw(options.promptTypes.map(t => `'${t.replace(/'/g, "''")}'`).join(','))}]::text[]`,
          // Also check the singular promptType field for backward compatibility
          inArray(prompts.promptType, options.promptTypes)
        )
      );
    }
    
    if (options.promptStyles && options.promptStyles.length > 0) {
      // Check both the array field and the singular field for backward compatibility
      conditions.push(
        or(
          // Check if the promptStyles array contains any of the requested styles
          sql`${prompts.promptStyles} && ARRAY[${sql.raw(options.promptStyles.map(s => `'${s.replace(/'/g, "''")}'`).join(','))}]::text[]`,
          // Also check the singular promptStyle field for backward compatibility
          inArray(prompts.promptStyle, options.promptStyles)
        )
      );
    }
    
    if (options.intendedGenerators && options.intendedGenerators.length > 0) {
      // Check both the array field and the singular field for backward compatibility
      conditions.push(
        or(
          // Check if the intendedGenerators array contains any of the requested generators
          sql`${prompts.intendedGenerators} && ARRAY[${sql.raw(options.intendedGenerators.map(g => `'${g.replace(/'/g, "''")}'`).join(','))}]::text[]`,
          // Also check the singular intendedGenerator field for backward compatibility
          inArray(prompts.intendedGenerator, options.intendedGenerators)
        )
      );
    }
    
    if (options.collectionIds && options.collectionIds.length > 0) {
      conditions.push(sql`${prompts.collectionIds} && ARRAY[${sql.raw(options.collectionIds.map(id => `'${id.replace(/'/g, "''")}'`).join(','))}]::text[]`);
    }
    
    if (options.recommendedModels && options.recommendedModels.length > 0) {
      conditions.push(sql`${prompts.recommendedModels} && ARRAY[${sql.raw(options.recommendedModels.map(m => `'${m.replace(/'/g, "''")}'`).join(','))}]::text[]`);
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

    const newPrompt = await this.createPrompt(forkedPrompt);
    
    // Create notification when someone forks a prompt (if the original has an owner)
    if (originalPrompt.userId && originalPrompt.userId !== userId) {
      const [forker] = await db.select().from(users).where(eq(users.id, userId));
      if (forker) {
        await this.createNotification({
          userId: originalPrompt.userId,
          type: "fork",
          message: `${forker.username || forker.firstName || 'Someone'} forked your prompt "${originalPrompt.name}"`,
          relatedUserId: userId,
          relatedPromptId: newPrompt.id,
          relatedListId: null,
          isRead: false,
          metadata: { 
            originalPromptId: originalPrompt.id,
            originalPromptName: originalPrompt.name,
            forkedPromptId: newPrompt.id
          }
        });
      }
    }

    return newPrompt;
  }

  async contributeImagesToPrompt(promptId: string, imageUrls: string[], contributorId: string): Promise<Prompt> {
    // Get the prompt to check if it exists and is public
    const [prompt] = await db.select().from(prompts).where(eq(prompts.id, promptId));
    if (!prompt) {
      throw new Error("Prompt not found");
    }
    if (!prompt.isPublic) {
      throw new Error("Cannot contribute images to private prompts");
    }
    // Don't allow users to contribute to their own prompts through this endpoint
    if (prompt.userId === contributorId) {
      throw new Error("Use the edit prompt endpoint to add images to your own prompts");
    }

    // Get contributor details
    const [contributor] = await db.select().from(users).where(eq(users.id, contributorId));
    if (!contributor) {
      throw new Error("Contributor not found");
    }

    // Merge the new images with existing ones
    const existingImages = prompt.exampleImagesUrl || [];
    const updatedImages = [...existingImages, ...imageUrls];
    
    // Limit total images per prompt to prevent abuse
    const maxImages = 30;
    if (updatedImages.length > maxImages) {
      throw new Error(`Prompt cannot have more than ${maxImages} example images`);
    }

    // Store each contribution in the contributions table
    const contributionPromises = imageUrls.map(imageUrl => 
      db.insert(promptImageContributions).values({
        promptId: promptId,
        imageUrl: imageUrl,
        contributorId: contributorId,
        isApproved: true, // Auto-approve for now
      })
    );
    await Promise.all(contributionPromises);

    // Update the prompt with new images
    const [updatedPrompt] = await db
      .update(prompts)
      .set({ 
        exampleImagesUrl: updatedImages,
        updatedAt: new Date() 
      })
      .where(eq(prompts.id, promptId))
      .returning();

    // Create a notification for the prompt owner
    if (prompt.userId) {
      const contributorUsername = contributor.username || contributor.email || 'Someone';
      // Use the createNotification method which properly generates the ID
      await this.createNotification({
        userId: prompt.userId,
        type: 'image_contribution',
        message: `${contributorUsername} added ${imageUrls.length} example image${imageUrls.length > 1 ? 's' : ''} to your prompt "${prompt.name}"`,
        relatedUserId: contributorId,
        relatedPromptId: promptId,
        relatedListId: null,
        relatedImageId: imageUrls[0], // Use the first image URL as reference
        isRead: false,
        metadata: {
          imageCount: imageUrls.length,
          imageUrls: imageUrls,
          contributorUsername: contributorUsername,
          promptName: prompt.name
        }
      });
    }

    // Log the contribution as an activity
    await db.insert(activities).values({
      userId: contributorId,
      actionType: "shared_prompt",
      targetId: promptId,
      targetType: "prompt",
      metadata: { 
        action: "contributed_images",
        imageCount: imageUrls.length 
      },
    });

    return updatedPrompt;
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
    // Input validation
    if (!userId || !promptId) {
      throw new Error("User ID and Prompt ID are required");
    }

    // Use a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // First, verify the prompt exists
      const [promptExists] = await tx
        .select({ id: prompts.id })
        .from(prompts)
        .where(eq(prompts.id, promptId));
      
      if (!promptExists) {
        throw new Error("Prompt not found");
      }

      // Check for existing like
      const existingLikes = await tx
        .select()
        .from(promptLikes)
        .where(and(eq(promptLikes.userId, userId), eq(promptLikes.promptId, promptId)));

      let isLiked: boolean;

      if (existingLikes.length > 0) {
        // Unlike: Remove ALL duplicate likes (in case there are any)
        await tx.delete(promptLikes)
          .where(and(eq(promptLikes.userId, userId), eq(promptLikes.promptId, promptId)));
        
        isLiked = false;
      } else {
        // Like: Add a new like (the unique constraint will prevent duplicates)
        try {
          await tx.insert(promptLikes).values({ 
            userId, 
            promptId,
            createdAt: new Date()
          });
          isLiked = true;
        } catch (error: any) {
          // If we get a unique constraint violation, the like already exists
          // This can happen in a race condition - treat it as already liked
          if (error.code === '23505' || error.constraint === 'prompt_likes_user_id_prompt_id_key') { 
            // PostgreSQL unique violation
            console.log(`Like already exists for user ${userId} on prompt ${promptId} - removing it instead`);
            // Try to remove the like since it exists
            await tx.delete(promptLikes)
              .where(and(eq(promptLikes.userId, userId), eq(promptLikes.promptId, promptId)));
            isLiked = false;
          } else {
            throw error;
          }
        }
      }
      
      // Always recalculate the actual count from source of truth
      const [actualCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(promptLikes)
        .where(eq(promptLikes.promptId, promptId));
      
      // Update the prompt with the correct count (single source of truth)
      await tx.update(prompts)
        .set({ 
          likes: actualCount.count || 0,
          updatedAt: new Date()
        })
        .where(eq(prompts.id, promptId));
      
      // Create notification when someone likes a prompt (not when unliking)
      if (isLiked) {
        const [prompt] = await tx.select().from(prompts).where(eq(prompts.id, promptId));
        if (prompt && prompt.userId && prompt.userId !== userId) {
          const [liker] = await tx.select().from(users).where(eq(users.id, userId));
          if (liker) {
            await this.createNotification({
              userId: prompt.userId,
              type: "like",
              message: `${liker.username || liker.firstName || 'Someone'} liked your prompt "${prompt.name}"`,
              relatedUserId: userId,
              relatedPromptId: promptId,
              relatedListId: null,
              isRead: false,
              metadata: { promptName: prompt.name }
            });
          }
        }
      }
      
      return isLiked;
    }).catch((error: any) => {
      console.error("Error toggling like - Full error:", error);
      
      // Provide more specific error messages
      if (error.message === "Prompt not found") {
        throw error;
      }
      
      if (error.code === '40001' || error.code === '40P01') {
        // Serialization failure - suggest retry
        throw new Error("Operation failed due to concurrent update. Please try again.");
      }
      
      if (error.code === '23505' || error.constraint?.includes('unique')) {
        // Unique constraint violation
        throw new Error("Like operation conflict. Please refresh and try again.");
      }
      
      // Log the actual error for debugging
      console.error("Unexpected error in toggleLike:", {
        code: error.code,
        message: error.message,
        constraint: error.constraint,
        detail: error.detail
      });
      
      // Generic error for unexpected issues
      throw new Error(`Failed to toggle like: ${error.message || 'Unknown error'}`);
    });
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
  
  // Cleanup function to remove duplicate likes and fix counts
  async cleanupDuplicateLikes(): Promise<{ duplicatesRemoved: number; promptsFixed: number }> {
    return await db.transaction(async (tx) => {
      // Find all unique user-prompt combinations that have duplicates
      const duplicates = await tx.execute(sql`
        SELECT user_id, prompt_id, COUNT(*) as count
        FROM prompt_likes
        GROUP BY user_id, prompt_id
        HAVING COUNT(*) > 1
      `);
      
      let duplicatesRemoved = 0;
      const promptsToFix = new Set<string>();
      
      // Remove duplicates, keeping only one like per user-prompt combination
      for (const dup of duplicates.rows as any[]) {
        // Get all likes for this combination
        const likes = await tx
          .select()
          .from(promptLikes)
          .where(and(
            eq(promptLikes.userId, dup.user_id),
            eq(promptLikes.promptId, dup.prompt_id)
          ));
        
        // Keep the first like, delete the rest
        if (likes.length > 1) {
          const toDelete = likes.slice(1);
          for (const like of toDelete) {
            await tx.delete(promptLikes).where(eq(promptLikes.id, like.id));
            duplicatesRemoved++;
          }
          promptsToFix.add(dup.prompt_id);
        }
      }
      
      // Fix the like counts for all affected prompts
      for (const promptId of promptsToFix) {
        const [actualCount] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(promptLikes)
          .where(eq(promptLikes.promptId, promptId));
        
        await tx.update(prompts)
          .set({ likes: actualCount.count })
          .where(eq(prompts.id, promptId));
      }
      
      // Also fix any prompts with incorrect like counts (even without duplicates)
      const allPrompts = await tx.select({ id: prompts.id }).from(prompts);
      let additionalFixed = 0;
      
      for (const prompt of allPrompts) {
        const [actualCount] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(promptLikes)
          .where(eq(promptLikes.promptId, prompt.id));
        
        const [currentPrompt] = await tx
          .select({ likes: prompts.likes })
          .from(prompts)
          .where(eq(prompts.id, prompt.id));
        
        if (currentPrompt.likes !== actualCount.count) {
          await tx.update(prompts)
            .set({ likes: actualCount.count })
            .where(eq(prompts.id, prompt.id));
          additionalFixed++;
        }
      }
      
      return { 
        duplicatesRemoved, 
        promptsFixed: promptsToFix.size + additionalFixed 
      };
    });
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
    
    // Create notification when someone follows a user
    const [follower] = await db.select().from(users).where(eq(users.id, followerId));
    if (follower) {
      await this.createNotification({
        userId: followingId,
        type: "follow",
        message: `${follower.username || follower.firstName || 'Someone'} started following you`,
        relatedUserId: followerId,
        relatedPromptId: null,
        relatedListId: null,
        isRead: false,
        metadata: { followerUsername: follower.username }
      });
    }
    
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
      user: r.creator
    } as Prompt & { user: User }));
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
                    name: prompt.name || 'Untitled Prompt',
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
                    name: prompt.name || 'Untitled Prompt',
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

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    // Use a transaction to prevent race conditions when checking for duplicates
    return await db.transaction(async (tx) => {
      // Check for duplicate notifications within the last 5 seconds
      // This prevents double-clicks and race conditions from creating duplicate notifications
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      
      const recentDuplicate = await tx
        .select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, notification.userId),
          eq(notifications.type, notification.type),
          eq(notifications.message, notification.message),
          notification.relatedPromptId ? eq(notifications.relatedPromptId, notification.relatedPromptId) : isNull(notifications.relatedPromptId),
          notification.relatedUserId ? eq(notifications.relatedUserId, notification.relatedUserId) : isNull(notifications.relatedUserId),
          gte(notifications.createdAt, fiveSecondsAgo)
        ))
        .limit(1);
      
      // If we found a recent duplicate, return it instead of creating a new one
      if (recentDuplicate.length > 0) {
        console.log(`Skipping duplicate notification: ${notification.type} for user ${notification.userId}`);
        return recentDuplicate[0];
      }
      
      // Generate a short ID similar to prompt IDs (10 chars hex)
      const id = randomBytes(5).toString('hex');
      const [newNotification] = await tx
        .insert(notifications)
        .values({ ...notification, id })
        .returning();
      
      return newNotification;
    });
  }

  async getNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const results = await db
      .select({
        notification: notifications,
        relatedUser: users,
        relatedPrompt: prompts,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.relatedUserId, users.id))
      .leftJoin(prompts, eq(notifications.relatedPromptId, prompts.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    return results.map(r => ({
      ...r.notification,
      relatedUser: r.relatedUser,
      relatedPrompt: r.relatedPrompt,
    }) as any);
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    
    return result[0];
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    
    return updated;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return Number(result[0]?.count || 0);
  }

  async deleteNotification(id: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, id));
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
  
  async getPromptStyleRuleTemplates(options: { userId?: string; category?: string; isDefault?: boolean } = {}): Promise<PromptStyleRuleTemplate[]> {
    let query = db.select().from(promptStyleRuleTemplates).$dynamic();
    
    const conditions = [];
    
    if (options.userId) {
      conditions.push(eq(promptStyleRuleTemplates.userId, options.userId));
    }
    
    if (options.category) {
      conditions.push(eq(promptStyleRuleTemplates.category, options.category));
    }
    
    if (options.isDefault !== undefined) {
      conditions.push(eq(promptStyleRuleTemplates.isDefault, options.isDefault));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(promptStyleRuleTemplates.name);
  }
  
  async getPromptStyleRuleTemplate(id: string): Promise<PromptStyleRuleTemplate | undefined> {
    const [promptStyleRuleTemplate] = await db.select().from(promptStyleRuleTemplates).where(eq(promptStyleRuleTemplates.id, id));
    return promptStyleRuleTemplate;
  }
  
  async getPromptStyleRuleTemplateByName(name: string): Promise<PromptStyleRuleTemplate | undefined> {
    const [promptStyleRuleTemplate] = await db.select().from(promptStyleRuleTemplates).where(eq(promptStyleRuleTemplates.name, name));
    return promptStyleRuleTemplate;
  }
  
  async createPromptStyleRuleTemplate(promptStyleRuleTemplate: InsertPromptStyleRuleTemplate): Promise<PromptStyleRuleTemplate> {
    const [newPromptStyleRuleTemplate] = await db.insert(promptStyleRuleTemplates).values(promptStyleRuleTemplate).returning();
    return newPromptStyleRuleTemplate;
  }
  
  async updatePromptStyleRuleTemplate(id: string, promptStyleRuleTemplate: Partial<InsertPromptStyleRuleTemplate>): Promise<PromptStyleRuleTemplate> {
    const [updatedPromptStyleRuleTemplate] = await db
      .update(promptStyleRuleTemplates)
      .set(promptStyleRuleTemplate)
      .where(eq(promptStyleRuleTemplates.id, id))
      .returning();
    return updatedPromptStyleRuleTemplate;
  }
  
  async deletePromptStyleRuleTemplate(id: string): Promise<void> {
    await db.delete(promptStyleRuleTemplates).where(eq(promptStyleRuleTemplates.id, id));
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

  // Prompt history operations
  async savePromptToHistory(history: InsertPromptHistory): Promise<PromptHistory> {
    const [saved] = await db.insert(promptHistory).values(history).returning();
    return saved;
  }

  async getPromptHistory(userId: string, options?: { limit?: number; offset?: number }): Promise<PromptHistory[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    
    return await db
      .select()
      .from(promptHistory)
      .where(eq(promptHistory.userId, userId))
      .orderBy(sql`${promptHistory.createdAt} DESC`)
      .limit(limit)
      .offset(offset);
  }

  async getRecentPromptHistory(userId: string, limit: number = 10): Promise<PromptHistory[]> {
    return await db
      .select()
      .from(promptHistory)
      .where(eq(promptHistory.userId, userId))
      .orderBy(sql`${promptHistory.createdAt} DESC`)
      .limit(limit);
  }

  async deletePromptHistory(id: string, userId: string): Promise<void> {
    await db
      .delete(promptHistory)
      .where(and(
        eq(promptHistory.id, id),
        eq(promptHistory.userId, userId)
      ));
  }

  async clearPromptHistory(userId: string): Promise<void> {
    await db
      .delete(promptHistory)
      .where(eq(promptHistory.userId, userId));
  }

  async markPromptAsSaved(historyId: string, userId: string): Promise<void> {
    await db
      .update(promptHistory)
      .set({ isSaved: true })
      .where(and(
        eq(promptHistory.id, historyId),
        eq(promptHistory.userId, userId)
      ));
  }

  // Wordsmith Codex operations - Using prompt_components and aesthetics tables
  async getWordsmithCategories(): Promise<{ id: string; name: string; termCount: number; anatomyGroup?: string; subcategories?: string[] }[]> {
    // Use optimized query that includes anatomy_group from the database
    const promptComponentCounts = await db
      .select({
        category: prompt_components.category,
        anatomy_group: prompt_components.anatomy_group,
        count: sql<string>`COUNT(*)::int`
      })
      .from(prompt_components)
      .where(sql`${prompt_components.category} IS NOT NULL`)
      .groupBy(prompt_components.category, prompt_components.anatomy_group);

    // Count all aesthetics once (they all go under "aesthetics" category now)
    const [aestheticsCount] = await db
      .select({ count: sql<string>`COUNT(*)::int` })
      .from(aesthetics);
    
    // Get unique aesthetic categories/subcategories
    const aestheticsCategoriesResult = await db
      .selectDistinct({ categories: aesthetics.categories })
      .from(aesthetics)
      .where(sql`${aesthetics.categories} IS NOT NULL`);
    
    // Extract unique subcategories from aesthetics
    const aestheticSubcategories = new Set<string>();
    for (const row of aestheticsCategoriesResult) {
      if (row.categories) {
        // Split by comma and clean up
        const cats = row.categories.split(',').map(c => c.trim()).filter(c => c);
        cats.forEach(cat => aestheticSubcategories.add(cat));
      }
    }
    
    // Build category list
    const categories: { id: string; name: string; termCount: number; anatomyGroup?: string; subcategories?: string[] }[] = [];
    
    // Add Aesthetics as a special category with subcategories
    categories.push({
      id: 'aesthetics',
      name: 'Aesthetics',
      termCount: Number(aestheticsCount?.count || 0),
      subcategories: Array.from(aestheticSubcategories).sort()
    });
    
    // Add prompt component categories with anatomy groups from the database
    for (const row of promptComponentCounts) {
      if (row.category) {
        const categoryId = row.category.toLowerCase().replace(/\s+/g, '-');
        
        categories.push({
          id: categoryId,
          name: row.category,
          termCount: Number(row.count),
          anatomyGroup: row.anatomy_group || undefined  // Use the database value directly
        });
      }
    }
    
    // Sort alphabetically, but keep Aesthetics first
    return categories.sort((a, b) => {
      if (a.id === 'aesthetics') return -1;
      if (b.id === 'aesthetics') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  async getPromptComponents(options: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    userId?: string;
  } = {}): Promise<any[]> {
    const conditions: any[] = [];
    
    // Check user's NSFW preference
    if (options.userId) {
      const user = await this.getUser(options.userId);
      // If user has show_nsfw set to false, filter out NSFW content
      if (user && user.showNsfw === false) {
        conditions.push(or(eq(prompt_components.is_nsfw, false), isNull(prompt_components.is_nsfw)));
      }
    } else {
      // If no user is provided, default to hiding NSFW content
      conditions.push(or(eq(prompt_components.is_nsfw, false), isNull(prompt_components.is_nsfw)));
    }
    
    if (options.category) {
      // Compare normalized values: convert both the database category and the input to the same format
      // This handles categories with existing hyphens (e.g., "Sci-Fi Concepts")
      conditions.push(
        sql`LOWER(REPLACE(${prompt_components.category}, ' ', '-')) = ${options.category.toLowerCase()}`
      );
    }
    if (options.search) {
      conditions.push(
        or(
          ilike(prompt_components.value, `%${options.search}%`),
          ilike(prompt_components.description, `%${options.search}%`)
        )
      );
    }
    
    const query = db.select().from(prompt_components);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.offset) {
      query.offset(options.offset);
    }
    
    const results = await query;
    
    // Transform to match expected format
    return results.map(item => ({
      id: item.id,
      term: item.value,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      isNsfw: item.is_nsfw,
      type: 'prompt_component'
    }));
  }

  async getAesthetics(options: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const conditions: any[] = [];
    
    if (options.category) {
      conditions.push(ilike(aesthetics.categories, `%${options.category}%`));
    }
    if (options.search) {
      conditions.push(
        or(
          ilike(aesthetics.name, `%${options.search}%`),
          ilike(aesthetics.description, `%${options.search}%`),
          ilike(aesthetics.tags, `%${options.search}%`)
        )
      );
    }
    
    const query = db.select().from(aesthetics);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.offset) {
      query.offset(options.offset);
    }
    
    const results = await query;
    
    // Transform to match expected format
    return results.map(item => ({
      id: item.id,
      term: item.name,
      description: item.description,
      category: 'Aesthetics',
      subcategory: item.era,
      tags: item.tags,
      type: 'aesthetic'
    }));
  }

  async getWordsmithTerms(options: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    excludeAesthetics?: boolean;
    userId?: string;
  } = {}): Promise<any[]> {
    const limit = options.limit || 10000; // Return up to 10000 results by default (essentially unlimited)
    const offset = options.offset || 0;
    
    // If aesthetics category is selected, only return aesthetics
    if (options.category === 'aesthetics') {
      return await this.getAesthetics({ 
        ...options, 
        category: undefined, // Don't filter by category for aesthetics 
        limit, 
        offset 
      });
    }
    
    // Handle aesthetic subcategories (aesthetics:<subcategory>)
    if (options.category?.startsWith('aesthetics:')) {
      const subcategory = options.category.replace('aesthetics:', '');
      return await this.getAesthetics({ 
        ...options, 
        category: subcategory, // Pass the subcategory to filter by
        limit, 
        offset 
      });
    }
    
    // If a specific category is selected, only return prompt components from that category
    if (options.category) {
      return await this.getPromptComponents({ ...options, limit, offset, userId: options.userId });
    }
    
    // If no category selected and excludeAesthetics is true, only return prompt components
    if (options.excludeAesthetics) {
      return await this.getPromptComponents({ ...options, limit, offset, userId: options.userId });
    }
    
    // If no category selected and excludeAesthetics is false/undefined, get both prompt components and aesthetics
    const [promptComponents, aestheticsData] = await Promise.all([
      this.getPromptComponents({ ...options, limit: limit / 2, offset: offset / 2, userId: options.userId }),
      this.getAesthetics({ ...options, limit: limit / 2, offset: offset / 2 })
    ]);
    
    // Combine and return
    return [...promptComponents, ...aestheticsData];
  }


  // Codex Assembled String operations
  async getCodexAssembledStrings(userId: string, type?: "preset" | "wildcard"): Promise<CodexAssembledString[]> {
    const conditions = [eq(codexAssembledStrings.userId, userId)];
    if (type) {
      conditions.push(eq(codexAssembledStrings.type, type));
    }
    
    return await db
      .select()
      .from(codexAssembledStrings)
      .where(and(...conditions))
      .orderBy(desc(codexAssembledStrings.createdAt));
  }

  async getCodexAssembledString(id: string): Promise<CodexAssembledString | undefined> {
    const [assembledString] = await db.select().from(codexAssembledStrings).where(eq(codexAssembledStrings.id, id));
    return assembledString;
  }

  async createCodexAssembledString(assembledString: InsertCodexAssembledString): Promise<CodexAssembledString> {
    // Ensure we have the correct column names
    const dataToInsert: any = {
      ...assembledString,
      content: assembledString.content || (assembledString as any).stringContent, // Handle both property names
      metadata: assembledString.metadata || { termsUsed: (assembledString as any).termsUsed || [] }
    };
    // Remove the old property names if they exist
    delete dataToInsert.stringContent;
    delete dataToInsert.termsUsed;
    
    const [newAssembledString] = await db.insert(codexAssembledStrings).values(dataToInsert).returning();
    return newAssembledString;
  }

  async updateCodexAssembledString(id: string, updates: Partial<InsertCodexAssembledString>): Promise<CodexAssembledString> {
    const [updatedAssembledString] = await db
      .update(codexAssembledStrings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(codexAssembledStrings.id, id))
      .returning();
    return updatedAssembledString;
  }

  async deleteCodexAssembledString(id: string): Promise<void> {
    await db.delete(codexAssembledStrings).where(eq(codexAssembledStrings.id, id));
  }

  // Character preset operations
  async getCharacterPresets(options: { userId?: string; isGlobal?: boolean } = {}): Promise<CharacterPreset[]> {
    const conditions = [];
    
    if (options.userId) {
      // Get user's own presets and global presets
      conditions.push(
        or(
          eq(characterPresets.userId, options.userId),
          eq(characterPresets.isGlobal, true)
        )
      );
    } else if (options.isGlobal !== undefined) {
      conditions.push(eq(characterPresets.isGlobal, options.isGlobal));
    }
    
    const query = conditions.length > 0
      ? db.select().from(characterPresets).where(and(...conditions))
      : db.select().from(characterPresets);
    
    return await query.orderBy(
      desc(characterPresets.isFavorite),
      characterPresets.name
    );
  }

  async getCharacterPreset(id: string): Promise<CharacterPreset | undefined> {
    const [preset] = await db
      .select()
      .from(characterPresets)
      .where(eq(characterPresets.id, id));
    return preset;
  }

  async createCharacterPreset(preset: InsertCharacterPreset): Promise<CharacterPreset> {
    const [newPreset] = await db
      .insert(characterPresets)
      .values(preset)
      .returning();
    return newPreset;
  }

  async updateCharacterPreset(id: string, preset: Partial<InsertCharacterPreset>): Promise<CharacterPreset> {
    const [updatedPreset] = await db
      .update(characterPresets)
      .set({
        ...preset,
        updatedAt: new Date()
      })
      .where(eq(characterPresets.id, id))
      .returning();
    
    if (!updatedPreset) {
      throw new Error("Character preset not found");
    }
    
    return updatedPreset;
  }

  async deleteCharacterPreset(id: string, userId: string): Promise<void> {
    // Only allow users to delete their own presets
    await db
      .delete(characterPresets)
      .where(
        and(
          eq(characterPresets.id, id),
          eq(characterPresets.userId, userId)
        )
      );
  }

  async toggleCharacterPresetFavorite(id: string, userId: string): Promise<CharacterPreset> {
    // First get the preset to check ownership
    const preset = await this.getCharacterPreset(id);
    
    if (!preset) {
      throw new Error("Character preset not found");
    }
    
    // Only allow toggling favorites on user's own presets or global ones
    if (preset.userId !== userId && !preset.isGlobal) {
      throw new Error("Unauthorized to toggle favorite on this preset");
    }
    
    const [updatedPreset] = await db
      .update(characterPresets)
      .set({
        isFavorite: !preset.isFavorite,
        updatedAt: new Date()
      })
      .where(eq(characterPresets.id, id))
      .returning();
    
    return updatedPreset;
  }

  // Credit System Operations
  async initializeUserCredits(userId: string): Promise<UserCredits> {
    const [existingCredits] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
    
    if (existingCredits) {
      return existingCredits;
    }
    
    const [newCredits] = await db.insert(userCredits)
      .values({
        userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        lastActivity: new Date(),
      })
      .returning();
    
    return newCredits;
  }

  async getUserCredits(userId: string): Promise<UserCredits> {
    const [credits] = await db.select().from(userCredits).where(eq(userCredits.userId, userId));
    
    if (!credits) {
      // Initialize credits for user if not found
      return await this.initializeUserCredits(userId);
    }
    
    return credits;
  }

  async getCreditBalance(userId: string): Promise<number> {
    const credits = await this.getUserCredits(userId);
    return credits.balance;
  }

  async addCredits(
    userId: string,
    amount: number,
    source: string,
    description?: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<CreditTransaction> {
    return await db.transaction(async (tx) => {
      // Get current balance
      const [currentCredits] = await tx.select().from(userCredits).where(eq(userCredits.userId, userId));
      
      let balanceBefore = 0;
      if (!currentCredits) {
        // Initialize credits if not exists
        await tx.insert(userCredits).values({
          userId,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
        });
      } else {
        balanceBefore = currentCredits.balance;
      }
      
      const balanceAfter = balanceBefore + amount;
      
      // Update user credits
      await tx.update(userCredits)
        .set({
          balance: balanceAfter,
          lifetimeEarned: sql`${userCredits.lifetimeEarned} + ${amount}`,
          lastActivity: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));
      
      // Create transaction record
      const [transaction] = await tx.insert(creditTransactions)
        .values({
          userId,
          type: amount > 0 ? "earn" : "adjustment",
          amount,
          balanceBefore,
          balanceAfter,
          source: source as any,
          referenceId,
          referenceType,
          description,
        })
        .returning();
      
      return transaction;
    });
  }

  async spendCredits(
    userId: string,
    amount: number,
    source: string,
    description?: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<CreditTransaction> {
    return await db.transaction(async (tx) => {
      // Get current balance
      const [currentCredits] = await tx.select().from(userCredits).where(eq(userCredits.userId, userId));
      
      if (!currentCredits || currentCredits.balance < amount) {
        throw new Error("Insufficient credits");
      }
      
      const balanceBefore = currentCredits.balance;
      const balanceAfter = balanceBefore - amount;
      
      // Update user credits
      await tx.update(userCredits)
        .set({
          balance: balanceAfter,
          lifetimeSpent: sql`${userCredits.lifetimeSpent} + ${amount}`,
          lastActivity: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));
      
      // Create transaction record
      const [transaction] = await tx.insert(creditTransactions)
        .values({
          userId,
          type: "spend",
          amount: -amount, // Store as negative for spending
          balanceBefore,
          balanceAfter,
          source: source as any,
          referenceId,
          referenceType,
          description,
        })
        .returning();
      
      return transaction;
    });
  }

  async getCreditTransactionHistory(userId: string, options?: { limit?: number; offset?: number }): Promise<CreditTransaction[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    return await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDailyReward(userId: string): Promise<DailyReward | undefined> {
    const [reward] = await db.select()
      .from(dailyRewards)
      .where(eq(dailyRewards.userId, userId));
    
    return reward;
  }

  async claimDailyReward(userId: string): Promise<{ reward: number; streak: number; streakBonus?: number }> {
    return await db.transaction(async (tx) => {
      const [existingReward] = await tx.select()
        .from(dailyRewards)
        .where(eq(dailyRewards.userId, userId));
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let currentStreak = 1;
      let baseReward = 10;
      let streakBonus = 0;
      
      if (existingReward) {
        const lastClaim = new Date(existingReward.lastClaimDate);
        const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
        const daysSinceLastClaim = Math.floor((today.getTime() - lastClaimDay.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if already claimed today
        if (daysSinceLastClaim === 0) {
          throw new Error("Daily reward already claimed");
        }
        
        // Continue streak if claimed yesterday
        if (daysSinceLastClaim === 1) {
          currentStreak = existingReward.currentStreak + 1;
        } else {
          currentStreak = 1; // Reset streak
        }
        
        // Update existing reward
        const longestStreak = Math.max(currentStreak, existingReward.longestStreak);
        
        await tx.update(dailyRewards)
          .set({
            lastClaimDate: now,
            currentStreak,
            longestStreak,
            totalDaysClaimed: existingReward.totalDaysClaimed + 1,
            updatedAt: now,
          })
          .where(eq(dailyRewards.userId, userId));
      } else {
        // Create new reward entry
        await tx.insert(dailyRewards)
          .values({
            userId,
            lastClaimDate: now,
            currentStreak: 1,
            longestStreak: 1,
            totalDaysClaimed: 1,
          });
      }
      
      // Calculate streak bonuses
      if (currentStreak >= 30) {
        streakBonus = 500;
      } else if (currentStreak >= 7) {
        streakBonus = 100;
      }
      
      const totalReward = baseReward + streakBonus;
      
      // Add credits with the daily reward
      await this.addCredits(
        userId,
        totalReward,
        "daily_login",
        `Daily login reward (Day ${currentStreak} streak)`,
        undefined,
        undefined
      );
      
      return {
        reward: totalReward,
        streak: currentStreak,
        streakBonus: streakBonus > 0 ? streakBonus : undefined,
      };
    });
  }

  async checkFirstPromptBonus(userId: string): Promise<boolean> {
    // Check if user has already received first prompt bonus
    const [existingBonus] = await db.select()
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.source, "first_prompt")
      ));
    
    if (existingBonus) {
      return false; // Already received bonus
    }
    
    // Check if user has any public prompts
    const [firstPublicPrompt] = await db.select()
      .from(prompts)
      .where(and(
        eq(prompts.userId, userId),
        eq(prompts.isPublic, true)
      ))
      .limit(1);
    
    if (!firstPublicPrompt) {
      return false; // No public prompts yet
    }
    
    // Award first prompt bonus
    await this.addCredits(
      userId,
      500,
      "first_prompt",
      "First public prompt bonus",
      firstPublicPrompt.id,
      "prompt"
    );
    
    return true;
  }

  async checkProfileCompletionBonus(userId: string): Promise<boolean> {
    // Check if user has already received profile completion bonus
    const [existingBonus] = await db.select()
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.source, "profile_completion")
      ));
    
    if (existingBonus) {
      return false; // Already received bonus
    }
    
    // Check if profile is complete
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }
    
    // Profile is considered complete if they have username, bio, and at least one social handle
    const isComplete = !!(
      user.username &&
      user.bio &&
      (user.twitterHandle || user.githubHandle || user.linkedinHandle || 
       user.instagramHandle || user.deviantartHandle || user.blueskyHandle ||
       user.tiktokHandle || user.redditHandle || user.patreonHandle ||
       (user.customSocials && Array.isArray(user.customSocials) && user.customSocials.length > 0))
    );
    
    if (!isComplete) {
      return false;
    }
    
    // Award profile completion bonus
    await this.addCredits(
      userId,
      100,
      "profile_completion",
      "Profile completion bonus"
    );
    
    return true;
  }
  
  // Marketplace operations - Seller profiles
  async getSellerProfile(userId: string): Promise<SellerProfile | undefined> {
    const [profile] = await db.select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId));
    return profile;
  }

  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const [newProfile] = await db.insert(sellerProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateSellerProfile(userId: string, profile: Partial<InsertSellerProfile>): Promise<SellerProfile> {
    const [updatedProfile] = await db.update(sellerProfiles)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(sellerProfiles.userId, userId))
      .returning();
    
    if (!updatedProfile) {
      throw new Error("Seller profile not found");
    }
    
    return updatedProfile;
  }

  async completeSellerOnboarding(userId: string, data: {
    businessType: 'individual' | 'business';
    taxInfo: {
      taxId?: string;
      vatNumber?: string;
      businessName?: string;
      businessAddress?: string;
    };
    payoutMethod: 'stripe' | 'manual';
  }): Promise<SellerProfile> {
    // Validate that all required fields are present
    if (!data.businessType || !data.payoutMethod) {
      throw new Error("Business type and payout method are required");
    }

    // Validate that at least one tax info field is provided
    if (!data.taxInfo || (!data.taxInfo.taxId && !data.taxInfo.vatNumber && 
        !data.taxInfo.businessName && !data.taxInfo.businessAddress)) {
      throw new Error("At least one tax information field is required");
    }

    // Update the seller profile with validated data and mark as completed
    const [updatedProfile] = await db.update(sellerProfiles)
      .set({
        businessType: data.businessType,
        taxInfo: data.taxInfo,
        payoutMethod: data.payoutMethod,
        onboardingStatus: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(sellerProfiles.userId, userId))
      .returning();
    
    if (!updatedProfile) {
      throw new Error("Seller profile not found");
    }
    
    return updatedProfile;
  }

  // Marketplace operations - Listings
  async createListing(listing: InsertMarketplaceListing): Promise<MarketplaceListing> {
    return await db.transaction(async (tx) => {
      // Validate that the user owns the prompt
      const [prompt] = await tx.select()
        .from(prompts)
        .where(eq(prompts.id, listing.promptId));
      
      if (!prompt) {
        throw new Error("Prompt not found");
      }
      
      if (prompt.userId !== listing.sellerId) {
        throw new Error("You can only list your own prompts");
      }
      
      // Check if listing already exists for this prompt
      const [existingListing] = await tx.select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.promptId, listing.promptId));
      
      if (existingListing) {
        throw new Error("This prompt is already listed");
      }
      
      // Validate pricing
      if (!listing.acceptsMoney && !listing.acceptsCredits) {
        throw new Error("Listing must accept either money or credits");
      }
      
      if (listing.acceptsMoney && (!listing.priceCents || listing.priceCents < 100)) {
        throw new Error("Minimum price is $1.00");
      }
      
      if (listing.acceptsCredits && (!listing.creditPrice || listing.creditPrice < 100)) {
        throw new Error("Minimum credit price is 100 credits");
      }
      
      // Create the listing
      const [newListing] = await tx.insert(marketplaceListings)
        .values(listing)
        .returning();
      
      return newListing;
    });
  }

  async updateListing(id: string, listing: Partial<InsertMarketplaceListing>, userId: string): Promise<MarketplaceListing> {
    return await db.transaction(async (tx) => {
      // Verify ownership
      const [existingListing] = await tx.select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.id, id));
      
      if (!existingListing) {
        throw new Error("Listing not found");
      }
      
      if (existingListing.sellerId !== userId) {
        throw new Error("You can only update your own listings");
      }
      
      // Validate pricing if being updated
      if (listing.acceptsMoney !== undefined || listing.acceptsCredits !== undefined) {
        const acceptsMoney = listing.acceptsMoney ?? existingListing.acceptsMoney;
        const acceptsCredits = listing.acceptsCredits ?? existingListing.acceptsCredits;
        
        if (!acceptsMoney && !acceptsCredits) {
          throw new Error("Listing must accept either money or credits");
        }
      }
      
      if (listing.priceCents !== undefined && listing.priceCents < 100) {
        throw new Error("Minimum price is $1.00");
      }
      
      if (listing.creditPrice !== undefined && listing.creditPrice < 100) {
        throw new Error("Minimum credit price is 100 credits");
      }
      
      // Update the listing
      const [updatedListing] = await tx.update(marketplaceListings)
        .set({
          ...listing,
          updatedAt: new Date(),
        })
        .where(eq(marketplaceListings.id, id))
        .returning();
      
      return updatedListing;
    });
  }

  async getListingById(id: string): Promise<MarketplaceListing | undefined> {
    const [listing] = await db.select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, id));
    return listing;
  }

  async getListingsByUser(userId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<MarketplaceListing[]> {
    let query = db.select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.sellerId, userId));
    
    if (options?.status) {
      query = query.where(and(
        eq(marketplaceListings.sellerId, userId),
        eq(marketplaceListings.status, options.status as any)
      ));
    }
    
    query = query.orderBy(desc(marketplaceListings.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    const listings = await query;
    return listings;
  }

  async getActiveListings(options?: { category?: string; search?: string; limit?: number; offset?: number }): Promise<MarketplaceListing[]> {
    const conditions = [eq(marketplaceListings.status, "active")];
    
    if (options?.category) {
      conditions.push(eq(marketplaceListings.category, options.category));
    }
    
    if (options?.search) {
      conditions.push(
        or(
          ilike(marketplaceListings.title, `%${options.search}%`),
          ilike(marketplaceListings.description, `%${options.search}%`)
        ) || sql`true`
      );
    }
    
    let query = db.select()
      .from(marketplaceListings)
      .where(and(...conditions))
      .orderBy(desc(marketplaceListings.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    const listings = await query;
    return listings;
  }

  async deleteListing(id: string, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Verify ownership
      const [existingListing] = await tx.select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.id, id));
      
      if (!existingListing) {
        throw new Error("Listing not found");
      }
      
      if (existingListing.sellerId !== userId) {
        throw new Error("You can only delete your own listings");
      }
      
      // Soft delete by setting status to paused
      await tx.update(marketplaceListings)
        .set({
          status: "paused",
          updatedAt: new Date(),
        })
        .where(eq(marketplaceListings.id, id));
    });
  }

  // Enhanced marketplace discovery methods
  async getMarketplaceListings(options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPriceCents?: number;
    maxPriceCents?: number;
    minCredits?: number;
    maxCredits?: number;
    sortBy?: 'newest' | 'price_low_high' | 'price_high_low' | 'most_popular';
    acceptsMoney?: boolean;
    acceptsCredits?: boolean;
  }): Promise<{ listings: any[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;
    
    const conditions = [eq(marketplaceListings.status, "active")];
    
    // Add category filter
    if (options?.category) {
      conditions.push(eq(marketplaceListings.category, options.category));
    }
    
    // Add search filter
    if (options?.search) {
      conditions.push(
        or(
          ilike(marketplaceListings.title, `%${options.search}%`),
          ilike(marketplaceListings.description, `%${options.search}%`)
        ) || sql`true`
      );
    }
    
    // Add price filters for USD
    if (options?.minPriceCents !== undefined) {
      conditions.push(gte(marketplaceListings.priceCents, options.minPriceCents));
    }
    if (options?.maxPriceCents !== undefined) {
      conditions.push(sql`${marketplaceListings.priceCents} <= ${options.maxPriceCents}`);
    }
    
    // Add price filters for credits
    if (options?.minCredits !== undefined) {
      conditions.push(gte(marketplaceListings.creditPrice, options.minCredits));
    }
    if (options?.maxCredits !== undefined) {
      conditions.push(sql`${marketplaceListings.creditPrice} <= ${options.maxCredits}`);
    }
    
    // Add payment type filters
    if (options?.acceptsMoney !== undefined) {
      conditions.push(eq(marketplaceListings.acceptsMoney, options.acceptsMoney));
    }
    if (options?.acceptsCredits !== undefined) {
      conditions.push(eq(marketplaceListings.acceptsCredits, options.acceptsCredits));
    }
    
    // Build query
    let query = db.select({
      listing: marketplaceListings,
      prompt: prompts,
      seller: users,
    })
      .from(marketplaceListings)
      .innerJoin(prompts, eq(marketplaceListings.promptId, prompts.id))
      .innerJoin(users, eq(marketplaceListings.sellerId, users.id))
      .where(and(...conditions));
    
    // Apply sorting
    if (options?.sortBy === 'price_low_high') {
      query = query.orderBy(sql`COALESCE(${marketplaceListings.priceCents}, ${marketplaceListings.creditPrice} * 100, 999999)`);
    } else if (options?.sortBy === 'price_high_low') {
      query = query.orderBy(desc(sql`COALESCE(${marketplaceListings.priceCents}, ${marketplaceListings.creditPrice} * 100, 0)`));
    } else if (options?.sortBy === 'most_popular') {
      query = query.orderBy(desc(marketplaceListings.salesCount));
    } else {
      // Default to newest
      query = query.orderBy(desc(marketplaceListings.createdAt));
    }
    
    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(marketplaceListings)
      .where(and(...conditions));
    const total = Number(countResult[0]?.count || 0);
    
    // Apply pagination
    const results = await query.limit(limit).offset(offset);
    
    // Format results
    const listings = results.map(row => ({
      ...row.listing,
      prompt: {
        id: row.prompt.id,
        name: row.prompt.name,
        description: row.prompt.description,
        tags: row.prompt.tags,
        imageUrl: row.prompt.imageUrl,
      },
      seller: {
        id: row.seller.id,
        username: row.seller.username,
        firstName: row.seller.firstName,
        lastName: row.seller.lastName,
        profileImageUrl: row.seller.profileImageUrl,
      }
    }));
    
    return { listings, total };
  }

  async getFeaturedListings(limit: number = 6): Promise<any[]> {
    const now = new Date();
    
    const results = await db.select({
      listing: marketplaceListings,
      prompt: prompts,
      seller: users,
    })
      .from(marketplaceListings)
      .innerJoin(prompts, eq(marketplaceListings.promptId, prompts.id))
      .innerJoin(users, eq(marketplaceListings.sellerId, users.id))
      .where(
        and(
          eq(marketplaceListings.status, "active"),
          // Featured listings logic - could be based on sales, rating, or admin selection
          // For now, we'll return the most popular active listings
          sql`1=1`
        )
      )
      .orderBy(desc(marketplaceListings.salesCount), desc(marketplaceListings.averageRating))
      .limit(limit);
    
    return results.map(row => ({
      ...row.listing,
      prompt: {
        id: row.prompt.id,
        name: row.prompt.name,
        description: row.prompt.description,
        tags: row.prompt.tags,
        imageUrl: row.prompt.imageUrl,
      },
      seller: {
        id: row.seller.id,
        username: row.seller.username,
        firstName: row.seller.firstName,
        lastName: row.seller.lastName,
        profileImageUrl: row.seller.profileImageUrl,
      }
    }));
  }

  async getMarketplaceCategories(): Promise<{ category: string; count: number }[]> {
    const results = await db.select({
      category: marketplaceListings.category,
      count: sql<number>`count(*)::int`,
    })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.status, "active"))
      .groupBy(marketplaceListings.category)
      .orderBy(desc(sql`count(*)`));
    
    return results.filter(r => r.category).map(r => ({
      category: r.category as string,
      count: r.count
    }));
  }

  async getListingWithDetails(id: string): Promise<any> {
    const results = await db.select({
      listing: marketplaceListings,
      prompt: prompts,
      seller: users,
      sellerProfile: sellerProfiles,
    })
      .from(marketplaceListings)
      .innerJoin(prompts, eq(marketplaceListings.promptId, prompts.id))
      .innerJoin(users, eq(marketplaceListings.sellerId, users.id))
      .leftJoin(sellerProfiles, eq(sellerProfiles.userId, users.id))
      .where(eq(marketplaceListings.id, id));
    
    if (!results[0]) {
      return undefined;
    }
    
    const row = results[0];
    return {
      ...row.listing,
      prompt: row.prompt,
      seller: {
        id: row.seller.id,
        username: row.seller.username,
        firstName: row.seller.firstName,
        lastName: row.seller.lastName,
        profileImageUrl: row.seller.profileImageUrl,
        bio: row.seller.bio,
      },
      sellerProfile: row.sellerProfile,
    };
  }

  async getSimilarListings(listingId: string, limit: number = 4): Promise<any[]> {
    // First get the current listing to find its category
    const currentListing = await this.getListingById(listingId);
    if (!currentListing) {
      return [];
    }
    
    const results = await db.select({
      listing: marketplaceListings,
      prompt: prompts,
      seller: users,
    })
      .from(marketplaceListings)
      .innerJoin(prompts, eq(marketplaceListings.promptId, prompts.id))
      .innerJoin(users, eq(marketplaceListings.sellerId, users.id))
      .where(
        and(
          eq(marketplaceListings.status, "active"),
          eq(marketplaceListings.category, currentListing.category || ""),
          sql`${marketplaceListings.id} != ${listingId}`
        )
      )
      .orderBy(desc(marketplaceListings.salesCount))
      .limit(limit);
    
    return results.map(row => ({
      ...row.listing,
      prompt: {
        id: row.prompt.id,
        name: row.prompt.name,
        description: row.prompt.description,
        tags: row.prompt.tags,
        imageUrl: row.prompt.imageUrl,
      },
      seller: {
        id: row.seller.id,
        username: row.seller.username,
        firstName: row.seller.firstName,
        lastName: row.seller.lastName,
        profileImageUrl: row.seller.profileImageUrl,
      }
    }));
  }

  async getListingPreview(promptId: string, previewPercentage: number): Promise<string> {
    const [prompt] = await db.select()
      .from(prompts)
      .where(eq(prompts.id, promptId));
    
    if (!prompt || !prompt.content) {
      return "";
    }
    
    // Calculate preview length
    const fullContent = prompt.content;
    const previewLength = Math.floor(fullContent.length * (previewPercentage / 100));
    
    // Create preview, trying to end at a natural break
    let preview = fullContent.substring(0, previewLength);
    
    // Try to end at a sentence or word boundary
    const lastPeriod = preview.lastIndexOf('.');
    const lastComma = preview.lastIndexOf(',');
    const lastSpace = preview.lastIndexOf(' ');
    
    if (lastPeriod > previewLength * 0.8) {
      preview = preview.substring(0, lastPeriod + 1);
    } else if (lastComma > previewLength * 0.8) {
      preview = preview.substring(0, lastComma + 1);
    } else if (lastSpace > previewLength * 0.8) {
      preview = preview.substring(0, lastSpace);
    }
    
    return preview;
  }
}

export const storage = new DatabaseStorage();
