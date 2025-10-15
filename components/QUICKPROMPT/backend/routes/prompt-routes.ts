import express from "express";
import { storage } from "../storage";
import { z } from "zod";

const router = express.Router();

// ========== SAVED PROMPTS API ==========

// Get all saved prompts
router.get("/saved-prompts", async (req, res) => {
  try {
    const prompts = await storage.getAllSavedPrompts();
    res.json(prompts);
  } catch (error) {
    console.error("Error fetching saved prompts:", error);
    res.status(500).json({ error: "Failed to fetch saved prompts" });
  }
});

// Get saved prompt by ID
router.get("/saved-prompts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const prompt = await storage.getSavedPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    
    res.json(prompt);
  } catch (error) {
    console.error("Error fetching saved prompt:", error);
    res.status(500).json({ error: "Failed to fetch saved prompt" });
  }
});

// Create a new saved prompt
router.post("/saved-prompts", async (req, res) => {
  try {
    const { name, positive_prompt, negative_prompt, tags, promptStyle } = req.body;
    
    if (!name || !positive_prompt) {
      return res.status(400).json({ error: "Name and positive prompt are required" });
    }
    
    const newPrompt = await storage.createSavedPrompt({
      name,
      positive_prompt,
      negative_prompt: negative_prompt || "",
      tags: tags || [],
      promptStyle: promptStyle || ""
    });
    
    res.status(201).json(newPrompt);
  } catch (error) {
    console.error("Error creating saved prompt:", error);
    res.status(500).json({ error: "Failed to create saved prompt" });
  }
});

// Update a saved prompt
router.put("/saved-prompts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const { name, positive_prompt, negative_prompt, tags, promptStyle } = req.body;
    
    if (!name || !positive_prompt) {
      return res.status(400).json({ error: "Name and positive prompt are required" });
    }
    
    const updatedPrompt = await storage.updateSavedPrompt(id, {
      name,
      positive_prompt,
      negative_prompt: negative_prompt || "",
      tags: tags || [],
      promptStyle: promptStyle || ""
    });
    
    if (!updatedPrompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    
    res.json(updatedPrompt);
  } catch (error) {
    console.error("Error updating saved prompt:", error);
    res.status(500).json({ error: "Failed to update saved prompt" });
  }
});

// Delete a saved prompt
router.delete("/saved-prompts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const success = await storage.deleteSavedPrompt(id);
    if (!success) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting saved prompt:", error);
    res.status(500).json({ error: "Failed to delete saved prompt" });
  }
});

// Soft delete (move to trash)
router.post("/saved-prompts/:id/soft-delete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const updatedPrompt = await storage.updateSavedPrompt(id, {
      is_deleted: true,
      deleted_at: new Date()
    });
    
    if (!updatedPrompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    
    res.json({ message: "Prompt moved to trash" });
  } catch (error) {
    console.error(`Error soft deleting prompt ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to move prompt to trash" });
  }
});

// Get trash items
router.get("/saved-prompts/trash", async (req, res) => {
  try {
    const trashedPrompts = await storage.getTrashedPrompts();
    res.json(trashedPrompts);
  } catch (error) {
    console.error("Error fetching trashed prompts:", error);
    res.status(500).json({ error: "Failed to fetch trashed prompts" });
  }
});

// Download prompt as JSON
router.get("/saved-prompts/:id/download", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const prompt = await storage.getSavedPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    
    const downloadData = {
      name: prompt.name,
      description: prompt.description,
      positive_prompt: prompt.positive_prompt,
      negative_prompt: prompt.negative_prompt,
      tags: prompt.tags,
      created_at: prompt.created_at,
      exported_at: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${prompt.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json"`);
    res.json(downloadData);
  } catch (error) {
    console.error("Error downloading prompt:", error);
    res.status(500).json({ error: "Failed to download prompt" });
  }
});

// Share prompt to shared library
router.post("/saved-prompts/:id/share", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }
    
    const { title, description, category_id, tags, folder_id, example_images } = req.body;
    
    // Validate required fields
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    // Get the original prompt
    const originalPrompt = await storage.getSavedPromptById(id);
    if (!originalPrompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    
    // Validate that original prompt has content (required by schema)
    if (!originalPrompt.positive_prompt || originalPrompt.positive_prompt.trim().length === 0) {
      return res.status(400).json({ error: "Original prompt has no content to share" });
    }

    // Get user information for sharing
    // In development, use email. In production, get from authenticated user
    let sharingUser = "dev@example.com";
    let sharingUserId = "40785157";
    
    // TODO: In production, get from authenticated user:
    // const authUser = req.user;
    // if (authUser && authUser.claims) {
    //   sharingUserId = authUser.claims.sub;
    //   sharingUser = authUser.claims.email || `User-${sharingUserId}`;
    // }

    // Create shared prompt data with proper null handling
    const sharedPromptData = {
      title: title.trim(),
      prompt: originalPrompt.positive_prompt.trim(),
      negative_prompt: originalPrompt.negative_prompt?.trim() || null,
      description: description?.trim() || null,
      category_id: category_id || null,
      tags: Array.isArray(tags) ? tags : [],
      user_id: sharingUserId,
      author: sharingUser, // Store the username/email for display
      source_prompt_id: id,
      visibility: "public" as const,
      views: 0,
      featured: false,
      example_images: Array.isArray(example_images) ? example_images : []
    };
    
    // Create the shared prompt
    const sharedPrompt = await storage.createSharedPrompt(sharedPromptData);
    
    res.status(201).json({
      message: "Prompt shared successfully",
      sharedPrompt
    });
  } catch (error) {
    console.error("Error sharing prompt:", error);
    
    // Handle specific database constraint errors
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      return res.status(409).json({ error: "This prompt has already been shared" });
    }
    
    // Handle empty string constraint errors
    if (error.message?.includes('empty string') || error.message?.includes('not-null')) {
      return res.status(400).json({ error: "Required fields cannot be empty" });
    }
    
    res.status(500).json({ error: "Failed to share prompt" });
  }
});

