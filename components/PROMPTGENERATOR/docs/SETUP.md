# PROMPTGENERATOR Setup Guide

## Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- (Optional) PostgreSQL for template storage
- (Optional) API keys for LLM providers

## Installation Steps

### 1. Copy the Package

```bash
# Copy the entire PROMPTGENERATOR folder to your project
cp -r PROMPTGENERATOR /path/to/your/project/
```

### 2. Install Dependencies

Navigate to your project directory and install the required dependencies:

```bash
cd /path/to/your/project
npm install
```

Required dependencies:
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "zustand": "^4.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "zod": "^3.0.0",
    "axios": "^1.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "tsx": "^4.0.0"
  }
}
```

### 3. Environment Configuration

Create a `.env` file in your project root:

```bash
# LLM Provider API Keys (Optional - for enhancement features)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Database Configuration (Optional - for template storage)
DATABASE_URL=postgresql://user:password@localhost:5432/promptgen

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=http://localhost:3000
```

### 4. TypeScript Configuration

Ensure your `tsconfig.json` includes the PROMPTGENERATOR paths:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@promptgen/*": ["./PROMPTGENERATOR/*"],
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src",
    "PROMPTGENERATOR"
  ],
  "exclude": ["node_modules"]
}
```

### 5. TailwindCSS Configuration

Add PROMPTGENERATOR to your Tailwind content paths:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./PROMPTGENERATOR/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // Add any custom theme extensions
    },
  },
  plugins: [],
}
```

### 6. Vite Configuration (if using Vite)

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@promptgen': path.resolve(__dirname, './PROMPTGENERATOR'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

## Backend Setup

### 1. Express Server Setup

Create or modify your Express server to include the prompt generator routes:

```javascript
// server.js or app.js
import express from 'express';
import cors from 'cors';
import { enhancePromptRouter } from './PROMPTGENERATOR/backend/routes/enhance-prompt';
import { promptRoutesRouter } from './PROMPTGENERATOR/backend/routes/prompt-routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', enhancePromptRouter);
app.use('/api', promptRoutesRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Database Setup (Optional)

If using PostgreSQL for template storage:

```sql
-- Create database
CREATE DATABASE promptgen;

-- Connect to database
\c promptgen;

-- Create templates table
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  rules TEXT,
  master_prompt TEXT,
  llm_provider VARCHAR(50),
  llm_model VARCHAR(100),
  use_happy_talk BOOLEAN DEFAULT FALSE,
  compress_prompt BOOLEAN DEFAULT FALSE,
  compression_level INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create prompts history table
CREATE TABLE prompt_history (
  id SERIAL PRIMARY KEY,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  format VARCHAR(50),
  options JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create presets table
CREATE TABLE presets (
  id SERIAL PRIMARY KEY,
  preset_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Integration

### 1. React Application Integration

```jsx
// App.jsx
import React from 'react';
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';
import './PROMPTGENERATOR/frontend/styles/promptgen.css'; // If you have custom styles

function App() {
  return (
    <div className="App">
      <ElitePromptGeneratorUI />
    </div>
  );
}

export default App;
```

### 2. Next.js Integration

```jsx
// pages/prompt-generator.jsx or app/prompt-generator/page.jsx
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ElitePromptGeneratorUI = dynamic(
  () => import('../PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI'),
  { ssr: false }
);

export default function PromptGeneratorPage() {
  return (
    <div className="container mx-auto p-4">
      <ElitePromptGeneratorUI />
    </div>
  );
}
```

### 3. Vue.js Integration

Create a wrapper component:

```vue
<!-- PromptGenerator.vue -->
<template>
  <div ref="promptGenContainer"></div>
</template>

<script>
import { createRoot } from 'react-dom/client';
import { ElitePromptGeneratorUI } from '../PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

export default {
  mounted() {
    const root = createRoot(this.$refs.promptGenContainer);
    root.render(React.createElement(ElitePromptGeneratorUI));
  },
  beforeUnmount() {
    // Clean up React component
    const root = createRoot(this.$refs.promptGenContainer);
    root.unmount();
  }
}
</script>
```

## Configuration Options

### 1. LLM Provider Configuration

Configure available LLM providers in `llmService.ts`:

```javascript
// PROMPTGENERATOR/frontend/services/llmService.ts
export const LLM_PROVIDERS = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    models: ['gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4'
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    models: ['claude-3-opus', 'claude-3-sonnet'],
    defaultModel: 'claude-3-sonnet'
  },
  // Add more providers as needed
};
```

### 2. UI Customization

Customize the UI by modifying the component props:

```jsx
<ElitePromptGeneratorUI
  theme="dark" // or "light"
  showHistory={true}
  showTemplates={true}
  showEnhancement={true}
  maxHistoryItems={50}
  defaultFormat="stable" // or "midjourney", "flux", etc.
  onPromptGenerated={(prompt) => console.log(prompt)}
  customStyles={{
    container: 'max-w-6xl mx-auto',
    button: 'bg-blue-500 hover:bg-blue-600'
  }}
/>
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure all paths in imports are correct
   - Check that TypeScript paths are configured properly

2. **API connection issues**
   - Verify backend server is running
   - Check CORS configuration
   - Ensure API URLs are correct in environment variables

3. **Styling issues**
   - Make sure TailwindCSS is properly configured
   - Check that PostCSS is processing the styles

4. **LLM enhancement not working**
   - Verify API keys are set in environment variables
   - Check API rate limits and quotas
   - Ensure network connectivity to API providers

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// In your .env file
DEBUG=true
LOG_LEVEL=verbose

// In your code
import { setDebugMode } from './PROMPTGENERATOR/frontend/utils/debug';
setDebugMode(true);
```

## Performance Optimization

### 1. Code Splitting

```javascript
// Lazy load heavy components
const EliteImageAnalyzer = React.lazy(() => 
  import('./PROMPTGENERATOR/frontend/components/EliteImageAnalyzer')
);

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <EliteImageAnalyzer />
</Suspense>
```

### 2. Caching

Implement caching for API responses:

```javascript
// Add to your API service
const cache = new Map();

export async function enhancePrompt(prompt, options) {
  const cacheKey = `${prompt}-${JSON.stringify(options)}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const result = await api.post('/enhance-prompt', { prompt, options });
  cache.set(cacheKey, result);
  
  return result;
}
```

## Testing

### Unit Tests

```javascript
// PROMPTGENERATOR/__tests__/generator.test.js
import elitePromptGenerator from '../frontend/components/ElitePromptGenerator';

describe('ElitePromptGenerator', () => {
  test('generates basic prompt', () => {
    const prompt = elitePromptGenerator.generate({
      gender: 'female',
      artform: 'photography'
    });
    
    expect(prompt.original).toBeTruthy();
    expect(prompt.stable).toBeTruthy();
  });
});
```

### Integration Tests

```javascript
// PROMPTGENERATOR/__tests__/api.test.js
import request from 'supertest';
import app from '../backend/app';

describe('API Endpoints', () => {
  test('POST /api/enhance-prompt', async () => {
    const response = await request(app)
      .post('/api/enhance-prompt')
      .send({ prompt: 'test prompt' });
    
    expect(response.status).toBe(200);
    expect(response.body.enhanced).toBeTruthy();
  });
});
```

## Deployment

### Production Build

```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

## Support

For additional help:
- Check the [FAQ](./FAQ.md)
- Open an issue on GitHub
- Contact support

## Next Steps

- Read the [API Documentation](./API.md)
- Explore [Integration Examples](./INTEGRATION.md)
- Learn about [Advanced Features](./FEATURES.md)