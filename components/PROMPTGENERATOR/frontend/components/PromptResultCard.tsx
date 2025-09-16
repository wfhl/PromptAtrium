import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import { DiagnosticsCard } from './DiagnosticsCard';
import { PromptActions, type PromptResult } from './PromptActions';
import CopyButton from '@/components/CopyButton';

interface PromptResultCardProps {
  result: PromptResult;
  onRecall?: (result: PromptResult) => void;
  onSendToGenerator?: (result: PromptResult) => void;
  onSaveToLibrary?: (result: PromptResult) => void;
  onShare?: (result: PromptResult) => void;
  showDiagnostics?: boolean;
  showActions?: boolean;
  className?: string;
}

export function PromptResultCard({ 
  result, 
  onRecall,
  onSendToGenerator,
  onSaveToLibrary,
  onShare,
  showDiagnostics = true,
  showActions = true,
  className = ""
}: PromptResultCardProps) {
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isStableDiffusion = result.templateType === 'stable-diffusion' || 
                           result.templateName.toLowerCase().includes('stable diffusion');

  return (
    <Card className={`border-gray-800 bg-gray-900/30 hover:bg-gray-900/50 transition-colors ${className}`}>
      <CardContent className="p-4">
        {/* Header with template info and actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-950/50 text-blue-300 border-blue-800/30">
              Enhanced · {result.templateName}
            </Badge>
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(result.timestamp)}
            </div>
          </div>
          
          {showActions && (
            <PromptActions
              result={result}
              onRecall={onRecall}
              onSendToGenerator={onSendToGenerator}
              onSaveToLibrary={onSaveToLibrary}
              onShare={onShare}
            />
          )}
        </div>

        {/* Main Prompt Content */}
        <div className="space-y-3">
          {/* For Stable Diffusion, show Positive Prompt section */}
          {isStableDiffusion ? (
            <div className="space-y-3">
              {/* Positive Prompt */}
              <div className="relative rounded border border-green-800/30 bg-green-950/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-300">Positive Prompt</span>
                  </div>
                  <CopyButton size="xs" textToCopy={result.prompt} />
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {result.prompt}
                </div>
              </div>

              {/* Negative Prompt */}
              <div className="relative rounded border border-red-800/30 bg-red-950/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-300">Negative Prompt</span>
                  </div>
                  <CopyButton 
                    size="xs" 
                    textToCopy={result.negativePrompt || "No negative prompt generated"} 
                  />
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {result.negativePrompt || (
                    <span className="text-gray-500 italic">No negative prompt generated</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* For other templates, show standard prompt layout */
            <div className="relative rounded border border-gray-800 bg-gray-950/70 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Subject: {result.templateName}</span>
                <CopyButton size="xs" textToCopy={result.prompt} />
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {result.prompt}
              </div>
            </div>
          )}
        </div>

        {/* Diagnostics Section */}
        {showDiagnostics && result.diagnostics && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs text-gray-400 hover:text-gray-300 p-2 h-8"
              onClick={() => setDiagnosticsVisible(!diagnosticsVisible)}
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-400">⚙</span>
                <span>{result.templateName} Diagnostics</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Technical details about how this prompt was generated</span>
                {diagnosticsVisible ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </div>
            </Button>
            
            <DiagnosticsCard 
              diagnostics={result.diagnostics}
              visible={diagnosticsVisible}
              title={`${result.templateName} Diagnostics`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}