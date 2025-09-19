import axios from 'axios';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

interface CustomVisionOptions {
  prompt?: string;
  captionStyle?: string;
  captionLength?: string;
}

interface CustomVisionResult {
  caption: string;
  model: string;
  timestamp: string;
  metadata?: any;
  confidence?: number;
  serverOnline?: boolean;
}

// Custom Vision Server configuration - Using stable LocalTunnel URL
const VISION_SERVER_URL = process.env.CUSTOM_VISION_URL || "https://elitevision.loca.lt";

/**
 * Test if the custom vision server is reachable
 */
export async function testCustomVisionServer(): Promise<{ isOnline: boolean; details?: any; error?: string }> {
  try {
    const response = await axios.get(`${VISION_SERVER_URL}/test`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Elite-Vision-Client/1.0'
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
  try {
    // First check if server is online
    const serverStatus = await testCustomVisionServer();
    if (!serverStatus.isOnline) {
      throw new Error(`Custom Vision server is offline: ${serverStatus.error}`);
    }
    
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
      image: imageBase64,
      model: 'florence-2'
    };
    
    if (options.prompt) {
      payload.prompt = options.prompt;
    }
    if (options.captionStyle) {
      payload.caption_style = options.captionStyle;
    }
    if (options.captionLength) {
      payload.caption_length = options.captionLength;
    }
    
    console.log('🔍 Sending request to Custom Vision server...');
    
    // Send request to custom vision server
    const response = await axios.post(`${VISION_SERVER_URL}/analyze`, payload, {
      timeout: 30000, // 30 second timeout for processing
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Elite-Vision-Client/1.0'
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
    console.log('Custom Vision failed, trying fallback...', error.message);
    debugInfo.push({
      stage: 'Vision Analysis',
      model: 'Florence-2',
      timestamp: new Date().toISOString(),
      serverStatus: 'offline',
      error: error.message,
      success: false
    });
  }
  
  // Fallback to JoyCaption (placeholder - needs actual implementation)
  try {
    console.log('Attempting JoyCaption fallback...');
    // This would be the actual JoyCaption API call
    // For now, return a fallback message
    debugInfo.push({
      stage: 'Vision Analysis',
      model: 'JoyCaption',
      timestamp: new Date().toISOString(),
      serverStatus: 'attempting',
      success: false
    });
  } catch (error: any) {
    console.log('JoyCaption failed, trying GPT-4o...', error.message);
    debugInfo.push({
      stage: 'Vision Analysis', 
      model: 'JoyCaption',
      timestamp: new Date().toISOString(),
      serverStatus: 'offline',
      error: error.message,
      success: false
    });
  }
  
  // Final fallback to GPT-4o (using OpenAI Vision API)
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
    
    switch (captionStyle) {
      case 'Descriptive':
        userPrompt = "Provide a detailed, comprehensive description of this image including subjects, environment, lighting, mood, and artistic style.";
        break;
      case 'Short':
        userPrompt = "Provide a concise description of the key elements in this image.";
        break;
      case 'Keywords':
        userPrompt = "List the most important keywords and tags that describe this image, separated by commas.";
        break;
      case 'Technical':
        userPrompt = "Describe this image with technical photography details including composition, lighting setup, camera settings, and post-processing style.";
        break;
    }
    
    if (customPrompt) {
      userPrompt = customPrompt;
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
                url: image,
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