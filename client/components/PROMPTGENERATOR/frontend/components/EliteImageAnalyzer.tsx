import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  Image as ImageIcon,
  Link,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Camera,
  Sparkles,
  Palette,
  Info,
  CopyCheck,
  Layers,
  BrainCircuit,
  Plus,
  Code,
  Database,
  Minus
} from "lucide-react";
import CopyButton from "@/components/CopyButton";
import ImageMetadataDisplay from "./ImageMetadataDisplay";
import { AIGenerationMetadata } from "@/types/image";

// Types
interface ImageAnalysisResult {
  id: string;
  timestamp: string;
  imageUrl?: string;
  imagePath?: string;
  analysis: {
    description: string;
    suggestedPrompt?: string;
    detectedElements?: string[];
    dominantColors?: string[];
    compositionNotes?: string;
    styleClassification?: string[];
    technicalDetails?: {
      estimatedResolution?: string;
      aspectRatio?: string;
      quality?: string;
    };
  };
  metadata?: Record<string, any>;
  error?: string;
}

interface AnalysisOptions {
  generatePrompt: boolean;
  detectElements: boolean;
  analyzeComposition: boolean;
  extractColors: boolean;
  classifyStyle: boolean;
  includeTechnicalDetails: boolean;
  florenceDetailedCaption?: boolean;
  qwenModel?: 'qwen-vl-3b' | 'qwen-vl-32b';
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  generatePrompt: true,
  detectElements: true,
  analyzeComposition: true,
  extractColors: true,
  classifyStyle: true,
  includeTechnicalDetails: true,
  florenceDetailedCaption: true, // Default to detailed captions for Florence-2
  qwenModel: 'qwen-vl-3b' // Default to 3B model for Qwen
};

