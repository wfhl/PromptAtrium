# Database Pages Examples

This directory contains comprehensive examples of how to use the Database Pages package.

## Example Files

### 1. basic-usage.tsx
Basic examples of using the pre-built database pages:
- Single database page usage
- Multiple pages with navigation
- With authentication context

### 2. custom-database.tsx
Examples of creating custom database pages:
- Product inventory management
- Employee directory
- Custom configurations for each view mode

### 3. custom-renderers.tsx
Advanced examples with custom cell and card renderers:
- Task management system with custom status badges
- Progress indicators
- Priority levels
- Rich interactive components

## Running the Examples

1. **Install dependencies:**
```bash
npm install
```

2. **Import an example in your app:**
```tsx
import { ProductDatabase } from './DATABASEPAGES/examples/custom-database';

function App() {
  return <ProductDatabase />;
}
```

3. **Setup backend API:**
Each example expects certain API endpoints. You can:
- Use the provided backend routes
- Mock the API responses
- Connect to your existing backend

## Common Patterns

### Custom Cell Renderer
```tsx
renderCell: (item, field, isEditMode, onChange) => {
  if (field === 'status') {
    return <CustomStatusComponent value={item[field]} onChange={onChange} />;
  }
  return <DefaultInput value={item[field]} onChange={onChange} />;
}
```

### Custom Card Renderer
```tsx
renderCard: (item) => ({
  id: item.id,
  title: item.name,
  description: item.description,
  expandedContent: () => <DetailedView item={item} />
})
```

### Validation
```tsx
validateItem: (item) => {
  if (!item.name) return "Name is required";
  if (item.price < 0) return "Price must be positive";
  return null;
}
```

## Customization Tips

1. **Styling**: Use Tailwind classes or custom CSS
2. **Icons**: Import from lucide-react for consistency
3. **State Management**: Integrate with Redux, Zustand, or Context API
4. **API Integration**: Use fetch, axios, or your preferred HTTP client
5. **Authentication**: Add user context and protected routes

## Need Help?

- Check the main [README](../README.md) for overview
- See [SETUP.md](../SETUP.md) for installation
- Review [API.md](../API.md) for backend integration
- Read [VIEWS.md](../VIEWS.md) for view mode details