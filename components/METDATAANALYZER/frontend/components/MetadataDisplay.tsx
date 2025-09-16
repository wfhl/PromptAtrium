import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Copy, FileImage, Cpu, Palette, Camera, Info, ChevronDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShareToLibraryModal } from '@/components/ui/ShareToLibraryModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface MetadataDisplayProps {
  data: any;
  filename: string;
  filesize: number;
  onClear?: () => void;
}

export function MetadataDisplay({ data, filename, filesize, onClear }: MetadataDisplayProps) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for the Add to Library modal
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/prompt-categories'],
    select: (data: any[]) => {
      if (!data || !Array.isArray(data)) return [];
      return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description
      }));
    }
  });

  // Mutation for sharing to library
  const shareToLibraryMutation = useMutation({
    mutationFn: async (shareData: any) => {
      return apiRequest('/api/user-prompts', {
        method: 'POST',
        body: JSON.stringify(shareData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-prompts'] });
      setShareModalOpen(false);
      toast({
        title: "Added to Library",
        description: "Prompt has been added to your library successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to library",
        description: error?.message || "An error occurred while adding the prompt",
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: `${fieldName} copied successfully`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const buildPromptWithParameters = () => {
    if (!data.prompt) return '';
    
    let promptWithParams = data.prompt;
    
    // Add Midjourney parameters if available
    if (data.ai_generator_type === 'midjourney') {
      const params = [];
      if (data.mj_chaos) params.push(`--chaos ${data.mj_chaos}`);
      if (data.mj_aspect_ratio) params.push(`--ar ${data.mj_aspect_ratio}`);
      if (data.mj_experimental) params.push(`--exp ${data.mj_experimental}`);
      if (data.mj_raw) params.push(`--style raw`);
      if (data.mj_omni_reference) params.push(`--oref ${data.mj_omni_reference}`);
      if (data.mj_version) params.push(`--v ${data.mj_version}`);
      if (data.mj_quality) params.push(`--q ${data.mj_quality}`);
      if (data.mj_stylize) params.push(`--stylize ${data.mj_stylize}`);
      if (data.mj_weirdness) params.push(`--weird ${data.mj_weirdness}`);
      if (data.mj_style_weight) params.push(`--sw ${data.mj_style_weight}`);
      if (data.mj_image_weight) params.push(`--iw ${data.mj_image_weight}`);
      if (data.mj_character_weight) params.push(`--cw ${data.mj_character_weight}`);
      if (data.mj_omni_weight) params.push(`--ow ${data.mj_omni_weight}`);
      if (data.mj_character_reference) params.push(`--cref ${data.mj_character_reference}`);
      if (data.mj_style_references && Array.isArray(data.mj_style_references) && data.mj_style_references.length > 0) {
        params.push(`--sref ${data.mj_style_references.join(' ')}`);
      }
      
      if (params.length > 0) {
        promptWithParams += ' ' + params.join(' ');
      }
    }
    
    return promptWithParams;
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const renderBasicInfo = () => (
    <AccordionItem value="basic-info">
      <AccordionTrigger className="text-sm font-bold text-blue-600 dark:text-blue-400 py-2">
        <div className="flex items-center">
          <FileImage className="h-4 w-4 mr-2" />
          Basic Information
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-2">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-400">Filename:</span>
            <span className="text-gray-800 dark:text-gray-200 truncate ml-2">{filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600 dark:text-gray-400">File Size:</span>
            <span className="text-gray-800 dark:text-gray-200">{formatBytes(filesize)}</span>
          </div>
          {data.width && data.height && (
            <div className="flex justify-between col-span-2">
              <span className="font-medium text-gray-600 dark:text-gray-400">Dimensions:</span>
              <span className="text-gray-800 dark:text-gray-200">{data.width} × {data.height} px</span>
            </div>
          )}
          {data.analysis?.metadata?.basic?.format && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">Format:</span>
              <span className="text-gray-800 dark:text-gray-200">{data.analysis.metadata.basic.format}</span>
            </div>
          )}
          {data.analysis?.metadata?.basic?.aspectRatioFormatted && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">Aspect Ratio:</span>
              <span className="text-gray-800 dark:text-gray-200">{data.analysis.metadata.basic.aspectRatioFormatted}</span>
            </div>
          )}
          {data.analysis?.metadata?.basic?.colorSpace && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">Color Space:</span>
              <span className="text-gray-800 dark:text-gray-200">{data.analysis.metadata.basic.colorSpace}</span>
            </div>
          )}
          {data.analysis?.metadata?.basic?.channels && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">Channels:</span>
              <span className="text-gray-800 dark:text-gray-200">{data.analysis.metadata.basic.channels}</span>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  const renderAIMetadata = () => {
    if (!data.is_ai_generated) return null;

    const generator = data.ai_generator_type || 'unknown';
    
    return (
      <AccordionItem value="ai-metadata">
        <AccordionTrigger className="text-sm font-bold text-green-600 dark:text-green-400 py-2">
          <div className="flex items-center">
            <Cpu className="h-4 w-4 mr-2" />
            🤖 AI Generation ({generator === 'comfyui' ? 'ComfyUI' : generator.charAt(0).toUpperCase() + generator.slice(1)})
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-2">
          {/* Universal AI Fields */}
          {data.prompt && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Prompt:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-auto px-1"
                    >
                      {copiedField === 'Prompt' || copiedField === 'Prompt + Parameters' ? (
                        <Check className="h-3 w-3 text-green-600 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      <ChevronDown className="h-2 w-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(data.prompt, 'Prompt')}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Prompt Only
                    </DropdownMenuItem>
                    {data.ai_generator_type === 'midjourney' && (
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(buildPromptWithParameters(), 'Prompt + Parameters')}
                      >
                        <Copy className="h-3 w-3 mr-2" />
                        Prompt + Parameters
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <textarea
                readOnly
                value={data.prompt}
                className="w-full text-xs text-gray-800 dark:text-gray-200 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-1.5 rounded resize-y min-h-[4rem] md:min-h-[6rem] overflow-y-auto cursor-text"
              />
            </div>
          )}
          
          {data.negative_prompt && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Negative:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => copyToClipboard(data.negative_prompt, 'Negative Prompt')}
                >
                  {copiedField === 'Negative Prompt' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <textarea
                readOnly
                value={data.negative_prompt}
                className="w-full text-xs text-gray-800 dark:text-gray-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-1.5 rounded resize-y min-h-[2.5rem] overflow-y-auto cursor-text"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            {data.steps && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">Steps:</span>
                <span className="text-gray-800 dark:text-gray-200">{data.steps}</span>
              </div>
            )}
            
            {data.cfg_scale && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400">CFG:</span>
                <span className="text-gray-800 dark:text-gray-200">{data.cfg_scale}</span>
              </div>
            )}
            
            {(data.seed || data.seed_text) && (
              <div className="flex justify-between col-span-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">Seed:</span>
                <span className="text-gray-800 dark:text-gray-200 font-mono text-xs truncate ml-2">
                  {data.seed || data.seed_text}
                </span>
              </div>
            )}
            
            {data.sampler && (
              <div className="flex justify-between col-span-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">Sampler:</span>
                <span className="text-gray-800 dark:text-gray-200 truncate ml-2">{data.sampler}</span>
              </div>
            )}
            
            {data.scheduler && (
              <div className="flex justify-between col-span-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">Scheduler:</span>
                <span className="text-gray-800 dark:text-gray-200 truncate ml-2">{data.scheduler}</span>
              </div>
            )}
            
            {data.checkpoint_model_name && (
              <div className="flex justify-between col-span-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">Model:</span>
                <span className="text-gray-800 dark:text-gray-200 truncate ml-2">{data.checkpoint_model_name}</span>
              </div>
            )}
          </div>

          {/* Midjourney Specific Fields */}
          {generator === 'midjourney' && (
            <div className="border-t pt-1 mt-2">
              <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Midjourney Settings</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                {data.mj_version && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_version}</span>
                  </div>
                )}
                
                {data.mj_aspect_ratio && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Aspect Ratio:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_aspect_ratio}</span>
                  </div>
                )}
                
                {data.mj_chaos !== undefined && data.mj_chaos !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Chaos:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_chaos}</span>
                  </div>
                )}
                
                {data.mj_quality !== undefined && data.mj_quality !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Quality:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_quality}</span>
                  </div>
                )}
                
                {data.mj_experimental !== undefined && data.mj_experimental !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Experimental:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_experimental}</span>
                  </div>
                )}
                
                {data.mj_weirdness !== undefined && data.mj_weirdness !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Weirdness:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_weirdness}</span>
                  </div>
                )}
                
                {data.mj_style_weight !== undefined && data.mj_style_weight !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Style Weight:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_style_weight}</span>
                  </div>
                )}
                
                {data.mj_image_weight !== undefined && data.mj_image_weight !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Image Weight:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_image_weight}</span>
                  </div>
                )}
                
                {data.mj_character_weight !== undefined && data.mj_character_weight !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Character Weight:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_character_weight}</span>
                  </div>
                )}
                
                {data.mj_omni_weight !== undefined && data.mj_omni_weight !== null && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Omni Weight:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">{data.mj_omni_weight}</span>
                  </div>
                )}
                
                {data.mj_raw && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Raw Mode:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200">Yes</span>
                  </div>
                )}
                
                {data.mj_author && (
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">Author:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200 font-mono">{data.mj_author}</span>
                  </div>
                )}
                
                {data.mj_omni_reference && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">OmniReference:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200 text-xs break-all">{data.mj_omni_reference}</span>
                  </div>
                )}
                
                {data.mj_character_reference && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Character Ref:</span>
                    <span className="ml-1 text-gray-800 dark:text-gray-200 text-xs break-all">{data.mj_character_reference}</span>
                  </div>
                )}
                
                {data.mj_style_references && Array.isArray(data.mj_style_references) && data.mj_style_references.length > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Style References:</span>
                    <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
                      {data.mj_style_references.map((ref, index) => (
                        <div key={index} className="break-all">{ref}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Number with separate copy functionality */}
                {(data.mj_job_id || data.mjJobId) && (
                  <div className="col-span-2 border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Job ID:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(data.mj_job_id || data.mjJobId, 'Job ID')}
                      >
                        {copiedField === 'Job ID' ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <span className="text-xs text-gray-800 dark:text-gray-200 font-mono break-all">{data.mj_job_id || data.mjJobId}</span>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ComfyUI Specific Fields */}
          {generator === 'comfyui' && (
            <div className="border-t pt-1 mt-2">
              <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">ComfyUI Workflow</h4>
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {data.comfy_node_count && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Nodes:</span>
                      <span className="text-gray-800 dark:text-gray-200">{data.comfy_node_count}</span>
                    </div>
                  )}
                  
                  {data.comfy_node_count && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Complexity:</span>
                      <span className="text-gray-800 dark:text-gray-200">
                        {data.comfy_node_count < 20 ? 'Simple' : 
                         data.comfy_node_count < 50 ? 'Moderate' : 
                         data.comfy_node_count < 100 ? 'Complex' : 'Advanced'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Full ComfyUI Workflow JSON */}
                {data.comfy_workflow_data && (
                  <div className="mt-2 border-t pt-2">
                    <details className="group">
                      <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400 text-xs hover:text-orange-600 dark:hover:text-orange-400">
                        Full Workflow JSON
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-2 rounded border whitespace-pre-wrap break-words">
                          {JSON.stringify(data.comfy_workflow_data, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderExifData = () => {
    if (!data.analysis?.metadata?.exif || Object.keys(data.analysis.metadata.exif).length === 0) return null;

    return (
      <AccordionItem value="exif-data">
        <AccordionTrigger className="text-sm font-bold text-purple-600 dark:text-purple-400 py-2">
          <div className="flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            Camera Information (EXIF)
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-2">
          <div className="grid grid-cols-1 gap-1 text-xs">
            {Object.entries(data.analysis.metadata.exif).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="text-gray-800 dark:text-gray-200 truncate ml-2">
                  {typeof value === 'string' || typeof value === 'number' ? value.toString() : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  const renderRawMetadata = () => (
    <AccordionItem value="raw-metadata">
      <AccordionTrigger className="text-sm font-bold text-gray-600 dark:text-gray-400 py-2">
        <div className="flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Raw Metadata
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 ml-auto mr-2"
            onClick={() => copyToClipboard(JSON.stringify(data.complete_metadata || data, null, 2), 'Raw Metadata')}
          >
            {copiedField === 'Raw Metadata' ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="max-h-64 overflow-y-auto">
          <pre className="text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-3 rounded border whitespace-pre-wrap break-words">
            {JSON.stringify(data.complete_metadata || data, null, 2)}
          </pre>
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Accordion type="multiple" defaultValue={["basic-info", "ai-metadata", "raw-metadata"]} className="w-full">
        {renderBasicInfo()}
        {renderAIMetadata()}
        {renderExifData()}
        {renderRawMetadata()}
      </Accordion>

      {/* Add to Library Modal */}
      <ShareToLibraryModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        promptData={data.prompt ? {
          id: 0,
          name: filename.replace(/\.[^/.]+$/, ""), // Remove file extension
          positive_prompt: data.prompt,
          negative_prompt: data.negative_prompt || '',
          tags: []
        } : null}
        onShare={(shareData) => {
          shareToLibraryMutation.mutate({
            title: shareData.title,
            positive_prompt: data.prompt,
            negative_prompt: data.negative_prompt || '',
            tags: shareData.tags,
            category_id: shareData.category_id,
            source: 'metadata-analyzer'
          });
        }}
        categories={categories}
        isLoading={shareToLibraryMutation.isPending}
        mode="save-to-user"
      />
    </div>
  );
}