import axios from 'axios';
import fs from 'fs';

interface CustomVisionOptions {
  prompt?: string;
}

interface CustomVisionResult {
  caption: string;
  model: string;
  timestamp: string;
  metadata?: any;
}

// Custom Vision Server configuration - Using stable LocalTunnel URL
const VISION_SERVER_URL = "https://elitevision.loca.lt";

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
  imagePath: string,
  options: CustomVisionOptions = {}
): Promise<CustomVisionResult> {
  try {
    // First check if server is online
    const serverStatus = await testCustomVisionServer();
    if (!serverStatus.isOnline) {
      throw new Error(`Custom Vision server is offline: ${serverStatus.error}`);
    }
    
    // Read image file and convert to base64
    let imageBase64: string;
    
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      imageBase64 = imageBuffer.toString('base64');
    } else {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    // Prepare request payload
    const payload: any = {
      image: imageBase64
    };
    
    if (options.prompt) {
      payload.prompt = options.prompt;
    }
    
    console.log('🔍 Sending request to Custom Vision server...');
    
    // Send request to custom vision server
    const response = await axios.post(`${VISION_SERVER_URL}/caption`, payload, {
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
 * Update the vision server URL (now stable with LocalTunnel)
 */
export function updateCustomVisionServerUrl(newUrl: string): void {
  // With LocalTunnel, URL stays consistent as https://elitevision.loca.lt
  console.log(`⚠️ Custom Vision server URL update requested: ${newUrl}`);
  console.log('Note: With LocalTunnel, the URL remains stable at https://elitevision.loca.lt');
}