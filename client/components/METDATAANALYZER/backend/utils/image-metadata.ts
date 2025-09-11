/**
 * Image Metadata Extraction Utilities
 * 
 * Functions for extracting comprehensive metadata from image files.
 */

import sharp from 'sharp';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import { extractComfyUIWorkflow } from './png-chunk-reader';
import { Readable } from 'stream';
import ExifReader from 'exif-reader';
import { exec } from 'child_process';
import { promisify } from 'util';
import { UnifiedAIDetector } from './unified-ai-detector';

const execAsync = promisify(exec);

/**
 * Comprehensive metadata interface for image files
 */
export interface ImageMetadata {
  // Basic image properties
  width?: number;
  height?: number;
  size?: number;
  dimensionString?: string;
  aspectRatio?: number;
  aspectRatioFormatted?: string;
  formattedSize?: string;
  
  // Format information
  format?: string;
  formatDetails?: string;
  colorSpace?: string;
  channels?: number;
  depth?: string;
  colorDepth?: string;
  density?: number;
  resolutionX?: number;
  resolutionY?: number;
  dpiFormatted?: string;
  resolutionUnit?: string;
  isProgressive?: boolean;
  hasProfile?: boolean;
  hasAlpha?: boolean;
  isTransparent?: boolean;
  
  // Physical dimensions
  physicalDimX?: number;
  physicalDimY?: number;
  physicalDimUnit?: string;
  physicalDimensionsFormatted?: string;
  
  // File system information
  fileInfo?: {
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    formattedFileSize?: string;
    fileExtension?: string;
    mimeType?: string;
    creationDate?: string;
    modifiedDate?: string;
    accessDate?: string;
    lastStatusChange?: string;
    filePermissions?: string;
    deviceId?: number;
    inodeNumber?: number;
    numberOfHardLinks?: number;
    blockSize?: number;
    blocks?: number;
    checksum?: string;
    [key: string]: any;
  };
  
  // EXIF data
  exif?: {
    camera?: string;
    make?: string;
    model?: string;
    software?: string;
    orientation?: string;
    taken_at?: string;
    exposure?: string;
    aperture?: string;
    iso?: string;
    focal_length?: string;
    [key: string]: any;
  };
  
  // Location data
  location?: {
    latitude?: number;
    longitude?: number;
    place_name?: string;
    [key: string]: any;
  };
  
  // Raw EXIF data
  rawExif?: {
    [key: string]: any;
  };
  
  // AI generation data
  ai_generation?: {
    source?: 'stable-diffusion' | 'comfyui' | 'midjourney' | 'dall-e' | 'unknown';
    prompt?: string;
    negativePrompt?: string;
    model?: string;
    sampler?: string;
    steps?: number;
    cfgScale?: number;
    seed?: number | string;
    checkpoint?: string;
    vae?: string;
    hiresSteps?: number;
    hiresUpscale?: number;
    clipSkip?: number;
    version?: string;
    rawParameters?: Record<string, any>;
    fullParametersText?: string;
    
    // Midjourney specific
    mjVersion?: string;
    mjJobId?: string;
    mjAspectRatio?: string;
    mjChaos?: number;
    mjQuality?: number;
    mjStylize?: number;
    mjStyle?: string;
    mjSeed?: string;
    mjStyleReferences?: string[];
    mjStyleWeight?: number;
    mjProfile?: string;
    mjRaw?: boolean;
    mjExperimental?: number;
    mjOmniReference?: string;
    mjWeirdness?: number;
    mjImageWeight?: number;
    mjCharacterReference?: string;
    mjCharacterWeight?: number;
    mjOmniWeight?: number;
    mjAuthor?: string;
    
    [key: string]: any;
  };
  
  // Color information
  color_info?: {
    is_grayscale?: boolean;
    bit_depth?: number | null;
    [key: string]: any;
  };
  
  // Creation information
  creation_info?: {
    created_at?: string;
    modified_at?: string;
    created_with?: string;
    [key: string]: any;
  };
  
  // Raw metadata
  raw?: any;
}

/**
 * Main metadata extraction function
 */
