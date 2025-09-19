import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

// Custom Vision Server configuration
const VISION_SERVER_URL = process.env.CUSTOM_VISION_URL || "https://elitevision.loca.lt";

// Custom Vision interfaces
export interface CustomVisionOptions {
  prompt?: string;
  customPrompt?: string;
  captionStyle?: string;
  captionLength?: string;
}

export interface CustomVisionResult {
  caption: string;
  model: string;
  timestamp: string;
  confidence?: number;
  serverOnline?: boolean;
  metadata?: any;
}

/**
 * Test if the custom vision server is online
 */
export async function testCustomVisionServer(): Promise<{ isOnline: boolean; details?: any; error?: string }> {
  try {
    const response = await axios.get(`${VISION_SERVER_URL}/test`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://elitedashboard.replit.app',
        'Referer': 'https://elitedashboard.replit.app/'
      }
    });
    
    if (response.status === 200) {
      return { isOnline: true, details: response.data };
    } else {
      return { isOnline: false, error: `Server returned status ${response.status}` };
    }
  } catch (error: any) {
    console.log('Custom Vision server offline:', error.message);
    return { 
      isOnline: false, 
      error: error.code === 'ECONNABORTED' ? 'Connection timeout' : error.message 
    };
  }
}

/**
 * Get caption for an image using the custom Florence-2 server
 */
export async function analyzeImageWithCustomVision(
  imageData: string | Buffer,
  options: CustomVisionOptions = {}
): Promise<CustomVisionResult> {
  // Handle both file path and base64 data
  let imageBase64: string;
  
  if (typeof imageData === 'string') {
    // Check if it's a file path or base64 data
    if (imageData.startsWith('data:image')) {
      // Extract base64 from data URL
      imageBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    } else if (fs.existsSync(imageData)) {
      // Read file and convert to base64
      const imageBuffer = fs.readFileSync(imageData);
      imageBase64 = imageBuffer.toString('base64');
    } else {
      // Assume it's already base64
      imageBase64 = imageData;
    }
  } else {
    // Buffer provided
    imageBase64 = imageData.toString('base64');
  }
  
  // Prepare request payload
  const payload: any = {
    image: imageBase64
  };
  
  if (options.prompt || options.customPrompt) {
    payload.prompt = options.prompt || options.customPrompt;
  }
  
  console.log('🔍 Sending request to Custom Vision server...');
  
  try {
    // Send request to custom vision server with headers that LocalTunnel expects
    const response = await axios.post(`${VISION_SERVER_URL}/analyze`, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://elitedashboard.replit.app',
        'Referer': 'https://elitedashboard.replit.app/'
      }
    });
    
    if (response.status === 200 && response.data.caption) {
      console.log('✅ Custom Vision response received');
      
      return {
        caption: response.data.caption,
        model: response.data.model || 'Florence-2',
        timestamp: new Date().toISOString(),
        confidence: response.data.confidence || 0.95,
        serverOnline: true,
        metadata: {
          customVisionServer: true,
          serverUrl: VISION_SERVER_URL,
          processingTime: response.headers['x-processing-time'],
          ...response.data
        }
      };
    } else {
      throw new Error(`Invalid response from server: ${JSON.stringify(response.data)}`);
    }
    
  } catch (error: any) {
    console.error('Custom Vision server error:', error.message);
    
    // Check if it's a LocalTunnel 503 error
    if (error.response?.status === 503) {
      const isTunnelDown = error.response?.headers?.['x-localtunnel-status'] === 'Tunnel Unavailable';
      if (isTunnelDown) {
        throw new Error('Florence-2 vision server is temporarily unavailable (LocalTunnel down).');
      }
    }
    
    // Provide detailed error information
    if (error.code === 'ECONNABORTED') {
      throw new Error('Custom Vision server timeout - processing took too long');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Custom Vision server URL not found - check LocalTunnel connection');
    } else if (error.response) {
      throw new Error(`Custom Vision server error: ${error.response.status} - ${error.response.data || error.response.statusText}`);
    } else {
      throw error;
    }
  }
}

/**
 * Analyze image with fallback to other vision services
 */
