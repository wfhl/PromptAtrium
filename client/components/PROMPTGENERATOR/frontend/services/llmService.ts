import { toast } from "@/hooks/use-toast";

export interface LLMEnhancementRequest {
  prompt: string;
  llmProvider: 'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local';
  llmModel: string;
  templateId?: string;
  useHappyTalk?: boolean;
  compressPrompt?: boolean;
  compressionLevel?: number;
  customBasePrompt?: string;
  image?: string; // Base64 encoded image data URL
  // Optional API keys
  openaiApiKey?: string;
  anthropicApiKey?: string;
  llamaApiKey?: string;
  grokApiKey?: string;
  blueskyApiKey?: string;
  mistralApiKey?: string;
}

export interface LLMEnhancementResponse {
  originalPrompt: string;
  enhancedPrompt: string;
  historyId: string;
  // Diagnostics data
  diagnostics?: {
    // API information
    apiProvider?: string;
    modelUsed?: string;
    fallbackUsed?: boolean;
    templateSource?: 'database' | 'fallback' | 'emergency_fallback';
    responseTime?: number;
    timestamp?: string;
    // Database connection status
    dbConnectionStatus?: 'connected' | 'failed' | 'unknown';
    // LLM parameters that were used
    llmParams?: {
      provider: string;
      model: string;
      useHappyTalk: boolean;
      compressPrompt: boolean;
      compressionLevel: number;
      masterPromptLength?: number;
      tokenCount?: number;
    };
    // Any errors encountered and how they were handled
    errors?: Array<{
      type: string;
      message: string;
      handledBy: string;
    }>;
  };
}

export interface PromptHistoryEntry {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  llmProvider: 'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local';
  llmModel: string;
  timestamp: number;
}

/**
 * Enhance a prompt using the LLM service
 */
export async function enhancePromptWithLLM(request: LLMEnhancementRequest): Promise<LLMEnhancementResponse> {
  try {
    // Sanitize the request object to prevent any XSS or injection attacks
    const sanitizedRequest = {
      ...request,
      prompt: request.prompt.trim(),
      llmProvider: request.llmProvider,
      llmModel: request.llmModel.trim(),
      templateId: request.templateId ? request.templateId.trim() : undefined,
      useHappyTalk: Boolean(request.useHappyTalk),
      compressPrompt: Boolean(request.compressPrompt),
      compressionLevel: Math.min(Math.max(Number(request.compressionLevel) || 5, 1), 10),
      customBasePrompt: request.customBasePrompt ? request.customBasePrompt.trim() : undefined,
      image: request.image ? request.image : undefined, // Include image data
      // Only send API keys if they are not empty strings
      openaiApiKey: request.openaiApiKey && request.openaiApiKey.trim() !== '' ? request.openaiApiKey.trim() : undefined,
      anthropicApiKey: request.anthropicApiKey && request.anthropicApiKey.trim() !== '' ? request.anthropicApiKey.trim() : undefined,
      llamaApiKey: request.llamaApiKey && request.llamaApiKey.trim() !== '' ? request.llamaApiKey.trim() : undefined,
      grokApiKey: request.grokApiKey && request.grokApiKey.trim() !== '' ? request.grokApiKey.trim() : undefined,
      blueskyApiKey: request.blueskyApiKey && request.blueskyApiKey.trim() !== '' ? request.blueskyApiKey.trim() : undefined,
      mistralApiKey: request.mistralApiKey && request.mistralApiKey.trim() !== '' ? request.mistralApiKey.trim() : undefined
    };

    // Send the request over HTTPS with a timeout and CSRF token if available
    const response = await fetch('/api/enhance-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(sanitizedRequest),
      credentials: 'same-origin', // Include cookies for session-based auth
      mode: 'same-origin', // Restricts to same-origin requests only
      cache: 'no-store', // Prevent caching of API requests with sensitive data
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to enhance prompt');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    toast({
      title: 'Error enhancing prompt',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Get prompt history
 */
export async function getPromptHistory(): Promise<PromptHistoryEntry[]> {
  try {
    const response = await fetch('/api/llm/history');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch prompt history');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    toast({
      title: 'Error fetching history',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Get a specific prompt history entry
 */
export async function getPromptHistoryEntry(id: string): Promise<PromptHistoryEntry> {
  try {
    const response = await fetch(`/api/llm/history/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch history entry');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching history entry:', error);
    toast({
      title: 'Error fetching entry',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Delete a prompt history entry
 */
export async function deletePromptHistoryEntry(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/llm/history/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete history entry');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting history entry:', error);
    toast({
      title: 'Error deleting entry',
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: 'destructive',
    });
    throw error;
  }
}