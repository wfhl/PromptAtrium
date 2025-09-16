import express from 'express';
import { enhancePromptWithLLM, llmEnhancementSchema } from '../services/llmService';
import { aiChatCompletion } from '../utils/ai-api-fallback';

const router = express.Router();

// POST /api/generate-prompt-metadata
// Generate intelligent title and description for prompts using AI
router.post('/generate-prompt-metadata', async (req, res) => {
  try {
    const { prompt, characterPreset, templateName } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const metadataPrompt = `Analyze this AI image generation prompt and create a concise title and description:

Prompt: "${prompt}"
Character Preset: ${characterPreset || "None"}
Template: ${templateName || "Custom"}

Generate:
1. A short, descriptive title (3-6 words) that captures the main subject and scene
2. A brief description (15-25 words) that summarizes the key elements and style

Respond in JSON format:
{
  "title": "...",
  "description": "..."
}`;

    const response = await aiChatCompletion({
      prompt: metadataPrompt,
      systemMessage: 'You are a helpful assistant that analyzes AI image prompts and generates concise, descriptive titles and descriptions. Always respond with valid JSON.',
      maxTokens: 150,
      temperature: 0.7
    });

    const content = response.content;
    
    if (!content) {
      throw new Error('No content received from AI service');
    }

    const metadata = JSON.parse(content);
    res.json(metadata);
    
  } catch (error) {
    console.error("Error generating prompt metadata:", error);
    res.status(500).json({ error: "Failed to generate metadata" });
  }
});

// POST /api/ai/enhance-prompt
// Generate title, description, and tags for a prompt using OpenAI
router.post('/ai/enhance-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const enhancementPrompt = `Analyze this AI image generation prompt and create metadata:

Prompt: "${prompt}"

Generate a JSON response with:
1. A concise title (3-8 words) capturing the main subject/scene
2. A brief description (15-30 words) summarizing key elements and style
3. An array of 3-6 relevant tags for categorization

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing AI image prompts and generating concise, descriptive metadata. Always respond with valid JSON containing title, description, and tags.'
          },
          {
            role: 'user',
            content: enhancementPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const metadata = JSON.parse(content);
    res.json(metadata);
    
  } catch (error) {
    console.error("Error enhancing prompt with AI:", error);
    res.status(500).json({ error: "Failed to enhance prompt with AI" });
  }
});

// POST /api/enhance-prompt
// Enhance a prompt using LLM with template-specific settings
router.post('/enhance-prompt', async (req, res) => {
  try {
    console.log('📝 Prompt enhancement request received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Has image?', 'image' in req.body);
    if (req.body.image) {
      console.log('Image length:', req.body.image.length);
      console.log('Image preview:', req.body.image.substring(0, 50));
    }
    
    // Validate the request body
    const validationResult = llmEnhancementSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      console.error('❌ Request validation failed:', validationResult.error);
      return res.status(400).json({
        error: 'Invalid request format',
        details: validationResult.error.errors
      });
    }

    const request = validationResult.data;
    console.log(`🚀 Processing enhancement with ${request.llmProvider} ${request.llmModel}`);
    console.log(`📸 Image in request:`, request.image ? `Yes, ${request.image.length} chars` : 'No');
    
    // Track timing for diagnostics
    const startTime = Date.now();
    
    try {
      // Call the LLM service to enhance the prompt
      const enhancedPrompt = await enhancePromptWithLLM(request);
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Enhancement completed in ${responseTime}ms`);
      
      // Prepare response with diagnostics
      const response = {
        originalPrompt: request.prompt,
        enhancedPrompt: enhancedPrompt,
        historyId: `enhancement_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        diagnostics: {
          apiProvider: request.llmProvider,
          modelUsed: request.llmModel,
          fallbackUsed: false,
          templateSource: 'database',
          responseTime: responseTime,
          timestamp: new Date().toISOString(),
          dbConnectionStatus: 'connected',
          llmParams: {
            provider: request.llmProvider,
            model: request.llmModel,
            useHappyTalk: request.useHappyTalk,
            compressPrompt: request.compressPrompt,
            compressionLevel: request.compressionLevel,
            masterPromptLength: request.customBasePrompt?.length || 0,
          }
        }
      };

      // Note: Negative prompts are handled separately in the UI

      res.json(response);
      
    } catch (enhancementError: any) {
      console.error('❌ LLM enhancement failed:', enhancementError);
      
      const responseTime = Date.now() - startTime;
      
      // Return fallback response with error diagnostics
      const fallbackResponse = {
        originalPrompt: request.prompt,
        enhancedPrompt: request.prompt, // Fallback to original
        historyId: `enhancement_error_${Date.now()}`,
        diagnostics: {
          apiProvider: request.llmProvider,
          modelUsed: request.llmModel,
          fallbackUsed: true,
          templateSource: 'fallback',
          responseTime: responseTime,
          timestamp: new Date().toISOString(),
          dbConnectionStatus: 'failed',
          llmParams: {
            provider: request.llmProvider,
            model: request.llmModel,
            useHappyTalk: request.useHappyTalk,
            compressPrompt: request.compressPrompt,
            compressionLevel: request.compressionLevel,
            masterPromptLength: request.customBasePrompt?.length || 0,
          },
          errors: [{
            type: 'LLM Enhancement Error',
            message: enhancementError.message || 'Enhancement service unavailable',
            handledBy: 'enhance-prompt-api'
          }]
        }
      };

      res.status(200).json(fallbackResponse); // Return 200 with error info for graceful handling
    }
    
  } catch (error: any) {
    console.error('💥 Server error in prompt enhancement:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process enhancement request',
      details: error.message
    });
  }
});

// Helper function to generate negative prompts for Stable Diffusion
function generateNegativePrompt(): string {
  const negativeElements = [
    'low quality',
    'worst quality', 
    'blurry',
    'bad anatomy',
    'bad hands',
    'missing fingers',
    'extra fingers',
    'deformed',
    'distorted',
    'disfigured',
    'poorly drawn',
    'bad proportions',
    'malformed limbs'
  ];
  
  return negativeElements.join(', ');
}

// GET /api/enhanced-rule-templates
// Fetch available Enhanced Rule Templates for prompt enhancement
router.get('/enhanced-rule-templates', async (req, res) => {
  try {
    console.log('📋 Enhanced Rule Templates request received');
    const { storage } = await import('../storage');
    const templates = await storage.getEnhancedRuleTemplates();
    
    console.log(`✅ Found ${templates.length} Enhanced Rule Templates`);
    res.json(templates);
  } catch (error) {
    console.error('❌ Error fetching Enhanced Rule Templates:', error);
    res.status(500).json({ error: 'Failed to fetch Enhanced Rule Templates' });
  }
});

export default router;