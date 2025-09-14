import { useState, useEffect } from "react";
import QuickPromptPlay from "@/components/dashboard/QuickPromptPlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFloatingDock from "@/components/mobile/MobileFloatingDock";
import { Helmet } from 'react-helmet';
import { useMobileDetection } from '@/hooks/useMobileDetection';

export default function StandaloneQuickPrompter() {
  const isMobile = useMobileDetection();

  if (typeof window !== 'undefined') {
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  return (
    <>
      <Helmet>
        <title>Quick Prompt Generator</title>
        <meta name="description" content="AI prompt generator for creative text generation" />
        <link rel="manifest" href="/quickprompter-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Quick Prompter" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="Quick Prompt Generator" />
        <link rel="icon" type="image/png" sizes="192x192" href="/elite-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/elite-icon-512.png" />
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Helmet>

      <div className="min-h-screen bg-zinc-900">
        {/* Mobile Header */}
        {isMobile && <MobileHeader pageName="Quick Prompt" />}

        <div className={`container mx-auto max-w-4xl ${isMobile ? 'p-2 pt-4' : 'p-4'}`}>
          <QuickPromptPlay />
        </div>
      </div>


    </>
  );
}