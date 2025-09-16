# Quick Prompt Generator - Setup Guide

## 📋 Prerequisites

Before installing the Quick Prompt Generator, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- React 18+ in your project
- TypeScript 4.9+ (optional but recommended)

## 🚀 Installation

### Step 1: Copy the Package

Copy the entire QUICKPROMPT folder to your project:

```bash
# From the root of your project
cp -r path/to/QUICKPROMPT src/

# Or if you're adding to an existing components folder
cp -r path/to/QUICKPROMPT src/components/
```

### Step 2: Install Dependencies

Install the required dependencies:

```bash
npm install \
  @tanstack/react-query \
  wouter \
  lucide-react \
  tailwindcss \
  @tailwindcss/typography \
  react-helmet \
  axios
```

Or with yarn:

```bash
yarn add \
  @tanstack/react-query \
  wouter \
  lucide-react \
  tailwindcss \
  @tailwindcss/typography \
  react-helmet \
  axios
```

### Step 3: Configure Tailwind CSS

Add the Quick Prompt components to your Tailwind configuration:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/QUICKPROMPT/**/*.{js,jsx,ts,tsx}", // Add this line
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors if needed
        primary: '#f59e0b',
        secondary: '#6366f1',
      }
    }
  },
  plugins: []
}
```

### Step 4: Setup React Query

Wrap your app with QueryClientProvider:

```tsx
// App.tsx or index.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app components */}
    </QueryClientProvider>
  );
}
```

## 🔧 Configuration

### API Configuration

Create a configuration file for API endpoints:

```typescript
// src/QUICKPROMPT/config/api.config.ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  ENDPOINTS: {
    CHARACTER_PRESETS: '/api/character-presets',
    PROMPT_TEMPLATES: '/api/prompt-templates',
    PROMPT_LIBRARY: '/api/prompt-library',
    PROMPT_CATEGORIES: '/api/prompt-library/categories',
    IMAGE_ANALYSIS: '/api/analyze-image',
    SOCIAL_CAPTION: '/api/generate-social-caption',
    ENHANCE_PROMPT: '/api/enhance-prompt',
    GENERATE_METADATA: '/api/generate-prompt-metadata'
  }
};
```

### Environment Variables

Create a `.env` file in your project root:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000

# Optional: AI Service Configuration
REACT_APP_OPENAI_API_KEY=your-key-here
REACT_APP_ANTHROPIC_API_KEY=your-key-here
REACT_APP_GOOGLE_API_KEY=your-key-here

# Optional: Feature Flags
REACT_APP_ENABLE_IMAGE_ANALYSIS=true
REACT_APP_ENABLE_SOCIAL_CAPTIONS=true
REACT_APP_ENABLE_PROMPT_ENHANCEMENT=true
```

## 🎨 Theme Configuration

Customize the theme by creating a theme configuration:

```typescript
// src/QUICKPROMPT/config/theme.config.ts
export const THEME = {
  colors: {
    primary: {
      DEFAULT: '#f59e0b',
      dark: '#d97706',
      light: '#fbbf24'
    },
    secondary: {
      DEFAULT: '#6366f1',
      dark: '#4f46e5',
      light: '#818cf8'
    }
  },
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  }
};
```

## 🔌 Backend Setup

### Option 1: Use Mock Data (No Backend)

The package includes mock data fallbacks. To use without a backend:

```typescript
// src/QUICKPROMPT/config/mock.config.ts
export const USE_MOCK_DATA = true;
```

### Option 2: Express Backend

Set up the provided backend routes:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Import Quick Prompt routes
const quickPromptRoutes = require('./QUICKPROMPT/backend/routes');

app.use(cors());
app.use(express.json());

// Mount Quick Prompt routes
app.use('/api', quickPromptRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
```

### Option 3: Next.js API Routes

For Next.js projects:

```typescript
// pages/api/quick-prompt/[...route].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { handleQuickPromptAPI } from '@/QUICKPROMPT/backend/handlers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handleQuickPromptAPI(req, res);
}
```

## 📱 PWA Setup (Optional)

To enable Progressive Web App features:

### 1. Create Manifest File

```json
// public/quickprompt-manifest.json
{
  "name": "Quick Prompt Generator",
  "short_name": "Quick Prompt",
  "description": "AI-powered prompt generator",
  "theme_color": "#f59e0b",
  "background_color": "#111827",
  "display": "standalone",
  "scope": "/",
  "start_url": "/quick-prompt",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Register Service Worker

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('quick-prompt-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/quick-prompt',
        '/data/jsonprompthelper.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## 🚦 Verification

After setup, verify the installation:

```tsx
// Test component
import QuickPromptPlay from './QUICKPROMPT/frontend/components/QuickPromptPlay';

function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <QuickPromptPlay />
    </div>
  );
}
```

## 🐛 Troubleshooting

### Common Issues

**Issue: Components not styling correctly**
- Solution: Ensure Tailwind CSS is properly configured and the QUICKPROMPT path is included in content array

**Issue: API calls failing**
- Solution: Check CORS configuration and ensure backend is running on the correct port

**Issue: Missing dependencies**
- Solution: Run `npm install` or check the package.json for missing packages

**Issue: TypeScript errors**
- Solution: Ensure tsconfig.json includes the QUICKPROMPT directory

### Debug Mode

Enable debug mode for troubleshooting:

```typescript
// Enable debug logging
localStorage.setItem('QUICKPROMPT_DEBUG', 'true');
```

## 📞 Support

For additional help:
- Check the [API Documentation](./API.md)
- Review [Example Implementations](../examples/)
- Open an issue in the repository

---

Next: [Features Guide](./FEATURES.md) →