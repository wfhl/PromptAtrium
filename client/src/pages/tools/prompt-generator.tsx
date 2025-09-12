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
  ArrowRight, MoreVertical, Eye, EyeOff, Lock, Unlock, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PromptModal } from "@/components/PromptModal";
import { apiRequest } from "@/lib/queryClient";
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
      if (parameters.chaos > 0) technicalParams.chaos = parameters.chaos;
      if (parameters.weird > 0) technicalParams.weird = parameters.weird;
      technicalParams.aspectRatio = parameters.aspectRatio;
    } else if (selectedModel === "dalle") {
      technicalParams.quality = parameters.dalleQuality;
      technicalParams.style = parameters.dalleStyle;
      technicalParams.size = parameters.dalleSize;
    }

    const prefilled: Partial<Prompt> = {
      name: `Generated Prompt - ${new Date().toLocaleDateString()}`,
      description: `Prompt generated using the Prompt Generator tool`,
      promptContent: mainPrompt,
      negativePrompt: negativePrompt,
      intendedGenerator: modelPresets[selectedModel as keyof typeof modelPresets]?.name || "",
      technicalParams: Object.keys(technicalParams).length > 0 ? technicalParams : null,
      category: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1),
      promptType: "Image Generation",
      promptStyle: selectedStyle || undefined,
      isPublic: false,
      status: "published",
      tags: ["generated", "prompt-generator", selectedModel, selectedCategory].filter(Boolean),
    };

    setPrefilledPromptData(prefilled);
    setPromptModalOpen(true);
  };

  // Add to recent prompts
  const addToRecentPrompts = (prompt: string) => {
    setRecentPrompts(prev => {
      const updated = [prompt, ...prev.filter(p => p !== prompt)].slice(0, 10);
      // Save to localStorage for persistence
      localStorage.setItem('recentPrompts', JSON.stringify(updated));
      return updated;
    });
  };

  // Load recent prompts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentPrompts');
    if (saved) {
      try {
        setRecentPrompts(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load recent prompts:', error);
      }
    }
  }, []);

  // Update main prompt when in guided mode
  useEffect(() => {
    if (mode === "guided" && promptElements.length > 0) {
      const builtPrompt = buildPromptFromElements();
      setMainPrompt(builtPrompt);
    }
  }, [promptElements, mode]);

  // Import keywords from dictionary (prepare for cross-tool communication)
  const importKeywords = (keywords: string[]) => {
    setImportedKeywords(keywords);
    // Add keywords to prompt
    const keywordText = keywords.join(", ");
    setMainPrompt(prev => prev ? `${prev}, ${keywordText}` : keywordText);
    toast({
      title: "Keywords Imported",
      description: `${keywords.length} keywords added to prompt`,
    });
  };

  // Generate final prompt with all settings
  const generateFinalPrompt = () => {
    let finalPrompt = mainPrompt;
    
    // Add imported keywords if any
    if (importedKeywords.length > 0) {
      finalPrompt += `, ${importedKeywords.join(", ")}`;
    }
    
    // Add quality modifiers if enabled
    if (mode === "advanced") {
      // Quality modifiers are already in the prompt
    }
    
    return finalPrompt;
  };

  // Reset all fields
  const resetAll = () => {
    setMainPrompt("");
    setNegativePrompt("");
    setPromptElements([]);
    setSelectedTemplate(null);
    setSelectedStyle("");
    setPlaceholderValues({});
    setImportedKeywords([]);
    toast({
      title: "Reset Complete",
      description: "All fields have been cleared",
    });
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Wand2 className="h-6 w-6" />
                  Prompt Generator
                </CardTitle>
                <CardDescription>
                  Build powerful prompts with templates, styles, and parameters
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  data-testid="button-history"
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAll}
                  data-testid="button-reset"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {}}>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {}}>
                      <Settings className="h-4 w-4 mr-2" />
                      Preferences
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mode Selector */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as "guided" | "advanced")} className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="guided" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Guided Mode
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Advanced Mode
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - Templates & Presets */}
              <div className="lg:col-span-1 space-y-4">
                {/* Template Categories */}
                <Collapsible 
                  open={expandedSections.has("template")}
                  onOpenChange={() => toggleSection("template")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Templates
                          </CardTitle>
                          {expandedSections.has("template") ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {templateCategories.map((cat) => (
                              <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => setSelectedCategory(cat.id)}
                                data-testid={`button-category-${cat.id}`}
                              >
                                <cat.icon className="h-4 w-4 mr-2" />
                                {cat.name}
                                <Badge variant="secondary" className="ml-auto">
                                  {cat.count}
                                </Badge>
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Style Presets */}
                <Collapsible 
                  open={expandedSections.has("style")}
                  onOpenChange={() => toggleSection("style")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Style Presets
                          </CardTitle>
                          {expandedSections.has("style") ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <ScrollArea className="h-[250px]">
                          <div className="space-y-2">
                            {stylePresets.map((style) => (
                              <Tooltip key={style.id}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={selectedStyle === style.id ? "default" : "outline"}
                                    size="sm"
                                    className="w-full justify-start text-left"
                                    onClick={() => applyStylePreset(style.id)}
                                    data-testid={`button-style-${style.id}`}
                                  >
                                    {style.name}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{style.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Model Presets */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Model Presets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedModel} onValueChange={applyModelPreset}>
                      <SelectTrigger data-testid="select-model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(modelPresets).map(([id, preset]) => (
                          <SelectItem key={id} value={id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              {/* Center - Main Prompt Builder */}
              <div className="lg:col-span-2 space-y-4">
                {/* Template Selection & Application */}
                {templates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Available Templates</CardTitle>
                      <CardDescription>
                        Select a template to start building your prompt
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedTemplate?.id === template.id 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => applyTemplate(template)}
                            data-testid={`template-${template.id}`}
                          >
                            <div className="font-medium mb-1">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.template.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Template Placeholders */}
                {selectedTemplate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customize Template</CardTitle>
                      <CardDescription>
                        Fill in the placeholders to customize your prompt
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(placeholderValues).map(([key, value]) => (
                          <div key={key}>
                            <Label htmlFor={key} className="text-sm capitalize">
                              {key.replace(/_/g, ' ')}
                            </Label>
                            <Input
                              id={key}
                              value={value}
                              onChange={(e) => updatePlaceholder(key, e.target.value)}
                              placeholder={`Enter ${key}`}
                              className="mt-1"
                              data-testid={`input-placeholder-${key}`}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Main Prompt Builder */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Prompt Builder</span>
                      {mode === "guided" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPromptElement("custom")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Element
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mode === "guided" ? (
                      <div className="space-y-4">
                        {/* Guided Mode Elements */}
                        <div className="space-y-2">
                          <Label>Prompt Elements</Label>
                          {promptElements.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No elements added yet</p>
                              <div className="flex flex-wrap gap-2 justify-center mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addPromptElement("subject", "")}
                                >
                                  Add Subject
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addPromptElement("style", "")}
                                >
                                  Add Style
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addPromptElement("quality", "")}
                                >
                                  Add Quality
                                </Button>
                              </div>
                            </div>
                          ) : (
                            promptElements.map((element) => (
                              <div key={element.id} className="flex gap-2 items-start">
                                <Select
                                  value={element.type}
                                  onValueChange={(value) => 
                                    updatePromptElement(element.id, { type: value as PromptElement["type"] })
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="subject">Subject</SelectItem>
                                    <SelectItem value="style">Style</SelectItem>
                                    <SelectItem value="quality">Quality</SelectItem>
                                    <SelectItem value="lighting">Lighting</SelectItem>
                                    <SelectItem value="composition">Composition</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={element.content}
                                  onChange={(e) => 
                                    updatePromptElement(element.id, { content: e.target.value })
                                  }
                                  placeholder={`Enter ${element.type}...`}
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  value={element.weight}
                                  onChange={(e) => 
                                    updatePromptElement(element.id, { weight: parseFloat(e.target.value) })
                                  }
                                  min="0.1"
                                  max="2"
                                  step="0.1"
                                  className="w-[80px]"
                                  placeholder="Weight"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePromptElement(element.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Advanced Mode - Direct Editing */}
                        <div>
                          <Label htmlFor="main-prompt">Main Prompt</Label>
                          <Textarea
                            id="main-prompt"
                            value={mainPrompt}
                            onChange={(e) => setMainPrompt(e.target.value)}
                            placeholder="Enter your prompt here..."
                            className="mt-1 min-h-[150px] font-mono text-sm"
                            data-testid="textarea-main-prompt"
                          />
                          <div className="flex flex-wrap gap-1 mt-2">
                            {qualityModifiers.slice(0, 5).map((modifier) => (
                              <Badge
                                key={modifier}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10"
                                onClick={() => setMainPrompt(prev => 
                                  prev ? `${prev}, ${modifier}` : modifier
                                )}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {modifier}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Negative Prompt */}
                    <Separator className="my-4" />
                    <div>
                      <Label htmlFor="negative-prompt">Negative Prompt</Label>
                      <Textarea
                        id="negative-prompt"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="Things to avoid in the image..."
                        className="mt-1 min-h-[100px] font-mono text-sm"
                        data-testid="textarea-negative-prompt"
                      />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {negativePromptSuggestions.slice(0, 5).map((suggestion) => (
                          <Badge
                            key={suggestion}
                            variant="outline"
                            className="cursor-pointer hover:bg-destructive/10"
                            onClick={() => setNegativePrompt(prev => 
                              prev ? `${prev}, ${suggestion}` : suggestion
                            )}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Imported Keywords */}
                    {importedKeywords.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div>
                          <Label>Imported Keywords</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {importedKeywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary">
                                {keyword}
                                <X
                                  className="h-3 w-3 ml-1 cursor-pointer"
                                  onClick={() => setImportedKeywords(prev => 
                                    prev.filter((_, i) => i !== index)
                                  )}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={generateVariations} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generate Variations
                      </Button>
                      <Button 
                        onClick={() => copyToClipboard(generateFinalPrompt())}
                        variant="outline"
                        data-testid="button-copy"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Prompt
                      </Button>
                      <Button 
                        onClick={saveToLibrary}
                        className="ml-auto"
                        data-testid="button-save"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save to Library
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Parameters */}
              <div className="lg:col-span-1 space-y-4">
                <Collapsible 
                  open={expandedSections.has("parameters")}
                  onOpenChange={() => toggleSection("parameters")}
                >
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Parameters
                          </CardTitle>
                          {expandedSections.has("parameters") ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {(selectedModel === "stable-diffusion" || selectedModel === "sdxl") && (
                              <>
                                {/* Stable Diffusion Parameters */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm">Steps</Label>
                                    <span className="text-sm text-muted-foreground">
                                      {parameters.steps}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[parameters.steps]}
                                    onValueChange={([v]) => setParameters(prev => ({ ...prev, steps: v }))}
                                    min={1}
                                    max={150}
                                    step={1}
                                    className="mb-2"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm">CFG Scale</Label>
                                    <span className="text-sm text-muted-foreground">
                                      {parameters.cfgScale}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[parameters.cfgScale]}
                                    onValueChange={([v]) => setParameters(prev => ({ ...prev, cfgScale: v }))}
                                    min={1}
                                    max={20}
                                    step={0.5}
                                    className="mb-2"
                                  />
                                </div>

                                <div>
                                  <Label className="text-sm">Sampler</Label>
                                  <Select
                                    value={parameters.sampler}
                                    onValueChange={(v) => setParameters(prev => ({ ...prev, sampler: v }))}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="DPM++ 2M Karras">DPM++ 2M Karras</SelectItem>
                                      <SelectItem value="DPM++ SDE Karras">DPM++ SDE Karras</SelectItem>
                                      <SelectItem value="Euler a">Euler a</SelectItem>
                                      <SelectItem value="Euler">Euler</SelectItem>
                                      <SelectItem value="DDIM">DDIM</SelectItem>
                                      <SelectItem value="UniPC">UniPC</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-sm">Width</Label>
                                    <Input
                                      type="number"
                                      value={parameters.width}
                                      onChange={(e) => setParameters(prev => ({ 
                                        ...prev, 
                                        width: parseInt(e.target.value) || 512 
                                      }))}
                                      min={64}
                                      max={2048}
                                      step={64}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Height</Label>
                                    <Input
                                      type="number"
                                      value={parameters.height}
                                      onChange={(e) => setParameters(prev => ({ 
                                        ...prev, 
                                        height: parseInt(e.target.value) || 512 
                                      }))}
                                      min={64}
                                      max={2048}
                                      step={64}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm">Seed</Label>
                                  <Input
                                    type="number"
                                    value={parameters.seed}
                                    onChange={(e) => setParameters(prev => ({ 
                                      ...prev, 
                                      seed: parseInt(e.target.value) || -1 
                                    }))}
                                    placeholder="-1 for random"
                                    className="mt-1"
                                  />
                                </div>
                              </>
                            )}

                            {selectedModel === "midjourney" && (
                              <>
                                {/* Midjourney Parameters */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm">Quality</Label>
                                    <span className="text-sm text-muted-foreground">
                                      {parameters.quality}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[parameters.quality]}
                                    onValueChange={([v]) => setParameters(prev => ({ ...prev, quality: v }))}
                                    min={0.25}
                                    max={2}
                                    step={0.25}
                                    className="mb-2"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm">Stylize</Label>
                                    <span className="text-sm text-muted-foreground">
                                      {parameters.stylize}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[parameters.stylize]}
                                    onValueChange={([v]) => setParameters(prev => ({ ...prev, stylize: v }))}
                                    min={0}
                                    max={1000}
                                    step={10}
                                    className="mb-2"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm">Chaos</Label>
                                    <span className="text-sm text-muted-foreground">
                                      {parameters.chaos}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[parameters.chaos]}
                                    onValueChange={([v]) => setParameters(prev => ({ ...prev, chaos: v }))}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="mb-2"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <Label className="text-sm">Weird</Label>
                                    <span className="text-sm text-muted-foreground">
                                      {parameters.weird}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[parameters.weird]}
                                    onValueChange={([v]) => setParameters(prev => ({ ...prev, weird: v }))}
                                    min={0}
                                    max={3000}
                                    step={50}
                                    className="mb-2"
                                  />
                                </div>

                                <div>
                                  <Label className="text-sm">Aspect Ratio</Label>
                                  <Select
                                    value={parameters.aspectRatio}
                                    onValueChange={(v) => setParameters(prev => ({ ...prev, aspectRatio: v }))}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                      <SelectItem value="16:9">16:9 (Wide)</SelectItem>
                                      <SelectItem value="9:16">9:16 (Tall)</SelectItem>
                                      <SelectItem value="4:3">4:3</SelectItem>
                                      <SelectItem value="3:4">3:4</SelectItem>
                                      <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}

                            {selectedModel === "dalle" && (
                              <>
                                {/* DALL-E Parameters */}
                                <div>
                                  <Label className="text-sm">Quality</Label>
                                  <Select
                                    value={parameters.dalleQuality}
                                    onValueChange={(v) => setParameters(prev => ({ ...prev, dalleQuality: v }))}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="standard">Standard</SelectItem>
                                      <SelectItem value="hd">HD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-sm">Style</Label>
                                  <Select
                                    value={parameters.dalleStyle}
                                    onValueChange={(v) => setParameters(prev => ({ ...prev, dalleStyle: v }))}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="vivid">Vivid</SelectItem>
                                      <SelectItem value="natural">Natural</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-sm">Size</Label>
                                  <Select
                                    value={parameters.dalleSize}
                                    onValueChange={(v) => setParameters(prev => ({ ...prev, dalleSize: v }))}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1024x1024">1024x1024</SelectItem>
                                      <SelectItem value="1792x1024">1792x1024</SelectItem>
                                      <SelectItem value="1024x1792">1024x1792</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Keyword Import Area */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Keyword Import
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4 text-muted-foreground">
                      <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        Keywords from the Dictionary will appear here
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          // Simulate importing keywords for demo
                          importKeywords(["cyberpunk", "neon lights", "rain"]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Simulate Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bottom - Prompt Preview */}
            {showPreview && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Generated Prompt Preview
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPreview(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-1">Main Prompt</Label>
                      <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                        {generateFinalPrompt() || "Your prompt will appear here..."}
                      </div>
                    </div>
                    {negativePrompt && (
                      <div>
                        <Label className="text-sm text-muted-foreground mb-1">Negative Prompt</Label>
                        <div className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                          {negativePrompt}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm text-muted-foreground">
                        {generateFinalPrompt().length} characters • 
                        {generateFinalPrompt().split(/\s+/).filter(Boolean).length} words
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            copyToClipboard(generateFinalPrompt(), "Main prompt");
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Main
                        </Button>
                        {negativePrompt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              copyToClipboard(negativePrompt, "Negative prompt");
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Negative
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Recent Prompts</DialogTitle>
              <DialogDescription>
                Your recently generated prompts
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              {recentPrompts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent prompts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPrompts.map((prompt, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-mono text-sm mb-2">{prompt}</div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMainPrompt(prompt);
                            setShowHistory(false);
                            toast({
                              title: "Prompt Loaded",
                              description: "The prompt has been loaded into the builder",
                            });
                          }}
                        >
                          Use This
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(prompt)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Prompt Modal for saving */}
      <PromptModal
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        prompt={prefilledPromptData}
        mode="create"
        onSuccess={(prompt) => {
          // Add to recent prompts
          addToRecentPrompts(mainPrompt);
          toast({
            title: "Success",
            description: "Prompt saved to library successfully!",
          });
        }}
      />
    </>
  );
}