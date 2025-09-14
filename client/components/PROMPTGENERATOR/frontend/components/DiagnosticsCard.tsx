import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Database, Server, Info } from "lucide-react";

interface DiagnosticsCardProps {
  diagnostics?: {
    apiProvider?: string;
    modelUsed?: string;
    fallbackUsed?: boolean;
    templateSource?: 'database' | 'fallback' | 'emergency_fallback';
    templateId?: number | string;
    responseTime?: number;
    timestamp?: string;
    dbConnectionStatus?: 'connected' | 'failed' | 'unknown';
    llmParams?: {
      provider: string;
      model: string;
      useHappyTalk: boolean;
      compressPrompt: boolean;
      compressionLevel: number;
      masterPromptLength?: number;
      tokenCount?: number;
    };
    errors?: Array<{
      type: string;
      message: string;
      handledBy: string;
    }>;
  };
  visible: boolean;
  title?: string;
}

export function DiagnosticsCard({ diagnostics, visible, title = "Prompt Generation Diagnostics" }: DiagnosticsCardProps) {
  if (!visible || !diagnostics) return null;

  return (
    <Card className="bg-gray-900/60 border border-gray-800 overflow-hidden mt-3">
      <CardContent className="p-3">
        <div className="text-xs text-gray-400 mb-2 flex items-center">
          <Info className="h-3 w-3 mr-1" />
          <span>{title}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {/* LLM Provider */}
          {diagnostics.llmParams?.provider && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">LLM Provider:</span>
              <Badge variant="outline" className="font-mono text-primary-400 bg-primary-950/30">
                {diagnostics.llmParams.provider}
              </Badge>
            </div>
          )}
          
          {/* Model */}
          {diagnostics.llmParams?.model && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Model:</span>
              <Badge variant="outline" className="font-mono text-primary-400 bg-primary-950/30">
                {diagnostics.llmParams.model}
              </Badge>
            </div>
          )}
          
          {/* Happy Talk */}
          {diagnostics.llmParams?.useHappyTalk !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Happy Talk:</span>
              <Badge variant="outline" className={
                diagnostics.llmParams.useHappyTalk 
                  ? "font-mono text-green-400 bg-green-950/30" 
                  : "font-mono text-gray-400 bg-gray-900"
              }>
                {diagnostics.llmParams.useHappyTalk ? "ON" : "OFF"}
              </Badge>
            </div>
          )}
          
          {/* Compress Prompt */}
          {diagnostics.llmParams?.compressPrompt !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Compress Prompt:</span>
              <Badge variant="outline" className={
                diagnostics.llmParams.compressPrompt 
                  ? "font-mono text-amber-400 bg-amber-950/30" 
                  : "font-mono text-gray-400 bg-gray-900"
              }>
                {diagnostics.llmParams.compressPrompt 
                  ? `L${diagnostics.llmParams.compressionLevel}` 
                  : "OFF"}
              </Badge>
            </div>
          )}
          
          {/* Master Prompt Length */}
          {diagnostics.llmParams?.masterPromptLength !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Master Prompt:</span>
              <Badge variant="outline" className="font-mono text-blue-400 bg-blue-950/30">
                {diagnostics.llmParams.masterPromptLength} chars
              </Badge>
            </div>
          )}
          
          {/* Template Source */}
          {diagnostics.templateSource && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Template Source:</span>
              <Badge variant="outline" className={
                diagnostics.templateSource === 'database'
                  ? "font-mono text-green-400 bg-green-950/30"
                  : diagnostics.templateSource === 'fallback'
                    ? "font-mono text-amber-400 bg-amber-950/30"
                    : "font-mono text-red-400 bg-red-950/30"
              }>
                {diagnostics.templateSource === 'database'
                  ? `DB${diagnostics.templateId ? ` #${diagnostics.templateId}` : ''}`
                  : diagnostics.templateSource === 'fallback'
                    ? "Fallback"
                    : "Emerg. Fallback"}
              </Badge>
            </div>
          )}
          
          {/* Timestamp */}
          {diagnostics.timestamp && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Timestamp:</span>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-gray-500" />
                <span className="font-mono text-gray-400">
                  {new Date(diagnostics.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
          
          {/* DB Status */}
          {diagnostics.dbConnectionStatus && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">DB Status:</span>
              <div className="flex items-center">
                <Database className={`h-3 w-3 mr-1 ${
                  diagnostics.dbConnectionStatus === 'connected'
                    ? 'text-green-500'
                    : diagnostics.dbConnectionStatus === 'failed'
                      ? 'text-red-500'
                      : 'text-gray-500'
                }`} />
                <span className={`font-mono ${
                  diagnostics.dbConnectionStatus === 'connected'
                    ? 'text-green-400'
                    : diagnostics.dbConnectionStatus === 'failed'
                      ? 'text-red-400'
                      : 'text-gray-400'
                }`}>
                  {diagnostics.dbConnectionStatus === 'connected'
                    ? "Connected"
                    : diagnostics.dbConnectionStatus === 'failed'
                      ? "Failed"
                      : "Unknown"}
                </span>
              </div>
            </div>
          )}
          
          {/* Fallback Used */}
          {diagnostics.fallbackUsed !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Fallback Used:</span>
              <div className="flex items-center">
                {diagnostics.fallbackUsed ? (
                  <XCircle className="h-3 w-3 mr-1 text-amber-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                )}
                <span className={`font-mono ${
                  diagnostics.fallbackUsed ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {diagnostics.fallbackUsed ? "Yes" : "No"}
                </span>
              </div>
            </div>
          )}
          
          {/* Response Time */}
          {diagnostics.responseTime !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Response Time:</span>
              <Badge variant="outline" className="font-mono text-primary-400 bg-primary-950/30">
                {diagnostics.responseTime.toFixed(0)}ms
              </Badge>
            </div>
          )}
        </div>
        
        {/* Errors section */}
        {diagnostics.errors && diagnostics.errors.length > 0 && (
          <>
            <Separator className="my-2 bg-gray-800" />
            <div className="text-xs text-red-400">
              <div className="mb-1">Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {diagnostics.errors.map((error, idx) => (
                  <li key={idx} className="text-xs opacity-80">
                    {error.type}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}