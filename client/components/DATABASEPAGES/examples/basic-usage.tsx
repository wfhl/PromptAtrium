// Basic Usage Example
// This example shows how to use the pre-built database pages

import React from 'react';
import { ToastProvider } from '../frontend/utils/useToast';
import Aesthetics from '../frontend/pages/Aesthetics';
import CheckpointModels from '../frontend/pages/CheckpointModels';
import CollaborationHubs from '../frontend/pages/CollaborationHubs';
import PromptComponents from '../frontend/pages/PromptComponents';

// Example 1: Single Database Page
export function BasicAestheticsPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <Aesthetics />
      </div>
    </ToastProvider>
  );
}

// Example 2: Multiple Database Pages with Navigation
export function DatabaseDashboard() {
  const [currentPage, setCurrentPage] = React.useState('aesthetics');
  
  const pages = {
    aesthetics: Aesthetics,
    models: CheckpointModels,
    hubs: CollaborationHubs,
    prompts: PromptComponents,
  };
  
  const CurrentPage = pages[currentPage as keyof typeof pages];
  
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 shadow-md p-4">
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage('aesthetics')}
              className={`px-4 py-2 rounded ${
                currentPage === 'aesthetics' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Aesthetics
            </button>
            <button
              onClick={() => setCurrentPage('models')}
              className={`px-4 py-2 rounded ${
                currentPage === 'models' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Models
            </button>
            <button
              onClick={() => setCurrentPage('hubs')}
              className={`px-4 py-2 rounded ${
                currentPage === 'hubs' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Collaboration
            </button>
            <button
              onClick={() => setCurrentPage('prompts')}
              className={`px-4 py-2 rounded ${
                currentPage === 'prompts' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Prompts
            </button>
          </div>
        </nav>
        
        {/* Content */}
        <div className="p-8">
          <CurrentPage />
        </div>
      </div>
    </ToastProvider>
  );
}

// Example 3: With User Authentication Context
export function AuthenticatedDatabasePage() {
  const [user, setUser] = React.useState<{ id: string; name: string } | null>(null);
  
  React.useEffect(() => {
    // Simulate authentication check
    const checkAuth = async () => {
      // Replace with actual auth check
      const userData = { id: 'user123', name: 'John Doe' };
      setUser(userData);
    };
    checkAuth();
  }, []);
  
  if (!user) {
    return <div>Please login to access the database</div>;
  }
  
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* User info header */}
        <div className="bg-white dark:bg-gray-800 p-4 shadow-md">
          <span>Logged in as: {user.name}</span>
        </div>
        
        {/* Database page with user context */}
        <div className="p-8">
          <Aesthetics />
        </div>
      </div>
    </ToastProvider>
  );
}