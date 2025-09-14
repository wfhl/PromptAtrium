# Views Documentation

Comprehensive guide to all view modes in the Database Pages package.

## Overview

The Database Pages package provides four distinct view modes, each optimized for different use cases:

1. **Spreadsheet View** - Excel-like interface for bulk data management
2. **Mini Card View** - Compact card grid for visual browsing
3. **Large Card View** - Detailed cards with rich information display
4. **List View** - Expandable list format for hierarchical data

## Spreadsheet View

### Features
- **Inline Editing**: Edit cells directly in the table
- **Bulk Operations**: Select multiple rows for batch actions
- **Excel Import/Export**: Import from and export to Excel files
- **Column Sorting**: Click headers to sort by any column
- **Password Protection**: Admin mode for editing
- **Auto-save**: Track unsaved changes
- **Validation**: Real-time data validation

### Configuration

```typescript
spreadsheetConfig: {
  title: "Data Spreadsheet",
  apiEndpoint: "/api/data",
  headers: ["name", "description", "category", "status"],
  defaultItem: {
    name: "",
    description: "",
    category: "default",
    status: "active"
  },
  renderCell: (item, field, isEditMode, onChange) => {
    // Custom cell renderer
    if (field === "status") {
      return (
        <Select 
          value={item[field]} 
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditMode}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      );
    }
    // Default text input
    return (
      <input
        value={item[field]}
        onChange={(e) => onChange(e.target.value)}
        disabled={!isEditMode}
      />
    );
  },
  validateItem: (item) => {
    if (!item.name) return "Name is required";
    if (item.name.length < 3) return "Name must be at least 3 characters";
    return null;
  },
  favoriteItemType: "data_items",
  categoryField: "category",
  searchFields: ["name", "description"],
  alphabetField: "name"
}
```

### Usage Example

```tsx
<DatabaseSpreadsheet config={spreadsheetConfig} />
```

### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save changes
- `Ctrl/Cmd + A`: Select all rows
- `Delete`: Delete selected rows
- `Tab`: Navigate between cells
- `Enter`: Edit cell / Save cell

## Mini Card View

### Features
- **Compact Cards**: Space-efficient card layout
- **Expandable Details**: Click to view full information
- **Visual Preview**: Display images or icons
- **Quick Actions**: Favorite button on each card
- **Responsive Grid**: Auto-adjusting columns
- **Pagination**: Handle large datasets
- **Category Badges**: Visual category indicators

### Configuration

```typescript
miniCardConfig: {
  title: "Card Grid",
  apiEndpoint: "/api/items",
  favoriteItemType: "items",
  renderCard: (item) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    categories: item.categories,
    tags: item.tags,
    era: item.era,
    colorClass: getColorForCategory(item.category),
    expandedContent: () => (
      <div>
        <h3>Details</h3>
        <p>{item.fullDescription}</p>
        <img src={item.imageUrl} alt={item.name} />
      </div>
    )
  }),
  searchFields: ["name", "description", "tags"],
  categoryField: "category",
  alphabetField: "name",
  enableAlphabetFilter: true,
  enableCategoryFilter: true,
  enableSearch: true
}
```

### Grid Layouts

```typescript
// Control grid columns
columns: 4 // Options: 2, 3, 4, 5, 6

// Responsive breakpoints
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 3-4 columns
// Wide: 5-6 columns
```

## Large Card View

### Features
- **Rich Content**: Display detailed information
- **Metadata Sections**: Structured data display
- **Custom Actions**: Add buttons for operations
- **Visual Hierarchy**: Clear information structure
- **Icons and Images**: Visual elements support
- **Status Indicators**: Badges and tags
- **Interactive Elements**: Embedded components

### Configuration

