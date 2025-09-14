# PROMPTGENERATOR Integration Guide

## Table of Contents
1. [React Integration](#react-integration)
2. [Next.js Integration](#nextjs-integration)
3. [Vue.js Integration](#vuejs-integration)
4. [Angular Integration](#angular-integration)
5. [Vanilla JavaScript Integration](#vanilla-javascript-integration)
6. [Framework-Agnostic Integration](#framework-agnostic-integration)
7. [Custom Integrations](#custom-integrations)
8. [Common Integration Patterns](#common-integration-patterns)

## React Integration

### Basic Setup

```jsx
// App.jsx
import React from 'react';
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';
import './PROMPTGENERATOR/frontend/styles/promptgen.css';

function App() {
  const handlePromptGenerated = (prompt) => {
    console.log('Generated prompt:', prompt);
    // Handle the generated prompt
  };

  return (
    <div className="App">
      <ElitePromptGeneratorUI 
        onPromptGenerated={handlePromptGenerated}
        theme="dark"
      />
    </div>
  );
}

export default App;
```

### With State Management (Redux)

```jsx
// store/promptSlice.js
import { createSlice } from '@reduxjs/toolkit';

const promptSlice = createSlice({
  name: 'prompt',
  initialState: {
    currentPrompt: null,
    history: [],
    presets: []
  },
  reducers: {
    setPrompt: (state, action) => {
      state.currentPrompt = action.payload;
      state.history.push(action.payload);
    },
    loadPresets: (state, action) => {
      state.presets = action.payload;
    }
  }
});

// Component integration
import { useDispatch, useSelector } from 'react-redux';
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

function PromptGeneratorContainer() {
  const dispatch = useDispatch();
  const currentPrompt = useSelector(state => state.prompt.currentPrompt);

  return (
    <ElitePromptGeneratorUI
      initialPrompt={currentPrompt}
      onPromptGenerated={(prompt) => dispatch(setPrompt(prompt))}
    />
  );
}
```

### With React Router

```jsx
// routes.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generator" element={<ElitePromptGeneratorUI />} />
        <Route path="/generator/:presetId" element={<PromptWithPreset />} />
      </Routes>
    </BrowserRouter>
  );
}

// Load with preset
function PromptWithPreset() {
  const { presetId } = useParams();
  
  return (
    <ElitePromptGeneratorUI
      presetId={presetId}
      autoLoad={true}
    />
  );
}
```

## Next.js Integration

### App Directory (Next.js 13+)

```jsx
// app/prompt-generator/page.jsx
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ElitePromptGeneratorUI = dynamic(
  () => import('@/PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI'),
  { 
    ssr: false,
    loading: () => <div>Loading prompt generator...</div>
  }
);

export default function PromptGeneratorPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">AI Prompt Generator</h1>
      <ElitePromptGeneratorUI />
    </div>
  );
}
```

### API Routes

```javascript
// app/api/prompt/enhance/route.js
import { enhancePrompt } from '@/PROMPTGENERATOR/backend/routes/enhance-prompt';

export async function POST(request) {
  const body = await request.json();
  
  try {
    const enhanced = await enhancePrompt(body);
    return Response.json({ success: true, enhanced });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### With Server Components

```jsx
// app/prompt-generator/layout.jsx
import { PromptProvider } from '@/PROMPTGENERATOR/frontend/contexts/PromptContext';

export default function PromptLayout({ children }) {
  return (
    <PromptProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </PromptProvider>
  );
}

// app/prompt-generator/page.jsx
import { Suspense } from 'react';
import { getPresets } from '@/PROMPTGENERATOR/backend/utils/presets';
import PromptGeneratorClient from './PromptGeneratorClient';

export default async function PromptGeneratorPage() {
  const presets = await getPresets();
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PromptGeneratorClient initialPresets={presets} />
    </Suspense>
  );
}
```

## Vue.js Integration

### Vue 3 Composition API

```vue
<!-- PromptGenerator.vue -->
<template>
  <div class="prompt-generator-wrapper">
    <div ref="promptGenContainer"></div>
    
    <!-- Vue controls -->
    <div v-if="generatedPrompt" class="mt-4">
      <h3>Generated Prompt:</h3>
      <p>{{ generatedPrompt }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { ElitePromptGeneratorUI } from '../PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

const promptGenContainer = ref(null);
const generatedPrompt = ref('');
let reactRoot = null;

onMounted(() => {
  reactRoot = createRoot(promptGenContainer.value);
  
  const handlePromptGenerated = (prompt) => {
    generatedPrompt.value = prompt.original;
  };
  
  reactRoot.render(
    React.createElement(ElitePromptGeneratorUI, {
      onPromptGenerated: handlePromptGenerated,
      theme: 'dark'
    })
  );
});

onUnmounted(() => {
  if (reactRoot) {
    reactRoot.unmount();
  }
});
</script>
```

### As Vue Plugin

```javascript
// promptGeneratorPlugin.js
import { createRoot } from 'react-dom/client';
import React from 'react';
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

export default {
  install(app, options = {}) {
    app.config.globalProperties.$promptGenerator = {
      mount(elementId, props = {}) {
        const container = document.getElementById(elementId);
        if (!container) {
          console.error(`Element with id ${elementId} not found`);
          return;
        }
        
        const root = createRoot(container);
        root.render(React.createElement(ElitePromptGeneratorUI, {
          ...options,
          ...props
        }));
        
        return root;
      }
    };
    
    // Vue component wrapper
    app.component('PromptGenerator', {
      template: '<div ref="container"></div>',
      props: ['theme', 'onGenerated'],
      mounted() {
        this.$promptGenerator.mount(this.$refs.container, {
          theme: this.theme,
          onPromptGenerated: this.onGenerated
        });
      }
    });
  }
};

// main.js
import { createApp } from 'vue';
import PromptGeneratorPlugin from './promptGeneratorPlugin';

const app = createApp(App);
app.use(PromptGeneratorPlugin, {
  theme: 'dark',
  apiUrl: 'http://localhost:3000'
});
```

## Angular Integration

### Angular Component Wrapper

```typescript
// prompt-generator.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { createRoot, Root } from 'react-dom/client';
import * as React from 'react';
import { ElitePromptGeneratorUI } from '../PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

@Component({
  selector: 'app-prompt-generator',
  template: '<div #promptContainer></div>',
  styleUrls: ['./prompt-generator.component.css']
})
export class PromptGeneratorComponent implements OnInit, OnDestroy {
  @ViewChild('promptContainer', { static: true }) container!: ElementRef;
  @Input() theme: 'light' | 'dark' = 'light';
  @Output() promptGenerated = new EventEmitter<any>();
  
  private root: Root | null = null;

  ngOnInit(): void {
    this.root = createRoot(this.container.nativeElement);
    
    this.root.render(
      React.createElement(ElitePromptGeneratorUI, {
        theme: this.theme,
        onPromptGenerated: (prompt: any) => {
          this.promptGenerated.emit(prompt);
        }
      })
    );
  }

  ngOnDestroy(): void {
    if (this.root) {
      this.root.unmount();
    }
  }
}
```

### Angular Service

```typescript
// prompt-generator.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import elitePromptGenerator from '../PROMPTGENERATOR/frontend/components/ElitePromptGenerator';

@Injectable({
  providedIn: 'root'
})
export class PromptGeneratorService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  generatePrompt(options: any): any {
    return elitePromptGenerator.generate(options);
  }

  enhancePrompt(prompt: string, options: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/enhance-prompt`, {
      prompt,
      ...options
    });
  }

  getTemplates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/templates`);
  }

  savePreset(preset: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/presets`, preset);
  }
}
```

## Vanilla JavaScript Integration

### Basic HTML Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>Prompt Generator</title>
  <link rel="stylesheet" href="PROMPTGENERATOR/frontend/styles/promptgen.css">
</head>
<body>
  <div id="prompt-generator"></div>

  <script type="module">
    import { mount } from './PROMPTGENERATOR/frontend/mount.js';
    
    // Mount the generator
    const generator = mount('prompt-generator', {
      theme: 'dark',
      onPromptGenerated: (prompt) => {
        console.log('Generated:', prompt);
        document.getElementById('output').textContent = prompt.original;
      }
    });
  </script>
  
  <div id="output"></div>
</body>
</html>
```

### JavaScript API

```javascript
// Using the core generator directly
import elitePromptGenerator from './PROMPTGENERATOR/frontend/components/ElitePromptGenerator.js';

// Generate a prompt
const prompt = elitePromptGenerator.generate({
  gender: 'female',
  artform: 'photography',
  photoType: 'portrait',
  lighting: 'golden hour',
  globalOption: 'Random'
});

console.log(prompt.original); // Main prompt
console.log(prompt.midjourney); // Midjourney format
console.log(prompt.stable); // Stable Diffusion format

// Save a preset
elitePromptGenerator.savePreset({
  id: 'my-preset-1',
  name: 'Fantasy Portrait',
  options: {
    gender: 'female',
    roles: 'warrior',
    artOptions: 'Fantasy Art'
  },
  favorite: true
});

// Load presets
const presets = elitePromptGenerator.getPresets();
```

## Framework-Agnostic Integration

### Web Components

```javascript
// prompt-generator-element.js
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';
import { createRoot } from 'react-dom/client';
import React from 'react';

class PromptGeneratorElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.root = null;
  }

  connectedCallback() {
    const container = document.createElement('div');
    this.shadowRoot.appendChild(container);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `@import './PROMPTGENERATOR/frontend/styles/promptgen.css';`;
    this.shadowRoot.appendChild(style);
    
    // Mount React component
    this.root = createRoot(container);
    this.root.render(
      React.createElement(ElitePromptGeneratorUI, {
        theme: this.getAttribute('theme') || 'light',
        onPromptGenerated: (prompt) => {
          this.dispatchEvent(new CustomEvent('prompt-generated', {
            detail: prompt
          }));
        }
      })
    );
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
    }
  }
}

customElements.define('prompt-generator', PromptGeneratorElement);
```

Usage:
```html
<prompt-generator theme="dark"></prompt-generator>

<script>
  document.querySelector('prompt-generator')
    .addEventListener('prompt-generated', (e) => {
      console.log('Generated:', e.detail);
    });
</script>
```

### iframe Integration

```html
<!-- host.html -->
<iframe 
  id="prompt-generator-frame"
  src="prompt-generator.html"
  width="100%"
  height="800"
></iframe>

<script>
  // Communication with iframe
  window.addEventListener('message', (event) => {
    if (event.data.type === 'prompt-generated') {
      console.log('Received prompt:', event.data.prompt);
    }
  });
  
  // Send configuration
  const iframe = document.getElementById('prompt-generator-frame');
  iframe.onload = () => {
    iframe.contentWindow.postMessage({
      type: 'configure',
      config: {
        theme: 'dark',
        apiUrl: 'http://localhost:3000'
      }
    }, '*');
  };
</script>
```

## Custom Integrations

### WordPress Plugin

```php
<?php
/**
 * Plugin Name: Elite Prompt Generator
 * Description: AI Prompt Generator for WordPress
 * Version: 1.0.0
 */

// Enqueue scripts and styles
function epg_enqueue_scripts() {
    wp_enqueue_script(
        'prompt-generator',
        plugin_dir_url(__FILE__) . 'PROMPTGENERATOR/build/bundle.js',
        array(),
        '1.0.0',
        true
    );
    
    wp_enqueue_style(
        'prompt-generator-styles',
        plugin_dir_url(__FILE__) . 'PROMPTGENERATOR/frontend/styles/promptgen.css'
    );
    
    // Pass WordPress data to JavaScript
    wp_localize_script('prompt-generator', 'epgConfig', array(
        'apiUrl' => rest_url('prompt-generator/v1'),
        'nonce' => wp_create_nonce('wp_rest'),
        'userId' => get_current_user_id()
    ));
}
add_action('wp_enqueue_scripts', 'epg_enqueue_scripts');

// Shortcode
function epg_shortcode($atts) {
    $atts = shortcode_atts(array(
        'theme' => 'light',
        'height' => '800px'
    ), $atts);
    
    return sprintf(
        '<div id="prompt-generator" data-theme="%s" style="height: %s;"></div>',
        esc_attr($atts['theme']),
        esc_attr($atts['height'])
    );
}
add_shortcode('prompt_generator', 'epg_shortcode');
```

### Electron App

```javascript
// main.js (Electron main process)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

// Handle API calls from renderer
ipcMain.handle('enhance-prompt', async (event, prompt, options) => {
  // Call enhancement API
  const enhanced = await enhancePrompt(prompt, options);
  return enhanced;
});

// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('promptAPI', {
  enhancePrompt: (prompt, options) => 
    ipcRenderer.invoke('enhance-prompt', prompt, options)
});

// renderer.js
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

// Use with Electron API
const enhancedPrompt = await window.promptAPI.enhancePrompt(
  'fantasy warrior',
  { format: 'pipeline' }
);
```

## Common Integration Patterns

### Lazy Loading

```javascript
// Lazy load the generator
const loadPromptGenerator = () => {
  return import('./PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI')
    .then(module => module.ElitePromptGeneratorUI);
};

// Use when needed
button.addEventListener('click', async () => {
  const PromptGenerator = await loadPromptGenerator();
  // Mount or use the generator
});
```

### State Persistence

```javascript
// Save state to localStorage
const saveState = (state) => {
  localStorage.setItem('promptGeneratorState', JSON.stringify(state));
};

// Restore state
const restoreState = () => {
  const saved = localStorage.getItem('promptGeneratorState');
  return saved ? JSON.parse(saved) : null;
};

// Use with generator
<ElitePromptGeneratorUI
  initialState={restoreState()}
  onStateChange={saveState}
/>
```

### API Proxy

```javascript
// Create API proxy for CORS or authentication
app.use('/api/prompt', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  headers: {
    'Authorization': `Bearer ${process.env.API_KEY}`
  }
}));
```

### Event Bus Integration

```javascript
// Using an event bus
import EventEmitter from 'events';

const promptBus = new EventEmitter();

// Generator component
<ElitePromptGeneratorUI
  onPromptGenerated={(prompt) => {
    promptBus.emit('prompt:generated', prompt);
  }}
/>

// Other components listen
promptBus.on('prompt:generated', (prompt) => {
  // Handle prompt in other parts of the app
});
```

## Testing Integration

```javascript
// Integration test example
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ElitePromptGeneratorUI } from './PROMPTGENERATOR/frontend/components/ElitePromptGeneratorUI';

test('generates prompt on button click', async () => {
  const handleGenerated = jest.fn();
  
  render(
    <ElitePromptGeneratorUI 
      onPromptGenerated={handleGenerated}
    />
  );
  
  const generateButton = screen.getByText('Generate');
  await userEvent.click(generateButton);
  
  await waitFor(() => {
    expect(handleGenerated).toHaveBeenCalled();
  });
});
```

## Support

For integration support:
- Check example implementations in `/examples`
- Review the [API Documentation](./API.md)
- Open an issue for framework-specific help