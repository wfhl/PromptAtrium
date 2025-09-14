import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../frontend/hooks/use-toast';
import Notes from '../../frontend/pages/Notes';

const queryClient = new QueryClient();

/**
 * Advanced Notes App Example
 * 
 * This example demonstrates all features of the Notes package including:
 * - Multiple note types (text, markdown, code, todo, HTML)
 * - Advanced folder management with colors and icons
 * - Comprehensive tag system
 * - Search with filters
 * - Bulk operations
 * - Keyboard shortcuts
 * - PWA support
 * - Real-time sync
 */
export default function AdvancedNotesApp() {
  const [user] = useState({
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
  });

  const [config] = useState({
    features: {
      markdown: true,
      codeHighlighting: true,
      todoLists: true,
      htmlEditor: true,
      fileAttachments: true,
      sharing: true,
      collaboration: false,
      encryption: false,
    },
    ui: {
      theme: 'light',
      defaultView: 'masonry',
      showSidebar: true,
      compactMode: false,
    },
    limits: {
      maxNoteSize: 10 * 1024 * 1024, // 10MB
      maxAttachmentSize: 25 * 1024 * 1024, // 25MB
      maxNotesPerFolder: null, // Unlimited
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header with user info and settings */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Advanced Notes
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user.name}
                </span>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Settings
                </button>
              </div>
            </div>
          </header>

          {/* Main notes interface */}
          <main className="h-[calc(100vh-60px)]">
            <Notes 
              user={user}
              config={config}
              // Additional props for advanced features
              onNoteCreate={(note) => console.log('Note created:', note)}
              onNoteUpdate={(note) => console.log('Note updated:', note)}
              onNoteDelete={(noteId) => console.log('Note deleted:', noteId)}
            />
          </main>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}

// Example of custom hooks for advanced features
export function useNotesSync() {
  // WebSocket connection for real-time sync
  const [socket, setSocket] = useState(null);

  React.useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/notes-sync');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle real-time updates
      if (data.type === 'note-updated') {
        queryClient.invalidateQueries(['notes']);
      }
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  return socket;
}

// Example of custom storage adapter
export class CloudStorageAdapter {
  async uploadAttachment(file: File): Promise<string> {
    // Upload to cloud storage
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const { url } = await response.json();
    return url;
  }

  async deleteAttachment(url: string): Promise<void> {
    await fetch('/api/delete', {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    });
  }
}