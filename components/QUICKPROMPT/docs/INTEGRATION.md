# Quick Prompt Generator - Integration Guide

## 🚀 Framework Integration Examples

### React Application

#### Basic Integration

```tsx
// App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from './QUICKPROMPT/frontend/components/QuickPromptPlay';
import './QUICKPROMPT/styles/quickprompt.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <QuickPromptPlay />
      </div>
    </QueryClientProvider>
  );
}

export default App;
```

#### With React Router

```tsx
// App.tsx with React Router
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StandaloneQuickPrompter from './QUICKPROMPT/frontend/pages/StandaloneQuickPrompter';
import QuickPromptPlayground from './QUICKPROMPT/frontend/pages/QuickPromptPlayground';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/prompt" element={<StandaloneQuickPrompter />} />
        <Route path="/playground" element={<QuickPromptPlayground />} />
      </Routes>
    </Router>
  );
}
```

---

### Next.js Integration

#### Pages Router

```tsx
// pages/quick-prompt.tsx
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const QuickPromptPlay = dynamic(
  () => import('../QUICKPROMPT/frontend/components/QuickPromptPlay'),
  { ssr: false }
);

const queryClient = new QueryClient();

export default function QuickPromptPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <QuickPromptPlay />
    </QueryClientProvider>
  );
}
```

#### App Router

```tsx
// app/quick-prompt/page.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from '@/QUICKPROMPT/frontend/components/QuickPromptPlay';

const queryClient = new QueryClient();

export default function QuickPromptPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto p-4">
        <QuickPromptPlay />
      </div>
    </QueryClientProvider>
  );
}
```

#### API Routes

```typescript
// pages/api/quick-prompt/[...params].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { handleQuickPromptRequest } from '../../../QUICKPROMPT/backend/routes';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { params } = req.query;
  const path = Array.isArray(params) ? params.join('/') : params;
  
  return handleQuickPromptRequest(req, res, path);
}

// Enable body parsing for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
```

---

### Vue.js Integration

#### Vue 3 Component Wrapper

```vue
<!-- QuickPromptWrapper.vue -->
<template>
  <div ref="quickPromptContainer" />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from './QUICKPROMPT/frontend/components/QuickPromptPlay';

const quickPromptContainer = ref(null);
const queryClient = new QueryClient();

onMounted(() => {
  const root = ReactDOM.createRoot(quickPromptContainer.value);
  root.render(
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(QuickPromptPlay)
    )
  );
});
</script>
```

#### Using as Vue Plugin

```javascript
// quickprompt-plugin.js
export default {
  install(app, options) {
    app.config.globalProperties.$quickPrompt = {
      generate: async (params) => {
        // Call Quick Prompt API
        const response = await fetch('/api/quick-prompt/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        return response.json();
      }
    };
  }
};

// main.js
import { createApp } from 'vue';
import QuickPromptPlugin from './quickprompt-plugin';

const app = createApp(App);
app.use(QuickPromptPlugin);
```

---

### Angular Integration

#### Angular Component Wrapper

```typescript
// quick-prompt.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from './QUICKPROMPT/frontend/components/QuickPromptPlay';

@Component({
  selector: 'app-quick-prompt',
  template: '<div #quickPromptContainer></div>',
})
export class QuickPromptComponent implements OnInit {
  @ViewChild('quickPromptContainer', { static: true })
  containerRef!: ElementRef;

  ngOnInit() {
    const queryClient = new QueryClient();
    const root = ReactDOM.createRoot(this.containerRef.nativeElement);
    
    root.render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(QuickPromptPlay)
      )
    );
  }
}
```

#### Angular Service

```typescript
// quick-prompt.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuickPromptService {
  private apiUrl = '/api/quick-prompt';

  constructor(private http: HttpClient) {}

  generatePrompt(params: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate`, params);
  }

  getCharacterPresets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/character-presets`);
  }

  analyzeImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(`${this.apiUrl}/analyze-image`, formData);
  }
}
```

