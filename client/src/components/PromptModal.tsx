import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, ImageIcon } from "lucide-react";
import type { Prompt, Collection } from "@shared/schema";
import { PromptImageUploader } from "./PromptImageUploader";
import { PromptAIExtractor } from "./PromptAIExtractor";
import { PromptAutoFill } from "./PromptAutoFill";

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt | null;
  mode: "create" | "edit";
  defaultCollectionId?: string;
  onSuccess?: (prompt: Prompt) => void;
}

export function PromptModal({ open, onOpenChange, prompt, mode, defaultCollectionId, onSuccess }: PromptModalProps) {
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionIsPublic, setNewCollectionIsPublic] = useState(false);
  
  // States for creating new options
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCreatePromptType, setShowCreatePromptType] = useState(false);
  const [newPromptTypeName, setNewPromptTypeName] = useState("");
  const [showCreatePromptStyle, setShowCreatePromptStyle] = useState(false);
  const [newPromptStyleName, setNewPromptStyleName] = useState("");
  const [showCreateIntendedGenerator, setShowCreateIntendedGenerator] = useState(false);
  const [newIntendedGeneratorName, setNewIntendedGeneratorName] = useState("");
  const [showCreateRecommendedModel, setShowCreateRecommendedModel] = useState(false);
  const [newRecommendedModelName, setNewRecommendedModelName] = useState("");

  // Arrays to store custom options
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customPromptTypes, setCustomPromptTypes] = useState<string[]>([]);
  const [customPromptStyles, setCustomPromptStyles] = useState<string[]>([]);
  const [customIntendedGenerators, setCustomIntendedGenerators] = useState<string[]>([]);
  const [customRecommendedModels, setCustomRecommendedModels] = useState<string[]>([]);
  
  // AI extraction state
  const [showAIExtractor, setShowAIExtractor] = useState(false);
  
  // Simple initial state
  const getInitialFormData = () => {
    // If we have prepopulated data in create mode, use it
    if (mode === "create" && prompt) {
      console.log('Initializing form with prepopulated data:', prompt);
      return {
        name: prompt.name || "",
        description: "",
        category: "",
        promptContent: prompt.promptContent || "",
        negativePrompt: "",
        promptType: "",
        promptStyle: prompt.promptStyle || "",
        tags: "",
        isPublic: false,
        isNsfw: false,
        collectionId: defaultCollectionId || "none",
        license: "CC0 (Public Domain)",
        status: "published",
        exampleImages: [] as string[],
        notes: "",
        author: "",
        sourceUrl: "",
        intendedGenerator: "",
        recommendedModels: "",
        technicalParams: "",
        variables: "",
      };
    }
    
    // If we're editing, use the existing prompt data
    if (mode === "edit" && prompt) {
      console.log('Initializing form with existing prompt data:', prompt);
      return {
        name: prompt.name || "",
        description: prompt.description || "",
        category: prompt.category || "none",
        promptContent: prompt.promptContent || "",
        negativePrompt: prompt.negativePrompt || "",
        promptType: prompt.promptType || "none",
        promptStyle: prompt.promptStyle || "none",
        tags: prompt.tags?.join(", ") || "",
        isPublic: prompt.isPublic ?? true,
        isNsfw: prompt.isNsfw ?? false,
        collectionId: prompt.collectionId || "none",
        license: prompt.license || "CC0 (Public Domain)",
        status: prompt.status || "published",
        exampleImages: prompt.exampleImagesUrl || [],
        notes: prompt.notes || "",
        author: prompt.author || "",
        sourceUrl: prompt.sourceUrl || "",
        intendedGenerator: prompt.intendedGenerator || "none",
        recommendedModels: prompt.recommendedModels?.join(", ") || "",
        technicalParams: prompt.technicalParams ? JSON.stringify(prompt.technicalParams, null, 2) : "",
        variables: prompt.variables ? JSON.stringify(prompt.variables, null, 2) : "",
      };
    }
    
    // Default empty form
    return {
      name: "",
      description: "",
      category: "",
      promptContent: "",
      negativePrompt: "",
      promptType: "",
      promptStyle: "",
      tags: "",
      isPublic: false,
      isNsfw: false,
      collectionId: defaultCollectionId || "none",
      license: "CC0 (Public Domain)",
      status: "published",
      exampleImages: [] as string[],
      notes: "",
      author: "",
      sourceUrl: "",
      intendedGenerator: "",
      recommendedModels: "",
      technicalParams: "",
      variables: "",
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  
  // Use ref to track if we've populated the form for the current prompt
  const hasPopulatedRef = useRef(false);
  const lastPromptRef = useRef(prompt);
  
  // Update form data when prop changes
  useEffect(() => {
    console.log('PromptModal useEffect - open:', open, 'mode:', mode, 'prompt:', prompt);
    
    // Reset tracking when modal closes
    if (!open) {
      hasPopulatedRef.current = false;
      lastPromptRef.current = null;
      setFormData(getInitialFormData()); // Reset form when modal closes
      return;
    }
    
    // When modal opens, always update the form data based on current mode and prompt
    if (open) {
      if (mode === "edit" && prompt) {
        console.log('Edit mode - populating form with existing prompt data');
        setFormData({
          name: prompt.name || "",
          description: prompt.description || "",
          category: prompt.category || "none",
          promptContent: prompt.promptContent || "",
          negativePrompt: prompt.negativePrompt || "",
          promptType: prompt.promptType || "none",
          promptStyle: prompt.promptStyle || "none",
          tags: prompt.tags?.join(", ") || "",
          isPublic: prompt.isPublic ?? true,
          isNsfw: prompt.isNsfw ?? false,
          collectionId: prompt.collectionId || "none",
          license: prompt.license || "CC0 (Public Domain)",
          status: prompt.status || "published",
          exampleImages: prompt.exampleImagesUrl || [],
          notes: prompt.notes || "",
          author: prompt.author || "",
          sourceUrl: prompt.sourceUrl || "",
          intendedGenerator: prompt.intendedGenerator || "none",
          recommendedModels: prompt.recommendedModels?.join(", ") || "",
          technicalParams: prompt.technicalParams ? JSON.stringify(prompt.technicalParams, null, 2) : "",
          variables: prompt.variables ? JSON.stringify(prompt.variables, null, 2) : "",
        });
        hasPopulatedRef.current = true;
        lastPromptRef.current = prompt;
      } else if (mode === "create" && prompt) {
        console.log('Create mode - populating form with prepopulated data');
        console.log('Prepopulated prompt data:', prompt);
        setFormData({
          name: prompt.name || "",
          description: "",
          category: "",
          promptContent: prompt.promptContent || "",
          negativePrompt: "",
          promptType: "",
          promptStyle: prompt.promptStyle || "",
          tags: "",
          isPublic: false,
          isNsfw: false,
          collectionId: defaultCollectionId || "none",
          license: "CC0 (Public Domain)",
          status: "published",
          exampleImages: [],
          notes: "",
          author: "",
          sourceUrl: "",
          intendedGenerator: "",
          recommendedModels: "",
          technicalParams: "",
          variables: "",
        });
        hasPopulatedRef.current = true;
        lastPromptRef.current = prompt;
      } else if (mode === "create" && !prompt) {
        // Reset to empty form for create mode without prepopulated data
        console.log('Create mode - resetting to empty form');
        setFormData(getInitialFormData());
        hasPopulatedRef.current = false;
        lastPromptRef.current = null;
      }
    }
  }, [prompt, mode, open, defaultCollectionId]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: collections, refetch: refetchCollections } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: open,
  });

  // Fetch option data from database
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const { data: promptTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/prompt-types"],
    enabled: open,
  });

  const { data: promptStyles = [] } = useQuery<any[]>({
    queryKey: ["/api/prompt-styles"],
    enabled: open,
  });

  const { data: intendedGenerators = [] } = useQuery<any[]>({
    queryKey: ["/api/intended-generators"],
    enabled: open,
  });

  const { data: recommendedModels = [] } = useQuery<any[]>({
    queryKey: ["/api/recommended-models"],
    enabled: open,
  });

  // State for optimistic collection updates
  const [optimisticCollections, setOptimisticCollections] = useState<Collection[]>([]);

  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic: boolean }) => {
      const response = await apiRequest("POST", "/api/collections", {
        ...data,
        type: "user",
      });
      return await response.json();
    },
    onSuccess: (newCollection: any) => {
      // Add to optimistic state for immediate UI update
      setOptimisticCollections(prev => [...prev, newCollection]);
      setFormData({ ...formData, collectionId: newCollection.id });
      setShowCreateCollection(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      setNewCollectionIsPublic(false);
      
      // Still refetch for consistency
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      
      toast({
        title: "Success",
        description: "Collection created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  // Mutations for creating new option types
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/categories", { name });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowCreateCategory(false);
      setNewCategoryName("");
      toast({
        title: "Success",
        description: "Category created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const createPromptTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/prompt-types", { name });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-types"] });
      setShowCreatePromptType(false);
      setNewPromptTypeName("");
      toast({
        title: "Success",
        description: "Prompt type created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prompt type",
        variant: "destructive",
      });
    },
  });

  const createPromptStyleMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/prompt-styles", { name });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-styles"] });
      setShowCreatePromptStyle(false);
      setNewPromptStyleName("");
      toast({
        title: "Success",
        description: "Prompt style created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prompt style",
        variant: "destructive",
      });
    },
  });

  const createIntendedGeneratorMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/intended-generators", { name });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intended-generators"] });
      setShowCreateIntendedGenerator(false);
      setNewIntendedGeneratorName("");
      toast({
        title: "Success",
        description: "Intended generator created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create intended generator",
        variant: "destructive",
      });
    },
  });

  const createRecommendedModelMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/recommended-models", { name });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommended-models"] });
      setShowCreateRecommendedModel(false);
      setNewRecommendedModelName("");
      toast({
        title: "Success",
        description: "Recommended model created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create recommended model",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((tag: string) => tag.trim()) : [],
        tagsNormalized: data.tags ? data.tags.split(",").map((tag: string) => tag.trim().toLowerCase()) : [],
        collectionId: data.collectionId === "none" ? null : data.collectionId,
        exampleImagesUrl: data.exampleImages || [],
        recommendedModels: data.recommendedModels ? data.recommendedModels.split(",").map((model: string) => model.trim()) : [],
        technicalParams: data.technicalParams && data.technicalParams.trim() ? (() => {
          try {
            return JSON.parse(data.technicalParams);
          } catch (e) {
            console.error('Invalid JSON in technicalParams:', e);
            return null;
          }
        })() : null,
        variables: data.variables && data.variables.trim() ? (() => {
          try {
            return JSON.parse(data.variables);
          } catch (e) {
            console.error('Invalid JSON in variables:', e);
            return null;
          }
        })() : null,
      };
      const response = await apiRequest("POST", "/api/prompts", payload);
      return await response.json();
    },
    onSuccess: (createdPrompt) => {
      // Invalidate all prompt-related queries to ensure immediate UI updates
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && (
            key.startsWith('/api/prompts') || 
            key.includes('/prompts') || // This catches /api/collections/:id/prompts
            key.startsWith('/api/collections')
          );
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      // Call custom onSuccess callback if provided
      if (onSuccess) {
        onSuccess(createdPrompt);
      } else {
        toast({
          title: "Success",
          description: "Prompt created successfully!",
        });
      }
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create prompt",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((tag: string) => tag.trim()) : [],
        tagsNormalized: data.tags ? data.tags.split(",").map((tag: string) => tag.trim().toLowerCase()) : [],
        collectionId: data.collectionId === "none" ? null : data.collectionId,
        exampleImagesUrl: data.exampleImages || [],
        recommendedModels: data.recommendedModels ? data.recommendedModels.split(",").map((model: string) => model.trim()) : [],
        technicalParams: data.technicalParams && data.technicalParams.trim() ? (() => {
          try {
            return JSON.parse(data.technicalParams);
          } catch (e) {
            console.error('Invalid JSON in technicalParams:', e);
            return null;
          }
        })() : null,
        variables: data.variables && data.variables.trim() ? (() => {
          try {
            return JSON.parse(data.variables);
          } catch (e) {
            console.error('Invalid JSON in variables:', e);
            return null;
          }
        })() : null,
      };
      await apiRequest("PUT", `/api/prompts/${prompt!.id}`, payload);
    },
    onSuccess: () => {
      // Invalidate all prompt-related queries to ensure immediate UI updates
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && (
            key.startsWith('/api/prompts') || 
            key.includes('/prompts') || // This catches /api/collections/:id/prompts
            key.startsWith('/api/collections')
          );
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Success",
        description: "Prompt updated successfully!",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update prompt",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      promptContent: "",
      negativePrompt: "",
      promptType: "",
      promptStyle: "",
      tags: "",
      isPublic: true,
      isNsfw: false,
      collectionId: "none",
      license: "CC0 (Public Domain)",
      status: "published",
      exampleImages: [],
      notes: "",
      author: "",
      sourceUrl: "",
      intendedGenerator: "",
      recommendedModels: "",
      technicalParams: "",
      variables: "",
    });
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    createCollectionMutation.mutate({
      name: newCollectionName,
      description: newCollectionDescription,
      isPublic: newCollectionIsPublic,
    });
  };

  // Handle extracted data from AI image analysis
  const handleAIExtracted = (extractedData: any) => {
    const updates: any = {};
    
    if (extractedData.promptContent) {
      updates.promptContent = extractedData.promptContent;
    }
    if (extractedData.name) {
      updates.name = extractedData.name;
    }
    if (extractedData.description) {
      updates.description = extractedData.description;
    }
    if (extractedData.category) {
      updates.category = extractedData.category;
    }
    if (extractedData.tags && Array.isArray(extractedData.tags)) {
      updates.tags = extractedData.tags.join(", ");
    }
    if (extractedData.promptType) {
      updates.promptType = extractedData.promptType;
    }
    if (extractedData.promptStyle) {
      updates.promptStyle = extractedData.promptStyle;
    }
    if (extractedData.intendedGenerator) {
      updates.intendedGenerator = extractedData.intendedGenerator;
    }
    if (extractedData.recommendedModels && Array.isArray(extractedData.recommendedModels)) {
      updates.recommendedModels = extractedData.recommendedModels.join(", ");
    }
    if (extractedData.technicalParams) {
      updates.technicalParams = JSON.stringify(extractedData.technicalParams, null, 2);
    }
    if (extractedData.isNsfw !== undefined) {
      updates.isNsfw = extractedData.isNsfw;
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
    setShowAIExtractor(false);
  };

  // Handle auto-fill from prompt content
  const handleAutoFill = (generatedData: any) => {
    console.log('Auto-fill received data:', generatedData);
    const updates: any = {};
    
    if (generatedData.name) {
      updates.name = generatedData.name;
    }
    if (generatedData.description) {
      updates.description = generatedData.description;
    }
    if (generatedData.category) {
      updates.category = generatedData.category;
    }
    if (generatedData.tags && Array.isArray(generatedData.tags)) {
      updates.tags = generatedData.tags.join(", ");
    }
    if (generatedData.promptType) {
      updates.promptType = generatedData.promptType;
    }
    if (generatedData.promptStyle) {
      updates.promptStyle = generatedData.promptStyle;
    }
    if (generatedData.intendedGenerator) {
      updates.intendedGenerator = generatedData.intendedGenerator;
    }
    if (generatedData.recommendedModels && Array.isArray(generatedData.recommendedModels)) {
      updates.recommendedModels = generatedData.recommendedModels.join(", ");
    }
    if (generatedData.isNsfw !== undefined) {
      updates.isNsfw = generatedData.isNsfw;
    }
    
    console.log('Auto-fill updates to apply:', updates);
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      console.log('Auto-fill new form data:', newData);
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] backdrop-blur-md bg-transparent overflow-y-auto" data-testid="modal-prompt">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle data-testid="text-modal-title">
            {mode === "create" ? "Create New Prompt" : "Edit Prompt"}
          </DialogTitle>
          {formData.promptContent && formData.promptContent.trim().length > 10 && (
            <PromptAutoFill
              promptContent={formData.promptContent}
              onAutoFill={handleAutoFill}
              disabled={isPending}
            />
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-1">
          <Card className="mb-6 bg-gradient-to-br from-cyan-400/20 via-purple-400/20 to-purple-400/20">
                       <CardContent className="space-y-3 pt-3">
              <div>
                <Label htmlFor="name" className="text-purple-400">Prompt Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter a descriptive name..."
                  required
                  data-testid="input-name"
                />
              </div>

                          
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="promptContent" className="text-green-400">Prompt Content *</Label>
                  {/* Only show extract button when not from generator and in create mode */}
                  {mode === 'create' && !prompt?.isFromGenerator && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAIExtractor(true)}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                      data-testid="button-extract-from-image"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Extract text from screenshot
                    </Button>
                  )}
                </div>
                <Textarea
                  id="promptContent"
                  value={formData.promptContent}
                  onChange={(e) => setFormData({ ...formData, promptContent: e.target.value })}
                  placeholder="Enter your prompt content here..."
                  rows={6}
                  style={{
                    background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), rgba(20, 83, 45, 0.8)'
                  }}
                  className="font-mono text-sm bg-green-900/10"
                  required
                  data-testid="textarea-content"
                />
                <p className="text-xs text-muted-foreground mt-1">Use descriptive language for best results</p>
              </div>
            </CardContent>
          </Card>
          <Card className="mb-6 pt-3 bg-gradient-to-br from-cyan-400/20 to-purple-400/20">
            <CardContent>
               <Label htmlFor="exampleImages" className="text-pink-400">Example Images</Label>
              <PromptImageUploader
              currentImages={formData.exampleImages}
              onImagesUpdate={(imageUrls) => setFormData(prevFormData => ({ ...prevFormData, exampleImages: imageUrls }))}
              maxImages={10}
              className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Upload up to 10 example images to showcase your prompt results</p>
            </CardContent>
          </Card>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="nsfw"
              checked={formData.isNsfw}
              onCheckedChange={(checked) => setFormData({ ...formData, isNsfw: !!checked })}
              className="border-pink-400"
              data-testid="checkbox-nsfw"
            />
            <Label htmlFor="nsfw" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Mark as NSFW (Not Safe For Work)
            </Label>
          </div>
          <Card className="mb-6 pt-3 bg-gradient-to-br from-cyan-400/20 to-purple-400/20">
            <CardContent>
          <div>
            <Label htmlFor="collection" className="text-orange-400">Collection</Label>
            <Select value={formData.collectionId} onValueChange={(value) => {
              if (value === "create-new") {
                setShowCreateCollection(true);
              } else {
                setFormData({ ...formData, collectionId: value });
              }
            }}>
              <SelectTrigger data-testid="select-collection">
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="create-new" className="text-pink-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Collection
                  </div>
                </SelectItem>
                {optimisticCollections.map((collection) => (
                  <SelectItem key={`optimistic-${collection.id}`} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
                {collections?.filter(collection => 
                  !optimisticCollections.some(opt => opt.id === collection.id)
                ).map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => {
                if (value === "create-new") {
                  setShowCreateCategory(true);
                } else {
                  setFormData({ ...formData, category: value });
                }
              }}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="create-new" className="text-pink-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Category
                    </div>
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          
            <div>
              <Label htmlFor="promptType">Prompt Type</Label>
              <Select value={formData.promptType} onValueChange={(value) => {
                if (value === "create-new") {
                  setShowCreatePromptType(true);
                } else {
                  setFormData({ ...formData, promptType: value });
                }
              }}>
                <SelectTrigger data-testid="select-prompt-type">
                  <SelectValue placeholder="Select prompt type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="create-new" className="text-pink-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Type
                    </div>
                  </SelectItem>
                  {promptTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="promptStyle">Prompt Style</Label>
              <Select value={formData.promptStyle} onValueChange={(value) => {
                if (value === "create-new") {
                  setShowCreatePromptStyle(true);
                } else {
                  setFormData({ ...formData, promptStyle: value });
                }
              }}>
                <SelectTrigger data-testid="select-prompt-style">
                  <SelectValue placeholder="Select prompt style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="create-new" className="text-pink-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Style
                    </div>
                  </SelectItem>
                  {promptStyles.map((style) => (
                    <SelectItem key={style.id} value={style.name}>{style.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
            </div>
              </CardContent>
                </Card>

          <div>
            <Label htmlFor="negativePrompt" className="text-red-400">Negative Prompt (Optional)</Label>
            <Textarea
              id="negativePrompt"
              value={formData.negativePrompt}
              onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
              placeholder="Things to avoid in the generation..."
              rows={3}
              style={{
                background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), rgba(90, 20, 20, 0.8)'
              }}
              className="font-mono text-s bg-red-900/10"
              data-testid="textarea-negative"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={formData.isPublic ? "public" : "private"} onValueChange={(value) => setFormData({ ...formData, isPublic: value === "public" })}>
                <SelectTrigger data-testid="select-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div>
              <Label htmlFor="license">License</Label>
              <Select value={formData.license} onValueChange={(value) => setFormData({ ...formData, license: value })}>
                <SelectTrigger data-testid="select-license">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CC0 (Public Domain)">CC0 (Public Domain)</SelectItem>
                  <SelectItem value="CC BY (Attribution)">CC BY (Attribution)</SelectItem>
                  <SelectItem value="CC BY-SA (Share Alike)">CC BY-SA (Share Alike)</SelectItem>
                  <SelectItem value="All Rights Reserved">All Rights Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
       
          
          
          <Card className="mb-6 pt-3 bg-gradient-to-br from-teal-400/20 to-purple-400/20">
            <CardContent>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="cyberpunk, portrait, neon, futuristic..."
              data-testid="input-tags"
            />
            <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this prompt creates and how to use it..."
              rows={4}
              data-testid="textarea-description"
            />
          </div>
              </CardContent>
                </Card>
          




          
          <Card className="mb-6 bg-gradient-to-br from-blue-400/20 to-purple-400/20">
             <CardContent className="space-y-3 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Original author or creator..."
                data-testid="input-author"
              />
            </div>

            <div>
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://original-source.com..."
                data-testid="input-source-url"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="intendedGenerator">Intended Generator</Label>
              <Select value={formData.intendedGenerator} onValueChange={(value) => {
                if (value === "create-new") {
                  setShowCreateIntendedGenerator(true);
                } else {
                  setFormData({ ...formData, intendedGenerator: value });
                }
              }}>
                <SelectTrigger data-testid="select-intended-generator">
                  <SelectValue placeholder="Select AI generator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="create-new" className="text-pink-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Generator
                    </div>
                  </SelectItem>
                  {intendedGenerators.map((generator) => (
                    <SelectItem key={generator.id} value={generator.name}>{generator.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recommendedModels">Recommended Models</Label>
              <Select value={formData.recommendedModels} onValueChange={(value) => {
                if (value === "create-new") {
                  setShowCreateRecommendedModel(true);
                } else {
                  setFormData({ ...formData, recommendedModels: value });
                }
              }}>
                <SelectTrigger data-testid="select-recommended-models">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="create-new" className="text-pink-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Model
                    </div>
                  </SelectItem>
                  {recommendedModels.map((model) => (
                    <SelectItem key={model.id} value={model.name}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
               </CardContent>
                 </Card>


          

          <Card className="mb-6 bg-gradient-to-br from-yellow-400/20 to-purple-400/20">
            <CardContent className="space-y-3 pt-3">
          <div>
            <Label htmlFor="notes" className="text-yellow-400">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes, tips, or usage instructions..."
              rows={3}
              data-testid="textarea-notes"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="technicalParams">Technical Parameters (JSON)</Label>
              <Textarea
                id="technicalParams"
                value={formData.technicalParams}
                onChange={(e) => setFormData({ ...formData, technicalParams: e.target.value })}
                placeholder='{\n  "steps": 30,\n  "cfg_scale": 7.5,\n  "sampler": "DPM++ 2M"\n}'
                rows={4}
                className="font-mono text-sm"
                data-testid="textarea-technical-params"
              />
              <p className="text-xs text-muted-foreground mt-1">Valid JSON format for technical settings</p>
            </div>

            <div>
              <Label htmlFor="variables">Variables (JSON)</Label>
              <Textarea
                id="variables"
                value={formData.variables}
                onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                placeholder='{\n  "style": "photorealistic",\n  "mood": "dramatic",\n  "color_scheme": "warm"\n}'
                rows={4}
                className="font-mono text-sm"
                data-testid="textarea-variables"
              />
              <p className="text-xs text-muted-foreground mt-1">Valid JSON format for prompt variables</p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-submit"
            >
              {isPending ? "Saving..." : mode === "create" ? "Create Prompt" : "Update Prompt"}
            </Button>
          </div>
          </CardContent>
            </Card>
        </form>
      </DialogContent>
    </Dialog>

    {/* Create Collection Dialog */}
    <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
      <DialogContent className="max-w-md" data-testid="modal-create-collection">
        <DialogHeader>
          <DialogTitle data-testid="text-create-collection-title">
            Create New Collection
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="newCollectionName">Collection Name *</Label>
            <Input
              id="newCollectionName"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Enter collection name..."
              required
              data-testid="input-new-collection-name"
            />
          </div>
          
          <div>
            <Label htmlFor="newCollectionDescription">Description</Label>
            <Textarea
              id="newCollectionDescription"
              value={newCollectionDescription}
              onChange={(e) => setNewCollectionDescription(e.target.value)}
              placeholder="Describe your collection..."
              rows={3}
              data-testid="textarea-new-collection-description"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="newCollectionIsPublic"
              checked={newCollectionIsPublic}
              onChange={(e) => setNewCollectionIsPublic(e.target.checked)}
              className="h-4 w-4"
              data-testid="checkbox-new-collection-public"
            />
            <Label htmlFor="newCollectionIsPublic">Make collection public</Label>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowCreateCollection(false);
              setNewCollectionName("");
              setNewCollectionDescription("");
              setNewCollectionIsPublic(false);
            }}
            data-testid="button-cancel-collection"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCollection}
            disabled={createCollectionMutation.isPending || !newCollectionName.trim()}
            data-testid="button-create-collection"
          >
            {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Category Dialog */}
    <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
      <DialogContent className="max-w-md" data-testid="modal-create-category">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newCategory">Category Name</Label>
            <Input
              id="newCategory"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newCategoryName.trim()) {
                  createCategoryMutation.mutate(newCategoryName.trim());
                  setFormData({ ...formData, category: newCategoryName.trim() });
                }
              }}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Prompt Type Dialog */}
    <Dialog open={showCreatePromptType} onOpenChange={setShowCreatePromptType}>
      <DialogContent className="max-w-md" data-testid="modal-create-prompt-type">
        <DialogHeader>
          <DialogTitle>Create New Prompt Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newPromptType">Prompt Type Name</Label>
            <Input
              id="newPromptType"
              value={newPromptTypeName}
              onChange={(e) => setNewPromptTypeName(e.target.value)}
              placeholder="Enter prompt type name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreatePromptType(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newPromptTypeName.trim()) {
                  createPromptTypeMutation.mutate(newPromptTypeName.trim());
                  setFormData({ ...formData, promptType: newPromptTypeName.trim() });
                }
              }}
              disabled={!newPromptTypeName.trim() || createPromptTypeMutation.isPending}
            >
              {createPromptTypeMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Prompt Style Dialog */}
    <Dialog open={showCreatePromptStyle} onOpenChange={setShowCreatePromptStyle}>
      <DialogContent className="max-w-md" data-testid="modal-create-prompt-style">
        <DialogHeader>
          <DialogTitle>Create New Prompt Style</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newPromptStyle">Prompt Style Name</Label>
            <Input
              id="newPromptStyle"
              value={newPromptStyleName}
              onChange={(e) => setNewPromptStyleName(e.target.value)}
              placeholder="Enter prompt style name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreatePromptStyle(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newPromptStyleName.trim()) {
                  createPromptStyleMutation.mutate(newPromptStyleName.trim());
                  setFormData({ ...formData, promptStyle: newPromptStyleName.trim() });
                }
              }}
              disabled={!newPromptStyleName.trim() || createPromptStyleMutation.isPending}
            >
              {createPromptStyleMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Intended Generator Dialog */}
    <Dialog open={showCreateIntendedGenerator} onOpenChange={setShowCreateIntendedGenerator}>
      <DialogContent className="max-w-md" data-testid="modal-create-intended-generator">
        <DialogHeader>
          <DialogTitle>Create New AI Generator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newIntendedGenerator">Generator Name</Label>
            <Input
              id="newIntendedGenerator"
              value={newIntendedGeneratorName}
              onChange={(e) => setNewIntendedGeneratorName(e.target.value)}
              placeholder="Enter AI generator name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateIntendedGenerator(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newIntendedGeneratorName.trim()) {
                  createIntendedGeneratorMutation.mutate(newIntendedGeneratorName.trim());
                  setFormData({ ...formData, intendedGenerator: newIntendedGeneratorName.trim() });
                }
              }}
              disabled={!newIntendedGeneratorName.trim() || createIntendedGeneratorMutation.isPending}
            >
              {createIntendedGeneratorMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Recommended Model Dialog */}
    <Dialog open={showCreateRecommendedModel} onOpenChange={setShowCreateRecommendedModel}>
      <DialogContent className="max-w-md" data-testid="modal-create-recommended-model">
        <DialogHeader>
          <DialogTitle>Create New Model</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newRecommendedModel">Model Name</Label>
            <Input
              id="newRecommendedModel"
              value={newRecommendedModelName}
              onChange={(e) => setNewRecommendedModelName(e.target.value)}
              placeholder="Enter model name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateRecommendedModel(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newRecommendedModelName.trim()) {
                  createRecommendedModelMutation.mutate(newRecommendedModelName.trim());
                  setFormData({ ...formData, recommendedModels: newRecommendedModelName.trim() });
                }
              }}
              disabled={!newRecommendedModelName.trim() || createRecommendedModelMutation.isPending}
            >
              {createRecommendedModelMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* AI Prompt Extractor Modal */}
    <PromptAIExtractor
      open={showAIExtractor}
      onOpenChange={setShowAIExtractor}
      onExtracted={handleAIExtracted}
    />
    </>
  );
}
