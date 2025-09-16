import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { AlertCircle, ExternalLink, ChevronDown, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { NEGATIVE_PROMPT_PRESETS } from '@/data/fluxPromptData';

// Types for our model data
type ModelListItem = {
  id: number;
  name: string;
};

type ModelDetail = {
  id: number;
  name: string;
  type: string;
  sampler: string;
  steps: string;
  cfg_scale: string;
  recommended_vae: string;
  negative_prompts: string;
  prompting_suggestions: string;
  civitai_page: string;
  resources: string;
};

// Form values type
type ModelInfoFormValues = {
  negativePrompt: string;
}

export function ModelInfo() {
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  // Create a local form instance for this component
  const form = useForm<ModelInfoFormValues>({
    defaultValues: {
      negativePrompt: NEGATIVE_PROMPT_PRESETS[0].prompt // Default to first preset
    }
  });

  // Fetch model list for dropdown
  const { data: models, error: modelsError, isLoading: modelsLoading } = useQuery<ModelListItem[]>({
    queryKey: ['/api/models'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch selected model details
  const { data: modelDetails, error: detailsError, isLoading: detailsLoading } = useQuery<ModelDetail>({
    queryKey: [`/api/models/${selectedModelId}`],
    enabled: !!selectedModelId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Debug logging
  React.useEffect(() => {
    if (selectedModelId) {
      console.log('Selected model ID:', selectedModelId);
    }
    if (modelDetails) {
      console.log('Model details received:', modelDetails);
    }
    if (detailsError) {
      console.error('Error fetching model details:', detailsError);
    }
  }, [selectedModelId, modelDetails, detailsError]);

  const handleModelChange = (value: string) => {
    setSelectedModelId(value);
  };

  const openCivitaiPage = () => {
    if (modelDetails?.civitai_page) {
      window.open(modelDetails.civitai_page, '_blank');
    }
  };
  
  // Helper function to load negative prompt presets
  const loadNegativePreset = (presetId: string) => {
    const preset = NEGATIVE_PROMPT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    form.setValue("negativePrompt", preset.prompt);
  };

  // Function to render model property with label
  const renderProperty = (label: string, value: string | undefined, className: string = "") => {
    if (!value) return null;
    return (
      <div className={cn("mb-2", className)}>
        <span className="text-gray-400 font-medium">{label}:</span>{' '}
        <span className="text-white">{value}</span>
      </div>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="border-gray-800 bg-gray-950/50 shadow-md">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-900/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white">
                  Model Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Suggested Reference settings for your selected checkpoint model
                </CardDescription>
              </div>
              {isOpen ? 
                <ChevronDown className="h-5 w-5 text-gray-500" /> : 
                <ChevronRight className="h-5 w-5 text-gray-500" />
              }
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {modelsError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load models. Please try again later.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Negative Prompt Field - Moved from Advanced Options */}
                <Form {...form}>
                  <div className="mb-6">
                    <FormField
                      control={form.control}
                      name="negativePrompt"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center text-red-400">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Negative Prompt
                            </FormLabel>
                            <Select 
                              onValueChange={loadNegativePreset}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Load preset" />
                              </SelectTrigger>
                              <SelectContent>
                                {NEGATIVE_PROMPT_PRESETS?.map((preset) => (
                                  <SelectItem key={preset.id} value={preset.id}>
                                    {preset.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder="Enter negative prompt elements to exclude from generation"
                              className="bg-gray-900/50 border-gray-800 min-h-[100px] scrollbar-minimal resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Used to exclude unwanted elements from the generated image (Stable Diffusion)
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
                
                <div className="mb-6">
                  <Label htmlFor="model-select">Model / Checkpoint</Label>
                  <Select 
                    value={selectedModelId} 
                    onValueChange={handleModelChange}
                    disabled={modelsLoading}
                  >
                    <SelectTrigger id="model-select" className="w-full">
                      <SelectValue placeholder={modelsLoading ? "Loading models..." : "Select Model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {models?.map((model) => (
                        <SelectItem key={model.id} value={model.id.toString()}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {detailsLoading ? (
                  <div className="text-center py-4 text-gray-400">Loading model details...</div>
                ) : detailsError ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Failed to load model details. Please try again later.
                    </AlertDescription>
                  </Alert>
                ) : modelDetails ? (
                  <div className="bg-gray-900/70 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                      {renderProperty("Type", modelDetails.type)}
                      {renderProperty("Sampler", modelDetails.sampler)}
                      {renderProperty("Steps", modelDetails.steps)}
                      {renderProperty("CFG Scale", modelDetails.cfg_scale)}
                      {renderProperty("Recommended VAE", modelDetails.recommended_vae)}
                    </div>
                    
                    <Separator className="my-3 bg-gray-800/60" />
                    
                    {renderProperty("Negative Prompts", modelDetails.negative_prompts, "text-sm")}
                    {renderProperty("Prompting Suggestions", modelDetails.prompting_suggestions, "text-sm")}
                    
                    {modelDetails.civitai_page && (
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-blue-400 border-blue-900/70 hover:bg-blue-950/30"
                          onClick={openCivitaiPage}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Civitai
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">Select a model to view details</div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default ModelInfo;