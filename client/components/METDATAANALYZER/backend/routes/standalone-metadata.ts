import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractMetadataFromImage as extractImageMetadata, formatAspectRatio as formatMetadataForDisplay } from '../utils/image-metadata';

const router = express.Router();

// Configure multer for temporary file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'temp_metadata_analysis');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueName = `metadata-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|webp|bmp|tiff|tif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
});

// Standalone metadata analysis endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }
    
    const filePath = req.file.path;
    
    console.log(`[STANDALONE METADATA] Analyzing: ${req.file.originalname}`);
    
    // Extract comprehensive metadata
    const metadata = await extractImageMetadata(filePath);
    
    if (!metadata) {
      throw new Error('Failed to extract metadata from image');
    }
    
    // Format metadata for display
    const formattedMetadata = formatMetadataForDisplay(metadata);
    
    // Prepare response in the same structure as gallery metadata
    const response = {
      success: true,
      filename: req.file.originalname,
      filesize: req.file.size,
      analysis: {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imagePath: req.file.originalname,
        analysis: {
          description: '',
        },
        metadata: {
          imageGeneration: {
            width: metadata.width,
            height: metadata.height,
            format: path.extname(req.file.originalname).slice(1).toUpperCase(),
            source: metadata.ai_generation?.source || 'unknown',
            prompt: metadata.ai_generation?.prompt,
            negativePrompt: metadata.ai_generation?.negativePrompt,
            steps: metadata.ai_generation?.steps,
            cfgScale: metadata.ai_generation?.cfgScale,
            sampler: metadata.ai_generation?.sampler,
            seed: metadata.ai_generation?.seed,
            model: metadata.ai_generation?.model || metadata.ai_generation?.checkpoint,
            checkpoint: metadata.ai_generation?.checkpoint,
            fullParametersText: metadata.ai_generation?.fullParametersText,
            rawParameters: metadata.ai_generation?.rawParameters || {},
            version: metadata.ai_generation?.version,
            formattedMetadata: formattedMetadata
          },
          basic: {
            width: metadata.width,
            height: metadata.height,
            size: req.file.size,
            format: metadata.format,
            aspectRatio: metadata.aspectRatio,
            aspectRatioFormatted: metadata.aspectRatioFormatted,
            colorSpace: metadata.colorSpace,
            channels: metadata.channels,
            depth: metadata.depth,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha
          },
          exif: metadata.exif,
          raw: metadata.raw
        }
      },
      // AI-specific metadata for display compatibility
      is_ai_generated: metadata.ai_generation?.source !== 'unknown' && metadata.ai_generation?.source !== undefined,
      ai_generator_type: metadata.ai_generation?.source,
      prompt: metadata.ai_generation?.prompt,
      negative_prompt: metadata.ai_generation?.negativePrompt,
      steps: metadata.ai_generation?.steps,
      cfg_scale: metadata.ai_generation?.cfgScale,
      sampler: metadata.ai_generation?.sampler,
      scheduler: metadata.ai_generation?.scheduler,
      seed: metadata.ai_generation?.seed,
      seed_text: typeof metadata.ai_generation?.seed === 'string' ? metadata.ai_generation?.seed : undefined,
      checkpoint_model_name: metadata.ai_generation?.checkpoint || metadata.ai_generation?.model,
      
      // Midjourney specific fields
      mj_version: metadata.ai_generation?.mjVersion,
      mj_aspect_ratio: metadata.ai_generation?.mjAspectRatio,
      mj_chaos: metadata.ai_generation?.mjChaos,
      mj_quality: metadata.ai_generation?.mjQuality,
      mj_stylize: metadata.ai_generation?.mjStylize,
      mj_job_id: metadata.ai_generation?.mjJobId,
      mj_experimental: metadata.ai_generation?.mjExperimental,
      mj_omni_reference: metadata.ai_generation?.mjOmniReference,
      mj_style_references: metadata.ai_generation?.mjStyleReferences,
      mj_style_weight: metadata.ai_generation?.mjStyleWeight,
      mj_weirdness: metadata.ai_generation?.mjWeirdness,
      mj_image_weight: metadata.ai_generation?.mjImageWeight,
      mj_character_reference: metadata.ai_generation?.mjCharacterReference,
      mj_character_weight: metadata.ai_generation?.mjCharacterWeight,
      mj_omni_weight: metadata.ai_generation?.mjOmniWeight,
      mj_raw: metadata.ai_generation?.mjRaw,
      mj_author: metadata.ai_generation?.mjAuthor,
      
      // ComfyUI specific fields
      comfy_node_count: metadata.ai_generation?.rawParameters?.comfyNodeCount,
      comfy_workflow_id: metadata.ai_generation?.rawParameters?.comfyWorkflowId,
      comfy_workflow_data: metadata.ai_generation?.rawParameters?.workflow,
      workflow_data: metadata.ai_generation?.rawParameters?.workflow,
      
      // Stable Diffusion extended fields
      sd_vae: metadata.ai_generation?.vae,
      sd_clip_skip: metadata.ai_generation?.clipSkip,
      sd_hires_fix: metadata.ai_generation?.hiresSteps > 0,
      
      // Basic image properties for compatibility
      width: metadata.width,
      height: metadata.height,
      
      // Complete metadata object for advanced use
      complete_metadata: metadata
    };

    console.log(`[STANDALONE METADATA] Analysis complete for: ${req.file.originalname}`);
    console.log(`[STANDALONE METADATA] AI Generated: ${response.is_ai_generated}, Generator: ${response.ai_generator_type}`);
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
      // Continue anyway, this is not critical
    }
    
    res.json(response);
    
  } catch (error: any) {
    console.error('[STANDALONE METADATA] Error analyzing image:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error during metadata analysis' 
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Standalone metadata analyzer is running',
    timestamp: new Date().toISOString()
  });
});

export default router;