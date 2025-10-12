import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PromptModal } from "@/components/PromptModal";
import { 
  Sparkles, Copy, Share2, Save, Plus, ImageIcon, X, ChevronUp, 
  Camera, FileText, Loader2, AlertCircle, CheckCircle, 
  Bug, MessageSquare, Settings, Dices
} from "lucide-react";

interface CharacterPreset {
  id: string | number;
  name: string;
  gender?: string;
  role?: string;
  description: string;
  is_favorite?: boolean;
  user_id?: string | null;
}

interface PromptTemplate {
  id: string | number;
  template_id?: string;
  name: string;
  description?: string;
  template?: string;
  template_type?: string;
  master_prompt: string;
  llm_provider?: string;
  llm_model?: string;
  use_happy_talk?: boolean;
  compress_prompt?: boolean;
  compression_level?: string;
}

interface DebugReportEntry {
  stage: string;
  model?: string;
  timestamp: string;
  captionLength?: number;
  serverStatus?: string;
  error?: string;
  processingTime?: number;
  success?: boolean;
  llmCallDetails?: {
    request: any;
    response: any;
    responseTime?: number;
  };
}

export default function QuickPromptComplete() {
  const { toast } = useToast();
  
  // Core state
  const [subject, setSubject] = useState("");
  const [character, setCharacter] = useState("");
  const [template, setTemplate] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeneratedSection, setShowGeneratedSection] = useState(false);
  const [sparklePopoverOpen, setSparklePopoverOpen] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [progressVisible, setProgressVisible] = useState(false);
  
  // Character state
  const [showCustomCharacterInput, setShowCustomCharacterInput] = useState(false);
  const [customCharacterInput, setCustomCharacterInput] = useState("");
  
  // Image state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageAnalysisResponse, setImageAnalysisResponse] = useState("");
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);
  const [isImageAnalysisCollapsed, setIsImageAnalysisCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Social media state
  const [socialMediaCaption, setSocialMediaCaption] = useState("");
  const [showSocialCaption, setShowSocialCaption] = useState(false);
  const [selectedSocialTone, setSelectedSocialTone] = useState("professional");
  
  // Debug state
  const [debugReport, setDebugReport] = useState<DebugReportEntry[]>([]);
  const [showDebugReport, setShowDebugReport] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  
  // JSON prompt data and random scenario state
  const [jsonPromptData, setJsonPromptData] = useState<{[key: string]: string[]} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [prepopulatedPrompt, setPrepopulatedPrompt] = useState<any>(null);
  
  // Load JSON prompt helper data
  useEffect(() => {
    fetch('/data/jsonprompthelper.json')
      .then(response => response.json())
      .then(data => setJsonPromptData(data))
      .catch((error) => {
        console.error('Failed to load JSON prompt data:', error);
        // Still try to load from API if static file fails
        fetch('/api/system-data/json-prompt-helper')
          .then(response => response.json())
          .then(data => setJsonPromptData(data))
          .catch(() => console.error('Failed to load prompt data from any source'));
      });
  }, []);
  
  // Fetch character presets
  const { data: characterPresets = [] } = useQuery<CharacterPreset[]>({
    queryKey: ['/api/system-data/character-presets'],
    select: (data: any[]) => {
      return data.map(preset => ({
        id: preset.id?.toString(),
        name: preset.name,
        gender: preset.gender,
        role: preset.role,
        description: preset.description || `${preset.gender || ''} - ${preset.role || ''}`,
        is_favorite: preset.is_favorite || false,
        user_id: preset.user_id
      }));
    }
  });
  
  // Fetch template options
  const { data: dbRuleTemplates = [] } = useQuery<PromptTemplate[]>({
    queryKey: ['/api/system-data/prompt-templates'],
    select: (data: any[]) => {
      return data.map(template => ({
        id: template.id,
        template_id: template.template_id,
        name: template.name,
        description: template.description || template.template,
        template_type: template.template_type,
        master_prompt: template.master_prompt,
        llm_provider: template.llm_provider || 'openai',
        llm_model: template.llm_model || 'gpt-4o',
        use_happy_talk: template.use_happy_talk || false,
        compress_prompt: template.compress_prompt || false,
        compression_level: template.compression_level || 'medium'
      }));
    }
  });
  
  // Restore template from localStorage
  useEffect(() => {
    const savedTemplate = localStorage.getItem('quickPrompt-selectedTemplate');
    if (savedTemplate) {
      setTemplate(savedTemplate);
    }
  }, []);
  
  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      
      // Clear previous analysis
      setImageAnalysisResponse('');
      setShowImageAnalysis(false);
      setSocialMediaCaption('');
      setShowSocialCaption(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: "Image uploaded",
        description: "Click 'Generate Prompt' to analyze the image"
      });
    }
  };
  
  // Handle image removal
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setImageAnalysisResponse('');
    setShowImageAnalysis(false);
    setSocialMediaCaption('');
    setShowSocialCaption(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle character selection
  const handleCharacterChange = (value: string) => {
    if (value === 'no-character') {
      setCharacter('');
      setShowCustomCharacterInput(false);
      setCustomCharacterInput('');
    } else if (value === 'custom-character') {
      setCharacter('custom-character');
      setShowCustomCharacterInput(true);
    } else {
      setCharacter(value);
      setShowCustomCharacterInput(false);
      setCustomCharacterInput('');
    }
  };
  
  // Handle template change
  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    localStorage.setItem('quickPrompt-selectedTemplate', value);
  };
  
  // Handle random prompt generation
  const handleRandomScenario = () => {
    if (!jsonPromptData) return;
    
    // Determine which category to use
    const categories = Object.keys(jsonPromptData);
    const categoryToUse = (selectedCategory && selectedCategory !== 'all') ? 
      selectedCategory : 
      categories[Math.floor(Math.random() * categories.length)];
    
    const categoryPrompts = jsonPromptData[categoryToUse];
    if (categoryPrompts && categoryPrompts.length > 0) {
      const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
      setSubject(randomPrompt);
      setSparklePopoverOpen(false);
      toast({
        title: "Random scenario generated!",
        description: `Selected from ${categoryToUse.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()} category`
      });
    }
  };
  
  // Main generation handler
  const handleGeneratePrompt = async () => {
    // Handle Social Media Post Caption generation
    if (template === "Social Media Post Caption") {
      if (!uploadedImage) {
        toast({
          title: "Image Required",
          description: "Please upload an image for caption generation",
          variant: "destructive"
        });
        return;
      }
      
      // Use the social media caption handler directly
      setIsGenerating(true);
      setProgressVisible(true);
      setProcessingStage('Generating caption...');
      
      // First analyze the image if not done
      if (!imageAnalysisResponse && imagePreview) {
        setProcessingStage('🔍 Analyzing image...');
        const captionResponse = await fetch('/api/caption/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imagePreview,
            model: 'custom-vision',
            captionStyle: 'Descriptive',
            captionLength: 'medium',
            customPrompt: 'Analyze this image in detail'
          })
        });
        
        if (captionResponse.ok) {
          const data = await captionResponse.json();
          setImageAnalysisResponse(data.caption);
        }
      }
      
      // Generate the social media caption
      await handleGenerateSocialCaption(selectedSocialTone);
      return;
    }
    
    // Validation for regular prompt generation
    if (!subject && !uploadedImage) {
      toast({
        title: "Input required",
        description: "Please provide a subject or upload an image",
        variant: "destructive"
      });
      return;
    }
    
    // Initialize
    setIsGenerating(true);
    setProgressVisible(true);
    setProcessingStage('Initializing...');
    setShowGeneratedSection(false);
    setShowImageAnalysis(false);
    setShowSocialCaption(false);
    setDebugReport([]);
    
    let effectiveSubject = subject;
    const debugEntries: DebugReportEntry[] = [];
    
    try {
      // Phase 1: Vision Analysis (if image provided)
      if (uploadedImage && imagePreview) {
        setProcessingStage('🔍 Analyzing image with vision model...');
        
        const visionStart = Date.now();
        const captionResponse = await fetch('/api/caption/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imagePreview,
            model: 'custom-vision',
            captionStyle: 'Descriptive',
            captionLength: 'medium',
            customPrompt: 'Analyze this image in detail for AI generation'
          })
        });
        
        const captionData = await captionResponse.json();
        
        if (captionData.success) {
          setImageAnalysisResponse(captionData.caption);
          setShowImageAnalysis(true);
          effectiveSubject = captionData.caption;
          
          debugEntries.push({
            stage: 'Vision Analysis',
            model: captionData.metadata?.model || 'Unknown',
            timestamp: new Date().toISOString(),
            captionLength: captionData.caption.length,
            serverStatus: captionData.metadata?.serverOnline ? 'online' : 'offline',
            processingTime: Date.now() - visionStart,
            success: true,
            llmCallDetails: captionData.metadata?.debugInfo || captionData.debugInfo
          });
          
          // Add debug report from vision service
          if (captionData.debugReport) {
            debugEntries.push(...captionData.debugReport);
          }
        }
      }
      
      // Phase 2: Build base prompt
      let basePrompt = effectiveSubject;
      
      if (character && character !== 'no-character') {
        if (character === 'custom-character' && customCharacterInput) {
          basePrompt = `${customCharacterInput}, ${basePrompt}`;
        } else {
          const selectedCharacter = characterPresets.find(p => p.id?.toString() === character);
          if (selectedCharacter) {
            basePrompt = `${selectedCharacter.name}, ${basePrompt}`;
          }
        }
      }
      
      // Phase 3: LLM Enhancement
      setProcessingStage('🎨 Enhancing prompt with AI...');
      
      const selectedTemplate = dbRuleTemplates.find(t => t.id?.toString() === template);
      
      if (selectedTemplate) {
        const enhanceStart = Date.now();
        const enhanceResponse = await fetch('/api/enhance-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: basePrompt,
            llmProvider: selectedTemplate.llm_provider,
            llmModel: selectedTemplate.llm_model,
            useHappyTalk: selectedTemplate.use_happy_talk,
            compressPrompt: selectedTemplate.compress_prompt,
            compressionLevel: selectedTemplate.compression_level,
            customBasePrompt: selectedTemplate.master_prompt,
            templateId: selectedTemplate.id,
            subject: subject,
            character: character === 'custom-character' ? customCharacterInput : 
                      characterPresets.find(p => p.id?.toString() === character)
          })
        });
        
        const enhanceData = await enhanceResponse.json();
        
        if (enhanceData.success) {
          setGeneratedPrompt(enhanceData.enhancedPrompt);
          
          debugEntries.push({
            stage: 'LLM Enhancement',
            model: enhanceData.diagnostics?.modelUsed || selectedTemplate.llm_model,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - enhanceStart,
            success: true,
            llmCallDetails: enhanceData.diagnostics?.llmCallDetails
          });
          
          // Add diagnostics to debug report
          if (enhanceData.diagnostics && !enhanceData.diagnostics.llmCallDetails) {
            debugEntries.push({
              stage: 'Enhancement Details',
              timestamp: new Date().toISOString(),
              ...enhanceData.diagnostics
            } as DebugReportEntry);
          }
        } else {
          // Fallback
          setGeneratedPrompt(basePrompt);
        }
      } else {
        // No template selected - use base prompt
        setGeneratedPrompt(basePrompt);
      }
      
      // Update debug report
      setDebugReport(debugEntries);
      setShowDebugReport(true); // Show the debug report after generation
      
      // Show results
      setShowGeneratedSection(true);
      setProcessingStage('');
      
      toast({
        title: "✨ Prompt generated!",
        description: "Your enhanced prompt is ready"
      });
      
    } catch (error: any) {
      console.error('Generation error:', error);
      
      debugEntries.push({
        stage: 'Error',
        timestamp: new Date().toISOString(),
        error: error.message,
        success: false
      });
      
      setDebugReport(debugEntries);
      setShowDebugReport(true); // Show debug report even on error
      
      toast({
        title: "Generation failed",
        description: error.message || "An error occurred during generation",
        variant: "destructive"
      });
      
      // Use fallback
      setGeneratedPrompt(subject || "Failed to generate prompt");
      setShowGeneratedSection(true);
      
    } finally {
      setIsGenerating(false);
      setProgressVisible(false);
      setProcessingStage('');
    }
  };
  
  // Generate social media caption
  const handleGenerateSocialCaption = async (tone: string) => {
    if (!imageAnalysisResponse) {
      toast({
        title: "No image analysis",
        description: "Please analyze an image first",
        variant: "destructive"
      });
      setIsGenerating(false);
      setProgressVisible(false);
      return;
    }
    
    try {
      setProcessingStage('✨ Generating caption...');
      const response = await fetch('/api/caption/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageAnalysis: imageAnalysisResponse,
          tone
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Set the caption as the generated prompt for Social Media Post Caption template
        setGeneratedPrompt(data.caption);
        setShowGeneratedSection(true);
        setSocialMediaCaption(data.caption);
        setShowSocialCaption(false); // Don't show separate social caption section
        
        toast({
          title: "Caption generated!",
          description: `${tone.charAt(0).toUpperCase() + tone.slice(1)} social media caption is ready`
        });
      }
    } catch (error) {
      toast({
        title: "Failed to generate caption",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProgressVisible(false);
      setProcessingStage('');
    }
  };
  
  // Copy to clipboard
  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    toast({
      title: "Copied to clipboard",
      description: "Prompt has been copied successfully"
    });
  };
  
  // Save to library - opens modal with prepopulated data
  const handleSaveToLibrary = () => {
    if (!generatedPrompt) {
      toast({
        title: "No prompt to save",
        description: "Please generate a prompt first",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare prepopulated data for the modal
    const tags = ['ai-generated', 'quick-prompt'];
    if (template) tags.push(template.toLowerCase().replace(/\s+/g, '-'));
    if (character) tags.push('character-' + character.toLowerCase().replace(/\s+/g, '-'));
    
    setPrepopulatedPrompt({
      name: subject ? `${subject.slice(0, 50)}${subject.length > 50 ? '...' : ''}` : `Enhanced prompt - ${new Date().toLocaleDateString()}`,
      promptContent: generatedPrompt,
      description: subject || 'AI-generated prompt using Quick Prompt Generator',
      tags: tags,
      category: template || 'general',
      isPublic: false,
      status: 'published',
      promptStyle: template === 'Social Media Post Caption' ? 'social' : template || '',
      promptType: imagePreview ? 'image-to-text' : 'text-to-image',
      intendedGenerator: 'midjourney',
      notes: `Generated with Quick Prompt tool${character ? `, character: ${character}` : ''}${template ? `, template: ${template}` : ''}`,
    });
    
    // Open the modal
    setShowPromptModal(true);
  };
  
  return (
    <div className="space-y-6">
      {/* Developer Mode Toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDeveloperMode(!isDeveloperMode)}
          className="text-gray-400 hover:text-gray-200"
          data-testid="button-developer-mode"
        >
          <Settings className="h-4 w-4 mr-1" />
          {isDeveloperMode ? 'Hide' : 'Show'} Developer Options
        </Button>
      </div>
      
      {/* Main Single Column Layout */}
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Subject Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="subject" className="text-sm text-gray-400">Subject</Label>
              {jsonPromptData && (
                <Popover open={sparklePopoverOpen} onOpenChange={setSparklePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-800/50"
                      data-testid="button-random-prompt"
                      title="Generate random prompt"
                    >
                      <Sparkles className="h-4 w-4 text-pink-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-gray-900 border-gray-800">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-200 text-sm">Random Prompt</h4>
                      <div className="space-y-1">
                        {/* All Categories option at the top */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start hover:bg-gray-800 text-gray-300"
                          onClick={() => {
                            const categories = Object.keys(jsonPromptData);
                            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                            const categoryPrompts = jsonPromptData[randomCategory];
                            if (categoryPrompts && categoryPrompts.length > 0) {
                              const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
                              setSubject(randomPrompt);
                              setSparklePopoverOpen(false);
                              toast({
                                title: "Random prompt generated!",
                                description: `From ${randomCategory.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}`
                              });
                            }
                          }}
                          data-testid="button-all-categories"
                        >
                          <Dices className="h-4 w-4 mr-2 text-pink-400" />
                          All Categories
                        </Button>
                        <div className="border-t border-gray-800 my-1" />
                        {/* Individual category options */}
                        {Object.keys(jsonPromptData).sort().map((category) => (
                          <Button
                            key={category}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start hover:bg-gray-800 text-gray-300 h-auto py-2"
                            onClick={() => {
                              const categoryPrompts = jsonPromptData[category];
                              if (categoryPrompts && categoryPrompts.length > 0) {
                                const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
                                setSubject(randomPrompt);
                                setSparklePopoverOpen(false);
                                toast({
                                  title: "Random prompt generated!",
                                  description: `From ${category.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}`
                                });
                              }
                            }}
                            data-testid={`button-category-${category}`}
                          >
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">
                                {category.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <span className="text-xs text-gray-400">
                                {jsonPromptData[category]?.length || 0} prompts
                              </span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <Input
              id="subject"
              placeholder="Describe what you want to generate..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-gray-800/50 border-gray-700"
              data-testid="input-subject"
            />
          </div>
          
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Image (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              data-testid="input-file-upload"
            />
            {!imagePreview ? (
              <label
                htmlFor="image-upload"
                className="flex items-center justify-center gap-2 px-3 py-2 
                         bg-gradient-to-br from-purple-700/50 to-purple-900/50 
                         border border-gray-700 rounded-md cursor-pointer 
                         hover:bg-gray-800/70 transition-colors"
                data-testid="label-upload"
              >
                <ImageIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Upload Image</span>
              </label>
            ) : (
              <div className="space-y-2">
                <div className="relative h-32 w-full rounded overflow-hidden border border-gray-700">
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-gray-900/80"
                    data-testid="button-remove-image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Character Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Character (Optional)</Label>
            <Select value={character} onValueChange={handleCharacterChange}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Select character" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-character">No Character</SelectItem>
                {characterPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id.toString()}>
                    {preset.is_favorite && "⭐ "}{preset.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom-character">
                  <Plus className="h-4 w-4 inline mr-2" />
                  Custom Character
                </SelectItem>
              </SelectContent>
            </Select>
            
            {showCustomCharacterInput && (
              <Input
                placeholder="Describe your custom character..."
                value={customCharacterInput}
                onChange={(e) => setCustomCharacterInput(e.target.value)}
                className="bg-gray-800/50 border-gray-700"
                data-testid="input-custom-character"
              />
            )}
          </div>
          
          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Enhancement Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {/* Special Options (not in database) */}
                <SelectItem value="Image Vision Analysis Only">Image Vision Analysis Only</SelectItem>
                <SelectItem value="Social Media Post Caption">Social Media Post Caption</SelectItem>
                {dbRuleTemplates.length > 0 && <div className="my-1 border-t border-gray-700" />}
                {/* Database Templates */}
                {dbRuleTemplates.map((tmpl) => (
                  <SelectItem key={tmpl.id} value={tmpl.id.toString()}>
                    {tmpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Tone Selection for Social Media Post Caption */}
          {template === "Social Media Post Caption" && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Select Tone</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "professional", label: "Professional" },
                  { value: "casual", label: "Casual" },
                  { value: "funny", label: "Funny" },
                  { value: "inspirational", label: "Inspirational" },
                  { value: "trendy", label: "Trendy" },
                  { value: "storytelling", label: "Storytelling" },
                  { value: "engaging", label: "Engaging" },
                  { value: "direct", label: "Direct" }
                ].map((tone) => (
                  <Button
                    key={tone.value}
                    variant={selectedSocialTone === tone.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSocialTone(tone.value)}
                    className={selectedSocialTone === tone.value 
                      ? "bg-purple-600 hover:bg-purple-700" 
                      : "bg-gray-800/50 border-gray-700 hover:bg-gray-700"}
                    data-testid={`button-tone-${tone.value}`}
                  >
                    {tone.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Generate Button */}
          <Button
            onClick={handleGeneratePrompt}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
            data-testid="button-generate-prompt"
          >
            {isGenerating ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating...</>
            ) : template === "Social Media Post Caption" ? (
              <><Camera className="h-5 w-5 mr-2" /> Generate Caption</>
            ) : (
              <><Sparkles className="h-5 w-5 mr-2" /> Generate Prompt</>
            )}
          </Button>
        </div>
        
        {/* Results Section */}
        <div className="space-y-4">
          {/* Progress Indicator */}
          {progressVisible && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-300">{processingStage}</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Generated Prompt */}
          {showGeneratedSection && generatedPrompt && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Generated Prompt</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPrompt}
                      className="h-8 px-2"
                      data-testid="button-copy"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveToLibrary}
                      className="h-8 px-2"
                      data-testid="button-save"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  className="min-h-[200px] bg-gray-800/50 border-gray-700"
                  data-testid="textarea-generated"
                />
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {generatedPrompt.length} characters
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Image Analysis */}
          {showImageAnalysis && imageAnalysisResponse && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-sm">Image Analysis</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsImageAnalysisCollapsed(!isImageAnalysisCollapsed)}
                    className="h-6 w-6 p-0"
                    data-testid="button-toggle-analysis"
                  >
                    <ChevronUp className={`h-4 w-4 transition-transform ${isImageAnalysisCollapsed ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              {!isImageAnalysisCollapsed && (
                <CardContent className="pt-0">
                  <div className="bg-gray-800/50 rounded p-3">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {imageAnalysisResponse}
                    </p>
                  </div>
                  
                  {/* Social Media Caption Options */}
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs text-gray-400">Generate Social Caption:</Label>
                    <div className="flex gap-2">
                      {['professional', 'casual', 'creative', 'funny'].map((tone) => (
                        <Button
                          key={tone}
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateSocialCaption(tone)}
                          className="text-xs"
                          data-testid={`button-tone-${tone}`}
                        >
                          {tone}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
          
          {/* Social Media Caption */}
          {showSocialCaption && socialMediaCaption && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-400" />
                    <CardTitle className="text-sm">Social Media Caption</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(socialMediaCaption)}
                    className="h-8 px-2"
                    data-testid="button-copy-social"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">
                    {socialMediaCaption}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Debug Report (Developer Mode) */}
          {isDeveloperMode && showDebugReport && debugReport.length > 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-yellow-400" />
                    <CardTitle className="text-sm text-gray-400">Debug Report</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDebugReport(false)}
                    className="h-6 w-6 p-0"
                    data-testid="button-hide-debug"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugReport.map((entry, idx) => (
                    <div key={idx} className="bg-gray-800/30 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.success === true && <CheckCircle className="h-3 w-3 text-green-400" />}
                        {entry.success === false && <AlertCircle className="h-3 w-3 text-red-400" />}
                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        <strong>{entry.stage}</strong>
                        {entry.model && ` - Model: ${entry.model}`}
                        {entry.processingTime && ` - ${entry.processingTime}ms`}
                        {entry.serverStatus && ` - Server: ${entry.serverStatus}`}
                      </div>
                      {entry.error && (
                        <div className="text-xs text-red-400 mt-1">
                          Error: {entry.error}
                        </div>
                      )}
                      {entry.llmCallDetails && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                            View LLM Call Details
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div className="bg-gray-900/50 rounded p-2">
                              <div className="text-xs font-semibold text-gray-300 mb-1">Request:</div>
                              <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(entry.llmCallDetails.request, null, 2)}
                              </pre>
                            </div>
                            <div className="bg-gray-900/50 rounded p-2">
                              <div className="text-xs font-semibold text-gray-300 mb-1">Response:</div>
                              <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(entry.llmCallDetails.response, null, 2)}
                              </pre>
                            </div>
                            {entry.llmCallDetails.responseTime && (
                              <div className="text-xs text-gray-400">
                                Response Time: {entry.llmCallDetails.responseTime}ms
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Prompt Save Modal */}
      <PromptModal
        open={showPromptModal}
        onOpenChange={setShowPromptModal}
        mode="create"
        prompt={prepopulatedPrompt}
        onSuccess={(savedPrompt) => {
          toast({
            title: "Prompt saved!",
            description: "Your prompt has been saved to your library"
          });
          setShowPromptModal(false);
          setPrepopulatedPrompt(null);
        }}
      />
    </div>
  );
}