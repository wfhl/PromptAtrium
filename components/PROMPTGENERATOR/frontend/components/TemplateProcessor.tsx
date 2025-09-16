import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { PromptResultCard } from './PromptResultCard';
import { type PromptResult } from './PromptActions';
import { toast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  template_type: string;
  master_prompt: string;
  llm_provider: string;
  llm_model: string;
  use_happy_talk: boolean;
  compress_prompt: boolean;
  compression_level: number;
}

interface TemplateProcessorProps {
  selectedTemplates: Template[];
  userPrompt: string;
  onResultsGenerated?: (results: PromptResult[]) => void;
  onRecall?: (result: PromptResult) => void;
  onSendToGenerator?: (result: PromptResult) => void;
  onSaveToLibrary?: (result: PromptResult) => void;
  onShare?: (result: PromptResult) => void;
  disabled?: boolean;
  className?: string;
}

interface ProcessingStatus {
  templateId: string;
  templateName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: PromptResult;
  error?: string;
}

export function TemplateProcessor({
  selectedTemplates,
  userPrompt,
  onResultsGenerated,
  onRecall,
  onSendToGenerator,
  onSaveToLibrary,
  onShare,
  disabled = false,
  className = ""
}: TemplateProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatus[]>([]);
  const [results, setResults] = useState<PromptResult[]>([]);

  // Enhanced prompt generation function that calls LLM service
  const enhancePromptWithTemplate = async (userPrompt: string, template: Template): Promise<PromptResult> => {
    const startTime = Date.now();
    
    try {
      // Prepare the enhancement request to match backend schema
      const enhancementRequest = {
        prompt: userPrompt,
        llmProvider: template.llm_provider,
        llmModel: template.llm_model,
        useHappyTalk: template.use_happy_talk,
        compressPrompt: template.compress_prompt,
        compressionLevel: template.compression_level,
        customBasePrompt: template.master_prompt
      };

      // Make the API call to enhance the prompt
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancementRequest),
      });

      if (!response.ok) {
        throw new Error(`Enhancement failed: ${response.statusText}`);
      }

      const enhancementResult = await response.json();
      const responseTime = Date.now() - startTime;

      // Create the result object using backend response
      const result: PromptResult = {
        id: enhancementResult.historyId || `${template.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        templateName: template.name,
        templateType: template.template_type,
        prompt: enhancementResult.enhancedPrompt,
        negativePrompt: enhancementResult.negativePrompt,
        timestamp: new Date().toISOString(),
        diagnostics: enhancementResult.diagnostics || {
          llmParams: {
            provider: template.llm_provider,
            model: template.llm_model,
            useHappyTalk: template.use_happy_talk,
            compressPrompt: template.compress_prompt,
            compressionLevel: template.compression_level,
            masterPromptLength: template.master_prompt.length,
          },
          templateSource: 'database',
          templateId: template.id,
          responseTime,
          timestamp: new Date().toISOString(),
          dbConnectionStatus: 'connected',
          fallbackUsed: false,
        }
      };

      return result;
    } catch (error) {
      console.error(`Error enhancing prompt with template ${template.name}:`, error);
      
      // Return a result with error information
      const errorResult: PromptResult = {
        id: `${template.id}_error_${Date.now()}`,
        templateName: template.name,
        templateType: template.template_type,
        prompt: userPrompt, // Fallback to original prompt
        timestamp: new Date().toISOString(),
        diagnostics: {
          llmParams: {
            provider: template.llm_provider,
            model: template.llm_model,
            useHappyTalk: template.use_happy_talk,
            compressPrompt: template.compress_prompt,
            compressionLevel: template.compression_level,
            masterPromptLength: template.master_prompt.length,
          },
          templateSource: 'fallback',
          templateId: template.id,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          dbConnectionStatus: 'failed',
          fallbackUsed: true,
          errors: [{
            type: 'Enhancement Error',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            handledBy: 'TemplateProcessor'
          }]
        }
      };

      return errorResult;
    }
  };

  // Process all selected templates
  const processTemplates = async () => {
    if (!userPrompt.trim()) {
      toast({
        title: 'No Prompt to Process',
        description: 'Please enter a prompt before generating enhancements.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedTemplates.length === 0) {
      toast({
        title: 'No Templates Selected',
        description: 'Please select at least one template to process.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setResults([]);
    
    // Initialize processing statuses
    const initialStatuses: ProcessingStatus[] = selectedTemplates.map(template => ({
      templateId: template.id,
      templateName: template.name,
      status: 'pending'
    }));
    setProcessingStatuses(initialStatuses);

    try {
      // Process templates in parallel with status updates
      const enhancementPromises = selectedTemplates.map(async (template, index) => {
        // Update status to processing
        setProcessingStatuses(prev => prev.map((status, i) => 
          i === index ? { ...status, status: 'processing' } : status
        ));

        try {
          const result = await enhancePromptWithTemplate(userPrompt, template);
          
          // Update status to completed
          setProcessingStatuses(prev => prev.map((status, i) => 
            i === index ? { ...status, status: 'completed', result } : status
          ));

          return result;
        } catch (error) {
          // Update status to error
          setProcessingStatuses(prev => prev.map((status, i) => 
            i === index ? { 
              ...status, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error'
            } : status
          ));

          throw error;
        }
      });

      // Wait for all enhancements to complete
      const enhancementResults = await Promise.allSettled(enhancementPromises);
      
      // Extract successful results
      const successfulResults: PromptResult[] = enhancementResults
        .filter((result): result is PromiseFulfilledResult<PromptResult> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      // Count failures
      const failureCount = enhancementResults.filter(result => result.status === 'rejected').length;

      setResults(successfulResults);
      
      if (onResultsGenerated) {
        onResultsGenerated(successfulResults);
      }

      // Show success/failure toast
      if (successfulResults.length > 0) {
        toast({
          title: 'Prompt Enhancement Complete',
          description: `Successfully generated ${successfulResults.length} enhanced prompt${successfulResults.length === 1 ? '' : 's'}${failureCount > 0 ? ` (${failureCount} failed)` : ''}.`,
        });
      } else {
        toast({
          title: 'Enhancement Failed',
          description: 'All template enhancements failed. Please check your settings and try again.',
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error processing templates:', error);
      toast({
        title: 'Processing Error',
        description: 'An error occurred while processing templates.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Generate Button - Styled to match blue gradient from mockup */}
      <Button
        onClick={processTemplates}
        disabled={disabled || isProcessing || selectedTemplates.length === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 px-8 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing {selectedTemplates.length} Template{selectedTemplates.length === 1 ? '' : 's'}...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Prompt
          </>
        )}
      </Button>

      {/* Processing Status Indicators */}
      {isProcessing && processingStatuses.length > 0 && (
        <div className="space-y-2">
          {processingStatuses.map((status, index) => (
            <div key={status.templateId} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${
                status.status === 'pending' ? 'bg-gray-500' :
                status.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                status.status === 'completed' ? 'bg-green-500' :
                'bg-red-500'
              }`} />
              <span className="text-gray-300">{status.templateName}</span>
              <span className="text-gray-500 text-xs">
                {status.status === 'pending' ? 'Waiting...' :
                 status.status === 'processing' ? 'Processing...' :
                 status.status === 'completed' ? 'Complete' :
                 'Failed'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <PromptResultCard
              key={result.id}
              result={result}
              onRecall={onRecall}
              onSendToGenerator={onSendToGenerator}
              onSaveToLibrary={onSaveToLibrary}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}