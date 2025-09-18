import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key from environment
// Using gemini-1.5-flash for fast responses and gemini-1.5-pro for complex tasks
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // Use Gemini 1.5 Pro for complex analysis
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text) as FieldAnalysisResult;
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
${JSON.stringify(mappings, null, 2)}

Sample Content After Mapping:
${JSON.stringify(sampleContent, null, 2)}

CRITICAL: 
- The "promptContent" field should contain the actual AI prompt instructions
- The "description" field should contain metadata ABOUT the prompt, not the prompt itself
- If you see prompt instructions in "description", this is WRONG

Verify if:
1. The promptContent field actually contains prompt text/instructions
2. The name field contains a suitable title
3. Other fields are correctly mapped

Respond with JSON:
{
  "verified": true/false,
  "corrections": null or corrected FieldAnalysisResult object if changes needed,
  "confidence": 0.0-1.0
}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Field verification failed:", error);
    return {
      verified: false,
      corrections: null,
      confidence: 0
    };
  }
}

// Analyze unstructured text content  
export async function analyzeUnstructuredContent(
  content: string,
  fileType: string
): Promise<{
  prompts: Array<{
    promptContent: string;
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
    confidence: number;
  }>;
  totalFound: number;
  parseStrategy: string;
}> {
  try {
    const prompt = `Analyze this unstructured content and extract any AI prompts or prompt-like content.

File Type: ${fileType}
Content Sample (truncated): ${content.substring(0, 5000)}

Identify and extract:
1. Complete AI prompts (text-to-image, creative writing, instructions, etc.)
2. Prompt titles or names if present
3. Associated metadata (descriptions, categories, tags)
4. Use context clues to separate multiple prompts

Rules:
- Look for prompt patterns, delimiters, headings
- Each prompt should be complete and usable
- Generate names if not explicitly provided
- Confidence score based on clarity of separation

Return JSON:
{
  "prompts": [
    {
      "promptContent": "full prompt text",
      "name": "descriptive name",
      "description": "what it does (optional)",
      "category": "category (optional)",
      "tags": ["tag1", "tag2"] (optional),
      "confidence": 0.0-1.0
    }
  ],
  "totalFound": number,
  "parseStrategy": "description of how content was parsed"
}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Unstructured analysis failed:", error);
    throw error;
  }
}

// Detect whether content is a prompt or description
export async function detectContentPattern(
  text: string
): Promise<{
  contentType: 'prompt' | 'description' | 'mixed' | 'unclear';
  confidence: number;
  reasoning: string;
  suggestedField: 'promptContent' | 'description' | 'both';
}> {
  try {
    const prompt = `Analyze this text and determine if it's an AI prompt or a description of a prompt.

Text:
${text.substring(0, 1000)}

Characteristics of a PROMPT:
- Direct instructions to an AI
- Contains commands, parameters, or creative directions  
- Uses imperative language ("create", "generate", "write")
- Has specific details about desired output

Characteristics of a DESCRIPTION:
- Talks ABOUT a prompt
- Explains what a prompt does
- Uses third-person language
- Meta information about purpose or usage

Return JSON:
{
  "contentType": "prompt" or "description" or "mixed" or "unclear",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "suggestedField": "promptContent" or "description" or "both"
}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();
    
    return JSON.parse(text_response);
  } catch (error) {
    console.error("Content detection failed:", error);
    return {
      contentType: 'unclear',
      confidence: 0,
      reasoning: 'Analysis failed',
      suggestedField: 'promptContent'
    };
  }
}

// Extract prompt from image using Gemini vision
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
  negativePrompt?: string;
  intendedGenerator?: string;
  recommendedModels?: string[];
  technicalParams?: any;
  error?: string;
}> {
  try {
    let userPrompt: string;

    switch (extractionMode) {
      case 'content':
        userPrompt = `Extract the main prompt text from this image. Look for:
- Text that appears to be AI instructions or prompts
- Creative directions or descriptions
- Parameters or settings text
- Any negative prompts (usually marked as "negative" or with minus signs)

Return ONLY the prompt content as JSON:
{
  "promptContent": "the extracted prompt text",
  "negativePrompt": "negative prompt if present, or null"
}`;
        break;

      case 'content_and_name':
        userPrompt = `Extract the prompt from this image and generate a descriptive name. 

First, extract:
1. The main prompt text
2. Any negative prompts

Then generate a concise, descriptive name (3-8 words) that captures the essence of the prompt.

Return as JSON:
{
  "promptContent": "the extracted prompt text",
  "negativePrompt": "negative prompt if present, or null",
  "name": "descriptive name for the prompt"
}`;
        break;

      case 'all_fields':
      default:
        userPrompt = `Analyze this image comprehensively and extract all prompt-related information.

Extract or infer:
1. The main prompt text (required)
2. Negative prompts (if visible)
3. A descriptive name for the prompt
4. A brief description of what the prompt achieves
5. Appropriate category (e.g., "Character", "Scene", "Style", "Concept Art", etc.)
6. Relevant tags (keywords that describe the prompt)
7. Prompt type (e.g., "Text-to-Image", "Image-to-Image", "Inpainting", etc.)
8. Prompt style (e.g., "Realistic", "Anime", "Abstract", "Photographic", etc.)
9. Intended generator (if apparent: "Stable Diffusion", "Midjourney", "DALL-E", etc.)
10. Recommended models (if mentioned or apparent from style)
11. Technical parameters (if visible: steps, CFG scale, sampler, etc.)

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

    // Use Gemini 1.5 Flash for vision tasks (better quotas)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
        responseMimeType: "application/json"
      }
    });

    // Create the image part
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    };

    const result = await model.generateContent([userPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const parsedResult = JSON.parse(text);
    
    // Merge negative prompt into main prompt content if present
    if (parsedResult.negativePrompt) {
      parsedResult.promptContent = parsedResult.promptContent + 
        (parsedResult.promptContent ? "\n\nNegative prompt: " + parsedResult.negativePrompt : parsedResult.negativePrompt);
    }

    return {
      success: true,
      ...parsedResult
    };
  } catch (error: any) {
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
    let userPrompt: string;

    switch (generationMode) {
      case 'name_only':
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

Return a JSON object:
{
  "name": "descriptive name",
  "description": "what this prompt creates",
  "category": "most appropriate category",
  "tags": ["relevant", "keywords"],
  "promptType": "type of generation",
  "promptStyle": "visual or writing style",
  "intendedGenerator": "target AI system or null",
  "recommendedModels": ["model suggestions"] or [],
  "isNsfw": true/false
}`;
        break;

      default:
        throw new Error(`Invalid generation mode: ${generationMode}`);
    }

    // Use Gemini 1.5 Flash for faster metadata generation
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      success: true,
      ...JSON.parse(text)
    };
  } catch (error: any) {
    console.error("Metadata generation failed:", error);
    return {
      success: false,
      error: error.message || "Failed to generate metadata"
    };
  }
}