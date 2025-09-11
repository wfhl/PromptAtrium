import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPromptSchema, insertProjectSchema, insertCollectionSchema, insertPromptRatingSchema, insertCommunitySchema, insertUserCommunitySchema, insertUserSchema, bulkOperationSchema, bulkOperationResultSchema, insertCategorySchema, insertPromptTypeSchema, insertPromptStyleSchema, insertIntendedGeneratorSchema, insertRecommendedModelSchema } from "@shared/schema";
import { requireSuperAdmin, requireCommunityAdmin, requireCommunityAdminRole, requireCommunityMember } from "./rbac";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { z } from "zod";
import { getAuthUrl, getTokens, saveToGoogleDrive, refreshAccessToken } from "./googleDrive";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Google Drive OAuth routes
  app.get('/api/auth/google', (req, res) => {
    const state = req.query.returnUrl || '/';
    const authUrl = getAuthUrl(state as string);
    res.redirect(authUrl);
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.redirect('/?error=google_auth_failed');
    }
    
    try {
      const tokens = await getTokens(code as string);
      
      // Store tokens in session
      (req.session as any).googleTokens = tokens;
      
      // Redirect to the return URL or close the popup
      const returnUrl = state || '/';
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'google-auth-success', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '${returnUrl}';
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.redirect('/?error=google_auth_failed');
    }
  });

  // Google Drive API routes
  app.post('/api/google-drive/save', isAuthenticated, async (req: any, res) => {
    try {
      const { fileName, fileContent, mimeType, accessToken } = req.body;
      
      if (!accessToken) {
        return res.status(401).json({ message: "Google Drive not connected" });
      }
      
      const result = await saveToGoogleDrive(
        accessToken,
        fileName,
        fileContent,
        mimeType || 'application/json'
      );
      
      res.json(result);
    } catch (error: any) {
      console.error('Error saving to Google Drive:', error);
      
      // Check if it's a token expiry error
      if (error.code === 401 || error.message?.includes('invalid_grant')) {
        return res.status(401).json({ message: "Google Drive authentication expired", needsReauth: true });
      }
      
      res.status(500).json({ message: "Failed to save to Google Drive" });
    }
  });

  app.post('/api/google-drive/refresh-token', isAuthenticated, async (req: any, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
      }
      
      const accessToken = await refreshAccessToken(refreshToken);
      res.json({ accessToken });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(401).json({ message: "Failed to refresh token", needsReauth: true });
    }
  });

  // Profile routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      // Validate request body
      const validatedData = insertUserSchema.partial().parse(req.body);
      
      // Check username uniqueness if username is being updated
      if (validatedData.username) {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, validatedData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/profile/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return public profile data only
      const publicProfile = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        website: user.website,
        twitterHandle: user.twitterHandle,
        githubHandle: user.githubHandle,
        linkedinHandle: user.linkedinHandle,
        instagramHandle: user.instagramHandle,
        deviantartHandle: user.deviantartHandle,
        blueskyHandle: user.blueskyHandle,
        tiktokHandle: user.tiktokHandle,
        redditHandle: user.redditHandle,
        patreonHandle: user.patreonHandle,
        customSocials: user.customSocials,
        createdAt: user.createdAt,
        // Respect privacy settings
        email: user.emailVisibility ? user.email : null,
        birthday: user.showBirthday ? user.birthday : null,
      };

      // Only return profile if it's public or user is viewing their own profile
      const currentUserId = (req.user as any)?.claims?.sub;
      if (user.profileVisibility === 'private' && currentUserId !== user.id) {
        return res.status(403).json({ message: "Profile is private" });
      }

      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/profile/check-username/:username', async (req, res) => {
    try {
      const { username } = req.params;
      
      // Basic username validation
      if (username.length < 3 || username.length > 30) {
        return res.json({ available: false, reason: "Username must be 3-30 characters" });
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.json({ available: false, reason: "Username can only contain letters, numbers, hyphens, and underscores" });
      }

      const existingUser = await storage.getUserByUsername(username);
      res.json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  // Object Storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    // Gets the authenticated user id.
    const userId = (req.user as any)?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/profile-picture", isAuthenticated, async (req, res) => {
    if (!req.body.profileImageUrl) {
      return res.status(400).json({ error: "profileImageUrl is required" });
    }

    // Gets the authenticated user id.
    const userId = (req.user as any)?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.profileImageUrl,
        {
          owner: userId,
          // Profile images should be public as they can be accessed by other users
          visibility: "public",
        },
      );

      // Update user profile with the new image path
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: objectPath,
      });

      res.status(200).json({
        objectPath: objectPath,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error setting profile picture:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/prompt-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    // Gets the authenticated user id.
    const userId = (req.user as any)?.claims?.sub;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageUrl,
        {
          owner: userId,
          // Prompt images should be public so they can be viewed by other users
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting prompt image ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Prompt routes
  // Get unique tags and models for dropdowns
  app.get('/api/prompts/options', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const currentUser = await storage.getUser(userId);
      const showNsfw = currentUser?.showNsfw ?? true;
      
      const allPrompts = await storage.getPrompts({ showNsfw });
      
      // Extract unique values for all array and single fields
      const tagsSet = new Set<string>();
      const modelsSet = new Set<string>();
      const categoriesSet = new Set<string>();
      const promptTypesSet = new Set<string>();
      const promptStylesSet = new Set<string>();
      const intendedGeneratorsSet = new Set<string>();
      
      allPrompts.forEach((prompt: any) => {
        // Handle existing tags and models arrays
        if (prompt.tags) {
          prompt.tags.forEach((tag: string) => tagsSet.add(tag));
        }
        if (prompt.recommendedModels) {
          prompt.recommendedModels.forEach((model: string) => modelsSet.add(model));
        }
        
        // Handle existing single fields (for backward compatibility)
        if (prompt.category) categoriesSet.add(prompt.category);
        if (prompt.promptType) promptTypesSet.add(prompt.promptType);
        if (prompt.promptStyle) promptStylesSet.add(prompt.promptStyle);
        if (prompt.intendedGenerator) intendedGeneratorsSet.add(prompt.intendedGenerator);
        
        // Handle new array fields (when they exist)
        if (prompt.categories) {
          prompt.categories.forEach((category: string) => categoriesSet.add(category));
        }
        if (prompt.promptTypes) {
          prompt.promptTypes.forEach((type: string) => promptTypesSet.add(type));
        }
        if (prompt.promptStyles) {
          prompt.promptStyles.forEach((style: string) => promptStylesSet.add(style));
        }
        if (prompt.intendedGenerators) {
          prompt.intendedGenerators.forEach((generator: string) => intendedGeneratorsSet.add(generator));
        }
      });
      
      const tags = Array.from(tagsSet).sort();
      const models = Array.from(modelsSet).sort();
      const categories = Array.from(categoriesSet).sort();
      const promptTypes = Array.from(promptTypesSet).sort();
      const promptStyles = Array.from(promptStylesSet).sort();
      const intendedGenerators = Array.from(intendedGeneratorsSet).sort();
      
      res.json({ tags, models, categories, promptTypes, promptStyles, intendedGenerators });
    } catch (error) {
      console.error('Error fetching prompt options:', error);
      res.status(500).json({ message: 'Failed to fetch options' });
    }
  });

  app.get('/api/prompts', async (req: any, res) => {
    try {
      const {
        userId,
        isPublic,
        isFeatured,
        category,
        status,
        statusNotEqual,
        tags,
        search,
        limit,
        offset = "0"
      } = req.query;

      // Get the current user's NSFW preference if authenticated
      let showNsfw = true; // Default to showing all content
      if (req.user?.claims?.sub) {
        const currentUser = await storage.getUser(req.user.claims.sub);
        showNsfw = currentUser?.showNsfw ?? true;
      }

      const options: any = {
        userId: userId as string,
        isPublic: isPublic === "true" ? true : isPublic === "false" ? false : undefined,
        isFeatured: isFeatured === "true",
        category: category as string,
        status: status as string,
        statusNotEqual: statusNotEqual as string,
        tags: tags ? (tags as string).split(",") : undefined,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: parseInt(offset as string),
        showNsfw: showNsfw,
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
      const userId = (req.user as any).claims.sub;
      
      // Handle empty collectionId by converting to null
      const requestBody = { ...req.body, userId };
      if (requestBody.collectionId === "" || requestBody.collectionId === undefined) {
        requestBody.collectionId = null;
      }
      
      const promptData = insertPromptSchema.parse(requestBody);
      const prompt = await storage.createPrompt(promptData);
      
      // Create activity for prompt creation
      if (prompt.isPublic) {
        await storage.createActivity({
          userId,
          actionType: "created_prompt",
          targetId: prompt.id,
          targetType: "prompt",
          metadata: { promptName: prompt.name }
        });
      }
      
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
      const userId = (req.user as any).claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      if (prompt.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to edit this prompt" });
      }

      // Handle empty collectionId by converting to null
      const requestBody = { ...req.body };
      if (requestBody.collectionId === "" || requestBody.collectionId === undefined) {
        requestBody.collectionId = null;
      }

      const promptData = insertPromptSchema.partial().parse(requestBody);
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

  // Get related data counts for a prompt (likes, favorites, ratings)
  app.get('/api/prompts/:id/related-data', isAuthenticated, async (req: any, res) => {
    try {
      const relatedData = await storage.getPromptRelatedData(req.params.id);
      res.json(relatedData);
    } catch (error) {
      console.error("Error getting prompt related data:", error);
      res.status(500).json({ message: "Failed to get prompt related data" });
    }
  });

  app.delete('/api/prompts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
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
      const userId = (req.user as any).claims.sub;
      const forkedPrompt = await storage.forkPrompt(req.params.id, userId);
      res.status(201).json(forkedPrompt);
    } catch (error) {
      console.error("Error forking prompt:", error);
      res.status(500).json({ message: "Failed to fork prompt" });
    }
  });

  app.post('/api/prompts/bulk-import', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
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
      const batchSize = 50;
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
              // Handle new array fields
              categories: Array.isArray(promptData.categories) ? promptData.categories : [],
              promptTypes: Array.isArray(promptData.promptTypes) ? promptData.promptTypes : [],
              promptStyles: Array.isArray(promptData.promptStyles) ? promptData.promptStyles : [],
              intendedGenerators: Array.isArray(promptData.intendedGenerators) ? promptData.intendedGenerators : [],
              collectionIds: Array.isArray(promptData.collectionIds) ? promptData.collectionIds : [],
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

  // Google Docs/Sheets import endpoint
  app.post('/api/prompts/google-import', isAuthenticated, async (req: any, res) => {
    try {
      const { url, type } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Extract document/spreadsheet ID from the URL
      let docId: string | null = null;
      let exportUrl: string = "";

      if (type === "docs" || url.includes("docs.google.com/document")) {
        // Extract Google Docs ID
        const docMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!docMatch) {
          return res.status(400).json({ message: "Invalid Google Docs URL" });
        }
        docId = docMatch[1];
        // Export as plain text
        exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      } else if (type === "sheets" || url.includes("docs.google.com/spreadsheets")) {
        // Extract Google Sheets ID
        const sheetMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!sheetMatch) {
          return res.status(400).json({ message: "Invalid Google Sheets URL" });
        }
        docId = sheetMatch[1];
        // Export as CSV
        exportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
      } else {
        return res.status(400).json({ message: "Unsupported Google document type" });
      }

      // Fetch the document content
      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ message: "Document not found. Make sure the document is publicly accessible." });
        }
        return res.status(500).json({ message: "Failed to fetch document content" });
      }

      const content = await response.text();
      
      // Return the content for client-side parsing
      res.json({ 
        content,
        type: type === "sheets" || url.includes("spreadsheets") ? "csv" : "txt",
        docId 
      });
      
    } catch (error) {
      console.error("Error importing from Google:", error);
      res.status(500).json({ message: "Failed to import from Google document" });
    }
  });

  // Bulk operations endpoint
  app.post('/api/prompts/bulk-operations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      // Validate request body
      const validatedData = bulkOperationSchema.parse(req.body);
      const { promptIds, operation, updateData } = validatedData;

      // Initialize result tracking
      const result = {
        total: promptIds.length,
        success: 0,
        failed: 0,
        errors: [] as Array<{ promptId: string; error: string }>,
        results: [] as Array<{ promptId: string; success: boolean; error?: string }>
      };

      // Verify user owns all prompts before making any changes
      const ownedPrompts = await storage.getPrompts({ userId, promptIds });
      const ownedPromptIds = new Set(ownedPrompts.map((p: any) => p.id));
      
      const unauthorizedPrompts = promptIds.filter(id => !ownedPromptIds.has(id));
      if (unauthorizedPrompts.length > 0) {
        return res.status(403).json({ 
          message: "Not authorized to modify some prompts",
          unauthorizedPrompts 
        });
      }

      // Process each prompt
      for (const promptId of promptIds) {
        try {
          let success = false;
          
          switch (operation) {
            case "update":
              if (updateData) {
                await storage.updatePrompt(promptId, updateData);
                success = true;
              }
              break;
              
            case "delete":
              await storage.deletePrompt(promptId);
              success = true;
              break;
              
            case "archive":
              await storage.updatePrompt(promptId, { status: "archived" });
              success = true;
              break;
              
            case "unarchive":
              await storage.updatePrompt(promptId, { status: "published" });
              success = true;
              break;
              
            case "publish":
              await storage.updatePrompt(promptId, { status: "published" });
              success = true;
              break;
              
            case "draft":
              await storage.updatePrompt(promptId, { status: "draft" });
              success = true;
              break;
              
            case "makePublic":
              await storage.updatePrompt(promptId, { isPublic: true });
              success = true;
              break;
              
            case "makePrivate":
              await storage.updatePrompt(promptId, { isPublic: false });
              success = true;
              break;
              
            case "like":
              await storage.toggleLike(userId, promptId);
              success = true;
              break;
              
            case "unlike":
              // Force unlike by checking current state
              const isCurrentlyLiked = await storage.checkIfLiked(userId, promptId);
              if (isCurrentlyLiked) {
                await storage.toggleLike(userId, promptId);
              }
              success = true;
              break;
              
            case "favorite":
              await storage.toggleFavorite(userId, promptId);
              success = true;
              break;
              
            case "unfavorite":
              // Force unfavorite by checking current state
              const isCurrentlyFavorited = await storage.checkIfFavorited(userId, promptId);
              if (isCurrentlyFavorited) {
                await storage.toggleFavorite(userId, promptId);
              }
              success = true;
              break;
              
            case "export":
              // Export is handled client-side, just mark as success
              success = true;
              break;
              
            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }
          
          if (success) {
            result.success++;
            result.results.push({ promptId, success: true });
          }
          
        } catch (error) {
          result.failed++;
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          result.errors.push({ promptId, error: errorMessage });
          result.results.push({ promptId, success: false, error: errorMessage });
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error during bulk operation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid bulk operation data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to process bulk operation" });
    }
  });

  // Community routes
  app.post('/api/prompts/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const promptId = req.params.id;
      const isLiked = await storage.toggleLike(userId, promptId);
      
      // Create activity for liking (only when liking, not unliking)
      if (isLiked) {
        const prompt = await storage.getPrompt(promptId);
        if (prompt && prompt.isPublic) {
          await storage.createActivity({
            userId,
            actionType: "liked_prompt",
            targetId: promptId,
            targetType: "prompt",
            metadata: { promptName: prompt.name }
          });
        }
      }
      
      res.json({ liked: isLiked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post('/api/prompts/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const promptId = req.params.id;
      const isFavorited = await storage.toggleFavorite(userId, promptId);
      
      // Create activity for favoriting (only when favoriting, not unfavoriting)
      if (isFavorited) {
        const prompt = await storage.getPrompt(promptId);
        if (prompt && prompt.isPublic) {
          await storage.createActivity({
            userId,
            actionType: "favorited_prompt",
            targetId: promptId,
            targetType: "prompt",
            metadata: { promptName: prompt.name }
          });
        }
      }
      
      res.json({ favorited: isFavorited });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Toggle featured status (super admin only)
  app.post('/api/prompts/:id/featured', requireSuperAdmin, async (req: any, res) => {
    try {
      const prompt = await storage.getPrompt(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      const newFeaturedStatus = !prompt.isFeatured;
      await storage.updatePrompt(req.params.id, { isFeatured: newFeaturedStatus });
      res.json({ featured: newFeaturedStatus });
    } catch (error) {
      console.error("Error toggling featured status:", error);
      res.status(500).json({ message: "Failed to toggle featured status" });
    }
  });

  // Toggle hidden status (super admin only)
  app.post('/api/prompts/:id/hidden', requireSuperAdmin, async (req: any, res) => {
    try {
      const prompt = await storage.getPrompt(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      const newHiddenStatus = !prompt.isHidden;
      await storage.updatePrompt(req.params.id, { isHidden: newHiddenStatus });
      res.json({ hidden: newHiddenStatus });
    } catch (error) {
      console.error("Error toggling hidden status:", error);
      res.status(500).json({ message: "Failed to toggle hidden status" });
    }
  });

  app.get('/api/user/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      
      // Get the full prompt details for each favorite
      const favoritePrompts = await Promise.all(
        favorites.map(async (favorite) => {
          const prompt = await storage.getPrompt(favorite.promptId);
          return prompt;
        })
      );
      
      // Filter out any null prompts (in case prompts were deleted)
      res.json(favoritePrompts.filter(prompt => prompt !== undefined));
    } catch (error) {
      console.error("Error fetching user favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get('/api/user/likes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const likes = await storage.getUserLikes(userId);
      
      // Get the full prompt details for each liked prompt
      const likedPrompts = await Promise.all(
        likes.map(async (like) => {
          const prompt = await storage.getPrompt(like.promptId);
          return prompt;
        })
      );
      
      // Filter out any null prompts (in case prompts were deleted)
      res.json(likedPrompts.filter(prompt => prompt !== undefined));
    } catch (error) {
      console.error("Error fetching user likes:", error);
      res.status(500).json({ message: "Failed to fetch likes" });
    }
  });

  app.post('/api/prompts/:id/rate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
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

  // Archive/unarchive prompt
  app.post('/api/prompts/:id/archive', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt || prompt.userId !== userId) {
        return res.status(404).json({ message: "Prompt not found or not authorized" });
      }

      if (prompt.status === 'archived') {
        // Unarchiving: restore to published status (keeping it private)
        const updatedPrompt = await storage.updatePrompt(req.params.id, { status: 'published' });
        res.json({ archived: false, status: 'published' });
      } else {
        // Archiving: set to archived, make private, and remove all bookmarks
        // First remove all bookmarks/favorites for this prompt
        await storage.removeAllFavorites(req.params.id);
        
        // Then update the prompt to be archived and private
        const updatedPrompt = await storage.updatePrompt(req.params.id, { 
          status: 'archived',
          isPublic: false 
        });
        
        res.json({ 
          archived: true, 
          status: 'archived',
          madePrivate: prompt.isPublic === true,
          removedBookmarks: true
        });
      }
    } catch (error) {
      console.error("Error toggling archive:", error);
      res.status(500).json({ message: "Failed to toggle archive" });
    }
  });

  // Toggle public/private status
  app.post('/api/prompts/:id/visibility', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const prompt = await storage.getPrompt(req.params.id);
      
      if (!prompt || prompt.userId !== userId) {
        return res.status(404).json({ message: "Prompt not found or not authorized" });
      }

      const newVisibility = !prompt.isPublic;
      const updatedPrompt = await storage.updatePrompt(req.params.id, { isPublic: newVisibility });
      
      res.json({ isPublic: newVisibility });
    } catch (error) {
      console.error("Error toggling visibility:", error);
      res.status(500).json({ message: "Failed to toggle visibility" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
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
      const userId = (req.user as any).claims.sub;
      const { communityId, type } = req.query;
      
      const options: any = {};
      if (!communityId && !type) {
        // Default: get user's personal collections
        options.userId = userId;
      }
      if (communityId) options.communityId = communityId as string;
      if (type) options.type = type as string;
      
      const collections = await storage.getCollections(options);
      
      // Add prompt count to each collection
      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          // Get user's NSFW preference for accurate count
          let showNsfw = true;
          if (req.user?.claims?.sub) {
            const currentUser = await storage.getUser(req.user.claims.sub);
            showNsfw = currentUser?.showNsfw ?? true;
          }
          const prompts = await storage.getPrompts({ collectionId: collection.id, showNsfw });
          return {
            ...collection,
            promptCount: prompts.length
          };
        })
      );
      
      res.json(collectionsWithCounts);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  // Get a single collection by ID
  app.get('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const collection = await storage.getCollection(req.params.id);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Check if user has access to this collection
      const isOwner = collection.userId === userId;
      const isPublic = collection.isPublic;
      
      if (!isOwner && !isPublic) {
        return res.status(403).json({ message: "Not authorized to view this collection" });
      }
      
      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  // Get all prompts in a collection
  app.get('/api/collections/:id/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const collectionId = req.params.id;
      
      // First check if collection exists and user has access
      const collection = await storage.getCollection(collectionId);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Check if user has access to this collection
      const isOwner = collection.userId === userId;
      const isPublic = collection.isPublic;
      
      if (!isOwner && !isPublic) {
        return res.status(403).json({ message: "Not authorized to view this collection" });
      }
      
      // Get the current user's NSFW preference if authenticated
      let showNsfw = true;
      if (req.user?.claims?.sub) {
        const currentUser = await storage.getUser(req.user.claims.sub);
        showNsfw = currentUser?.showNsfw ?? true;
      }
      
      // Fetch prompts with the collectionId filter
      const prompts = await storage.getPrompts({ collectionId, showNsfw });
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching collection prompts:", error);
      res.status(500).json({ message: "Failed to fetch collection prompts" });
    }
  });

  app.post('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const collectionData = insertCollectionSchema.parse({ ...req.body, userId });
      const collection = await storage.createCollection(collectionData);
      
      // Create activity for collection creation
      await storage.createActivity({
        userId,
        actionType: "created_collection",
        targetId: collection.id,
        targetType: "collection",
        metadata: { collectionName: collection.name }
      });
      
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collection data", errors: error.errors });
      }
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.put('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { updatePrompts } = req.query;
      const collection = await storage.getCollection(req.params.id);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Check permissions
      const isSuperAdmin = (req.user as any).role === "super_admin";
      const isCommunityAdmin = (req.user as any).role === "community_admin";
      
      if (!isSuperAdmin && collection.userId !== userId && 
          !(isCommunityAdmin && collection.type === "community")) {
        return res.status(403).json({ message: "Not authorized to edit this collection" });
      }

      const collectionData = insertCollectionSchema.partial().parse(req.body);
      
      // If updatePrompts is true and privacy is changing, update all prompts in the collection
      if (updatePrompts === 'true' && collectionData.isPublic !== undefined && collectionData.isPublic !== collection.isPublic) {
        const promptsInCollection = await storage.getPrompts({ collectionId: req.params.id });
        
        // Update each prompt's privacy to match the collection
        for (const prompt of promptsInCollection) {
          await storage.updatePrompt(prompt.id, { ...prompt, isPublic: collectionData.isPublic });
        }
      }
      
      const updatedCollection = await storage.updateCollection(req.params.id, collectionData);
      res.json(updatedCollection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collection data", errors: error.errors });
      }
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { deletePrompts } = req.query;
      const collection = await storage.getCollection(req.params.id);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Check permissions
      const isSuperAdmin = (req.user as any).role === "super_admin";
      const isCommunityAdmin = (req.user as any).role === "community_admin";
      
      if (!isSuperAdmin && collection.userId !== userId && 
          !(isCommunityAdmin && collection.type === "community")) {
        return res.status(403).json({ message: "Not authorized to delete this collection" });
      }

      // Get prompts in this collection
      const promptsInCollection = await storage.getPrompts({ collectionId: req.params.id });
      
      if (deletePrompts === 'true') {
        // Delete all prompts in the collection first
        for (const prompt of promptsInCollection) {
          await storage.deletePrompt(prompt.id);
        }
      } else {
        // Remove collection reference from prompts (set collectionId to null)
        for (const prompt of promptsInCollection) {
          await storage.updatePrompt(prompt.id, { ...prompt, collectionId: null });
        }
      }

      await storage.deleteCollection(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const { userId, type, isActive } = req.query;
      const options: any = {};
      
      if (userId) options.userId = userId as string;
      if (type) options.type = type as string;
      if (isActive !== undefined) options.isActive = isActive === 'true';
      
      const categories = await storage.getCategories(options);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const categoryData = insertCategorySchema.parse({ ...req.body, userId, type: 'user' });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Prompt type routes
  app.get('/api/prompt-types', async (req, res) => {
    try {
      const { userId, type, isActive } = req.query;
      const options: any = {};
      
      if (userId) options.userId = userId as string;
      if (type) options.type = type as string;
      if (isActive !== undefined) options.isActive = isActive === 'true';
      
      const promptTypes = await storage.getPromptTypes(options);
      res.json(promptTypes);
    } catch (error) {
      console.error("Error fetching prompt types:", error);
      res.status(500).json({ message: "Failed to fetch prompt types" });
    }
  });

  app.post('/api/prompt-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const promptTypeData = insertPromptTypeSchema.parse({ ...req.body, userId, type: 'user' });
      const promptType = await storage.createPromptType(promptTypeData);
      res.status(201).json(promptType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prompt type data", errors: error.errors });
      }
      console.error("Error creating prompt type:", error);
      res.status(500).json({ message: "Failed to create prompt type" });
    }
  });

  // Prompt style routes
  app.get('/api/prompt-styles', async (req, res) => {
    try {
      const { userId, type, isActive } = req.query;
      const options: any = {};
      
      if (userId) options.userId = userId as string;
      if (type) options.type = type as string;
      if (isActive !== undefined) options.isActive = isActive === 'true';
      
      const promptStyles = await storage.getPromptStyles(options);
      res.json(promptStyles);
    } catch (error) {
      console.error("Error fetching prompt styles:", error);
      res.status(500).json({ message: "Failed to fetch prompt styles" });
    }
  });

  app.post('/api/prompt-styles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const promptStyleData = insertPromptStyleSchema.parse({ ...req.body, userId, type: 'user' });
      const promptStyle = await storage.createPromptStyle(promptStyleData);
      res.status(201).json(promptStyle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prompt style data", errors: error.errors });
      }
      console.error("Error creating prompt style:", error);
      res.status(500).json({ message: "Failed to create prompt style" });
    }
  });

  // Intended generator routes
  app.get('/api/intended-generators', async (req, res) => {
    try {
      const { userId, type, isActive } = req.query;
      const options: any = {};
      
      if (userId) options.userId = userId as string;
      if (type) options.type = type as string;
      if (isActive !== undefined) options.isActive = isActive === 'true';
      
      const generators = await storage.getIntendedGenerators(options);
      res.json(generators);
    } catch (error) {
      console.error("Error fetching intended generators:", error);
      res.status(500).json({ message: "Failed to fetch intended generators" });
    }
  });

  app.post('/api/intended-generators', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const generatorData = insertIntendedGeneratorSchema.parse({ ...req.body, userId, type: 'user' });
      const generator = await storage.createIntendedGenerator(generatorData);
      res.status(201).json(generator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid intended generator data", errors: error.errors });
      }
      console.error("Error creating intended generator:", error);
      res.status(500).json({ message: "Failed to create intended generator" });
    }
  });

  // Recommended model routes
  app.get('/api/recommended-models', async (req, res) => {
    try {
      const { userId, type, isActive } = req.query;
      const options: any = {};
      
      if (userId) options.userId = userId as string;
      if (type) options.type = type as string;
      if (isActive !== undefined) options.isActive = isActive === 'true';
      
      const models = await storage.getRecommendedModels(options);
      res.json(models);
    } catch (error) {
      console.error("Error fetching recommended models:", error);
      res.status(500).json({ message: "Failed to fetch recommended models" });
    }
  });

  app.post('/api/recommended-models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const modelData = insertRecommendedModelSchema.parse({ ...req.body, userId, type: 'user' });
      const model = await storage.createRecommendedModel(modelData);
      res.status(201).json(model);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid recommended model data", errors: error.errors });
      }
      console.error("Error creating recommended model:", error);
      res.status(500).json({ message: "Failed to create recommended model" });
    }
  });

  // User stats
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get all users (for community page)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers({ limit: 100 });
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Follow operations
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = (req.user as any).claims.sub;
      const targetUserId = req.params.userId;
      
      if (currentUserId === targetUserId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const follow = await storage.followUser(currentUserId, targetUserId);
      res.json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = (req.user as any).claims.sub;
      const targetUserId = req.params.userId;
      
      await storage.unfollowUser(currentUserId, targetUserId);
      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/:userId/follow-status', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = (req.user as any).claims.sub;
      const targetUserId = req.params.userId;
      
      const isFollowing = await storage.isFollowing(currentUserId, targetUserId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });

  app.get('/api/users/:userId/followers', async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const followers = await storage.getFollowers(userId, limit, offset);
      const followerCount = await storage.getFollowerCount(userId);
      
      res.json({ followers, total: followerCount });
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get('/api/users/:userId/following', async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const following = await storage.getFollowing(userId, limit, offset);
      const followingCount = await storage.getFollowingCount(userId);
      
      res.json({ following, total: followingCount });
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  app.get('/api/user/following/prompts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const prompts = await storage.getFollowedUsersPrompts(userId, limit, offset);
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching followed users prompts:", error);
      res.status(500).json({ message: "Failed to fetch followed users prompts" });
    }
  });

  app.get('/api/activities/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  app.get('/api/user/following/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const activities = await storage.getFollowedUsersActivities(userId, limit, offset);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching followed users activities:", error);
      res.status(500).json({ message: "Failed to fetch followed users activities" });
    }
  });

  app.get('/api/users/:userId/stats', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const stats = await storage.getUserStats(userId);
      const followerCount = await storage.getFollowerCount(userId);
      const followingCount = await storage.getFollowingCount(userId);
      
      res.json({
        ...stats,
        followers: followerCount,
        following: followingCount
      });
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
      const userId = (req.user as any).claims.sub;
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
      const userId = (req.user as any).claims.sub;
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
      const userId = (req.user as any).claims.sub;
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
      const userId = (req.user as any).claims.sub;
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
        role: role as "user" | "community_admin" | "super_admin" | undefined,
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
  app.post('/api/communities/:id/invites', requireSuperAdmin, async (req: any, res) => {
    try {
      const { id: communityId } = req.params;
      const { maxUses = 1, expiresAt } = req.body;
      const createdByUserId = req.user.claims.sub;
      
      // Check if community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      // Generate unique invite code
      const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      let expiresAtDate: Date | undefined;
      if (expiresAt) {
        expiresAtDate = new Date(expiresAt);
      }

      const invite = await storage.createInvite({
        code,
        communityId,
        createdBy: createdByUserId,
        maxUses: parseInt(maxUses),
        expiresAt: expiresAtDate,
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

  // Get invite stats (for Super Admin) - must come before /:code route
  app.get('/api/invites/stats', requireSuperAdmin, async (req: any, res) => {
    try {
      const allInvites = await storage.getAllInvites();
      const now = new Date();

      let active = 0;
      let used = 0;
      let expired = 0;

      allInvites.forEach(invite => {
        const isExpired = invite.expiresAt && invite.expiresAt < now;
        const isExhausted = (invite.currentUses ?? 0) >= (invite.maxUses ?? 1);
        const isInactive = !invite.isActive;

        if (isExpired) {
          expired++;
        } else if (isExhausted || isInactive) {
          used++;
        } else if (invite.isActive) {
          active++;
        }
      });

      res.json({ active, used, expired });
    } catch (error) {
      console.error("Error fetching invite stats:", error);
      res.status(500).json({ message: "Failed to fetch invite stats" });
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

      if ((invite.currentUses ?? 0) >= (invite.maxUses ?? 1)) {
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
      const userId = (req.user as any).claims.sub;
      
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

      if ((invite.currentUses ?? 0) >= (invite.maxUses ?? 1)) {
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

  // Add POST endpoint for deactivating invites (for frontend compatibility)
  app.post('/api/invites/:id/deactivate', requireSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await storage.deactivateInvite(id);
      res.json({ message: "Invite deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating invite:", error);
      res.status(500).json({ message: "Failed to deactivate invite" });
    }
  });

  // Get all invites (for Super Admin)
  app.get('/api/invites', requireSuperAdmin, async (req: any, res) => {
    try {
      const {
        communityId,
        createdBy,
        isActive,
        limit = "50",
        offset = "0"
      } = req.query;

      const options = {
        communityId: communityId as string,
        createdBy: createdBy as string,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const invites = await storage.getAllInvites(options);
      res.json(invites);
    } catch (error) {
      console.error("Error fetching invites:", error);
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  // Community member management routes
  app.get('/api/communities/:id/members', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const { id: communityId } = req.params;
      
      const members = await storage.getCommunityMembers(communityId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching community members:", error);
      res.status(500).json({ message: "Failed to fetch community members" });
    }
  });

  app.delete('/api/communities/:id/members/:userId', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const { id: communityId, userId } = req.params;
      
      await storage.leaveCommunity(userId, communityId);
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing community member:", error);
      res.status(500).json({ message: "Failed to remove community member" });
    }
  });

  app.put('/api/communities/:id/members/:userId/role', requireCommunityAdminRole(), async (req: any, res) => {
    try {
      const { id: communityId, userId } = req.params;
      const { role } = req.body;
      
      if (!["member", "moderator", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedMember = await storage.updateCommunityMemberRole(userId, communityId, role);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member role:", error);
      res.status(500).json({ message: "Failed to update member role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
