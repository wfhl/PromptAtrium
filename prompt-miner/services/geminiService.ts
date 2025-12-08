import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedPrompt, FileUpload, PromptImage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to strip the data URL prefix
const stripBase64Prefix = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

// Helper to clean JSON markdown and extract JSON array from potentially chatty text
const cleanJson = (text: string): string => {
  let clean = text.trim();
  
  // Try to find the first '[' and last ']' to extract the array
  const firstBracket = clean.indexOf('[');
  const lastBracket = clean.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    clean = clean.substring(firstBracket, lastBracket + 1);
  } else if (clean.startsWith('```')) {
    // Fallback for code block cleanup if no brackets found (unlikely for array)
    clean = clean.replace(/^```(json)?/, '').replace(/```$/, '');
  }
  
  return clean.trim();
};

const PROMPT_EXTRACTION_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A short, descriptive title for the prompt." },
      content: { type: Type.STRING, description: "The full generative AI prompt text found." },
      negativePrompt: { type: Type.STRING, description: "Any negative prompt text found (optional)." },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords describing the style or subject." },
      suggestedModel: { type: Type.STRING, description: "The likely AI model this prompt is for (e.g. Midjourney, Stable Diffusion)." },
      imageParams: { type: Type.STRING, description: "Any parameters like --ar 16:9, steps, cfg scale found." }
    },
    required: ["title", "content", "tags"],
  },
};

const SYSTEM_INSTRUCTION = "You are an expert AI Data Parser specialized in extracting generative AI metadata and prompts from mixed media.";

export interface SourceTask {
  type: 'file' | 'text';
  data: FileUpload | string; // FileUpload for file, string for text
  name: string;
}

// Process a single source independently
export const analyzeSource = async (task: SourceTask): Promise<ExtractedPrompt[]> => {
  try {
    const parts: any[] = [];
    const sourceName = task.name;
    let sourceBase64: string | undefined = undefined;
    
    // Check if task is a URL
    const isUrl = task.type === 'text' && typeof task.data === 'string' && 
                  (task.data.startsWith('http://') || task.data.startsWith('https://'));

    if (task.type === 'file') {
      const fileUpload = task.data as FileUpload;
      if (fileUpload.base64) {
        sourceBase64 = fileUpload.base64; // Keep full data URI for the prompt object
        parts.push({
          inlineData: {
            mimeType: fileUpload.mimeType,
            data: stripBase64Prefix(fileUpload.base64),
          },
        });
      }
    } else {
      parts.push({ text: `Analyze the following content:\n${task.data}` });
    }

    let promptText = `
      Analyze the provided content. 
      Identify and extract any "Generative AI Prompts" present. 
      A prompt is a detailed text description used to generate images or text.
      Sometimes prompts are in metadata, screenshots of web UIs, or just plain text lists.
      
      If an image is a screenshot of a prompt interface (like Civitai, Midjourney Discord), extract the prompt text carefully.
    `;

    if (isUrl) {
      promptText += `
        \nSince this is a URL, use Google Search to retrieve the context, caption, or text content of the page.
        Look for image generation parameters, prompts, or art descriptions in the post caption or comments.
        IMPORTANT: Return ONLY a JSON array of the extracted data. Do not include markdown formatting or conversational text.
      `;
    } else {
      promptText += `\nReturn a JSON array of the extracted prompts. If no prompts are found, return an empty array.`;
    }

    parts.push({ text: promptText });

    // Dynamic configuration based on input type
    // We cannot use responseSchema with googleSearch tools in the current API version for some models,
    // so we fallback to text parsing if it is a URL.
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (isUrl) {
      config.tools = [{ googleSearch: {} }];
    } else {
      config.responseMimeType = "application/json";
      config.responseSchema = PROMPT_EXTRACTION_SCHEMA;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: config,
    });

    const rawText = response.text || "[]";
    const cleanedJson = cleanJson(rawText);
    let parsedPrompts: any[] = [];
    
    try {
      parsedPrompts = JSON.parse(cleanedJson);
    } catch (e) {
      console.warn(`JSON Parse error for ${sourceName}. Raw text:`, rawText);
      // Attempt a soft fail for URLs which might return text despite instructions
      if (isUrl && rawText.length > 20) {
         // Create a generic prompt from the text if parsing failed but we got content
         parsedPrompts = [{
            title: `Extracted from Link`,
            content: rawText.substring(0, 500), // Truncate if too long
            tags: ["link-content"],
            suggestedModel: "Unknown"
         }];
      } else {
         throw new Error("Invalid JSON response from model");
      }
    }

    if (!Array.isArray(parsedPrompts)) {
      // Handle case where model returns a single object instead of array
      if (typeof parsedPrompts === 'object' && parsedPrompts !== null) {
        parsedPrompts = [parsedPrompts];
      } else {
        parsedPrompts = [];
      }
    }

    const mappedPrompts = parsedPrompts.map((p: any) => ({
      id: crypto.randomUUID(),
      title: p.title || `Prompt from ${sourceName}`,
      content: p.content,
      negativePrompt: p.negativePrompt,
      model: p.suggestedModel,
      tags: p.tags || [],
      source: sourceName,
      images: [],
      originalSourceImage: sourceBase64 // Attach source image for later cropping
    }));

    if (mappedPrompts.length === 0) {
       console.info(`No prompts found in ${sourceName}`);
    }

    return mappedPrompts;

  } catch (error: any) {
    console.error(`Failed to process ${task.name}:`, error);
    throw error;
  }
};

export const generateSampleImage = async (prompt: string): Promise<PromptImage> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // imageConfig can be added here if needed
      }
    });

    // Iterate parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          id: crypto.randomUUID(),
          data: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          mimeType: part.inlineData.mimeType,
          isGenerated: true
        };
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Image generation failed:", error);
    throw new Error("Failed to generate sample image.");
  }
};