export async function analyzeImageWithFallback(
  imageData: string | Buffer,
  options: CustomVisionOptions = {}
): Promise<CustomVisionResult> {
  const debugInfo: any[] = [];
  
  // Try Custom Vision Server first
  try {
    console.log('Attempting Custom Vision Server (Florence-2)...');
    const result = await analyzeImageWithCustomVision(imageData, options);
    debugInfo.push({
      stage: 'Vision Analysis',
      model: 'Florence-2',
      timestamp: new Date().toISOString(),
      serverStatus: 'online',
      success: true
    });
    return { ...result, debugInfo };
  } catch (error: any) {
    console.log('Custom Vision failed:', error.message);
    debugInfo.push({
      stage: 'Vision Analysis',
      model: 'Florence-2',
      timestamp: new Date().toISOString(),
      serverStatus: 'offline',
      error: error.message,
      success: false
    });
    
    // Check if it's a LocalTunnel unavailable error
    if (error.message.includes('LocalTunnel down') || error.message.includes('temporarily unavailable')) {
      // Return error without fallback for LocalTunnel issues
      return {
        caption: `Vision service temporarily unavailable. The Florence-2 server connection is interrupted. Please try again in a moment or check server status.`,
        model: 'error',
        timestamp: new Date().toISOString(),
        serverOnline: false,
        metadata: { 
          debugInfo,
          error: 'LocalTunnel unavailable',
          suggestion: 'The vision server is temporarily down. This is often a transient issue that resolves quickly.'
        }
      };
    }
  }
  
  // Check if GPT-4o fallback is explicitly disabled or not configured
  const allowGPTFallback = process.env.ALLOW_GPT_FALLBACK !== 'false';
  
  if (!allowGPTFallback) {
    console.log('GPT-4o fallback is disabled per configuration');
    return {
      caption: 'Vision analysis unavailable. Florence-2 server is not responding and GPT-4o fallback is disabled.',
      model: 'none',
      timestamp: new Date().toISOString(),
      serverOnline: false,
      metadata: { 
        debugInfo,
        error: 'All vision services unavailable',
        note: 'GPT-4o fallback is disabled to avoid censorship'
      }
    };
  }
  
  // Only use GPT-4o as absolute last resort for non-LocalTunnel errors
  console.log('Warning: Using GPT-4o Vision as fallback (may have content restrictions)...');
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Attempting GPT-4o Vision fallback...');
    
    const openai = new OpenAI({ apiKey });
    
    // Create appropriate prompt based on caption style
    let systemPrompt = "You are an expert at analyzing images for AI image generation.";
    let userPrompt = "Analyze this image and provide a detailed description suitable for recreating it with AI.";
    
    const captionStyle = options.captionStyle;
    const customPrompt = options.customPrompt;
    const captionLength = options.captionLength;
    
    switch (captionStyle) {
      case 'Descriptive':
        userPrompt = "Describe this image in detail, including all visual elements, colors, composition, and mood.";
        break;
      case 'Technical':
        userPrompt = "Provide a technical analysis of this image including camera settings, lighting, composition techniques, and production details.";
        break;
      case 'Artistic':
        userPrompt = "Describe this image with focus on artistic style, emotional impact, symbolism, and creative techniques.";
        break;
      case 'Minimal':
        userPrompt = "Provide a concise, essential description of the main subject and key elements.";
        break;
    }
    
    if (customPrompt) {
      userPrompt = customPrompt;
    }
    
    // Convert image to format OpenAI expects
    let imageUrl: string;
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image')) {
        // Already a data URL
        imageUrl = imageData;
      } else if (fs.existsSync(imageData)) {
        // File path - read and convert
        const imageBuffer = fs.readFileSync(imageData);
        const base64 = imageBuffer.toString('base64');
        imageUrl = `data:image/jpeg;base64,${base64}`;
      } else {
        // Assume base64
        imageUrl = `data:image/jpeg;base64,${imageData}`;
      }
    } else {
      // Buffer - convert to data URL
      const base64 = imageData.toString('base64');
      imageUrl = `data:image/jpeg;base64,${base64}`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: captionLength === 'long' ? 500 : captionLength === 'short' ? 150 : 300
    });
    
    const caption = response.choices[0]?.message?.content || "Failed to generate caption";
    
    debugInfo.push({
      stage: 'Vision Analysis',
      model: 'GPT-4o Vision',
      timestamp: new Date().toISOString(),
      serverStatus: 'online',
      captionLength: caption.length,
      success: true
    });
    
    return {
      caption: caption.trim(),
      model: 'gpt-4o-vision',
      timestamp: new Date().toISOString(),
      serverOnline: true,
      metadata: { 
        debugInfo,
        fallbackUsed: true,
        provider: 'openai'
      }
    };
  } catch (gpt4Error: any) {
    console.error('GPT-4o Vision fallback failed:', gpt4Error.message);
    debugInfo.push({
      stage: 'Vision Analysis',
      model: 'GPT-4o Vision',
      timestamp: new Date().toISOString(),
      serverStatus: 'failed',
      error: gpt4Error.message,
      success: false
    });
    
    // Final fallback message if all services fail
    return {
      caption: "Image analysis failed. All vision services are currently unavailable. Please try again later or check API configurations.",
      model: 'fallback',
      timestamp: new Date().toISOString(),
      serverOnline: false,
      metadata: { 
        debugInfo,
        error: 'All vision services failed'
      }
    };
  }
}

/**
 * Update the vision server URL (now stable with LocalTunnel)
 */
export function updateCustomVisionServerUrl(newUrl: string): void {
  // With LocalTunnel, URL stays consistent as https://elitevision.loca.lt
  console.log(`⚠️ Custom Vision server URL update requested: ${newUrl}`);
  console.log('Note: With LocalTunnel, the URL remains stable at https://elitevision.loca.lt');
  // Could update environment variable if needed
  process.env.CUSTOM_VISION_URL = newUrl;
}