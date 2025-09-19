// Client-side vision service that connects directly to the Florence-2 server
// This bypasses server-side IP restrictions from LocalTunnel

const VISION_SERVER_URL = 'https://elitevision.loca.lt';

export interface VisionAnalysisResult {
  caption: string;
  model: string;
  timestamp: string;
  metadata?: any;
}

/**
 * Analyze image directly from the browser
 * This avoids LocalTunnel IP blocking issues
 */
export async function analyzeImageDirect(
  imageBase64: string,
  options: {
    prompt?: string;
    captionStyle?: string;
    captionLength?: string;
  } = {}
): Promise<VisionAnalysisResult> {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Prepare payload
    const payload = {
      image: cleanBase64,
      ...(options.prompt && { prompt: options.prompt })
    };
    
    console.log('🔍 Analyzing image with Florence-2...');
    
    // Make request directly from browser
    const response = await fetch(`${VISION_SERVER_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Vision server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      caption: data.caption,
      model: data.model || 'Florence-2',
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: data.metadata
    };
  } catch (error: any) {
    console.error('Vision analysis error:', error);
    throw error;
  }
}

/**
 * Test if the vision server is accessible from the browser
 */
export async function testVisionServerDirect(): Promise<boolean> {
  try {
    const response = await fetch(`${VISION_SERVER_URL}/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Vision server test failed:', error);
    return false;
  }
}