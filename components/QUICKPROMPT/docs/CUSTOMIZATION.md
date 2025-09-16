# Quick Prompt Generator - Customization Guide

## 🎨 UI Customization

### Theme Customization

#### Color Schemes

```css
/* QUICKPROMPT/styles/custom-theme.css */
:root {
  /* Primary Colors */
  --qp-primary: #f59e0b;
  --qp-primary-dark: #d97706;
  --qp-primary-light: #fbbf24;
  
  /* Secondary Colors */
  --qp-secondary: #6366f1;
  --qp-secondary-dark: #4f46e5;
  --qp-secondary-light: #818cf8;
  
  /* Background Colors */
  --qp-bg-primary: #111827;
  --qp-bg-secondary: #1f2937;
  --qp-bg-tertiary: #374151;
  
  /* Text Colors */
  --qp-text-primary: #f9fafb;
  --qp-text-secondary: #d1d5db;
  --qp-text-muted: #9ca3af;
  
  /* Accent Colors */
  --qp-success: #10b981;
  --qp-warning: #f59e0b;
  --qp-error: #ef4444;
  --qp-info: #3b82f6;
}

/* Dark Theme Override */
[data-theme="dark"] {
  --qp-bg-primary: #000000;
  --qp-bg-secondary: #0a0a0a;
  --qp-text-primary: #ffffff;
}

/* Light Theme Override */
[data-theme="light"] {
  --qp-bg-primary: #ffffff;
  --qp-bg-secondary: #f3f4f6;
  --qp-text-primary: #111827;
}
```

#### Component Styling

```tsx
// Custom component styling
const customStyles = {
  button: {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
    secondary: 'bg-gray-700 hover:bg-gray-600',
  },
  card: {
    background: 'bg-gradient-to-br from-gray-900 to-gray-800',
    border: 'border-2 border-purple-500/20',
  },
  input: {
    base: 'bg-gray-800/50 backdrop-blur border-gray-600 focus:border-purple-500',
  }
};

// Apply custom styles
<QuickPromptPlay customStyles={customStyles} />
```

### Layout Customization

#### Compact Mode

```tsx
// Enable compact mode for smaller screens
<QuickPromptPlay 
  layout="compact"
  showHeader={false}
  collapsibleSections={true}
/>
```

#### Grid Layout

```tsx
// Custom grid layout
const customLayout = {
  columns: 2,
  gap: 'lg',
  sections: {
    input: { col: 1, row: 1 },
    templates: { col: 2, row: 1 },
    output: { col: 'span-2', row: 2 },
    actions: { col: 'span-2', row: 3 }
  }
};

<QuickPromptPlay layout={customLayout} />
```

---

## 📝 Template Customization

### Creating Custom Templates

```typescript
// QUICKPROMPT/config/custom-templates.ts
export const customTemplates = [
  {
    id: 'custom-1',
    name: 'Epic Fantasy',
    category: 'custom',
    icon: '⚔️',
    template: 'Epic fantasy scene featuring {character} in {setting}, {mood} atmosphere, {style} art style, magical elements include {magic}',
    variables: {
      character: {
        label: 'Character',
        type: 'text',
        placeholder: 'warrior, mage, dragon rider'
      },
      setting: {
        label: 'Setting',
        type: 'select',
        options: ['ancient castle', 'enchanted forest', 'floating city', 'dragon lair']
      },
      mood: {
        label: 'Mood',
        type: 'select',
        options: ['dramatic', 'mysterious', 'epic', 'dark', 'heroic']
      },
      style: {
        label: 'Art Style',
        type: 'select',
        options: ['realistic', 'painterly', 'concept art', 'illustration']
      },
      magic: {
        label: 'Magical Elements',
        type: 'multiselect',
        options: ['glowing runes', 'floating crystals', 'magical aura', 'spell effects']
      }
    },
    examples: [
      'Epic fantasy scene featuring armored warrior in ancient castle, dramatic atmosphere, realistic art style, magical elements include glowing runes',
      'Epic fantasy scene featuring powerful mage in enchanted forest, mysterious atmosphere, painterly art style, magical elements include floating crystals'
    ],
    negativePrompt: 'modern, technology, cars, phones, contemporary',
    metadata: {
      author: 'Custom',
      version: '1.0',
      tags: ['fantasy', 'epic', 'magic']
    }
  }
];

// Register custom templates
QuickPrompt.registerTemplates(customTemplates);
```

