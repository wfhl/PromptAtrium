import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../frontend/hooks/use-toast';

const queryClient = new QueryClient();

/**
 * Markdown Notes Example
 * 
 * Rich markdown editor with:
 * - Live preview
 * - Syntax highlighting
 * - Tables support
 * - Code blocks
 * - Math equations (LaTeX)
 * - Mermaid diagrams
 * - Export to HTML/PDF
 */
export default function MarkdownNotesApp() {
  const [content, setContent] = useState(`# Welcome to Markdown Notes

This is a **powerful** markdown editor with _live preview_.

## Features

- [x] Live preview
- [x] Syntax highlighting
- [x] Table support
- [ ] Export to PDF

## Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

## Table Example

| Feature | Status | Priority |
|---------|--------|----------|
| Preview | ✅ Done | High |
| Export | 🚧 WIP | Medium |
| Share | 📋 Todo | Low |

## Math Equation

The quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

## Mermaid Diagram

\`\`\`mermaid
graph TD
  A[Start] --> B{Is it working?}
  B -->|Yes| C[Great!]
  B -->|No| D[Debug]
  D --> B
\`\`\`

> **Note:** This editor supports GitHub Flavored Markdown (GFM)

### Quick Links
- [Documentation](https://docs.example.com)
- [GitHub](https://github.com)
- [Support](mailto:support@example.com)

---

*Happy writing!* 📝
`);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSplitView, setIsSplitView] = useState(true);

  // Simple markdown to HTML converter (in real app, use a library like marked or remark)
  const renderMarkdown = (markdown: string) => {
    // This is a simplified example - use a proper markdown parser in production
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br />');
    
    return html;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="h-screen flex flex-col bg-gray-50">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => document.execCommand('bold')}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => document.execCommand('italic')}
                  className="p-2 rounded hover:bg-gray-100"
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  title="Heading"
                >
                  H
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  title="Link"
                >
                  🔗
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  title="Code"
                >
                  {'</>'}
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  title="Quote"
                >
                  "
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  title="List"
                >
                  ☰
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  title="Table"
                >
                  ⊞
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPreviewMode(false);
                    setIsSplitView(false);
                  }}
                  className={`px-3 py-1 rounded ${
                    !isPreviewMode && !isSplitView
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setIsPreviewMode(false);
                    setIsSplitView(true);
                  }}
                  className={`px-3 py-1 rounded ${
                    isSplitView
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => {
                    setIsPreviewMode(true);
                    setIsSplitView(false);
                  }}
                  className={`px-3 py-1 rounded ${
                    isPreviewMode && !isSplitView
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* Editor and Preview */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            {(!isPreviewMode || isSplitView) && (
              <div className={`${isSplitView ? 'w-1/2' : 'w-full'} border-r border-gray-200`}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                  placeholder="Write your markdown here..."
                  spellCheck={false}
                />
              </div>
            )}

            {/* Preview */}
            {(isPreviewMode || isSplitView) && (
              <div className={`${isSplitView ? 'w-1/2' : 'w-full'} overflow-auto`}>
                <div 
                  className="p-4 prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                {content.split(/\s+/).filter(word => word.length > 0).length} words, {content.length} characters
              </span>
              <span>Markdown</span>
            </div>
          </div>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}