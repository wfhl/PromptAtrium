/**
 * Test file for Elite Prompt Generator
 * This file demonstrates and tests the generator functionality
 */

import { 
  ElitePromptGenerator,
  generatePrompt,
  generateRandomPrompt,
  batchGenerate,
  formatPromptForPlatform,
  validateOptions,
  extractComponentsFromText
} from './index';

// Create test function to verify generator works
export function testPromptGenerator(): void {
  console.log('🧪 Testing Elite Prompt Generator...\n');
  
  // Test 1: Basic generation
  console.log('Test 1: Basic Generation');
  const basicPrompt = generatePrompt({
    subject: 'portrait',
    gender: 'female',
    defaultTags: 'elegant woman',
    lighting: 'golden hour',
    mood: 'peaceful'
  });
  console.log('Basic prompt:', basicPrompt.original);
  console.log('Negative prompt:', basicPrompt.negativePrompt);
  console.log('---\n');
  
  // Test 2: Random generation
  console.log('Test 2: Random Generation');
  const randomPrompt = generateRandomPrompt('male');
  console.log('Random prompt:', randomPrompt.original);
  console.log('---\n');
  
  // Test 3: Multiple format outputs
  console.log('Test 3: Multiple Format Outputs');
  const generator = new ElitePromptGenerator();
  const multiFormat = generator.generate({
    subject: 'cyberpunk city',
    place: 'neon-lit street',
    lighting: 'neon lights',
    mood: 'futuristic',
    artform: 'digital art',
    photographyStyles: 'cinematic'
  });
  console.log('Original:', multiFormat.original);
  console.log('Stable Diffusion:', multiFormat.stable);
  console.log('Midjourney:', multiFormat.midjourney);
  console.log('Pipeline:', multiFormat.pipeline);
  console.log('Narrative:', multiFormat.narrative);
  console.log('---\n');
  
  // Test 4: Character preset
  console.log('Test 4: Character Preset');
  const characterPreset = {
    id: 'test-char-1',
    name: 'Fantasy Warrior',
    gender: 'female' as const,
    bodyType: 'athletic',
    defaultTag: 'warrior woman',
    role: 'warrior',
    hairstyle: 'long flowing hair',
    hairColor: 'silver',
    eyeColor: 'blue',
    skinTone: 'fair',
    clothing: 'armor',
    additionalDetails: 'battle-ready stance',
    favorite: false,
    createdAt: Date.now()
  };
  generator.saveCharacterPreset(characterPreset);
  
  const loadedPreset = generator.loadCharacterPreset('test-char-1');
  if (loadedPreset) {
    const presetPrompt = generator.generate({
      gender: loadedPreset.gender,
      defaultTags: loadedPreset.defaultTag,
      bodyTypes: loadedPreset.bodyType,
      roles: loadedPreset.role,
      hairstyles: loadedPreset.hairstyle,
      hairColor: loadedPreset.hairColor,
      clothing: loadedPreset.clothing
    });
    console.log('Character preset prompt:', presetPrompt.original);
  }
  console.log('---\n');
  
  // Test 5: Batch generation
  console.log('Test 5: Batch Generation');
  const batchPrompts = batchGenerate(
    {
      subject: 'landscape',
      artform: 'photography',
      mood: 'peaceful'
    },
    3,
    ['lighting', 'place', 'atmosphere']
  );
  batchPrompts.forEach((prompt, index) => {
    console.log(`Batch ${index + 1}:`, prompt.original.substring(0, 100) + '...');
  });
  console.log('---\n');
  
  // Test 6: Platform-specific formatting
  console.log('Test 6: Platform-Specific Formatting');
  const basePrompt = 'fantasy dragon in mountain landscape';
  console.log('Midjourney:', formatPromptForPlatform(basePrompt, 'midjourney', { aspectRatio: '16:9' }));
  console.log('Stable:', formatPromptForPlatform(basePrompt, 'stable'));
  console.log('DALL-E:', formatPromptForPlatform(basePrompt, 'dalle'));
  console.log('---\n');
  
  // Test 7: Option validation
  console.log('Test 7: Option Validation');
  const validationResult = validateOptions({
    gender: 'male',
    makeup: 'bold lipstick', // This should trigger a suggestion
    aspectRatio: '16:9',
    photographer: 'Annie Leibovitz' // This should suggest adding a device
  });
  console.log('Validation result:', validationResult);
  console.log('---\n');
  
  // Test 8: Text extraction
  console.log('Test 8: Component Extraction from Text');
  const extractedOptions = extractComponentsFromText(
    'beautiful woman in golden hour lighting at a forest with peaceful mood'
  );
  console.log('Extracted options:', extractedOptions);
  console.log('---\n');
  
  // Test 9: Preset management
  console.log('Test 9: Preset Management');
  generator.savePreset({
    id: 'test-preset-1',
    name: 'Cinematic Portrait',
    options: {
      photographyStyles: 'cinematic',
      lighting: 'dramatic lighting',
      composition: 'close-up',
      mood: 'intense'
    },
    favorite: true,
    createdAt: Date.now()
  });
  
  const presets = generator.getPresets();
  console.log('Saved presets count:', presets.length);
  console.log('First preset:', presets[0]);
  console.log('---\n');
  
  // Test 10: Statistics
  console.log('Test 10: Generator Statistics');
  const stats = generator.getStats();
  console.log('Total generated:', stats.totalGenerated);
  console.log('Templates used:', stats.templatesUsed);
  console.log('Average prompt length:', Math.round(stats.averagePromptLength));
  console.log('---\n');
  
  // Test 11: Template management
  console.log('Test 11: Rule Templates');
  const templates = generator.getRuleTemplates();
  console.log('Available templates:', templates.map(t => t.name).join(', '));
  
  // Add custom template
  generator.saveRuleTemplate({
    id: 'custom-test',
    name: 'Test Template',
    description: 'Custom test template',
    template: 'Test: {subject} with {mood} in {place}',
    rules: 'Test template rules',
    formatTemplate: '{subject} | {mood} | {place}'
  });
  
  const customTemplatePrompt = generator.generate({
    subject: 'dragon',
    mood: 'mysterious',
    place: 'ancient ruins',
    selectedTemplate: 'custom-test'
  });
  console.log('Custom template output:', customTemplatePrompt.custom);
  console.log('---\n');
  
  // Test 12: Data export/import
  console.log('Test 12: Data Export/Import');
  const exportedData = generator.exportData();
  console.log('Exported data length:', exportedData.length, 'characters');
  
  // Test import
  const importSuccess = generator.importData(exportedData);
  console.log('Import successful:', importSuccess);
  console.log('---\n');
  
  console.log('✅ All tests completed successfully!');
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - attach to window for manual testing
  (window as any).testPromptGenerator = testPromptGenerator;
  console.log('Test function attached to window. Run: testPromptGenerator()');
} else {
  // Node environment - run tests immediately
  testPromptGenerator();
}