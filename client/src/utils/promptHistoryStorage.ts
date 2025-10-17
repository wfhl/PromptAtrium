// Local storage helper for prompt history
// This provides a fallback for non-authenticated users and merges with database data

interface LocalPromptHistoryEntry {
  id: string;
  promptText: string;
  templateUsed?: string;
  settings?: any;
  metadata?: any;
  createdAt: string;
  isLocal: boolean; // Mark as local-only entry
}

const STORAGE_KEY = 'prompt_generation_history';
const MAX_LOCAL_ENTRIES = 50; // Limit local storage to prevent bloat

// Save a prompt to local storage
export const savePromptToLocalStorage = (entry: Omit<LocalPromptHistoryEntry, 'id' | 'createdAt' | 'isLocal'>): LocalPromptHistoryEntry => {
  const newEntry: LocalPromptHistoryEntry = {
    ...entry,
    id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    isLocal: true,
  };

  try {
    const existing = getLocalPromptHistory();
    const updated = [newEntry, ...existing].slice(0, MAX_LOCAL_ENTRIES); // Keep only recent entries
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  } catch (error) {
    console.error('Failed to save prompt to localStorage:', error);
    return newEntry;
  }
};

// Get all prompts from local storage
export const getLocalPromptHistory = (): LocalPromptHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    // Ensure backward compatibility - add isLocal flag if missing
    return parsed.map((entry: any) => ({
      ...entry,
      isLocal: entry.isLocal !== undefined ? entry.isLocal : true,
    }));
  } catch (error) {
    console.error('Failed to read prompt history from localStorage:', error);
    return [];
  }
};

// Clear local prompt history
export const clearLocalPromptHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear local prompt history:', error);
  }
};

// Delete a specific local prompt
export const deleteLocalPrompt = (id: string): void => {
  try {
    const existing = getLocalPromptHistory();
    const filtered = existing.filter(entry => entry.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete local prompt:', error);
  }
};

// Migrate local prompts to database (for when user logs in)
export const migrateLocalPromptsToDatabase = async (userId: string): Promise<number> => {
  const localPrompts = getLocalPromptHistory();
  if (!localPrompts.length) return 0;

  let migrated = 0;
  
  for (const prompt of localPrompts) {
    try {
      const response = await fetch('/api/prompt-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          promptText: prompt.promptText,
          templateUsed: prompt.templateUsed,
          settings: prompt.settings,
          metadata: { ...prompt.metadata, migratedFromLocal: true },
          createdAt: prompt.createdAt,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        migrated++;
      }
    } catch (error) {
      console.error('Failed to migrate prompt:', error);
    }
  }

  // Clear local storage after successful migration
  if (migrated > 0) {
    clearLocalPromptHistory();
  }

  return migrated;
};

// Transform local entry to match database format for display
export const transformLocalToDBFormat = (localEntry: LocalPromptHistoryEntry): any => {
  return {
    id: localEntry.id,
    userId: 'local_user', // Placeholder for local entries
    promptText: localEntry.promptText,
    templateUsed: localEntry.templateUsed,
    settings: localEntry.settings || {},
    metadata: localEntry.metadata || {},
    isSaved: false,
    createdAt: localEntry.createdAt,
    isLocal: true, // Flag to identify local entries
  };
};

// Convert library format to history format for saving
export const convertLibraryToHistory = (libraryPrompt: any): Omit<LocalPromptHistoryEntry, 'id' | 'createdAt' | 'isLocal'> => {
  return {
    promptText: libraryPrompt.promptContent || libraryPrompt.positive_prompt || libraryPrompt.prompt || '',
    templateUsed: libraryPrompt.template_used || libraryPrompt.templateName || 'imported',
    settings: {
      negativePrompt: libraryPrompt.negativePrompt || libraryPrompt.negative_prompt || '',
      category: libraryPrompt.category,
      status: libraryPrompt.status,
    },
    metadata: {
      name: libraryPrompt.name || libraryPrompt.title,
      description: libraryPrompt.description,
      tags: libraryPrompt.tags || [],
      author: libraryPrompt.author || libraryPrompt.userId,
      technicalParams: libraryPrompt.technicalParams,
      character_preset: libraryPrompt.character_preset,
      intendedGenerator: libraryPrompt.intendedGenerator,
      recommendedModels: libraryPrompt.recommendedModels,
      libraryId: libraryPrompt.id, // Keep reference to library entry
    },
  };
};

// Convert history format to library format for saving
export const convertHistoryToLibrary = (historyEntry: any, userId: string): any => {
  const metadata = historyEntry.metadata || {};
  const settings = historyEntry.settings || {};
  
  return {
    name: metadata.name || `Quick Prompt - ${new Date(historyEntry.createdAt).toLocaleDateString()}`,
    description: metadata.description || `Generated using ${historyEntry.templateUsed || 'Quick Prompt'}`,
    promptContent: historyEntry.promptText, // Library uses promptContent
    negativePrompt: settings.negativePrompt || '',
    category: settings.category || metadata.category || 'quick-prompt',
    tags: metadata.tags || [historyEntry.templateUsed, metadata.character, metadata.subject].filter(Boolean),
    status: 'published' as const,
    isPublic: false,
    userId,
    technicalParams: metadata.technicalParams || {
      templateUsed: historyEntry.templateUsed,
      settings: historyEntry.settings,
      generatedAt: historyEntry.createdAt,
    },
    character_preset: metadata.character_preset || metadata.character,
    intendedGenerator: metadata.intendedGenerator || historyEntry.templateUsed,
    variables: metadata.variables || {},
    license: 'private',
  };
};