export async function extractMetadataFromImage(filePath: string): Promise<ImageMetadata | null> {
  try {
    console.log(`[METADATA EXTRACTOR] Starting analysis: ${path.basename(filePath)}`);
    
    const metadata: ImageMetadata = {};
    
    // Get basic image metadata using Sharp
    const sharpMetadata = await getBasicImageMetadata(filePath);
    Object.assign(metadata, sharpMetadata);
    
    // Try to detect AI source and extract AI-specific metadata
    const aiDetectionResult = await detectAISource(filePath);
    if (aiDetectionResult && aiDetectionResult.source !== 'unknown') {
      metadata.ai_generation = {
        source: aiDetectionResult.source,
        confidence: aiDetectionResult.confidence,
        ...aiDetectionResult.metadata
      };
    }
    
    // Extract EXIF data if available
    const exifData = await extractEXIFData(filePath);
    if (exifData && Object.keys(exifData).length > 0) {
      metadata.exif = exifData;
    }
    
    console.log(`[METADATA EXTRACTOR] Analysis complete: ${path.basename(filePath)}`);
    
    return metadata;
    
  } catch (error) {
    console.error(`[METADATA EXTRACTOR] Error analyzing ${filePath}:`, error);
    return null;
  }
}

/**
 * Get basic image metadata using Sharp
 */
async function getBasicImageMetadata(filePath: string): Promise<Partial<ImageMetadata>> {
  try {
    const sharpInstance = sharp(filePath);
    const sharpMetadata = await sharpInstance.metadata();
    const stats = fs.statSync(filePath);
    
    const metadata: Partial<ImageMetadata> = {
      width: sharpMetadata.width,
      height: sharpMetadata.height,
      format: sharpMetadata.format,
      colorSpace: sharpMetadata.space,
      channels: sharpMetadata.channels,
      depth: sharpMetadata.depth,
      density: sharpMetadata.density,
      hasAlpha: sharpMetadata.hasAlpha,
      size: stats.size,
      aspectRatio: sharpMetadata.width && sharpMetadata.height ? sharpMetadata.width / sharpMetadata.height : undefined
    };
    
    // Format derived fields
    if (metadata.width && metadata.height) {
      metadata.dimensionString = `${metadata.width} × ${metadata.height}`;
      metadata.aspectRatioFormatted = formatAspectRatio(metadata.aspectRatio || 1);
    }
    
    if (metadata.size) {
      metadata.formattedSize = formatBytes(metadata.size);
    }
    
    return metadata;
    
  } catch (error) {
    console.error('Error extracting basic metadata:', error);
    return {};
  }
}

/**
 * Detect AI source using unified AI detector
 */
async function detectAISource(filePath: string): Promise<any> {
  try {
    console.log(`[AI DETECTOR] Analyzing: ${path.basename(filePath)}`);
    
    // Use ExifTool to extract metadata
    let rawMetadata: any = {};
    try {
      const { stdout } = await execAsync(`exiftool -j "${filePath}"`);
      const metadata = JSON.parse(stdout);
      rawMetadata = Array.isArray(metadata) ? metadata[0] : metadata;
    } catch (error) {
      console.warn('[AI DETECTOR] ExifTool extraction failed:', error);
    }
    
    // Midjourney detection with comprehensive patterns
    const mjResult = await detectMidjourney(filePath, rawMetadata);
    if (mjResult) {
      console.log('[AI DETECTOR] Midjourney detected');
      return mjResult;
    }
    
    // ComfyUI detection
    const comfyResult = await detectComfyUI(filePath, rawMetadata);
    if (comfyResult) {
      console.log('[AI DETECTOR] ComfyUI detected');
      return comfyResult;
    }
    
    // Stable Diffusion detection
    const sdResult = await detectStableDiffusion(filePath, rawMetadata);
    if (sdResult) {
      console.log('[AI DETECTOR] Stable Diffusion detected');
      return sdResult;
    }
    
    return { source: 'unknown', confidence: 0, metadata: {} };
    
  } catch (error) {
    console.error(`[AI DETECTOR] Error:`, error);
    return { source: 'unknown', confidence: 0, metadata: {} };
  }
}

