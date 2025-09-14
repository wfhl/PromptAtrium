# Setup Guide

Complete setup instructions for the Database Pages package.

## Prerequisites

- Node.js 16+ 
- React 18+
- A backend API (Express, Next.js API routes, etc.)
- Database (PostgreSQL, MySQL, SQLite, etc.)

## Installation Steps

### 1. Copy Package Files

```bash
# Copy the entire DATABASEPAGES folder to your project
cp -r DATABASEPAGES /path/to/your/project/src/
```

### 2. Install Dependencies

```bash
npm install react react-dom
npm install lucide-react xlsx clsx tailwind-merge
npm install -D @types/react @types/react-dom typescript
```

Or use the provided package.json:

```bash
cd DATABASEPAGES
npm install
```

### 3. Configure Tailwind CSS

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/DATABASEPAGES/**/*.{js,ts,jsx,tsx}",
    // ... other paths
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [],
};
```

### 4. Add CSS Variables

Add to your global CSS file:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

### 5. Setup Backend Routes

#### Express.js Example

```javascript
const express = require('express');
const app = express();

// Import database routes
const databaseRoutes = require('./DATABASEPAGES/backend/routes/database-routes');
const favoritesRoutes = require('./DATABASEPAGES/backend/routes/favorites-routes');

// Use routes
app.use('/api', databaseRoutes);
app.use('/api/favorites', favoritesRoutes);

// Specific table routes
app.use('/api/system-data/aesthetics', /* aesthetics routes */);
app.use('/api/checkpoint-models', /* checkpoint models routes */);
app.use('/api/system-data/collaboration-hubs', /* collaboration hubs routes */);
app.use('/api/prompt-components', /* prompt components routes */);
```

#### Next.js API Routes Example

```typescript
// pages/api/[...database].ts or app/api/[...database]/route.ts
import { handleDatabaseRequest } from '@/DATABASEPAGES/backend/routes/database-routes';

export async function GET(request: Request) {
  return handleDatabaseRequest(request);
}

export async function POST(request: Request) {
  return handleDatabaseRequest(request);
}

// ... other methods
```

### 6. Setup Database

Run the SQL schema to create tables:

```bash
psql -U your_user -d your_database -f DATABASEPAGES/database-schema.sql
```

Or use your preferred database migration tool.

### 7. Configure Environment Variables

Create `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=database_pages

# API Configuration
API_BASE_URL=http://localhost:3000/api
```

### 8. Wrap Your App with Providers

```tsx
import { ToastProvider } from './DATABASEPAGES/frontend/utils/useToast';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

## Usage Examples

### Basic Usage

```tsx
import Aesthetics from './DATABASEPAGES/frontend/pages/Aesthetics';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Aesthetics />
    </div>
  );
}
```

### Custom Database Page

```tsx
import DataPage from './DATABASEPAGES/frontend/components/DataPage';

function Products() {
  const config = {
    title: "Products",
    apiEndpoint: "/api/products",
    favoriteItemType: "products",
    defaultViewMode: "minicard",
    enabledViewModes: ["spreadsheet", "minicard", "largecards"],
    
    spreadsheetConfig: {
      title: "Products",
      apiEndpoint: "/api/products",
      headers: ["name", "price", "category", "stock"],
      defaultItem: {
        name: "",
        price: 0,
        category: "",
        stock: 0
      },
      favoriteItemType: "products"
    },
    
    miniCardConfig: {
      title: "Products",
      apiEndpoint: "/api/products",
      favoriteItemType: "products",
      searchFields: ["name", "description"],
      categoryField: "category",
      renderCard: (product) => ({
        id: product.id,
        title: product.name,
        description: `$${product.price}`,
        categories: [product.category],
        expandedContent: () => <ProductDetails product={product} />
      })
    }
  };
  
  return <DataPage config={config} />;
}
```

## Troubleshooting

### Common Issues

1. **Styles not loading**: Make sure Tailwind is configured correctly and CSS variables are defined.

2. **API errors**: Check that backend routes are properly configured and database is connected.

3. **TypeScript errors**: Ensure all TypeScript dependencies are installed and tsconfig.json is configured.

4. **Missing icons**: Install lucide-react: `npm install lucide-react`

5. **Excel import/export not working**: Install xlsx: `npm install xlsx`

### Debug Mode

Enable debug logging:

```javascript
// In your backend routes
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Database request:', req.method, req.path);
}
```

## Next Steps

- Read the [API Documentation](./API.md) for backend integration
- Check [Views Documentation](./VIEWS.md) for view mode configurations
- See [Integration Guide](./INTEGRATION.md) for framework-specific examples