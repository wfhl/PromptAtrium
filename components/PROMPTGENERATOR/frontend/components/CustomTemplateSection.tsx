import React, { useState } from 'react';
import { Loader2, Wand2, Info as InfoIcon, Edit, BrainCircuit, Clock, Database, Server, User, MinusCircle, PlusCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CopyButton from "@/components/CopyButton";

interface CustomTemplateSectionProps {
  templateId: string;
  templateName: string;
  description: string;
  isEnhancing: boolean; // General loading state (backwards compatibility)
  isLoading?: boolean; // Specific loading state for this template
  isCurrentTab: boolean;
  generatedContent: string | undefined;
  originalPrompt: string | undefined;
  llmProvider: string;
  llmModel: string;
  templateData: any;
  isAdminMode?: boolean;
  onGenerate: () => void;
  onEditTemplate?: (templateData: any) => void;
  onSave?: (templateId: string, templateData: any) => void; // Added onSave prop
  colors: {
    border: string;
    bg: string;
    text: string;
    buttonFrom: string;
    buttonTo: string;
  };
  // Diagnostics data
  promptDiagnostics?: {
    provider?: string;
    model?: string;
    useHappyTalk?: boolean;
    compressPrompt?: boolean;
    templateSource?: string;
    timestamp?: string;
    dbConnectionStatus?: 'connected' | 'failed' | 'unknown';
    responseTime?: number;
    fallbackUsed?: boolean;
    masterPromptLength?: number;
    compressionLevel?: number;
    errors?: Array<{message: string; handledBy: string}>;
  };
}

/**
 * A reusable component for template sections in the Prompt Generator
 * This component handles the three states of a template tab:
 * 1. Loading (when isEnhancing is true and isCurrentTab is true)
 * 2. Generated content (when generatedContent is available)
 * 3. Initial state with button (when generatedContent is not available)
 */
export function CustomTemplateSection({
  templateId,
  templateName,
  description,
  isEnhancing,
  isLoading,
  isCurrentTab,
  generatedContent,
  originalPrompt,
  llmProvider,
  llmModel,
  templateData,
  isAdminMode = false,
  onGenerate,
  onEditTemplate,
  onSave,
  colors,
  promptDiagnostics,
  }: CustomTemplateSectionProps) {

   const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
   
  // Determine loading state - use specific isLoading if provided, otherwise fall back to isEnhancing
  const isTemplateLoading = isLoading !== undefined
    ? isLoading
    : (isEnhancing && isCurrentTab);
  // LOADING STATE
  if (isTemplateLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center py-12 border border-${colors.border}-800 rounded-md bg-${colors.border}-950/20`}
      >
        <Loader2
          className={`h-8 w-8 animate-spin text-${colors.text}-400 mb-4`}
        />
        <p className={`text-${colors.text}-200`}>
          Generating {templateName.toLowerCase()} output...
        </p>
        <p className={`text-sm text-${colors.text}-300/70 mt-2`}>
          Using {llmProvider} {llmModel} to create {templateName} format
        </p>
        <p className={`text-xs text-${colors.text}-300/60 mt-4`}>
          This may take a few seconds as the AI is structuring your prompt into{" "}
          {templateName.toLowerCase()} format...
        </p>
      </div>
    );
  }

  // COMBINED VIEW - Always show info card and button if original prompt exists
  return (
    <div className="space-y-4">
      {originalPrompt ? (
        <>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            {/* Info block about template format */}
            <div
              className={`p-3 border border-${colors.border}-900 rounded-md bg-${colors.border}-950/20 max-w-md w-full`}
            >
              <h4
                className={`text-sm font-medium flex items-center text-${colors.text}-200`}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 mr-2 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {templateName}
              </h4>
              <p className={`text-xs mt-1 text-${colors.text}-300/80`}>
                {description}
              </p>
            </div>

            {/* Button styled with gradient based on template type */}
            <Button
              className={`
                ${
                  templateId.startsWith("custom") || templateId === "wildcard"
                    ? "bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800"
                    : `bg-gradient-to-r from-${colors.buttonFrom}-500 to-${colors.buttonTo}-700 hover:from-${colors.buttonFrom}-600 hover:to-${colors.buttonTo}-800`
                }
                text-white w-full max-w-md font-medium shadow-lg hover:shadow-xl transition-all
              `}
              size="lg"
              onClick={() => {
                setHasGenerated(true); // Mark that the user triggered generation
                onGenerate(); // Run the original generation logic
              }}
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Generate {templateName} Format
            </Button>
          </div>
         
          {/* Show enhanced result only if it's different from originalPrompt */}
            {hasGenerated &&
              generatedContent &&
              generatedContent.trim().replace(/\s+/g, ' ') !== originalPrompt?.trim().replace(/\s+/g, ' ') && (
                // ✅ Put your generated content + diagnostics + regenerate button here
             

            <div className="space-y-4 mt-4">
              <div className="relative">
                <div
                  className={`rounded-md border border-${colors.border}-900 bg-${colors.border}-950/20 p-4 text-sm text-gray-100`}
                >
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {generatedContent}
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <CopyButton textToCopy={generatedContent || ""} />
                </div>
              </div>
              {/* 🔽 Insert here before {isAdminMode && (...)} */}
              {generatedContent && (
                <>
                  {/* Diagnostics Panel with Accordion */}
                  <div className="mt-4">
                    <Accordion type="single" collapsible className={`border border-${colors.border}-900 bg-${colors.border}-950/10 rounded-md`}>
                      <AccordionItem value="diagnostics" className="border-none">
                        <AccordionTrigger className="px-4 py-3 text-sm font-semibold">
                          <div className="flex items-center">
                            <BrainCircuit className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-gray-300">{templateName} Diagnostics</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <Card className="bg-black/20 border-gray-800">
                            <CardHeader className="py-2 px-4">
                              <CardTitle className="text-xs text-gray-300">Generation Details</CardTitle>
                            </CardHeader>
                            <CardContent className="py-2 px-4">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="flex items-start gap-2">
                                  <Server className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-gray-400">Provider:</p>
                                    <p className="text-white">{promptDiagnostics?.provider || llmProvider}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <BrainCircuit className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-gray-400">Model:</p>
                                    <p className="text-white">{promptDiagnostics?.model || llmModel}</p>
                                  </div>
                                </div>
                                {promptDiagnostics?.templateSource && (
                                  <div className="flex items-start gap-2">
                                    <Database className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-gray-400">Template Source:</p>
                                      <p className="text-white">{promptDiagnostics.templateSource}</p>
                                    </div>
                                  </div>
                                )}
                                {promptDiagnostics?.timestamp && (
                                  <div className="flex items-start gap-2">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-gray-400">Timestamp:</p>
                                      <p className="text-white">{promptDiagnostics.timestamp}</p>
                                    </div>
                                  </div>
                                )}
                                {promptDiagnostics?.responseTime !== undefined && (
                                  <div className="flex items-start gap-2">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-gray-400">Response Time:</p>
                                      <p className="text-white">{promptDiagnostics.responseTime}ms</p>
                                    </div>
                                  </div>
                                )}
                                {promptDiagnostics?.dbConnectionStatus && (
                                  <div className="flex items-start gap-2">
                                    <Database className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-gray-400">DB Status:</p>
                                      <p className={`${
                                        promptDiagnostics.dbConnectionStatus === 'connected' ? 'text-green-400' : 
                                        promptDiagnostics.dbConnectionStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'
                                      }`}>
                                        {promptDiagnostics.dbConnectionStatus.charAt(0).toUpperCase() + promptDiagnostics.dbConnectionStatus.slice(1)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-start gap-2">
                                  <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-gray-400">Happy Talk:</p>
                                    <p className="text-white">{promptDiagnostics?.useHappyTalk || templateData?.useHappyTalk ? 'Yes' : 'No'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MinusCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-gray-400">Compression:</p>
                                    <p className="text-white">{promptDiagnostics?.compressPrompt || templateData?.compressPrompt ? 'Yes' : 'No'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <PlusCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-gray-400">Master Prompt Length:</p>
                                    <p className="text-white">{promptDiagnostics?.masterPromptLength || templateData?.masterPrompt?.length || 0} chars</p>
                                  </div>
                                </div>
                                {promptDiagnostics?.fallbackUsed !== undefined && (
                                  <div className="flex items-start gap-2">
                                    <Server className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-gray-400">Fallback Used:</p>
                                      <p className={`${promptDiagnostics.fallbackUsed ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {promptDiagnostics.fallbackUsed ? 'Yes' : 'No'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Error Messages Section */}
                              {promptDiagnostics?.errors && promptDiagnostics.errors.length > 0 && (
                                <div className="mt-4 border-t border-gray-800 pt-3">
                                  <p className="text-xs font-semibold text-red-400 mb-2">Errors:</p>
                                  <div className="space-y-2">
                                    {promptDiagnostics.errors.map((error, idx) => (
                                      <div key={idx} className="bg-red-900/20 border border-red-900/50 text-2xs rounded p-2">
                                        <p className="text-red-200">{error.message}</p>
                                        <p className="text-red-400/80 text-2xs mt-1">Handled by: {error.handledBy}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Regenerate Button */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={onGenerate}
                      className={`
                        ${templateId.startsWith('custom') || templateId === 'wildcard' 
                          ? "bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800" 
                          : `bg-gradient-to-r from-${colors.buttonFrom}-500 to-${colors.buttonTo}-700 hover:from-${colors.buttonFrom}-600 hover:to-${colors.buttonTo}-800`
                        }
                        text-white font-medium shadow-sm hover:shadow-md transition-all
                      `}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Regenerate {templateName}
                    </Button>
                  </div>
                </>
              )}

              {isAdminMode && (
                <div className="border-t border-gray-800 mt-4 pt-4">
                  <h5
                    className={`text-xs font-medium text-${colors.text}-300 mb-2`}
                  >
                    Template Settings (Admin)
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2">
                      <span className="text-gray-400">Master Prompt:</span>
                      <div className="mt-1 text-gray-300 text-opacity-70 bg-gray-900/30 p-2 rounded-sm text-xs max-h-24 overflow-y-auto">
                        {templateData?.masterPrompt || "No master prompt set"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 mt-2">
                    {onEditTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onEditTemplate({
                            id: templateId,
                            name: templateName,
                            type: templateId,
                            rules: "",
                            masterPrompt: templateData?.masterPrompt || "",
                            formatTemplate: templateData?.formatTemplate || "",
                            usageRules: templateData?.usageRules || "",
                          })
                        }
                        className="text-xs h-7 w-full"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Template
                      </Button>
                    )}
                    
                    {onSave && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => 
                          onSave(templateId, {
                            id: templateId,
                            name: templateName,
                            type: templateId,
                            masterPrompt: templateData?.masterPrompt || "",
                            formatTemplate: templateData?.formatTemplate || "",
                            usageRules: templateData?.usageRules || "",
                            llmProvider: llmProvider,
                            llmModel: llmModel,
                            useHappyTalk: templateData?.useHappyTalk || false,
                            compressPrompt: templateData?.compressPrompt || false,
                            compressionLevel: templateData?.compressionLevel || 5
                          })
                        }
                        className="text-xs h-7 w-full bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border-blue-800"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save to Database
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">
            Generate a prompt first to use {templateName.toLowerCase()} format
          </p>
        </div>
      )}
    </div>
  );
}
