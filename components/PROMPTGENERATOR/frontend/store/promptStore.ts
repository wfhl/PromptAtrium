// Prompt store to manage prompt history with parent-child relationships

export interface PromptHistoryEntry {
  id: string;
  timestamp: string;
  prompt: string;
  enhancedPrompt?: string;
  options?: any;
  templateUsed: string;
  parentId?: string; // Reference to the original prompt if this is an enhanced version
  isSelected?: boolean; // For batch operations in history
  type: 'original' | 'enhanced'; // To differentiate between original and enhanced prompts
}

// Local storage key
const STORAGE_KEY = 'elite_generation_history';

// Save prompts to local storage
export const savePromptsToStorage = (prompts: PromptHistoryEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch (error) {
    console.error("Error saving prompts to localStorage:", error);
  }
};

// Get prompts from local storage
export const getPromptsFromStorage = (): PromptHistoryEntry[] => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // Handle existing data that doesn't have the parentId or type properties
      // by migrating it to the new structure
      if (parsedData.length > 0 && !('parentId' in parsedData[0])) {
        return parsedData.map((entry: any) => ({
          ...entry,
          parentId: undefined,
          isSelected: false,
          type: 'original'
        }));
      }
      
      return parsedData;
    }
  } catch (error) {
    console.error("Error loading prompts from localStorage:", error);
  }
  return [];
};

// Add a new prompt to the store
export const addPrompt = (prompt: Partial<PromptHistoryEntry>): PromptHistoryEntry[] => {
  const prompts = getPromptsFromStorage();
  
  // Generate a unique ID if not provided
  const newPrompt: PromptHistoryEntry = {
    id: prompt.id || Date.now().toString(),
    timestamp: prompt.timestamp || new Date().toISOString(),
    prompt: prompt.prompt || '',
    enhancedPrompt: prompt.enhancedPrompt,
    options: prompt.options,
    templateUsed: prompt.templateUsed || 'standard',
    parentId: prompt.parentId,
    isSelected: false,
    type: prompt.type || 'original'
  };
  
  const updatedPrompts = [newPrompt, ...prompts];
  savePromptsToStorage(updatedPrompts);
  return updatedPrompts;
};

// Add enhanced prompt with parent reference
export const addEnhancedPrompt = (
  originalPromptId: string, 
  enhancedPrompt: string,
  templateUsed: string
): PromptHistoryEntry[] => {
  const prompts = getPromptsFromStorage();
  
  // Find the original prompt
  const originalPrompt = prompts.find(p => p.id === originalPromptId);
  if (!originalPrompt) {
    console.error(`Original prompt with ID ${originalPromptId} not found`);
    return prompts;
  }
  
  // Create the enhanced prompt entry
  const enhancedPromptEntry: PromptHistoryEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    prompt: originalPrompt.prompt, // Include the original text
    enhancedPrompt: enhancedPrompt,
    options: originalPrompt.options,
    templateUsed: templateUsed,
    parentId: originalPromptId,
    isSelected: false,
    type: 'enhanced'
  };
  
  const updatedPrompts = [enhancedPromptEntry, ...prompts];
  savePromptsToStorage(updatedPrompts);
  return updatedPrompts;
};

// Get all prompts
export const getAllPrompts = (): PromptHistoryEntry[] => {
  return getPromptsFromStorage();
};

// Clear all prompts
export const clearAllPrompts = (): void => {
  savePromptsToStorage([]);
};

// Select or deselect a prompt
export const togglePromptSelection = (id: string, isSelected?: boolean): PromptHistoryEntry[] => {
  const prompts = getPromptsFromStorage();
  
  const updatedPrompts = prompts.map(prompt => {
    if (prompt.id === id) {
      return {
        ...prompt,
        isSelected: isSelected !== undefined ? isSelected : !prompt.isSelected
      };
    }
    return prompt;
  });
  
  savePromptsToStorage(updatedPrompts);
  return updatedPrompts;
};

// Select or deselect all prompts
export const toggleAllPromptSelection = (isSelected: boolean): PromptHistoryEntry[] => {
  const prompts = getPromptsFromStorage();
  
  const updatedPrompts = prompts.map(prompt => ({
    ...prompt,
    isSelected
  }));
  
  savePromptsToStorage(updatedPrompts);
  return updatedPrompts;
};

// Get selected prompts
export const getSelectedPrompts = (): PromptHistoryEntry[] => {
  const prompts = getPromptsFromStorage();
  return prompts.filter(prompt => prompt.isSelected);
};