### Template Variables

```typescript
// Advanced template variable types
const advancedTemplate = {
  name: 'Advanced Portrait',
  template: '{expression} portrait of {character}, {lighting} lighting, shot with {camera} at {aperture}, {postprocessing}',
  variables: {
    expression: {
      type: 'slider',
      min: 0,
      max: 100,
      labels: ['Neutral', 'Happy', 'Dramatic'],
      default: 50
    },
    camera: {
      type: 'autocomplete',
      suggestions: ['Canon 5D', 'Nikon D850', 'Sony A7R', 'Hasselblad'],
      allowCustom: true
    },
    aperture: {
      type: 'range',
      options: ['f/1.2', 'f/1.4', 'f/1.8', 'f/2.8', 'f/4', 'f/5.6'],
      default: 'f/2.8'
    },
    postprocessing: {
      type: 'chips',
      options: ['color grading', 'film grain', 'vignette', 'bokeh'],
      multiple: true
    }
  }
};
```

### Template Groups

```typescript
// Organize templates into groups
const templateGroups = {
  'Professional': [
    'photography-professional',
    'product-photography',
    'architectural'
  ],
  'Creative': [
    'artistic-expression',
    'surreal-art',
    'abstract'
  ],
  'Commercial': [
    'advertising',
    'social-media',
    'ecommerce'
  ]
};

<QuickPromptPlay templateGroups={templateGroups} />
```

---

## 👤 Character Preset Customization

### Custom Character Schema

```typescript
// QUICKPROMPT/config/character-schema.ts
export const customCharacterSchema = {
  fields: [
    {
      name: 'species',
      label: 'Species',
      type: 'select',
      options: ['human', 'elf', 'dwarf', 'orc', 'dragon', 'alien'],
      required: true
    },
    {
      name: 'class',
      label: 'Class/Role',
      type: 'select',
      options: ['warrior', 'mage', 'rogue', 'cleric', 'ranger'],
      conditional: {
        field: 'species',
        values: ['human', 'elf', 'dwarf']
      }
    },
    {
      name: 'armor',
      label: 'Armor Type',
      type: 'multiselect',
      options: ['plate', 'leather', 'cloth', 'chainmail', 'scale'],
      conditional: {
        field: 'class',
        values: ['warrior', 'ranger']
      }
    },
    {
      name: 'magicAffinity',
      label: 'Magic Affinity',
      type: 'slider',
      min: 0,
      max: 100,
      conditional: {
        field: 'class',
        values: ['mage', 'cleric']
      }
    }
  ],
  validation: {
    requiredFields: ['species', 'name'],
    customValidation: (character) => {
      if (character.species === 'dragon' && character.class) {
        return { error: 'Dragons cannot have classes' };
      }
      return { valid: true };
    }
  }
};
```

### Character Import/Export

```typescript
// Character preset import/export functionality
const characterExporter = {
  exportFormat: 'json', // or 'csv', 'yaml'
  
  exportCharacter: (character) => {
    return JSON.stringify(character, null, 2);
  },
  
  importCharacter: (data, format = 'json') => {
    if (format === 'json') {
      return JSON.parse(data);
    } else if (format === 'csv') {
      // CSV parsing logic
    }
  },
  
  exportBulk: (characters) => {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      characters: characters
    };
  }
};
```

---

## 🔌 API Customization

### Custom API Providers

