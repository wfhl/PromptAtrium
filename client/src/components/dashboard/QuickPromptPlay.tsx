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
import jsonPromptData from "./jsonprompthelper.json";

// Import types
type CharacterPreset = {
  id: string;
  name: string;
  description: string;
  isFavorite?: boolean;
  isCustom?: boolean;
};

type RuleTemplate = {
  id: string;
  name: string;
  template: string;
  icon?: any;
  category?: string;
};

export default function QuickPromptPlay() {
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

  // Collapsible sections
  const [sectionsOpen, setSectionsOpen] = useState({
    template: true,
    character: true,
    subject: true,
    image: false,
  });
  
  const { isAuthenticated, user } = useAuth();
  
  // Mock character presets for now
  const characterPresets: CharacterPreset[] = [
    { id: "1", name: "Professional Model", description: "Fashion & lifestyle professional", isFavorite: true },
    { id: "2", name: "Casual Influencer", description: "Social media personality", isFavorite: false },
    { id: "3", name: "Business Executive", description: "Corporate professional", isFavorite: false },
    { id: "4", name: "Creative Artist", description: "Artistic and expressive individual", isFavorite: true },
    { id: "5", name: "Fitness Enthusiast", description: "Athletic and health-focused", isFavorite: false },
  ];

  // Mock rule templates
  const ruleTemplates: RuleTemplate[] = [
    { id: "1", name: "Photography", template: "Professional photography, {character}, {subject}, high quality, detailed", icon: Camera, category: "photography" },
    { id: "2", name: "Artistic", template: "Artistic render of {character}, {subject}, creative composition, masterpiece", icon: Palette, category: "artistic" },
    { id: "3", name: "Cinematic", template: "Cinematic shot, {character}, {subject}, dramatic lighting, movie quality", icon: Film, category: "cinematic" },
    { id: "4", name: "Portrait", template: "Portrait photography, {character}, {subject}, professional headshot", icon: UserCircle, category: "portrait" },
    { id: "5", name: "Lifestyle", template: "Lifestyle photography, {character}, {subject}, natural setting", icon: Crown, category: "lifestyle" },
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
    const categories = Object.keys(jsonPromptData);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const prompts = (jsonPromptData as any)[randomCategory];
    if (prompts && prompts.length > 0) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setSubject(randomPrompt);
      setSparklePopoverOpen(false);
      toast({
        title: "Random Prompt Added",
        description: "A random scenario has been added to the subject field",
      });
    }
  };

  const handleTemplateSelect = (selectedTemplate: RuleTemplate) => {
    setTemplate(selectedTemplate.template);
  };

  const handleCharacterSelect = (preset: CharacterPreset | string) => {
    if (preset === "custom") {
      setShowCustomCharacterInput(true);
      setCharacter("");
    } else if (typeof preset === "object") {
      setCharacter(preset.name);
      setShowCustomCharacterInput(false);
      setCustomCharacterInput("");
    }
  };

  const handleCustomCharacterApply = () => {
    if (customCharacterInput.trim()) {
      setCharacter(customCharacterInput.trim());
      setShowCustomCharacterInput(false);
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
      await apiRequest("/api/prompts", {
        method: "POST",
        body: JSON.stringify({
          title: `Quick Prompt - ${new Date().toLocaleDateString()}`,
          content: generatedPrompt,
          description: `Generated with: ${character || "No character"}, ${subject || "No subject"}`,
          category: "quick-prompt",
          isPublic: false,
        }),
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
    <div className="space-y-6">
      {/* Template Selection */}
      <Collapsible 
        open={sectionsOpen.template} 
        onOpenChange={(open) => setSectionsOpen(prev => ({...prev, template: open}))}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Template Selection
                </CardTitle>
                {sectionsOpen.template ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {ruleTemplates.map((tmpl) => {
                  const Icon = tmpl.icon || FileText;
                  return (
                    <Button
                      key={tmpl.id}
                      variant={template === tmpl.template ? "default" : "outline"}
                      className="flex flex-col items-center justify-center h-24 p-2"
                      onClick={() => handleTemplateSelect(tmpl)}
                      data-testid={`button-template-${tmpl.id}`}
                    >
                      <Icon className="h-6 w-6 mb-1" />
                      <span className="text-xs text-center">{tmpl.name}</span>
                    </Button>
                  );
                })}
              </div>
              {template && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Selected Template:</strong> {template}
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Character Selection */}
      <Collapsible 
        open={sectionsOpen.character} 
        onOpenChange={(open) => setSectionsOpen(prev => ({...prev, character: open}))}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Character/Subject
                </CardTitle>
                {sectionsOpen.character ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Preset or Enter Custom</Label>
                <Select value={character} onValueChange={(value) => handleCharacterSelect(value === "custom" ? "custom" : characterPresets.find(p => p.name === value) || "")}>
                  <SelectTrigger data-testid="select-character">
                    <SelectValue placeholder="Choose a character preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">✏️ Custom Character</SelectItem>
                    {characterPresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.name}>
                        {preset.isFavorite && "⭐ "}{preset.name} - {preset.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showCustomCharacterInput && (
                <div className="space-y-2">
                  <Label>Custom Character Description</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customCharacterInput}
                      onChange={(e) => setCustomCharacterInput(e.target.value)}
                      placeholder="E.g., Young professional woman, blonde hair..."
                      data-testid="input-custom-character"
                    />
                    <Button onClick={handleCustomCharacterApply} data-testid="button-apply-character">
                      Apply
                    </Button>
                  </div>
                </div>
              )}

              {character && !showCustomCharacterInput && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Selected Character:</strong> {character}
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Subject/Action */}
      <Collapsible 
        open={sectionsOpen.subject} 
        onOpenChange={(open) => setSectionsOpen(prev => ({...prev, subject: open}))}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Subject/Action/Scene
                </CardTitle>
                {sectionsOpen.subject ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Describe the scene or action</Label>
                  <Popover open={sparklePopoverOpen} onOpenChange={setSparklePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-random-prompt">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Random
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-3">
                        <h4 className="font-medium">Random Prompt Generator</h4>
                        <p className="text-sm text-muted-foreground">
                          Click to add a random scenario to your prompt
                        </p>
                        <Button onClick={handleRandomPrompt} className="w-full" data-testid="button-apply-random">
                          <Dices className="h-4 w-4 mr-2" />
                          Generate Random Scenario
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="E.g., walking through a sunlit garden, sitting at a coffee shop, presenting in a boardroom..."
                  className="min-h-[100px]"
                  data-testid="textarea-subject"
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Image Analysis (Optional) */}
      <Collapsible 
        open={sectionsOpen.image} 
        onOpenChange={(open) => setSectionsOpen(prev => ({...prev, image: open}))}
      >
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Image Analysis (Optional)
                </CardTitle>
                {sectionsOpen.image ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload an image to analyze</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-upload-image"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                    {uploadedImage && (
                      <Button
                        variant="default"
                        onClick={handleImageAnalysis}
                        disabled={progressVisible}
                        data-testid="button-analyze-image"
                      >
                        Analyze
                      </Button>
                    )}
                  </div>
                </div>

                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
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
                  </div>
                )}

                {progressVisible && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">{processingStage}</p>
                  </div>
                )}

                {showImageAnalysis && imageAnalysisResponse && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Analysis Result:</strong> {imageAnalysisResponse}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || (!subject && !character && !template)}
          className="min-w-[200px]"
          data-testid="button-generate"
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Prompt
            </>
          )}
        </Button>
      </div>

      {/* Generated Prompt Output */}
      {showGeneratedSection && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generated Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium whitespace-pre-wrap" data-testid="text-generated-prompt">
                {generatedPrompt}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyPrompt} data-testid="button-copy">
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleEnhancePrompt} disabled={isGenerating} data-testid="button-enhance">
                <Sparkles className="h-4 w-4 mr-1" />
                Enhance
              </Button>
              <Button variant="outline" size="sm" onClick={handleSavePrompt} data-testid="button-save">
                <Save className="h-4 w-4 mr-1" />
                Save to Library
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateSocialCaption} disabled={isGeneratingCaption} data-testid="button-social">
                <Share2 className="h-4 w-4 mr-1" />
                Social Caption
              </Button>
            </div>

            {/* Social Media Caption */}
            {showSocialCaption && socialMediaCaption && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Social Media Caption:</p>
                <p className="text-sm whitespace-pre-wrap">{socialMediaCaption}</p>
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
    </div>
  );
}