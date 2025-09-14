/**
 * Elite Prompt Generator - Core Generation Engine
 * 
 * A comprehensive prompt generation system that creates structured prompts
 * for AI image generation with support for multiple output formats,
 * template processing, and component management.
 */

import type {
  ElitePromptOptions,
  GeneratedPrompt,
  SavedPreset,
  CharacterPreset,
  RuleTemplate,
  GeneratorConfig,
  GenerationResult,
  PromptDataArrays,
  TemplateContext,
  GenderType,
  PromptComponent
} from './types';

import { 
  getDefaultPromptData, 
  getCachedPromptData,
  updatePromptDataCache 
} from './promptData';

/**
 * Main prompt generator class
 * Handles all aspects of prompt generation including templates,
 * randomization, presets, and multiple output formats
 */
export class ElitePromptGenerator {
  private rng: () => number;
  private savedPresets: SavedPreset[] = [];
  private characterPresets: CharacterPreset[] = [];
  private ruleTemplates: RuleTemplate[] = [];
  private promptData: PromptDataArrays;
  private config: GeneratorConfig;
  private generationStats = {
    totalGenerated: 0,
    presetsCreated: 0,
    charactersCreated: 0,
    templatesUsed: {} as Record<string, number>,
    categoriesUsed: {} as Record<string, number>,
    averagePromptLength: 0,
    lastGeneratedAt: 0
  };

  /**
   * Initialize the prompt generator
   * @param seed - Optional seed for deterministic random generation
   * @param config - Optional generator configuration
   */
  constructor(seed?: number, config?: GeneratorConfig) {
    // Initialize RNG
    if (seed !== undefined) {
      this.initSeededRNG(seed);
    } else {
      this.rng = Math.random;
    }

    // Initialize configuration
    this.config = {
      enableRandomization: true,
      enableWeightedSelection: true,
      maxComponentsPerCategory: 3,
      separatorChar: ', ',
      enableNegativePrompt: true,
      enableQualityPresets: true,
      defaultQualityPresets: ['high_quality'],
      enableTemplates: true,
      defaultTemplate: 'standard',
      enableSeed: true,
      ...config
    };

    // Initialize with default data
    this.promptData = getDefaultPromptData();
    
    // Load saved data from localStorage
    this.loadPresets();
    this.loadCharacterPresets();
    this.loadRuleTemplates();
    this.loadStats();

    // Initialize default templates if none exist
    if (this.ruleTemplates.length === 0) {
      this.initializeDefaultTemplates();
    }

    // Fetch latest data from database
    this.refreshDataFromDatabase();
  }