export default function EliteImageAnalyzer() {
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>(DEFAULT_OPTIONS);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [resultTab, setResultTab] = useState("analysis");
  const [isDiagnosticsExpanded, setIsDiagnosticsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt4-vision");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Reset previous analysis result but keep metadata display structure
    if (selectedFile) {
      // Create a preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      setImageUrl("");
      
      try {
        // Extract preliminary metadata and create initial result
        const formData = new FormData();
        formData.append("image", selectedFile);
        formData.append("metadataOnly", "true");
        
        console.log("Extracting metadata from file...");
        // First try to get metadata extraction from the server
        try {
          // Request only metadata extraction without full analysis
          const response = await axios.post<ImageAnalysisResult>("/api/image-metadata/extract-metadata", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          
          console.log("Metadata extracted:", response.data);
          setAnalysisResult(response.data);
        } catch (error) {
          console.warn("Server metadata extraction failed, using basic client-side extraction:", error);
          
          // Fallback to basic client-side metadata
          // Create image reader to get dimensions
          const img = document.createElement('img');
          img.onload = () => {
            // Create initial basic metadata
            const initialMetadata: ImageAnalysisResult = {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              imagePath: selectedFile.name,
              analysis: {
                description: ""
              },
              metadata: {
                imageGeneration: {
                  width: img.width,
                  height: img.height,
                  format: selectedFile.type.split('/')[1]?.toUpperCase() || 'UNKNOWN',
                  source: 'unknown',
                  steps: undefined,
                  cfgScale: undefined,
                  sampler: undefined,
                  seed: undefined
                }
              }
            };
            
            // Set initial analysis result with basic file metadata
            setAnalysisResult(initialMetadata);
          };
          img.src = objectUrl;
        }
      } catch (error) {
        console.error("Error in metadata extraction:", error);
        toast({
          title: "Metadata Extraction Failed",
          description: "Could not extract metadata from image file",
          variant: "destructive",
        });
      }
    } else {
      setPreviewUrl("");
      setAnalysisResult(null);
    }
  };

  // Handle URL input
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setImageUrl(url);
    setFile(null);
    setPreviewUrl("");
    
    // Only create initial metadata if URL is valid
    if (url && url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      // Create image object to get dimensions
      const img = document.createElement('img');
      img.onload = () => {
        // Create initial basic metadata
        const initialMetadata: ImageAnalysisResult = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          imageUrl: url,
          analysis: {
            description: ""
          },
          metadata: {
            imageGeneration: {
              width: img.width,
              height: img.height,
              format: url.split('.').pop()?.split('?')[0]?.toUpperCase() || 'UNKNOWN',
              source: 'unknown',
              steps: undefined,
              cfgScale: undefined,
              sampler: undefined,
              seed: undefined
            }
          }
        };
        
        // Set initial analysis result with basic URL metadata
        setAnalysisResult(initialMetadata);
      };
      img.onerror = () => {
        setAnalysisResult(null);
      };
      img.src = url;
    } else {
      setAnalysisResult(null);
    }
  };

  // Toggle individual analysis options
  const toggleOption = (option: keyof AnalysisOptions) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Reset all options to default
  const resetOptions = () => {
    setAnalysisOptions(DEFAULT_OPTIONS);
  };

  // Start analysis process - useCallback to ensure stable reference
  const startAnalysis = React.useCallback(async () => {
    console.log("Starting image analysis...");
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setIsDiagnosticsExpanded(false); // Start with diagnostics panel collapsed
    
    try {
      let response;
      
      if (file) {
        // File upload analysis
        const formData = new FormData();
        formData.append("image", file);
        
        // Add options to the form data
        Object.entries(analysisOptions).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        
        // Add selected model
        formData.append("model", selectedModel);
        
        console.log(`Uploading file for analysis using ${selectedModel} model...`);
        response = await axios.post<ImageAnalysisResult>("/api/image-analysis/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else if (imageUrl) {
        // URL analysis
        console.log(`Analyzing image from URL using ${selectedModel} model:`, imageUrl);
        response = await axios.post<ImageAnalysisResult>("/api/image-analysis/url", {
          imageUrl,
          model: selectedModel,
          ...analysisOptions,
        });
      } else {
        throw new Error("Please provide an image file or URL");
      }
      
      console.log("Analysis complete, setting results");
      setAnalysisResult(response.data);
      setResultTab("analysis");
      toast({
        title: "Analysis Complete",
        description: "Image has been successfully analyzed",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      setAnalysisError(error?.response?.data?.error || error?.message || "Unknown error occurred");
      toast({
        title: "Analysis Failed",
        description: error?.response?.data?.error || error?.message || "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, imageUrl, analysisOptions, selectedModel, setIsAnalyzing, setAnalysisError, setAnalysisResult, setResultTab, setIsDiagnosticsExpanded]);

  // Use analysis result to populate form fields or update a prompt
  const usePromptInGenerator = () => {
    if (analysisResult?.analysis?.suggestedPrompt) {
      // Create a custom event to communicate with the prompt generator
      const event = new CustomEvent('use-analyzed-prompt', {
        detail: {
          prompt: analysisResult.analysis.suggestedPrompt,
          source: 'image-analyzer'
        }
      });
      
      // Dispatch the event for the prompt generator to listen for
      document.dispatchEvent(event);
      
      toast({
        title: "Prompt Added",
        description: "The suggested prompt has been added to the prompt generator",
      });
      
      // Copy to clipboard as a fallback
      navigator.clipboard.writeText(analysisResult.analysis.suggestedPrompt);
    }
  };

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setImageUrl("");
    setPreviewUrl("");
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisOptions(DEFAULT_OPTIONS);
    setIsDiagnosticsExpanded(false); // Reset diagnostics panel state
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Helper function to calculate aspect ratio in simplest form (like 4:5, 16:9)
  const calculateAspectRatio = (width: number, height: number): string => {
    if (!width || !height) return '';
    
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="grid gap-6">
      <Card className="border-gray-800 bg-gray-950/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center">
            <Camera className="mr-2 h-5 w-5" />
            Elite Image Analyzer
          </CardTitle>
          <CardDescription>
            Analyze images to extract style, composition, and generate prompts
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center">
                <Link className="mr-2 h-4 w-4" />
                Image URL
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <div className="grid gap-4">
                <Label htmlFor="imageUpload">Upload an image to analyze</Label>
                <Input
                  ref={fileInputRef}
                  id="imageUpload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={isAnalyzing}
                />
                
                {previewUrl && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative rounded-md overflow-hidden border border-gray-700">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-96 w-full object-contain"
                      />
                    </div>
                    
                    {file && analysisResult?.metadata && (
                      <ImageMetadataDisplay 
                        metadata={analysisResult.metadata}
                        file={file}
                      />
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="mt-4">
              <div className="grid gap-4">
                <Label htmlFor="imageUrl">Enter the URL of an image to analyze</Label>
                <Input
                  id="imageUrl" 
                  type="url" 
                  placeholder="https://example.com/image.jpg" 
                  value={imageUrl}
                  onChange={handleUrlChange}
                  disabled={isAnalyzing}
                />
                
                {imageUrl && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative rounded-md overflow-hidden border border-gray-700">
                      <img 
                        src={imageUrl} 
                        alt="URL Preview" 
                        className="max-h-96 w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          toast({
                            title: "Invalid Image URL",
                            description: "Could not load the image from the provided URL",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                    
                    {analysisResult?.metadata && (
                      <ImageMetadataDisplay 
                        metadata={analysisResult.metadata}
                        file={null}
                      />
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="bg-gray-900/50 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Analysis Options</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetOptions}
                  disabled={isAnalyzing}
                >
                  Reset Options
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="generatePrompt" 
                    checked={analysisOptions.generatePrompt}
                    onCheckedChange={() => toggleOption('generatePrompt')}
                    disabled={isAnalyzing}
                  />
                  <Label 
                    htmlFor="generatePrompt" 
                    className="text-sm cursor-pointer"
                  >
                    Generate prompt
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detectElements" 
                    checked={analysisOptions.detectElements}
                    onCheckedChange={() => toggleOption('detectElements')}
                    disabled={isAnalyzing}
                  />
                  <Label 
                    htmlFor="detectElements" 
                    className="text-sm cursor-pointer"
                  >
                    Detect elements
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="analyzeComposition" 
                    checked={analysisOptions.analyzeComposition}
                    onCheckedChange={() => toggleOption('analyzeComposition')}
                    disabled={isAnalyzing}
                  />
                  <Label 
                    htmlFor="analyzeComposition" 
                    className="text-sm cursor-pointer"
                  >
                    Analyze composition
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="extractColors" 
                    checked={analysisOptions.extractColors}
                    onCheckedChange={() => toggleOption('extractColors')}
                    disabled={isAnalyzing}
                  />
                  <Label 
                    htmlFor="extractColors" 
                    className="text-sm cursor-pointer"
                  >
                    Extract colors
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="classifyStyle" 
                    checked={analysisOptions.classifyStyle}
                    onCheckedChange={() => toggleOption('classifyStyle')}
                    disabled={isAnalyzing}
                  />
                  <Label 
                    htmlFor="classifyStyle" 
                    className="text-sm cursor-pointer"
                  >
                    Classify style
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="technicalDetails" 
                    checked={analysisOptions.includeTechnicalDetails}
                    onCheckedChange={() => toggleOption('includeTechnicalDetails')}
                    disabled={isAnalyzing}
                  />
                  <Label 
                    htmlFor="technicalDetails" 
                    className="text-sm cursor-pointer"
                  >
                    Include technical details
                  </Label>
                </div>
              </div>
              
              {/* Caption Model Selection */}
              <div className="mt-4">
                <Label htmlFor="modelSelect" className="text-sm font-medium">Model:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {/* OpenAI Models */}
                  <div 
                    className={`p-3 rounded-md cursor-pointer flex-col ${
                      selectedModel === 'gpt4-vision' ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedModel('gpt4-vision')}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">GPT-4o Vision</h4>
                      <BrainCircuit className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Advanced multimodal vision model with detailed captions</p>
                  </div>
                  
                  {/* Groq Llama 4 Models */}
                  <div 
                    className={`p-3 rounded-md cursor-pointer flex-col ${
                      selectedModel === 'llama-vision' ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedModel('llama-vision')}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Llama 4 Vision</h4>
                      <BrainCircuit className="h-4 w-4 text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Powerful multimodal vision model with fast inference</p>
                  </div>
                  
                  {/* Florence-2 via fal.ai - Standard Caption */}
                  <div 
                    className={`p-3 rounded-md cursor-pointer flex-col ${
                      selectedModel === 'florence-caption' ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setSelectedModel('florence-caption');
                      setAnalysisOptions(prev => ({
                        ...prev,
                        florenceDetailedCaption: false
                      }));
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Florence-2 Basic</h4>
                      <ImageIcon className="h-4 w-4 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Quick basic image captioning</p>
                  </div>
                  
                  {/* Florence-2 via fal.ai - Detailed Caption */}
                  <div 
                    className={`p-3 rounded-md cursor-pointer flex-col ${
                      selectedModel === 'florence-caption' && analysisOptions.florenceDetailedCaption ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setSelectedModel('florence-caption');
                      setAnalysisOptions(prev => ({
                        ...prev,
                        florenceDetailedCaption: true
                      }));
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Florence-2 Detailed</h4>
                      <ImageIcon className="h-4 w-4 text-teal-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Comprehensive image description with detail</p>
                  </div>
                  
                  {/* Qwen 2.5 VL 3B via OpenRouter */}
                  <div 
                    className={`p-3 rounded-md cursor-pointer flex-col ${
                      selectedModel === 'qwen-vl' && analysisOptions.qwenModel === 'qwen-vl-3b' ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setSelectedModel('qwen-vl');
                      setAnalysisOptions(prev => ({
                        ...prev,
                        qwenModel: 'qwen-vl-3b'
                      }));
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Qwen-VL 3B</h4>
                      <BrainCircuit className="h-4 w-4 text-orange-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Fast, efficient vision model for basic image understanding</p>
                  </div>
                  
                  {/* Qwen 2.5 VL 32B via OpenRouter */}
                  <div 
                    className={`p-3 rounded-md cursor-pointer flex-col ${
                      selectedModel === 'qwen-vl' && analysisOptions.qwenModel === 'qwen-vl-32b' ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setSelectedModel('qwen-vl');
                      setAnalysisOptions(prev => ({
                        ...prev,
                        qwenModel: 'qwen-vl-32b'
                      }));
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Qwen-VL 32B</h4>
                      <BrainCircuit className="h-4 w-4 text-yellow-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Advanced vision model for detailed image analysis</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button 
                onClick={startAnalysis}
                disabled={isAnalyzing || (!file && !imageUrl)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold" 
              >
                {isAnalyzing ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Analyze Image
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={isAnalyzing}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Analysis Results */}
      {analysisResult && analysisResult.analysis && (
        <Card className="border-gray-800 bg-gray-950/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <BrainCircuit className="mr-2 h-5 w-5" />
              Analysis Results
            </CardTitle>
            <CardDescription>
              {analysisResult.imageUrl 
                ? `Results for image URL: ${analysisResult.imageUrl}` 
                : `Results for uploaded image${analysisResult.imagePath ? `: ${analysisResult.imagePath}` : ''}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={resultTab} onValueChange={setResultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis" className="flex items-center">
                  <Info className="mr-2 h-4 w-4" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="prompt" className="flex items-center" disabled={!analysisResult.analysis.suggestedPrompt}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Prompt
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center">
                  <Layers className="mr-2 h-4 w-4" />
                  Details
                </TabsTrigger>
              </TabsList>
              
              {/* Analysis Tab */}
              <TabsContent value="analysis" className="mt-4">
                <div className="rounded-md border border-gray-700 bg-gray-900/50 p-4">
                  <h3 className="text-lg font-medium mb-2">Image Description</h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{analysisResult.analysis.description}</p>
                </div>
              </TabsContent>
              
              {/* Prompt Tab */}
              <TabsContent value="prompt" className="mt-4">
                <div className="flex flex-col space-y-4">
                  <div className="rounded-md border border-gray-700 bg-gray-900/50 p-4 relative">
                    <h3 className="text-lg font-medium mb-2">Generated Prompt</h3>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{analysisResult.analysis.suggestedPrompt}</p>
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={usePromptInGenerator}
                        title="Use in Prompt Generator"
                      >
                        <CopyCheck className="h-4 w-4" />
                      </Button>
                      <CopyButton textToCopy={analysisResult.analysis.suggestedPrompt || ''} />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Details Tab */}
              <TabsContent value="details" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border border-gray-700 bg-gray-900/50 p-4">
                  {/* Elements */}
                  {analysisResult.analysis.detectedElements && analysisResult.analysis.detectedElements.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium mb-3 flex items-center">
                        <Palette className="mr-2 h-4 w-4 text-blue-400" />
                        Detected Elements
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysis.detectedElements.map((element, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-900/40 hover:bg-blue-800/60">
                            {element}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Colors */}
                  {analysisResult.analysis.dominantColors && analysisResult.analysis.dominantColors.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium mb-3 flex items-center">
                        <Palette className="mr-2 h-4 w-4 text-purple-400" />
                        Dominant Colors
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysis.dominantColors.map((color, index) => (
                          <Badge key={index} variant="secondary" className="bg-purple-900/40 hover:bg-purple-800/60">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Composition */}
                  {analysisResult.analysis.compositionNotes && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium mb-2 flex items-center">
                        <Layers className="mr-2 h-4 w-4 text-green-400" />
                        Composition
                      </h3>
                      <p className="text-sm text-gray-300">
                        {typeof analysisResult.analysis.compositionNotes === 'object' 
                          ? JSON.stringify(analysisResult.analysis.compositionNotes) 
                          : analysisResult.analysis.compositionNotes}
                      </p>
                    </div>
                  )}
                  
                  {/* Style */}
                  {analysisResult.analysis.styleClassification && analysisResult.analysis.styleClassification.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium mb-3 flex items-center">
                        <Sparkles className="mr-2 h-4 w-4 text-yellow-400" />
                        Style Classification
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysis.styleClassification.map((style, index) => (
                          <Badge key={index} variant="secondary" className="bg-yellow-900/40 hover:bg-yellow-800/60">
                            {style}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Technical Details */}
                  {analysisResult.analysis.technicalDetails && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium mb-3 flex items-center">
                        <Info className="mr-2 h-4 w-4 text-teal-400" />
                        Technical Assessment
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {analysisResult.analysis.technicalDetails.estimatedResolution && (
                          <div className="bg-gray-800/50 p-2 rounded-md">
                            <span className="text-gray-400">Resolution:</span>
                            <span className="ml-2 text-gray-200">{analysisResult.analysis.technicalDetails.estimatedResolution}</span>
                          </div>
                        )}
                        
                        {analysisResult.analysis.technicalDetails.aspectRatio && (
                          <div className="bg-gray-800/50 p-2 rounded-md">
                            <span className="text-gray-400">Aspect Ratio:</span>
                            <span className="ml-2 text-gray-200">{analysisResult.analysis.technicalDetails.aspectRatio}</span>
                          </div>
                        )}
                        
                        {analysisResult.analysis.technicalDetails.quality && (
                          <div className="bg-gray-800/50 p-2 rounded-md">
                            <span className="text-gray-400">Quality:</span>
                            <span className="ml-2 text-gray-200">{analysisResult.analysis.technicalDetails.quality}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Diagnostics Report Card */}
      {analysisError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>
            {analysisError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}