```typescript
// QUICKPROMPT/config/api-providers.ts
export class CustomAIProvider {
  name = 'Custom AI';
  endpoint = 'https://api.custom-ai.com';
  
  async enhancePrompt(prompt: string, options: any) {
    const response = await fetch(`${this.endpoint}/enhance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, ...options })
    });
    
    return response.json();
  }
  
  async analyzeImage(image: File, options: any) {
    const formData = new FormData();
    formData.append('image', image);
    
    const response = await fetch(`${this.endpoint}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });
    
    return response.json();
  }
}

// Register custom provider
QuickPrompt.registerProvider('custom-ai', new CustomAIProvider());
```

### API Response Transformers

```typescript
// Transform API responses to match expected format
const apiTransformers = {
  characterPresets: (response) => {
    return response.data.map(preset => ({
      id: preset.uuid,
      name: preset.title,
      description: preset.desc,
      // Map custom fields
      customField: preset.extra_data
    }));
  },
  
  promptTemplates: (response) => {
    return response.templates.map(template => ({
      id: template.id,
      name: template.label,
      template: template.prompt_text,
      variables: parseVariables(template.prompt_text)
    }));
  }
};

<QuickPromptPlay apiTransformers={apiTransformers} />
```

---

## 🎯 Feature Customization

### Enable/Disable Features

```typescript
// Feature configuration
const featureConfig = {
  enableImageAnalysis: true,
  enableSocialCaptions: false,
  enablePromptLibrary: true,
  enableCharacterPresets: true,
  enableRandomGeneration: true,
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableOfflineMode: true,
  enablePWA: true,
  
  // Advanced features
  enableBatchGeneration: false,
  enablePromptHistory: true,
  enableAutoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  
  // UI features
  showAdvancedOptions: false,
  showTutorial: true,
  showKeyboardShortcuts: true
};

<QuickPromptPlay features={featureConfig} />
```

### Custom Actions

```typescript
// Add custom action buttons
const customActions = [
  {
    id: 'export-pdf',
    label: 'Export as PDF',
    icon: '📄',
    position: 'toolbar',
    onClick: async (promptData) => {
      const pdf = await generatePDF(promptData);
      downloadPDF(pdf);
    }
  },
  {
    id: 'send-to-ai',
    label: 'Send to AI Generator',
    icon: '🤖',
    position: 'output',
    onClick: async (promptData) => {
      await sendToAIGenerator(promptData.prompt);
    }
  },
  {
    id: 'schedule',
    label: 'Schedule Generation',
    icon: '⏰',
    position: 'menu',
    onClick: (promptData) => {
      openScheduleDialog(promptData);
    }
  }
];

<QuickPromptPlay customActions={customActions} />
```

---

## 🌐 Localization

### Language Configuration

```typescript
// QUICKPROMPT/config/localization.ts
export const languages = {
  en: {
    generate: 'Generate Prompt',
    subject: 'Subject',
    character: 'Character',
    template: 'Template',
    randomize: 'Randomize',
    save: 'Save',
    share: 'Share',
    copy: 'Copy',
    // ... more translations
  },
  es: {
    generate: 'Generar Prompt',
    subject: 'Sujeto',
    character: 'Personaje',
    template: 'Plantilla',
    randomize: 'Aleatorizar',
    save: 'Guardar',
    share: 'Compartir',
    copy: 'Copiar',
    // ... more translations
  },
  ja: {
    generate: 'プロンプトを生成',
    subject: '主題',
    character: 'キャラクター',
    template: 'テンプレート',
    randomize: 'ランダム',
    save: '保存',
    share: '共有',
    copy: 'コピー',
    // ... more translations
  }
};

// Use with language prop
<QuickPromptPlay language="es" translations={languages.es} />
```

---

## 🔧 Advanced Customization

### Plugin System

```typescript
// QUICKPROMPT/plugins/example-plugin.ts
export class ExamplePlugin {
  name = 'Example Plugin';
  version = '1.0.0';
  
  onInit(quickPrompt) {
    console.log('Plugin initialized');
    
    // Add custom template
    quickPrompt.addTemplate({
      id: 'plugin-template',
      name: 'Plugin Template',
      template: 'Custom template from plugin'
    });
    
    // Hook into events
    quickPrompt.on('prompt:generated', (data) => {
      console.log('Prompt generated:', data);
    });
    
    // Add custom UI element
    quickPrompt.addUIElement({
      position: 'afterTemplates',
      component: CustomPluginComponent
    });
  }
  
  onDestroy() {
    console.log('Plugin destroyed');
  }
}

// Register plugin
QuickPrompt.registerPlugin(new ExamplePlugin());
```

### Event Hooks

```typescript
// Available event hooks
const eventHooks = {
  onInit: () => {
    console.log('Quick Prompt initialized');
  },
  
  onPromptGenerate: (data) => {
    console.log('Generating prompt:', data);
    // Modify data before generation
    return { ...data, customField: 'value' };
  },
  
  onPromptGenerated: (result) => {
    console.log('Prompt generated:', result);
    // Post-process the result
  },
  
  onCharacterSelect: (character) => {
    console.log('Character selected:', character);
  },
  
  onTemplateSelect: (template) => {
    console.log('Template selected:', template);
  },
  
  onImageAnalyzed: (analysis) => {
    console.log('Image analyzed:', analysis);
  },
  
  onError: (error) => {
    console.error('Error occurred:', error);
    // Custom error handling
  }
};

<QuickPromptPlay hooks={eventHooks} />
```

### Custom Storage Adapter

```typescript
// Custom storage implementation
class CustomStorage {
  async getItem(key: string) {
    // Custom storage logic (e.g., IndexedDB, cloud storage)
    return await customDB.get(key);
  }
  
  async setItem(key: string, value: any) {
    return await customDB.set(key, value);
  }
  
  async removeItem(key: string) {
    return await customDB.delete(key);
  }
  
  async clear() {
    return await customDB.clear();
  }
}

// Use custom storage
<QuickPromptPlay storage={new CustomStorage()} />
```

---

## 🎨 CSS Variables Reference

```css
/* Complete CSS variable list for customization */
:root {
  /* Spacing */
  --qp-spacing-xs: 0.25rem;
  --qp-spacing-sm: 0.5rem;
  --qp-spacing-md: 1rem;
  --qp-spacing-lg: 1.5rem;
  --qp-spacing-xl: 2rem;
  
  /* Border Radius */
  --qp-radius-sm: 0.25rem;
  --qp-radius-md: 0.5rem;
  --qp-radius-lg: 0.75rem;
  --qp-radius-full: 9999px;
  
  /* Shadows */
  --qp-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --qp-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --qp-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --qp-transition-fast: 150ms;
  --qp-transition-normal: 300ms;
  --qp-transition-slow: 500ms;
  
  /* Z-Index */
  --qp-z-dropdown: 1000;
  --qp-z-modal: 1050;
  --qp-z-popover: 1100;
  --qp-z-tooltip: 1150;
}
```

---

## 📚 Examples

### Minimal Customization

```tsx
// Minimal setup with custom theme
<QuickPromptPlay 
  theme="dark"
  primaryColor="#8b5cf6"
  accentColor="#ec4899"
/>
```

### Full Customization

```tsx
// Complete customization example
<QuickPromptPlay
  // Theme
  theme={customTheme}
  styles={customStyles}
  
  // Features
  features={featureConfig}
  
  // Templates
  templates={customTemplates}
  templateGroups={templateGroups}
  
  // Characters
  characterSchema={customCharacterSchema}
  
  // API
  apiProviders={customProviders}
  apiTransformers={apiTransformers}
  
  // Actions
  customActions={customActions}
  
  // Events
  hooks={eventHooks}
  
  // Localization
  language="en"
  translations={languages.en}
  
  // Storage
  storage={customStorage}
  
  // Layout
  layout={customLayout}
/>
```

---

Next: [Examples](../examples/) →