/**
 * Enhanced Midjourney detection
 */
async function detectMidjourney(filePath: string, rawMetadata: any) {
  const filename = path.basename(filePath);
  
  // Check PNG Description field
  const description = rawMetadata['Description'] || rawMetadata['PNG:Description'] || '';
  
  if (description) {
    console.log('[DEBUG] PNG Description found (full):', description);
    console.log('[DEBUG] PNG Description length:', description.length);
    
    // Look for Midjourney patterns in description
    if (description.match(/--v\s+\d+|--chaos\s+\d+|--ar\s+\d+:\d+|Job ID:/)) {
      console.log('[DEBUG] Midjourney detected via PNG Description');
      
      const metadata = extractMidjourneyParameters(description);
      
      return {
        source: 'midjourney',
        confidence: 0.85,
        metadata
      };
    }
  }
  
  // Check filename patterns
  if (filename.match(/^u\d+_.*_[a-f0-9-]{36}_\d+/)) {
    return {
      source: 'midjourney',
      confidence: 0.8,
      metadata: { mjAuthor: extractUsernameFromFilename(filename) }
    };
  }
  
  return null;
}

/**
 * Extract Midjourney parameters from description
 */
function extractMidjourneyParameters(description: string) {
  const metadata: any = {};
  
  // Extract prompt (everything before parameters or Job ID)
  const promptMatch = description.match(/^(.*?)(?:\s--|\sJob ID:|$)/);
  if (promptMatch && promptMatch[1].trim()) {
    metadata.prompt = promptMatch[1].trim();
    console.log('[DEBUG] Extracted prompt:', metadata.prompt.substring(0, 100) + '...');
  }
  
  // Extract version
  const versionMatch = description.match(/--v\s+(\d+(?:\.\d+)?)/);
  if (versionMatch) {
    metadata.mjVersion = versionMatch[1];
    console.log('[DEBUG] Extracted version:', metadata.mjVersion);
  }
  
  // Extract aspect ratio
  const arMatch = description.match(/--ar\s+(\d+:\d+)/);
  if (arMatch) {
    metadata.mjAspectRatio = arMatch[1];
    console.log('[DEBUG] Extracted aspect ratio:', metadata.mjAspectRatio);
  }
  
  // Extract chaos
  const chaosMatch = description.match(/--chaos\s+(\d+)/);
  if (chaosMatch) {
    metadata.mjChaos = parseInt(chaosMatch[1]);
    console.log('[DEBUG] Extracted chaos:', metadata.mjChaos);
  }
  
  // Extract experimental
  const expMatch = description.match(/--exp\s+(\d+)/);
  if (expMatch) {
    metadata.mjExperimental = parseInt(expMatch[1]);
    console.log('[DEBUG] Extracted experimental:', metadata.mjExperimental);
  }
  
  // Extract omni reference
  const orefMatch = description.match(/--oref\s+([^\s]+)/);
  if (orefMatch) {
    metadata.mjOmniReference = orefMatch[1];
    console.log('[DEBUG] Extracted omni reference:', metadata.mjOmniReference);
  }
  
  // Extract style raw
  if (description.includes('--style raw')) {
    metadata.mjRaw = true;
    console.log('[DEBUG] Extracted raw flag:', metadata.mjRaw);
  }
  
  // Extract Job ID
  const jobIdMatch = description.match(/Job ID:\s*([a-f0-9-]+)/i);
  if (jobIdMatch) {
    metadata.mjJobId = jobIdMatch[1];
    console.log('[DEBUG] Extracted job ID:', metadata.mjJobId);
  }
  
  // Extract quality
  const qualityMatch = description.match(/--q(?:uality)?\s+(\d+(?:\.\d+)?)/);
  if (qualityMatch) {
    metadata.mjQuality = parseFloat(qualityMatch[1]);
  }
  
  // Extract weirdness
  const weirdMatch = description.match(/--(?:weird|w)\s+(\d+)/);
  if (weirdMatch) {
    metadata.mjWeirdness = parseInt(weirdMatch[1]);
  }
  
  // Extract style weight
  const swMatch = description.match(/--sw\s+(\d+(?:\.\d+)?)/);
  if (swMatch) {
    metadata.mjStyleWeight = parseFloat(swMatch[1]);
  }
  
  // Extract image weight
  const iwMatch = description.match(/--iw\s+(\d+(?:\.\d+)?)/);
  if (iwMatch) {
    metadata.mjImageWeight = parseFloat(iwMatch[1]);
  }
  
  // Extract character weight
  const cwMatch = description.match(/--cw\s+(\d+(?:\.\d+)?)/);
  if (cwMatch) {
    metadata.mjCharacterWeight = parseFloat(cwMatch[1]);
  }
  
  // Extract omni weight
  const owMatch = description.match(/--ow\s+(\d+(?:\.\d+)?)/);
  if (owMatch) {
    metadata.mjOmniWeight = parseFloat(owMatch[1]);
  }
  
  // Extract character reference
  const crefMatch = description.match(/--cref\s+([^\s]+)/);
  if (crefMatch) {
    metadata.mjCharacterReference = crefMatch[1];
  }
  
  // Extract style references
  const srefMatch = description.match(/--sref\s+([^\-]+?)(?:\s--|\s*$)/);
  if (srefMatch) {
    metadata.mjStyleReferences = srefMatch[1].trim().split(/\s+/);
  }
  
  return metadata;
}

