import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// ========== Prompt Components API Routes ==========

// Get all prompt component categories
router.get("/prompt-components/categories", async (req, res) => {
  try {
    const promptComponents = await storage.getAllPromptComponents();
    
    if (!promptComponents || promptComponents.length === 0) {
      const defaultCategories = [
        "subject", "style", "artist", "medium", "lighting", 
        "color", "mood", "composition", "camera", "quality"
      ];
      return res.json(["all", ...defaultCategories]);
    }
    
    const categorySet = new Set<string>();
    promptComponents.forEach(component => categorySet.add(component.category));
    const categories: string[] = [];
    categorySet.forEach(category => categories.push(category));
    res.json(["all", ...categories]);
  } catch (error) {
    console.error("Error fetching prompt component categories:", error);
    res.status(500).json({ error: "Failed to fetch prompt component categories" });
  }
});

// Get prompt components by category - MUST be defined before catch-all routes
router.get("/prompt-components/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`Fetching prompt components for category: ${category}`);
    const components = await storage.getPromptComponentsByCategory(category);
    console.log(`Found ${components.length} components for category ${category}`);
    res.json(components);
  } catch (error) {
    console.error("Error fetching prompt components by category:", error);
    res.status(500).json({ error: "Failed to fetch prompt components by category" });
  }
});

// Get all prompt components - accessible at both /prompt-components and root /
router.get(["/prompt-components", "/"], async (req, res) => {
  try {
    const components = await storage.getAllPromptComponents();
    res.json(components);
  } catch (error) {
    console.error("Error fetching all prompt components:", error);
    res.status(500).json({ error: "Failed to fetch prompt components" });
  }
});

// ========== Prompt Templates API Routes ==========

// Get all prompt templates (with user-specific handling)
router.get("/prompt-templates", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'dev-user';
    const isAdmin = req.headers['x-admin-mode'] === 'true';
    
    console.log(`Fetching templates - userId: ${userId}, isAdmin: ${isAdmin}`);
    
    let templates;
    if (isAdmin) {
      // For admin mode, return ALL templates from database (for editing)
      templates = await storage.getAllPromptTemplates();
    } else {
      // For regular users, return all enabled templates plus their custom templates
      // This works consistently for QuickPrompt, main generator, and settings
      templates = await storage.getAllPromptTemplatesForUser(userId);
    }
    
    console.log(`Fetched ${templates.length} templates for ${isAdmin ? 'admin' : 'user'} mode`);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching prompt templates:", error);
    res.status(500).json({ error: "Failed to fetch prompt templates" });
  }
});

// Get user-specific custom templates
router.get("/prompt-templates/user-custom/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const templates = await storage.getUserCustomTemplates(userId);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching user custom templates:", error);
    res.status(500).json({ error: "Failed to fetch user custom templates" });
  }
});

// Get default template by type (for template fallback system)
router.get("/templates/default/:type", async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`Getting default template for type: ${type}`);
    
    // Try to get from database first
    const template = await storage.getPromptTemplateByType(type);
    
    if (template) {
      res.json(template);
      return;
    }
    
    // If not found in database, return 404 (service will handle fallback)
    console.log(`No default template found for type: ${type} in database`);
    res.status(404).json({ error: `No default template found for type ${type}` });
  } catch (error) {
    console.error(`Error getting default template for type ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to get default template' });
  }
});

// Get emergency fallback template (bypasses database)
router.get("/templates/fallback/:type", async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`Getting emergency fallback template for type: ${type}`);
    
    const { ensureDefaultTemplate } = await import('../utils/template-fallback');
    const template = await ensureDefaultTemplate(type);
    
    if (template) {
      res.json(template);
    } else {
      res.status(404).json({ error: `No fallback template available for type ${type}` });
    }
  } catch (error) {
    console.error(`Error getting fallback template for type ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to get fallback template' });
  }
});