---

### Svelte/SvelteKit Integration

#### Svelte Component

```svelte
<!-- QuickPrompt.svelte -->
<script>
  import { onMount } from 'svelte';
  
  let container;
  
  onMount(async () => {
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');
    const { default: QuickPromptPlay } = await import('./QUICKPROMPT/frontend/components/QuickPromptPlay');
    
    const queryClient = new QueryClient();
    const root = ReactDOM.createRoot(container);
    
    root.render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(QuickPromptPlay)
      )
    );
  });
</script>

<div bind:this={container}></div>
```

#### SvelteKit Route

```typescript
// +page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const presetsResponse = await fetch('/api/quick-prompt/character-presets');
  const templatesResponse = await fetch('/api/quick-prompt/prompt-templates');
  
  return {
    presets: await presetsResponse.json(),
    templates: await templatesResponse.json()
  };
};
```

---

### Vanilla JavaScript Integration

#### Basic HTML Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Prompt Generator</title>
  <link rel="stylesheet" href="./QUICKPROMPT/styles/quickprompt.css">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="quick-prompt-root"></div>
  
  <script type="module">
    import { initQuickPrompt } from './QUICKPROMPT/frontend/init.js';
    
    initQuickPrompt({
      container: document.getElementById('quick-prompt-root'),
      apiUrl: 'http://localhost:5000/api',
      theme: 'dark'
    });
  </script>
</body>
</html>
```

#### JavaScript API

```javascript
// Using Quick Prompt API directly
import { QuickPromptAPI } from './QUICKPROMPT/frontend/lib/api.js';

const api = new QuickPromptAPI({
  baseURL: 'http://localhost:5000'
});

// Generate a prompt
async function generatePrompt() {
  const result = await api.generatePrompt({
    template: 'photography',
    subject: 'sunset landscape',
    character: 'none',
    enhanceWithAI: true
  });
  
  console.log('Generated prompt:', result.prompt);
}

// Analyze an image
async function analyzeImage(imageFile) {
  const analysis = await api.analyzeImage(imageFile, {
    provider: 'openai',
    analysisType: 'detailed'
  });
  
  console.log('Image analysis:', analysis);
}
```

---

### WordPress Plugin Integration

#### Plugin Structure

```php
<?php
/**
 * Plugin Name: Quick Prompt Generator
 * Description: AI-powered prompt generation for WordPress
 * Version: 1.0.0
 */

// Enqueue scripts and styles
function qp_enqueue_scripts() {
    wp_enqueue_script(
        'quick-prompt-react',
        plugin_dir_url(__FILE__) . 'QUICKPROMPT/build/quickprompt.js',
        array(),
        '1.0.0',
        true
    );
    
    wp_enqueue_style(
        'quick-prompt-styles',
        plugin_dir_url(__FILE__) . 'QUICKPROMPT/styles/quickprompt.css',
        array(),
        '1.0.0'
    );
    
    wp_localize_script('quick-prompt-react', 'quickPromptConfig', array(
        'apiUrl' => rest_url('quick-prompt/v1'),
        'nonce' => wp_create_nonce('wp_rest')
    ));
}
add_action('wp_enqueue_scripts', 'qp_enqueue_scripts');

// Register REST API endpoints
function qp_register_rest_routes() {
    register_rest_route('quick-prompt/v1', '/generate', array(
        'methods' => 'POST',
        'callback' => 'qp_generate_prompt',
        'permission_callback' => '__return_true'
    ));
}
add_action('rest_api_init', 'qp_register_rest_routes');

// Shortcode for embedding
function qp_shortcode($atts) {
    $atts = shortcode_atts(array(
        'theme' => 'light',
        'template' => 'all'
    ), $atts);
    
    return '<div id="quick-prompt-container" 
                 data-theme="' . esc_attr($atts['theme']) . '"
                 data-template="' . esc_attr($atts['template']) . '"></div>';
}
add_shortcode('quick_prompt', 'qp_shortcode');
```

---

### Electron Desktop App

#### Main Process

```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  // Load the Quick Prompt app
  win.loadFile('index.html');
}