/**
 * Extract username from Midjourney filename
 */
function extractUsernameFromFilename(filename: string): string | undefined {
  const usernameMatch = filename.match(/^u(\d+)_/);
  if (usernameMatch) {
    return `u${usernameMatch[1]}`;
  }
  return undefined;
}

/**
 * ComfyUI detection
 */
async function detectComfyUI(filePath: string, rawMetadata: any) {
  // Check for ComfyUI workflow in PNG chunks
  try {
    const workflowData = extractComfyUIWorkflow(filePath);
    if (workflowData) {
      return {
        source: 'comfyui',
        confidence: 0.9,
        metadata: {
          workflow: workflowData,
          rawParameters: { workflow: workflowData }
        }
      };
    }
  } catch (error) {
    console.error('Error parsing ComfyUI workflow:', error);
  }
  
  // Check filename and metadata
  const filename = path.basename(filePath).toLowerCase();
  if (filename.includes('comfyui')) {
    return {
      source: 'comfyui',
      confidence: 0.7,
      metadata: {}
    };
  }
  
  return null;
}

/**
 * Stable Diffusion detection
 */
async function detectStableDiffusion(filePath: string, rawMetadata: any) {
  const parametersText = rawMetadata['Parameters'] || rawMetadata['Description'] || '';
  
  if (parametersText.toLowerCase().includes('stable diffusion') ||
      parametersText.includes('Steps:') ||
      parametersText.includes('CFG scale:')) {
    
    const metadata = extractStableDiffusionParameters(parametersText);
    
    return {
      source: 'stable-diffusion',
      confidence: 0.8,
      metadata
    };
  }
  
  return null;
}

/**
 * Extract Stable Diffusion parameters
 */
function extractStableDiffusionParameters(parametersText: string) {
  const metadata: any = {};
  
  // Extract prompt
  const promptMatch = parametersText.match(/^(.*?)(?:Negative prompt:|Steps:|$)/s);
  if (promptMatch) {
    metadata.prompt = promptMatch[1].trim();
  }
  
  // Extract negative prompt
  const negPromptMatch = parametersText.match(/Negative prompt:\s*(.*?)(?:Steps:|$)/s);
  if (negPromptMatch) {
    metadata.negativePrompt = negPromptMatch[1].trim();
  }
  
  // Extract steps
  const stepsMatch = parametersText.match(/Steps:\s*(\d+)/i);
  if (stepsMatch) {
    metadata.steps = parseInt(stepsMatch[1]);
  }
  
  // Extract CFG scale
  const cfgMatch = parametersText.match(/CFG scale:\s*([\d.]+)/i);
  if (cfgMatch) {
    metadata.cfgScale = parseFloat(cfgMatch[1]);
  }
  
  // Extract seed
  const seedMatch = parametersText.match(/Seed:\s*(\d+)/i);
  if (seedMatch) {
    metadata.seed = seedMatch[1];
  }
  
  // Extract sampler
  const samplerMatch = parametersText.match(/Sampler:\s*([^\n,]+)/i);
  if (samplerMatch) {
    metadata.sampler = samplerMatch[1].trim();
  }
  
  // Extract model
  const modelMatch = parametersText.match(/Model:\s*([^\n,]+)/i);
  if (modelMatch) {
    metadata.checkpoint = modelMatch[1].trim();
  }
  
  return metadata;
}

