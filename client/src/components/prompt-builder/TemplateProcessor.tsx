import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Copy, Download, Share2, Bookmark } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Template {
  id: string | number;
  name: string;
  template?: string;
  description?: string;
  template_type?: string;
}

interface ProcessedResult {
  prompt: string;
  negativePrompt?: string;
  templateName?: string;
}

interface TemplateProcessorProps {
  selectedTemplates: Template[];
  userPrompt: string;
  className?: string;
  onResultsGenerated?: (results: ProcessedResult[]) => void;
  onRecall?: (result: ProcessedResult) => void;
  onSendToGenerator?: (result: ProcessedResult) => void;
  onSaveToLibrary?: (result: ProcessedResult) => void;
  onShare?: (result: ProcessedResult) => void;
}

export function TemplateProcessor({
  selectedTemplates,
  userPrompt,
  className,
  onResultsGenerated,
  onRecall,
  onSendToGenerator,
  onSaveToLibrary,
  onShare
}: TemplateProcessorProps) {
  const [processedResults, setProcessedResults] = useState<ProcessedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processTemplates = () => {
    if (selectedTemplates.length === 0 || !userPrompt) return;
    
    setIsProcessing(true);
    
    // Simulate processing templates
    const results = selectedTemplates.map(template => {
      const processedPrompt = template.template 
        ? template.template.replace('{prompt}', userPrompt)
        : `${userPrompt}, ${template.name} style`;
      
      return {
        prompt: processedPrompt,
        negativePrompt: "",
        templateName: template.name
      };
    });
    
    setProcessedResults(results);
    if (onResultsGenerated) onResultsGenerated(results);
    setIsProcessing(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {selectedTemplates.length > 0 && userPrompt && (
        <Button
          onClick={processTemplates}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Process {selectedTemplates.length} Template{selectedTemplates.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}
      
      {processedResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300">Processed Results</h4>
          {processedResults.map((result, index) => (
            <Card key={index} className="p-3 bg-gray-900/50 border-gray-700">
              <div className="space-y-2">
                <div className="text-xs text-gray-400">{result.templateName}</div>
                <div className="text-sm text-white">{result.prompt}</div>
                <div className="flex gap-1 mt-2">
                  {onRecall && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRecall(result)}
                      className="h-7 px-2"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                  {onSendToGenerator && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSendToGenerator(result)}
                      className="h-7 px-2"
                    >
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  )}
                  {onSaveToLibrary && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSaveToLibrary(result)}
                      className="h-7 px-2"
                    >
                      <Bookmark className="h-3 w-3" />
                    </Button>
                  )}
                  {onShare && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onShare(result)}
                      className="h-7 px-2"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigator.clipboard.writeText(result.prompt)}
                    className="h-7 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}