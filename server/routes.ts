import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPromptSchema, insertProjectSchema, insertCollectionSchema, insertPromptRatingSchema, insertCommunitySchema, insertUserCommunitySchema, insertUserSchema, bulkOperationSchema, bulkOperationResultSchema, insertCategorySchema, insertPromptTypeSchema, insertPromptStyleSchema, insertPromptStyleRuleTemplateSchema, insertIntendedGeneratorSchema, insertRecommendedModelSchema } from "@shared/schema";
import { requireSuperAdmin, requireCommunityAdmin, requireCommunityAdminRole, requireCommunityMember } from "./rbac";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath } from "./objectStorage";
import { ObjectPermission, getObjectAclPolicy } from "./objectAcl";
import { File } from "@google-cloud/storage";
import express from "express";
import { z } from "zod";
import { getAuthUrl, getTokens, saveToGoogleDrive, refreshAccessToken } from "./googleDrive";
import { devStorage } from "./devStorage";
import aiAnalyzerRouter from "./routes/aiAnalyzer";
import captionRouter from "./routes/caption";
import enhancePromptRouter from "./routes/enhance-prompt";
import systemDataRouter from "./routes/system-data";
import visionProxyRouter from "./routes/vision-proxy";

// Helper function to resolve public image URLs for development
// ONLY affects development mode - production URLs pass through unchanged
function resolvePublicImageUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  
  // ONLY transform URLs in development mode
  if (process.env.NODE_ENV === 'development') {
    return devStorage.getPublicURL(url);
  }
  
  // In production, return URL unchanged
  return url;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed default prompt styles on startup if none exist
  try {
    const existingGlobalStyles = await storage.getPromptStyles({ type: 'global' });
    if (existingGlobalStyles.length === 0) {
      console.log("Seeding default prompt styles...");
      const defaultStyles = [
        { name: "Photography", description: "Professional photography, {character}, {subject}, high quality, detailed", type: "global" as const },
        { name: "Artistic", description: "Artistic render of {character}, {subject}, creative composition, masterpiece", type: "global" as const },
        { name: "Cinematic", description: "Cinematic shot, {character}, {subject}, dramatic lighting, movie quality", type: "global" as const },
        { name: "Portrait", description: "Portrait photography, {character}, {subject}, professional headshot", type: "global" as const },
        { name: "Lifestyle", description: "Lifestyle photography, {character}, {subject}, natural setting", type: "global" as const },
      ];
      
      for (const style of defaultStyles) {
        try {
          await storage.createPromptStyle(style);
        } catch (err) {
          console.log(`Failed to create style ${style.name}:`, err);
        }
      }
      console.log(`Seeded ${defaultStyles.length} default prompt styles`);
    } else {
      console.log(`Found ${existingGlobalStyles.length} existing global prompt styles`);
    }
  } catch (error) {
    console.error("Error checking/seeding prompt styles:", error);
  }
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      
      // In development only, normalize the profile image URL for display
      if (process.env.NODE_ENV === 'development' && user) {
        user.profileImageUrl = resolvePublicImageUrl(user.profileImageUrl);
      }
      
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

  // Username availability check endpoint
  app.get('/api/check-username/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const currentUserId = (req.user as any)?.claims?.sub;
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return res.json({ 
          available: false, 
          message: "Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores" 
        });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      
      // Username is available if no user exists or it's the current user's username
      const available = !existingUser || (currentUserId && existingUser.id === currentUserId);
      
      res.json({ 
        available,
        message: available ? "Username is available" : "Username is already taken"
      });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username availability" });
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
    try {
      // Use development storage in development mode
      if (process.env.NODE_ENV === 'development') {
        const { uploadURL, objectId } = await devStorage.getDevUploadURL('generic');
        // Also return the canonical path for dev mode
        res.json({ 
          uploadURL,
          objectPath: `/objects/uploads/${objectId}`,
          publicURL: `/api/dev-storage/uploads/${objectId}`
        });
      } else {
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        res.json({ uploadURL });
      }
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Development-only upload endpoints
  if (process.env.NODE_ENV === 'development') {
    // Generic development upload handler
    app.put("/api/dev-upload/:type/:objectId", express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
      const { objectId, type } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      try {
        const validTypes = ['profile', 'prompt', 'generic'];
        if (!validTypes.includes(type)) {
          return res.status(400).json({ error: "Invalid upload type" });
        }
        
        const publicPath = await devStorage.saveFile(
          objectId, 
          req.body as Buffer, 
          type as 'profile' | 'prompt' | 'generic',
          {
            contentType: req.headers['content-type'] || 'application/octet-stream',
            userId
          }
        );
        
        // Return both the canonical path and public URL
        const fileId = objectId;
        res.json({
          path: publicPath,
          objectPath: `/objects/uploads/${fileId}`,
          publicURL: publicPath,
          message: "Development upload successful"
        });
      } catch (error) {
        console.error("Error in development upload:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    });
    
    // Development storage serving endpoint
    app.get("/api/dev-storage/:type/:objectId", async (req, res) => {
      const { type, objectId } = req.params;
      
      try {
        const { data, metadata } = await devStorage.getFile(type, objectId);
        
        // Determine appropriate content type
        let contentType = metadata?.contentType || 'application/octet-stream';
        
        // If no content type stored, try to determine from file extension
        if (contentType === 'application/octet-stream') {
          const ext = objectId.split('.').pop()?.toLowerCase();
          const mimeTypes: { [key: string]: string } = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
          };
          contentType = mimeTypes[ext || ''] || contentType;
        }
        
        res.set({
          'Content-Type': contentType,
          'Content-Length': data.length.toString(),
          'Cache-Control': 'public, max-age=3600'
        });
        
        res.send(data);
      } catch (error) {
        console.error("Error serving development file:", error);
        res.status(404).json({ error: "File not found" });
      }
    });
    
    // Fallback for old upload-direct endpoint
    app.put("/api/objects/upload-direct/:objectId", express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
      const { objectId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      try {
        const publicPath = await devStorage.saveFile(
          objectId, 
          req.body as Buffer, 
          'generic',
          {
            contentType: req.headers['content-type'] || 'application/octet-stream',
            userId
          }
        );
        
        // Return both the canonical path and public URL
        res.json({
          path: publicPath,
          objectPath: `/objects/uploads/${objectId}`,
          publicURL: publicPath,
          message: "Development upload successful",
          success: true
        });
      } catch (error) {
        console.error("Error in direct upload:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    });
    
    console.log("Development storage endpoints registered");
  }

  // Public image serving endpoint with production fallback
  app.get("/api/objects/serve/:path(*)", async (req, res) => {
    try {
      const objectPath = decodeURIComponent(req.params.path);
      
      // Handle different path formats
      let normalizedPath = objectPath;
      
      // If it's already a full URL or /objects/ path, extract the relevant part
      if (objectPath.startsWith('/objects/')) {
        normalizedPath = objectPath;
      } else if (!objectPath.startsWith('/')) {
        normalizedPath = `/objects/${objectPath}`;
      }
      
      const objectStorageService = new ObjectStorageService();
      
      try {
        // Try to get the file using the object entity file method
        const objectFile = await objectStorageService.getObjectEntityFile(normalizedPath);
        
        // Check if the file is public (no auth required for public files)
        const aclPolicy = await getObjectAclPolicy(objectFile);
        const isPublic = aclPolicy?.visibility === "public";
        
        if (!isPublic) {
          // For private files, check authentication
          const userId = (req.user as any)?.claims?.sub;
          const canAccess = await objectStorageService.canAccessObjectEntity({
            objectFile,
            userId: userId,
            requestedPermission: ObjectPermission.READ,
          });
          
          if (!canAccess) {
            return res.sendStatus(401);
          }
        }
        
        // Stream the file to the response
        await objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        // Fallback for production environment when sidecar isn't available
        if (process.env.NODE_ENV === 'production' || error instanceof ObjectNotFoundError) {
          console.log("Falling back to direct bucket access for:", normalizedPath);
          
          // Try direct bucket access for public images
          const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
          if (!privateObjectDir) {
            console.error("Object storage not configured");
            return res.sendStatus(404);
          }
          
          let fullPath = normalizedPath;
          if (normalizedPath.startsWith('/objects/')) {
            const entityId = normalizedPath.slice('/objects/'.length);
            fullPath = `${privateObjectDir}/${entityId}`;
          }
          
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          
          const [exists] = await file.exists();
          if (!exists) {
            return res.sendStatus(404);
          }
          
          // For production fallback, only serve public files without auth
          const aclPolicy = await getObjectAclPolicy(file);
          if (aclPolicy?.visibility !== "public") {
            // Private file, requires authentication which we can't verify without sidecar
            console.error("Cannot verify access for private file without sidecar:", normalizedPath);
            return res.sendStatus(401);
          }
          
          // Stream the public file
          await objectStorageService.downloadObject(file, res);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.put("/api/profile-picture", isAuthenticated, async (req, res) => {
    if (!req.body.profileImageUrl) {
      return res.status(400).json({ error: "profileImageUrl is required" });
    }

    // Gets the authenticated user id.
    const userId = (req.user as any)?.claims?.sub;

    try {
      let objectPath = req.body.profileImageUrl;
      
      // In development mode, handle local storage paths
      if (process.env.NODE_ENV === 'development') {
        // Store the canonical path for persistence
        const fileId = req.body.profileImageUrl.split('/').pop();
        objectPath = `/objects/uploads/${fileId}`;
      } else {
        const objectStorageService = new ObjectStorageService();
        objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          req.body.profileImageUrl,
          {
            owner: userId,
            // Profile images should be public as they can be accessed by other users
            visibility: "public",
          },
        );
      }

      // Update user profile with the new image path
      const updatedUser = await storage.updateUser(userId, {
        profileImageUrl: objectPath,
      });

      // In development, also return the public URL for immediate display
      const response: any = {
        objectPath: objectPath,
        user: updatedUser,
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.publicURL = resolvePublicImageUrl(objectPath);
        // Also update the user object's profileImageUrl for immediate display
        if (response.user) {
          response.user.profileImageUrl = response.publicURL;
        }
      }
      
      res.status(200).json(response);
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
      let objectPath = req.body.imageUrl;
      
      // In development mode, handle local storage paths
      if (process.env.NODE_ENV === 'development') {
        // Store the canonical path for persistence
        const fileId = req.body.imageUrl.split('/').pop();
        objectPath = `/objects/uploads/${fileId}`;
      } else {
        const objectStorageService = new ObjectStorageService();
        objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          req.body.imageUrl,
          {
            owner: userId,
            // Prompt images should be public so they can be viewed by other users
            visibility: "public",
          },
        );
      }

      // In development, also return the public URL for immediate display
      const response: any = {
        objectPath: objectPath,
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.publicURL = resolvePublicImageUrl(objectPath);
      }
      
      res.status(200).json(response);
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
      
      // Also fetch collections for the dropdown
      const collections = await storage.getCollections({ 
        userId: userId,
        isPublic: true 
      });
      
      const tags = Array.from(tagsSet).sort();
      const models = Array.from(modelsSet).sort();
      const categories = Array.from(categoriesSet).sort();
      const promptTypes = Array.from(promptTypesSet).sort();
      const promptStyles = Array.from(promptStylesSet).sort();
      const intendedGenerators = Array.from(intendedGeneratorsSet).sort();
      
      res.json({ 
        tags, 
        models, 
        categories, 
        promptTypes, 
        promptStyles, 
        intendedGenerators,
        collections: collections.map(c => ({ id: c.id, name: c.name })) 
      });
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
        type,
        style,
        generator,
        model,
        collection,
        status,
        statusNotEqual,
        tags,
        search,
        sortBy,
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
        promptType: type as string,
        promptStyle: style as string,
        intendedGenerator: generator as string,
        collectionId: collection as string,
        status: status as string,
        statusNotEqual: statusNotEqual as string,
        tags: tags ? (tags as string).split(",") : undefined,
        search: search as string,
        sortBy: sortBy as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: parseInt(offset as string),
        showNsfw: showNsfw,
      };
      
      // Handle recommended models filter (array)
      if (model) {
        options.recommendedModels = [model as string];
      }

      const prompts = await storage.getPrompts(options);
      
      // In development, normalize image URLs for display
      if (process.env.NODE_ENV === 'development' && prompts) {
        const normalizedPrompts = prompts.map(prompt => ({
          ...prompt,
          imageUrls: prompt.imageUrls?.map(url => resolvePublicImageUrl(url))
        }));
        res.json(normalizedPrompts);
      } else {
        res.json(prompts);
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
      res.status(500).json({ message: "Failed to fetch prompts" });
    }
  });

  app.get('/api/prompts/:id', async (req, res) => {
    try {
      const prompt = await storage.getPromptWithUser(req.params.id);
      if (!prompt) {
        return res.status(404).json({ message: "Prompt not found" });
      }
      
      // In development, normalize image URLs for display
      if (process.env.NODE_ENV === 'development' && prompt) {
        const normalizedPrompt = {
          ...prompt,
          imageUrls: prompt.imageUrls?.map(url => resolvePublicImageUrl(url))
        };
        res.json(normalizedPrompt);
      } else {
        res.json(prompt);
      }
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
      
      // Get the original prompt to find the owner
      const originalPrompt = await storage.getPrompt(req.params.id);
      if (originalPrompt && originalPrompt.userId !== userId) {
        const forker = await storage.getUser(userId);
        if (forker) {
          await storage.createNotification({
            userId: originalPrompt.userId,
            type: "fork",
            message: `${forker.username || forker.firstName || 'Someone'} forked your prompt "${originalPrompt.name}"`,
            relatedUserId: userId,
            relatedPromptId: req.params.id,
            relatedListId: null,
            isRead: false,
            metadata: { promptName: originalPrompt.name, forkedPromptId: forkedPrompt.id }
          });
        }
      }
      
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
      console.log("Like endpoint called - userId:", userId, "promptId:", promptId);
      const isLiked = await storage.toggleLike(userId, promptId);
      console.log("Like toggle result:", isLiked);
      
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
          
          // Create notification for prompt owner (if not liking own prompt)
          if (prompt.userId !== userId) {
            const liker = await storage.getUser(userId);
            if (liker) {
              await storage.createNotification({
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

  // Admin route to cleanup duplicate likes (super admin only)
  app.post('/api/admin/cleanup-likes', requireSuperAdmin, async (req: any, res) => {
    try {
      const result = await storage.cleanupDuplicateLikes();
      res.json({
        message: `Cleanup completed successfully`,
        duplicatesRemoved: result.duplicatesRemoved,
        promptsFixed: result.promptsFixed
      });
    } catch (error) {
      console.error("Error cleaning up likes:", error);
      res.status(500).json({ message: "Failed to cleanup likes" });
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

  app.get('/api/prompts/forked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      // Get the current user's NSFW preference
      const currentUser = await storage.getUser(userId);
      const showNsfw = currentUser?.showNsfw ?? true;
      
      // Get all prompts where forkOf is not null and userId matches
      const forkedPrompts = await storage.getPrompts({
        userId: userId,
        showNsfw: showNsfw,
      });
      
      // Filter to only include prompts that have a forkOf value
      const actualForkedPrompts = forkedPrompts.filter(prompt => prompt.forkOf !== null);
      
      res.json(actualForkedPrompts);
    } catch (error) {
      console.error("Error fetching forked prompts:", error);
      res.status(500).json({ message: "Failed to fetch forked prompts" });
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

  // Contribute images to a prompt (community contribution feature)
  app.post('/api/prompts/:id/contribute-images', isAuthenticated, async (req: any, res) => {
    try {
      const contributorId = (req.user as any).claims.sub;
      const { imageUrls } = req.body;
      
      // Validate imageUrls
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ message: "No images provided" });
      }
      
      if (imageUrls.length > 5) {
        return res.status(400).json({ message: "Cannot contribute more than 5 images at once" });
      }
      
      // Contribute images to the prompt
      const updatedPrompt = await storage.contributeImagesToPrompt(
        req.params.id, 
        imageUrls, 
        contributorId
      );
      
      res.json({ 
        success: true, 
        prompt: updatedPrompt,
        message: `Successfully contributed ${imageUrls.length} image(s)`
      });
    } catch (error) {
      console.error("Error contributing images:", error);
      
      if (error instanceof Error) {
        // Handle specific error messages from storage
        if (error.message.includes("not found")) {
          return res.status(404).json({ message: error.message });
        }
        if (error.message.includes("private") || error.message.includes("own prompts")) {
          return res.status(403).json({ message: error.message });
        }
        if (error.message.includes("more than")) {
          return res.status(400).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: "Failed to contribute images" });
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
      const { communityId, type, isPublic, search, limit, offset } = req.query;
      
      const options: any = {};
      if (isPublic === 'true') {
        // For public collections, don't filter by userId
        options.isPublic = true;
      } else if (!communityId && !type) {
        // Default: get user's personal collections
        options.userId = userId;
      }
      if (communityId) options.communityId = communityId as string;
      if (type) options.type = type as string;
      if (search) options.search = search as string;
      if (limit) options.limit = parseInt(limit as string, 10);
      if (offset) options.offset = parseInt(offset as string, 10);
      
      const collections = await storage.getCollections(options);
      
      // Add prompt count and user info to each collection
      const collectionsWithCounts = await Promise.all(
        collections.map(async (collection) => {
          // Get user's NSFW preference for accurate count
          let showNsfw = true;
          if (req.user?.claims?.sub) {
            const currentUser = await storage.getUser(req.user.claims.sub);
            showNsfw = currentUser?.showNsfw ?? true;
          }
          const prompts = await storage.getPrompts({ collectionId: collection.id, showNsfw });
          
          // Get user info if this is a public collection
          let user = null;
          if (collection.userId) {
            user = await storage.getUser(collection.userId);
          }
          
          return {
            ...collection,
            promptCount: prompts.length,
            user: user ? {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl
            } : null
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

  // Prompt style rule template routes (actual prompt templates from prompt_templates table)
  app.get('/api/prompt-stylerule-templates', async (req, res) => {
    try {
      const { userId, category, isDefault } = req.query;
      const options: any = {};
      
      if (userId) options.userId = userId as string;
      if (category) options.category = category as string;
      if (isDefault !== undefined) options.isDefault = isDefault === 'true';
      
      const templates = await storage.getPromptStyleRuleTemplates(options);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching prompt style rule templates:", error);
      res.status(500).json({ message: "Failed to fetch prompt style rule templates" });
    }
  });

  app.post('/api/prompt-stylerule-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const templateData = insertPromptStyleRuleTemplateSchema.parse({ ...req.body, userId });
      const template = await storage.createPromptStyleRuleTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      console.error("Error creating prompt style rule template:", error);
      res.status(500).json({ message: "Failed to create prompt style rule template" });
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
      
      // Create notification for the followed user
      const follower = await storage.getUser(currentUserId);
      if (follower) {
        await storage.createNotification({
          userId: targetUserId,
          type: "follow",
          message: `${follower.username || follower.firstName || 'Someone'} started following you`,
          relatedUserId: currentUserId,
          relatedPromptId: null,
          relatedListId: null,
          isRead: false,
          metadata: {}
        });
      }
      
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

  app.get('/api/user/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const activities = await storage.getUserActivities(userId, limit, offset);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      res.status(500).json({ message: "Failed to fetch user activities" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const notifications = await storage.getNotifications(userId, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const count = await storage.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { id } = req.params;
      
      const notification = await storage.markNotificationRead(id, userId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
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

  // Public object serving endpoint for images - ACL-aware with proper streaming
  // NOTE: No isAuthenticated middleware - allows public access but still checks ACL
  app.get('/api/objects/serve/:path(*)', async (req: any, res) => {
    try {
      const { path } = req.params;
      
      // Development mode early check - if sidecar is not available, return a dev placeholder
      if (process.env.NODE_ENV === 'development') {
        // Quick check if sidecar is available with a very short timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        );
        
        try {
          await Promise.race([
            objectStorageClient.getBuckets({ maxResults: 1 }),
            timeoutPromise
          ]);
        } catch (sidecarError) {
          // If we get a timeout or connection error, assume sidecar is not available
          console.log('Development mode: Object storage sidecar not available, returning placeholder for path:', path);
          // Return a placeholder that indicates images would work in production
          return res.status(200).json({ 
            message: 'Development mode: Object storage not available',
            path: path,
            note: 'Images will display when object storage sidecar is running or in production'
          });
        }
      }
      
      const objectStorageService = new ObjectStorageService();
      
      // Get user ID if authenticated (setupAuth populates req.user even without isAuthenticated middleware)
      const userId = req.user?.claims?.sub || null;
      
      let objectFile: File | null = null;
      
      // Handle different path formats
      if (path.startsWith('http://') || path.startsWith('https://')) {
        // Parse storage.googleapis.com URLs to internal paths
        if (path.includes('storage.googleapis.com')) {
          try {
            const url = new URL(path);
            const pathParts = url.pathname.split('/').filter(p => p);
            if (pathParts.length >= 2) {
              const bucketName = pathParts[0];
              const objectName = pathParts.slice(1).join('/');
              const bucket = objectStorageClient.bucket(bucketName);
              objectFile = bucket.file(objectName);
              
              // Verify file exists
              const [exists] = await objectFile.exists();
              if (!exists) {
                objectFile = null;
              }
            }
          } catch (parseError) {
            console.error('Error parsing storage URL:', parseError);
          }
        } else {
          // For non-storage URLs, redirect as fallback (but restrict to safe domains)
          const allowedDomains = ['storage.googleapis.com'];
          const url = new URL(path);
          if (allowedDomains.includes(url.hostname)) {
            return res.redirect(path);
          } else {
            return res.status(403).json({ message: 'External URL not allowed' });
          }
        }
      } else if (path.startsWith('/objects/')) {
        // Handle /objects/ paths using getObjectEntityFile
        try {
          objectFile = await objectStorageService.getObjectEntityFile('/' + path);
        } catch (error) {
          if (error instanceof ObjectNotFoundError) {
            objectFile = null;
          } else if (process.env.NODE_ENV === 'development' && 
                     (error.message?.includes('127.0.0.1:1106') || 
                      error.config?.url?.includes('127.0.0.1:1106') ||
                      error.toString().includes('127.0.0.1:1106'))) {
            // In development, object storage auth might fail - try direct construction
            console.log('Development mode: Attempting direct object construction for path:', path);
            try {
              const { bucketName, objectName } = parseObjectPath('/' + path);
              const bucket = objectStorageClient.bucket(bucketName);
              objectFile = bucket.file(objectName);
              // In dev, we'll assume it exists and is public for testing
            } catch (parseError) {
              console.error('Failed to construct object file in development:', parseError);
              objectFile = null;
            }
          } else {
            throw error;
          }
        }
      } else if (path.startsWith('objects/')) {
        // Handle objects/ paths (without leading slash)
        try {
          objectFile = await objectStorageService.getObjectEntityFile('/' + path);
        } catch (error) {
          if (error instanceof ObjectNotFoundError) {
            objectFile = null;
          } else if (process.env.NODE_ENV === 'development' && 
                     (error.message?.includes('127.0.0.1:1106') || 
                      error.config?.url?.includes('127.0.0.1:1106') ||
                      error.toString().includes('127.0.0.1:1106'))) {
            // In development, object storage auth might fail - try direct construction
            console.log('Development mode: Attempting direct object construction for path:', path);
            try {
              const { bucketName, objectName } = parseObjectPath('/' + path);
              const bucket = objectStorageClient.bucket(bucketName);
              objectFile = bucket.file(objectName);
              // In dev, we'll assume it exists and is public for testing
            } catch (parseError) {
              console.error('Failed to construct object file in development:', parseError);
              objectFile = null;
            }
          } else {
            throw error;
          }
        }
      } else {
        // Try to find in public search paths
        try {
          // Remove leading slash if present for searchPublicObject
          const searchPath = path.startsWith('/') ? path.slice(1) : path;
          objectFile = await objectStorageService.searchPublicObject(searchPath);
        } catch (error) {
          console.error('Error searching public object:', error);
          objectFile = null;
        }
      }
      
      // If no file found, return 404
      if (!objectFile) {
        return res.status(404).json({ message: 'Object not found' });
      }
      
      // Check access permissions using ACL
      let canAccess = false;
      let isPublic = false;
      
      try {
        canAccess = await objectStorageService.canAccessObjectEntity({
          objectFile,
          userId: userId,
          requestedPermission: ObjectPermission.READ,
        });
        
        // Try to get ACL policy for cache headers
        const aclPolicy = await getObjectAclPolicy(objectFile);
        isPublic = aclPolicy?.visibility === "public";
      } catch (aclError) {
        // In development, if we can't check ACL due to auth issues, allow access for testing
        if (process.env.NODE_ENV === 'development' && 
            (aclError.message?.includes('127.0.0.1:1106') || 
             aclError.config?.url?.includes('127.0.0.1:1106') ||
             aclError.toString().includes('127.0.0.1:1106'))) {
          console.log('Development mode: Assuming public access for testing');
          canAccess = true;
          isPublic = true;
        } else {
          // Re-throw if it's not a development auth issue
          throw aclError;
        }
      }
      
      if (!canAccess) {
        // Return 403 Forbidden for access denied (not 401 which implies authentication required)
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Stream the file with appropriate cache headers
      // Public files get long cache time, private files get shorter cache time
      const cacheTtl = isPublic ? 31536000 : 3600; // 1 year for public, 1 hour for private
      
      try {
        await objectStorageService.downloadObject(objectFile, res, cacheTtl);
      } catch (downloadError) {
        // In development, if download fails due to auth, return a placeholder response
        if (process.env.NODE_ENV === 'development' && 
            (downloadError.message?.includes('127.0.0.1:1106') || 
             downloadError.config?.url?.includes('127.0.0.1:1106') ||
             downloadError.toString().includes('127.0.0.1:1106'))) {
          console.log('Development mode: Cannot stream file due to auth issues');
          // Return a simple response indicating the file would be served in production
          res.status(200).json({ 
            message: 'Development mode: Object storage not available',
            path: path,
            wouldBePublic: isPublic
          });
        } else {
          throw downloadError;
        }
      }
    } catch (error) {
      console.error('Error serving object:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: 'Object not found' });
      }
      res.status(500).json({ message: 'Internal server error' });
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

  // Codex API Routes
  // Helper middleware for admin checking
  const isAdminUser = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      // Check if user is super_admin or community_admin
      if (user.role === "super_admin" || user.role === "community_admin") {
        return next();
      }
      return res.status(403).json({ message: "Admin privileges required" });
    } catch (error) {
      console.error("Error checking admin status:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Category endpoints
  app.get('/api/codex/categories', async (req, res) => {
    try {
      const categories = await storage.getWordsmithCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching wordsmith categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.get('/api/codex/categories/:id', async (req, res) => {
    try {
      // Since categories are now derived from the data, just return a simple object
      const categories = await storage.getWordsmithCategories();
      const category = categories.find(c => c.id === req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching wordsmith category:', error);
      res.status(500).json({ message: 'Failed to fetch category' });
    }
  });

  // These endpoints are no longer needed as categories are derived from prompt_components and aesthetics
  // app.post('/api/codex/categories', ...)
  // app.put('/api/codex/categories/:id', ...)
  // app.delete('/api/codex/categories/:id', ...)

  // Term endpoints
  app.get('/api/codex/terms', async (req: any, res) => {
    try {
      // Get userId from authenticated user if available
      const userId = req.user?.id;
      
      const terms = await storage.getWordsmithTerms({
        category: req.query.categoryId as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        excludeAesthetics: req.query.excludeAesthetics === 'true',
        userId: userId,
      });
      res.json(terms);
    } catch (error) {
      console.error('Error fetching wordsmith terms:', error);
      res.status(500).json({ message: 'Failed to fetch terms' });
    }
  });

  app.get('/api/codex/terms/search', async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Search query required' });
      }
      
      // Get userId from authenticated user if available
      const userId = req.user?.id;
      
      const terms = await storage.getWordsmithTerms({
        search: query,
        category: req.query.categoryId as string,
        userId: userId,
      });
      res.json(terms);
    } catch (error) {
      console.error('Error searching wordsmith terms:', error);
      res.status(500).json({ message: 'Failed to search terms' });
    }
  });

  // Terms are read-only from prompt_components and aesthetics
  app.get('/api/codex/terms/:id', async (req: any, res) => {
    try {
      // Get userId from authenticated user if available
      const userId = req.user?.id;
      
      const terms = await storage.getWordsmithTerms({ userId });
      const term = terms.find(t => t.id === req.params.id);
      if (!term) {
        return res.status(404).json({ message: 'Term not found' });
      }
      res.json(term);
    } catch (error) {
      console.error('Error fetching wordsmith term:', error);
      res.status(500).json({ message: 'Failed to fetch term' });
    }
  });

  // These endpoints are no longer needed as terms come from prompt_components and aesthetics
  // app.post('/api/codex/terms', ...)
  // app.put('/api/codex/terms/:id', ...)
  // app.delete('/api/codex/terms/:id', ...)

  // Simplified lists endpoints - just return empty arrays for now
  app.get('/api/codex/lists', async (req: any, res) => {
    res.json([]);
  });

  app.get('/api/codex/lists/:id', async (req, res) => {
    res.status(404).json({ message: 'Lists not yet supported' });
  });

  app.get('/api/codex/lists/:id/terms', async (req, res) => {
    res.json([]);
  });

  // Assembled String endpoints
  app.get('/api/codex/assembled-strings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const type = req.query.type as "preset" | "wildcard" | undefined;
      const strings = await storage.getCodexAssembledStrings(userId, type);
      res.json(strings);
    } catch (error) {
      console.error('Error fetching assembled strings:', error);
      res.status(500).json({ message: 'Failed to fetch assembled strings' });
    }
  });

  app.get('/api/codex/assembled-strings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const assembledString = await storage.getCodexAssembledString(req.params.id);
      if (!assembledString) {
        return res.status(404).json({ message: 'Assembled string not found' });
      }
      
      // Only allow viewing if user owns the string
      if (assembledString.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to view this assembled string' });
      }
      
      res.json(assembledString);
    } catch (error) {
      console.error('Error fetching assembled string:', error);
      res.status(500).json({ message: 'Failed to fetch assembled string' });
    }
  });

  app.post('/api/codex/assembled-strings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const assembledString = await storage.createCodexAssembledString({
        ...req.body,
        userId: userId,
      });
      res.json(assembledString);
    } catch (error) {
      console.error('Error creating assembled string:', error);
      res.status(500).json({ message: 'Failed to create assembled string' });
    }
  });

  app.put('/api/codex/assembled-strings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const assembledString = await storage.getCodexAssembledString(req.params.id);
      if (!assembledString) {
        return res.status(404).json({ message: 'Assembled string not found' });
      }
      
      // Only allow editing if user owns the string
      if (assembledString.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to edit this assembled string' });
      }
      
      const updated = await storage.updateCodexAssembledString(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating assembled string:', error);
      res.status(500).json({ message: 'Failed to update assembled string' });
    }
  });

  app.delete('/api/codex/assembled-strings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const assembledString = await storage.getCodexAssembledString(req.params.id);
      if (!assembledString) {
        return res.status(404).json({ message: 'Assembled string not found' });
      }
      
      // Only allow deletion if user owns the string
      if (assembledString.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this assembled string' });
      }
      
      await storage.deleteCodexAssembledString(req.params.id);
      res.json({ message: 'Assembled string deleted' });
    } catch (error) {
      console.error('Error deleting assembled string:', error);
      res.status(500).json({ message: 'Failed to delete assembled string' });
    }
  });

  // Register AI analyzer routes
  app.use(aiAnalyzerRouter);

  // Register Quick Prompt API routes
  app.use('/api/caption', captionRouter);
  app.use('/api/enhance-prompt', enhancePromptRouter);
  app.use('/api/system-data', systemDataRouter);
  app.use('/api/vision-proxy', visionProxyRouter);

  const httpServer = createServer(app);
  return httpServer;
}
