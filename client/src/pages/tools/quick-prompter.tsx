import { useState, useEffect } from "react";
// Using our adapted version with proper imports
import QuickPromptPlay from "@/components/dashboard/QuickPromptPlay";

export default function QuickPrompterPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
            Quick Prompt Generator
          </h1>
          <p className="text-muted-foreground">
            AI prompt generator with templates, character presets, and smart enhancement
          </p>
        </div>
        
        {/* Using the adapted QuickPromptPlay component from QUICKPROMPT package */}
        <QuickPromptPlay />
      </div>
    </div>
  );
}