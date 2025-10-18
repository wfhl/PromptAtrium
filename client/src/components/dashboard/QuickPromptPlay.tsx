import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sparkles, Copy, Link, ExternalLink, FileText, Camera, Film, Brush, Crown, UserCircle, Share, Palette, Share2, Dices, Save, Plus, ImageIcon, X, ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link as WouterLink } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AdminModeProvider, useAdminMode } from "@/components/quickprompt/AdminModeContext";
import promptHelperData from "@/data/jsonprompthelper.json";
import { useCharacterPresets } from "@/hooks/useCharacterPresets";

type PromptStyleRuleTemplate = {
  id: number;
  name: string;
  template: string;
  icon?: any;
  category?: string;
};

function QuickPromptPlayContent() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [character, setCharacter] = useState("");
  const [template, setTemplate] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeneratedSection, setShowGeneratedSection] = useState(false);
  const [sparklePopoverOpen, setSparklePopoverOpen] = useState(false);
  const [customCharacterInput, setCustomCharacterInput] = useState("");
  const [showCustomCharacterInput, setShowCustomCharacterInput] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [progressVisible, setProgressVisible] = useState<boolean>(false);
  const [selectedVisionModel, setSelectedVisionModel] = useState('gpt-4o');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [debugReport, setDebugReport] = useState<any[]>([]);
  const [showDebugReport, setShowDebugReport] = useState(false);
  const [imageAnalysisResponse, setImageAnalysisResponse] = useState<string>('');
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);
  
  // Social media caption states
  const [socialMediaCaption, setSocialMediaCaption] = useState<string>('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showSocialCaption, setShowSocialCaption] = useState(false);

  // Collapsible sections - all open by default for better UX
  const [sectionsOpen, setSectionsOpen] = useState({
    template: true,
    character: true,
    subject: true,
    image: true,
  });
  
  const { isAuthenticated, user } = useAuth();
  const { isAdminMode, toggleAdminMode, canAccessAdmin } = useAdminMode();
  
  // Get categories from jsonprompthelper.json
  const promptCategories = Object.keys(promptHelperData);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Use character presets from database
  const { 
    presets: characterPresets, 
    isLoading: isLoadingPresets,
    createPreset,
    deletePreset,
    toggleFavorite 
  } = useCharacterPresets();

  // Mock rule templates
  // Fetch prompt style rule templates from database
  const { data: promptTemplates = [], isLoading: isLoadingStyles } = useQuery<any[]>({
    queryKey: ['/api/prompt-stylerule-templates'],
    queryFn: async () => {
      const response = await fetch('/api/prompt-stylerule-templates');
      if (!response.ok) throw new Error('Failed to fetch prompt style rule templates');
      return response.json();
    },
  });

  // Map prompt templates to UI format
  const promptstyle_ruletemplates: PromptStyleRuleTemplate[] = promptTemplates.length > 0 
    ? promptTemplates.map((tmpl) => ({
        id: tmpl.id,
        name: tmpl.name || tmpl.template_id || 'Template',
        template: tmpl.template || tmpl.description || 'Template',
        systemPrompt: tmpl.systemPrompt,
        icon: 
          (tmpl.category || '').toLowerCase().includes('photo') ? Camera :
          (tmpl.category || '').toLowerCase().includes('art') ? Palette :
          (tmpl.category || '').toLowerCase().includes('cine') || (tmpl.category || '').toLowerCase().includes('film') ? Film :
          (tmpl.category || '').toLowerCase().includes('portrait') ? UserCircle :
          (tmpl.category || '').toLowerCase().includes('life') ? Crown :
          FileText,
        category: tmpl.category || 'general'
      }))
    : [
        { id: '1', name: "Photography", template: "Professional photography, {character}, {subject}, high quality, detailed", systemPrompt: "You are a professional photography expert. Enhance the prompt for high-quality photography.", icon: Camera, category: "photography" },
        { id: '2', name: "Artistic", template: "Artistic render of {character}, {subject}, creative composition, masterpiece", systemPrompt: "You are an art director. Create stunning artistic descriptions.", icon: Palette, category: "artistic" },
        { id: '3', name: "Cinematic", template: "Cinematic shot, {character}, {subject}, dramatic lighting, movie quality", systemPrompt: "You are a cinematography expert. Create cinematic masterpiece descriptions.", icon: Film, category: "cinematic" },
        { id: '4', name: "Portrait", template: "Portrait photography, {character}, {subject}, professional headshot", systemPrompt: "You are a portrait photography specialist. Enhance for professional portraits.", icon: UserCircle, category: "portrait" },
        { id: '5', name: "Lifestyle", template: "Lifestyle photography, {character}, {subject}, natural setting", systemPrompt: "You are a lifestyle photography expert. Create engaging lifestyle imagery.", icon: Crown, category: "lifestyle" },
      ];

  const handleGenerate = () => {
    if (!subject && !character && !template) {
      toast({
        title: "Missing Input",
        description: "Please provide at least one input field",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setShowGeneratedSection(false);

    // Simulate generation delay
    setTimeout(() => {
      let prompt = template || "Create an image of";
      
      // Replace placeholders
      if (character) {
        prompt = prompt.replace(/{character}/gi, character);
      } else {
        prompt = prompt.replace(/{character}/gi, "a person");
      }
      
      if (subject) {
        prompt = prompt.replace(/{subject}/gi, subject);
      } else {
        prompt = prompt.replace(/{subject}/gi, "in a scene");
      }

      // Add any missing elements
      if (!template) {
        prompt = `${character ? character : "A person"} ${subject ? subject : "in a scene"}`;
      }

      setGeneratedPrompt(prompt);
      setShowGeneratedSection(true);
      setIsGenerating(false);
    }, 1000);
  };

  const handleCopyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    }
  };

  const handleRandomPrompt = () => {
    // Determine which category to use
    const categoryToUse = (selectedCategory && selectedCategory !== 'all') ? selectedCategory : 
      promptCategories[Math.floor(Math.random() * promptCategories.length)];
    
    const categoryPrompts = (promptHelperData as any)[categoryToUse];
    if (categoryPrompts && categoryPrompts.length > 0) {
      const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
      setSubject(randomPrompt);
      setSparklePopoverOpen(false);
      toast({
        title: "Random prompt added!",
        description: `Selected from ${categoryToUse.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()} category`,
      });
    }
  };

  const handleTemplateSelect = (selectedTemplate: PromptStyleRuleTemplate) => {
    setTemplate(selectedTemplate.template);
  };

  const handleCharacterSelect = (preset: any) => {
    if (preset === "custom") {
      setShowCustomCharacterInput(true);
      setCharacter("");
    } else if (typeof preset === "object") {
      setCharacter(preset.name);
      setShowCustomCharacterInput(false);
      setCustomCharacterInput("");
    }
  };

  const handleCustomCharacterApply = async () => {
    if (customCharacterInput.trim()) {
      const characterName = customCharacterInput.trim();
      setCharacter(characterName);
      setShowCustomCharacterInput(false);
      
      // Save custom character to database if user is authenticated
      if (isAuthenticated) {
        createPreset({
          name: characterName,
          description: `Custom character: ${characterName}`,
          role: 'Character',
          gender: 'Any',
          isFavorite: false
        });
      }
    }
  };

  const handleSaveCustomCharacter = () => {
    if (customCharacterInput.trim() && isAuthenticated) {
      createPreset({
        name: customCharacterInput.trim(),
        description: `Custom character`,
        role: 'Character',
        gender: 'Any',
        isFavorite: false
      });
      setCustomCharacterInput("");
    } else if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save custom characters",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!uploadedImage) {
      toast({
        title: "No Image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setProcessingStage("Analyzing image...");
    setProgressVisible(true);

    // Simulate image analysis
    setTimeout(() => {
      const mockAnalysis = "A person in casual attire standing in an urban environment with modern architecture in the background. The lighting suggests golden hour with warm tones. The subject appears relaxed and confident.";
      setImageAnalysisResponse(mockAnalysis);
      setShowImageAnalysis(true);
      setSubject(mockAnalysis);
      setProgressVisible(false);
      toast({
        title: "Image Analyzed",
        description: "Image analysis has been added to the subject field",
      });
    }, 2000);
  };

  const handleGenerateSocialCaption = () => {
    if (!generatedPrompt) {
      toast({
        title: "No Prompt",
        description: "Please generate a prompt first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCaption(true);
    setShowSocialCaption(false);

    // Simulate caption generation
    setTimeout(() => {
      const mockCaption = `✨ ${generatedPrompt.slice(0, 50)}... 

#AIArt #CreativePrompts #DigitalArt #PromptsDaily #AIGenerated #ArtCommunity`;
      setSocialMediaCaption(mockCaption);
      setShowSocialCaption(true);
      setIsGeneratingCaption(false);
    }, 1500);
  };

  const handleEnhancePrompt = async () => {
    if (!generatedPrompt) {
      toast({
        title: "No Prompt",
        description: "Please generate a prompt first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Simulate prompt enhancement
    setTimeout(() => {
      const enhancedPrompt = `${generatedPrompt}, ultra-detailed, photorealistic, 8k resolution, professional lighting, award-winning composition, sharp focus, depth of field`;
      setGeneratedPrompt(enhancedPrompt);
      setIsGenerating(false);
      toast({
        title: "Prompt Enhanced",
        description: "Your prompt has been enhanced with professional details",
      });
    }, 1500);
  };

  const handleSavePrompt = async () => {
    if (!generatedPrompt) {
      toast({
        title: "No Prompt",
        description: "Please generate a prompt first",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save prompts",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("POST", "/api/prompts", {
        title: `Quick Prompt - ${new Date().toLocaleDateString()}`,
        content: generatedPrompt,
        description: `Generated with: ${character || "No character"}, ${subject || "No subject"}`,
        category: "quick-prompt",
        isPublic: false,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      
      toast({
        title: "Saved!",
        description: "Prompt saved to your library",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save prompt",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Subject Field */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="subject" className="text-gray-400 text-sm">Subject</Label>
          <Sparkles className="h-4 w-4 text-pink-400" />
        </div>
        <div className="relative">
          <Textarea
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Try clicking on the pink sparkles for random inspiration?"
            className="min-h-[80px] bg-gray-900/50 border-gray-800 text-gray-200 placeholder:text-gray-600 focus:border-purple-500/50 resize-none"
            data-testid="textarea-subject"
          />
          <Popover open={sparklePopoverOpen} onOpenChange={setSparklePopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-2 hover:bg-purple-500/10"
                data-testid="button-random-prompt"
              >
                <Sparkles className="h-5 w-5 text-pink-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-gray-900 border-gray-800">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-200">Random Prompt Generator</h4>
                <p className="text-sm text-gray-400">
                  Select a category or choose random from all
                </p>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
                    <SelectValue placeholder="All Categories (Random)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="all">All Categories (Random)</SelectItem>
                    {promptCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleRandomPrompt} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                  data-testid="button-apply-random"
                >
                  <Dices className="h-4 w-4 mr-2" />
                  Generate Random Scenario
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Image Upload (Optional) */}
      <div className="space-y-2">
        <Label className="text-gray-400 text-sm">Image (Optional)</Label>
        <div className="space-y-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {!uploadedImage ? (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-purple-600/20 border-purple-600/50 hover:bg-purple-600/30 text-purple-300"
              data-testid="button-upload-image"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          ) : (
            <div className="relative">
              <img
                src={imagePreview || undefined}
                alt="Uploaded"
                className="w-full max-h-48 object-contain rounded-lg border border-gray-800"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900"
                onClick={() => {
                  setUploadedImage(null);
                  setImagePreview(null);
                  setImageAnalysisResponse("");
                  setShowImageAnalysis(false);
                }}
                data-testid="button-remove-image"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                onClick={handleImageAnalysis}
                disabled={progressVisible}
                className="mt-2 bg-purple-600 hover:bg-purple-700"
                data-testid="button-analyze-image"
              >
                Analyze Image
              </Button>
            </div>
          )}
          {progressVisible && (
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-400">{processingStage}</p>
            </div>
          )}
          {showImageAnalysis && imageAnalysisResponse && (
            <div className="p-3 bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong className="text-purple-400">Analysis Result:</strong> {imageAnalysisResponse}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Character Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="character" className="text-gray-400 text-sm">Character</Label>
          <UserCircle className="h-4 w-4 text-pink-400" />
        </div>
        <Select value={character} onValueChange={(value) => handleCharacterSelect(value === "custom" ? "custom" : characterPresets.find(p => p.name === value) || "")}>
          <SelectTrigger 
            id="character"
            className="bg-gray-900/50 border-gray-800 text-gray-200"
            data-testid="select-character"
          >
            <SelectValue placeholder="Select a character" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            <SelectItem value="custom">✏️ Custom Character</SelectItem>
            {characterPresets.map((preset) => (
              <SelectItem key={preset.id} value={preset.name}>
                {preset.isFavorite && "⭐ "}{preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showCustomCharacterInput && (
          <div className="flex gap-2">
            <Input
              value={customCharacterInput}
              onChange={(e) => setCustomCharacterInput(e.target.value)}
              placeholder="E.g., Young professional woman, blonde hair..."
              className="bg-gray-900/50 border-gray-800 text-gray-200 placeholder:text-gray-600"
              data-testid="input-custom-character"
            />
            <Button 
              onClick={handleCustomCharacterApply} 
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-apply-character"
            >
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* Prompt Style */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="template" className="text-gray-400 text-sm">Prompt Style</Label>
          <FileText className="h-4 w-4 text-pink-400" />
        </div>
        <Select value={template} onValueChange={(value) => {
          const selectedTemplate = promptstyle_ruletemplates.find(t => t.template === value);
          if (selectedTemplate) handleTemplateSelect(selectedTemplate);
        }}>
          <SelectTrigger 
            id="template"
            className="bg-gray-900/50 border-gray-800 text-gray-200"
            data-testid="select-template"
            disabled={isLoadingStyles}
          >
            <SelectValue placeholder={isLoadingStyles ? "Loading styles..." : "Select a style"} />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-800">
            {promptstyle_ruletemplates.map((tmpl) => {
              const Icon = tmpl.icon || FileText;
              return (
                <SelectItem key={tmpl.id} value={tmpl.template}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{tmpl.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>




      {/* Generate Button */}
      <div className="pt-4">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || (!subject && !character && !template)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-6 text-lg"
          data-testid="button-generate"
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Generating Enhanced Prompt...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Enhanced Prompt
            </>
          )}
        </Button>
      </div>

      {/* Generated Prompt Output */}
      {showGeneratedSection && (
        <Card className="bg-gray-900/50 border-purple-600/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Generated Prompt</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-900/70 rounded-lg border border-gray-800">
              <p className="text-sm font-medium whitespace-pre-wrap text-gray-200" data-testid="text-generated-prompt">
                {generatedPrompt}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyPrompt} 
                className="border-purple-600/50 hover:bg-purple-600/20 text-purple-300"
                data-testid="button-copy"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEnhancePrompt} 
                disabled={isGenerating} 
                className="border-purple-600/50 hover:bg-purple-600/20 text-purple-300"
                data-testid="button-enhance"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Enhance
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSavePrompt} 
                className="border-purple-600/50 hover:bg-purple-600/20 text-purple-300"
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-1" />
                Save to Library
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateSocialCaption} 
                disabled={isGeneratingCaption} 
                className="border-purple-600/50 hover:bg-purple-600/20 text-purple-300"
                data-testid="button-social"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Social Caption
              </Button>
            </div>

            {/* Social Media Caption */}
            {showSocialCaption && socialMediaCaption && (
              <div className="p-4 bg-gray-900/70 rounded-lg border border-gray-800 space-y-2">
                <p className="text-sm font-medium text-purple-400">Social Media Caption:</p>
                <p className="text-sm whitespace-pre-wrap text-gray-300">{socialMediaCaption}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(socialMediaCaption);
                    toast({
                      title: "Copied!",
                      description: "Caption copied to clipboard",
                    });
                  }}
                  className="border-purple-600/50 hover:bg-purple-600/20 text-purple-300"
                  data-testid="button-copy-caption"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Caption
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Developer Mode Toggle - Only for users with developer role */}
      {canAccessAdmin && (
        <div className="p-4 bg-gray-900/70 rounded-lg border border-purple-600/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-400">Developer Mode</p>
              <p className="text-xs text-gray-400">Access advanced features and debug info</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAdminMode}
              className={`border-purple-600/50 ${isAdminMode ? 'bg-purple-600/20 text-purple-300' : 'hover:bg-purple-600/20 text-gray-400'}`}
              data-testid="button-toggle-developer"
            >
              {isAdminMode ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          {isAdminMode && (
            <div className="mt-3 p-3 bg-gray-800/50 rounded text-xs text-gray-400">
              <p className="mb-1">Selected Category: {selectedCategory === 'all' ? 'All' : selectedCategory}</p>
              <p className="mb-1">Template Count: {promptstyle_ruletemplates.length} {promptTemplates.length > 0 ? '(from DB)' : '(default)'}</p>
              <p className="mb-1">Character Presets: {characterPresets.length}</p>
              <p>Total Categories: {promptCategories.length}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuickPromptPlay() {
  return (
    <AdminModeProvider>
      <QuickPromptPlayContent />
    </AdminModeProvider>
  );
}