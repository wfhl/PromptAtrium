import express from 'express';
import { aiChatCompletion } from '../utils/ai-api-fallback';
import { generatePromptMetadata } from '../services/llmService';

/**
 * Extract key concept/idea from a full image analysis
 * Used for templates that expect brief concepts instead of full analysis
 */
function extractConceptFromAnalysis(analysis: string): string {
  // If the analysis contains specific sections, extract key elements
  const lowerAnalysis = analysis.toLowerCase();
  
  // Look for character/subject descriptions
  const characterMatch = analysis.match(/character[:\s]*([^.]+\.)/i);
  const subjectMatch = analysis.match(/subject[:\s]*([^.]+\.)/i);
  const figureMatch = analysis.match(/figure[:\s]*([^.]+\.)/i);
  
  // Look for clothing/attire
  const clothingMatch = analysis.match(/(?:clothing|attire|wearing)[:\s]*([^.]+\.)/i);
  
  // Look for style descriptions
  const styleMatch = analysis.match(/(?:style|artistic style)[:\s]*([^.]+\.)/i);
  
  // Look for setting/environment
  const settingMatch = analysis.match(/(?:setting|environment|background)[:\s]*([^.]+\.)/i);
  
  // Build a concise concept from extracted elements
  let concept = "";
  
  // Primary subject
  if (characterMatch) concept += characterMatch[1].trim() + " ";
  else if (subjectMatch) concept += subjectMatch[1].trim() + " ";
  else if (figureMatch) concept += figureMatch[1].trim() + " ";
  
  // Clothing if found
  if (clothingMatch) concept += clothingMatch[1].trim() + " ";
  
  // Setting if found
  if (settingMatch) concept += "In " + settingMatch[1].trim() + " ";
  
  // Style if found
  if (styleMatch) concept += "Style: " + styleMatch[1].trim();
  
  // If we couldn't extract specific elements, create a simple summary
  if (!concept.trim()) {
    // Take first 2-3 sentences that contain key descriptive words
    const sentences = analysis.split(/[.!?]+/).filter(s => s.trim());
    const descriptiveSentences = sentences.filter(s => 
      s.match(/\b(character|person|figure|woman|man|scene|wearing|style|portrait|composition)\b/i)
    ).slice(0, 2);
    
    if (descriptiveSentences.length > 0) {
      concept = descriptiveSentences.join('. ').trim() + '.';
    } else {
      // Fallback: use first meaningful sentence
      concept = sentences.find(s => s.length > 20) || "Artistic composition with dynamic elements";
    }
  }
  
  // Clean up and limit length
  concept = concept.replace(/\s+/g, ' ').trim();
  if (concept.length > 200) {
    concept = concept.substring(0, 197) + '...';
  }
  
  return concept;
}

const router = express.Router();

// POST /api/generate-prompt-metadata
// Generate title and tags for a prompt using AI
router.post('/generate-prompt-metadata', async (req, res) => {
  try {
    console.log('📝 Prompt metadata generation request received');
    
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const metadata = await generatePromptMetadata(prompt);

    console.log('📝 Metadata generation response:', metadata);
    
    res.json(metadata);
  } catch (error) {
    console.error('Error generating prompt metadata:', error);
    res.status(500).json({ 
      error: 'Failed to generate metadata',
      title: "Generated Prompt",
      tags: ["ai", "generated"]
    });
  }
});

