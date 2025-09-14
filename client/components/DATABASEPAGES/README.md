# Database Pages Package

A comprehensive, production-ready React component library for creating powerful database management interfaces with multiple view modes and full CRUD capabilities.

## 🌟 Features

- **Multiple View Modes**: Spreadsheet, Mini Cards, Large Cards, List View
- **Full CRUD Operations**: Create, Read, Update, Delete with bulk operations
- **Advanced Filtering**: Search, category filters, alphabet filters, tag filters
- **Favorites System**: Mark and manage favorite items across all views
- **Excel Import/Export**: Import and export data to/from Excel files
- **Inline Editing**: Edit data directly in spreadsheet view with validation
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **TypeScript Support**: Fully typed for excellent developer experience
- **Framework Agnostic**: Works with any React-based framework

## 📦 Quick Start

```bash
# Install dependencies
npm install

# Copy the DATABASEPAGES folder to your project
cp -r DATABASEPAGES /path/to/your/project/

# Import and use
```

```tsx
import DataPage from './DATABASEPAGES/frontend/components/DataPage';
import Aesthetics from './DATABASEPAGES/frontend/pages/Aesthetics';

// Use a pre-built database page
function App() {
  return <Aesthetics />;
}

// Or create your own with DataPage
function CustomDatabase() {
  const config = {
    title: "My Database",
    apiEndpoint: "/api/my-data",
    favoriteItemType: "my_items",
    // ... configuration
  };
  
  return <DataPage config={config} />;
}
```

## 🚀 Key Components

### DataPage
The core component that powers all database interfaces.

```tsx
<DataPage config={{
  title: "My Database",
  apiEndpoint: "/api/data",
  favoriteItemType: "items",
  defaultViewMode: "minicard",
  enabledViewModes: ["spreadsheet", "minicard", "largecards", "listview"],
  spreadsheetConfig: { /* ... */ },
  miniCardConfig: { /* ... */ },
  largeCardConfig: { /* ... */ },
  listViewConfig: { /* ... */ }
}} />
```

### Pre-built Database Pages

- **Aesthetics**: Visual style and design elements database
- **CheckpointModels**: AI model configurations and parameters
- **CollaborationHubs**: Team collaboration spaces
- **PromptComponents**: Prompt building components editor

## 📊 View Modes

### Spreadsheet View
- Excel-like interface
- Inline editing
- Bulk operations
- Import/Export Excel files
- Column sorting
- Row selection

### Mini Card View
- Compact card grid
- Expandable details
- Visual previews
- Quick actions
- Responsive columns

### Large Card View
- Detailed card layout
- Rich metadata display
- Custom actions
- Visual hierarchy
- Content sections

### List View
- Expandable list items
- Hierarchical display
- Detailed metadata
- Inline actions
- Compact mode

## 🔧 Backend Integration

The package includes backend route templates for:

```javascript
// Generic CRUD routes
GET    /api/:table           // Get all items
GET    /api/:table/:id        // Get single item
POST   /api/:table            // Create item
PUT    /api/:table/:id        // Update item
DELETE /api/:table/:id        // Delete item
PUT    /api/:table            // Bulk update
POST   /api/:table/bulk-delete // Bulk delete
GET    /api/:table/search     // Search items

// Favorites system
GET    /api/favorites/type/:type
POST   /api/favorites/add
DELETE /api/favorites/remove
GET    /api/favorites/check/:type/:id
```

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed installation and configuration
- [API Documentation](./API.md) - Backend API reference
- [Schema Documentation](./SCHEMA.md) - Database schema definitions
- [Views Documentation](./VIEWS.md) - View modes and configurations
- [Integration Guide](./INTEGRATION.md) - Framework integration examples

## 🎨 Customization

### Custom Cell Renderers
```tsx
renderCell: (item, field, isEditMode, onChange) => {
  if (field === 'status') {
    return <StatusBadge status={item.status} />;
  }
  // Default renderer
  return <DefaultCell {...} />;
}
```

### Custom Card Renderers
```tsx
renderCard: (item) => ({
  id: item.id,
  title: item.name,
  description: item.description,
  expandedContent: () => <CustomDetails item={item} />
})
```

## 🛠️ Technologies

- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **XLSX** - Excel operations
- **React Query** - Data fetching (optional)

## 📄 License

MIT License - Use freely in your projects

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For questions and support, please open an issue in the repository.