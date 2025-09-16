# Basic Notes Example

Simple implementation of the Notes package with core features.

## Features

- Create, read, update, delete notes
- Text notes with basic formatting
- Folder organization
- Search functionality
- Pin important notes

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

```
basic/
├── App.tsx         # Main application component
├── index.html      # HTML entry point
├── main.tsx        # Application entry point
├── tailwind.css    # Tailwind styles
└── package.json    # Dependencies
```

## Usage

1. Click the "+" button to create a new note
2. Type your content
3. Notes auto-save as you type
4. Use folders to organize notes
5. Pin important notes to keep them at the top

## Customization

### Change Theme

Edit the color variables in `tailwind.css`:

```css
:root {
  --primary: #3b82f6;
  --secondary: #10b981;
}
```

### Add Authentication

Wrap the Notes component with your auth provider:

```tsx
<AuthProvider>
  <Notes user={currentUser} />
</AuthProvider>
```

## Next Steps

- Check the [Advanced Example](../advanced) for more features
- See [Mobile Example](../mobile) for mobile-specific UI
- Read the [API Documentation](../../docs/API.md) for backend integration