import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wand2,
  Settings,
  Save,
  RefreshCcw,
  ChevronDown,
  User,
  Sparkles,
  FileText,
  Shuffle,
  History,
  Info,
  Download,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Import our components
import { ComponentSelector } from "./ComponentSelector";
import { TemplateSelector, type Template } from "./TemplateSelector";
import { OutputDisplay } from "./OutputDisplay";
import { GenerationHistory, type GenerationHistoryItem } from "./GenerationHistory";

// Import the generator
import { ElitePromptGenerator } from "@/lib/prompt-generator/ElitePromptGenerator";
import type { ElitePromptOptions, GeneratedPrompt, CharacterPreset } from "@/lib/prompt-generator/types";

interface PromptGeneratorUIProps {
  className?: string;
  onSaveToLibrary?: (prompt: any) => void;
  initialOptions?: Partial<ElitePromptOptions>;
  showHistory?: boolean;
  showAdvancedSettings?: boolean;
}

// Default character presets
const DEFAULT_CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: "warrior",
    name: "Warrior",
    description: "Strong fighter character",
    gender: "neutral",
    defaultTags: "warrior, armor, strong",
    bodyTypes: "muscular build",
    roles: "fighter, soldier",
    clothing: "battle armor",
    accessories: "sword, shield",
    hairstyles: "short military cut",
  },
  {
    id: "mage",
    name: "Mage",
    description: "Magical spellcaster",
    gender: "neutral",
    defaultTags: "mage, wizard, magical",
    bodyTypes: "slender build",
    roles: "sorcerer, wizard",
    clothing: "robes, mystical attire",
    accessories: "staff, spellbook",
    hairstyles: "long flowing hair",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristic tech character",
    gender: "neutral",
    defaultTags: "cyberpunk, futuristic, tech",
    bodyTypes: "athletic build",
    roles: "hacker, netrunner",
    clothing: "tech wear, neon accents",
    accessories: "cybernetic implants",
    hairstyles: "neon colored mohawk",
  },
];

