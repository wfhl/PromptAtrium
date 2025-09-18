import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FieldAnalysisResult {
  fieldMappings: {
    sourceField: string;
    targetField: string;
    confidence: number;
    reasoning: string;
  }[];
  dataStructureType: string;
  promptFieldIdentified: string | null;
  nameFieldIdentified: string | null;
  overallConfidence: number;
  suggestions: string[];
}

// Analyze file headers and sample data to intelligently map fields
export async function analyzeFieldsWithAI(
  headers: string[],
  sampleRows: any[],
  fileType: string
): Promise<FieldAnalysisResult> {
  try {
    // Prepare sample data for analysis
    const sampleData = sampleRows.slice(0, 5).map(row => {
      const sample: Record<string, any> = {};
      headers.forEach(header => {
        const value = row[header];
        // Truncate long values for API efficiency
        sample[header] = typeof value === 'string' && value.length > 200 
          ? value.substring(0, 200) + '...' 
          : value;
      });
      return sample;
    });

    const prompt = `You are an expert at analyzing data structures and identifying prompt-related fields in various file formats.

Analyze this data and identify which fields map to a prompt management system.

File Type: ${fileType}
Headers: ${JSON.stringify(headers)}
Sample Data (first 5 rows): ${JSON.stringify(sampleData, null, 2)}

Target fields in our system:
- promptContent (REQUIRED): The main prompt text/instructions
- name (REQUIRED): Title or identifier for the prompt
- description: Brief description of what the prompt does
- category: Category or type classification
- tags: Keywords or labels (array)
- styleKeywords: Style-related keywords
- status: Publication status (draft/published)
- isPublic: Boolean for visibility
- isNsfw: Boolean for adult content
- intendedRecipient: Who the prompt is for
- specificService: Target service/platform
- sourceUrl: Reference URL
- authorReference: Creator attribution
- exampleImages: Example image references
- difficultyLevel: Complexity rating
- useCase: Usage scenario

CRITICAL RULES:
1. The field containing the actual prompt text (like "Full_Prompt", "prompt", "content") should ALWAYS map to "promptContent", NOT to "description"
2. "Description" fields should map to "description" unless they contain the main prompt content
3. Look at the actual content, not just field names - if a field contains long instructional text, it's likely the prompt
4. Be very careful to distinguish between descriptive metadata and actual prompt content

Respond with a JSON object containing:
{
  "fieldMappings": [
    {
      "sourceField": "original field name",
      "targetField": "mapped field name or null if unmapped",
      "confidence": 0.0-1.0,
      "reasoning": "brief explanation"
    }
  ],
  "dataStructureType": "description of data organization",
  "promptFieldIdentified": "field name containing the main prompt or null",
  "nameFieldIdentified": "field name for prompt title or null",
  "overallConfidence": 0.0-1.0,
  "suggestions": ["actionable suggestions for better import"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a data structure analyst specializing in prompt management systems. Always prioritize correct identification of the main prompt content field."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Lower temperature for more consistent analysis
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as FieldAnalysisResult;
  } catch (error) {
    console.error("AI field analysis failed:", error);
    throw error;
  }
}

// Verify field mappings with a second AI pass for accuracy
export async function verifyFieldMappings(
  mappings: FieldAnalysisResult,
  sampleContent: Record<string, string>
): Promise<{
  verified: boolean;
  corrections: FieldAnalysisResult | null;
  confidence: number;
}> {
  try {
    const prompt = `Review these field mappings for a prompt import system and verify their accuracy.

Current Mappings:
${JSON.stringify(mappings.fieldMappings, null, 2)}

Sample Content from mapped fields:
${JSON.stringify(sampleContent, null, 2)}

Key Question: Is the field mapped to "promptContent" actually the main prompt/instruction text?
- If a field called "Description" is mapped to promptContent but contains metadata, that's WRONG
- If a field called "Full_Prompt" or similar contains the actual prompt but isn't mapped to promptContent, that's WRONG

Respond with JSON:
{
  "verified": true/false,
  "corrections": null or corrected FieldAnalysisResult object,
  "confidence": 0.0-1.0,
  "issues": ["list of identified problems"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a quality assurance specialist for data field mappings. Be extremely critical about correct prompt field identification."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      verified: result.verified,
      corrections: result.corrections,
      confidence: result.confidence
    };
  } catch (error) {
    console.error("Field verification failed:", error);
    return {
      verified: true, // Default to accepting if verification fails
      corrections: null,
      confidence: 0.5
    };
  }
}

// Analyze content structure for non-standard formats
export async function analyzeUnstructuredContent(
  content: string,
  fileType: string
): Promise<{
  prompts: Array<{
    name: string;
    promptContent: string;
    metadata: Record<string, any>;
  }>;
  confidence: number;
}> {
  try {
    const prompt = `Analyze this unstructured content and extract prompts with their metadata.

Content (truncated if needed):
${content.substring(0, 10000)}

File Type: ${fileType}

Extract all prompts and return JSON:
{
  "prompts": [
    {
      "name": "extracted title or generated name",
      "promptContent": "the actual prompt text",
      "metadata": {
        "description": "if found",
        "category": "if found",
        "other_fields": "any other relevant data"
      }
    }
  ],
  "confidence": 0.0-1.0,
  "structure_notes": "description of how the content is organized"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      prompts: result.prompts || [],
      confidence: result.confidence || 0
    };
  } catch (error) {
    console.error("Unstructured content analysis failed:", error);
    return {
      prompts: [],
      confidence: 0
    };
  }
}

// Smart content type detection
export async function detectContentPattern(
  sampleText: string
): Promise<{
  isPrompt: boolean;
  contentType: 'prompt' | 'description' | 'metadata' | 'unknown';
  confidence: number;
  reasoning: string;
}> {
  try {
    const prompt = `Analyze this text and determine if it's a prompt/instruction or just metadata/description.

Text: "${sampleText.substring(0, 500)}"

Look for:
- Imperative language ("Create", "Generate", "Transform")
- Technical instructions or parameters
- Placeholder patterns like {VARIABLE} or [PARAMETER]
- Length and complexity suggesting instructions vs simple descriptions

Respond with JSON:
{
  "isPrompt": true/false,
  "contentType": "prompt" or "description" or "metadata" or "unknown",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Content pattern detection failed:", error);
    return {
      isPrompt: false,
      contentType: 'unknown',
      confidence: 0,
      reasoning: 'Detection failed'
    };
  }
}

// Extract prompt content from an image using GPT-4 Vision
export async function extractPromptFromImage(
  imageBase64: string,
  extractionMode: 'content' | 'content_and_name' | 'all_fields'
): Promise<{
  success: boolean;
  promptContent?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  promptType?: string;
  promptStyle?: string;
  intendedGenerator?: string;
  recommendedModels?: string[];
  technicalParams?: any;
  error?: string;
}> {
  try {
    let systemPrompt: string;
    let userPrompt: string;

    switch (extractionMode) {
      case 'content':
        systemPrompt = `You are an expert at extracting AI prompt text from screenshots and images. Your task is to identify and extract ONLY the actual prompt content from the image.`;
        userPrompt = `Analyze this image and extract the prompt content. Focus on:
- The main prompt text or instructions
- Include any negative prompts if present
- Preserve the exact formatting and wording
- Ignore UI elements, buttons, metadata, or other non-prompt text
- If multiple prompts are visible, extract the primary/main one

Return ONLY a JSON object with this structure:
{
  "promptContent": "the extracted prompt text",
  "negativePrompt": "negative prompt if present, or null"
}`;
        break;

      case 'content_and_name':
        systemPrompt = `You are an expert at extracting and analyzing AI prompts from screenshots. Extract the prompt and generate an appropriate name for it.`;
        userPrompt = `Analyze this image and:
1. Extract the main prompt content
2. Generate a concise, descriptive name for the prompt based on its content

Focus on:
- Extracting the exact prompt text
- Creating a name that captures the essence of what the prompt does
- Include negative prompts if present

Return a JSON object with:
{
  "promptContent": "the extracted prompt text",
  "negativePrompt": "negative prompt if present, or null",
  "name": "a descriptive name for this prompt"
}`;
        break;

      case 'all_fields':
        systemPrompt = `You are an expert at extracting and analyzing AI prompts from screenshots. Extract all available information and intelligently infer metadata.`;
        userPrompt = `Analyze this image comprehensively and extract/infer:

1. The main prompt content (exact text)
2. A descriptive name based on the prompt's purpose
3. A brief description of what the prompt achieves
4. Appropriate category (e.g., "Character", "Scene", "Style", "Concept Art", etc.)
5. Relevant tags (keywords that describe the prompt)
6. Prompt type (e.g., "Text-to-Image", "Image-to-Image", "Inpainting", etc.)
7. Prompt style (e.g., "Realistic", "Anime", "Abstract", "Photographic", etc.)
8. Intended generator (if apparent: "Stable Diffusion", "Midjourney", "DALL-E", etc.)
9. Recommended models (if mentioned or apparent from style)
10. Technical parameters (if visible: steps, CFG scale, sampler, etc.)

Analyze visual cues, text formatting, and any visible metadata to make intelligent inferences.

Return a comprehensive JSON object with all available fields:
{
  "promptContent": "the main prompt text",
  "negativePrompt": "negative prompt if present, or null",
  "name": "descriptive name",
  "description": "brief description of the prompt's purpose",
  "category": "appropriate category",
  "tags": ["tag1", "tag2", ...],
  "promptType": "type of prompt",
  "promptStyle": "visual style",
  "intendedGenerator": "target AI system or null",
  "recommendedModels": ["model1", "model2"] or [],
  "technicalParams": { 
    "steps": number or null,
    "cfg_scale": number or null,
    "sampler": "string or null",
    "seed": number or null,
    "other_params": {}
  } or null
}`;
        break;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Using GPT-4 Vision model
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "high"  // High detail for better text extraction
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,  // Low temperature for accurate extraction
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Merge negative prompt into main prompt content if present
    if (result.negativePrompt) {
      result.promptContent = result.promptContent + 
        (result.promptContent ? "\n\nNegative prompt: " + result.negativePrompt : result.negativePrompt);
    }

    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error("Image analysis failed:", error);
    return {
      success: false,
      error: error.message || "Failed to analyze image"
    };
  }
}

// Generate prompt metadata from existing prompt content
export async function generatePromptMetadata(
  promptContent: string,
  generationMode: 'name_only' | 'all_fields'
): Promise<{
  success: boolean;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  promptType?: string;
  promptStyle?: string;
  intendedGenerator?: string;
  recommendedModels?: string[];
  isNsfw?: boolean;
  error?: string;
}> {
  try {
    let systemPrompt: string;
    let userPrompt: string;

    switch (generationMode) {
      case 'name_only':
        systemPrompt = `You are an expert at analyzing AI prompts and creating concise, descriptive names for them.`;
        userPrompt = `Analyze this prompt and generate a concise, descriptive name that captures its essence:

Prompt:
${promptContent}

Create a name that:
- Is clear and descriptive
- Captures the main purpose or subject
- Is between 3-8 words
- Avoids generic terms like "prompt" or "AI"

Return a JSON object:
{
  "name": "the generated name"
}`;
        break;

      case 'all_fields':
        systemPrompt = `You are an expert at analyzing AI prompts and generating comprehensive metadata for prompt management systems.`;
        userPrompt = `Analyze this prompt and generate comprehensive metadata:

Prompt:
${promptContent}

Generate:
1. A descriptive name (3-8 words capturing the essence)
2. A brief description (1-2 sentences explaining what it creates)
3. Category (choose the most appropriate: "Character", "Scene", "Style", "Concept Art", "Photography", "Abstract", "Technical", "Creative Writing", "Other")
4. Tags (5-10 relevant keywords)
5. Prompt type (e.g., "Text-to-Image", "Image Enhancement", "Style Transfer", "Creative Writing", etc.)
6. Visual style (e.g., "Realistic", "Anime", "Abstract", "Photographic", "Artistic", "Technical", etc.)
7. Intended generator (if apparent from syntax/keywords: "Stable Diffusion", "Midjourney", "DALL-E", "Claude", "GPT", etc.)
8. Recommended models (if specific models are mentioned or style suggests certain models)
9. NSFW detection (analyze for adult/sensitive content)

Analyze the prompt structure, keywords, and patterns to make intelligent inferences.

Return a JSON object:
{
  "name": "descriptive name",
  "description": "what this prompt creates",
  "category": "most appropriate category",
  "tags": ["tag1", "tag2", ...],
  "promptType": "type of prompt",
  "promptStyle": "visual or writing style",
  "intendedGenerator": "target system or null if unclear",
  "recommendedModels": ["model1", "model2"] or [],
  "isNsfw": true/false
}`;
        break;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error("Metadata generation failed:", error);
    return {
      success: false,
      error: error.message || "Failed to generate metadata"
    };
  }
}