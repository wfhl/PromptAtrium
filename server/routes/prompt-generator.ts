import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { 
  insertPromptTemplateSchema, 
  insertPromptGeneratorComponentSchema,
  insertPromptGenerationHistorySchema,
  insertUserPromptPresetSchema
} from "@shared/schema";

// Validation schemas
const generatePromptSchema = z.object({
  template: z.string().optional(),
  custom: z.string().optional(),
  subject: z.string().optional(),
  gender: z.enum(["female", "male", "neutral"]).optional(),
  components: z.record(z.array(z.string())).optional(),
  enableRandomization: z.boolean().optional(),
  seed: z.number().optional(),
  enableNegativePrompt: z.boolean().optional(),
  qualityPresets: z.array(z.string()).optional(),
  maxComponentsPerCategory: z.number().optional(),
  format: z.enum(["standard", "detailed", "json", "markdown"]).optional()
});

const enhancePromptSchema = z.object({
  prompt: z.string(),
  style: z.string().optional(),
  model: z.string().optional(),
  enhancementLevel: z.enum(["light", "moderate", "heavy"]).optional()
});

const historyItemSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string().optional(),
  template: z.string().optional(),
  options: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.number().optional()
});

const presetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  template: z.string().optional(),
  options: z.record(z.any()),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// Default components data (fallback for when database is empty)
const DEFAULT_COMPONENTS = {
  artform: [
    { id: "digital-art", value: "digital art", category: "artform", description: "Digital artwork created with software" },
    { id: "oil-painting", value: "oil painting", category: "artform", description: "Traditional oil painting technique" },
    { id: "watercolor", value: "watercolor", category: "artform", description: "Watercolor painting style" },
    { id: "pencil-sketch", value: "pencil sketch", category: "artform", description: "Black and white pencil drawing" },
    { id: "3d-render", value: "3D render", category: "artform", description: "Computer-generated 3D artwork" },
  ],
  lighting: [
    { id: "golden-hour", value: "golden hour", category: "lighting", description: "Warm, soft lighting during sunrise/sunset" },
    { id: "dramatic-lighting", value: "dramatic lighting", category: "lighting", description: "High contrast, moody lighting" },
    { id: "soft-lighting", value: "soft lighting", category: "lighting", description: "Gentle, diffused lighting" },
    { id: "neon-lighting", value: "neon lighting", category: "lighting", description: "Vibrant neon light effects" },
    { id: "studio-lighting", value: "studio lighting", category: "lighting", description: "Professional photography lighting" },
  ],
  mood: [
    { id: "mysterious", value: "mysterious", category: "mood", description: "Enigmatic and intriguing atmosphere" },
    { id: "cheerful", value: "cheerful", category: "mood", description: "Happy and uplifting mood" },
    { id: "melancholic", value: "melancholic", category: "mood", description: "Sad and contemplative feeling" },
    { id: "epic", value: "epic", category: "mood", description: "Grand and heroic atmosphere" },
    { id: "serene", value: "serene", category: "mood", description: "Calm and peaceful mood" },
  ],
  style: [
    { id: "photorealistic", value: "photorealistic", category: "style", description: "Extremely realistic, photo-like quality" },
    { id: "anime", value: "anime", category: "style", description: "Japanese animation style" },
    { id: "cyberpunk", value: "cyberpunk", category: "style", description: "Futuristic, neon-lit urban aesthetic" },
    { id: "fantasy", value: "fantasy", category: "style", description: "Magical and fantastical elements" },
    { id: "minimalist", value: "minimalist", category: "style", description: "Simple, clean design with minimal elements" },
  ]
};