  /**
   * Initialize seeded random number generator
   */
  private initSeededRNG(seed: number): void {
    let currentSeed = seed;
    this.rng = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Generate a prompt based on provided options
   * @param options - Generation options
   * @returns Generated prompt with multiple formats
   */
  public generate(options: ElitePromptOptions = {}): GeneratedPrompt {
    const startTime = Date.now();
    
    // Determine gender for component selection
    const gender = options.gender || 'neutral';
    
    // Build prompt components
    const components = this.buildPromptComponents(options, gender);
    
    // Join components into base prompt
    const basePrompt = components.filter(Boolean).join(this.config.separatorChar);
    
    // Generate negative prompt
    const negativePrompt = this.generateNegativePrompt(options);
    
    // Get selected template
    const template = this.getTemplate(options.selectedTemplate || options.templateId);
    
    // Generate different format outputs
    const result: GeneratedPrompt = {
      original: basePrompt,
      negativePrompt,
      ...this.generateFormattedOutputs(basePrompt, options, template)
    };
    
    // Update statistics
    this.updateStats(options, result, Date.now() - startTime);
    
    return result;
  }

  /**
   * Build prompt components from options
   */
  private buildPromptComponents(options: ElitePromptOptions, gender: GenderType): string[] {
    const components: string[] = [];
    const globalOption = options.globalOption;
    
    // Add custom prompt if provided
    if (options.custom) {
      components.push(options.custom);
    }
    
    // Add subject
    if (options.subject) {
      components.push(options.subject);
    }
    
    // Character components (gender-aware)
    if (globalOption === 'Random' || globalOption === 'No Figure Rand') {
      // Skip character details for "No Figure Rand"
      if (globalOption !== 'No Figure Rand') {
        this.addCharacterComponents(components, options, gender);
      }
    } else if (options.defaultTags || options.bodyTypes || options.roles) {
      this.addCharacterComponents(components, options, gender);
    }
    
    // Scene and environment
    this.addSceneComponents(components, options, globalOption);
    
    // Style and artistic elements
    this.addStyleComponents(components, options);
    
    // Detailed category options
    this.addDetailedOptions(components, options);
    
    // Quality presets
    if (this.config.enableQualityPresets) {
      this.addQualityPresets(components, options);
    }
    
    return components;
  }

  /**
   * Add character-related components
   */
  private addCharacterComponents(
    components: string[], 
    options: ElitePromptOptions, 
    gender: GenderType
  ): void {
    const data = this.promptData;
    
    // Select gender-appropriate arrays
    const bodyTypes = gender === 'female' ? data.FEMALE_BODY_TYPES :
                      gender === 'male' ? data.MALE_BODY_TYPES :
                      data.NEUTRAL_BODY_TYPES;
    
    const defaultTags = gender === 'female' ? data.FEMALE_DEFAULT_TAGS :
                        gender === 'male' ? data.MALE_DEFAULT_TAGS :
                        data.NEUTRAL_DEFAULT_TAGS;
    
    const clothing = gender === 'female' ? data.FEMALE_CLOTHING :
                     gender === 'male' ? data.MALE_CLOTHING :
                     data.NEUTRAL_CLOTHING;
    
    const additionalDetails = gender === 'female' ? data.FEMALE_ADDITIONAL_DETAILS :
                              gender === 'male' ? data.MALE_ADDITIONAL_DETAILS :
                              data.NEUTRAL_ADDITIONAL_DETAILS;
    
    // Add components with randomization if enabled
    if (options.defaultTags || options.globalOption === 'Random') {
      components.push(options.defaultTags || this.randomFrom(defaultTags));
    }
    
    if (options.bodyTypes || options.globalOption === 'Random') {
      components.push(options.bodyTypes || this.randomFrom(bodyTypes));
    }
    
    if (options.roles || options.globalOption === 'Random') {
      components.push(options.roles || this.randomFrom(data.ROLES));
    }
    
    // Appearance details
    if (options.hairstyles || options.globalOption === 'Random') {
      components.push(options.hairstyles || this.randomFrom(data.HAIRSTYLES));
    }
    
    if (options.hairColor) {
      components.push(options.hairColor);
    }
    
    if (options.eyeColor) {
      components.push(options.eyeColor);
    }
    
    if (options.makeup && (gender === 'female' || gender === 'neutral')) {
      components.push(options.makeup);
    }
    
    if (options.skinTone) {
      components.push(options.skinTone);
    }
    
    if (options.clothing || options.globalOption === 'Random') {
      components.push(options.clothing || this.randomFrom(clothing));
    }
    
    if (options.expression) {
      components.push(options.expression);
    }
    
    if (options.accessories) {
      components.push(options.accessories);
    }
    
    if (options.jewelry) {
      components.push(options.jewelry);
    }
    
    if (options.additionalDetails || options.globalOption === 'Random') {
      components.push(options.additionalDetails || this.randomFrom(additionalDetails));
    }
    
    if (options.loraDescription) {
      components.push(options.loraDescription);
    }
  }

  /**
   * Add scene and environment components
   */
  private addSceneComponents(
    components: string[], 
    options: ElitePromptOptions,
    globalOption?: string
  ): void {
    const data = this.promptData;
    const shouldRandomize = globalOption === 'Random' || globalOption === 'No Figure Rand';
    
    if (options.place || shouldRandomize) {
      components.push(options.place || this.randomFrom(data.PLACE));
    }
    
    if (options.lighting || shouldRandomize) {
      components.push(options.lighting || this.randomFrom(data.LIGHTING));
    }
    
    if (options.composition || shouldRandomize) {
      components.push(options.composition || this.randomFrom(data.COMPOSITION));
    }
    
    if (options.pose || (globalOption === 'Random' && globalOption !== 'No Figure Rand')) {
      components.push(options.pose || this.randomFrom(data.POSE));
    }
    
    if (options.background || shouldRandomize) {
      components.push(options.background || this.randomFrom(data.BACKGROUND));
    }
    
    if (options.mood) {
      components.push(options.mood);
    }
    
    if (options.atmosphere) {
      components.push(options.atmosphere);
    }
  }

  /**
   * Add style and artistic components
   */
  private addStyleComponents(components: string[], options: ElitePromptOptions): void {
    if (options.artform) {
      components.push(options.artform);
    }
    
    if (options.photoType) {
      components.push(options.photoType);
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
  }

  /**
   * Add detailed category options
   */
  private addDetailedOptions(components: string[], options: ElitePromptOptions): void {
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
  }

  /**
   * Add quality presets to components
   */
  private addQualityPresets(components: string[], options: ElitePromptOptions): void {
    const presets = options.qualityPresets || this.config.defaultQualityPresets || [];
    
    presets.forEach(presetId => {
      const preset = this.promptData.QUALITY_PRESETS.find(p => p.id === presetId);
      if (preset) {
        components.push(...preset.tags);
      }
    });
  }

  /**
   * Generate negative prompt
   */
  private generateNegativePrompt(options: ElitePromptOptions): string {
    if (!this.config.enableNegativePrompt) {
      return '';
    }
    
    if (options.negativePrompt) {
      return options.negativePrompt;
    }
    
    const negativeComponents: string[] = [];
    
    // Add quality preset negatives
    const presets = options.qualityPresets || this.config.defaultQualityPresets || [];
    presets.forEach(presetId => {
      const preset = this.promptData.QUALITY_PRESETS.find(p => p.id === presetId);
      if (preset?.negativePromptAdditions) {
        negativeComponents.push(...preset.negativePromptAdditions);
      }
    });
    
    // Add default negatives if no preset negatives
    if (negativeComponents.length === 0) {
      negativeComponents.push(
        'low quality',
        'blurry',
        'pixelated',
        'distorted',
        'bad anatomy',
        'extra limbs'
      );
    }
    
    return [...new Set(negativeComponents)].join(', ');
  }

  /**
   * Generate formatted outputs for different platforms
   */
  private generateFormattedOutputs(
    basePrompt: string,
    options: ElitePromptOptions,
    template?: RuleTemplate
  ): Partial<GeneratedPrompt> {
    const outputs: Partial<GeneratedPrompt> = {};
    
    // Standard formats
    outputs.stable = this.formatForStableDiffusion(basePrompt, options);
    outputs.midjourney = this.formatForMidjourney(basePrompt, options);
    outputs.dalle = this.formatForDalle(basePrompt, options);
    
    // Template-based formats
    if (template) {
      outputs.pipeline = this.formatWithTemplate(basePrompt, options, 'pipeline');
      outputs.narrative = this.formatWithTemplate(basePrompt, options, 'narrative');
      outputs.wildcard = this.formatWithTemplate(basePrompt, options, 'wildcard');
      outputs.longform = this.formatForLongform(basePrompt, options);
      
      // Custom template format
      if (template.id !== 'standard') {
        outputs.custom = this.applyTemplate(basePrompt, options, template);
      }
    }
    
    return outputs;
  }

  /**
   * Format for Stable Diffusion
   */
  private formatForStableDiffusion(prompt: string, options: ElitePromptOptions): string {
    const sdTags = ['masterpiece', 'best quality', 'highly detailed'];
    return `${prompt}, ${sdTags.join(', ')}`;
  }

  /**
   * Format for Midjourney
   */
  private formatForMidjourney(prompt: string, options: ElitePromptOptions): string {
    let mjPrompt = prompt;
    
    if (options.aspectRatio) {
      mjPrompt += ` --ar ${options.aspectRatio}`;
    }
    
    if (options.seed) {
      mjPrompt += ` --seed ${options.seed}`;
    }
    
    mjPrompt += ' --v 6';
    
    return mjPrompt;
  }

  /**
   * Format for DALL-E
   */
  private formatForDalle(prompt: string, options: ElitePromptOptions): string {
    // DALL-E prefers natural language descriptions
    return `A ${prompt}, professional quality, detailed`;
  }

  /**
   * Format for longform narrative
   */
  private formatForLongform(prompt: string, options: ElitePromptOptions): string {
    const parts = [];
    
    if (options.subject || options.defaultTags) {
      parts.push(`The image depicts ${options.subject || options.defaultTags || 'a scene'}`);
    }
    
    if (options.place) {
      parts.push(`set in ${options.place}`);
    }
    
    if (options.lighting) {
      parts.push(`illuminated by ${options.lighting}`);
    }
    
    if (options.mood || options.atmosphere) {
      parts.push(`creating an atmosphere of ${options.mood || options.atmosphere || 'mystery'}`);
    }
    
    if (options.photographyStyles || options.artform) {
      parts.push(`rendered in ${options.photographyStyles || options.artform || 'a unique'} style`);
    }
    
    return parts.join(', ') + '.';
  }

  /**
   * Format with a specific template
   */
  private formatWithTemplate(
    prompt: string,
    options: ElitePromptOptions,
    templateId: string
  ): string {
    const template = this.ruleTemplates.find(t => t.id === templateId);
    if (!template) {
      return prompt;
    }
    
    return this.applyTemplate(prompt, options, template);
  }

  /**
   * Apply a template to generate formatted output
   */
  private applyTemplate(
    basePrompt: string,
    options: ElitePromptOptions,
    template: RuleTemplate
  ): string {
    // Create context for template variables
    const context: TemplateContext = {
      prompt: basePrompt,
      subject: options.subject || '',
      character: options.defaultTags || '',
      style: options.photographyStyles || options.artform || '',
      mood: options.mood || '',
      setting: options.place || '',
      lighting: options.lighting || '',
      composition: options.composition || '',
      quality: options.qualityPresets?.join(', ') || '',
      artist: options.artist || '',
      pose: options.pose || '',
      clothing: options.clothing || '',
      camera: options.device || '',
      attributes: [
        options.bodyTypes,
        options.hairstyles,
        options.eyeColor
      ].filter(Boolean).join(', ')
    };
    
    // Replace template variables
    let result = template.formatTemplate || template.template;
    
    Object.entries(context).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value || '');
    });
    
