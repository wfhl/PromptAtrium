# Setup Guide

Comprehensive installation and configuration guide for the Notes package.

## Prerequisites

- Node.js 16+ or Bun
- React 18+
- A backend server (Express, Next.js, etc.)
- Optional: PostgreSQL or other database

## Installation Steps

### 1. Copy Package Files

```bash
# Copy the entire NOTES folder to your project
cp -r NOTES /path/to/your/project/

# Navigate to your project
cd /path/to/your/project
```

### 2. Install Dependencies

#### NPM
```bash
npm install react react-dom @tanstack/react-query lucide-react clsx tailwind-merge zod
npm install -D @types/react @types/react-dom typescript tailwindcss
```

#### Yarn
```bash
yarn add react react-dom @tanstack/react-query lucide-react clsx tailwind-merge zod
yarn add -D @types/react @types/react-dom typescript tailwindcss
```

#### Bun
```bash
bun add react react-dom @tanstack/react-query lucide-react clsx tailwind-merge zod
bun add -d @types/react @types/react-dom typescript tailwindcss
```

### 3. Configure TypeScript

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["NOTES/**/*"],
  "exclude": ["node_modules"]
}
```

### 4. Configure Tailwind CSS

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './NOTES/**/*.{js,ts,jsx,tsx}',
    // your other content paths
  ],
  theme: {
    extend: {
      // Custom theme extensions
    },
  },
  plugins: [],
}
```

Add Tailwind directives to your CSS:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Backend Setup

### 1. Express Server Setup

```javascript
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import notesRouter from './NOTES/backend/routes/notes';
import { storage } from './NOTES/backend/storage';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Authentication middleware (optional)
const authenticateUser = (req, res, next) => {
  // Your authentication logic
  req.user = { id: 'user-id' }; // Set user from session/JWT
  next();
};

// Routes
app.use('/api/notes', authenticateUser, notesRouter);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Next.js API Routes

Create `pages/api/notes/[...params].js`:

```javascript
import notesRouter from '../../../NOTES/backend/routes/notes';
import { createRouter } from 'next-connect';

const router = createRouter();

// Convert Express router to Next.js API route
router.use('/api/notes', notesRouter);

export default router.handler({
  onError: (err, req, res) => {
    console.error(err.stack);
    res.status(500).end('Server error');
  },
  onNoMatch: (req, res) => {
    res.status(404).end('Page not found');
  },
});
```

## Database Setup (Optional)

### PostgreSQL with Drizzle ORM

1. Install dependencies:
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

2. Create schema file `NOTES/backend/schema.ts`:

```typescript
import { pgTable, serial, text, boolean, integer, timestamp, json } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  type: text('type').notNull().default('text'),
  folder: text('folder').default('Unsorted'),
  tags: json('tags').$type<string[]>().default([]),
  color: text('color'),
  isPinned: boolean('is_pinned').default(false),
  isArchived: boolean('is_archived').default(false),
  parentId: integer('parent_id'),
  position: integer('position').default(0),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastModified: timestamp('last_modified').defaultNow()
});

export const folders = pgTable('folders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  icon: text('icon'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  textColor: text('text_color'),
  borderColor: text('border_color'),
  backgroundColor: text('background_color'),
  userId: text('user_id').notNull()
});
```

3. Update storage implementation:

```typescript
import { db } from './database';
import { notes, folders, tags } from './schema';
import { eq, and, like, or } from 'drizzle-orm';

export const storage = {
  async getUserNotes(userId: string) {
    return await db.select().from(notes).where(eq(notes.userId, userId));
  },
  
  async createUserNote(userId: string, noteData: any) {
    const [newNote] = await db.insert(notes).values({
      ...noteData,
      userId
    }).returning();
    return newNote;
  },
  
  // ... implement other methods
};
```

## Frontend Integration

### Basic Integration

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './NOTES/frontend/hooks/use-toast';
import Notes from './NOTES/frontend/pages/Notes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Notes />
      </ToastProvider>
    </QueryClientProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### With Authentication

```jsx
import { useState, useEffect } from 'react';

function AuthenticatedNotes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login to access notes</div>;

  return <Notes user={user} />;
}
```

## Environment Configuration

Create `.env` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_WEBSOCKET_URL=ws://localhost:3001

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/notes_db

# Authentication (optional)
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Features
ENABLE_MARKDOWN=true
ENABLE_CODE_HIGHLIGHTING=true
ENABLE_TODO_LISTS=true
MAX_NOTE_SIZE=10485760  # 10MB
```

## PWA Configuration

Add to your `public` folder:

1. Create `manifest.json`:

```json
{
  "name": "Notes App",
  "short_name": "Notes",
  "description": "A powerful notes application",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. Add to your HTML:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#3b82f6">
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS configuration matches frontend URL
   - Include credentials in fetch requests

2. **Authentication Issues**
   - Check session/JWT configuration
   - Verify middleware order

3. **Database Connection**
   - Verify DATABASE_URL is correct
   - Check database permissions

4. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check content paths in tailwind.config.js

### Debug Mode

Enable debug logging:

```javascript
// In your app initialization
if (process.env.NODE_ENV === 'development') {
  window.DEBUG_NOTES = true;
}
```

## Next Steps

- Read the [Features Guide](./FEATURES.md) to understand all capabilities
- Check [API Documentation](./API.md) for backend endpoints
- See [Integration Examples](./INTEGRATION.md) for framework-specific setup
- Explore the [Examples](../examples/) folder for working implementations