// Default templates (enhanced version)
const DEFAULT_TEMPLATES = [
  {
    id: "standard",
    name: "Standard",
    description: "Balanced prompt with all essential elements",
    category: "General",
    format: "{{subject}}, {{style}}, {{lighting}}, {{mood}}, {{quality}}",
    example: "A majestic dragon, digital art style, dramatic lighting, mysterious mood, high quality",
    variables: ["subject", "style", "lighting", "mood", "quality"],
    popularity: 95,
    isDefault: true,
    isCustom: false
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Film-like composition with dramatic elements",
    category: "Photography",
    format: "Cinematic shot of {{subject}}, {{camera_angle}}, {{lighting}}, {{color_grading}}, film grain",
    example: "Cinematic shot of a lone warrior, low angle, golden hour lighting, teal and orange grading, film grain",
    variables: ["subject", "camera_angle", "lighting", "color_grading"],
    popularity: 88,
    isDefault: true,
    isCustom: false
  },
  {
    id: "portrait",
    name: "Portrait",
    description: "Focused on character details and expression",
    category: "Character",
    format: "Portrait of {{character}}, {{expression}}, {{lighting}}, {{background}}, {{style}}",
    example: "Portrait of a cyberpunk hacker, determined expression, neon lighting, cityscape background, digital art",
    variables: ["character", "expression", "lighting", "background", "style"],
    popularity: 92,
    isDefault: true,
    isCustom: false
  },
  {
    id: "landscape",
    name: "Landscape",
    description: "Natural or urban scenery composition",
    category: "Environment",
    format: "{{location}} landscape, {{time_of_day}}, {{weather}}, {{style}}, {{mood}}",
    example: "Mountain valley landscape, sunrise, misty weather, impressionist style, peaceful mood",
    variables: ["location", "time_of_day", "weather", "style", "mood"],
    popularity: 85,
    isDefault: true,
    isCustom: false
  },
  {
    id: "concept-art",
    name: "Concept Art",
    description: "Professional concept art for games and films",
    category: "Professional",
    format: "Concept art of {{subject}}, {{style}} design, {{view}}, {{details}}, professional artwork",
    example: "Concept art of futuristic vehicle, sleek design, three-quarter view, detailed mechanics, professional artwork",
    variables: ["subject", "style", "view", "details"],
    popularity: 78,
    isDefault: true,
    isCustom: false
  }
];

