import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuickPromptPlay from '../../frontend/components/QuickPromptPlay';
import MobileHeader from '../../frontend/components/mobile/MobileHeader';
import MobileFloatingDock from '../../frontend/components/mobile/MobileFloatingDock';

/**
 * Mobile Responsive Implementation
 * This example shows how to create a fully responsive Quick Prompt experience
 * that adapts to mobile, tablet, and desktop screens
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      cacheTime: 5 * 60 * 1000,
    },
  },
});

// Custom hook for detecting mobile devices
function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  return { isMobile, isTablet };
}

export default function MobileResponsiveImplementation() {
  const { isMobile, isTablet } = useMobileDetection();
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentView, setCurrentView] = useState('generator');
  
  // Mobile-specific configuration
  const mobileConfig = {
    layout: isMobile ? 'compact' : isTablet ? 'medium' : 'full',
    collapsibleSections: isMobile || isTablet,
    showHeader: !isMobile, // Hide header on mobile, use MobileHeader instead
    showFooter: !isMobile, // Hide footer on mobile, use MobileFloatingDock instead
    
    features: {
      enableSwipeGestures: isMobile,
      enableVoiceInput: isMobile,
      enableShake: isMobile, // Shake to randomize
      enableHapticFeedback: isMobile,
    },
    
    ui: {
      buttonSize: isMobile ? 'large' : 'medium',
      fontSize: isMobile ? 'base' : 'sm',
      spacing: isMobile ? 'comfortable' : 'compact',
      animations: !isMobile, // Reduce animations on mobile for performance
    },
  };
  
  // Swipe gesture handler
  const handleSwipe = (direction: 'left' | 'right') => {
    const views = ['generator', 'templates', 'characters', 'library'];
    const currentIndex = views.indexOf(currentView);
    
    if (direction === 'left' && currentIndex < views.length - 1) {
      setCurrentView(views[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentView(views[currentIndex - 1]);
    }
  };
  
  // Touch gesture setup
  useEffect(() => {
    if (!isMobile) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        handleSwipe(diff > 0 ? 'left' : 'right');
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, currentView]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900">
        {/* Mobile Header */}
        {isMobile && (
          <MobileHeader 
            pageName="Quick Prompt"
            onMenuClick={() => setShowSidebar(!showSidebar)}
          />
        )}
        
        {/* Main Content Area */}
        <div className={`
          ${isMobile ? 'p-2' : isTablet ? 'p-4' : 'p-6'}
          ${isMobile ? 'pb-20' : ''} // Extra padding for floating dock
        `}>
          {/* Desktop/Tablet Header */}
          {!isMobile && (
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Quick Prompt Generator
              </h1>
              
              {/* Tab Navigation for Tablet */}
              {isTablet && (
                <div className="flex gap-2 mt-4">
                  {['generator', 'templates', 'characters', 'library'].map(view => (
                    <button
                      key={view}
                      onClick={() => setCurrentView(view)}
                      className={`px-4 py-2 rounded-lg capitalize ${
                        currentView === view
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Responsive Container */}
          <div className={`
            mx-auto
            ${isMobile ? 'max-w-full' : isTablet ? 'max-w-2xl' : 'max-w-4xl'}
          `}>
            {/* Mobile View Indicator */}
            {isMobile && (
              <div className="flex justify-center mb-4">
                <div className="flex gap-1">
                  {['generator', 'templates', 'characters', 'library'].map((view, index) => (
                    <div
                      key={view}
                      className={`h-1.5 rounded-full transition-all ${
                        currentView === view
                          ? 'w-6 bg-amber-500'
                          : 'w-1.5 bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Main Quick Prompt Component */}
            <QuickPromptPlay
              config={mobileConfig}
              currentView={currentView}
              className={`
                ${isMobile ? 'mobile-view' : ''}
                ${isTablet ? 'tablet-view' : ''}
              `}
            />
          </div>
        </div>
        
        {/* Mobile Floating Dock */}
        {isMobile && (
          <MobileFloatingDock
            currentPage="/quick-prompt"
            onNavigate={(page) => {
              // Handle navigation
              console.log('Navigate to:', page);
            }}
          />
        )}
        
        {/* Mobile Sidebar */}
        {isMobile && showSidebar && (
          <div className="fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSidebar(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-gray-800 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Menu</h3>
              <nav className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">
                  Settings
                </button>
                <button className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">
                  Templates
                </button>
                <button className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">
                  Characters
                </button>
                <button className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">
                  Library
                </button>
                <button className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded">
                  Help
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </QueryClientProvider>
  );
}

// Additional responsive utility component
export function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  const { isMobile, isTablet } = useMobileDetection();
  
  return (
    <div className={`
      ${isMobile ? 'mobile-container' : ''}
      ${isTablet ? 'tablet-container' : ''}
      ${!isMobile && !isTablet ? 'desktop-container' : ''}
    `}>
      {children}
    </div>
  );
}

// CSS classes for responsive design (add to your CSS file)
const responsiveStyles = `
  .mobile-view {
    font-size: 16px;
  }
  
  .mobile-view button {
    min-height: 44px; /* Apple's recommended touch target size */
    font-size: 16px;
  }
  
  .mobile-view input,
  .mobile-view textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .tablet-view {
    font-size: 15px;
  }
  
  .mobile-container {
    padding: 0.5rem;
  }
  
  .tablet-container {
    padding: 1rem;
  }
  
  .desktop-container {
    padding: 1.5rem;
  }
  
  @media (max-width: 767px) {
    .hide-on-mobile {
      display: none;
    }
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    .hide-on-tablet {
      display: none;
    }
  }
  
  @media (min-width: 1024px) {
    .hide-on-desktop {
      display: none;
    }
  }
`;