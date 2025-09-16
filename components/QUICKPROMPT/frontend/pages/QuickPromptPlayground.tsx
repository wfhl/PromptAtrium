import { useState, useEffect } from "react";
import QuickPromptPlay from "@/components/dashboard/QuickPromptPlay";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileFloatingDock from "@/components/mobile/MobileFloatingDock";

export default function QuickPromptPlayground() {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
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
    <div className="min-h-screen bg-zinc-900">
      {/* Mobile Header */}
      {isMobile && <MobileHeader pageName="Quick Prompt" />}
      
      <div className={`container mx-auto max-w-4xl ${isMobile ? 'p-2 pt-4' : 'p-4'}`}>
        <QuickPromptPlay />
      </div>
    </div>
    
    {/* Mobile Floating Dock */}
    <MobileFloatingDock currentPage="/quick-prompt" />
    </>
  );
}