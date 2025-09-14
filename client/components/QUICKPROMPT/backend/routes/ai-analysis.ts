/**
 * AI Analysis Routes
 * Provides endpoints for AI-powered image and prompt analysis
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { analyzeImage, extractStructuredDataFromImage, enhancePrompt } from '../utils/openai';

// Configure multer for temporary file storage
const upload = multer({ 
  dest: 'temp_uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Setup router
const router = express.Router();

/**
 * Helper to convert file to base64
 */
function fileToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.toString('base64'));
    });
  });
}

/**
 * Analyze an image using OpenAI Vision
 */
router.post('/analyze-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Optional params
    const prompt = req.body.prompt || "Analyze this image in detail and describe what you see.";
    
    // Get file path from multer
    const filePath = req.file.path;
    
    // Convert to base64
    const base64Image = await fileToBase64(filePath);
    
    // Call OpenAI API
    const analysis = await analyzeImage(base64Image, prompt);
    
    // Clean up temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image', details: (error as Error).message });
  }
});

/**
 * Extract structured metadata from an image
 */
router.post('/extract-metadata', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get extraction parameters
    const extractionPrompt = req.body.extractionPrompt || 
      "Extract the following metadata from this image: subject matter, main colors, style, mood, lighting, and composition. Format as JSON.";
    
    // Get file path from multer
    const filePath = req.file.path;
    
    // Convert to base64
    const base64Image = await fileToBase64(filePath);
    
    // Call OpenAI API for structured data extraction
    const metadata = await extractStructuredDataFromImage(base64Image, extractionPrompt);
    
    // Clean up temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
    res.json({ metadata });
  } catch (error) {
    console.error('Error extracting metadata:', error);
    res.status(500).json({ error: 'Failed to extract metadata', details: (error as Error).message });
  }
});

/**
 * Enhance a prompt for image generation
 */
router.post('/enhance-prompt', express.json(), async (req: Request, res: Response) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }
    
    // Call OpenAI API to enhance the prompt
    const enhancedPrompt = await enhancePrompt(prompt, options);
    
    res.json({ 
      original: prompt,
      enhanced: enhancedPrompt
    });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    res.status(500).json({ error: 'Failed to enhance prompt', details: (error as Error).message });
  }
});

/**
 * Get available AI models and capabilities
 */
router.get('/capabilities', (req: Request, res: Response) => {
  res.json({
    available: true,
    models: [
      {
        id: "gpt-4o",
        capabilities: ["image_analysis", "prompt_enhancement", "metadata_extraction"],
        maxTokens: 4096,
        default: true
      }
    ],
    imageAnalysisEnabled: true,
    promptEnhancementEnabled: true,
    metadataExtractionEnabled: true
  });
});

export default router;