    // Clean up empty sections
    result = result.replace(/\[\s*\|\s*\]/g, '');
    result = result.replace(/\s+/g, ' ');
    result = result.trim();
    
    return result || basePrompt;
  }

  /**
   * Get a template by ID
   */
  private getTemplate(templateId?: string): RuleTemplate | undefined {
    if (!templateId) {
      templateId = this.config.defaultTemplate;
    }
    
    return this.ruleTemplates.find(t => t.id === templateId);
  }

  /**
   * Random selection from array
   */
  private randomFrom<T>(array: T[]): T {
    return array[Math.floor(this.rng() * array.length)];
  }

  /**
   * Random multiple selection from array
   */
  private randomMultiple<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => this.rng() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * Initialize default templates
   */
  private initializeDefaultTemplates(): void {
    this.ruleTemplates = this.promptData.PROMPT_TEMPLATES;
    this.persistRuleTemplates();
  }

  /**
   * Update generation statistics
   */
  private updateStats(
    options: ElitePromptOptions,
    result: GeneratedPrompt,
    generationTime: number
  ): void {
    this.generationStats.totalGenerated++;
    this.generationStats.lastGeneratedAt = Date.now();
    
    // Track template usage
    const templateId = options.selectedTemplate || options.templateId || 'standard';
    this.generationStats.templatesUsed[templateId] = 
      (this.generationStats.templatesUsed[templateId] || 0) + 1;
    
    // Track category usage
    const categories = Object.keys(options).filter(key => options[key as keyof ElitePromptOptions]);
    categories.forEach(cat => {
      this.generationStats.categoriesUsed[cat] = 
        (this.generationStats.categoriesUsed[cat] || 0) + 1;
    });
    
    // Update average prompt length
    const currentLength = result.original.length;
    const totalLength = this.generationStats.averagePromptLength * 
                        (this.generationStats.totalGenerated - 1) + currentLength;
    this.generationStats.averagePromptLength = 
      totalLength / this.generationStats.totalGenerated;
    
    this.saveStats();
  }

  // Preset Management Methods

  /**
   * Save a preset configuration
   */
  public savePreset(preset: SavedPreset): void {
    const existingIndex = this.savedPresets.findIndex(p => p.id === preset.id);
    
    if (existingIndex !== -1) {
      this.savedPresets[existingIndex] = {
        ...preset,
        updatedAt: Date.now()
      };
    } else {
      this.savedPresets.push({
        ...preset,
        createdAt: Date.now()
      });
      this.generationStats.presetsCreated++;
    }
    
    this.persistPresets();
  }

  /**
   * Load a preset by ID
   */
  public loadPreset(id: string): SavedPreset | null {
    return this.savedPresets.find(p => p.id === id) || null;
  }

  /**
   * Delete a preset
   */
  public deletePreset(id: string): boolean {
    const index = this.savedPresets.findIndex(p => p.id === id);
    if (index !== -1) {
      this.savedPresets.splice(index, 1);
      this.persistPresets();
      return true;
    }
    return false;
  }

  /**
   * Get all saved presets
   */
  public getPresets(): SavedPreset[] {
    return [...this.savedPresets];
  }

  /**
   * Toggle preset favorite status
   */
  public togglePresetFavorite(id: string): void {
    const preset = this.savedPresets.find(p => p.id === id);
    if (preset) {
      preset.favorite = !preset.favorite;
      this.persistPresets();
    }
  }

  // Character Preset Management

  /**
   * Save a character preset
   */
  public saveCharacterPreset(preset: CharacterPreset): void {
    const existingIndex = this.characterPresets.findIndex(p => p.id === preset.id);
    
    if (existingIndex !== -1) {
      this.characterPresets[existingIndex] = {
        ...preset,
        updatedAt: Date.now()
      };
    } else {
      this.characterPresets.push({
        ...preset,
        createdAt: Date.now()
      });
      this.generationStats.charactersCreated++;
    }
    
    this.persistCharacterPresets();
  }

  /**
   * Load a character preset
   */
  public loadCharacterPreset(id: string): CharacterPreset | null {
    return this.characterPresets.find(p => p.id === id) || null;
  }

  /**
   * Delete a character preset
   */
  public deleteCharacterPreset(id: string): boolean {
    const index = this.characterPresets.findIndex(p => p.id === id);
    if (index !== -1) {
      this.characterPresets.splice(index, 1);
      this.persistCharacterPresets();
      return true;
    }
    return false;
  }

  /**
   * Get all character presets
   */
  public getCharacterPresets(): CharacterPreset[] {
    return [...this.characterPresets];
  }

  // Template Management

  /**
   * Add or update a rule template
   */
  public saveRuleTemplate(template: RuleTemplate): void {
    const existingIndex = this.ruleTemplates.findIndex(t => t.id === template.id);
    
    if (existingIndex !== -1) {
      this.ruleTemplates[existingIndex] = template;
    } else {
      this.ruleTemplates.push(template);
    }
    
    this.persistRuleTemplates();
  }

  /**
   * Get all rule templates
   */
  public getRuleTemplates(): RuleTemplate[] {
    return [...this.ruleTemplates];
  }

  /**
   * Delete a rule template
   */
  public deleteRuleTemplate(id: string): boolean {
    const index = this.ruleTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      this.ruleTemplates.splice(index, 1);
      this.persistRuleTemplates();
      return true;
    }
    return false;
  }

  // Data Management

  /**
   * Refresh component data from database
   */
  public async refreshDataFromDatabase(): Promise<void> {
    try {
      this.promptData = await getCachedPromptData();
    } catch (error) {
      console.error('Failed to refresh data from database:', error);
    }
  }

  /**
   * Update prompt data
   */
  public updatePromptData(data: Partial<PromptDataArrays>): void {
    this.promptData = {
      ...this.promptData,
      ...data
    };
    updatePromptDataCache(this.promptData);
  }

  /**
   * Get current prompt data
   */
  public getPromptData(): PromptDataArrays {
    return this.promptData;
  }

  /**
   * Get generator statistics
   */
  public getStats(): typeof this.generationStats {
    return { ...this.generationStats };
  }

  // Persistence Methods

  private loadPresets(): void {
    try {
      const stored = localStorage.getItem('elite_prompt_presets');
      if (stored) {
        this.savedPresets = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  }

  private persistPresets(): void {
    try {
      localStorage.setItem('elite_prompt_presets', JSON.stringify(this.savedPresets));
    } catch (error) {
      console.error('Failed to persist presets:', error);
    }
  }

  private loadCharacterPresets(): void {
    try {
      const stored = localStorage.getItem('elite_character_presets');
      if (stored) {
        this.characterPresets = JSON.parse(stored);
      } else {
        // Initialize with defaults
        this.characterPresets = this.promptData.CHARACTER_PRESETS;
        this.persistCharacterPresets();
      }
    } catch (error) {
      console.error('Failed to load character presets:', error);
    }
  }

  private persistCharacterPresets(): void {
    try {
      localStorage.setItem('elite_character_presets', JSON.stringify(this.characterPresets));
    } catch (error) {
      console.error('Failed to persist character presets:', error);
    }
  }

  private loadRuleTemplates(): void {
    try {
      const stored = localStorage.getItem('elite_rule_templates');
      if (stored) {
        this.ruleTemplates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load rule templates:', error);
    }
  }

  private persistRuleTemplates(): void {
    try {
      localStorage.setItem('elite_rule_templates', JSON.stringify(this.ruleTemplates));
    } catch (error) {
      console.error('Failed to persist rule templates:', error);
    }
  }

  private loadStats(): void {
    try {
      const stored = localStorage.getItem('elite_generator_stats');
      if (stored) {
        this.generationStats = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem('elite_generator_stats', JSON.stringify(this.generationStats));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }

  /**
   * Reset all data to defaults
   */
  public resetToDefaults(): void {
    this.savedPresets = [];
    this.characterPresets = this.promptData.CHARACTER_PRESETS;
    this.ruleTemplates = this.promptData.PROMPT_TEMPLATES;
    this.generationStats = {
      totalGenerated: 0,
      presetsCreated: 0,
      charactersCreated: 0,
      templatesUsed: {},
      categoriesUsed: {},
      averagePromptLength: 0,
      lastGeneratedAt: 0
    };
    
    this.persistPresets();
    this.persistCharacterPresets();
    this.persistRuleTemplates();
    this.saveStats();
  }

  /**
   * Export all data for backup
   */
  public exportData(): string {
    return JSON.stringify({
      presets: this.savedPresets,
      characters: this.characterPresets,
      templates: this.ruleTemplates,
      stats: this.generationStats,
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * Import data from backup
   */
  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.presets) this.savedPresets = data.presets;
      if (data.characters) this.characterPresets = data.characters;
      if (data.templates) this.ruleTemplates = data.templates;
      if (data.stats) this.generationStats = data.stats;
      
      this.persistPresets();
      this.persistCharacterPresets();
      this.persistRuleTemplates();
      this.saveStats();
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Export a singleton instance for convenience
let generatorInstance: ElitePromptGenerator | null = null;

/**
 * Get or create the singleton generator instance
 */
export function getGenerator(seed?: number, config?: GeneratorConfig): ElitePromptGenerator {
  if (!generatorInstance) {
    generatorInstance = new ElitePromptGenerator(seed, config);
  }
  return generatorInstance;
}

/**
 * Reset the singleton instance
 */
export function resetGenerator(): void {
  generatorInstance = null;
}

// Export default instance
export default ElitePromptGenerator;