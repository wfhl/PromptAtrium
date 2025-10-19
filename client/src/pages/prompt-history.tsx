import { PromptHistoryContent } from "@/components/PromptHistoryContent";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function PromptHistoryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLoadPrompt = (prompt: string, metadata?: any) => {
    // Navigate to the quick prompter tool with the loaded prompt
    setLocation("/tools/quick-prompter");
    toast({
      title: "Prompt loaded",
      description: "The prompt has been loaded into the Quick Prompt Generator"
    });
    
    // Store the prompt data in sessionStorage so the quick prompter can access it
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('loadedPrompt', JSON.stringify({
        prompt,
        metadata
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 h-full">
      <div className="max-w-7xl mx-auto h-full">
        <PromptHistoryContent 
          onLoadPrompt={handleLoadPrompt}
          embedded={true}
        />
      </div>
    </div>
  );
}