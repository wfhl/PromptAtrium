/**
 * Type definitions for Elite Prompt Generator
 * Defines all interfaces and types used by the prompt generation system
 */

/**
 * Main options interface for prompt generation
 * Contains all possible component selections and settings
 */
export interface ElitePromptOptions {
  // Custom prompt text
  custom?: string;
  subject?: string;
  
  // Core settings
  gender?: 'female' | 'male' | 'neutral';
  globalOption?: 'Disabled' | 'Random' | 'No Figure Rand';
  
  // Art style and type
  artform?: string;
  photoType?: string;
  
  // Character attributes
  characterType?: string;
  bodyTypes?: string;
  defaultTags?: string;
  roles?: string;
  hairstyles?: string;
  hairColor?: string;
  eyeColor?: string;
  makeup?: string;
  skinTone?: string;
  clothing?: string;
  expression?: string;
  accessories?: string;
  jewelry?: string;
  
  // Scene and environment
  place?: string;
  lighting?: string;
  composition?: string;
  pose?: string;
  background?: string;
  mood?: string;
  atmosphere?: string;
  
  // Style and artistic elements
  additionalDetails?: string;
  photographyStyles?: string;
  device?: string;
  photographer?: string;
  artist?: string;
  digitalArtform?: string;
  
  // Detailed category options
  architectureOptions?: string;
  artOptions?: string;
  brandsOptions?: string;
  cinematicOptions?: string;
  fashionOptions?: string;
  feelingsOptions?: string;
  foodsOptions?: string;
  geographyOptions?: string;
  humanOptions?: string;
  interactionOptions?: string;
  keywordsOptions?: string;
  objectsOptions?: string;
  peopleOptions?: string;
  plotsOptions?: string;
  sceneOptions?: string;
  scienceOptions?: string;
  stuffOptions?: string;
  timeOptions?: string;
  typographyOptions?: string;
  vehicleOptions?: string;
  videogameOptions?: string;
  
  // Generation parameters
  seed?: number;
  aspectRatio?: string;
  camera?: string;
  
  // Negative prompt and quality
  negativePrompt?: string;
  qualityPresets?: string[];
  
  // Template selection
  selectedTemplate?: string;
  templateId?: string;
  
  // LoRA model description
  loraDescription?: string;
}

/**
 * Generated prompt with multiple format outputs
 */
export interface GeneratedPrompt {
  original: string;
  negativePrompt?: string;
  
  // Different format outputs
  clipL?: string;
  clipG?: string;
  t5xxl?: string;
  midjourney?: string;
  dalle?: string;
  stable?: string;
  pipeline?: string;
  longform?: string;
  narrative?: string;
  wildcard?: string;
  custom?: string;
  
  // Template-based outputs
  'pipeline-standard'?: string;
  'pipeline-custom'?: string;
  'custom1'?: string;
  'custom2'?: string;
  'custom3'?: string;
  
  // Allow dynamic keys for custom templates
  [key: string]: string | undefined;
}

/**
 * Saved preset configuration
 */
export interface SavedPreset {
  id: string;
  name: string;
  description?: string;
  options: ElitePromptOptions;
  favorite: boolean;
  createdAt: number;
  updatedAt?: number;
  
  // Metadata
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  userId?: string;
}

/**
 * Character preset for consistent character generation
 */
export interface CharacterPreset {
  id: string;
  name: string;
  description?: string;
  gender: 'female' | 'male' | 'neutral';
  
  // Character attributes
  bodyType: string;
  defaultTag: string;
  role: string;
  hairstyle: string;
  hairColor?: string;
  eyeColor?: string;
  makeup?: string;
  skinTone?: string;
  clothing: string;
  additionalDetails: string;
  loraDescription?: string;
  
  // Metadata
  favorite: boolean;
  createdAt: number;
  updatedAt?: number;
  tags?: string[];
  isPublic?: boolean;
  userId?: string;
}

/**
 * Template for rule-based generation
 */
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  rules: string;
  formatTemplate?: string;
  usageRules?: string;
  
  // Database fields
  dbId?: number;
  masterPrompt?: string;
  
  // LLM configuration
  llmProvider?: 'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local';
  llmModel?: string;
  useHappyTalk?: boolean;
  compressPrompt?: boolean;
  compressionLevel?: number;
  
  // Metadata
  isActive?: boolean;
  isPublic?: boolean;
  userId?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Component data from database
 */
export interface PromptComponent {
  id: string;
  category: string;
  value: string;
  description?: string;
  subcategory?: string;
  tags?: string[];
  weight?: number;
  isDefault?: boolean;
  isActive?: boolean;
  orderIndex?: number;
  usageCount?: number;
}

/**
 * Quality preset configuration
 */
export interface QualityPreset {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  negativePromptAdditions?: string[];
  weight?: number;
  isDefault?: boolean;
}

/**
 * Aspect ratio configuration
 */
export interface AspectRatio {
  label: string;
  value: string;
  width: number;
  height: number;
  description?: string;
  isDefault?: boolean;
}

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  enableRandomization?: boolean;
  enableWeightedSelection?: boolean;
  maxComponentsPerCategory?: number;
  separatorChar?: string;
  enableNegativePrompt?: boolean;
  enableQualityPresets?: boolean;
  defaultQualityPresets?: string[];
  enableTemplates?: boolean;
  defaultTemplate?: string;
  enableSeed?: boolean;
  defaultSeed?: number;
}