// Create or update user-specific custom template
router.post("/prompt-templates/user-custom", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'dev-user';
    const templateData = req.body;
    
    // Validate user can only edit custom1-3 templates
    if (!['custom1', 'custom2', 'custom3'].includes(templateData.template_type)) {
      return res.status(403).json({ error: "Users can only edit Custom 1, Custom 2, and Custom 3 templates" });
    }
    
    const template = await storage.createOrUpdateUserCustomTemplate(userId, templateData);
    res.json(template);
  } catch (error) {
    console.error("Error creating/updating user custom template:", error);
    res.status(500).json({ error: "Failed to create/update user custom template" });
  }
});

// Update template (admin only for system templates)
router.put("/prompt-templates/:id", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const userId = req.headers['x-user-id'] as string || 'dev-user';
    const userRole = req.headers['x-user-role'] as string || 'basic';
    const templateData = req.body;
    
    // Check permissions
    const existingTemplate = await storage.getPromptTemplateById(templateId);
    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    // User can only edit their own custom templates
    if (existingTemplate.user_id === userId && existingTemplate.is_user_custom) {
      // Allow user to edit their own custom template
    } else if (userRole === 'admin' || userRole === 'system_admin') {
      // Admins can edit any template
    } else {
      return res.status(403).json({ error: "Insufficient permissions to edit this template" });
    }
    
    const updatedTemplate = await storage.updatePromptTemplate(templateId, templateData);
    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating prompt template:", error);
    res.status(500).json({ error: "Failed to update prompt template" });
  }
});

// Get prompt templates by type
router.get("/prompt-templates/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const templates = await storage.getPromptTemplatesByType(type);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching prompt templates by type:", error);
    res.status(500).json({ error: "Failed to fetch prompt templates by type" });
  }
});

// ========== Character Presets API Routes ==========

// Get all character presets
router.get("/character-presets", async (req, res) => {
  try {
    const presets = await storage.getAllCharacterPresets();
    res.json(presets);
  } catch (error) {
    console.error("Error fetching character presets:", error);
    res.status(500).json({ error: "Failed to fetch character presets" });
  }
});

// Get character preset by ID
router.get("/character-presets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preset ID" });
    }
    
    const preset = await storage.getCharacterPresetById(id);
    if (!preset) {
      return res.status(404).json({ error: "Character preset not found" });
    }
    
    res.json(preset);
  } catch (error) {
    console.error("Error fetching character preset:", error);
    res.status(500).json({ error: "Failed to fetch character preset" });
  }
});

// Create new character preset
router.post("/character-presets", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'dev-user';
    const presetData = req.body;
    
    // Validate required fields
    if (!presetData.name || !presetData.gender) {
      return res.status(400).json({ error: "Name and gender are required" });
    }
    
    // Generate preset_id if not provided
    if (!presetData.preset_id) {
      presetData.preset_id = presetData.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Add metadata
    presetData.created_by = userId;
    presetData.is_custom = true;
    
    const preset = await storage.createCharacterPreset(presetData);
    res.json(preset);
  } catch (error) {
    console.error("Error creating character preset:", error);
    res.status(500).json({ error: "Failed to create character preset" });
  }
});

// Update character preset
router.put("/character-presets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preset ID" });
    }
    
    const presetData = req.body;
    const preset = await storage.updateCharacterPreset(id, presetData);
    
    if (!preset) {
      return res.status(404).json({ error: "Character preset not found" });
    }
    
    res.json(preset);
  } catch (error) {
    console.error("Error updating character preset:", error);
    res.status(500).json({ error: "Failed to update character preset" });
  }
});

// Delete character preset
router.delete("/character-presets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preset ID" });
    }
    
    const deleted = await storage.deleteCharacterPreset(id);
    if (!deleted) {
      return res.status(404).json({ error: "Character preset not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting character preset:", error);
    res.status(500).json({ error: "Failed to delete character preset" });
  }
});

// ========== Quality Presets API Routes ==========

// Get all quality presets
router.get("/quality-presets", async (req, res) => {
  try {
    const presets = await storage.getAllQualityPresets();
    res.json(presets);
  } catch (error) {
    console.error("Error fetching quality presets:", error);
    res.status(500).json({ error: "Failed to fetch quality presets" });
  }
});

