import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPromptSchema, insertProjectSchema, insertCollectionSchema, insertPromptRatingSchema, insertCommunitySchema, insertUserCommunitySchema } from "@shared/schema";
import { requireSuperAdmin, requireCommunityAdmin, requireCommunityAdminRole, requireCommunityMember } from "./rbac";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Prompt routes
  app.get('/api/prompts', async (req, res) => {
    try {
      const {
        userId,
        isPublic,
        isFeatured,
        category,
        tags,
        search,
        limit = "20",
        offset = "0"
      } = req.query;

      const options = {
        userId: userId as string,
        isPublic: isPublic === "true" ? true : isPublic === "false" ? false : undefined,
        isFeatured: isFeatured === "true",
        category: category as string,
        tags: tags ? (tags as string).split(",") : undefined,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const prompts = await storage.getPrompts(options);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.get('/api/prompts/:id', async (req, res) => {
    try {
      const prompt = await storage.getPrompt(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching prompt:", error);
      res.status(500).json({ message: "Failed to fetch prompt" });
    }
  });

  app.post('/api/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const promptData = insertPromptSchema.parse({ ...req.body, userId });
      const prompt = await storage.createPrompt(promptData);
      res.status(201).json(prompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prompt data", errors: error.errors });
      }
      console.error("Error creating prompt:", error);
      res.status(500).json({ message: "Failed to create prompt" });
    }
  });

  app.put('/api/prompts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      if (prompt.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this prompt" });
      }

      const promptData = insertPromptSchema.partial().parse(req.body);
      const updatedPrompt = await storage.updatePrompt(req.params.id, promptData);
      res.json(updatedPrompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prompt data", errors: error.errors });
      }
      console.error("Error updating prompt:", error);
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  app.delete('/api/prompts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      if (prompt.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this prompt" });
      }

      await storage.deletePrompt(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting prompt:", error);
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  app.post('/api/prompts/:id/fork', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const forkedPrompt = await storage.forkPrompt(req.params.id, userId);
      res.status(201).json(forkedPrompt);
    } catch (error) {
      console.error("Error forking prompt:", error);
      res.status(500).json({ message: "Failed to fork prompt" });
    }
  });

  app.post('/api/prompts/bulk-import', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompts } = req.body;

      if (!Array.isArray(prompts) || prompts.length === 0) {
        return res.status(400).json({ message: "Invalid prompts array" });
      }

      const results = {
        total: prompts.length,
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; error: string; data: any }>
      };

      // Process prompts in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < prompts.length; i += batchSize) {
        const batch = prompts.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const rowIndex = i + j + 1;
          const promptData = batch[j];
          
          try {
            // Validate prompt data
            const validatedPrompt = insertPromptSchema.parse({
              ...promptData,
              userId,
              tags: Array.isArray(promptData.tags) ? promptData.tags : [],
              tagsNormalized: Array.isArray(promptData.tags) 
                ? promptData.tags.map((tag: string) => tag.toLowerCase().trim())
                : [],
              status: promptData.status || "draft",
              isPublic: promptData.isPublic ?? false,
              version: 1,
            });

            // Create the prompt
            await storage.createPrompt(validatedPrompt);
            results.success++;
          } catch (error) {
            results.failed++;
            const errorMessage = error instanceof z.ZodError 
              ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
              : error instanceof Error 
                ? error.message 
                : "Unknown error";
            
            results.errors.push({
              row: rowIndex,
              error: errorMessage,
              data: promptData
            });
          }
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Error during bulk import:", error);
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  // Community routes
  app.post('/api/prompts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isLiked = await storage.toggleLike(userId, req.params.id);
      res.json({ liked: isLiked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post('/api/prompts/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isFavorited = await storage.toggleFavorite(userId, req.params.id);
      res.json({ favorited: isFavorited });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  app.post('/api/prompts/:id/rate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ratingData = insertPromptRatingSchema.parse({
        ...req.body,
        userId,
        promptId: req.params.id,
      });
      const rating = await storage.ratePrompt(ratingData);
      res.json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error("Error rating prompt:", error);
      res.status(500).json({ message: "Failed to rate prompt" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({ ...req.body, ownerId: userId });
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Collection routes
  app.get('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { communityId, type } = req.query;
      
      const options: any = {};
      if (!communityId && !type) {
        // Default: get user's personal collections
        options.userId = userId;
      }
      if (communityId) options.communityId = communityId as string;
      if (type) options.type = type as string;
      
      const collections = await storage.getCollections(options);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.post('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collectionData = insertCollectionSchema.parse({ ...req.body, userId });
      const collection = await storage.createCollection(collectionData);
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collection data", errors: error.errors });
      }
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  // User stats
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Community routes
  app.get('/api/communities', async (req, res) => {
    try {
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  // Get communities managed by the current user (community admin)
  app.get('/api/communities/managed', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communities = await storage.getManagedCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching managed communities:", error);
      res.status(500).json({ message: "Failed to fetch managed communities" });
    }
  });

  app.get('/api/communities/:id', async (req, res) => {
    try {
      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      console.error("Error fetching community:", error);
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });

  app.post('/api/communities', requireSuperAdmin, async (req: any, res) => {
    try {
      const communityData = insertCommunitySchema.parse(req.body);
      const community = await storage.createCommunity(communityData);
      res.status(201).json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid community data", errors: error.errors });
      }
      console.error("Error creating community:", error);
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  app.put('/api/communities/:id', requireSuperAdmin, async (req: any, res) => {
    try {
      const communityData = insertCommunitySchema.partial().parse(req.body);
      const community = await storage.updateCommunity(req.params.id, communityData);
      res.json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid community data", errors: error.errors });
      }
      console.error("Error updating community:", error);
      res.status(500).json({ message: "Failed to update community" });
    }
  });

  app.delete('/api/communities/:id', requireSuperAdmin, async (req: any, res) => {
    try {
      await storage.deleteCommunity(req.params.id);
      res.json({ message: "Community deleted successfully" });
    } catch (error) {
      console.error("Error deleting community:", error);
      res.status(500).json({ message: "Failed to delete community" });
    }
  });

  // Community membership routes
  app.post('/api/communities/:communityId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { communityId } = req.params;
      
      // Check if already a member
      const isMember = await storage.isCommunityMember(userId, communityId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member of this community" });
      }
      
      const membership = await storage.joinCommunity(userId, communityId);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.delete('/api/communities/:communityId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { communityId } = req.params;
      
      await storage.leaveCommunity(userId, communityId);
      res.json({ message: "Left community successfully" });
    } catch (error) {
      console.error("Error leaving community:", error);
      res.status(500).json({ message: "Failed to leave community" });
    }
  });

  app.get('/api/communities/:communityId/members', requireCommunityMember(), async (req: any, res) => {
    try {
      const { communityId } = req.params;
      const members = await storage.getCommunityMembers(communityId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching community members:", error);
      res.status(500).json({ message: "Failed to fetch community members" });
    }
  });

  app.put('/api/communities/:communityId/members/:userId/role', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const { communityId, userId } = req.params;
      const { role } = req.body;
      
      if (!["member", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const membership = await storage.updateCommunityMemberRole(userId, communityId, role);
      res.json(membership);
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update member role" });
    }
  });

  // Get user's communities
  app.get('/api/user/communities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communities = await storage.getUserCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching user communities:", error);
      res.status(500).json({ message: "Failed to fetch user communities" });
    }
  });

  // Community admin assignment routes (Super Admin only)
  app.post('/api/communities/:id/admins', requireSuperAdmin, async (req: any, res) => {
    try {
      const { id: communityId } = req.params;
      const { userId } = req.body;
      const assignedByUserId = req.user.claims.sub;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      // Check if user is already a community admin
      const existingAdmins = await storage.getCommunityAdmins(communityId);
      const isAlreadyAdmin = existingAdmins.some(admin => admin.userId === userId);
      if (isAlreadyAdmin) {
        return res.status(400).json({ message: "User is already a community admin" });
      }

      const adminAssignment = await storage.assignCommunityAdmin({
        userId,
        communityId,
        assignedBy: assignedByUserId,
      });
      
      res.status(201).json(adminAssignment);
    } catch (error) {
      console.error("Error assigning community admin:", error);
      res.status(500).json({ message: "Failed to assign community admin" });
    }
  });

  app.delete('/api/communities/:id/admins/:userId', requireSuperAdmin, async (req: any, res) => {
    try {
      const { id: communityId, userId } = req.params;
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      // Check if user is actually a community admin
      const existingAdmins = await storage.getCommunityAdmins(communityId);
      const isAdmin = existingAdmins.some(admin => admin.userId === userId);
      if (!isAdmin) {
        return res.status(404).json({ message: "User is not a community admin" });
      }

      await storage.removeCommunityAdmin(userId, communityId);
      res.json({ message: "Community admin removed successfully" });
    } catch (error) {
      console.error("Error removing community admin:", error);
      res.status(500).json({ message: "Failed to remove community admin" });
    }
  });

  app.get('/api/communities/:id/admins', requireSuperAdmin, async (req: any, res) => {
    try {
      const { id: communityId } = req.params;
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      const admins = await storage.getCommunityAdmins(communityId);
      res.json(admins);
    } catch (error) {
      console.error("Error fetching community admins:", error);
      res.status(500).json({ message: "Failed to fetch community admins" });
    }
  });

  // User management routes (Super Admin only)
  app.get('/api/users', requireSuperAdmin, async (req: any, res) => {
    try {
      const {
        search,
        role,
        communityId,
        limit = "50",
        offset = "0"
      } = req.query;

      const options = {
        search: search as string,
        role: role as string,
        communityId: communityId as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const users = await storage.getAllUsers(options);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/search', requireSuperAdmin, async (req: any, res) => {
    try {
      const { q, limit = "20" } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const users = await storage.searchUsers(q, parseInt(limit as string));
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.put('/api/users/:id/role', requireSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!["user", "community_admin", "super_admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Community invite system routes
  app.post('/api/communities/:id/invites', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const { id: communityId } = req.params;
      const { maxUses = 1, expiresIn } = req.body;
      const createdByUserId = req.user.claims.sub;
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      // Generate unique invite code
      const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      let expiresAt: Date | undefined;
      if (expiresIn) {
        expiresAt = new Date(Date.now() + expiresIn * 1000); // expiresIn is in seconds
      }

      const invite = await storage.createInvite({
        code,
        communityId,
        createdBy: createdByUserId,
        maxUses: parseInt(maxUses),
        expiresAt,
      });
      
      res.status(201).json(invite);
    } catch (error) {
      console.error("Error creating invite:", error);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  app.get('/api/communities/:id/invites', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const { id: communityId } = req.params;
      const { active = "true" } = req.query;
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      let invites;
      if (active === "true") {
        invites = await storage.getActiveInvites(communityId);
      } else {
        invites = await storage.getAllInvites({ communityId });
      }
      
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  app.get('/api/invites/:code', async (req, res) => {
    try {
      const { code } = req.params;
      
      const invite = await storage.getInviteByCode(code);
      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      // Check if invite is still valid
      if (!invite.isActive) {
        return res.status(400).json({ message: "Invite is no longer active" });
      }

      if (invite.expiresAt && new Date() > invite.expiresAt) {
        return res.status(400).json({ message: "Invite has expired" });
      }

      if (invite.currentUses >= invite.maxUses) {
        return res.status(400).json({ message: "Invite has reached maximum uses" });
      }

      // Get community info for the invite
      const community = await storage.getCommunity(invite.communityId);
      
      res.json({
        ...invite,
        community,
      });
    } catch (error) {
      console.error("Error validating invite:", error);
      res.status(500).json({ message: "Failed to validate invite" });
    }
  });

  app.post('/api/invites/:code/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.params;
      const userId = req.user.claims.sub;
      
      const invite = await storage.getInviteByCode(code);
      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      // Check if invite is still valid
      if (!invite.isActive) {
        return res.status(400).json({ message: "Invite is no longer active" });
      }

      if (invite.expiresAt && new Date() > invite.expiresAt) {
        return res.status(400).json({ message: "Invite has expired" });
      }

      if (invite.currentUses >= invite.maxUses) {
        return res.status(400).json({ message: "Invite has reached maximum uses" });
      }

      // Check if user is already a member
      const isMember = await storage.isCommunityMember(userId, invite.communityId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member of this community" });
      }

      // Join the community
      const membership = await storage.joinCommunity(userId, invite.communityId);
      
      // Use the invite (increment usage count)
      await storage.useInvite(code);
      
      res.status(201).json({
        membership,
        message: "Successfully joined community",
      });
    } catch (error) {
      console.error("Error accepting invite:", error);
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  app.delete('/api/invites/:id', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get the invite first to check community ownership
      const invites = await storage.getAllInvites();
      const invite = invites.find(inv => inv.id === id);
      
      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }

      await storage.deactivateInvite(id);
      res.json({ message: "Invite deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating invite:", error);
      res.status(500).json({ message: "Failed to deactivate invite" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