/**
 * Extract EXIF data
 */
async function extractEXIFData(filePath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`exiftool -j "${filePath}"`);
    const metadata = JSON.parse(stdout);
    const exifData = Array.isArray(metadata) ? metadata[0] : metadata;
    
    // Filter out non-EXIF fields
    const filteredExif: any = {};
    for (const [key, value] of Object.entries(exifData)) {
      if (key.startsWith('EXIF:') || 
          key.includes('Camera') || 
          key.includes('Lens') ||
          ['Make', 'Model', 'DateTime', 'ExposureTime', 'FNumber', 'ISO'].includes(key)) {
        filteredExif[key] = value;
      }
    }
    
    return filteredExif;
    
  } catch (error) {
    console.warn('EXIF extraction failed:', error);
    return {};
  }
}

/**
 * Utility functions
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatAspectRatio(ratio: number): string {
  if (!ratio || !isFinite(ratio)) return '1:1';
  
  // Common aspect ratios
  const commonRatios: [number, string][] = [
    [1, '1:1'],
    [4/3, '4:3'],
    [3/2, '3:2'],
    [16/9, '16:9'],
    [21/9, '21:9'],
    [9/16, '9:16'],
    [2/3, '2:3'],
    [3/4, '3:4']
  ];
  
  // Find closest common ratio
  for (const [commonRatio, label] of commonRatios) {
    if (Math.abs(ratio - commonRatio) < 0.1) {
      return label;
    }
  }
  
  // Return calculated ratio
  if (ratio > 1) {
    return `${ratio.toFixed(1)}:1`;
  } else {
    return `1:${(1/ratio).toFixed(1)}`;
  }
}

/**
 * Format metadata for display in UI
 */
export function formatMetadataForDisplay(metadata: ImageMetadata | null): string {
  if (!metadata) return "No metadata available";
  
  const sections: string[] = [];
  
  // Basic image information
  const basicInfo: string[] = [];
  if (metadata.dimensionString) basicInfo.push(`Dimensions: ${metadata.dimensionString}`);
  if (metadata.aspectRatioFormatted) basicInfo.push(`Aspect Ratio: ${metadata.aspectRatioFormatted}`);
  if (metadata.formattedSize) basicInfo.push(`File Size: ${metadata.formattedSize}`);
  if (metadata.format) basicInfo.push(`Format: ${metadata.format.toUpperCase()}`);
  if (metadata.colorSpace) basicInfo.push(`Color Space: ${metadata.colorSpace}`);
  
  if (basicInfo.length > 0) {
    sections.push("Image Information:\n" + basicInfo.join("\n"));
  }
  
  // AI Generation information if available
  if (metadata.ai_generation && metadata.ai_generation.source !== 'unknown') {
    const aiInfo: string[] = [];
    aiInfo.push(`AI Tool: ${metadata.ai_generation.source}`);
    if (metadata.ai_generation.prompt) {
      aiInfo.push(`Prompt: ${metadata.ai_generation.prompt.substring(0, 200)}${metadata.ai_generation.prompt.length > 200 ? '...' : ''}`);
    }
    if (metadata.ai_generation.mjVersion) {
      aiInfo.push(`Version: ${metadata.ai_generation.mjVersion}`);
    }
    
    if (aiInfo.length > 0) {
      sections.push("AI Generation Information:\n" + aiInfo.join("\n"));
    }
  }
  
  return sections.join("\n\n");
}