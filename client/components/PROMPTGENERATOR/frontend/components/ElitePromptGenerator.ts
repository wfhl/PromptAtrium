// Elite Prompt Generator - Core Generator Class
// Standalone version for PROMPTGENERATOR package

import {
  ARTFORM,
  PHOTO_TYPE,
  FEMALE_BODY_TYPES,
  MALE_BODY_TYPES,
  FEMALE_DEFAULT_TAGS,
  MALE_DEFAULT_TAGS,
  ROLES,
  HAIRSTYLES,
  HAIR_COLORS,
  EYE_COLORS,
  MAKEUP_OPTIONS,
  SKIN_TONES,
  FEMALE_CLOTHING,
  MALE_CLOTHING,
  PLACE,
  LIGHTING,
  COMPOSITION,
  POSE,
  BACKGROUND,
  FEMALE_ADDITIONAL_DETAILS,
  MALE_ADDITIONAL_DETAILS,
  PHOTOGRAPHY_STYLES,
  DEVICE,
  PHOTOGRAPHER,
  ARTIST,
  DIGITAL_ARTFORM,
  PROMPT_TEMPLATES,
  CHARACTER_PRESETS,
  QUALITY_PRESETS,
  NEGATIVE_PROMPT_PRESETS,
  ARCHITECTURE_OPTIONS,
  ART_OPTIONS,
  BRANDS_OPTIONS,
  CINEMATIC_OPTIONS,
  FASHION_OPTIONS,
  FEELINGS_OPTIONS,
  FOODS_OPTIONS,
  GEOGRAPHY_OPTIONS,
  HUMAN_OPTIONS,
  INTERACTION_OPTIONS,
  KEYWORDS_OPTIONS,
  OBJECTS_OPTIONS,
  PEOPLE_OPTIONS,
  PLOTS_OPTIONS,
  SCENE_OPTIONS,
  SCIENCE_OPTIONS,
  STUFF_OPTIONS,
  TIME_OPTIONS,
  TYPOGRAPHY_OPTIONS,
  VEHICLE_OPTIONS,
  VIDEOGAME_OPTIONS
} from "../data/fluxPromptData";

// Interfaces

export interface ElitePromptOptions {
  custom?: string;
  subject?: string;
  gender?: 'female' | 'male';
  globalOption?: 'Disabled' | 'Random' | 'No Figure Rand';
  
  // Artform and Photo Type
  artform?: string;
  photoType?: string;
  
  // Character Details
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
  loraDescription?: string;
  
  // Scene Details
  place?: string;
  lighting?: string;
  composition?: string;
  pose?: string;
  background?: string;
  mood?: string;
  
  // Style and Artist
  additionalDetails?: string;
  photographyStyles?: string;
  device?: string;
  photographer?: string;
  artist?: string;
  digitalArtform?: string;
  
  // New Detailed Options
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
  
  // Additional Parameters
  seed?: number;
  
  // Extended options for negative prompts
  negativePrompt?: string;
  
  // Quality presets and other parameters
  qualityPresets?: string[];
  aspectRatio?: string;
  camera?: string;
}

export interface GeneratedPrompt {
  original: string;
  negativePrompt?: string;
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
  'pipeline-standard'?: string;
  'pipeline-custom'?: string;
  'custom1'?: string;
  'custom2'?: string;
  'custom3'?: string;
  [key: string]: string | undefined;
}

export interface SavedPreset {
  id: string;
  name: string;
  description?: string;
  options: ElitePromptOptions;
  favorite: boolean;
  createdAt: number;
}

export interface CharacterPreset {
  id: string;
  name: string;
  description?: string;
  gender: 'female' | 'male';
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
  favorite: boolean;
  createdAt: number;
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  rules: string;
  formatTemplate?: string;
  usageRules?: string;
  dbId?: number;
  masterPrompt?: string;
  llmProvider?: 'openai' | 'anthropic' | 'llama' | 'grok' | 'bluesky' | 'mistral' | 'local';
  llmModel?: string;
  useHappyTalk?: boolean;
  compressPrompt?: boolean;
  compressionLevel?: number;
}