// POST /api/enhance-prompt-fixed
// Enhance a prompt using AI with template system integration
router.post('/enhance-prompt-fixed', async (req, res) => {
  try {
    console.log('📝 Prompt enhancement request received');
    
    const { 
      prompt, 
      llmProvider = 'openai', 
      llmModel = 'gpt-4o',
      customBasePrompt,
      templateId,
      useHappyTalk = false,
      compressPrompt = false,
      compressionLevel = 5,
      debugReport: incomingDebugReport = [],
      forceProvider,
      subject,
      character
    } = req.body;

    // Debug logging to trace master prompt handling
    console.log('🔍 Backend Debug - Request Analysis:');
    console.log('Template ID:', templateId);
    console.log('Custom Base Prompt Length:', customBasePrompt?.length || 0);
    console.log('Custom Base Prompt Preview:', customBasePrompt?.substring(0, 100) + '...');
    console.log('Has Custom Base Prompt:', !!customBasePrompt);
    console.log('Subject:', subject);
    console.log('Character:', character);
    console.log('Request Body Keys:', Object.keys(req.body));
    
    // Add incoming request details to debug report
    const incomingRequestDetails = {
      stage: 'Incoming Request Analysis',
      timestamp: new Date().toISOString(),
      requestDetails: {
        templateId,
        customBasePromptProvided: !!customBasePrompt,
        customBasePromptLength: customBasePrompt?.length || 0,
        customBasePromptPreview: customBasePrompt?.substring(0, 100) + '...',
        llmProvider,
        llmModel,
        promptLength: prompt?.length || 0
      }
    };
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        success: false
      });
    }

    // ALWAYS use the database master prompt - no fallbacks allowed
    if (!customBasePrompt || !customBasePrompt.trim()) {
      return res.status(400).json({
        error: 'Template master prompt is required. The frontend must provide customBasePrompt from database template.',
        success: false,
        debug: {
          templateId,
          customBasePromptProvided: !!customBasePrompt,
          customBasePromptLength: customBasePrompt?.length || 0
        }
      });
    }

    console.log(`✅ Using database master prompt for template: ${templateId}`);
    const systemMessage = customBasePrompt.trim();
    
    // For templates that expect a concept/idea instead of full analysis, extract key elements
    let enhancementPrompt;
    if (templateId && (templateId.includes('flux-prompt-pro') || templateId.includes('pipeline'))) {
      // Extract key elements from the analysis
      const extractedConcept = extractConceptFromAnalysis(prompt);
      console.log('Extracted concept for template:', extractedConcept);
      enhancementPrompt = extractedConcept;
    } else {
      // For other templates, apply formatting to the full content
      enhancementPrompt = `Apply your formatting rules to the following content, Do not include any explanations or supplemental remarks, Focus on delivering high-quality prompts without extra commentary.`;
      
      // Add character and subject replacement instructions if provided
      if (character) {
        enhancementPrompt += `\nPlease replace the character in the description with "${character}".`;
      }
      if (subject) {
        enhancementPrompt += `\nPlease also apply this subject "${subject}" to the following description.`;
      }
      
      // Clean up <s></s> tags from the prompt content
      const cleanedPrompt = prompt.replace(/<\/?s>/g, '');
      
      enhancementPrompt += `\n\nContent to enhance: ${cleanedPrompt}`;
    }

    // Apply happy talk enhancement if requested
    if (useHappyTalk) {
      enhancementPrompt += ' Focus on positive, uplifting language and beautiful imagery.';
    }

    // Apply compression if requested
    if (compressPrompt) {
      const compressionLevels = {
        1: 'slightly more concise',
        2: 'more concise', 
        3: 'concise',
        4: 'very concise',
        5: 'extremely concise'
      };
      const compressionLevel_clamped = Math.min(Math.max(compressionLevel, 1), 5);
      enhancementPrompt += ` Make the result ${compressionLevels[compressionLevel_clamped]}.`;
    }

    console.log(`Enhancement request: Provider=${llmProvider}, Model=${llmModel}, Template=${templateId || 'none'}`);
    console.log('System Message:', systemMessage.substring(0, 200) + '...');
    console.log('Enhancement Prompt:', enhancementPrompt);

    // Initialize debug report for template processing - merge with incoming debug report
    let debugReport = Array.isArray(incomingDebugReport) ? [...incomingDebugReport] : [];
    
    // Add the incoming request analysis to debug report
    debugReport.push(incomingRequestDetails);
    
    debugReport.push({
      stage: 'Template Processing Start',
      timestamp: new Date().toISOString(),
      model: 'Template Engine',
      input: {
        templateId: templateId || 'none',
        templateSource: customBasePrompt ? 'database' : 'fallback',
        promptLength: prompt.length,
        useHappyTalk,
        compressPrompt,
        compressionLevel,
        systemMessageFull: systemMessage,
        systemMessageLength: systemMessage.length,
        enhancementPromptFull: enhancementPrompt
      }
    });
    
    // Use the new fallback AI system with Gemini and Mistral fallbacks
    let enhancedPrompt: any;
    let modelUsed = llmModel;
    let providerUsed = llmProvider;
    
    // Handle forced provider for testing
    if (forceProvider === 'secondary') {
      providerUsed = 'gemini';
      modelUsed = 'gemini-2.5-flash';
      console.log('🔄 Forcing secondary provider: Gemini');
    } else if (forceProvider === 'tertiary') {
      providerUsed = 'mistral';
      modelUsed = 'mistral-large-latest';
      console.log('🔄 Forcing tertiary provider: Mistral');
    }
    
    try {
      // Handle forced provider testing - skip to specific provider
      if (forceProvider === 'secondary') {
        // Force Gemini
        debugReport.push({
          stage: 'Forced Secondary Provider (Gemini)',
          timestamp: new Date().toISOString(),
          model: 'gemini-2.5-flash',
          forced: true
        });
        throw new Error('Forced secondary provider test'); // Skip to Gemini
      } else if (forceProvider === 'tertiary') {
        // Force Mistral  
        debugReport.push({
          stage: 'Forced Tertiary Provider (Mistral)',
          timestamp: new Date().toISOString(),
          model: 'mistral-large-latest',
          forced: true
        });
        // Double throw to skip both OpenAI and Gemini
        throw new Error('Forced tertiary provider test');
      }
      
      // Try primary OpenAI first (normal operation)
      console.log('Attempting OpenAI API call...');
      console.log('🔍 ACTUAL PIPELINE TEMPLATE OpenAI API PAYLOAD:');
      console.log('Model:', llmModel);
      console.log('System Message Length:', systemMessage.length);
      console.log('System Message Preview:', systemMessage.substring(0, 200) + '...');
      console.log('User Message:', enhancementPrompt);
      console.log('Max Tokens: 500');
      console.log('Temperature: 0.8');
      console.log('Full JSON Payload:', JSON.stringify({
        model: llmModel,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: enhancementPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8
      }, null, 2));
      
      enhancedPrompt = await aiChatCompletion({
        prompt: enhancementPrompt,
        systemMessage: systemMessage,
        model: llmModel,
        maxTokens: 500,
        temperature: 0.8
      });
      
      console.log('OpenAI API call successful');
      
      debugReport.push({
        stage: 'Primary Enhancement (OpenAI)',
        timestamp: new Date().toISOString(),
        model: llmModel,
        status: 'success',
        llmCallDetails: {
          systemMessage: systemMessage,
          userPrompt: enhancementPrompt,
          requestPayload: {
            model: llmModel,
            messages: [
              { role: "system", content: systemMessage },
              { role: "user", content: enhancementPrompt }
            ],
            max_tokens: 500,
            temperature: 0.8
          },
          response: enhancedPrompt.content,
          apiCallMetrics: {
            systemMessageLength: systemMessage.length,
            userPromptLength: enhancementPrompt.length,
            responseLength: enhancedPrompt.content.length,
            fullSystemMessageIncluded: true,
            templateSource: customBasePrompt ? 'database_master_prompt' : 'fallback_prompt'
          }
        }
      });
      
    } catch (openaiError) {
      console.log('OpenAI failed, trying Gemini fallback...');
      
      debugReport.push({
        stage: 'Primary Enhancement Failed',
        timestamp: new Date().toISOString(),
        model: llmModel,
        error: openaiError instanceof Error ? openaiError.message : 'Unknown error'
      });
      
      try {
        // Import LLM service for Gemini fallback
        const { enhancePromptWithLLM } = await import('../services/llmService');
        
        const geminiResponse = await enhancePromptWithLLM({
          prompt: enhancementPrompt,
          llmProvider: 'gemini',
          llmModel: 'gemini-2.5-flash',
          useHappyTalk: false,
          compressPrompt: false,
          compressionLevel: 1,
          customBasePrompt: systemMessage
        });
        
        enhancedPrompt = { content: geminiResponse };
        modelUsed = 'gemini-2.5-flash';
        providerUsed = 'gemini';
        
        debugReport.push({
          stage: 'Gemini Fallback',
          timestamp: new Date().toISOString(),
          model: 'gemini-2.5-flash',
          status: 'success',
          llmCallDetails: {
            systemMessage: systemMessage,
            userPrompt: enhancementPrompt,
            provider: 'gemini',
            response: geminiResponse
          }
        });
        
      } catch (geminiError) {
        console.log('Gemini failed, trying Mistral fallback...');
        
        debugReport.push({
          stage: 'Gemini Fallback Failed',
          timestamp: new Date().toISOString(),
          model: 'gemini-2.5-flash',
          error: geminiError instanceof Error ? geminiError.message : 'Unknown error'
        });
        
        // Handle forced tertiary provider - skip if not forcing Mistral
        if (forceProvider === 'tertiary') {
          console.log('🔄 Executing forced tertiary provider: Mistral');
        }
        
        try {
          // Import LLM service for Mistral fallback
          const { enhancePromptWithLLM } = await import('../services/llmService');
          
          const mistralResponse = await enhancePromptWithLLM({
            prompt: enhancementPrompt,
            llmProvider: 'mistral',
            llmModel: 'mistral-large-latest',
            useHappyTalk: false,
            compressPrompt: false,
            compressionLevel: 1,
            customBasePrompt: systemMessage
          });
          
          enhancedPrompt = { content: mistralResponse };
          modelUsed = 'mistral-large-latest';
          providerUsed = 'mistral';
          
          debugReport.push({
            stage: 'Mistral Fallback',
            timestamp: new Date().toISOString(),
            model: 'mistral-large-latest',
            status: 'success',
            forced: forceProvider === 'tertiary',
            llmCallDetails: {
              systemMessage: systemMessage,
              userPrompt: enhancementPrompt,
              provider: 'mistral',
              response: mistralResponse
            }
          });
          
        } catch (mistralError) {
          console.log('All AI models failed, using simple enhancement...');
          
          debugReport.push({
            stage: 'Mistral Fallback Failed',
            timestamp: new Date().toISOString(),
            model: 'mistral-large-latest',
            error: mistralError instanceof Error ? mistralError.message : 'Unknown error'
          });
          
          debugReport.push({
            stage: 'All Models Failed',
            timestamp: new Date().toISOString(),
            error: 'OpenAI, Gemini, and Mistral all failed'
          });
          
          // Final fallback - simple prompt enhancement
          enhancedPrompt = { 
            content: `${prompt}, professionally enhanced with detailed lighting, composition, and high-quality rendering. Photorealistic style with attention to textures and environmental elements.`
          };
          modelUsed = 'simple-fallback';
          providerUsed = 'local';
          
          debugReport.push({
            stage: 'Simple Fallback',
            timestamp: new Date().toISOString(),
            model: 'simple-fallback',
            status: 'success'
          });
        }
      }
    }
    
    console.log('✅ Prompt enhancement completed successfully');
    console.log('Enhanced result preview:', enhancedPrompt.content.substring(0, 200) + '...');
    
    debugReport.push({
      stage: 'Template Processing Complete',
      timestamp: new Date().toISOString(),
      model: modelUsed,
      output: {
        enhancedLength: enhancedPrompt.content.length,
        preview: enhancedPrompt.content.substring(0, 100) + '...',
        templateApplied: customBasePrompt ? true : false,
        modelUsed: modelUsed,
        providerUsed: providerUsed
      }
    });
    
    // Replace \n with actual line breaks in the enhanced prompt
    const processedContent = enhancedPrompt.content.replace(/\\n/g, '\n');
    
    // Return enhanced response with diagnostics
    res.json({
      success: true,
      enhancedPrompt: processedContent,
      originalPrompt: prompt,
      historyId: Date.now().toString(),
      debugReport: debugReport,
      diagnostics: {
        apiProvider: providerUsed,
        modelUsed: modelUsed,
        templateSource: customBasePrompt ? 'database' : 'fallback',
        templateId: templateId,
        llmParams: {
          requestedProvider: llmProvider,
          requestedModel: llmModel,
          actualProvider: providerUsed,
          actualModel: modelUsed,
          useHappyTalk: useHappyTalk,
          compressPrompt: compressPrompt,
          compressionLevel: compressionLevel,
          masterPromptLength: customBasePrompt ? customBasePrompt.length : systemMessage.length
        },
        timestamp: new Date().toISOString(),
        responseTime: Date.now()
      }
    });
    
  } catch (error) {
    console.error('❌ Error enhancing prompt:', error);
    
    // Create error debug report
    const errorDebugReport = [
      {
        stage: 'Template Processing Error',
        timestamp: new Date().toISOString(),
        model: 'Template Engine',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    ];
    
    // Return the original prompt if enhancement fails to keep the system working
    res.json({
      success: false,
      enhancedPrompt: req.body.prompt,
      originalPrompt: req.body.prompt,
      error: 'Enhancement failed, returned original prompt',
      debugReport: errorDebugReport,
      diagnostics: {
        errors: [{
          type: 'Enhancement Error',
          message: error instanceof Error ? error.message : 'Unknown error',
          handledBy: 'enhance-prompt-fixed.ts'
        }],
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      }
    });
  }
});

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

export default router;