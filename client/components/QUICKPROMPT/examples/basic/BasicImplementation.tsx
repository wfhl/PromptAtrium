import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from '../../frontend/components/QuickPromptPlay';

/**
 * Basic Implementation Example
 * This shows the simplest way to integrate Quick Prompt Generator
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function BasicImplementation() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto max-w-4xl p-4">
          <h1 className="text-3xl font-bold text-white mb-6">
            Quick Prompt Generator - Basic Implementation
          </h1>
          
          {/* The main Quick Prompt component */}
          <QuickPromptPlay />
        </div>
      </div>
    </QueryClientProvider>
  );
}

// Usage in your app:
// import BasicImplementation from './QUICKPROMPT/examples/basic/BasicImplementation';
// 
// function App() {
//   return <BasicImplementation />;
// }