export function promptGeneratorRoutes(app: Express) {
  // ============================================
  // COMPONENTS ENDPOINTS
  // ============================================

  // Get all components with optional filtering
  app.get("/api/prompt-generator/components", async (req: Request, res: Response) => {
    try {
      const { category, search, limit = 100, offset = 0 } = req.query;
      
      // Try to get components from database first
      const components = await storage.getPromptGeneratorComponents({
        category: category as string,
        search: search as string,
        limit: Number(limit),
        offset: Number(offset)
      }).catch(() => {
        // Fallback to default components if database fails
        let result = Object.values(DEFAULT_COMPONENTS).flat();
        
        if (category) {
          result = result.filter(c => c.category === category);
        }
        
        if (search) {
          const searchLower = (search as string).toLowerCase();
          result = result.filter(c => 
            c.value.toLowerCase().includes(searchLower) ||
            c.description?.toLowerCase().includes(searchLower)
          );
        }
        
        return result.slice(Number(offset), Number(offset) + Number(limit));
      });
      
      res.json({
        components,
        total: components.length,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error("Error fetching components:", error);
      res.status(500).json({ error: "Failed to fetch components" });
    }
  });

  // Get component categories with counts
  app.get("/api/prompt-generator/components/categories", async (req: Request, res: Response) => {
    try {
      const components = await storage.getPromptGeneratorComponents({}).catch(() => {
        return Object.values(DEFAULT_COMPONENTS).flat();
      });
      
      const categories = components.reduce((acc: Record<string, number>, comp: any) => {
        acc[comp.category] = (acc[comp.category] || 0) + 1;
        return acc;
      }, {});
      
      const result = Object.entries(categories).map(([name, count]) => ({
        name,
        count,
        displayName: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Search components
  app.get("/api/prompt-generator/components/search", async (req: Request, res: Response) => {
    try {
      const { q, category, limit = 50 } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }
      
      const components = await storage.getPromptGeneratorComponents({
        search: q as string,
        category: category as string,
        limit: Number(limit)
      }).catch(() => {
        let result = Object.values(DEFAULT_COMPONENTS).flat();
        const searchLower = (q as string).toLowerCase();
        
        result = result.filter(c => 
          c.value.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
        );
        
        if (category) {
          result = result.filter(c => c.category === category);
        }
        
        return result.slice(0, Number(limit));
      });
      
      res.json(components);
    } catch (error) {
      console.error("Error searching components:", error);
      res.status(500).json({ error: "Failed to search components" });
    }
  });

  // Get multiple components by IDs
  app.post("/api/prompt-generator/components/bulk", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "IDs array required" });
      }
      
      // Fetch all components and filter by IDs
      const allComponents = await storage.getPromptGeneratorComponents({}).catch(() => {
        return Object.values(DEFAULT_COMPONENTS).flat();
      });
      
      const components = allComponents.filter((c: any) => ids.includes(c.id));
      
      res.json(components);
    } catch (error) {
      console.error("Error fetching bulk components:", error);
      res.status(500).json({ error: "Failed to fetch components" });
    }
  });

  // ============================================
  // TEMPLATES ENDPOINTS (Enhanced)
  // ============================================

  // Get all templates
  app.get("/api/prompt-templates", async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { category, isCustom, isDefault } = req.query;
      
      // Get templates from database if user is authenticated
      let templates = [...DEFAULT_TEMPLATES];
      
      if (userId) {
        try {
          const userTemplates = await storage.getPromptTemplates({
            userId,
            category: category as string,
            isCustom: isCustom === "true",
            isDefault: isDefault === "true"
          });
          
          // Merge with default templates
          templates = [...DEFAULT_TEMPLATES, ...userTemplates];
        } catch (dbError) {
          console.error("Database error, using defaults:", dbError);
        }
      }
      
      // Apply filters
      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      
      if (isCustom !== undefined) {
        templates = templates.filter(t => t.isCustom === (isCustom === "true"));
      }
      
      if (isDefault !== undefined) {
        templates = templates.filter(t => t.isDefault === (isDefault === "true"));
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get single template
  app.get("/api/prompt-templates/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      // Check default templates first
      let template = DEFAULT_TEMPLATES.find(t => t.id === id);
      
      // If not found in defaults and user is authenticated, check database
      if (!template && userId) {
        template = await storage.getPromptTemplate(id).catch(() => undefined);
      }
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Create custom template
  app.post("/api/prompt-templates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      const validatedData = insertPromptTemplateSchema.parse({
        ...req.body,
        userId,
        isCustom: true,
        isDefault: false
      });
      
      const template = await storage.createPromptTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid template data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Update template
  app.put("/api/prompt-templates/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Check if template exists and user owns it
      const existingTemplate = await storage.getPromptTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      if (existingTemplate.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this template" });
      }
      
      const updatedTemplate = await storage.updatePromptTemplate(id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Delete template
  app.delete("/api/prompt-templates/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Check if template exists and user owns it
      const existingTemplate = await storage.getPromptTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      if (existingTemplate.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this template" });
      }
      
      await storage.deletePromptTemplate(id);
      res.json({ success: true, message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // ============================================
  // GENERATION ENDPOINTS
  // ============================================

  // Generate prompt
  app.post("/api/prompt-generator/generate", async (req: Request, res: Response) => {
    try {
      const validatedData = generatePromptSchema.parse(req.body);
      const userId = (req.user as any)?.claims?.sub;
      
      // Simple server-side generation logic
      const generateSimplePrompt = (options: any) => {
        const template = DEFAULT_TEMPLATES.find(t => t.id === (options.template || "standard"));
        if (!template) {
          throw new Error("Template not found");
        }
        
        let prompt = template.format;
        const variables: Record<string, string> = {
          subject: options.subject || "a mystical scene",
          style: options.style || "digital art",
          lighting: options.lighting || "dramatic lighting",
          mood: options.mood || "mysterious",
          quality: options.quality || "high quality",
          character: options.character || "a mysterious figure",
          expression: options.expression || "thoughtful",
          background: options.background || "abstract background",
          camera_angle: options.camera_angle || "eye level",
          color_grading: options.color_grading || "cinematic",
          location: options.location || "fantasy landscape",
          time_of_day: options.time_of_day || "twilight",
          weather: options.weather || "clear",
          view: options.view || "wide angle",
          details: options.details || "highly detailed"
        };
        
        // Replace template variables
        Object.entries(variables).forEach(([key, value]) => {
          prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        
        // Add components if provided
        if (options.components) {
          const componentParts: string[] = [];
          Object.entries(options.components).forEach(([category, values]) => {
            if (Array.isArray(values) && values.length > 0) {
              componentParts.push(values.join(", "));
            }
          });
          if (componentParts.length > 0) {
            prompt += ", " + componentParts.join(", ");
          }
        }
        
        // Add custom prompt if provided
        if (options.custom) {
          prompt = options.custom + ", " + prompt;
        }
        
        // Generate negative prompt if enabled
        let negativePrompt = "";
        if (options.enableNegativePrompt !== false) {
          negativePrompt = "low quality, blurry, distorted, disfigured, bad anatomy, watermark, signature, text";
        }
        
        // Add quality presets
        if (options.qualityPresets && options.qualityPresets.length > 0) {
          const qualityMap: Record<string, string> = {
            high_quality: "masterpiece, best quality, highly detailed",
            ultra_detailed: "ultra-detailed, 8k, high resolution",
            photorealistic: "photorealistic, hyper-realistic, professional photography"
          };
          
          const qualityStrings = options.qualityPresets
            .map((preset: string) => qualityMap[preset] || preset)
            .filter(Boolean);
          
          if (qualityStrings.length > 0) {
            prompt += ", " + qualityStrings.join(", ");
          }
        }
        
        return {
          prompt,
          negativePrompt,
          template: options.template || "standard",
          seed: options.seed || Math.floor(Math.random() * 1000000)
        };
      };
      
      // Prepare options for generation
      const options: any = {
        custom: validatedData.custom,
        subject: validatedData.subject,
        gender: validatedData.gender,
        template: validatedData.template || "standard",
        enableRandomization: validatedData.enableRandomization ?? true,
        seed: validatedData.seed,
        enableNegativePrompt: validatedData.enableNegativePrompt ?? true,
        qualityPresets: validatedData.qualityPresets || ["high_quality"],
        maxComponentsPerCategory: validatedData.maxComponentsPerCategory || 3,
        components: validatedData.components
      };
      
      // Generate the prompt
      const result = generateSimplePrompt(options);
      
      // Save to history if user is authenticated
      if (userId) {
        try {
          await storage.createPromptGenerationHistory({
            userId,
            prompt: result.prompt,
            negativePrompt: result.negativePrompt,
            template: validatedData.template || "standard",
            options: options,
            metadata: {
              format: validatedData.format || "standard",
              timestamp: Date.now()
            }
          });
        } catch (historyError) {
          console.error("Failed to save to history:", historyError);
        }
      }
      
      res.json({
        prompt: result.prompt,
        negativePrompt: result.negativePrompt,
        template: result.template,
        metadata: {
          seed: result.seed,
          timestamp: Date.now(),
          format: validatedData.format || "standard"
        }
      });
    } catch (error) {
      console.error("Error generating prompt:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid generation options", details: error.errors });
      }
      res.status(500).json({ error: "Failed to generate prompt" });
    }
  });

  // Enhance prompt with AI
  app.post("/api/prompt-generator/enhance", async (req: Request, res: Response) => {
    try {
      const validatedData = enhancePromptSchema.parse(req.body);
      
      // Check if OpenAI is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "AI enhancement not available",
          message: "OpenAI API key not configured"
        });
      }
      
      // Use the existing enhance-prompt route logic if available
      // For now, return a mock enhanced version
      const enhancedPrompt = `${validatedData.prompt}, masterpiece, best quality, highly detailed, professional artwork`;
      
      res.json({
        original: validatedData.prompt,
        enhanced: enhancedPrompt,
        style: validatedData.style,
        model: validatedData.model,
        enhancementLevel: validatedData.enhancementLevel || "moderate"
      });
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid enhancement data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to enhance prompt" });
    }
  });

  // ============================================
  // HISTORY ENDPOINTS
  // ============================================

  // Get generation history
  app.get("/api/prompt-generator/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { limit = 50, offset = 0 } = req.query;
      
      const history = await storage.getPromptGenerationHistory({
        userId,
        limit: Number(limit),
        offset: Number(offset)
      });
      
      res.json({
        history,
        total: history.length,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Save to history
  app.post("/api/prompt-generator/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      const validatedData = historyItemSchema.parse(req.body);
      
      const historyItem = await storage.createPromptGenerationHistory({
        userId,
        prompt: validatedData.prompt,
        negativePrompt: validatedData.negativePrompt,
        template: validatedData.template,
        options: validatedData.options,
        metadata: {
          ...validatedData.metadata,
          timestamp: validatedData.timestamp || Date.now()
        }
      });
      
      res.json(historyItem);
    } catch (error) {
      console.error("Error saving to history:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid history data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save to history" });
    }
  });

  // Delete history item
  app.delete("/api/prompt-generator/history/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Verify ownership
      const historyItem = await storage.getPromptGenerationHistoryItem(id);
      if (!historyItem) {
        return res.status(404).json({ error: "History item not found" });
      }
      
      if (historyItem.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this item" });
      }
      
      await storage.deletePromptGenerationHistory(id);
      res.json({ success: true, message: "History item deleted" });
    } catch (error) {
      console.error("Error deleting history item:", error);
      res.status(500).json({ error: "Failed to delete history item" });
    }
  });

  // Clear all history
  app.delete("/api/prompt-generator/history/clear", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      await storage.clearPromptGenerationHistory(userId);
      res.json({ success: true, message: "History cleared" });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  // ============================================
  // PRESETS ENDPOINTS
  // ============================================

  // Get user presets
  app.get("/api/prompt-generator/presets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { limit = 100, offset = 0, isFavorite } = req.query;
      
      const presets = await storage.getUserPromptPresets({
        userId,
        limit: Number(limit),
        offset: Number(offset)
      });
      
      // Filter by favorite if requested
      let filteredPresets = presets;
      if (isFavorite !== undefined) {
        filteredPresets = presets.filter(p => p.isFavorite === (isFavorite === "true"));
      }
      
      res.json({
        presets: filteredPresets,
        total: filteredPresets.length,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      console.error("Error fetching presets:", error);
      res.status(500).json({ error: "Failed to fetch presets" });
    }
  });

  // Create preset
  app.post("/api/prompt-generator/presets", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      const validatedData = presetSchema.parse(req.body);
      
      const preset = await storage.createUserPromptPreset({
        userId,
        name: validatedData.name,
        description: validatedData.description,
        template: validatedData.template,
        options: validatedData.options,
        isFavorite: validatedData.isFavorite || false,
        tags: validatedData.tags || []
      });
      
      res.json(preset);
    } catch (error) {
      console.error("Error creating preset:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid preset data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create preset" });
    }
  });

  // Update preset
  app.put("/api/prompt-generator/presets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Verify ownership
      const existingPreset = await storage.getUserPromptPreset(id);
      if (!existingPreset) {
        return res.status(404).json({ error: "Preset not found" });
      }
      
      if (existingPreset.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this preset" });
      }
      
      const updatedPreset = await storage.updateUserPromptPreset(id, req.body);
      res.json(updatedPreset);
    } catch (error) {
      console.error("Error updating preset:", error);
      res.status(500).json({ error: "Failed to update preset" });
    }
  });

  // Delete preset
  app.delete("/api/prompt-generator/presets/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Verify ownership
      const existingPreset = await storage.getUserPromptPreset(id);
      if (!existingPreset) {
        return res.status(404).json({ error: "Preset not found" });
      }
      
      if (existingPreset.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this preset" });
      }
      
      await storage.deleteUserPromptPreset(id);
      res.json({ success: true, message: "Preset deleted" });
    } catch (error) {
      console.error("Error deleting preset:", error);
      res.status(500).json({ error: "Failed to delete preset" });
    }
  });

  // Toggle preset favorite
  app.post("/api/prompt-generator/presets/:id/favorite", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any).claims.sub;
      
      // Verify ownership
      const existingPreset = await storage.getUserPromptPreset(id);
      if (!existingPreset) {
        return res.status(404).json({ error: "Preset not found" });
      }
      
      if (existingPreset.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to modify this preset" });
      }
      
      const isFavorite = await storage.toggleUserPromptPresetFavorite(id);
      res.json({ success: true, isFavorite });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  // Export presets
  app.get("/api/prompt-generator/presets/export", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      
      const presets = await storage.getUserPromptPresets({ userId });
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="prompt-presets-${Date.now()}.json"`);
      res.json({
        version: "1.0",
        exportedAt: new Date().toISOString(),
        presets
      });
    } catch (error) {
      console.error("Error exporting presets:", error);
      res.status(500).json({ error: "Failed to export presets" });
    }
  });

  // Import presets
  app.post("/api/prompt-generator/presets/import", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { presets } = req.body;
      
      if (!Array.isArray(presets)) {
        return res.status(400).json({ error: "Invalid import data" });
      }
      
      const imported = [];
      const failed = [];
      
      for (const preset of presets) {
        try {
          const validatedPreset = presetSchema.parse(preset);
          const created = await storage.createUserPromptPreset({
            userId,
            ...validatedPreset
          });
          imported.push(created);
        } catch (err) {
          failed.push({ preset: preset.name || "Unknown", error: err.message });
        }
      }
      
      res.json({
        success: true,
        imported: imported.length,
        failed: failed.length,
        details: { imported, failed }
      });
    } catch (error) {
      console.error("Error importing presets:", error);
      res.status(500).json({ error: "Failed to import presets" });
    }
  });
}