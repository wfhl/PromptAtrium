import express from 'express';
import axios from 'axios';

const router = express.Router();

// Vision server configuration
const VISION_SERVER_URL = process.env.CUSTOM_VISION_URL || 'https://elitevision.loca.lt';

/**
 * POST /api/vision-proxy/analyze
 * Proxy endpoint to relay requests to Florence-2 vision server
 * This provides a more stable connection path
 */
router.post('/analyze', async (req, res) => {
  try {
    const { image, prompt } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image provided' 
      });
    }
    
    console.log('🔄 Proxying request to Florence-2 server...');
    
    // Prepare payload
    const payload: any = { image };
    if (prompt) {
      payload.prompt = prompt;
    }
    
    // Attempt with multiple retry strategies
    let lastError = null;
    const strategies = [
      {
        name: 'Direct with origin headers',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Elite-Vision-Client/1.0',
          'ngrok-skip-browser-warning': 'true',
          'Origin': 'https://elitedashboard.replit.app',
          'Referer': 'https://elitedashboard.replit.app/'
        }
      },
      {
        name: 'No origin headers',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      {
        name: 'Minimal headers',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ];
    
    for (const strategy of strategies) {
      try {
        console.log(`📡 Trying strategy: ${strategy.name}`);
        
        const response = await axios.post(
          `${VISION_SERVER_URL}/analyze`,
          payload,
          {
            timeout: 30000,
            headers: strategy.headers,
            validateStatus: (status) => status < 500 // Accept 4xx as valid responses
          }
        );
        
        if (response.status === 200 && response.data.caption) {
          console.log('✅ Florence-2 proxy successful');
          return res.json({
            success: true,
            caption: response.data.caption,
            model: response.data.model || 'Florence-2',
            metadata: {
              strategy: strategy.name,
              serverUrl: VISION_SERVER_URL,
              ...response.data
            }
          });
        } else if (response.status === 503) {
          lastError = 'Server temporarily unavailable (503)';
          continue;
        } else {
          return res.status(response.status).json({
            success: false,
            error: `Server returned status ${response.status}`,
            data: response.data
          });
        }
      } catch (error: any) {
        console.log(`Strategy "${strategy.name}" failed:`, error.message);
        lastError = error.message;
        
        // Check for LocalTunnel specific error
        if (error.response?.headers?.['x-localtunnel-status'] === 'Tunnel Unavailable') {
          console.log('LocalTunnel is down, trying next strategy...');
        }
      }
    }
    
    // All strategies failed
    res.status(503).json({
      success: false,
      error: 'Vision server unavailable after trying all connection strategies',
      details: lastError,
      suggestion: 'The Florence-2 server may be offline or the tunnel connection is interrupted'
    });
    
  } catch (error: any) {
    console.error('Vision proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to proxy request'
    });
  }
});

/**
 * GET /api/vision-proxy/health
 * Check if the vision server is accessible
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${VISION_SERVER_URL}/test`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Elite-Vision-Client/1.0'
      },
      validateStatus: () => true // Accept any status
    });
    
    res.json({
      success: response.status === 200,
      status: response.status,
      serverUrl: VISION_SERVER_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      serverUrl: VISION_SERVER_URL,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;