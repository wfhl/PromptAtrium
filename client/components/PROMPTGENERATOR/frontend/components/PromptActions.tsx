import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Library, Share2, Copy } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import CopyButton from '@/components/CopyButton';

export interface PromptResult {
  id: string;
  templateName: string;
  templateType: string;
  prompt: string;
  negativePrompt?: string;
  timestamp: string;
  diagnostics?: any;
}

interface PromptActionsProps {
  result: PromptResult;
  onRecall?: (result: PromptResult) => void;
  onSendToGenerator?: (result: PromptResult) => void;
  onSaveToLibrary?: (result: PromptResult) => void;
  onShare?: (result: PromptResult) => void;
  showRecall?: boolean;
  showSendToGenerator?: boolean;
  showSaveToLibrary?: boolean;
  showShare?: boolean;
  showCopy?: boolean;
  size?: 'sm' | 'md';
}

export function PromptActions({ 
  result, 
  onRecall,
  onSendToGenerator,
  onSaveToLibrary,
  onShare,
  showRecall = true,
  showSendToGenerator = true,
  showSaveToLibrary = true,
  showShare = true,
  showCopy = true,
  size = 'sm'
}: PromptActionsProps) {
  
  const handleRecall = () => {
    if (onRecall) {
      onRecall(result);
      toast({
        title: 'Prompt Recalled',
        description: 'The prompt has been loaded back into the generator',
      });
    }
  };

  const handleSendToGenerator = () => {
    if (onSendToGenerator) {
      onSendToGenerator(result);
      toast({
        title: 'Sent to Generator',
        description: 'The prompt has been sent to the prompt generator',
      });
    }
  };

  const handleSaveToLibrary = async () => {
    if (onSaveToLibrary) {
      try {
        await onSaveToLibrary(result);
        toast({
          title: 'Saved to Library',
          description: 'The prompt has been saved to your library',
        });
      } catch (error) {
        toast({
          title: 'Save Failed',
          description: 'Failed to save prompt to library',
          variant: 'destructive',
        });
      }
    }
  };

  const handleShare = async () => {
    if (onShare) {
      await onShare(result);
    } else {
      // Default share behavior
      const shareText = `Generated Prompt (${result.templateName}):\n\n${result.prompt}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Generated Prompt - ${result.templateName}`,
            text: shareText,
          });
          toast({
            title: 'Prompt Shared',
            description: 'Successfully shared the prompt',
          });
        } catch (error) {
          // Fall back to clipboard
          navigator.clipboard.writeText(shareText);
          toast({
            title: 'Copied to Clipboard',
            description: 'The prompt has been copied to your clipboard',
          });
        }
      } else {
        navigator.clipboard.writeText(shareText);
        toast({
          title: 'Copied to Clipboard',
          description: 'The prompt has been copied to your clipboard',
        });
      }
    }
  };

  const buttonSize = size === 'sm' ? 'icon' : 'sm';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const buttonClass = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

  return (
    <div className="flex gap-1">
      {showRecall && (
        <Button 
          size={buttonSize}
          variant="ghost" 
          className={buttonClass}
          onClick={handleRecall}
          title="Recall this prompt"
        >
          <RefreshCw className={iconSize} />
        </Button>
      )}
      
      {showSendToGenerator && (
        <Button 
          size={buttonSize}
          variant="ghost" 
          className={buttonClass}
          onClick={handleSendToGenerator}
          title="Send to generator"
        >
          <Zap className={`${iconSize} text-purple-400`} />
        </Button>
      )}
      
      {showSaveToLibrary && (
        <Button 
          size={buttonSize}
          variant="ghost" 
          className={`${buttonClass} bg-gradient-to-r from-yellow-600/20 to-orange-600/20 hover:from-yellow-600/30 hover:to-orange-600/30 border border-yellow-500/30`}
          onClick={handleSaveToLibrary}
          title="Save to library"
        >
          <Library className={`${iconSize} text-yellow-400`} />
        </Button>
      )}
      
      {showShare && (
        <Button 
          size={buttonSize}
          variant="ghost" 
          className={buttonClass}
          onClick={handleShare}
          title="Share prompt"
        >
          <Share2 className={iconSize} />
        </Button>
      )}
      
      {showCopy && (
        <CopyButton 
          size={size === 'sm' ? 'xs' : 'sm'} 
          textToCopy={result.prompt} 
        />
      )}
    </div>
  );
}