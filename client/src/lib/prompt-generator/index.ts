/**
 * Elite Prompt Generator - Main Export Module
 * 
 * This module exports all components of the Elite Prompt Generator system
 * for use throughout the application.
 */

// Export the main generator class
export { 
  ElitePromptGenerator, 
  getGenerator, 
  resetGenerator 
} from './ElitePromptGenerator';

// Export all types and interfaces
export type {
  // Main interfaces
  ElitePromptOptions,
  GeneratedPrompt,
  SavedPreset,
  CharacterPreset,
  RuleTemplate,
  GeneratorConfig,
  GenerationResult,
  
  // Component types
  PromptComponent,
  QualityPreset,
  AspectRatio,
  ComponentCategory,
  PromptDataArrays,
  TemplateContext,
  GeneratorStats,
  
  // Utility types
  ComponentValue,
  PromptFormat,
  GenderType,
  GlobalOptionType,
  LLMProvider
} from './types';

// Export type guards
export { 
  isFemalGender, 
  isMaleGender, 
  isNeutralGender 
} from './types';

// Export data management functions
export {
  fetchPromptData,
  getDefaultPromptData,
  getCachedPromptData,
  clearPromptDataCache,
  updatePromptDataCache
} from './promptData';

// Create and export a default instance for immediate use
import { ElitePromptGenerator } from './ElitePromptGenerator';
import type { ElitePromptOptions, GeneratedPrompt } from './types';

/**
 * Quick generation function using the default generator instance
 * @param options - Generation options
 * @returns Generated prompt with multiple formats
 */
export function generatePrompt(options: ElitePromptOptions = {}): GeneratedPrompt {
  const generator = new ElitePromptGenerator();
  return generator.generate(options);
}

/**
 * Generate a random prompt with minimal configuration
 * @param gender - Optional gender specification
 * @returns Generated prompt
 */
export function generateRandomPrompt(gender?: 'female' | 'male' | 'neutral'): GeneratedPrompt {
  const generator = new ElitePromptGenerator();
  return generator.generate({
    gender: gender || 'neutral',
    globalOption: 'Random'
  });
}

/**
 * Generate a prompt from a character preset
 * @param presetId - The ID of the character preset
 * @param additionalOptions - Additional options to merge with preset
 * @returns Generated prompt
 */
export function generateFromPreset(
  presetId: string,
  additionalOptions?: Partial<ElitePromptOptions>
): GeneratedPrompt | null {
  const generator = new ElitePromptGenerator();
  const preset = generator.loadCharacterPreset(presetId);
  
  if (!preset) {
    return null;
  }
  
  const options: ElitePromptOptions = {
    gender: preset.gender,
    bodyTypes: preset.bodyType,
    defaultTags: preset.defaultTag,
    roles: preset.role,
    hairstyles: preset.hairstyle,
    hairColor: preset.hairColor,
    eyeColor: preset.eyeColor,
    makeup: preset.makeup,
    skinTone: preset.skinTone,
    clothing: preset.clothing,
    additionalDetails: preset.additionalDetails,
    loraDescription: preset.loraDescription,
    ...additionalOptions
  };
  
  return generator.generate(options);
}

/**
 * Create a formatted prompt for a specific platform
 * @param prompt - Base prompt text
 * @param platform - Target platform ('midjourney', 'stable', 'dalle', etc.)
 * @param options - Additional formatting options
 * @returns Formatted prompt string
 */
export function formatPromptForPlatform(
  prompt: string,
  platform: 'midjourney' | 'stable' | 'dalle' | 'pipeline' | 'narrative',
  options?: Partial<ElitePromptOptions>
): string {
  const generator = new ElitePromptGenerator();
  const result = generator.generate({
    custom: prompt,
    ...options
  });
  
  switch (platform) {
    case 'midjourney':
      return result.midjourney || result.original;
    case 'stable':
      return result.stable || result.original;
    case 'dalle':
      return result.dalle || result.original;
    case 'pipeline':
      return result.pipeline || result.original;
    case 'narrative':
      return result.narrative || result.original;
    default:
      return result.original;
  }
}

/**
 * Batch generate multiple prompts with variations
 * @param baseOptions - Base options for all prompts
 * @param count - Number of prompts to generate
 * @param varyCategories - Categories to vary between generations
 * @returns Array of generated prompts
 */
export function batchGenerate(
  baseOptions: ElitePromptOptions,
  count: number = 5,
  varyCategories: (keyof ElitePromptOptions)[] = ['lighting', 'composition', 'mood']
): GeneratedPrompt[] {
  const generator = new ElitePromptGenerator();
  const results: GeneratedPrompt[] = [];
  
  for (let i = 0; i < count; i++) {
    // Create varied options by randomizing specified categories
    const variedOptions = { ...baseOptions };
    
    varyCategories.forEach(category => {
      // Clear the category to trigger randomization
      delete variedOptions[category];
    });
    
    // Generate with a different seed for each
    const seededGenerator = new ElitePromptGenerator(Date.now() + i);
    results.push(seededGenerator.generate({
      ...variedOptions,
      globalOption: 'Random' // Enable randomization for varied categories
    }));
  }
  
  return results;
}