// ========== Negative Prompt Presets API Routes ==========

// Get all negative prompt presets
router.get("/negative-prompt-presets", async (req, res) => {
  try {
    const presets = await storage.getAllNegativePromptPresets();
    res.json(presets);
  } catch (error) {
    console.error("Error fetching negative prompt presets:", error);
    res.status(500).json({ error: "Failed to fetch negative prompt presets" });
  }
});

// ========== Global Presets API Routes ==========

// Get all global presets
router.get("/global-presets", async (req, res) => {
  try {
    const presets = await storage.getAllGlobalPresets();
    res.json(presets);
  } catch (error) {
    console.error("Error fetching global presets:", error);
    res.status(500).json({ error: "Failed to fetch global presets" });
  }
});

// Get global preset by ID
router.get("/global-presets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preset ID" });
    }
    
    const preset = await storage.getGlobalPresetById(id);
    if (!preset) {
      return res.status(404).json({ error: "Global preset not found" });
    }
    
    res.json(preset);
  } catch (error) {
    console.error("Error fetching global preset:", error);
    res.status(500).json({ error: "Failed to fetch global preset" });
  }
});

// Create new global preset
router.post("/global-presets", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string || 'dev-user';
    const presetData = req.body;
    
    // Validate required fields
    if (!presetData.name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    // Generate preset_id if not provided
    if (!presetData.preset_id) {
      presetData.preset_id = presetData.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Add metadata
    presetData.created_by = userId;
    presetData.is_custom = true;
    
    const preset = await storage.createGlobalPreset(presetData);
    res.json(preset);
  } catch (error) {
    console.error("Error creating global preset:", error);
    res.status(500).json({ error: "Failed to create global preset" });
  }
});

// Update global preset
router.put("/global-presets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preset ID" });
    }
    
    const presetData = req.body;
    const preset = await storage.updateGlobalPreset(id, presetData);
    
    if (!preset) {
      return res.status(404).json({ error: "Global preset not found" });
    }
    
    res.json(preset);
  } catch (error) {
    console.error("Error updating global preset:", error);
    res.status(500).json({ error: "Failed to update global preset" });
  }
});

// Delete global preset
router.delete("/global-presets/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid preset ID" });
    }
    
    const deleted = await storage.deleteGlobalPreset(id);
    if (!deleted) {
      return res.status(404).json({ error: "Global preset not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting global preset:", error);
    res.status(500).json({ error: "Failed to delete global preset" });
  }
});

// ========== Resources API Routes ==========

// Get all resources
router.get("/resources", async (req, res) => {
  try {
    const resources = await storage.getAllResources();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Get resources by category
router.get("/resources/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const resources = await storage.getResourcesByCategory(category);
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources by category:", error);
    res.status(500).json({ error: "Failed to fetch resources by category" });
  }
});

// ========== Prompt Library API Routes ==========

// Get prompt library categories
router.get("/prompt-library/categories", async (req, res) => {
  try {
    const categories = [
      { id: 1, name: "General", description: "General purpose prompts" },
      { id: 2, name: "Art & Design", description: "Creative and artistic prompts" },
      { id: 3, name: "Photography", description: "Photography and portrait prompts" },
      { id: 4, name: "Characters", description: "Character and person prompts" },
      { id: 5, name: "Scenes", description: "Scene and environment prompts" },
      { id: 6, name: "Styles", description: "Art style and technique prompts" },
      { id: 7, name: "Lighting", description: "Lighting and atmosphere prompts" },
      { id: 8, name: "Composition", description: "Composition and framing prompts" }
    ];
    res.json(categories);
  } catch (error) {
    console.error("Error fetching prompt library categories:", error);
    res.status(500).json({ error: "Failed to fetch prompt library categories" });
  }
});

// Get all prompt library entries
router.get("/prompt-library", async (req, res) => {
  try {
    const prompts = await storage.getAllPromptLibraryEntries();
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching prompt library:", error);
    res.status(500).json({ error: "Failed to fetch prompt library" });
  }
});

// ========== Aesthetics API Routes ==========

// Get all aesthetics
router.get("/aesthetics", async (req, res) => {
  try {
    const { aesthetics } = await import("../../shared/schema");
    const { db } = await import("../db");
    
    const allAesthetics = await db.select().from(aesthetics);
    res.json(allAesthetics);
  } catch (error) {
    console.error("Error fetching aesthetics:", error);
    res.status(500).json({ error: "Failed to fetch aesthetics" });
  }
});

// Get aesthetics by category
router.get("/aesthetics/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { aesthetics } = await import("../../shared/schema");
    const { db } = await import("../db");
    const { arrayContains } = await import("drizzle-orm");
    
    const categoryAesthetics = await db
      .select()
      .from(aesthetics)
      .where(arrayContains(aesthetics.categories, [category]));
    
    res.json(categoryAesthetics);
  } catch (error) {
    console.error("Error fetching aesthetics by category:", error);
    res.status(500).json({ error: "Failed to fetch aesthetics by category" });
  }
});

