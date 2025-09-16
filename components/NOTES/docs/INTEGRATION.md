# Integration Guide

Learn how to integrate the Notes package into different frameworks and environments.

## Table of Contents

1. [React Integration](#react-integration)
2. [Next.js Integration](#nextjs-integration)
3. [Vite Integration](#vite-integration)
4. [Remix Integration](#remix-integration)
5. [Gatsby Integration](#gatsby-integration)
6. [Electron Integration](#electron-integration)
7. [React Native Integration](#react-native-integration)
8. [WordPress Integration](#wordpress-integration)

## React Integration

### Create React App

```bash
npx create-react-app my-app
cd my-app

# Copy NOTES folder
cp -r path/to/NOTES src/

# Install dependencies
npm install @tanstack/react-query lucide-react clsx tailwind-merge zod
```

**src/App.js:**
```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './NOTES/frontend/hooks/use-toast';
import Notes from './NOTES/frontend/pages/Notes';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Notes />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Custom React Setup

```jsx
// index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastProvider } from './NOTES/frontend/hooks/use-toast';
import Notes from './NOTES/frontend/pages/Notes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Notes />
        <ReactQueryDevtools initialIsOpen={false} />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

## Next.js Integration

### App Router (Next.js 13+)

```bash
npx create-next-app@latest my-notes-app
cd my-notes-app

# Copy NOTES folder
cp -r path/to/NOTES .

# Install dependencies
npm install @tanstack/react-query lucide-react clsx tailwind-merge zod
```

**app/layout.tsx:**
```tsx
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**app/providers.tsx:**
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../NOTES/frontend/hooks/use-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
```

**app/notes/page.tsx:**
```tsx
import dynamic from 'next/dynamic';

const Notes = dynamic(() => import('../../NOTES/frontend/pages/Notes'), {
  ssr: false,
});

export default function NotesPage() {
  return <Notes />;
}
```

**app/api/notes/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../NOTES/backend/storage';

export async function GET(request: NextRequest) {
  const userId = 'user-id'; // Get from session/auth
  const notes = await storage.getUserNotes(userId);
  return NextResponse.json({ success: true, data: notes });
}

export async function POST(request: NextRequest) {
  const userId = 'user-id'; // Get from session/auth
  const body = await request.json();
  const note = await storage.createUserNote(userId, body);
  return NextResponse.json({ success: true, data: note });
}
```

### Pages Router (Next.js 12 and below)

**pages/_app.tsx:**
```tsx
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../NOTES/frontend/hooks/use-toast';
import { useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
```

**pages/notes.tsx:**
```tsx
import dynamic from 'next/dynamic';

const Notes = dynamic(() => import('../NOTES/frontend/pages/Notes'), {
  ssr: false,
});

export default function NotesPage() {
  return <Notes />;
}
```

## Vite Integration

```bash
npm create vite@latest my-notes-app -- --template react-ts
cd my-notes-app

# Copy NOTES folder
cp -r path/to/NOTES src/

# Install dependencies
npm install @tanstack/react-query lucide-react clsx tailwind-merge zod
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@notes': path.resolve(__dirname, './src/NOTES'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

**src/main.tsx:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './NOTES/frontend/hooks/use-toast';
import Notes from './NOTES/frontend/pages/Notes';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Notes />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

## Remix Integration

```bash
npx create-remix@latest my-notes-app
cd my-notes-app

# Copy NOTES folder
cp -r path/to/NOTES app/

# Install dependencies
npm install @tanstack/react-query lucide-react clsx tailwind-merge zod
```

**app/root.tsx:**
```tsx
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './NOTES/frontend/hooks/use-toast';
import { useState } from 'react';

export default function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Outlet />
          </ToastProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
```

**app/routes/notes.tsx:**
```tsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import Notes from '../NOTES/frontend/pages/Notes';
import { storage } from '../NOTES/backend/storage';

export async function loader() {
  const notes = await storage.getUserNotes('user-id');
  return json({ notes });
}

export default function NotesRoute() {
  const { notes } = useLoaderData<typeof loader>();
  return <Notes initialNotes={notes} />;
}
```

## Gatsby Integration

```bash
npm init gatsby
cd my-gatsby-site

# Copy NOTES folder
cp -r path/to/NOTES src/

# Install dependencies
npm install @tanstack/react-query lucide-react clsx tailwind-merge zod
```

**gatsby-browser.js:**
```javascript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './src/NOTES/frontend/hooks/use-toast';

const queryClient = new QueryClient();

export const wrapRootElement = ({ element }) => (
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      {element}
    </ToastProvider>
  </QueryClientProvider>
);
```

**src/pages/notes.js:**
```jsx
import React from 'react';
import Notes from '../NOTES/frontend/pages/Notes';

export default function NotesPage() {
  return <Notes />;
}
```

## Electron Integration

Create a desktop application with Notes:

```bash
# Create Electron app
npm init electron-app@latest my-notes-desktop
cd my-notes-desktop

# Copy NOTES folder
cp -r path/to/NOTES src/

# Install dependencies
npm install @tanstack/react-query lucide-react clsx tailwind-merge zod
```

**src/index.js (main process):**
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { storage } = require('./NOTES/backend/storage');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('src/index.html');
}

app.whenReady().then(createWindow);

// Handle IPC for notes operations
ipcMain.handle('get-notes', async (event, userId) => {
  return await storage.getUserNotes(userId);
});

ipcMain.handle('create-note', async (event, userId, noteData) => {
  return await storage.createUserNote(userId, noteData);
});
```

**src/preload.js:**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notesAPI', {
  getNotes: (userId) => ipcRenderer.invoke('get-notes', userId),
  createNote: (userId, noteData) => ipcRenderer.invoke('create-note', userId, noteData),
});
```

## React Native Integration

For mobile apps using React Native:

```bash
npx react-native init MyNotesApp
cd MyNotesApp

# Install dependencies
npm install @tanstack/react-query react-native-vector-icons
```

**Note:** React Native requires adapting the components to use React Native primitives:

**App.tsx:**
```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MobileNotes from './NOTES/mobile/MobileNotes';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <MobileNotes />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

## WordPress Integration

Integrate Notes as a WordPress plugin:

**notes-plugin/notes-plugin.php:**
```php
<?php
/**
 * Plugin Name: Notes System
 * Description: Full-featured notes system for WordPress
 * Version: 1.0.0
 */

// Enqueue React app
function notes_enqueue_scripts() {
    wp_enqueue_script(
        'notes-app',
        plugin_dir_url(__FILE__) . 'build/index.js',
        array('wp-element'),
        '1.0.0',
        true
    );
    
    wp_localize_script('notes-app', 'notesAPI', array(
        'apiUrl' => home_url('/wp-json/notes/v1'),
        'nonce' => wp_create_nonce('wp_rest'),
    ));
}
add_action('wp_enqueue_scripts', 'notes_enqueue_scripts');

// Register REST API endpoints
function notes_register_api() {
    register_rest_route('notes/v1', '/notes', array(
        'methods' => 'GET',
        'callback' => 'get_notes',
        'permission_callback' => 'is_user_logged_in',
    ));
}
add_action('rest_api_init', 'notes_register_api');

// Shortcode to display notes
function notes_shortcode() {
    return '<div id="notes-root"></div>';
}
add_shortcode('notes', 'notes_shortcode');
```

## Common Integration Patterns

### Authentication Integration

```typescript
// Integrate with existing auth
const useAuth = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Your auth logic
    const checkAuth = async () => {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      setUser(data.user);
    };
    
    checkAuth();
  }, []);
  
  return user;
};

// Pass user to Notes component
function AuthenticatedNotes() {
  const user = useAuth();
  
  if (!user) {
    return <LoginForm />;
  }
  
  return <Notes user={user} />;
}
```

### Custom Storage Backend

```typescript
// Implement custom storage
class CustomStorage {
  async getUserNotes(userId: string) {
    // Your database logic
    return await db.query('SELECT * FROM notes WHERE user_id = ?', [userId]);
  }
  
  async createUserNote(userId: string, noteData: any) {
    // Your database logic
    return await db.insert('notes', { ...noteData, user_id: userId });
  }
  
  // ... other methods
}

export const storage = new CustomStorage();
```

### Theme Integration

```css
/* Match your app's theme */
:root {
  --notes-primary: #3b82f6;
  --notes-secondary: #10b981;
  --notes-background: #ffffff;
  --notes-text: #1f2937;
}

.dark {
  --notes-background: #1f2937;
  --notes-text: #f3f4f6;
}
```

### API Proxy Configuration

```javascript
// Development proxy
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
};
```

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   ```bash
   # Fix by installing missing dependencies
   npm install missing-package
   ```

2. **CORS Issues**
   ```javascript
   // Add CORS headers
   app.use(cors({
     origin: 'http://localhost:3000',
     credentials: true,
   }));
   ```

3. **Build Errors**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules/.cache
   npm run build
   ```

4. **TypeScript Errors**
   ```json
   // Add to tsconfig.json
   {
     "compilerOptions": {
       "skipLibCheck": true
     }
   }
   ```

## Support

For framework-specific help, consult:
- React: [reactjs.org](https://reactjs.org)
- Next.js: [nextjs.org](https://nextjs.org)
- Vite: [vitejs.dev](https://vitejs.dev)
- Remix: [remix.run](https://remix.run)
- Gatsby: [gatsbyjs.com](https://gatsbyjs.com)