```typescript
largeCardConfig: {
  title: "Detailed Cards",
  apiEndpoint: "/api/items",
  favoriteItemType: "items",
  renderLargeCard: (item) => ({
    id: item.id,
    title: item.name,
    description: item.summary,
    categories: item.categories,
    tags: item.tags,
    era: item.era,
    colorClass: "border-blue-500",
    icon: <FileIcon />,
    metadata: {
      "Created": formatDate(item.created_at),
      "Updated": formatDate(item.updated_at),
      "Status": item.status,
      "Owner": item.owner
    },
    actions: (
      <>
        <Button size="sm">Edit</Button>
        <Button size="sm" variant="outline">View</Button>
      </>
    ),
    content: (
      <div className="prose">
        <ReactMarkdown>{item.content}</ReactMarkdown>
      </div>
    )
  }),
  searchFields: ["name", "description", "content"],
  categoryField: "category",
  alphabetField: "name"
}
```

### Card Sections

1. **Header**: Title, icon, favorite button
2. **Description**: Brief summary text
3. **Categories/Tags**: Visual indicators
4. **Metadata**: Key-value pairs
5. **Content**: Custom content area
6. **Actions**: Button group

## List View

### Features
- **Expandable Rows**: Click to reveal details
- **Hierarchical Display**: Parent-child relationships
- **Inline Metadata**: Key information visible
- **Batch Selection**: Select multiple items
- **Quick Actions**: Per-item operations
- **Compact Mode**: Dense information display
- **Tree Structure**: Nested items support

### Configuration

```typescript
listViewConfig: {
  title: "List Display",
  apiEndpoint: "/api/items",
  favoriteItemType: "items",
  searchPlaceholder: "Search items...",
  categoryLabel: "Type",
  renderListItem: (item) => ({
    id: item.id,
    title: item.name,
    description: item.brief,
    categories: [item.type],
    tags: item.tags,
    era: item.period,
    metadata: {
      "Status": item.status,
      "Priority": item.priority,
      "Assigned": item.assignee,
      "Due Date": item.dueDate
    },
    actions: (
      <Button size="sm" variant="ghost">
        Options
      </Button>
    )
  }),
  searchFields: ["name", "description", "assignee"],
  categoryField: "type",
  alphabetField: "name"
}
```

### Expansion States

```typescript
// Control expanded items
const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

// Toggle expansion
toggleExpand(itemId);

// Expand all
expandAll();

// Collapse all
collapseAll();
```

## Unified Filters

All views share a unified filtering system:

### Search
- Real-time search across specified fields
- Configurable placeholder text
- Clear button when active

### Category Filter
- Dynamic categories from data
- Single selection
- "All" option to clear

### Alphabet Filter
- A-Z letter buttons
- Filter by first letter
- "All" option to clear

### Tag Filter
- Multi-select tags
- AND logic (all tags must match)
- Visual indicators

### Sort Options
- Alphabetical (A-Z, Z-A)
- Newest First
- Oldest First
- Most Popular
- Custom sort fields

## Favorites System

Integrated across all views:

### Features
- **Persistent Favorites**: Stored in database
- **Quick Access**: Favorites section at top
- **Visual Indicators**: Heart icon states
- **Real-time Updates**: Instant UI feedback
- **Cross-view Sync**: Favorites shared between views

### Implementation

```typescript
<FavoriteButton
  itemId={item.id}
  itemType="items"
  size="sm"
  onToggle={(isFavorited) => {
    // Handle favorite toggle
  }}
/>
```

## Custom View Mode

Create your own view mode:

```typescript
const customViewConfig = {
  customComponent: MyCustomView
};

function MyCustomView({ config }) {
  // Implement custom view logic
  return (
    <div>
      {/* Custom view implementation */}
    </div>
  );
}
```

## Performance Optimization

### Pagination
- Default: 200 items per page
- Configurable page size
- Lazy loading support

### Virtual Scrolling
```typescript
import { FixedSizeList } from 'react-window';

// For large datasets
<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
>
  {Row}
</FixedSizeList>
```

### Memoization
```typescript
const memoizedCards = useMemo(() => 
  items.map(item => renderCard(item)),
  [items, renderCard]
);
```

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: 1024px - 1280px
- Wide: > 1280px

### Adaptive Features
- Column count adjusts
- Sidebar becomes drawer on mobile
- Touch-friendly controls
- Simplified filters on small screens