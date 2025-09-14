# Quick Prompt Generator - Standalone Package

A comprehensive, production-ready prompt generation system that can be integrated into any application as a plug-and-play solution.

## 🌟 Features

### Core Functionality
- **Template-Based Prompt Generation**: 15+ professional templates including Photography, Artistic, Cinematic, and Lifestyle
- **Character Preset Management**: Create, save, and manage custom character presets
- **Smart Prompt Enhancement**: AI-powered prompt enhancement with multiple LLM providers
- **Image Analysis**: Upload images for AI-powered analysis and prompt generation
- **Social Media Caption Generation**: Generate engaging captions for social platforms
- **JSON Prompt Data**: Extensive categorized prompt suggestions with 100+ scenarios
- **Random Generation**: Sparkle button for instant creative inspiration
- **Prompt Library Integration**: Share and save prompts to personal or community libraries

### UI/UX Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Progressive Web App (PWA)**: Install as a standalone app on any device
- **Dark/Light Theme Support**: Automatic theme detection and manual switching
- **Collapsible Sections**: Clean interface with expandable options
- **Real-time Preview**: See generated prompts update as you type
- **Toast Notifications**: User-friendly feedback for all actions
- **Floating Mobile Dock**: Easy navigation on mobile devices

### Developer Features
- **TypeScript Support**: Fully typed components and interfaces
- **Modular Architecture**: Easy to customize and extend
- **Mock Data Fallback**: Works offline with built-in data
- **Configurable Backends**: Easy API endpoint configuration
- **Comprehensive Documentation**: Detailed setup and customization guides
- **Example Implementations**: Multiple ready-to-use examples

## 🚀 Quick Start

### Installation

```bash
# Copy the QUICKPROMPT folder to your project
cp -r QUICKPROMPT your-project/src/

# Install dependencies
npm install
```

### Basic Usage

```tsx
import QuickPromptPlay from './QUICKPROMPT/frontend/components/QuickPromptPlay';

function App() {
  return (
    <div className="app">
      <QuickPromptPlay />
    </div>
  );
}
```

### Standalone Page

```tsx
import StandaloneQuickPrompter from './QUICKPROMPT/frontend/pages/StandaloneQuickPrompter';

function App() {
  return <StandaloneQuickPrompter />;
}
```

## 📁 Package Structure

```
QUICKPROMPT/
├── frontend/
│   ├── pages/              # Page components
│   ├── components/          # Core components
│   ├── components/ui/       # UI components library
│   ├── components/mobile/   # Mobile-specific components
│   ├── data/               # JSON data files
│   ├── hooks/              # React hooks
│   ├── utils/              # Utility functions
│   └── lib/                # Library code
├── backend/
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Backend utilities
│   └── types/              # TypeScript types
├── docs/                   # Documentation
├── examples/               # Example implementations
├── config/                 # Configuration files
└── assets/                 # Static assets
```

## 🎯 Key Components

### QuickPromptPlay
The main prompt generator component with all features integrated.

### ShareToLibraryModal
Modal for sharing prompts to personal or community libraries.

### CompactCharacterSaveDialog
Dialog for saving custom character presets.

### Mobile Components
- MobileHeader: Responsive header for mobile devices
- MobileFloatingDock: Navigation dock for mobile UX

## 🔧 Configuration

### API Endpoints
Configure your backend endpoints in `config/api.config.ts`:

```typescript
export const API_CONFIG = {
  CHARACTER_PRESETS: '/api/character-presets',
  PROMPT_TEMPLATES: '/api/prompt-templates',
  PROMPT_LIBRARY: '/api/prompt-library',
  IMAGE_ANALYSIS: '/api/analyze-image',
  SOCIAL_CAPTION: '/api/generate-social-caption',
  ENHANCE_PROMPT: '/api/enhance-prompt'
};
```

### Theme Configuration
Customize colors and themes in `config/theme.config.ts`:

```typescript
export const THEME_CONFIG = {
  primary: '#f59e0b',
  secondary: '#6366f1',
  accent: '#10b981',
  // ...more theme options
};
```

## 📚 Documentation

- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration
- **[API Documentation](./docs/API.md)** - Backend API endpoints reference
- **[Features Guide](./docs/FEATURES.md)** - Complete feature documentation
- **[Integration Guide](./docs/INTEGRATION.md)** - Framework integration examples
- **[Customization Guide](./docs/CUSTOMIZATION.md)** - Customization instructions

## 🎨 Examples

Check the `examples/` directory for:
- Basic implementation
- Advanced with image analysis
- Mobile-responsive implementation
- Custom template example
- API integration examples

## 🛠 Dependencies

Core dependencies:
- React 18+
- TypeScript 4.9+
- Tailwind CSS 3+
- React Query (TanStack Query v5)
- Wouter (routing)
- Lucide React (icons)

See `package.json` for complete dependency list.

## 📝 License

This package is part of the Elite Assets platform. See LICENSE file for details.

## 🤝 Support

For support, feature requests, or contributions:
- Open an issue in the repository
- Contact the development team
- Check the documentation for troubleshooting

## 🚀 Roadmap

- [ ] Additional AI model integrations
- [ ] Voice input support
- [ ] Multi-language support
- [ ] Advanced template editor
- [ ] Batch prompt generation
- [ ] Export/Import functionality
- [ ] Community template marketplace

---

Built with ❤️ by Elite Assets Team