import { useState, useEffect } from "react";
// Using our comprehensive Quick Prompt component
import QuickPromptComplete from "@/components/quickprompt/QuickPromptComplete";

export default function QuickPrompterPage() {
  // Force dark theme for this page to match the QUICKPROMPT design
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl p-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent" data-testid="text-page-title">
            Prompt Generator
          </h1>
          <p className="text-gray-400 text-sm">
            Generate AI prompts with templates, characters, and smart enhancement
          </p>
        </div>
        
        {/* Using the comprehensive QuickPrompt component with all features */}
        <QuickPromptComplete />
      </div>
    </div>
    
  );
  
}