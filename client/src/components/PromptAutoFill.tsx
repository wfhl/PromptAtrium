import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PromptAutoFillProps {
  promptContent: string;
  onAutoFill: (data: any) => void;
  disabled?: boolean;
}

export function PromptAutoFill({ promptContent, onAutoFill, disabled }: PromptAutoFillProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAutoFill = async (mode: 'name_only' | 'all_fields') => {
    if (!promptContent || promptContent.trim().length < 10) {
      toast({
        title: "Insufficient content",
        description: "Please enter more prompt content before using auto-fill",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/ai/generate-prompt-metadata", {
        promptContent: promptContent.trim(),
        generationMode: mode
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Pass the generated data to parent component
      onAutoFill(result);
      
      toast({
        title: "Success",
        description: mode === 'name_only' 
          ? "Name generated successfully!" 
          : "All fields generated successfully!"
      });
    } catch (error) {
      console.error('Auto-fill failed:', error);
      toast({
        title: "Auto-fill failed",
        description: error.message || "Failed to generate metadata",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || !promptContent || promptContent.trim().length < 10;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled || isLoading}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-500/30"
          data-testid="button-autofill"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
              Auto-fill with AI
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Generate fields using AI
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleAutoFill('name_only')}
          disabled={isLoading}
          className="cursor-pointer"
          data-testid="menuitem-name-only"
        >
          <Wand2 className="mr-2 h-4 w-4 text-purple-400" />
          <div className="flex flex-col">
            <span className="font-medium">Generate name only</span>
            <span className="text-xs text-muted-foreground">
              Create a descriptive name for the prompt
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleAutoFill('all_fields')}
          disabled={isLoading}
          className="cursor-pointer"
          data-testid="menuitem-all-fields"
        >
          <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
          <div className="flex flex-col">
            <span className="font-medium">Generate all metadata</span>
            <span className="text-xs text-muted-foreground">
              Name, description, category, tags, and more
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}