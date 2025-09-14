import { useState, useEffect } from "react";
import NewPromptGeneratorUI from "@/components/prompt-builder/NewPromptGeneratorUI";
import { Helmet } from "react-helmet";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFloatingDock from "@/components/mobile/MobileFloatingDock";
import { useLocation } from "wouter";
import { getMobilePageConfig } from "@/utils/pageConfig";

export default function NewPromptGenerator() {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [location] = useLocation();
  
  // Get page config for header
  const pageConfig = getMobilePageConfig(location);
  
  // Split page name to handle gradient on last word
  const words = pageConfig.label.split(' ');
  const lastWord = words[words.length - 1];
  const firstWords = words.slice(0, -1).join(' ');
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <Helmet>
        <link rel="manifest" href="/prompt-generator-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Prompt Gen" />
        <meta name="theme-color" content="#8B5CF6" />
      </Helmet>
      
      {/* Mobile Header */}
      {isMobile && <MobileHeader pageName="Prompt Generator" />}
      
      {!isMobile && (
        <div className="pg-page min-h-screen">
          {/* Page Header */}
          <div className="flex items-center justify-between p-4 pt-0 border-transparent ml-48">
            <div className="flex items-center gap-3">
              {/* Page Icon */}
              <div 
                className="w-8 h-8 flex items-center justify-center"
                style={{ color: pageConfig.color }}
              >
                {pageConfig.icon}
              </div>
              {/* Page Title with Gradient */}
              <h1 className="text-2xl font-bold">
                {firstWords && (
                  <span className="text-white mr-1">{firstWords}</span>
                )}
                <span 
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(45deg, ${pageConfig.color}, ${pageConfig.color}dd)`
                  }}
                >
                  {lastWord}
                </span>
              </h1>
            </div>
          </div>
          
          {/* Content */}
          <div className="max-w-7xl mx-auto space-y-6 p-6">
            <NewPromptGeneratorUI />
          </div>
        </div>
      )}
      
      {isMobile && (
        <div className="px-2 py-2">
          <NewPromptGeneratorUI />
        </div>
      )}
      
      {/* Mobile Floating Dock - Only show on mobile */}
      <div className="md:hidden">
        <MobileFloatingDock currentPage="/new-prompt-generator" />
      </div>
    </>
  );
}