# Mobile Features Documentation

Complete guide to mobile-specific features and optimizations in the Notes package.

## Overview

The Notes package includes a fully responsive mobile interface with touch-optimized controls and mobile-specific features. The mobile version is automatically activated on devices with screen width < 768px.

## Mobile Components

### MobileNotes Component

The main mobile interface located at `frontend/pages/MobileNotes.tsx`.

**Features:**
- Bottom navigation dock
- Floating action button
- Swipe gestures
- Pull-to-refresh
- Compact card layout
- Mobile-optimized search

### Mobile Header

Compact header with essential controls.

```jsx
<MobileHeader>
  <SearchBar />
  <FilterButton />
  <MenuButton />
</MobileHeader>
```

### Floating Dock

Bottom navigation with quick access to main features.

```jsx
<MobileFloatingDock>
  <DockItem icon="home" label="Home" />
  <DockItem icon="plus" label="New" primary />
  <DockItem icon="folder" label="Folders" />
  <DockItem icon="tag" label="Tags" />
  <DockItem icon="settings" label="Settings" />
</MobileFloatingDock>
```

## Touch Gestures

### Swipe Actions

**Swipe Right:**
- Pin/Unpin note
- Mark as favorite

**Swipe Left:**
- Delete note
- Archive note

**Implementation:**
```jsx
const handleSwipe = (direction, noteId) => {
  if (direction === 'right') {
    togglePin(noteId);
  } else if (direction === 'left') {
    archiveNote(noteId);
  }
};
```

### Long Press

Long press on notes to reveal context menu:
- Edit
- Share
- Duplicate
- Move to folder
- Add tags
- Delete

### Pull to Refresh

Pull down to refresh notes list:

```jsx
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  await queryClient.invalidateQueries(['notes']);
  setRefreshing(false);
};
```

### Pinch to Zoom

Pinch gesture to adjust card size:
- Compact view (3 columns)
- Regular view (2 columns)
- Large view (1 column)

## Mobile UI Optimizations

### Responsive Layout

**Breakpoints:**
```css
/* Mobile: < 640px */
@media (max-width: 639px) {
  .note-grid { grid-template-columns: 1fr; }
}

/* Tablet: 640px - 1024px */
@media (min-width: 640px) and (max-width: 1023px) {
  .note-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .note-grid { grid-template-columns: repeat(3, 1fr); }
}
```

### Touch-Friendly Controls

**Minimum Touch Target:**
- 44x44px for iOS
- 48x48px for Android

**Button Sizing:**
```css
.touch-button {
  min-height: 48px;
  min-width: 48px;
  padding: 12px;
}
```

### Thumb-Friendly Zones

Important controls placed in easy-to-reach areas:
- Bottom 1/3 of screen for primary actions
- Avoid top corners for frequent actions
- Floating action button in bottom-right

## Mobile-Specific Features

### Quick Actions

Floating action button with expandable menu:

```jsx
<FloatingActionButton>
  <QuickAction icon="text" label="Text Note" />
  <QuickAction icon="list" label="Todo List" />
  <QuickAction icon="code" label="Code Note" />
  <QuickAction icon="markdown" label="Markdown" />
</FloatingActionButton>
```

### Voice Input

Voice-to-text for note creation:

```jsx
const startVoiceInput = () => {
  const recognition = new webkitSpeechRecognition();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setNoteContent(transcript);
  };
  recognition.start();
};
```

### Offline Mode

Notes cached locally for offline access:

```jsx
// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Cache API responses
const cacheNotes = async (notes) => {
  const cache = await caches.open('notes-v1');
  await cache.put('/api/notes', new Response(JSON.stringify(notes)));
};
```

### Share Integration

Native share API for sharing notes:

```jsx
const shareNote = async (note) => {
  if (navigator.share) {
    await navigator.share({
      title: note.title,
      text: note.content,
      url: window.location.href
    });
  }
};
```

## Performance Optimizations

### Virtual Scrolling

For large note lists:

```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={window.innerHeight}
  itemCount={notes.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <NoteCard style={style} note={notes[index]} />
  )}
</FixedSizeList>
```