// Handle API calls from renderer
ipcMain.handle('quick-prompt-api', async (event, method, endpoint, data) => {
  // Implement API handling
  const response = await fetch(`http://localhost:5000/api${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
});

app.whenReady().then(createWindow);
```

#### Renderer Process

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Quick Prompt Desktop</title>
  <link rel="stylesheet" href="./QUICKPROMPT/styles/quickprompt.css">
</head>
<body>
  <div id="app"></div>
  <script src="./renderer.js"></script>
</body>
</html>
```

```javascript
// renderer.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StandaloneQuickPrompter from './QUICKPROMPT/frontend/pages/StandaloneQuickPrompter';

const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById('app'));

root.render(
  <QueryClientProvider client={queryClient}>
    <StandaloneQuickPrompter />
  </QueryClientProvider>
);
```

---

### Mobile App with React Native

```jsx
// QuickPromptMobile.jsx
import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  StyleSheet 
} from 'react-native';
import { useQuickPrompt } from './QUICKPROMPT/mobile/hooks/useQuickPrompt';

export default function QuickPromptMobile() {
  const { 
    subject,
    setSubject,
    character,
    setCharacter,
    generatePrompt,
    generatedPrompt,
    isLoading 
  } = useQuickPrompt();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Quick Prompt Generator</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Enter subject..."
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Character</Text>
        <TextInput
          style={styles.input}
          value={character}
          onChangeText={setCharacter}
          placeholder="Enter character..."
        />
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={generatePrompt}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Generating...' : 'Generate Prompt'}
        </Text>
      </TouchableOpacity>
      
      {generatedPrompt && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Generated Prompt:</Text>
          <Text style={styles.resultText}>{generatedPrompt}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    marginBottom: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white'
  },
  button: {
    backgroundColor: '#f59e0b',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  result: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 5
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20
  }
});
```

---

## 🔌 API Integration

### REST API Client

```javascript
// api-client.js
class QuickPromptClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:5000/api';
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: { ...this.headers, ...options.headers }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Character Presets
  getCharacterPresets() {
    return this.request('/character-presets');
  }

  createCharacterPreset(preset) {
    return this.request('/character-presets', {
      method: 'POST',
      body: JSON.stringify(preset)
    });
  }

  // Prompt Generation
  generatePrompt(params) {
    return this.request('/generate-prompt', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Image Analysis
  analyzeImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return fetch(`${this.baseURL}/analyze-image`, {
      method: 'POST',
      body: formData
    }).then(res => res.json());
  }
}

// Usage
const client = new QuickPromptClient({
  baseURL: 'https://api.example.com'
});

client.generatePrompt({
  template: 'photography',
  subject: 'mountain landscape'
}).then(result => {
  console.log('Generated:', result.prompt);
});
```

---

## 🎨 Custom Integration Points

### Event Hooks

```javascript
// Custom event handling
window.addEventListener('quickprompt:generated', (event) => {
  console.log('Prompt generated:', event.detail.prompt);
  // Custom handling
});

window.addEventListener('quickprompt:saved', (event) => {
  console.log('Prompt saved:', event.detail.id);
  // Custom handling
});
```

### Custom Providers

```javascript
// Register custom AI provider
QuickPrompt.registerProvider('custom', {
  name: 'Custom AI',
  enhance: async (prompt, options) => {
    // Custom enhancement logic
    const response = await customAPI.enhance(prompt);
    return response.enhanced;
  },
  analyzeImage: async (image, options) => {
    // Custom image analysis
    const response = await customAPI.analyze(image);
    return response.analysis;
  }
});
```

---

Next: [Customization Guide](./CUSTOMIZATION.md) →