export function PromptGeneratorUI({
  className,
  onSaveToLibrary,
  initialOptions = {},
  showHistory = true,
  showAdvancedSettings = true,
}: PromptGeneratorUIProps) {
  const { toast } = useToast();
  const [generator] = useState(() => new ElitePromptGenerator());

  // Main state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard");
  const [customPrompt, setCustomPrompt] = useState("");
  const [subject, setSubject] = useState("");
  const [gender, setGender] = useState<"female" | "male" | "neutral">("neutral");
  const [selectedCharacterPreset, setSelectedCharacterPreset] = useState<string | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Record<string, Set<string>>>({});
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  
  // Advanced settings
  const [enableRandomization, setEnableRandomization] = useState(true);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [enableNegativePrompt, setEnableNegativePrompt] = useState(true);
  const [qualityPresets, setQualityPresets] = useState<string[]>(["high_quality"]);
  const [maxComponentsPerCategory, setMaxComponentsPerCategory] = useState(3);
  
  // Results
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // History (local state for now)
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("prompt-generator-history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("prompt-generator-history", JSON.stringify(history));
    }
  }, [history]);

  // Character preset selection
  const handleCharacterPresetChange = (presetId: string) => {
    setSelectedCharacterPreset(presetId);
    const preset = DEFAULT_CHARACTER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      // Apply preset to component selection
      const newComponents: Record<string, Set<string>> = {};
      
      if (preset.defaultTags) {
        newComponents.default_tags = new Set([preset.defaultTags]);
      }
      if (preset.bodyTypes) {
        newComponents.body_types = new Set([preset.bodyTypes]);
      }
      if (preset.roles) {
        newComponents.roles = new Set([preset.roles]);
      }
      if (preset.clothing) {
        newComponents.clothing = new Set([preset.clothing]);
      }
      if (preset.accessories) {
        newComponents.accessories = new Set([preset.accessories]);
      }
      if (preset.hairstyles) {
        newComponents.hairstyles = new Set([preset.hairstyles]);
      }
      
      setSelectedComponents(prev => ({ ...prev, ...newComponents }));
      if (preset.gender !== "neutral") {
        setGender(preset.gender as "female" | "male");
      }
    }
  };

  // Component selection handler
  const handleComponentsChange = (categoryId: string, components: Set<string>) => {
    setSelectedComponents(prev => ({
      ...prev,
      [categoryId]: components
    }));
  };

  // Generate prompt
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Prepare options
      const options: ElitePromptOptions = {
        custom: customPrompt || undefined,
        subject: subject || undefined,
        gender,
        selectedTemplate,
        enableRandomization,
        seed,
        enableNegativePrompt,
        qualityPresets,
        maxComponentsPerCategory,
        ...initialOptions,
      };
      
      // Add selected components to options
      Object.entries(selectedComponents).forEach(([category, values]) => {
        if (values.size > 0) {
          const valuesArray = Array.from(values);
          // Map category IDs to option keys
          const optionKey = category.replace(/_/g, "");
          (options as any)[optionKey] = valuesArray.join(", ");
        }
      });
      
      // Generate the prompt
      const result = generator.generate(options);
      setGeneratedPrompt(result);
      
      // Add to history
      const historyItem: GenerationHistoryItem = {
        id: `gen-${Date.now()}`,
        timestamp: new Date().toISOString(),
        templateName: selectedTemplate,
        templateId: selectedTemplate,
        prompt: result.original || "",
        negativePrompt: result.negativePrompt,
        options,
        formats: result,
        characterCount: result.original?.length || 0,
        qualityScore: Math.floor(Math.random() * 30) + 70, // Mock quality score
        tags: [selectedTemplate, gender],
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50
      
      toast({
        title: "Prompt generated successfully",
        description: "Your prompt is ready to use",
      });
    } catch (error) {
      console.error("Generation error:", error);
      setGenerationError("Failed to generate prompt. Please try again.");
      toast({
        title: "Generation failed",
        description: "An error occurred while generating the prompt",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    customPrompt,
    subject,
    gender,
    selectedTemplate,
    selectedComponents,
    enableRandomization,
    seed,
    enableNegativePrompt,
    qualityPresets,
    maxComponentsPerCategory,
    generator,
    toast,
    initialOptions,
  ]);

  // Save to library
  const handleSaveToLibrary = async (format: string, content: string) => {
    if (!onSaveToLibrary) return;
    
    try {
      await onSaveToLibrary({
        title: subject || "Generated Prompt",
        prompt: content,
        template: selectedTemplate,
        format,
        metadata: {
          gender,
          characterPreset: selectedCharacterPreset,
          components: Object.fromEntries(
            Object.entries(selectedComponents).map(([k, v]) => [k, Array.from(v)])
          ),
        },
      });
      
      toast({
        title: "Saved to library",
        description: "Your prompt has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save prompt to library",
        variant: "destructive",
      });
    }
  };

  // Restore history item
  const handleRestoreHistory = (item: GenerationHistoryItem) => {
    const options = item.options;
    
    setCustomPrompt(options.custom || "");
    setSubject(options.subject || "");
    setGender(options.gender || "neutral");
    setSelectedTemplate(options.selectedTemplate || "standard");
    
    // Restore component selections
    const newComponents: Record<string, Set<string>> = {};
    Object.keys(options).forEach(key => {
      const value = (options as any)[key];
      if (typeof value === "string" && key !== "custom" && key !== "subject" && key !== "gender") {
        newComponents[key] = new Set(value.split(", "));
      }
    });
    setSelectedComponents(newComponents);
    
    toast({
      title: "Settings restored",
      description: "Previous generation settings have been loaded",
    });
  };

  // Clear all settings
  const handleReset = () => {
    setCustomPrompt("");
    setSubject("");
    setGender("neutral");
    setSelectedTemplate("standard");
    setSelectedCharacterPreset(null);
    setSelectedComponents({});
    setGeneratedPrompt(null);
    setGenerationError(null);
    
    toast({
      title: "Settings reset",
      description: "All settings have been cleared",
    });
  };

  // Export history
  const handleExportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template and Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Configuration</CardTitle>
              <CardDescription>
                Configure your prompt generation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label>Template</Label>
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateChange={setSelectedTemplate}
                  showPreview={false}
                  showCategories={false}
                />
              </div>

              {/* Subject Input */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  placeholder="e.g., A majestic dragon, A futuristic city..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label htmlFor="custom">Custom Prompt (Optional)</Label>
                <Textarea
                  id="custom"
                  placeholder="Add your own custom prompt text..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Character Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Character Settings</Label>
                  <Badge variant="outline">{gender}</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={gender === "female" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("female")}
                  >
                    Female
                  </Button>
                  <Button
                    variant={gender === "male" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("male")}
                  >
                    Male
                  </Button>
                  <Button
                    variant={gender === "neutral" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGender("neutral")}
                  >
                    Neutral
                  </Button>
                </div>

                {/* Character Presets */}
                <Select value={selectedCharacterPreset || ""} onValueChange={handleCharacterPresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a character preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CHARACTER_PRESETS.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name} - {preset.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Component Selector */}
              <div className="space-y-2">
                <Label>Components</Label>
                <ComponentSelector
                  selectedComponents={selectedComponents}
                  onComponentsChange={handleComponentsChange}
                  gender={gender}
                  className="border rounded-lg"
                />
              </div>

              {/* Advanced Settings */}
              {showAdvancedSettings && (
                <Collapsible open={advancedSettingsOpen} onOpenChange={setAdvancedSettingsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Advanced Settings
                      </span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        advancedSettingsOpen && "transform rotate-180"
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="randomization">Enable Randomization</Label>
                      <Switch
                        id="randomization"
                        checked={enableRandomization}
                        onCheckedChange={setEnableRandomization}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="negative">Generate Negative Prompt</Label>
                      <Switch
                        id="negative"
                        checked={enableNegativePrompt}
                        onCheckedChange={setEnableNegativePrompt}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="seed">Seed (Optional)</Label>
                      <Input
                        id="seed"
                        type="number"
                        placeholder="Leave empty for random"
                        value={seed || ""}
                        onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Max Components Per Category</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[maxComponentsPerCategory]}
                          onValueChange={([v]) => setMaxComponentsPerCategory(v)}
                          min={1}
                          max={10}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-8">{maxComponentsPerCategory}</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Prompt
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isGenerating}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Display */}
          <OutputDisplay
            generatedPrompt={generatedPrompt}
            onSaveToLibrary={handleSaveToLibrary}
            isGenerating={isGenerating}
            error={generationError}
          />
        </div>

        {/* Sidebar - History */}
        {showHistory && (
          <div className="lg:col-span-1">
            <GenerationHistory
              history={history}
              onRestoreItem={handleRestoreHistory}
              onDeleteItem={(id) => setHistory(prev => prev.filter(item => item.id !== id))}
              onClearHistory={() => {
                setHistory([]);
                localStorage.removeItem("prompt-generator-history");
              }}
              onExportHistory={handleExportHistory}
            />
          </div>
        )}
      </div>
    </div>
  );
}