// ========== AI Services API Routes ==========

// Get all AI services
router.get("/ai-services", async (req, res) => {
  try {
    const { aiServices } = await import("../../shared/schema");
    const { db } = await import("../db");
    
    const allAiServices = await db.select({
      id: aiServices.id,
      name: aiServices.name,
      description: aiServices.description,
      website: aiServices.website,
      type: aiServices.type,
      featured: aiServices.featured,
      tags: aiServices.tags,
      rating: aiServices.rating,
      logo_url: aiServices.logo_url,
      created_at: aiServices.created_at,
      parent_company: aiServices.parent_company,
      open_source: aiServices.open_source,
      pricing_model: aiServices.pricing_model,
      api_available: aiServices.api_available,
      key_features: aiServices.key_features,
      model_versions: aiServices.model_versions,
      commercial_license: aiServices.commercial_license,
      learning_resources: aiServices.learning_resources,
      documentation_link: aiServices.documentation_link,
      subreddit: aiServices.subreddit
    }).from(aiServices);
    res.json(allAiServices);
  } catch (error) {
    console.error("Error fetching AI services:", error);
    res.status(500).json({ error: "Failed to fetch AI services" });
  }
});

// Get AI services by type
router.get("/ai-services/type/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { aiServices } = await import("../../shared/schema");
    const { db } = await import("../db");
    const { eq } = await import("drizzle-orm");
    
    const typeServices = await db
      .select()
      .from(aiServices)
      .where(eq(aiServices.type, type));
    
    res.json(typeServices);
  } catch (error) {
    console.error("Error fetching AI services by type:", error);
    res.status(500).json({ error: "Failed to fetch AI services by type" });
  }
});

// ========== Prompt Guides API Routes ==========

// Get all prompt guides
router.get("/prompt-guides", async (req, res) => {
  try {
    const { promptGuides } = await import("../../shared/schema");
    const { db } = await import("../db");
    const { asc } = await import("drizzle-orm");
    
    const allGuides = await db
      .select()
      .from(promptGuides)
      .orderBy(asc(promptGuides.order), asc(promptGuides.title));
    
    res.json(allGuides);
  } catch (error) {
    console.error("Error fetching prompt guides:", error);
    res.status(500).json({ error: "Failed to fetch prompt guides" });
  }
});

// Get prompt guides by category
router.get("/prompt-guides/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { promptGuides } = await import("../../shared/schema");
    const { db } = await import("../db");
    const { eq, asc } = await import("drizzle-orm");
    
    const categoryGuides = await db
      .select()
      .from(promptGuides)
      .where(eq(promptGuides.category, category))
      .orderBy(asc(promptGuides.order), asc(promptGuides.title));
    
    res.json(categoryGuides);
  } catch (error) {
    console.error("Error fetching prompt guides by category:", error);
    res.status(500).json({ error: "Failed to fetch prompt guides by category" });
  }
});

