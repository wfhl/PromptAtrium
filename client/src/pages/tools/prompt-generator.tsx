import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Sparkles, Copy, Save, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight,
  HelpCircle, Wand2, Settings, History, BookOpen, Code, Image,
  Palette, Camera, User, MapPin, Lightbulb, Package, Layers,
  Zap, Download, Upload, Share2, X, Check, AlertCircle, Info,
  ArrowRight, MoreVertical, Eye, EyeOff, Lock, Unlock, Star, Tag, Menu, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PromptModal } from "@/components/PromptModal";
import { apiRequest } from "@/lib/queryClient";
import { useToolsContext } from "@/contexts/ToolsContext";
import type { Prompt } from "@shared/schema";

// Template categories with icons
const templateCategories = [
  { id: "portrait", name: "Portrait", icon: User, count: 12 },
  { id: "landscape", name: "Landscape", icon: MapPin, count: 8 },
  { id: "abstract", name: "Abstract", icon: Sparkles, count: 15 },
  { id: "character", name: "Character", icon: User, count: 20 },
  { id: "scene", name: "Scene", icon: Camera, count: 18 },
  { id: "product", name: "Product", icon: Package, count: 10 },
  { id: "concept", name: "Concept Art", icon: Lightbulb, count: 14 },
  { id: "architecture", name: "Architecture", icon: Layers, count: 9 },
];

// Style presets
const stylePresets = [
  { id: "photorealistic", name: "Photorealistic", description: "Ultra-realistic photography style" },
  { id: "anime", name: "Anime", description: "Japanese animation style" },
  { id: "oil-painting", name: "Oil Painting", description: "Traditional oil painting technique" },
  { id: "digital-art", name: "Digital Art", description: "Modern digital illustration" },
  { id: "watercolor", name: "Watercolor", description: "Soft watercolor painting style" },
  { id: "pencil-sketch", name: "Pencil Sketch", description: "Detailed pencil drawing" },
  { id: "3d-render", name: "3D Render", description: "High-quality 3D rendering" },
  { id: "pixel-art", name: "Pixel Art", description: "Retro pixel art style" },
  { id: "comic-book", name: "Comic Book", description: "Bold comic book illustration" },
  { id: "fantasy", name: "Fantasy Art", description: "Magical fantasy illustration" },
];

// Model presets with default parameters
const modelPresets = {
  "stable-diffusion": {
    name: "Stable Diffusion",
    defaultParams: {
      steps: 30,
      cfgScale: 7.5,
      sampler: "DPM++ 2M Karras",
      scheduler: "karras",
      width: 512,
      height: 512,
    }
  },
  "sdxl": {
    name: "SDXL",
    defaultParams: {
      steps: 40,
      cfgScale: 7,
      sampler: "DPM++ 2M Karras",
      scheduler: "karras",
      width: 1024,
      height: 1024,
    }
  },
  "midjourney": {
    name: "Midjourney",
    defaultParams: {
      quality: 1,
      stylize: 100,
      chaos: 0,
      weird: 0,
      aspectRatio: "16:9",
    }
  },
  "dalle": {
    name: "DALL-E",
    defaultParams: {
      quality: "standard",
      style: "vivid",
      size: "1024x1024",
    }
  },
};

// Sample templates with placeholders
const sampleTemplates = {
  portrait: [
    {
      id: "p1",
      name: "Professional Portrait",
      template: "Professional portrait of {{subject}}, {{expression}} expression, {{lighting}} lighting, {{background}} background, {{style}} style, high quality, detailed",
      placeholders: {
        subject: "a person",
        expression: "confident",
        lighting: "studio",
        background: "neutral gray",
        style: "photorealistic"
      }
    },
    {
      id: "p2",
      name: "Fantasy Character",
      template: "{{character_type}} with {{features}}, wearing {{clothing}}, {{pose}}, {{environment}}, fantasy art style, detailed illustration",
      placeholders: {
        character_type: "elven warrior",
        features: "long silver hair and blue eyes",
        clothing: "ornate armor",
        pose: "heroic stance",
        environment: "mystical forest"
      }
    },
  ],
  landscape: [
    {
      id: "l1",
      name: "Epic Landscape",
      template: "{{time_of_day}} landscape of {{location}}, {{weather}} weather, {{mood}} atmosphere, {{style}}, cinematic composition",
      placeholders: {
        time_of_day: "golden hour",
        location: "mountain valley",
        weather: "dramatic cloudy",
        mood: "serene",
        style: "photorealistic"
      }
    },
  ],
  abstract: [
    {
      id: "a1",
      name: "Abstract Composition",
      template: "Abstract {{concept}} with {{colors}} colors, {{texture}} texture, {{movement}} movement, {{style}} style, high contrast",
      placeholders: {
        concept: "energy flow",
        colors: "vibrant blue and orange",
        texture: "fluid",
        movement: "dynamic swirling",
        style: "modern digital art"
      }
    },
  ],
};

