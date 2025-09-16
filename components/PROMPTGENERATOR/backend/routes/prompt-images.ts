import { Request, Response } from 'express';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { isAuthenticated } from '../middleware/dev-bypass';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'prompt-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload example image for a prompt
 * POST /api/prompts/:id/images/upload
 */
export async function uploadPromptImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.claims?.sub || '1';
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get the prompt to check ownership and current images
    const prompt = await storage.getSavedPromptById(parseInt(id));
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Check if user owns this prompt
    // Convert both to strings for comparison to handle type mismatches
    const promptCreatedBy = String(prompt.created_by);
    const currentUserId = String(userId);
    
    const isAuthorized = promptCreatedBy === currentUserId || 
                        (currentUserId === 'dev-user' && process.env.NODE_ENV === 'development') ||
                        (currentUserId === '1' && process.env.NODE_ENV === 'development'); // Dev user with ID 1
    
    if (!isAuthorized) {
      console.log('Authorization check failed:', {
        promptCreatedBy,
        currentUserId,
        env: process.env.NODE_ENV
      });
      return res.status(403).json({ error: 'Not authorized to modify this prompt' });
    }

    // Check if already at 3 image limit
    const currentImages = prompt.example_images || [];
    if (currentImages.length >= 3) {
      return res.status(400).json({ error: 'Maximum 3 images allowed per prompt' });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, req.file.buffer);

    // Update prompt with new image URL
    const imageUrl = `/uploads/prompt-images/${fileName}`;
    const updatedImages = [...currentImages, imageUrl];
    
    await storage.updateSavedPrompt(parseInt(id), {
      example_images: updatedImages
    });

    res.json({
      success: true,
      imageUrl,
      totalImages: updatedImages.length
    });

  } catch (error) {
    console.error('Error uploading prompt image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

/**
 * Delete example image from a prompt
 * DELETE /api/prompts/:id/images/:imageIndex
 */
export async function deletePromptImage(req: Request, res: Response) {
  try {
    const { id, imageIndex } = req.params;
    const userId = req.user?.id || req.user?.claims?.sub || '1';
    
    const imageIdx = parseInt(imageIndex);
    if (isNaN(imageIdx) || imageIdx < 0) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    // Get the prompt to check ownership and current images
    const prompt = await storage.getSavedPromptById(parseInt(id));
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Check if user owns this prompt
    // Convert both to strings for comparison to handle type mismatches
    const promptCreatedBy = String(prompt.created_by);
    const currentUserId = String(userId);
    
    const isAuthorized = promptCreatedBy === currentUserId || 
                        (currentUserId === 'dev-user' && process.env.NODE_ENV === 'development') ||
                        (currentUserId === '1' && process.env.NODE_ENV === 'development'); // Dev user with ID 1
    
    if (!isAuthorized) {
      console.log('Authorization check failed in delete:', {
        promptCreatedBy,
        currentUserId,
        env: process.env.NODE_ENV
      });
      return res.status(403).json({ error: 'Not authorized to modify this prompt' });
    }

    const currentImages = prompt.example_images || [];
    if (imageIdx >= currentImages.length) {
      return res.status(400).json({ error: 'Image index out of range' });
    }

    // Get the image URL to delete the file
    const imageUrl = currentImages[imageIdx];
    const fileName = path.basename(imageUrl);
    const filePath = path.join(uploadsDir, fileName);

    // Remove image from array
    const updatedImages = currentImages.filter((_, index) => index !== imageIdx);
    
    // Update prompt in database
    await storage.updateSavedPrompt(parseInt(id), {
      example_images: updatedImages
    });

    // Delete file from disk (if it exists)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn('Could not delete image file:', fileError);
      // Continue anyway since DB was updated
    }

    res.json({
      success: true,
      deletedImageUrl: imageUrl,
      totalImages: updatedImages.length
    });

  } catch (error) {
    console.error('Error deleting prompt image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
}

/**
 * Get all images for a prompt
 * GET /api/prompts/:id/images
 */
export async function getPromptImages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const prompt = await storage.getSavedPromptById(parseInt(id));
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json({
      images: prompt.example_images || [],
      totalImages: (prompt.example_images || []).length
    });

  } catch (error) {
    console.error('Error fetching prompt images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
}

// Export the multer middleware for use in routes
export const uploadMiddleware = upload.single('image');