import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useDynamicManifest() {
  const [location] = useLocation();

  useEffect(() => {
    // Find existing manifest link or create one
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    // Determine which manifest to use based on current route
    let manifestPath = '/public/manifest.json'; // Default manifest
    
    if (location === '/tools/aspect-ratio-calculator') {
      manifestPath = '/public/manifest-aspect-ratio.json';
    } else if (location === '/tools/metadata-analyzer') {
      manifestPath = '/public/manifest-metadata.json';
    }
    
    // Update the manifest link
    manifestLink.href = manifestPath;

    // Also update the apple-mobile-web-app-title based on the page
    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
    if (appleTitleMeta) {
      if (location === '/tools/aspect-ratio-calculator') {
        appleTitleMeta.content = 'Aspect Ratio';
      } else if (location === '/tools/metadata-analyzer') {
        appleTitleMeta.content = 'Metadata';
      } else {
        appleTitleMeta.content = 'PromptAtrium';
      }
    }
  }, [location]);
}