// Quality modifiers
const qualityModifiers = [
  "masterpiece", "best quality", "high resolution", "detailed", "professional",
  "award winning", "trending on artstation", "8k", "4k", "ultra detailed",
  "photorealistic", "hyperrealistic", "cinematic", "studio quality", "sharp focus"
];

// Negative prompt suggestions
const negativePromptSuggestions = [
  "low quality", "blurry", "pixelated", "distorted", "deformed",
  "bad anatomy", "watermark", "signature", "text", "logo",
  "cropped", "worst quality", "jpeg artifacts", "ugly", "duplicate"
];

interface PromptElement {
  id: string;
  type: "subject" | "style" | "quality" | "lighting" | "composition" | "custom";
  content: string;
  weight?: number;
}

export default function PromptGeneratorPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedKeywords, clearKeywords } = useToolsContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  // Main state
  const [mode, setMode] = useState<"guided" | "advanced">("guided");
  const [selectedCategory, setSelectedCategory] = useState("portrait");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("stable-diffusion");
  const [promptElements, setPromptElements] = useState<PromptElement[]>([]);
  const [mainPrompt, setMainPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [prefilledPromptData, setPrefilledPromptData] = useState<Partial<Prompt> | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["template", "style", "parameters"]));
  const [importedKeywords, setImportedKeywords] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [receivedKeywords, setReceivedKeywords] = useState<typeof selectedKeywords>([]);
  
  // Parameters state
  const [parameters, setParameters] = useState({
    // Stable Diffusion parameters
    steps: 30,
    cfgScale: 7.5,
    sampler: "DPM++ 2M Karras",
    scheduler: "karras",
    seed: -1,
    width: 512,
    height: 512,
    clipSkip: 1,
    denoisingStrength: 0.75,
    
    // Midjourney parameters
    quality: 1,
    stylize: 100,
    chaos: 0,
    weird: 0,
    aspectRatio: "16:9",
    tile: false,
    
    // DALL-E parameters
    dalleQuality: "standard",
    dalleStyle: "vivid",
    dalleSize: "1024x1024",
    
    // Common parameters
    guidanceScale: 7.5,
    numImages: 1,
    enableHighRes: false,
    highResScale: 2,
    highResSteps: 20,
  });

  // Load templates for selected category
  const templates = sampleTemplates[selectedCategory as keyof typeof sampleTemplates] || [];

  // Check for incoming keywords on mount
  useEffect(() => {
    if (selectedKeywords.length > 0) {
      setReceivedKeywords(selectedKeywords);
      setExpandedSections(prev => new Set(Array.from(prev).concat("keywords")));
      
      // Show notification
      toast({
        title: "Keywords received",
        description: `${selectedKeywords.length} keyword${selectedKeywords.length > 1 ? 's' : ''} received from Keyword Dictionary`,
      });
      
      // Clear the context after a small delay to ensure UI updates
      setTimeout(() => {
        clearKeywords();
      }, 100);
    }
  }, [selectedKeywords, clearKeywords, toast]);

  // Add keyword to prompt
  const addKeywordToPrompt = (keyword: typeof selectedKeywords[0]) => {
    const keywordText = keyword.term;
    if (mainPrompt) {
      setMainPrompt(prev => `${prev}, ${keywordText}`);
    } else {
      setMainPrompt(keywordText);
    }
    
    // Remove from received keywords
    setReceivedKeywords(prev => prev.filter(k => k.id !== keyword.id));
    
    toast({
      title: "Keyword added",
      description: `"${keywordText}" added to prompt`,
    });
  };

  // Add all keywords to prompt
  const addAllKeywordsToPrompt = () => {
    const keywordTexts = receivedKeywords.map(k => k.term).join(", ");
    if (mainPrompt) {
      setMainPrompt(prev => `${prev}, ${keywordTexts}`);
    } else {
      setMainPrompt(keywordTexts);
    }
    
    toast({
      title: "Keywords added",
      description: `${receivedKeywords.length} keywords added to prompt`,
    });
    
    setReceivedKeywords([]);
  };

  // Clear received keywords
  const clearReceivedKeywords = () => {
    setReceivedKeywords([]);
    toast({
      title: "Keywords cleared",
      description: "Received keywords have been cleared",
    });
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Apply template
  const applyTemplate = (template: any) => {
    setSelectedTemplate(template);
    setPlaceholderValues(template.placeholders);
    updatePromptFromTemplate(template, template.placeholders);
  };

  // Update prompt from template and placeholders
  const updatePromptFromTemplate = (template: any, values: Record<string, string>) => {
    let prompt = template.template;
    Object.entries(values).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    setMainPrompt(prompt);
  };

  // Update placeholder value
  const updatePlaceholder = (key: string, value: string) => {
    const newValues = { ...placeholderValues, [key]: value };
    setPlaceholderValues(newValues);
    if (selectedTemplate) {
      updatePromptFromTemplate(selectedTemplate, newValues);
    }
  };

  // Apply style preset
  const applyStylePreset = (styleId: string) => {
    setSelectedStyle(styleId);
    const style = stylePresets.find(s => s.id === styleId);
    if (style) {
      // Add style to prompt if not already present
      const styleText = `, ${style.name.toLowerCase()} style`;
      if (!mainPrompt.includes(styleText)) {
        setMainPrompt(prev => prev + styleText);
      }
    }
  };

  // Apply model preset
  const applyModelPreset = (modelId: string) => {
    setSelectedModel(modelId);
    const preset = modelPresets[modelId as keyof typeof modelPresets];
    if (preset) {
      setParameters(prev => ({
        ...prev,
        ...preset.defaultParams,
      }));
    }
  };

  // Add prompt element (guided mode)
  const addPromptElement = (type: PromptElement["type"], content: string = "") => {
    const newElement: PromptElement = {
      id: Date.now().toString(),
      type,
      content,
      weight: 1,
    };
    setPromptElements(prev => [...prev, newElement]);
  };

  // Update prompt element
  const updatePromptElement = (id: string, updates: Partial<PromptElement>) => {
    setPromptElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  };

  // Remove prompt element
  const removePromptElement = (id: string) => {
    setPromptElements(prev => prev.filter(el => el.id !== id));
  };

  // Build prompt from elements (guided mode)
  const buildPromptFromElements = () => {
    const grouped = promptElements.reduce((acc, el) => {
      if (!acc[el.type]) acc[el.type] = [];
      const weightedContent = el.weight && el.weight !== 1 
        ? `(${el.content}:${el.weight})`
        : el.content;
      acc[el.type].push(weightedContent);
      return acc;
    }, {} as Record<string, string[]>);

    const parts = [];
    if (grouped.subject?.length) parts.push(grouped.subject.join(", "));
    if (grouped.style?.length) parts.push(grouped.style.join(", "));
    if (grouped.lighting?.length) parts.push(grouped.lighting.join(", "));
    if (grouped.composition?.length) parts.push(grouped.composition.join(", "));
    if (grouped.quality?.length) parts.push(grouped.quality.join(", "));
    if (grouped.custom?.length) parts.push(grouped.custom.join(", "));
    
    return parts.join(", ");
  };

  // Generate variations
  const generateVariations = () => {
    const variations = [];
    const basePrompt = mainPrompt;
    
    // Generate 3 variations with slight modifications
    const modifiers = [
      ["vibrant colors", "muted colors", "monochrome"],
      ["dramatic lighting", "soft lighting", "natural lighting"],
      ["close-up", "medium shot", "wide angle"],
    ];
    
    for (let i = 0; i < 3; i++) {
      let variation = basePrompt;
      modifiers.forEach(modifierSet => {
        const modifier = modifierSet[Math.floor(Math.random() * modifierSet.length)];
        if (!variation.includes(modifier)) {
          variation += `, ${modifier}`;
        }
      });
      variations.push(variation);
    }
    
    toast({
      title: "Variations Generated",
      description: "3 prompt variations have been created",
    });
    
    return variations;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string = "Prompt") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Save to library
  const saveToLibrary = () => {
    // Prepare technical parameters based on selected model
    const technicalParams: any = {};
    
    if (selectedModel === "stable-diffusion" || selectedModel === "sdxl") {
      technicalParams.steps = parameters.steps;
      technicalParams.cfgScale = parameters.cfgScale;
      technicalParams.sampler = parameters.sampler;
      technicalParams.scheduler = parameters.scheduler;
      if (parameters.seed !== -1) technicalParams.seed = parameters.seed;
      technicalParams.width = parameters.width;
      technicalParams.height = parameters.height;
      technicalParams.clipSkip = parameters.clipSkip;
    } else if (selectedModel === "midjourney") {
      technicalParams.quality = parameters.quality;
      technicalParams.stylize = parameters.stylize;
      technicalParams.chaos = parameters.chaos;
      technicalParams.weird = parameters.weird;
      technicalParams.aspectRatio = parameters.aspectRatio;
    } else if (selectedModel === "dalle") {
      technicalParams.quality = parameters.dalleQuality;
      technicalParams.style = parameters.dalleStyle;
      technicalParams.size = parameters.dalleSize;
    }

    setPrefilledPromptData({
      name: `Generated ${new Date().toLocaleDateString()}`,
      promptContent: mainPrompt,
      negative_prompt: negativePrompt || null,
      model: selectedModel,
      technical_params: technicalParams,
      style: selectedStyle || null,
      tags: [],
    });
    setPromptModalOpen(true);
  };

  // Export prompt data
  const exportPromptData = () => {
    const data = {
      mainPrompt,
      negativePrompt,
      model: selectedModel,
      parameters,
      style: selectedStyle,
      template: selectedTemplate,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported!",
      description: "Prompt data exported successfully",
    });
  };

  // Import prompt data
  const importPromptData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setMainPrompt(data.mainPrompt || "");
        setNegativePrompt(data.negativePrompt || "");
        setSelectedModel(data.model || "stable-diffusion");
        setParameters(prev => ({ ...prev, ...data.parameters }));
        setSelectedStyle(data.style || "");
        if (data.template) {
          setSelectedTemplate(data.template);
          setPlaceholderValues(data.template.placeholders);
        }
        
        toast({
          title: "Imported!",
          description: "Prompt data imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid prompt data file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Mobile-Optimized Header Section */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base sm:text-2xl font-bold">Prompt Generator</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Create perfect prompts with AI assistance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              {/* Mode Toggle */}
              <Tabs value={mode} onValueChange={(v) => setMode(v as "guided" | "advanced")} className="w-auto hidden sm:block">
                <TabsList className="h-8 sm:h-10">
                  <TabsTrigger value="guided" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                    <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Guided</span>
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                    <Code className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Advanced</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:inline-flex"
                onClick={() => setShowHistory(!showHistory)}
                data-testid="button-history"
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Mobile Mode Toggle */}
          <div className="mt-2 sm:hidden">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "guided" | "advanced")} className="w-full">
              <TabsList className="w-full h-8">
                <TabsTrigger value="guided" className="flex-1 gap-1 text-xs">
                  <Wand2 className="h-3 w-3" />
                  <span>Guided</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex-1 gap-1 text-xs">
                  <Code className="h-3 w-3" />
                  <span>Advanced</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Quick Stats - Hidden on mobile */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-4 text-sm mt-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">12 prompts generated today</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <Save className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">8 saved to library</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b bg-background">
          <div className="p-3 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setShowHistory(!showHistory);
                setMobileMenuOpen(false);
              }}
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setMobileSettingsOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              <Settings className="h-4 w-4" />
              Model Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                exportPromptData();
                setMobileMenuOpen(false);
              }}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      )}

      {/* Main Content - Mobile Optimized */}
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Left Panel - Template & Configuration */}
          <div className="lg:col-span-2 space-y-2 sm:space-y-4">
            {mode === "guided" ? (
              <>
                {/* Received Keywords Section - Mobile Optimized */}
                {receivedKeywords.length > 0 && (
                  <Collapsible
                    open={expandedSections.has("keywords")}
                    onOpenChange={() => toggleSection("keywords")}
                  >
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="py-2 sm:py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                              <CardTitle className="text-sm sm:text-base">Keywords</CardTitle>
                              <Badge variant="secondary" className="h-4 text-xs px-1">{receivedKeywords.length}</Badge>
                            </div>
                            {expandedSections.has("keywords") ? (
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-2 sm:pb-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1 sm:gap-1.5">
                              {receivedKeywords.map((keyword) => (
                                <Badge
                                  key={keyword.id}
                                  variant="outline"
                                  className="gap-0.5 pr-0.5 text-xs h-6 sm:h-7"
                                  data-testid={`keyword-${keyword.id}`}
                                >
                                  <span>{keyword.term}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 hover:bg-transparent"
                                    onClick={() => addKeywordToPrompt(keyword)}
                                    data-testid={`button-add-keyword-${keyword.id}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5 pt-1.5 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addAllKeywordsToPrompt}
                                className="h-7 text-xs"
                                data-testid="button-add-all-keywords"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearReceivedKeywords}
                                className="h-7 text-xs"
                                data-testid="button-clear-keywords"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Clear
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                )}

                {/* Template Selection - Mobile Optimized */}
                <Collapsible
                  open={expandedSections.has("template")}
                  onOpenChange={() => toggleSection("template")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="py-2 sm:py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                            <CardTitle className="text-sm sm:text-base">Templates</CardTitle>
                          </div>
                          {expandedSections.has("template") ? (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-2 sm:pb-3">
                        {/* Category Tabs - Mobile Optimized */}
                        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                          <ScrollArea className="w-full" type="scroll">
                            <TabsList className="inline-flex w-max h-7 sm:h-9">
                              {templateCategories.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                  <TabsTrigger 
                                    key={cat.id} 
                                    value={cat.id}
                                    className="gap-0.5 sm:gap-1 text-xs sm:text-sm px-1.5 sm:px-2.5"
                                    data-testid={`tab-category-${cat.id}`}
                                  >
                                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span className="sm:inline hidden">{cat.name}</span>
                                    <span className="sm:hidden">{cat.name.slice(0, 3)}</span>
                                    <Badge variant="secondary" className="ml-0.5 h-3.5 px-0.5 text-xs">
                                      {cat.count}
                                    </Badge>
                                  </TabsTrigger>
                                );
                              })}
                            </TabsList>
                          </ScrollArea>

                          {/* Template Cards - Mobile Optimized */}
                          <TabsContent value={selectedCategory} className="mt-2 sm:mt-3">
                            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                              {templates.map((template) => (
                                <Card 
                                  key={template.id}
                                  className={`cursor-pointer transition-all hover:shadow-md ${
                                    selectedTemplate?.id === template.id ? 'ring-1 sm:ring-2 ring-primary' : ''
                                  }`}
                                  onClick={() => applyTemplate(template)}
                                  data-testid={`template-card-${template.id}`}
                                >
                                  <CardHeader className="py-2 px-3 sm:py-3 sm:px-4">
                                    <CardTitle className="text-xs sm:text-sm">{template.name}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-0 pb-2 px-3 sm:pb-3 sm:px-4">
                                    <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
                                      {template.template.substring(0, 80)}...
                                    </p>
                                    <div className="flex flex-wrap gap-0.5">
                                      {Object.keys(template.placeholders).slice(0, 3).map((key) => (
                                        <Badge key={key} variant="secondary" className="text-xs h-4 px-1">
                                          {key}
                                        </Badge>
                                      ))}
                                      {Object.keys(template.placeholders).length > 3 && (
                                        <Badge variant="secondary" className="text-xs h-4 px-1">
                                          +{Object.keys(template.placeholders).length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Placeholder Values - Mobile Optimized */}
                        {selectedTemplate && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-muted/50 rounded-lg space-y-1.5 sm:space-y-2">
                            <h4 className="text-xs sm:text-sm font-medium">Customize</h4>
                            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                              {Object.entries(placeholderValues).map(([key, value]) => (
                                <div key={key} className="space-y-0.5">
                                  <Label htmlFor={key} className="text-xs capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </Label>
                                  <Input
                                    id={key}
                                    value={value}
                                    onChange={(e) => updatePlaceholder(key, e.target.value)}
                                    className="h-7 sm:h-8 text-xs sm:text-sm"
                                    data-testid={`input-placeholder-${key}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Style Selection - Mobile Optimized */}
                <Collapsible
                  open={expandedSections.has("style")}
                  onOpenChange={() => toggleSection("style")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="py-2 sm:py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                            <CardTitle className="text-sm sm:text-base">Style Presets</CardTitle>
                          </div>
                          {expandedSections.has("style") ? (
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-2 sm:pb-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                          {stylePresets.map((style) => (
                            <Card
                              key={style.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedStyle === style.id ? 'ring-1 sm:ring-2 ring-primary' : ''
                              }`}
                              onClick={() => applyStylePreset(style.id)}
                              data-testid={`style-preset-${style.id}`}
                            >
                              <CardContent className="p-2 sm:p-3">
                                <h4 className="text-xs sm:text-sm font-medium">{style.name}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {style.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </>
            ) : null}

            {/* Main Prompt Input - Mobile Optimized */}
            <Card>
              <CardHeader className="py-2 sm:py-3">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  Main Prompt
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Your main prompt text
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-2 sm:pb-3">
                <Textarea
                  value={mainPrompt}
                  onChange={(e) => setMainPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="min-h-[60px] sm:min-h-[100px] resize-none text-xs sm:text-sm"
                  data-testid="textarea-main-prompt"
                />
                
                {/* Quick Quality Modifiers - Mobile Optimized */}
                <div className="mt-2 sm:mt-3">
                  <Label className="text-xs sm:text-sm mb-1 block">Quick Add</Label>
                  <div className="flex flex-wrap gap-1">
                    {qualityModifiers.slice(0, 5).map((modifier) => (
                      <Badge
                        key={modifier}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 transition-colors text-xs h-5 px-1.5"
                        onClick={() => {
                          if (!mainPrompt.includes(modifier)) {
                            setMainPrompt(prev => prev ? `${prev}, ${modifier}` : modifier);
                          }
                        }}
                        data-testid={`modifier-${modifier.replace(/\s+/g, '-')}`}
                      >
                        <Plus className="h-2.5 w-2.5 mr-0.5" />
                        <span>{modifier}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Negative Prompt - Mobile Optimized */}
            <Card>
              <CardHeader className="py-2 sm:py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                      <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                      Negative Prompt
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-0.5">
                      What to avoid
                    </CardDescription>
                  </div>
                  <Switch
                    className="scale-75 sm:scale-100"
                    checked={negativePrompt.length > 0}
                    onCheckedChange={(checked) => {
                      if (!checked) setNegativePrompt("");
                    }}
                    data-testid="switch-negative-prompt"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-2 sm:pb-3">
                <Textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Things to avoid..."
                  className="min-h-[50px] sm:min-h-[80px] resize-none text-xs sm:text-sm"
                  data-testid="textarea-negative-prompt"
                />
                
                {/* Negative Suggestions - Mobile Optimized */}
                <div className="mt-2 sm:mt-3">
                  <Label className="text-xs sm:text-sm mb-1 block">Common</Label>
                  <div className="flex flex-wrap gap-1">
                    {negativePromptSuggestions.slice(0, 5).map((suggestion) => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-destructive/10 transition-colors text-xs h-5 px-1.5"
                        onClick={() => {
                          if (!negativePrompt.includes(suggestion)) {
                            setNegativePrompt(prev => prev ? `${prev}, ${suggestion}` : suggestion);
                          }
                        }}
                        data-testid={`negative-${suggestion.replace(/\s+/g, '-')}`}
                      >
                        <Plus className="h-2.5 w-2.5 mr-0.5" />
                        <span>{suggestion}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Parameters & Actions - Mobile Optimized */}
          <div className="space-y-2 sm:space-y-4">
            {/* Model Selection - Desktop Only */}
            <Card className="hidden lg:block">
              <CardHeader className="py-2 sm:py-3">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Model Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 sm:pb-3 space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="model" className="text-xs sm:text-sm">AI Model</Label>
                  <Select value={selectedModel} onValueChange={applyModelPreset}>
                    <SelectTrigger id="model" className="h-7 sm:h-9 text-xs sm:text-sm" data-testid="select-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(modelPresets).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model-specific parameters - Mobile Optimized */}
                {(selectedModel === "stable-diffusion" || selectedModel === "sdxl") && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="steps" className="text-xs sm:text-sm">Steps</Label>
                        <span className="text-xs sm:text-sm text-muted-foreground">{parameters.steps}</span>
                      </div>
                      <Slider
                        id="steps"
                        value={[parameters.steps]}
                        onValueChange={([v]) => setParameters(prev => ({ ...prev, steps: v }))}
                        min={1}
                        max={150}
                        step={1}
                        className="w-full"
                        data-testid="slider-steps"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="cfg" className="text-xs sm:text-sm">CFG Scale</Label>
                        <span className="text-xs sm:text-sm text-muted-foreground">{parameters.cfgScale}</span>
                      </div>
                      <Slider
                        id="cfg"
                        value={[parameters.cfgScale]}
                        onValueChange={([v]) => setParameters(prev => ({ ...prev, cfgScale: v }))}
                        min={1}
                        max={20}
                        step={0.5}
                        className="w-full"
                        data-testid="slider-cfg-scale"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions - Mobile Optimized */}
            <Card>
              <CardHeader className="py-2 sm:py-3">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 sm:pb-3 space-y-1.5 sm:space-y-2">
                <Button 
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm" 
                  onClick={() => copyToClipboard(mainPrompt, "Main prompt")}
                  variant="outline"
                  data-testid="button-copy-prompt"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Copy Prompt
                </Button>
                
                <Button 
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm" 
                  onClick={saveToLibrary}
                  variant="outline"
                  disabled={!isAuthenticated}
                  data-testid="button-save-library"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Save to Library
                </Button>
                
                <Button 
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm" 
                  onClick={() => {
                    const variations = generateVariations();
                    toast({
                      title: "Variations Generated",
                      description: "Check the variations section below",
                    });
                  }}
                  variant="outline"
                  data-testid="button-generate-variations"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Variations
                </Button>
                
                <Separator className="my-1 sm:my-1.5" />
                
                <Button 
                  className="w-full h-9 sm:h-10 text-xs sm:text-sm" 
                  onClick={() => {
                    toast({
                      title: "Prompt Generated!",
                      description: "Your prompt is ready to use",
                    });
                  }}
                  data-testid="button-generate-prompt"
                >
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Generate Prompt
                </Button>
              </CardContent>
            </Card>

            {/* Preview - Mobile Optimized */}
            {showPreview && mainPrompt && (
              <Card className="hidden sm:block">
                <CardHeader className="py-2 sm:py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 text-sm">
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowPreview(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                  <div className="p-2 bg-muted rounded-md">
                    <p className="text-xs font-mono break-all">{mainPrompt}</p>
                    {negativePrompt && (
                      <>
                        <Separator className="my-2" />
                        <p className="text-xs font-mono break-all text-muted-foreground">
                          Negative: {negativePrompt}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Settings Sheet */}
      <Dialog open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
        <DialogContent className="sm:hidden max-w-sm">
          <DialogHeader>
            <DialogTitle>Model Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="mobile-model" className="text-xs">AI Model</Label>
              <Select value={selectedModel} onValueChange={applyModelPreset}>
                <SelectTrigger id="mobile-model" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(modelPresets).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(selectedModel === "stable-diffusion" || selectedModel === "sdxl") && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Steps</Label>
                    <span className="text-xs text-muted-foreground">{parameters.steps}</span>
                  </div>
                  <Slider
                    value={[parameters.steps]}
                    onValueChange={([v]) => setParameters(prev => ({ ...prev, steps: v }))}
                    min={1}
                    max={150}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">CFG Scale</Label>
                    <span className="text-xs text-muted-foreground">{parameters.cfgScale}</span>
                  </div>
                  <Slider
                    value={[parameters.cfgScale]}
                    onValueChange={([v]) => setParameters(prev => ({ ...prev, cfgScale: v }))}
                    min={1}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Prompt Modal */}
      {promptModalOpen && (
        <PromptModal
          open={promptModalOpen}
          onClose={() => {
            setPromptModalOpen(false);
            setPrefilledPromptData(null);
          }}
          initialData={prefilledPromptData || undefined}
        />
      )}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recent Prompts</DialogTitle>
            <DialogDescription>
              Your recently generated prompts
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full">
            {recentPrompts.length > 0 ? (
              <div className="space-y-2">
                {recentPrompts.map((prompt, index) => (
                  <Card key={index} className="p-3">
                    <p className="text-sm mb-2 line-clamp-2">{prompt}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMainPrompt(prompt);
                        setShowHistory(false);
                      }}
                    >
                      Use This
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent prompts yet
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}