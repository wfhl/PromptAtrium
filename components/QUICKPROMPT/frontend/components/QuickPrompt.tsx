import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Copy, Link, ExternalLink, FileText, Camera, Film, Brush, Crown, UserCircle, Share, Palette, Share2, Dices, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link as WouterLink } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShareToLibraryModal } from "@/components/ui/ShareToLibraryModal";
import { apiRequest } from "@/lib/queryClient";

import CompactCharacterSaveDialog from "@/components/ui/CompactCharacterSaveDialog";

// Rule templates will be fetched from database and sorted in required order

export default function QuickPrompt() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [character, setCharacter] = useState("");
  const [template, setTemplate] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sparklePopoverOpen, setSparklePopoverOpen] = useState(false);
  const [jsonPromptData, setJsonPromptData] = useState<Record<string, string[]> | null>(null);
  const [customCharacterInput, setCustomCharacterInput] = useState("");
  const [showCustomCharacterInput, setShowCustomCharacterInput] = useState(false);
  const [characterSaveModalOpen, setCharacterSaveModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Load JSON prompt data
  useEffect(() => {
    const loadJsonPromptData = async () => {
      try {
        const response = await fetch('/data/jsonprompthelper.json', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setJsonPromptData(data);
        }
      } catch (error) {
        console.error('Failed to load JSON prompt data:', error);
      }
    };

    loadJsonPromptData();
  }, []);
  
  // Fetch character presets from database
  const { data: characterPresets = [] } = useQuery({
    queryKey: ['/api/system-data/character-presets'],
    select: (data: any[]) => {
      if (!data || !Array.isArray(data)) return [];
      
      return data
        .map(preset => ({
          id: preset.id.toString(),
          name: preset.name,
          description: `${preset.gender || 'Character'} - ${preset.role || preset.description || 'Custom character'}`,
          isFavorite: preset.is_favorite || false,
          isCustom: true
        }))
        .sort((a, b) => {
          // Sort by favorite status first (favorites come first)
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          
          // Then sort alphabetically by name
          return a.name.localeCompare(b.name);
        });
    }
  });

  // Fetch prompt library categories for share modal
  const { data: promptCategories = [] } = useQuery({
    queryKey: ['/api/prompt-library/categories'],
    select: (data: any[]) => {
      if (!data || !Array.isArray(data)) return [];
      return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || ''
      }));
    }
  });

  // Fetch enhanced rule templates from database
  const { data: dbRuleTemplates = [] } = useQuery({
    queryKey: ['/api/prompt-templates'],
    select: (data: any[]) => {
      if (!data || !Array.isArray(data)) return [];
      
      // Get appropriate icon for each template type
      const getTemplateIcon = (templateType: string, templateName: string) => {
        const name = templateName.toLowerCase();
        const type = templateType.toLowerCase();
        
        if (name.includes('photography') || name.includes('photo')) return Camera;
        if (name.includes('artistic') || name.includes('art')) return Palette;
        if (name.includes('cinematic') || name.includes('director')) return Film;
        if (name.includes('style') || name.includes('enhancer')) return Brush;
        if (name.includes('glamour') || name.includes('beauty')) return Sparkles;
        if (name.includes('luxury') || name.includes('lifestyle')) return Crown;
        if (name.includes('portrait') || name.includes('beauty')) return UserCircle;
        if (name.includes('social') || name.includes('engagement')) return Share;
        
        // Fallback based on category
        if (type.includes('photography')) return Camera;
        if (type.includes('artistic')) return Palette;
        if (type.includes('cinematic')) return Film;
        if (type.includes('style')) return Brush;
        if (type.includes('glamour')) return Sparkles;
        if (type.includes('lifestyle')) return Crown;
        if (type.includes('beauty')) return UserCircle;
        if (type.includes('engagement')) return Share;
        
        return FileText; // Default icon
      };
      
      // Map templates with enhanced properties
      const mappedTemplates = data.map(template => ({
        id: template.id,
        template_id: template.template_id,
        name: template.name,
        description: template.template || template.description || `${template.template_type} enhancement`,
        template_type: template.template_type,
        master_prompt: template.master_prompt,
        llm_provider: template.llm_provider,
        llm_model: template.llm_model,
        use_happy_talk: template.use_happy_talk,
        compress_prompt: template.compress_prompt,
        compression_level: template.compression_level,
        icon: getTemplateIcon(template.template_type, template.name)
      }));
      
      // Sort with enhanced templates first, then alphabetically
      return mappedTemplates.sort((a, b) => {
        // Prioritize our new enhanced templates
        const enhancedTemplates = ['photo_master_v1', 'artistic_vision_v1', 'cinematic_director_v1', 'style_enhancer_v1', 'influencer_glamour_v1', 'lifestyle_luxury_v1', 'beauty_portrait_v1', 'social_engagement_v1'];
        const aIsEnhanced = enhancedTemplates.includes(a.template_id);
        const bIsEnhanced = enhancedTemplates.includes(b.template_id);
        
        if (aIsEnhanced && !bIsEnhanced) return -1;
        if (!aIsEnhanced && bIsEnhanced) return 1;
        
        return a.name.localeCompare(b.name);
      });
    }
  });

  // Initialize template selection with persistence and default to pipeline
  useEffect(() => {
    if (dbRuleTemplates.length > 0 && !template) {
      // Get saved template from localStorage
      const savedTemplate = localStorage.getItem('quickPrompt-selectedTemplate');
      
      if (savedTemplate) {
        // Check if saved template still exists in the list
        const templateExists = dbRuleTemplates.find(t => t.id.toString() === savedTemplate);
        if (templateExists) {
          setTemplate(savedTemplate);
          return;
        }
      }
      
      // Default to pipeline template if no saved selection or saved template doesn't exist
      const pipelineTemplate = dbRuleTemplates.find(t => 
        t.template_id === 'pipeline_174' || 
        t.name.toLowerCase().includes('pipeline') ||
        t.template_type === 'pipeline'
      );
      
      if (pipelineTemplate) {
        setTemplate(pipelineTemplate.id.toString());
      } else if (dbRuleTemplates.length > 0) {
        // Fallback to first template if pipeline not found
        setTemplate(dbRuleTemplates[0].id.toString());
      }
    }
  }, [dbRuleTemplates, template]);

  // Handle template changes with persistence
  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    localStorage.setItem('quickPrompt-selectedTemplate', value);
  };

  // Handle JSON prompt category selection
  const handleJsonPromptSelection = (category: string) => {
    if (!jsonPromptData || !jsonPromptData[category]) return;
    
    const prompts = jsonPromptData[category];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setSubject(randomPrompt);
    setSparklePopoverOpen(false);
    
    // Toast notification removed per user request
  };

  // Handle random category selection
  const handleRandomCategorySelection = () => {
    if (!jsonPromptData) return;
    
    const categories = Object.keys(jsonPromptData);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const prompts = jsonPromptData[randomCategory];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    setSubject(randomPrompt);
    setSparklePopoverOpen(false);
    
    toast({
      title: "Subject filled",
      description: `Random prompt from random "${randomCategory.replace(/_/g, ' ')}" category`,
    });
  };

  // Handle random character selection
  const handleRandomCharacter = () => {
    if (characterPresets.length === 0) return;
    
    const randomCharacter = characterPresets[Math.floor(Math.random() * characterPresets.length)];
    setCharacter(randomCharacter.id);
    
    toast({
      title: "Character selected",
      description: `Randomly chose: ${randomCharacter.name}`,
    });
  };

  // Handle random template selection
  const handleRandomTemplate = () => {
    if (dbRuleTemplates.length === 0) return;
    
    const randomTemplate = dbRuleTemplates[Math.floor(Math.random() * dbRuleTemplates.length)];
    setTemplate(randomTemplate.id.toString());
    localStorage.setItem('quickPrompt-selectedTemplate', randomTemplate.id.toString());
    
    toast({
      title: "Template selected",
      description: `Randomly chose: ${randomTemplate.name}`,
    });
  };

  // Handle custom character save - open modal
  const handleSaveCustomCharacter = () => {
    if (!customCharacterInput.trim()) {
      toast({
        title: "Character description required",
        description: "Please enter a character description to save",
        variant: "destructive",
      });
      return;
    }

    // Open the modal with pre-populated data
    setCharacterSaveModalOpen(true);
  };;

  // Handle character selection change to show/hide custom input
  const handleCharacterChange = (value: string) => {
    setCharacter(value);
    setShowCustomCharacterInput(value === "custom-character");
  };



  // Mutation for saving prompt to user library
  const saveToUserLibraryMutation = useMutation({
    mutationFn: (promptData: any) => apiRequest('/api/saved-prompts', 'POST', promptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-prompts'] });
      toast({
        title: "Prompt saved",
        description: "Added to your personal library",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Could not save prompt to library",
        variant: "destructive",
      });
    }
  });

  // Enhanced mutation for saving to user library with navigation toast
  const enhancedSaveToUserLibraryMutation = useMutation({
    mutationFn: (promptData: any) => apiRequest('/api/saved-prompts', 'POST', promptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-prompts'] });
      setShareModalOpen(false);
      toast({
        title: "Prompt saved to your library!",
        description: "Click below to view your saved prompt",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = '/prompt-library'}
            className="ml-2"
          >
            View in Library
          </Button>
        )
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Could not save prompt to your library",
        variant: "destructive",
      });
    }
  });

  const handleGeneratePrompt = async () => {
    if (!subject) {
      toast({
        title: "Subject required",
        description: "Please enter a subject for your prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Build the base prompt
      let basePrompt = subject;
      
      if (character && character !== 'no-character') {
        if (character === 'custom-character' && customCharacterInput.trim()) {
          // Use custom character input directly in prompt
          basePrompt = `${customCharacterInput.trim()}, ${basePrompt}`;
        } else {
          // Use selected character preset
          const selectedCharacter = characterPresets.find(preset => preset.id === character);
          if (selectedCharacter) {
            // Use description if available, otherwise fall back to name
            const characterDescription = selectedCharacter.description || selectedCharacter.name;
            basePrompt = `${characterDescription}, ${basePrompt}`;
          } else if (character === "character") {
            basePrompt = `character, ${basePrompt}`;
          }
        }
      }

      // Find selected template
      const selectedTemplate = dbRuleTemplates.find(t => t.id.toString() === template);
      
      if (!selectedTemplate) {
        setGeneratedPrompt(basePrompt);
        toast({
          title: "Prompt generated",
          description: "Basic prompt has been generated",
        });
        return;
      }

      // Check if this template has AI enhancement capabilities (master_prompt)
      if (selectedTemplate.master_prompt) {
        try {
          // Get complete character data to send
          let characterData = '';
          if (character && character !== 'no-character') {
            if (character === 'custom-character' && customCharacterInput.trim()) {
              characterData = customCharacterInput.trim();
            } else {
              const selectedCharacter = characterPresets.find(preset => preset.id === character);
              if (selectedCharacter) {
                // Send full character description instead of just name/ID
                characterData = selectedCharacter.description || selectedCharacter.name || '';
              }
            }
          }

          // Use AI enhancement for advanced templates
          const enhancementRequest = {
            prompt: basePrompt,
            llmProvider: selectedTemplate.llm_provider,
            llmModel: selectedTemplate.llm_model,
            useHappyTalk: selectedTemplate.use_happy_talk,
            compressPrompt: selectedTemplate.compress_prompt,
            compressionLevel: selectedTemplate.compression_level,
            customBasePrompt: selectedTemplate.master_prompt,
            subject: subject,
            character: characterData
          };

          const response = await fetch('/api/enhance-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(enhancementRequest),
          });

          if (response.ok) {
            const result = await response.json();
            setGeneratedPrompt(result.enhancedPrompt);
            toast({
              title: "Enhanced prompt generated",
              description: `AI-enhanced with ${selectedTemplate.name}`,
            });
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Enhancement API error:', errorData);
            throw new Error(`Enhancement failed: ${errorData.error || response.statusText}`);
          }
        } catch (enhancementError) {
          console.error('Error enhancing prompt:', enhancementError);
          setGeneratedPrompt(basePrompt);
          toast({
            title: "Using basic prompt",
            description: "AI enhancement unavailable, using basic prompt",
            variant: "destructive",
          });
        }
      } else {
        // Use basic template processing for legacy templates
        setGeneratedPrompt(basePrompt);
        toast({
          title: "Prompt generated",
          description: "Your quick prompt has been generated",
        });
      }
    } catch (error) {
      console.error('Error in handleGeneratePrompt:', error);
      toast({
        title: "Generation failed",
        description: "Unable to generate prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Ensure loading state is always reset
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    
    navigator.clipboard.writeText(generatedPrompt);
    toast({
      title: "Copied to clipboard",
      description: "Your prompt has been copied",
    });
  };

  return (
    <Card className="h-full bg-gradient-to-br from-purple-600/10 to-blue-600/10 border-red-500/00 hover:bg-red-500/00 border-red-500/00">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Quick Prompt</CardTitle>
          <WouterLink href="/new-prompt-generator">
            <Button variant="ghost" size="sm" className="text-primary-400 bg-transparent hover:bg-purple-900/30">
              Advanced
            </Button>
          </WouterLink>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="subject" className="text-sm text-gray-400">Subject</Label>
                {jsonPromptData && (
                  <Popover open={sparklePopoverOpen} onOpenChange={setSparklePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-pink-800/10 transition-all duration-300"
                      >
                        <Sparkles className="h-4 w-4 text-pink-400" style={{
                          filter: 'drop-shadow(0 0 1px #8b5cf6)'
                        }} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 bg-gray-900 border-gray-700" align="start">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 font-medium mb-2 px-2">
                          Fill Subject with Random Prompt
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {/* Random Choice Option */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left text-white hover:bg-gray-800 h-auto py-2 px-2 border-b border-gray-700 mb-1"
                            onClick={handleRandomCategorySelection}
                          >
                            <div className="flex items-center space-x-2">
                              <Dices className="h-4 w-4 text-pink-400" style={{
                                filter: 'drop-shadow(0 0 1px #8b5cf6)'
                              }} />
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium text-pink-400">
                                  Random Choice
                                </span>
                                <span className="text-xs text-gray-400">
                                  Pick any random category
                                </span>
                              </div>
                            </div>
                          </Button>
                          
                          {/* Category Options */}
                          {Object.keys(jsonPromptData).map((category) => (
                            <Button
                              key={category}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-left text-white hover:bg-gray-800 h-auto py-2 px-2"
                              onClick={() => handleJsonPromptSelection(category)}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">
                                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                placeholder="Try clicking on the pink sparkles for random inspiration"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-gray-800/50 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="character" className="text-sm text-gray-400">Character</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-pink-800/10 transition-all duration-300"
                  onClick={handleRandomCharacter}
                  disabled={characterPresets.length === 0}
                >
                  <Dices className="h-4 w-4 text-pink-400" style={{
                    filter: 'drop-shadow(0 0 1px #8b5cf6)'
                  }} />
                </Button>
              </div>
              <Select value={character} onValueChange={handleCharacterChange}>
                <SelectTrigger id="character" className="bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Select a character" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="no-character">No Character</SelectItem>
                  <SelectItem value="custom-character">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-green-400" />
                      <span>Custom Character</span>
                    </div>
                  </SelectItem>
                  {/* Display database character presets with favorites first */}
                  {characterPresets.length > 0 && (
                    <>
                      <SelectItem value="separator-presets" disabled>
                        --- Character Presets ---
                      </SelectItem>
                      {characterPresets.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.isFavorite ? "♥ " : ""}{preset.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              
              
              {/* Custom Character Input */}
              {showCustomCharacterInput && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Custom Character Description</Label>
                  <div className="relative">
                    <Input
                      placeholder="Describe your custom character..."
                      value={customCharacterInput}
                      onChange={(e) => setCustomCharacterInput(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 pr-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customCharacterInput.trim()) {
                          handleSaveCustomCharacter();
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700/50"
                      onClick={handleSaveCustomCharacter}
                      disabled={!customCharacterInput.trim()}
                    >
                      <Save className="h-4 w-4 text-blue-400" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Press Enter or click the save icon to add this character to your presets
                  </p>
                </div>
              )}
            </div>
            

            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="template" className="text-sm text-gray-400">Rule Template</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-pink-800/10 transition-all duration-300"
                  onClick={handleRandomTemplate}
                  disabled={dbRuleTemplates.length === 0}
                >
                  <Dices className="h-4 w-4 text-pink-400" style={{
                    filter: 'drop-shadow(0 0 1px #8b5cf6)'
                  }} />
                </Button>
              </div>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template" className="bg-gray-800/50 border-gray-700">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {dbRuleTemplates.map((template) => {
                    const IconComponent = template.icon;
                    return (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{template.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold" 
              onClick={handleGeneratePrompt}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 text-white" />
                  Generate Enhanced Prompt
                </>
              )}
            </Button>
          </div>
          
          {/* Right Column - Output */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="generated-prompt" className="text-sm text-gray-400">Generated Prompt</Label>
                {generatedPrompt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-primary-400 hover:text-primary-300"
                    onClick={handleCopyPrompt}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                )}
              </div>
              <div className="relative min-h-[160px] bg-gray-800/30 rounded-md border border-gray-700 p-3">
                {generatedPrompt ? (
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">
                    {generatedPrompt}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 flex flex-col items-center justify-center h-full">
                    <FileText className="h-8 w-8 mb-2 opacity-30" />
                    <p>Prompt will appear here</p>
                    <p className="text-xs">Fill in the form and click Generate</p>
                  </div>
                )}
              </div>
            </div>
            
            {generatedPrompt && (
              <div className="flex space-x-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 bg-gray-800/50 text-primary-400 hover:bg-gray-800 hover:text-primary-300"
                  onClick={() => {
                    const templateName = dbRuleTemplates.find(t => t.id.toString() === template)?.name || 'template';
                    const promptData = {
                      name: subject ? `Quick Prompt: ${subject.slice(0, 30)}${subject.length > 30 ? '...' : ''}` : 'Quick Prompt',
                      positive_prompt: generatedPrompt,
                      negative_prompt: '',
                      description: `Generated using ${templateName} template`,
                      tags: [subject, character === 'no-character' ? null : character].filter(Boolean),
                      template_used: templateName
                    };
                    saveToUserLibraryMutation.mutate(promptData);
                  }}
                  disabled={saveToUserLibraryMutation.isPending}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Save to Library
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-700 bg-gray-800/50 text-primary-400 hover:bg-gray-800 hover:text-primary-300"
                  onClick={() => setShareModalOpen(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Prompt
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Share to Library Modal */}
      {generatedPrompt && (
        <ShareToLibraryModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          promptData={{
            id: 0, // Temporary ID for new prompt
            name: subject ? `Quick Prompt: ${subject.slice(0, 30)}${subject.length > 30 ? '...' : ''}` : 'Quick Prompt',
            positive_prompt: generatedPrompt,
            negative_prompt: '',
            tags: [subject, character === 'no-character' ? null : character].filter(Boolean),
            template_name: dbRuleTemplates.find(t => t.id.toString() === template)?.name,
            promptStyle: dbRuleTemplates.find(t => t.id.toString() === template)?.name || 'Custom',
            character_preset: character === 'no-character' ? null : character
          }}
          onShare={(shareData) => {
            enhancedSaveToUserLibraryMutation.mutate({
              name: shareData.title,
              positive_prompt: generatedPrompt,
              negative_prompt: '',
              description: shareData.description,
              tags: shareData.tags,
              category_id: shareData.category_id,
              template_used: dbRuleTemplates.find(t => t.id.toString() === template)?.name || 'Custom',
              user_id: "1"
            });
          }}
          categories={promptCategories}
          isLoading={enhancedSaveToUserLibraryMutation.isPending}
          onNavigateToShared={() => {
            // Navigate to user's prompt library
            window.location.href = '/prompts';
          }}
        />
      )}

      {/* Compact Character Save Dialog */}
      <CompactCharacterSaveDialog
        isOpen={characterSaveModalOpen}
        onClose={() => setCharacterSaveModalOpen(false)}
        onSuccess={() => {
          // Clear the input and refresh character presets
          setCustomCharacterInput("");
          setShowCustomCharacterInput(false);
          queryClient.invalidateQueries({ queryKey: ['/api/system-data/character-presets'] });
        }}
        customCharacterInput={customCharacterInput}
      />
    </Card>
  );
}