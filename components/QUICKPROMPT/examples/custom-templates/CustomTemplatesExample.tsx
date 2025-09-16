import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from '../../frontend/components/QuickPromptPlay';

/**
 * Custom Templates Example
 * This demonstrates how to create and use custom prompt templates
 * and character presets for specialized use cases
 */

const queryClient = new QueryClient();

// Define custom templates for specific domains
const customTemplates = [
  {
    id: 'fantasy-epic',
    name: 'Epic Fantasy Scene',
    category: 'custom',
    icon: '⚔️',
    template: 'Epic fantasy {scene_type} featuring {character}, {mood} atmosphere, {magic_elements}, {art_style} style, {lighting} lighting, {composition}',
    variables: {
      scene_type: ['battle', 'quest', 'ritual', 'discovery', 'confrontation'],
      character: 'dynamic', // Will use character preset
      mood: ['heroic', 'dark', 'mystical', 'triumphant', 'ominous'],
      magic_elements: ['glowing runes', 'floating crystals', 'arcane energy', 'divine light', 'shadow magic'],
      art_style: ['realistic', 'painterly', 'concept art', 'illustration', 'cinematic'],
      lighting: ['dramatic', 'ethereal', 'moonlit', 'firelit', 'magical glow'],
      composition: ['wide shot', 'close-up', 'bird\'s eye', 'low angle', 'dutch angle']
    },
    negativePrompt: 'modern, technology, cars, phones, contemporary clothing',
    examplePrompts: [
      'Epic fantasy battle featuring armored knight, heroic atmosphere, glowing runes, realistic style, dramatic lighting, wide shot',
      'Epic fantasy ritual featuring hooded mage, mystical atmosphere, floating crystals, painterly style, ethereal lighting, close-up'
    ]
  },
  {
    id: 'sci-fi-cyberpunk',
    name: 'Cyberpunk Scene',
    category: 'custom',
    icon: '🤖',
    template: 'Cyberpunk {location} with {character}, {tech_elements}, {weather}, neon {color_scheme} lighting, {camera_angle}, {post_processing}',
    variables: {
      location: ['street', 'rooftop', 'club', 'market', 'corporate office', 'underground'],
      character: 'dynamic',
      tech_elements: ['holographic displays', 'cybernetic implants', 'flying vehicles', 'AR interfaces', 'robot assistants'],
      weather: ['rain', 'fog', 'clear night', 'smog', 'snow'],
      color_scheme: ['pink and blue', 'orange and teal', 'purple and green', 'red and cyan'],
      camera_angle: ['street level', 'high angle', 'dutch tilt', 'wide panorama', 'through window'],
      post_processing: ['film grain', 'chromatic aberration', 'bloom', 'lens flares', 'motion blur']
    },
    negativePrompt: 'medieval, fantasy, rural, natural, daylight',
    examplePrompts: [
      'Cyberpunk street with hacker protagonist, holographic displays, rain, neon pink and blue lighting, street level, film grain',
      'Cyberpunk rooftop with corporate spy, flying vehicles, fog, neon orange and teal lighting, high angle, bloom'
    ]
  },
  {
    id: 'product-commercial',
    name: 'Product Photography',
    category: 'custom',
    icon: '📸',
    template: 'Professional product photography of {product}, {surface}, {background}, {lighting_setup}, {angle}, {props}, {style}, {post_processing}',
    variables: {
      product: 'dynamic', // User inputs specific product
      surface: ['white marble', 'dark wood', 'glass', 'concrete', 'fabric', 'metal'],
      background: ['gradient', 'solid color', 'bokeh', 'studio', 'lifestyle setting'],
      lighting_setup: ['softbox', 'ring light', 'natural window', 'three-point', 'backlit'],
      angle: ['45 degrees', 'top-down', 'eye level', 'hero shot', 'detail macro'],
      props: ['minimal', 'lifestyle props', 'geometric shapes', 'plants', 'color accents'],
      style: ['minimalist', 'luxury', 'tech', 'organic', 'editorial'],
      post_processing: ['color grading', 'high contrast', 'soft focus', 'HDR', 'clean edit']
    },
    negativePrompt: 'amateur, blurry, poor lighting, cluttered',
    examplePrompts: [
      'Professional product photography of luxury watch, white marble, gradient, softbox, 45 degrees, minimal, luxury, color grading',
      'Professional product photography of organic skincare, dark wood, lifestyle setting, natural window, top-down, plants, organic, soft focus'
    ]
  },
  {
    id: 'social-lifestyle',
    name: 'Social Media Lifestyle',
    category: 'custom',
    icon: '📱',
    template: '{platform} lifestyle photo of {subject}, {activity}, {location}, {time_of_day} lighting, {mood} vibe, {filter_style}, {aspect_ratio}',
    variables: {
      platform: ['Instagram', 'Pinterest', 'TikTok', 'Facebook', 'LinkedIn'],
      subject: 'dynamic',
      activity: ['working', 'relaxing', 'exercising', 'eating', 'traveling', 'creating'],
      location: ['home office', 'coffee shop', 'gym', 'outdoor', 'studio', 'urban'],
      time_of_day: ['golden hour', 'blue hour', 'midday', 'morning', 'sunset'],
      mood: ['inspiring', 'cozy', 'energetic', 'peaceful', 'productive', 'adventurous'],
      filter_style: ['natural', 'warm', 'cool', 'vintage', 'bright and airy', 'moody'],
      aspect_ratio: ['square 1:1', 'portrait 4:5', 'landscape 16:9', 'story 9:16', 'reel 9:16']
    },
    negativePrompt: 'stock photo, fake, staged, watermark',
    examplePrompts: [
      'Instagram lifestyle photo of young entrepreneur, working, home office, morning lighting, productive vibe, bright and airy, square 1:1',
      'Pinterest lifestyle photo of home decorator, creating, studio, golden hour lighting, inspiring vibe, warm, portrait 4:5'
    ]
  }
];

