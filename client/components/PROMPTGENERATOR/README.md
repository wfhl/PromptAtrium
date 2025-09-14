# PROMPTGENERATOR - Elite Prompt Generator Package

## Overview
A comprehensive, standalone prompt generation package for AI image generation that supports multiple formats including Stable Diffusion, Midjourney, FLUX, DALL-E, and custom pipelines. This package provides a complete solution for generating, enhancing, and managing AI prompts with advanced features and customization options.

## Features

### Core Functionality
- **Multi-Format Support**: Generate prompts for Stable Diffusion, Midjourney, FLUX, DALL-E, Pipeline, Narrative, and Wildcard formats
- **Character Generation**: Create detailed character descriptions with customizable attributes
- **Scene Building**: Comprehensive scene composition with lighting, atmosphere, and environment options
- **Style Selection**: Choose from various artistic styles, photographers, and digital art forms
- **Template System**: Use and create custom templates with rule-based generation
- **LLM Enhancement**: Enhance prompts using AI models (OpenAI, Anthropic, etc.)
- **Preset Management**: Save, load, and organize favorite configurations
- **History Tracking**: Keep track of generated prompts with export capabilities

### Advanced Features
- **Detailed Options**: 20+ categories with hundreds of options including:
  - Architecture & Buildings
  - Art Styles & Techniques
  - Cinematic & Film
  - Fashion & Clothing
  - Human Features & Emotions
  - Science & Technology
  - Vehicles & Transportation
  - And many more...
- **Aspect Ratio Calculator**: Calculate and set optimal aspect ratios for different platforms
- **Image Analysis**: Analyze existing images to extract prompt information
- **Model Information**: Display model-specific parameters and recommendations
- **Negative Prompt Generation**: Automatically generate negative prompts for better results
- **Quality Presets**: Pre-configured quality settings for different use cases

## Quick Start

### Installation

```bash
# Copy the PROMPTGENERATOR folder to your project
cp -r PROMPTGENERATOR your-project/

# Install dependencies
npm install
```

### Basic Usage

```javascript
// Import the generator
import elitePromptGenerator from './PROMPTGENERATOR/frontend/components/ElitePromptGenerator';

// Generate a prompt
const prompt = elitePromptGenerator.generate({
  gender: 'female',
  artform: 'photography',
  photoType: 'portrait',
  lighting: 'golden hour',
  composition: 'rule of thirds',
  globalOption: 'Random' // Enable random generation
});

console.log(prompt.original); // Main prompt
console.log(prompt.midjourney); // Midjourney formatted
console.log(prompt.stable); // Stable Diffusion formatted
```

### React Component Usage

```jsx
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

function App() {
  return (
    <div>
      <ElitePromptGeneratorUI />
    </div>
  );
}
```

## Documentation

- [SETUP.md](./docs/SETUP.md) - Detailed installation and configuration
- [API.md](./docs/API.md) - Backend API documentation
- [INTEGRATION.md](./docs/INTEGRATION.md) - Framework integration examples
- [FEATURES.md](./docs/FEATURES.md) - Complete feature documentation

## Dependencies

### Frontend
- React 18+
- TypeScript 5+
- TailwindCSS (for styling)
- Zustand (for state management)
- React Hook Form (for form handling)

### Backend
- Node.js 18+
- Express
- OpenAI API (optional, for LLM enhancement)
- PostgreSQL (optional, for template storage)

## Project Structure

```
PROMPTGENERATOR/
├── frontend/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── data/            # Data files (options, presets)
│   ├── services/        # API services
│   ├── store/           # State management
│   ├── utils/           # Utility functions
│   └── hooks/           # Custom React hooks
├── backend/
│   ├── routes/          # Express routes
│   └── utils/           # Backend utilities
├── shared/              # Shared types and constants
├── config/              # Configuration files
└── docs/                # Documentation
```

## Key Components

### ElitePromptGenerator
The core generator class that handles prompt generation with various options and formats.

### ElitePromptGeneratorUI
The main React component providing a complete UI for prompt generation.

### TemplateProcessor
Handles custom templates and rule-based generation.

### LLMService
Manages integration with various LLM providers for prompt enhancement.

### PromptStore
State management for prompts, presets, and history.

## Customization

### Adding Custom Options

```javascript
// Add to fluxPromptData.ts
export const CUSTOM_OPTIONS = [
  "option1",
  "option2",
  // ...
];

// Use in generation
const prompt = elitePromptGenerator.generate({
  custom: "my custom prompt",
  // ... other options
});
```

### Creating Templates

```javascript
const template = {
  id: "my-template",
  name: "My Template",
  template: "{subject} in {place} with {lighting}",
  rules: "Always include atmospheric details",
  masterPrompt: "Enhance this prompt for cinematic quality..."
};
```

## API Endpoints

- `POST /api/enhance-prompt` - Enhance a prompt using LLM
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create a new template
- `PUT /api/templates/:id` - Update a template
- `DELETE /api/templates/:id` - Delete a template
- `GET /api/prompts/history` - Get prompt history
- `POST /api/prompts/save` - Save a prompt

## Examples

### Generate a Fantasy Character

```javascript
const fantasyCharacter = elitePromptGenerator.generate({
  gender: 'female',
  roles: 'warrior',
  clothing: 'armor',
  place: 'medieval castle',
  lighting: 'dramatic',
  additionalDetails: 'battle-worn, determined expression',
  artOptions: 'Fantasy Art'
});
```

### Create a Sci-Fi Scene

```javascript
const sciFiScene = elitePromptGenerator.generate({
  globalOption: 'No Figure Rand',
  place: 'space station',
  lighting: 'neon lights',
  background: 'galaxy background',
  scienceOptions: 'futuristic technology',
  cinematicOptions: 'cyberpunk aesthetic'
});
```

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This package is provided as-is for integration into your projects. Please ensure you comply with any API terms of service when using LLM enhancement features.

## Support

For issues, questions, or feature requests, please open an issue in the repository.

## Acknowledgments

This package is built on top of various open-source technologies and inspired by community contributions to AI prompt engineering.