// ========== System Folders and Albums ==========

// Get system-defined folders (common organizational structures)
router.get("/system-folders", async (req, res) => {
  try {
    const systemFolders = [
      { id: 'system-1', name: 'General', icon: 'folder', color: '#6366f1', isSystem: true },
      { id: 'system-2', name: 'Character Prompts', icon: 'users', color: '#8b5cf6', isSystem: true },
      { id: 'system-3', name: 'Art Styles', icon: 'palette', color: '#06b6d4', isSystem: true },
      { id: 'system-4', name: 'Photography', icon: 'camera', color: '#10b981', isSystem: true },
      { id: 'system-5', name: 'Landscapes', icon: 'mountain', color: '#f59e0b', isSystem: true },
      { id: 'system-6', name: 'Abstract', icon: 'sparkles', color: '#ef4444', isSystem: true },
      { id: 'system-7', name: 'Templates', icon: 'template', color: '#8b5cf6', isSystem: true },
      { id: 'system-8', name: 'References', icon: 'bookmark', color: '#6b7280', isSystem: true }
    ];
    
    res.json(systemFolders);
  } catch (error) {
    console.error("Error fetching system folders:", error);
    res.status(500).json({ error: "Failed to fetch system folders" });
  }
});

// Get system-defined albums
router.get("/system-albums", async (req, res) => {
  try {
    const systemAlbums = [
      { id: 'system-album-1', name: 'Featured Artworks', description: 'Curated collection of featured AI-generated artworks', isSystem: true },
      { id: 'system-album-2', name: 'Style Examples', description: 'Examples of different artistic styles and techniques', isSystem: true },
      { id: 'system-album-3', name: 'Character Gallery', description: 'Character design examples and references', isSystem: true },
      { id: 'system-album-4', name: 'Landscape Collection', description: 'Beautiful landscape and environment examples', isSystem: true },
      { id: 'system-album-5', name: 'Portrait Showcase', description: 'Portrait and character face examples', isSystem: true }
    ];
    
    res.json(systemAlbums);
  } catch (error) {
    console.error("Error fetching system albums:", error);
    res.status(500).json({ error: "Failed to fetch system albums" });
  }
});

// ========== System Tags ==========

// Get system-defined tags
router.get("/system-tags", async (req, res) => {
  try {
    const systemTags = [
      // Style tags
      { id: 'tag-1', name: 'realistic', category: 'style', color: '#3b82f6', isSystem: true },
      { id: 'tag-2', name: 'anime', category: 'style', color: '#8b5cf6', isSystem: true },
      { id: 'tag-3', name: 'cartoon', category: 'style', color: '#06b6d4', isSystem: true },
      { id: 'tag-4', name: 'photorealistic', category: 'style', color: '#10b981', isSystem: true },
      { id: 'tag-5', name: 'abstract', category: 'style', color: '#f59e0b', isSystem: true },
      
      // Quality tags
      { id: 'tag-6', name: 'high-quality', category: 'quality', color: '#10b981', isSystem: true },
      { id: 'tag-7', name: '4k', category: 'quality', color: '#8b5cf6', isSystem: true },
      { id: 'tag-8', name: 'detailed', category: 'quality', color: '#06b6d4', isSystem: true },
      { id: 'tag-9', name: 'sharp', category: 'quality', color: '#3b82f6', isSystem: true },
      
      // Subject tags
      { id: 'tag-10', name: 'portrait', category: 'subject', color: '#ef4444', isSystem: true },
      { id: 'tag-11', name: 'landscape', category: 'subject', color: '#10b981', isSystem: true },
      { id: 'tag-12', name: 'character', category: 'subject', color: '#8b5cf6', isSystem: true },
      { id: 'tag-13', name: 'object', category: 'subject', color: '#f59e0b', isSystem: true },
      
      // Mood tags
      { id: 'tag-14', name: 'dramatic', category: 'mood', color: '#dc2626', isSystem: true },
      { id: 'tag-15', name: 'peaceful', category: 'mood', color: '#059669', isSystem: true },
      { id: 'tag-16', name: 'mysterious', category: 'mood', color: '#7c3aed', isSystem: true },
      { id: 'tag-17', name: 'vibrant', category: 'mood', color: '#ea580c', isSystem: true }
    ];
    
    res.json(systemTags);
  } catch (error) {
    console.error("Error fetching system tags:", error);
    res.status(500).json({ error: "Failed to fetch system tags" });
  }
});

