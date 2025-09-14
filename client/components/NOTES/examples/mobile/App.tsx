import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../frontend/hooks/use-toast';
import MobileNotes from '../../frontend/pages/MobileNotes';

const queryClient = new QueryClient();

/**
 * Mobile Notes App Example
 * 
 * Optimized for mobile devices with:
 * - Touch gestures (swipe, pinch, long press)
 * - Bottom navigation dock
 * - Floating action button
 * - Pull-to-refresh
 * - Offline support
 * - Voice input
 * - Camera integration
 */
export default function MobileNotesApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="h-screen bg-gray-50">
          <MobileNotes />
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}

// Example: Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered:', registration))
      .catch(error => console.log('SW registration failed:', error));
  });
}

// Example: Handle install prompt for PWA
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }
});