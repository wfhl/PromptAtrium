import { Helmet } from 'react-helmet';
import { useEffect } from 'react';
import QuickPromptPlayground from './QuickPromptPlayground';

export default function QuickPrompter() {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Quick Prompt Generator - Elite Assets</title>
        <meta name="description" content="AI-powered prompt generator and builder for creative writing" />
        <meta name="theme-color" content="#f59e0b" />
        <link rel="manifest" href="/quickprompter-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Quick Prompt" />
        <link rel="apple-touch-icon" href="/elite-icon-180.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/elite-icon-180.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/elite-icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/elite-icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Quick Prompt" />
      </Helmet>
      <div className="min-h-screen bg-gray-950">
        <QuickPromptPlayground />
      </div>
    </>
  );
}