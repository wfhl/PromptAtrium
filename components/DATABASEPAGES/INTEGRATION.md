# Integration Guide

Step-by-step integration examples for various frameworks and use cases.

## React Application

### Basic Integration

```tsx
// App.tsx
import React from 'react';
import { ToastProvider } from './DATABASEPAGES/frontend/utils/useToast';
import Aesthetics from './DATABASEPAGES/frontend/pages/Aesthetics';

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Aesthetics />
      </div>
    </ToastProvider>
  );
}

export default App;
```

### With React Router

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Aesthetics from './DATABASEPAGES/frontend/pages/Aesthetics';
import CheckpointModels from './DATABASEPAGES/frontend/pages/CheckpointModels';
import CollaborationHubs from './DATABASEPAGES/frontend/pages/CollaborationHubs';
import PromptComponents from './DATABASEPAGES/frontend/pages/PromptComponents';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/aesthetics" element={<Aesthetics />} />
          <Route path="/models" element={<CheckpointModels />} />
          <Route path="/hubs" element={<CollaborationHubs />} />
          <Route path="/prompts" element={<PromptComponents />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
```

## Next.js Integration

### Pages Router

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { ToastProvider } from '@/DATABASEPAGES/frontend/utils/useToast';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}

// pages/databases/aesthetics.tsx
import Aesthetics from '@/DATABASEPAGES/frontend/pages/Aesthetics';

export default function AestheticsPage() {
  return <Aesthetics />;
}
```

### App Router

```tsx
// app/layout.tsx
import { ToastProvider } from '@/DATABASEPAGES/frontend/utils/useToast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

// app/databases/aesthetics/page.tsx
import Aesthetics from '@/DATABASEPAGES/frontend/pages/Aesthetics';

export default function AestheticsPage() {
  return <Aesthetics />;
}
```

### API Routes

```typescript
// pages/api/system-data/[...params].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { handleDatabaseRequest } from '@/DATABASEPAGES/backend/routes/database-routes';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return handleDatabaseRequest(req, res);
}

// Or with App Router
// app/api/system-data/[...params]/route.ts
import { handleDatabaseRequest } from '@/DATABASEPAGES/backend/routes/database-routes';

export async function GET(request: Request) {
  return handleDatabaseRequest(request);
}

export async function POST(request: Request) {
  return handleDatabaseRequest(request);
}
```

## Vite Integration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@databasepages': path.resolve(__dirname, './src/DATABASEPAGES'),
    },
  },
});

// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastProvider } from '@databasepages/frontend/utils/useToast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
```

## Custom Database Page

### Simple Custom Page

```tsx
import DataPage, { DataPageConfig } from '@/DATABASEPAGES/frontend/components/DataPage';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
}

export default function ProductsDatabase() {
  const config: DataPageConfig<Product> = {
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
        stock: 0,
        description: ""
      },
      favoriteItemType: "products",
      validateItem: (item) => {
        if (!item.name) return "Product name is required";
        if (item.price < 0) return "Price cannot be negative";
        if (item.stock < 0) return "Stock cannot be negative";
        return null;
      }
    },
    
    miniCardConfig: {
      title: "Products",
      apiEndpoint: "/api/products",
      favoriteItemType: "products",
      searchFields: ["name", "description", "category"],
      categoryField: "category",
      renderCard: (product) => ({
        id: product.id,
        title: product.name,
        description: `$${product.price} - ${product.stock} in stock`,
        categories: [product.category],
        expandedContent: () => (
          <div>
            <p>{product.description}</p>
            <div className="mt-4">
              <strong>Price:</strong> ${product.price}<br/>
              <strong>Stock:</strong> {product.stock}<br/>
              <strong>Category:</strong> {product.category}
            </div>
          </div>
        )
      })
    }
  };
  
  return <DataPage config={config} />;
}
```

### Advanced Custom Page with Actions

```tsx
import { useState } from 'react';
import DataPage from '@/DATABASEPAGES/frontend/components/DataPage';
import { Button } from '@/DATABASEPAGES/frontend/components/ui/Button';