### Lazy Loading

Load images and content as needed:

```jsx
const LazyImage = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
  }, [src]);

  return <img ref={imgRef} src={imageSrc} alt={alt} />;
};
```

### Debounced Search

Reduce API calls during typing:

```jsx
const debouncedSearch = useMemo(
  () => debounce((query) => {
    searchNotes(query);
  }, 300),
  []
);
```

## PWA Features

### App Manifest

```json
{
  "name": "Notes App",
  "short_name": "Notes",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

### Install Prompt

```jsx
const [installPrompt, setInstallPrompt] = useState(null);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  setInstallPrompt(e);
});

const handleInstall = async () => {
  if (installPrompt) {
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      console.log('App installed');
    }
  }
};
```

### Push Notifications

```jsx
const subscribeToPush = async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
  });
  
  // Send subscription to server
  await fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## Mobile Navigation Patterns

### Tab Navigation

Bottom tabs for main sections:

```jsx
<TabBar>
  <Tab icon="notes" label="Notes" active />
  <Tab icon="folder" label="Folders" />
  <Tab icon="tag" label="Tags" />
  <Tab icon="search" label="Search" />
</TabBar>
```

### Drawer Menu

Side drawer for settings and preferences:

```jsx
<Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
  <DrawerItem icon="settings" label="Settings" />
  <DrawerItem icon="palette" label="Themes" />
  <DrawerItem icon="keyboard" label="Shortcuts" />
  <DrawerItem icon="help" label="Help" />
</Drawer>
```

### Bottom Sheets

For quick actions and options:

```jsx
<BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
  <SheetOption icon="edit" label="Edit Note" />
  <SheetOption icon="share" label="Share" />
  <SheetOption icon="delete" label="Delete" danger />
</BottomSheet>
```

## Accessibility

### Screen Reader Support

```jsx
<button
  aria-label="Create new note"
  aria-describedby="create-note-help"
>
  <PlusIcon />
</button>
<span id="create-note-help" className="sr-only">
  Tap to create a new note
</span>
```

### Focus Management

```jsx
const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
};
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .note-card {
    border: 2px solid currentColor;
  }
  
  .button {
    outline: 2px solid currentColor;
  }
}
```

## Testing Mobile Features

### Device Testing

Test on real devices and emulators:
- iOS Safari
- Android Chrome
- iPad Safari
- Android tablets

### Touch Event Testing

```javascript
// Simulate touch events in tests
const simulateSwipe = (element, direction) => {
  const touch = new Touch({
    identifier: Date.now(),
    target: element,
    clientX: direction === 'right' ? 0 : 100,
    clientY: 50
  });
  
  element.dispatchEvent(new TouchEvent('touchstart', {
    touches: [touch]
  }));
  
  // Move
  touch.clientX = direction === 'right' ? 100 : 0;
  element.dispatchEvent(new TouchEvent('touchmove', {
    touches: [touch]
  }));
  
  // End
  element.dispatchEvent(new TouchEvent('touchend', {
    touches: []
  }));
};
```

### Responsive Testing

```javascript
// Test different viewport sizes
describe('Mobile Layout', () => {
  it('shows mobile layout on small screens', () => {
    cy.viewport('iphone-x');
    cy.visit('/notes');
    cy.get('.mobile-header').should('be.visible');
    cy.get('.desktop-sidebar').should('not.be.visible');
  });
  
  it('shows tablet layout on medium screens', () => {
    cy.viewport('ipad-2');
    cy.visit('/notes');
    cy.get('.tablet-layout').should('be.visible');
  });
});
```

## Performance Tips

1. **Minimize Re-renders:** Use React.memo and useMemo
2. **Optimize Images:** Use WebP format and responsive images
3. **Reduce Bundle Size:** Code split and lazy load components
4. **Cache API Calls:** Use React Query's caching
5. **Debounce User Input:** Prevent excessive API calls
6. **Virtual Scrolling:** For lists with 100+ items
7. **Minimize Animations:** Use CSS transforms only
8. **Preload Critical Resources:** Use link preload tags