// Custom character presets for specific genres
const customCharacterPresets = [
  {
    id: 'fantasy-warrior',
    name: 'Fantasy Warrior',
    description: 'Armored warrior with battle-worn equipment, strong build, determined expression, scars of battle',
    tags: ['fantasy', 'warrior', 'armor', 'medieval']
  },
  {
    id: 'cyberpunk-hacker',
    name: 'Cyberpunk Hacker',
    description: 'Tech-savvy individual with cybernetic implants, neon hair, augmented reality glasses, urban streetwear',
    tags: ['cyberpunk', 'tech', 'futuristic', 'urban']
  },
  {
    id: 'corporate-professional',
    name: 'Corporate Professional',
    description: 'Business professional in tailored suit, confident posture, modern accessories, polished appearance',
    tags: ['business', 'professional', 'corporate', 'modern']
  },
  {
    id: 'lifestyle-influencer',
    name: 'Lifestyle Influencer',
    description: 'Trendy individual with fashionable outfit, natural makeup, engaging smile, authentic presence',
    tags: ['lifestyle', 'social', 'fashion', 'influencer']
  }
];

export default function CustomTemplatesExample() {
  const [selectedTemplate, setSelectedTemplate] = useState(customTemplates[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  
  // Configuration with custom templates
  const customConfig = {
    templates: customTemplates,
    characterPresets: customCharacterPresets,
    
    // Template processor function
    processTemplate: (template: string, variables: Record<string, any>) => {
      let processed = template;
      Object.entries(variables).forEach(([key, value]) => {
        processed = processed.replace(`{${key}}`, value);
      });
      return processed;
    },
    
    // Custom validation
    validatePrompt: (prompt: string) => {
      if (prompt.length < 10) {
        return { valid: false, error: 'Prompt too short' };
      }
      if (prompt.length > 1000) {
        return { valid: false, error: 'Prompt too long' };
      }
      return { valid: true };
    },
    
    // Custom enhancement
    enhancePrompt: async (prompt: string, template: any) => {
      // Add template-specific enhancements
      const enhancements = {
        'fantasy-epic': ', highly detailed, artstation, fantasy art masterpiece',
        'sci-fi-cyberpunk': ', blade runner aesthetic, neon noir, futuristic cityscape',
        'product-commercial': ', professional photography, commercial quality, high resolution',
        'social-lifestyle': ', authentic, engaging, shareable content, trending'
      };
      
      return prompt + (enhancements[template.id] || '');
    }
  };
  
  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    console.log('Selected template:', template.name);
  };
  
  // Generate prompt from template
  const generateFromTemplate = () => {
    const variables = {};
    // Randomly select values for demonstration
    Object.entries(selectedTemplate.variables).forEach(([key, values]) => {
      if (Array.isArray(values)) {
        variables[key] = values[Math.floor(Math.random() * values.length)];
      } else if (values === 'dynamic') {
        variables[key] = `[Enter ${key}]`;
      }
    });
    
    const generated = customConfig.processTemplate(selectedTemplate.template, variables);
    setCustomPrompt(generated);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900">
        <div className="container mx-auto max-w-6xl p-6">
          <h1 className="text-4xl font-bold text-white mb-8">
            Custom Templates & Presets Example
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'templates'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Custom Templates
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'generator'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Quick Generator
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'presets'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Character Presets
            </button>
          </div>
          
          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-6 rounded-xl cursor-pointer transition-all ${
                      selectedTemplate.id === template.id
                        ? 'bg-purple-800/50 border-2 border-purple-400'
                        : 'bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{template.icon}</span>
                      <h3 className="text-xl font-bold text-white">{template.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">Category: {template.category}</p>
                    <div className="text-gray-300 text-sm">
                      <p className="font-mono bg-black/30 p-2 rounded">{template.template}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Template Testing Area */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Test Selected Template</h3>
                <button
                  onClick={generateFromTemplate}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mb-4"
                >
                  Generate Sample Prompt
                </button>
                {customPrompt && (
                  <div className="bg-black/30 p-4 rounded-lg">
                    <p className="text-gray-300 font-mono">{customPrompt}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Generator Tab */}
          {activeTab === 'generator' && (
            <div className="bg-gray-800/50 rounded-xl p-6">
              <QuickPromptPlay
                config={customConfig}
                defaultTemplate={selectedTemplate}
              />
            </div>
          )}
          
          {/* Character Presets Tab */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {customCharacterPresets.map(preset => (
                <div
                  key={preset.id}
                  className="bg-gray-800/50 rounded-xl p-4 border-2 border-gray-700 hover:border-purple-500 transition-all"
                >
                  <h4 className="text-lg font-bold text-white mb-2">{preset.name}</h4>
                  <p className="text-gray-400 text-sm mb-3">{preset.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {preset.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}

// Export custom configuration for reuse
export { customTemplates, customCharacterPresets, CustomTemplatesExample };