import { Request, Response } from "express";
import { IStorage } from "../storage";

// Default templates
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
  },
];

export function promptTemplateRoutes(app: any, storage: IStorage) {
  // Get all templates
  app.get("/api/prompt-templates", async (req: Request, res: Response) => {
    try {
      // For now, return default templates
      // In the future, merge with user-created templates from database
      res.json(DEFAULT_TEMPLATES);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get single template
  app.get("/api/prompt-templates/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const template = DEFAULT_TEMPLATES.find(t => t.id === id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Create custom template (authenticated only)
  app.post("/api/prompt-templates", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const template = {
        ...req.body,
        id: `custom-${Date.now()}`,
        isCustom: true,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
      };
      
      // TODO: Save to database
      // For now, just return the created template
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Update custom template (owner only)
  app.patch("/api/prompt-templates/:id", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { id } = req.params;
      
      // Check if template exists and user owns it
      // TODO: Implement database check
      
      const updatedTemplate = {
        ...req.body,
        id,
        updatedAt: new Date().toISOString(),
      };
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  // Delete custom template (owner only)
  app.delete("/api/prompt-templates/:id", async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { id } = req.params;
      
      // Check if template is custom and user owns it
      // TODO: Implement database check
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
}