/**
 * Validate prompt options and provide suggestions
 * @param options - Options to validate
 * @returns Validation result with suggestions
 */
export function validateOptions(options: ElitePromptOptions): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check for conflicting options
  if (options.globalOption === 'No Figure Rand' && 
      (options.defaultTags || options.bodyTypes || options.roles)) {
    errors.push('No Figure Rand mode conflicts with character-specific options');
  }
  
  // Check gender consistency
  if (options.gender === 'male' && options.makeup) {
    suggestions.push('Makeup is typically used with female or neutral gender');
  }
  
  // Check for missing related options
  if (options.photographer && !options.device) {
    suggestions.push('Consider adding a camera device when specifying a photographer');
  }
  
  if (options.artist && !options.artform) {
    suggestions.push('Consider specifying an art form when using an artist reference');
  }
  
  // Check aspect ratio format
  if (options.aspectRatio && !options.aspectRatio.match(/^\d+:\d+$/)) {
    errors.push('Aspect ratio should be in format "width:height" (e.g., "16:9")');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
}

/**
 * Get component suggestions based on current selections
 * @param currentOptions - Current option selections
 * @returns Suggested components for each category
 */
export async function getComponentSuggestions(
  currentOptions: Partial<ElitePromptOptions>
): Promise<Record<string, string[]>> {
  const generator = new ElitePromptGenerator();
  const data = generator.getPromptData();
  const suggestions: Record<string, string[]> = {};
  
  // Suggest lighting based on mood
  if (currentOptions.mood) {
    const moodLightingMap: Record<string, string[]> = {
      'mysterious': ['dramatic lighting', 'moonlight', 'rim lighting'],
      'romantic': ['golden hour', 'candlelight', 'soft lighting'],
      'energetic': ['bright', 'vibrant', 'neon lights'],
      'peaceful': ['natural light', 'diffused light', 'ambient lighting'],
      'dramatic': ['chiaroscuro', 'harsh shadows', 'spotlight']
    };
    
    suggestions.lighting = moodLightingMap[currentOptions.mood] || [];
  }
  
  // Suggest composition based on subject
  if (currentOptions.subject) {
    if (currentOptions.subject.toLowerCase().includes('portrait')) {
      suggestions.composition = ['close-up', 'three-quarter view', 'centered'];
    } else if (currentOptions.subject.toLowerCase().includes('landscape')) {
      suggestions.composition = ['wide shot', 'rule of thirds', 'golden ratio'];
    }
  }
  
  // Suggest style based on artist
  if (currentOptions.artist) {
    const artistStyleMap: Record<string, string[]> = {
      'Greg Rutkowski': ['fantasy art', 'digital painting', 'concept art'],
      'Artgerm': ['anime style', 'digital art', 'character design'],
      'Alphonse Mucha': ['art nouveau', 'decorative', 'ornamental']
    };
    
    suggestions.digitalArtform = artistStyleMap[currentOptions.artist] || [];
  }
  
  return suggestions;
}

/**
 * Utility function to combine multiple prompts
 * @param prompts - Array of prompts to combine
 * @param separator - Separator between prompts
 * @returns Combined prompt string
 */
export function combinePrompts(
  prompts: string[],
  separator: string = ', '
): string {
  return prompts
    .filter(Boolean)
    .map(p => p.trim())
    .join(separator);
}

/**
 * Extract components from a text prompt
 * @param prompt - Text prompt to analyze
 * @returns Extracted component options
 */
export function extractComponentsFromText(prompt: string): Partial<ElitePromptOptions> {
  const options: Partial<ElitePromptOptions> = {};
  const generator = new ElitePromptGenerator();
  const data = generator.getPromptData();
  
  // Check for gender indicators
  if (/\b(woman|female|girl|lady)\b/i.test(prompt)) {
    options.gender = 'female';
  } else if (/\b(man|male|boy|gentleman)\b/i.test(prompt)) {
    options.gender = 'male';
  }
  
  // Check for lighting terms
  data.LIGHTING.forEach(lighting => {
    if (prompt.toLowerCase().includes(lighting.toLowerCase())) {
      options.lighting = lighting;
    }
  });
  
  // Check for mood terms
  data.MOOD.forEach(mood => {
    if (prompt.toLowerCase().includes(mood.toLowerCase())) {
      options.mood = mood;
    }
  });
  
  // Check for place/setting
  data.PLACE.forEach(place => {
    if (prompt.toLowerCase().includes(place.toLowerCase())) {
      options.place = place;
    }
  });
  
  return options;
}

// Export version information
export const VERSION = '1.0.0';
export const GENERATOR_NAME = 'Elite Prompt Generator';

// Export default generator instance for convenience
export default ElitePromptGenerator;