// Main Generator Class
class ElitePromptGenerator {
  private rng: () => number;
  private savedPresets: SavedPreset[] = [];
  private characterPresets: CharacterPreset[] = [];
  private ruleTemplates: RuleTemplate[] = [];
  
  constructor(seed?: number) {
    // Initialize RNG with seed if provided
    if (seed !== undefined) {
      let currentSeed = seed;
      this.rng = () => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
      };
    } else {
      this.rng = Math.random;
    }
    
    // Load saved presets from localStorage if any
    this.loadPresets();
    this.loadCharacterPresets();
    
    // Initialize with default character presets if none exist
    if (this.characterPresets.length === 0) {
      CHARACTER_PRESETS.forEach(preset => {
        this.characterPresets.push({
          ...preset,
          gender: preset.gender as 'female' | 'male',
          favorite: false,
          createdAt: Date.now()
        });
      });
      this.persistCharacterPresets();
    }
    
    // Initialize default rule templates
    this.initializeDefaultRuleTemplates();
  }
  
  private initializeDefaultRuleTemplates() {
    this.ruleTemplates = [
      {
        id: "pipeline",
        name: "Pipeline",
        description: "Advanced pipeline for structured prompt generation",
        template: "{prompt}",
        masterPrompt: `You are a specialized expert in Pipeline format prompts for AI image generation.

Your task is to transform the original prompt into a structured Pipeline format. The Pipeline format organizes prompts in clear, distinct sections separated by pipes (|) and follows this structure:

[Pose/Action and Setting] | [Character Description] | [Materials and Quality] | [Outfit/Clothing Details] | [Camera Details and Accessories]

Enhanced Pipeline prompt:`,
        llmProvider: 'openai',
        llmModel: 'gpt4',
        useHappyTalk: false,
        compressPrompt: false,
        compressionLevel: 5,
        rules: "Pipeline format rules"
      },
      {
        id: "standard",
        name: "Standard",
        description: "Standard rules for prompt formatting",
        template: "{prompt}",
        rules: "- Keep prompts concise and specific\n- Separate concepts with commas\n- Start with the most important elements",
        masterPrompt: `You are an expert prompt engineer for AI image generation. 

Your task is to enhance the original prompt to create a more detailed, visually rich description for AI image generation while maintaining the core subject and intent.

Enhanced prompt:`,
        llmProvider: 'openai',
        llmModel: 'gpt4'
      },
      {
        id: "narrative",
        name: "Narrative",
        description: "Story-focused narrative format for image generation",
        template: "{prompt}",
        rules: "- Create a structured narrative flow\n- Focus on the core story elements\n- Establish setting, characters, and atmosphere",
        masterPrompt: `You are a specialized expert in transforming standard image prompts into narrative story formats.

Your task is to rewrite the original prompt into a narrative-focused format that emphasizes storytelling, character development, and scene description.

Narrative prompt:`,
        llmProvider: 'openai',
        llmModel: 'gpt4'
      },
      {
        id: "wildcard",
        name: "Wildcard",
        description: "Creative format with unexpected elements",
        template: "{prompt}",
        rules: "- Introduce surprising or unexpected elements\n- Maintain coherence while adding creative twists",
        masterPrompt: `You are a creative genius specialized in transforming standard image prompts into wildly inventive and unexpected concepts.

Your task is to take the original prompt and infuse it with surprising, unexpected elements that create a unique and striking visual concept.

Wildcard prompt:`,
        llmProvider: 'openai',
        llmModel: 'gpt4',
        useHappyTalk: true,
        compressPrompt: false,
        compressionLevel: 5
      },
      {
        id: "midjourney",
        name: "Midjourney",
        description: "Rules for Midjourney v6 prompts",
        template: "{prompt} --ar {aspect-ratio} --v 6 --s {seed}",
        rules: "- Use --v 6 for latest model\n- Add --ar for aspect ratio\n- Use --s for seed value",
        masterPrompt: `You are a Midjourney prompt specialist. Optimize the prompt for Midjourney v6.`,
        llmProvider: 'openai',
        llmModel: 'gpt4',
        useHappyTalk: false,
        compressPrompt: true,
        compressionLevel: 3
      }
    ];
  }
  
  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(this.rng() * array.length)];
  }
  
  private randomMultiple<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.rng() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }
  
  generate(options: ElitePromptOptions = {}): GeneratedPrompt {
    const gender = options.gender || 'female';
    const bodyTypes = gender === 'female' ? FEMALE_BODY_TYPES : MALE_BODY_TYPES;
    const defaultTags = gender === 'female' ? FEMALE_DEFAULT_TAGS : MALE_DEFAULT_TAGS;
    const clothing = gender === 'female' ? FEMALE_CLOTHING : MALE_CLOTHING;
    const additionalDetails = gender === 'female' ? FEMALE_ADDITIONAL_DETAILS : MALE_ADDITIONAL_DETAILS;
    
    // Build the prompt components
    const components: string[] = [];
    
    // Start with custom prompt if provided
    if (options.custom) {
      components.push(options.custom);
    }
    
    // Add subject if provided
    if (options.subject) {
      components.push(options.subject);
    }
    
    // Add character details
    if (options.defaultTags || options.globalOption === 'Random') {
      components.push(options.defaultTags || this.randomFrom(defaultTags));
    }
    
    if (options.bodyTypes || options.globalOption === 'Random') {
      components.push(options.bodyTypes || this.randomFrom(bodyTypes));
    }
    
    if (options.roles || options.globalOption === 'Random') {
      components.push(options.roles || this.randomFrom(ROLES));
    }
    
    // Add appearance details
    if (options.hairstyles || options.globalOption === 'Random') {
      components.push(options.hairstyles || this.randomFrom(HAIRSTYLES));
    }
    
    if (options.hairColor) {
      components.push(options.hairColor);
    }
    
    if (options.eyeColor) {
      components.push(options.eyeColor);
    }
    
    if (options.makeup && gender === 'female') {
      components.push(options.makeup);
    }
    
    if (options.skinTone) {
      components.push(options.skinTone);
    }
    
    if (options.clothing || options.globalOption === 'Random') {
      components.push(options.clothing || this.randomFrom(clothing));
    }
    
    // Add scene details
    if (options.place || (options.globalOption === 'Random' || options.globalOption === 'No Figure Rand')) {
      components.push(options.place || this.randomFrom(PLACE));
    }
    
    if (options.lighting || (options.globalOption === 'Random' || options.globalOption === 'No Figure Rand')) {
      components.push(options.lighting || this.randomFrom(LIGHTING));
    }
    
    if (options.composition || (options.globalOption === 'Random' || options.globalOption === 'No Figure Rand')) {
      components.push(options.composition || this.randomFrom(COMPOSITION));
    }
    
    if (options.pose || options.globalOption === 'Random') {
      components.push(options.pose || this.randomFrom(POSE));
    }
    
    if (options.background || (options.globalOption === 'Random' || options.globalOption === 'No Figure Rand')) {
      components.push(options.background || this.randomFrom(BACKGROUND));
    }
    
    // Add style and artist
    if (options.additionalDetails || options.globalOption === 'Random') {
      components.push(options.additionalDetails || this.randomFrom(additionalDetails));
    }
    
    if (options.photographyStyles) {
      components.push(options.photographyStyles);
    }
    
    if (options.device) {
      components.push(options.device);
    }
    
    if (options.photographer) {
      components.push(options.photographer);
    }
    
    if (options.artist) {
      components.push(options.artist);
    }
    
    if (options.digitalArtform) {
      components.push(options.digitalArtform);
    }
    
    // Add detailed options
    const detailedOptions = [
      options.architectureOptions,
      options.artOptions,
      options.brandsOptions,
      options.cinematicOptions,
      options.fashionOptions,
      options.feelingsOptions,
      options.foodsOptions,
      options.geographyOptions,
      options.humanOptions,
      options.interactionOptions,
      options.keywordsOptions,
      options.objectsOptions,
      options.peopleOptions,
      options.plotsOptions,
      options.sceneOptions,
      options.scienceOptions,
      options.stuffOptions,
      options.timeOptions,
      options.typographyOptions,
      options.vehicleOptions,
      options.videogameOptions
    ].filter(Boolean);
    
    components.push(...detailedOptions);
    
    // Add quality presets
    if (options.qualityPresets && options.qualityPresets.length > 0) {
      components.push(...options.qualityPresets);
    }
    
    // Build the final prompt
    const original = components.filter(Boolean).join(", ");
    
    // Generate negative prompt if needed
    let negativePrompt = options.negativePrompt || "";
    if (!negativePrompt && options.qualityPresets) {
      // Generate default negative prompt based on selected presets
      const negativeComponents = [];
      
      // Add common negative prompts
      negativeComponents.push("low quality", "blurry", "pixelated", "distorted");
      
      // Add specific negatives based on content
      if (options.gender) {
        negativeComponents.push("deformed", "bad anatomy", "extra limbs");
      }
      
      negativePrompt = negativeComponents.join(", ");
    }
    
    return {
      original,
      negativePrompt,
      stable: this.formatForStableDiffusion(original, negativePrompt),
      midjourney: this.formatForMidjourney(original, options),
      pipeline: this.formatForPipeline(original, options),
      narrative: this.formatForNarrative(original, options),
      wildcard: this.formatForWildcard(original, options),
      custom1: original,
      custom2: original,
      custom3: original
    };
  }
  
  private formatForStableDiffusion(prompt: string, negativePrompt: string): string {
    // Add quality tags for Stable Diffusion
    const sdTags = ["masterpiece", "best quality", "highly detailed"];
    return `${prompt}, ${sdTags.join(", ")}`;
  }
  
  private formatForMidjourney(prompt: string, options: ElitePromptOptions): string {
    // Format for Midjourney with parameters
    let mjPrompt = prompt;
    
    if (options.aspectRatio) {
      mjPrompt += ` --ar ${options.aspectRatio}`;
    }
    
    if (options.seed) {
      mjPrompt += ` --seed ${options.seed}`;
    }
    
    mjPrompt += " --v 6";
    
    return mjPrompt;
  }
  
  private formatForPipeline(prompt: string, options: ElitePromptOptions): string {
    // Convert to pipeline format structure
    const sections = [];
    
    // Parse and reorganize the prompt components
    sections.push(`[${options.pose || "posed"} | ${options.place || "studio setting"}]`);
    sections.push(`[${options.defaultTags || "character"} | ${options.bodyTypes || "figure"}]`);
    sections.push(`[high quality | detailed | professional]`);
    sections.push(`[${options.clothing || "outfit"} | ${options.additionalDetails || "styled"}]`);
    
    return sections.join(" | ");
  }
  
  private formatForNarrative(prompt: string, options: ElitePromptOptions): string {
    // Create a narrative format
    const narrativeElements = [];
    
    if (options.subject || options.defaultTags) {
      narrativeElements.push(`The scene opens with ${options.subject || options.defaultTags || "a figure"}`);
    }
    
    if (options.place) {
      narrativeElements.push(`set in ${options.place}`);
    }
    
    if (options.lighting) {
      narrativeElements.push(`illuminated by ${options.lighting}`);
    }
    
    if (options.mood || options.additionalDetails) {
      narrativeElements.push(`creating an atmosphere of ${options.mood || options.additionalDetails || "mystery"}`);
    }
    
    return narrativeElements.join(", ") || prompt;
  }
  
  private formatForWildcard(prompt: string, options: ElitePromptOptions): string {
    // Add creative wildcards
    const wildcards = [
      "surreal",
      "dreamlike",
      "otherworldly",
      "ethereal",
      "fantastical",
      "impossible geometry",
      "floating elements",
      "glowing particles"
    ];
    
    const selectedWildcards = this.randomMultiple(wildcards, 2);
    return `${prompt}, ${selectedWildcards.join(", ")}`;
  }
  
  // Preset Management
  savePreset(preset: SavedPreset): void {
    const existingIndex = this.savedPresets.findIndex(p => p.id === preset.id);
    if (existingIndex !== -1) {
      this.savedPresets[existingIndex] = preset;
    } else {
      this.savedPresets.push(preset);
    }
    this.persistPresets();
  }
  
  loadPreset(id: string): SavedPreset | null {
    return this.savedPresets.find(p => p.id === id) || null;
  }
  
  deletePreset(id: string): void {
    this.savedPresets = this.savedPresets.filter(p => p.id !== id);
    this.persistPresets();
  }
  
  getPresets(): SavedPreset[] {
    return this.savedPresets;
  }
  
  togglePresetFavorite(id: string): void {
    const preset = this.savedPresets.find(p => p.id === id);
    if (preset) {
      preset.favorite = !preset.favorite;
      this.persistPresets();
    }
  }
  
  private persistPresets(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('elitePromptPresets', JSON.stringify(this.savedPresets));
    }
  }
  
  private loadPresets(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('elitePromptPresets');
      if (stored) {
        try {
          this.savedPresets = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load presets:', e);
        }
      }
    }
  }
  
  // Character Preset Management
  saveCharacterPreset(preset: CharacterPreset): void {
    const existingIndex = this.characterPresets.findIndex(p => p.id === preset.id);
    if (existingIndex !== -1) {
      this.characterPresets[existingIndex] = preset;
    } else {
      this.characterPresets.push(preset);
    }
    this.persistCharacterPresets();
  }
  
  loadCharacterPreset(id: string): CharacterPreset | null {
    return this.characterPresets.find(p => p.id === id) || null;
  }
  
  deleteCharacterPreset(id: string): void {
    this.characterPresets = this.characterPresets.filter(p => p.id !== id);
    this.persistCharacterPresets();
  }
  
  getCharacterPresets(): CharacterPreset[] {
    return this.characterPresets;
  }
  
  toggleCharacterPresetFavorite(id: string): void {
    const preset = this.characterPresets.find(p => p.id === id);
    if (preset) {
      preset.favorite = !preset.favorite;
      this.persistCharacterPresets();
    }
  }
  
  private persistCharacterPresets(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('eliteCharacterPresets', JSON.stringify(this.characterPresets));
    }
  }
  
  private loadCharacterPresets(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('eliteCharacterPresets');
      if (stored) {
        try {
          this.characterPresets = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load character presets:', e);
        }
      }
    }
  }
  
  // Rule Template Management
  getRuleTemplates(): RuleTemplate[] {
    return this.ruleTemplates;
  }
  
  getRuleTemplate(id: string): RuleTemplate | null {
    return this.ruleTemplates.find(t => t.id === id) || null;
  }
  
  updateRuleTemplate(id: string, updates: Partial<RuleTemplate>): void {
    const index = this.ruleTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.ruleTemplates[index] = { ...this.ruleTemplates[index], ...updates };
    }
  }
  
  getDefaultMasterPrompt(templateType: string): string {
    const template = this.ruleTemplates.find(t => t.id === templateType);
    return template?.masterPrompt || "Transform and enhance the following prompt:";
  }
}

// Create and export singleton instance
const elitePromptGenerator = new ElitePromptGenerator();
export default elitePromptGenerator;