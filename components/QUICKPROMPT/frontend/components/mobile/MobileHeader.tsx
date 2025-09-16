import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getPageConfig } from "@/utils/pageConfig";

interface MobileHeaderProps {
  pageName: string;
  showBackButton?: boolean;
  backPath?: string;
}

export default function MobileHeader({ pageName, showBackButton = true, backPath = "/" }: MobileHeaderProps) {
  const pageConfig = getPageConfig(pageName);
  
  // Split page name to handle gradient on last word
  const words = pageName.split(' ');
  const lastWord = words[words.length - 1];
  const firstWords = words.slice(0, -1).join(' ');

  return (
    <header className="bg-gray-900/00 backdrop-blur-sm border-b border-transparent sticky top-0 z-40">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-3">
          <img 
            src="elite-logo.png" 
            alt="Elite" 
            className="w-6 h-6 object-contain" 
            onError={(e) => {
              console.error('Elite logo failed to load');
              e.currentTarget.style.display = 'none';
            }}
          />
        
          <div className="flex items-center space-x-2">
            {/* Page Icon */}
            <div 
              className="w-5 h-5 flex items-center justify-center"
              style={{ color: pageConfig.color }}
            >
              {pageConfig.icon}
            </div>
            {/* Page Title with Gradient */}
            <h1 className="text-base font-bold">
              {firstWords && (
                <span className="text-white mr-1">{firstWords}</span>
              )}
              <span 
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: pageConfig.gradient
                }}
              >
                {lastWord}
              </span>
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}