/**
 * Component category metadata
 */
export interface ComponentCategory {
  id: string;
  name: string;
  description?: string;
  displayName: string;
  icon?: string;
  orderIndex?: number;
  isActive?: boolean;
  allowMultiple?: boolean;
  maxSelections?: number;
  isRequired?: boolean;
  genderSpecific?: boolean;
  defaultValues?: string[];
  subcategories?: string[];
}

/**
 * Generation result with metadata
 */
export interface GenerationResult {
  prompt: GeneratedPrompt;
  options: ElitePromptOptions;
  metadata: {
    generatedAt: number;
    generatorVersion: string;
    seed?: number;
    templateUsed?: string;
    componentsUsed: string[];
    categoriesUsed: string[];
  };
  stats?: {
    tokenCount?: number;
    characterCount?: number;
    componentCount?: number;
  };
}

/**
 * Database component arrays type
 */
export interface PromptDataArrays {
  // Art and style
  ARTFORM: string[];
  PHOTO_TYPE: string[];
  DIGITAL_ARTFORM: string[];
  PHOTOGRAPHY_STYLES: string[];
  
  // Character - Gender specific
  FEMALE_BODY_TYPES: string[];
  MALE_BODY_TYPES: string[];
  NEUTRAL_BODY_TYPES: string[];
  FEMALE_DEFAULT_TAGS: string[];
  MALE_DEFAULT_TAGS: string[];
  NEUTRAL_DEFAULT_TAGS: string[];
  FEMALE_CLOTHING: string[];
  MALE_CLOTHING: string[];
  NEUTRAL_CLOTHING: string[];
  FEMALE_ADDITIONAL_DETAILS: string[];
  MALE_ADDITIONAL_DETAILS: string[];
  NEUTRAL_ADDITIONAL_DETAILS: string[];
  
  // Character - Universal
  ROLES: string[];
  HAIRSTYLES: string[];
  HAIR_COLORS: string[];
  EYE_COLORS: string[];
  MAKEUP_OPTIONS: string[];
  SKIN_TONES: string[];
  EXPRESSIONS: string[];
  ACCESSORIES: string[];
  JEWELRY: string[];
  
  // Scene and environment
  PLACE: string[];
  LIGHTING: string[];
  COMPOSITION: string[];
  POSE: string[];
  BACKGROUND: string[];
  MOOD: string[];
  ATMOSPHERE: string[];
  
  // Artists and devices
  DEVICE: string[];
  PHOTOGRAPHER: string[];
  ARTIST: string[];
  
  // Detailed options
  ARCHITECTURE_OPTIONS: string[];
  ART_OPTIONS: string[];
  BRANDS_OPTIONS: string[];
  CINEMATIC_OPTIONS: string[];
  FASHION_OPTIONS: string[];
  FEELINGS_OPTIONS: string[];
  FOODS_OPTIONS: string[];
  GEOGRAPHY_OPTIONS: string[];
  HUMAN_OPTIONS: string[];
  INTERACTION_OPTIONS: string[];
  KEYWORDS_OPTIONS: string[];
  OBJECTS_OPTIONS: string[];
  PEOPLE_OPTIONS: string[];
  PLOTS_OPTIONS: string[];
  SCENE_OPTIONS: string[];
  SCIENCE_OPTIONS: string[];
  STUFF_OPTIONS: string[];
  TIME_OPTIONS: string[];
  TYPOGRAPHY_OPTIONS: string[];
  VEHICLE_OPTIONS: string[];
  VIDEOGAME_OPTIONS: string[];
  
  // Quality and negative prompts
  QUALITY_PRESETS: QualityPreset[];
  NEGATIVE_PROMPT_PRESETS: string[];
  
  // Templates
  PROMPT_TEMPLATES: RuleTemplate[];
  CHARACTER_PRESETS: CharacterPreset[];
  
  // Aspect ratios
  ASPECT_RATIOS: AspectRatio[];
}

/**
 * Template variable context
 */
export interface TemplateContext {
  subject?: string;
  character?: string;
  style?: string;
  mood?: string;
  setting?: string;
  lighting?: string;
  composition?: string;
  quality?: string;
  artist?: string;
  [key: string]: string | undefined;
}

/**
 * Generator statistics
 */
export interface GeneratorStats {
  totalGenerated: number;
  presetsCreated: number;
  charactersCreated: number;
  templatesUsed: Record<string, number>;
  categoriesUsed: Record<string, number>;
  averagePromptLength: number;
  lastGeneratedAt?: number;
}

// Export type guards
export const isFemalGender = (gender?: string): boolean => gender === 'female';
export const isMaleGender = (gender?: string): boolean => gender === 'male';
export const isNeutralGender = (gender?: string): boolean => gender === 'neutral' || !gender;

// Export utility types
export type ComponentValue = string | string[] | undefined;
export type PromptFormat = keyof GeneratedPrompt;
export type GenderType = 'female' | 'male' | 'neutral';
export type GlobalOptionType = 'Disabled' | 'Random' | 'No Figure Rand';
export type LLMProvider = 'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local';