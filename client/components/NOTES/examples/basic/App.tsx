import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../frontend/hooks/use-toast';
import Notes from '../../frontend/pages/Notes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

/**
 * Basic Notes App Example
 * 
 * This example shows the simplest way to integrate the Notes package
 * into your React application.
 * 
 * Features included:
 * - Create, read, update, delete notes
 * - Basic text notes
 * - Simple folder organization
 * - Basic search functionality
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="h-screen">
          <Notes />
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}