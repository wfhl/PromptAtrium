# Notes Package Examples

This directory contains various example implementations of the Notes package demonstrating different features and use cases.

## Available Examples

### 📝 Basic Example
**Location:** `./basic/`

Simple notes application with core features:
- CRUD operations
- Text notes
- Basic folder organization
- Search functionality

**Best for:** Getting started quickly with minimal setup

### 🚀 Advanced Example
**Location:** `./advanced/`

Full-featured notes application showcasing all capabilities:
- Multiple note types (text, markdown, code, todo, HTML)
- Advanced folder and tag management
- Real-time sync
- Bulk operations
- Keyboard shortcuts
- PWA support

**Best for:** Production applications requiring all features

### 📱 Mobile Example
**Location:** `./mobile/`

Mobile-optimized notes application:
- Touch gestures
- Bottom navigation
- Floating action button
- Pull-to-refresh
- Offline support
- Voice input

**Best for:** Mobile web apps and PWAs

### ✅ Todo Example
**Location:** `./todo/`

Specialized todo list implementation:
- Interactive checkboxes
- Progress tracking
- Priority levels
- Due dates
- Subtasks
- Recurring tasks

**Best for:** Task management applications

### 📄 Markdown Example
**Location:** `./markdown/`

Rich markdown editor:
- Live preview
- Syntax highlighting
- Tables and code blocks
- Math equations (LaTeX)
- Mermaid diagrams
- Export capabilities

**Best for:** Documentation and content creation tools

## Running Examples

Each example can be run independently:

```bash
# Navigate to example directory
cd basic

# Install dependencies
npm install

# Start development server
npm run dev
```

## Common Setup

All examples share these common steps:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

3. **Start backend server:**
   ```bash
   npm run server
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```

## Customization Guide

### Changing Theme

Edit CSS variables in `tailwind.css` or `index.css`:

```css
:root {
  --primary: #3b82f6;
  --secondary: #10b981;
  --background: #ffffff;
  --text: #1f2937;
}
```

### Adding Authentication

Wrap the Notes component with your auth provider:

```tsx
import { AuthProvider, useAuth } from './auth';

function App() {
  return (
    <AuthProvider>
      <AuthenticatedNotes />
    </AuthProvider>
  );
}

function AuthenticatedNotes() {
  const { user } = useAuth();
  return <Notes user={user} />;
}
```

### Custom Storage Backend

Implement the storage interface:

```typescript
class CustomStorage {
  async getUserNotes(userId: string) {
    // Your implementation
  }
  
  async createUserNote(userId: string, data: any) {
    // Your implementation
  }
  
  // ... other methods
}
```

### Adding Features

Enable/disable features via configuration:

```tsx
<Notes
  config={{
    features: {
      markdown: true,
      codeHighlighting: true,
      todoLists: true,
      fileAttachments: false,
      sharing: false,
    }
  }}
/>
```

## Technology Stack

All examples use:
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Lucide Icons** - Icons
- **Zod** - Validation

## Best Practices

1. **Start Simple:** Begin with the basic example and add features as needed
2. **Progressive Enhancement:** Add advanced features gradually
3. **Mobile First:** Design for mobile, enhance for desktop
4. **Performance:** Use virtual scrolling for large lists
5. **Accessibility:** Ensure keyboard navigation and screen reader support

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change port in vite.config.js
server: {
  port: 3002
}
```

**CORS errors:**
```javascript
// Add to backend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

**Build errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
npm run build
```

## Contributing

To add a new example:

1. Create a new directory
2. Copy basic example as template
3. Modify for your use case
4. Add README with instructions
5. Update this file with description

## Support

For help with examples:
- Check individual example READMEs
- Review the [main documentation](../docs/)
- Open an issue on GitHub

## License

All examples are MIT licensed and free to use in your projects.