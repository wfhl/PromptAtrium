import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  FileImage, Upload, Download, RotateCcw, Share2, Plus, 
  Copy, Check, ChevronUp, ChevronDown, X, Cpu, FileSearch 
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MetadataExtractor } from "@/utils/metadata-extractor";
import { Badge } from "@/components/ui/badge";

export default function MetadataAnalyzerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    await analyzeImage(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    
    try {
      const extractedMetadata = await MetadataExtractor.extractFromFile(file);
      setMetadata(extractedMetadata);
      
      toast({
        title: "Analysis complete",
        description: extractedMetadata.isAIGenerated 
          ? `AI-generated image detected (${extractedMetadata.aiGenerator})`
          : "Image metadata extracted successfully"
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze image metadata",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReAnalyze = () => {
    if (selectedFile) {
      analyzeImage(selectedFile);
    }
  };

  const downloadMetadata = () => {
    if (!metadata) return;
    
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `metadata-${selectedFile?.name?.replace(/\.[^/.]+$/, "")}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied",
        description: `${fieldName} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const shareResults = async () => {
    if (!metadata) return;
    
    // Create a shareable URL with the metadata
    const shareableData = {
      image: selectedFile?.name,
      ...metadata
    };
    
    // For now, copy a summary to clipboard
    const shareText = `Image Metadata Analysis\n\nFile: ${selectedFile?.name}\n${
      metadata.isAIGenerated ? `AI Generator: ${metadata.aiGenerator}\n` : ''
    }${
      metadata.prompt ? `Prompt: ${metadata.prompt.substring(0, 100)}...\n` : ''
    }Dimensions: ${metadata.dimensionString}\nAspect Ratio: ${metadata.aspectRatio}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Share Ready",
        description: "Analysis summary copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Share failed",
        description: "Unable to prepare share data",
        variant: "destructive"
      });
    }
  };

  const addToLibrary = async () => {
    if (!metadata || !metadata.prompt) {
      toast({
        title: "Cannot add to library",
        description: "No AI prompt found in image metadata",
        variant: "destructive"
      });
      return;
    }
    
    // For now, show a success message
    // In the future, this would integrate with the prompts library
    toast({
      title: "Added to Library",
      description: `Prompt from ${selectedFile?.name} has been saved to your library`,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileSearch className="h-6 w-6" />
              Image Metadata Analyzer
            </CardTitle>
            <CardDescription>
              Upload images to extract comprehensive metadata and image information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedFile ? (
              // Upload Section
              <Card className="border-2 border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Image
                  </CardTitle>
                  <CardDescription>
                    Drag and drop an image file or click to browse. Supports all major image formats.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <FileImage className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drop your image here or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="file-upload"
                      data-testid="input-file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Image
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Analysis Actions - moved to top */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleReAnalyze}
                        disabled={isAnalyzing}
                        data-testid="button-reanalyze"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Re-analyze
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadMetadata}
                        disabled={!metadata}
                        data-testid="button-download-json"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={shareResults}
                        disabled={!metadata}
                        data-testid="button-share"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Results
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={addToLibrary}
                        disabled={!metadata || !metadata.isAIGenerated}
                        data-testid="button-add-library"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Library
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleReset}
                        data-testid="button-analyze-new"
                      >
                        <FileSearch className="h-4 w-4 mr-2" />
                        Analyze New Image
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Image and Metadata side-by-side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left side - Uploaded Image */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Uploaded Image
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Image Preview */}
                        <div className="relative group">
                          <img 
                            src={imagePreview || ''} 
                            alt="Preview" 
                            className="w-full h-auto max-h-96 object-contain rounded-lg border bg-muted/20"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleReset}
                            data-testid="button-remove-image"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* File Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm truncate flex-1 mr-2">
                              {selectedFile.name}
                            </h4>
                            {metadata?.isAIGenerated && (
                              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                                🤖 AI Generated
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            File Size: <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Format: <span className="font-medium">{selectedFile.type}</span>
                          </p>
                          {metadata && (
                            <>
                              <p className="text-sm text-muted-foreground">
                                Dimensions: <span className="font-medium">{metadata.dimensionString}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Aspect Ratio: <span className="font-medium">{metadata.aspectRatio}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right side - Metadata Results */}
                  {metadata && (
                    <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Metadata Results</CardTitle>
                        {metadata.isAIGenerated && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            🤖 AI Generated
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Comprehensive metadata analysis for {selectedFile.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" defaultValue={["basic", "ai"]} className="w-full">
                        {/* Basic Information */}
                        <AccordionItem value="basic">
                          <AccordionTrigger className="text-sm font-semibold text-blue-600">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4" />
                              Basic Information
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Filename:</span>
                                <span className="font-mono text-xs">{metadata.fileName}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">File Size:</span>
                                <span>{formatFileSize(metadata.fileSize)}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Dimensions:</span>
                                <span>{metadata.dimensionString} px</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Aspect Ratio:</span>
                                <span>{metadata.aspectRatio}</span>
                              </div>
                              <div className="flex justify-between py-1 col-span-2">
                                <span className="text-muted-foreground">Format:</span>
                                <span>{metadata.fileType}</span>
                              </div>
                              <div className="flex justify-between py-1 col-span-2">
                                <span className="text-muted-foreground">Last Modified:</span>
                                <span className="text-xs">{metadata.lastModified}</span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        {/* AI Generation Information */}
                        {metadata.isAIGenerated && (
                          <AccordionItem value="ai">
                            <AccordionTrigger className="text-sm font-semibold text-green-600">
                              <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4" />
                                🤖 AI Generation ({metadata.aiGenerator === 'stable-diffusion' ? 'Stable Diffusion' : 
                                  metadata.aiGenerator === 'midjourney' ? 'Midjourney' : 
                                  metadata.aiGenerator === 'comfyui' ? 'ComfyUI' : 
                                  metadata.aiGenerator === 'dall-e' ? 'DALL-E' :
                                  metadata.aiGenerator})
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3">
                              {metadata.prompt && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">Prompt:</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2"
                                      onClick={() => copyToClipboard(metadata.prompt, 'Prompt')}
                                    >
                                      {copiedField === 'Prompt' ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                                    <p className="text-sm whitespace-pre-wrap">{metadata.prompt}</p>
                                  </div>
                                </div>
                              )}

                              {metadata.negativePrompt && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium">Negative:</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2"
                                      onClick={() => copyToClipboard(metadata.negativePrompt, 'Negative Prompt')}
                                    >
                                      {copiedField === 'Negative Prompt' ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                                    <p className="text-sm whitespace-pre-wrap">{metadata.negativePrompt}</p>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {metadata.steps && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Steps:</span>
                                    <span>{metadata.steps}</span>
                                  </div>
                                )}
                                {metadata.cfgScale && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">CFG:</span>
                                    <span>{metadata.cfgScale}</span>
                                  </div>
                                )}
                                {metadata.seed && (
                                  <div className="flex justify-between py-1 col-span-2">
                                    <span className="text-muted-foreground">Seed:</span>
                                    <span className="font-mono text-xs">{metadata.seed}</span>
                                  </div>
                                )}
                                {metadata.sampler && (
                                  <div className="flex justify-between py-1 col-span-2">
                                    <span className="text-muted-foreground">Sampler:</span>
                                    <span>{metadata.sampler}</span>
                                  </div>
                                )}
                                {metadata.model && (
                                  <div className="flex justify-between py-1 col-span-2">
                                    <span className="text-muted-foreground">Model:</span>
                                    <span className="text-xs truncate">{metadata.model}</span>
                                  </div>
                                )}
                                
                                {/* Midjourney specific */}
                                {metadata.mjVersion && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Version:</span>
                                    <span>{metadata.mjVersion}</span>
                                  </div>
                                )}
                                {metadata.mjAspectRatio && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Aspect Ratio:</span>
                                    <span>{metadata.mjAspectRatio}</span>
                                  </div>
                                )}
                                {metadata.mjChaos && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Chaos:</span>
                                    <span>{metadata.mjChaos}</span>
                                  </div>
                                )}
                                {metadata.mjQuality && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Quality:</span>
                                    <span>{metadata.mjQuality}</span>
                                  </div>
                                )}
                                {metadata.mjWeirdness && (
                                  <div className="flex justify-between py-1">
                                    <span className="text-muted-foreground">Weirdness:</span>
                                    <span>{metadata.mjWeirdness}</span>
                                  </div>
                                )}
                                {metadata.mjJobId && (
                                  <div className="flex justify-between py-1 col-span-2">
                                    <span className="text-muted-foreground">Job ID:</span>
                                    <span className="font-mono text-xs">{metadata.mjJobId}</span>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Raw Metadata */}
                        <AccordionItem value="raw">
                          <AccordionTrigger className="text-sm font-semibold">
                            Raw Metadata
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-muted rounded-md p-3 max-h-64 overflow-auto">
                              <pre className="text-xs">
                                {JSON.stringify(metadata.rawMetadata || metadata, null, 2)}
                              </pre>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* What can this analyzer detect? */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What can this analyzer detect?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">🤖 AI Generation</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Stable Diffusion parameters</li>
                      <li>• ComfyUI workflows</li>
                      <li>• Midjourney settings</li>
                      <li>• DALL-E metadata</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-600">📋 Technical Details</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Image dimensions & format</li>
                      <li>• Color space & depth</li>
                      <li>• Compression settings</li>
                      <li>• File size analysis</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-purple-600">📷 Camera Data</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• EXIF camera settings</li>
                      <li>• Shooting parameters</li>
                      <li>• GPS location data</li>
                      <li>• Timestamp information</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}