// ========== PROMPT LIBRARY API ==========

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

// ========== PROMPT FOLDERS API ==========

// Get all prompt folders
router.get("/prompt-folders", async (req, res) => {
  try {
    const folders = await storage.getAllPromptFolders();
    res.json(folders);
  } catch (error) {
    console.error("Error fetching prompt folders:", error);
    res.status(500).json({ error: "Failed to fetch prompt folders" });
  }
});

// Create a new prompt folder
router.post("/prompt-folders", async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Folder name is required" });
    }
    
    const newFolder = await storage.createPromptFolder({
      name,
      description: description || ""
    });
    
    res.status(201).json(newFolder);
  } catch (error) {
    console.error("Error creating prompt folder:", error);
    res.status(500).json({ error: "Failed to create prompt folder" });
  }
});

// Update a prompt folder
router.put("/prompt-folders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }
    
    const { name, description } = req.body;
    
    const updatedFolder = await storage.updatePromptFolder(id, {
      name,
      description
    });
    
    if (!updatedFolder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    
    res.json(updatedFolder);
  } catch (error) {
    console.error("Error updating prompt folder:", error);
    res.status(500).json({ error: "Failed to update prompt folder" });
  }
});

// Delete a prompt folder
router.delete("/prompt-folders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }
    
    const success = await storage.deletePromptFolder(id);
    if (!success) {
      return res.status(404).json({ error: "Folder not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting prompt folder:", error);
    res.status(500).json({ error: "Failed to delete prompt folder" });
  }
});

// ========== PROMPT TAGS API ==========

// Get all prompt tags
router.get("/prompt-tags", async (req, res) => {
  try {
    const tags = await storage.getAllPromptTags();
    res.json(tags);
  } catch (error) {
    console.error("Error fetching prompt tags:", error);
    res.status(500).json({ error: "Failed to fetch prompt tags" });
  }
});

// Create a new prompt tag
router.post("/prompt-tags", async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Tag name is required" });
    }
    
    const newTag = await storage.createPromptTag({
      name,
      color: color || "#3b82f6"
    });
    
    res.status(201).json(newTag);
  } catch (error) {
    console.error("Error creating prompt tag:", error);
    res.status(500).json({ error: "Failed to create prompt tag" });
  }
});

// Update a prompt tag
router.put("/prompt-tags/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid tag ID" });
    }
    
    const { name, color } = req.body;
    
    const updatedTag = await storage.updatePromptTag(id, {
      name,
      color
    });
    
    if (!updatedTag) {
      return res.status(404).json({ error: "Tag not found" });
    }
    
    res.json(updatedTag);
  } catch (error) {
    console.error("Error updating prompt tag:", error);
    res.status(500).json({ error: "Failed to update prompt tag" });
  }
});

// Delete a prompt tag
router.delete("/prompt-tags/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid tag ID" });
    }
    
    const success = await storage.deletePromptTag(id);
    if (!success) {
      return res.status(404).json({ error: "Tag not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting prompt tag:", error);
    res.status(500).json({ error: "Failed to delete prompt tag" });
  }
});

// ========== ADMIN-ONLY SHARED PROMPTS API ==========

// Admin-only: Update a shared prompt
router.put("/shared/:id", async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has admin role
    const user = await storage.getUser(userId);
    const hasAdminRole = user?.roles?.some(role => 
      role.role_name === 'System Administrator' || 
      role.role_name === 'system_administrator'
    );
    
    if (!hasAdminRole) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }

    const { title, prompt, negative_prompt, description, tags, category_id } = req.body;
    
    if (!title || !prompt) {
      return res.status(400).json({ error: "Title and prompt are required" });
    }

    const updatedPrompt = await storage.updateSharedPrompt(id, {
      title,
      prompt,
      negative_prompt,
      description,
      tags,
      category_id
    });

    if (!updatedPrompt) {
      return res.status(404).json({ error: "Shared prompt not found" });
    }

    res.json(updatedPrompt);
  } catch (error) {
    console.error("Error updating shared prompt:", error);
    res.status(500).json({ error: "Failed to update shared prompt" });
  }
});

// Admin-only: Delete a shared prompt
router.delete("/shared/:id", async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user has admin role
    const user = await storage.getUser(userId);
    const hasAdminRole = user?.roles?.some(role => 
      role.role_name === 'System Administrator' || 
      role.role_name === 'system_administrator'
    );
    
    if (!hasAdminRole) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid prompt ID" });
    }

    const success = await storage.deleteSharedPrompt(id);
    if (!success) {
      return res.status(404).json({ error: "Shared prompt not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting shared prompt:", error);
    res.status(500).json({ error: "Failed to delete shared prompt" });
  }
});

export default router;