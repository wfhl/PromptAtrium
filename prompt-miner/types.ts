export interface PromptImage {
  id: string;
  data: string; // Base64 data or URL
  mimeType: string;
  isGenerated: boolean;
}

export interface ExtractedPrompt {
  id: string;
  title: string;
  content: string; // The prompt text
  negativePrompt?: string;
  model?: string; // e.g., "Stable Diffusion", "Midjourney"
  images: PromptImage[];
  source: string;
  tags: string[];
  originalSourceImage?: string; // Base64 of the original uploaded file (if it was an image)
}

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

export interface FileUpload {
  file: File;
  previewUrl?: string;
  base64?: string; // data:mime;base64,...
  mimeType: string;
}

export interface FailedExtraction {
  sourceName: string;
  reason: string;
}

export interface ExtractionResult {
  prompts: ExtractedPrompt[];
  failures: FailedExtraction[];
}

export interface TaskStatus {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

// PromptAtrium compatible schema (inferred/generic)
export interface PromptAtriumExport {
  prompts: {
    name: string;
    prompt: string;
    negative_prompt?: string;
    images?: string[]; // potentially URLs or base64
    notes?: string;
    tags?: string[];
  }[];
}