// Get system tags by category
router.get("/system-tags/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const systemTags = [
      // Style tags
      { id: 'tag-1', name: 'realistic', category: 'style', color: '#3b82f6', isSystem: true },
      { id: 'tag-2', name: 'anime', category: 'style', color: '#8b5cf6', isSystem: true },
      { id: 'tag-3', name: 'cartoon', category: 'style', color: '#06b6d4', isSystem: true },
      { id: 'tag-4', name: 'photorealistic', category: 'style', color: '#10b981', isSystem: true },
      { id: 'tag-5', name: 'abstract', category: 'style', color: '#f59e0b', isSystem: true },
      
      // Quality tags
      { id: 'tag-6', name: 'high-quality', category: 'quality', color: '#10b981', isSystem: true },
      { id: 'tag-7', name: '4k', category: 'quality', color: '#8b5cf6', isSystem: true },
      { id: 'tag-8', name: 'detailed', category: 'quality', color: '#06b6d4', isSystem: true },
      { id: 'tag-9', name: 'sharp', category: 'quality', color: '#3b82f6', isSystem: true },
      
      // Subject tags
      { id: 'tag-10', name: 'portrait', category: 'subject', color: '#ef4444', isSystem: true },
      { id: 'tag-11', name: 'landscape', category: 'subject', color: '#10b981', isSystem: true },
      { id: 'tag-12', name: 'character', category: 'subject', color: '#8b5cf6', isSystem: true },
      { id: 'tag-13', name: 'object', category: 'subject', color: '#f59e0b', isSystem: true },
      
      // Mood tags
      { id: 'tag-14', name: 'dramatic', category: 'mood', color: '#dc2626', isSystem: true },
      { id: 'tag-15', name: 'peaceful', category: 'mood', color: '#059669', isSystem: true },
      { id: 'tag-16', name: 'mysterious', category: 'mood', color: '#7c3aed', isSystem: true },
      { id: 'tag-17', name: 'vibrant', category: 'mood', color: '#ea580c', isSystem: true }
    ];
    
    const filteredTags = systemTags.filter(tag => tag.category === category);
    res.json(filteredTags);
  } catch (error) {
    console.error("Error fetching system tags by category:", error);
    res.status(500).json({ error: "Failed to fetch system tags by category" });
  }
});

// ========== Collaboration Hubs ==========

// Get collaboration hubs from database
router.get("/collaboration-hubs", async (req, res) => {
  try {
    const collaborationHubs = await storage.getAllCollaborationHubs();
    res.json(collaborationHubs);
  } catch (error) {
    console.error("Error fetching collaboration hubs:", error);
    res.status(500).json({ error: "Failed to fetch collaboration hubs" });
  }
});

// ========== Checkpoint Models ==========

// Get all checkpoint models
router.get("/checkpoint-models", async (req, res) => {
  try {
    const models = await storage.getAllCheckpointModels();
    res.json(models);
  } catch (error) {
    console.error("Error fetching checkpoint models:", error);
    res.status(500).json({ error: "Failed to fetch checkpoint models" });
  }
});

// Get specific checkpoint model by ID
router.get("/checkpoint-models/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid model ID format" });
    }

    const { checkpointModels } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("../db");
    
    const [model] = await db.select().from(checkpointModels).where(eq(checkpointModels.id, id));
    
    if (!model) {
      return res.status(404).json({ error: "Checkpoint model not found" });
    }

    res.json(model);
  } catch (error) {
    console.error("Error fetching checkpoint model:", error);
    res.status(500).json({ error: "Failed to fetch checkpoint model" });
  }
});

export default router;