export default function AdvancedDatabase() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const handleExport = async () => {
    const response = await fetch(`/api/export?ids=${selectedItems.join(',')}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
  };
  
  const config = {
    // ... configuration
    
    largeCardConfig: {
      // ... other config
      renderLargeCard: (item) => ({
        // ... card data
        actions: (
          <>
            <Button
              size="sm"
              onClick={() => setSelectedItems([...selectedItems, item.id])}
            >
              Select
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/edit/${item.id}`, '_blank')}
            >
              Edit
            </Button>
          </>
        )
      })
    }
  };
  
  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1>Advanced Database</h1>
        <Button onClick={handleExport} disabled={selectedItems.length === 0}>
          Export Selected ({selectedItems.length})
        </Button>
      </div>
      <DataPage config={config} />
    </div>
  );
}
```

## Authentication Integration

### With User Context

```tsx
import { useContext } from 'react';
import { UserContext } from '@/contexts/UserContext';
import DataPage from '@/DATABASEPAGES/frontend/components/DataPage';

export default function SecureDatabase() {
  const { user } = useContext(UserContext);
  
  if (!user) {
    return <div>Please login to access this database</div>;
  }
  
  const config = {
    title: "Secure Data",
    apiEndpoint: `/api/users/${user.id}/data`,
    // Include user ID in headers for favorites
    favoriteItemType: `user_${user.id}_data`,
    // ... rest of config
  };
  
  return <DataPage config={config} />;
}
```

### With API Authentication

```typescript
// Modify backend routes to include authentication
import { verifyToken } from '@/utils/auth';

router.get('/:table', verifyToken, async (req, res) => {
  const userId = req.user.id;
  // Filter data by user
  const items = await db.select()
    .from(req.params.table)
    .where({ user_id: userId });
  res.json(items);
});
```

## State Management Integration

### With Redux

```tsx
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import DataPage from '@/DATABASEPAGES/frontend/components/DataPage';
import { fetchData, selectData } from '@/store/dataSlice';

export default function ReduxIntegratedDatabase() {
  const dispatch = useDispatch();
  const data = useSelector(selectData);
  
  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch]);
  
  const config = {
    // Use Redux data instead of API endpoint
    data: data,
    // ... rest of config
  };
  
  return <DataPage config={config} />;
}
```

### With Zustand

```tsx
import { useDataStore } from '@/stores/dataStore';
import DataPage from '@/DATABASEPAGES/frontend/components/DataPage';

export default function ZustandDatabase() {
  const { data, fetchData, updateItem } = useDataStore();
  
  const config = {
    data: data,
    onUpdate: updateItem,
    // ... rest of config
  };
  
  return <DataPage config={config} />;
}
```

## Testing Integration

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import DataPage from '@/DATABASEPAGES/frontend/components/DataPage';

describe('DataPage', () => {
  const mockConfig = {
    title: "Test Data",
    apiEndpoint: "/api/test",
    // ... config
  };
  
  it('renders correctly', () => {
    render(<DataPage config={mockConfig} />);
    expect(screen.getByText('Test Data')).toBeInTheDocument();
  });
  
  it('switches view modes', () => {
    render(<DataPage config={mockConfig} />);
    const miniCardButton = screen.getByTitle('Mini Cards');
    fireEvent.click(miniCardButton);
    // Assert view changed
  });
});
```

### E2E Tests

```typescript
// cypress/e2e/database.cy.ts
describe('Database Pages', () => {
  it('performs CRUD operations', () => {
    cy.visit('/databases/aesthetics');
    
    // Create
    cy.get('[data-testid="add-button"]').click();
    cy.get('input[name="name"]').type('New Item');
    cy.get('[data-testid="save-button"]').click();
    
    // Read
    cy.contains('New Item').should('exist');
    
    // Update
    cy.get('[data-testid="edit-button"]').first().click();
    cy.get('input[name="name"]').clear().type('Updated Item');
    cy.get('[data-testid="save-button"]').click();
    
    // Delete
    cy.get('[data-testid="delete-button"]').first().click();
    cy.get('[data-testid="confirm-delete"]').click();
  });
});
```

## Deployment

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

```bash
# .env.production
DATABASE_URL=postgresql://user:pass@host:5432/db
API_BASE_URL=https://api.example.com
NODE_ENV=production
```

## Migration from Existing System

### Data Migration Script

```typescript
// scripts/migrate.ts
import { oldDb } from './old-database';
import { newDb } from '@/DATABASEPAGES/backend/database';

async function migrate() {
  // Fetch old data
  const oldData = await oldDb.select().from('old_table');
  
  // Transform data
  const newData = oldData.map(item => ({
    name: item.title,
    description: item.content,
    category: item.type,
    // ... mapping
  }));
  
  // Insert into new database
  await newDb.insert(newData).into('aesthetics');
  
  console.log(`Migrated ${newData.length} items`);
}

migrate();
```