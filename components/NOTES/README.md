# Notes Package

A comprehensive, production-ready notes system for React applications with full-featured desktop and mobile support.

## ✨ Features

### Core Features
- 📝 **Multiple Note Types**: Text, Markdown, Code, Todo Lists, HTML
- 📁 **Folder Organization**: Organize notes into customizable folders
- 🏷️ **Tag Management**: Tag notes for easy categorization and filtering
- 📌 **Pin & Archive**: Pin important notes, archive old ones
- 🎨 **Color Coding**: Assign colors to notes for visual organization
- 🔍 **Search & Filter**: Full-text search with tag and folder filtering
- 📱 **Mobile Responsive**: Fully responsive design with mobile-specific UI
- 📦 **PWA Support**: Progressive Web App capabilities
- ⌨️ **Keyboard Shortcuts**: Efficient keyboard navigation
- 🔄 **Real-time Updates**: Live updates and auto-save

### View Modes
- **Masonry Layout**: Pinterest-style dynamic grid
- **Grid Layout**: Traditional uniform grid
- **List View**: Compact list for quick scanning

### Todo List Features
- Interactive checkboxes
- Add/remove todo items
- Progress tracking
- Nested todo support

### Editor Features
- Live preview for Markdown
- Syntax highlighting for code
- Rich text formatting
- Auto-save functionality

## 🚀 Quick Start

### Installation

```bash
# Copy the NOTES folder to your project
cp -r NOTES /path/to/your/project/

# Install dependencies
cd /path/to/your/project
npm install
```

### Basic Setup

1. **Frontend Integration**

```jsx
import Notes from './NOTES/frontend/pages/Notes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './NOTES/frontend/hooks/use-toast';

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
```

2. **Backend Integration**

```javascript
import express from 'express';
import notesRouter from './NOTES/backend/routes/notes';

const app = express();
app.use(express.json());

// Mount notes API
app.use('/api/notes', notesRouter);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 📁 Package Structure

```
NOTES/
├── frontend/
│   ├── pages/           # Main page components
│   ├── components/       # Reusable components
│   │   ├── shared/      # Shared components
│   │   └── ui/          # UI primitives
│   ├── utils/           # Utility functions
│   └── hooks/           # React hooks
├── backend/
│   ├── routes/          # API routes
│   ├── storage.ts       # Storage interface
│   └── types/           # TypeScript types
├── docs/                # Documentation
├── examples/            # Example implementations
└── config/              # Configuration files
```

## 🎯 Key Components

### Notes Page
The main notes interface with folder sidebar, tag filtering, and note grid.

### Mobile Notes
Optimized mobile interface with touch gestures and mobile-specific navigation.

### Home Notes Compact
Compact widget version for embedding in dashboards.

### Note Editor
Rich editor with support for multiple note types and live preview.

## 🔧 Configuration

### Environment Variables
```env
# Database connection (optional - uses in-memory by default)
DATABASE_URL=postgresql://user:password@localhost:5432/notes

# API configuration
API_BASE_URL=http://localhost:3000
```

### Customization
- Themes: Modify color variables in UI components
- Layouts: Adjust grid/masonry configurations
- Features: Enable/disable features via props

## 🛠️ Development

### Running Examples

```bash
# Basic example
cd NOTES/examples/basic
npm install
npm run dev

# Advanced example with all features
cd NOTES/examples/advanced
npm install
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed installation and configuration
- [API Documentation](./docs/API.md) - Backend API reference
- [Features Guide](./docs/FEATURES.md) - Complete feature documentation
- [Mobile Guide](./docs/MOBILE.md) - Mobile-specific features
- [Integration Guide](./docs/INTEGRATION.md) - Framework integration examples

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - feel free to use in personal and commercial projects.

## 🆘 Support

For issues, questions, or feature requests, please open an issue in the repository.

---

Built with ❤️ for developers who need a robust notes system.