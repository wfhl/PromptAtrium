import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus } from "lucide-react";
import type { Prompt, Collection } from "@shared/schema";
import { PromptImageUploader } from "./PromptImageUploader";

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt | null;
  mode: "create" | "edit";
}

export function PromptModal({ open, onOpenChange, prompt, mode }: PromptModalProps) {
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
  
  const [formData, setFormData] = useState({
    name: prompt?.name || "",
    description: prompt?.description || "",
    category: prompt?.category || "",
    promptContent: prompt?.promptContent || "",
    negativePrompt: prompt?.negativePrompt || "",
    promptType: prompt?.promptType || "",
    promptStyle: prompt?.promptStyle || "",
    tags: prompt?.tags?.join(", ") || "",
    isPublic: prompt?.isPublic ?? false,
    collectionId: prompt?.collectionId || "none",
    license: prompt?.license || "CC0 (Public Domain)",
    status: prompt?.status || "published",
    exampleImages: prompt?.exampleImagesUrl || [],
    notes: prompt?.notes || "",
    author: prompt?.author || "",
    sourceUrl: prompt?.sourceUrl || "",
    intendedGenerator: prompt?.intendedGenerator || "",
    recommendedModels: prompt?.recommendedModels?.join(", ") || "",
    technicalParams: prompt?.technicalParams ? JSON.stringify(prompt.technicalParams, null, 2) : "",
    variables: prompt?.variables ? JSON.stringify(prompt.variables, null, 2) : "",
  });

  // Update form data when prompt or mode changes
  useEffect(() => {
    if (mode === "edit" && prompt) {
      // Populate form with existing prompt data for editing
      setFormData({
        name: prompt.name || "",
        description: prompt.description || "",
        category: prompt.category || "",
        promptContent: prompt.promptContent || "",
        negativePrompt: prompt.negativePrompt || "",
        promptType: prompt.promptType || "",
        promptStyle: prompt.promptStyle || "",
        tags: prompt.tags?.join(", ") || "",
        isPublic: prompt.isPublic ?? true,
        collectionId: prompt.collectionId || "none",
        license: prompt.license || "CC0 (Public Domain)",
        status: prompt.status || "published",
        exampleImages: prompt.exampleImagesUrl || [],
        notes: prompt.notes || "",
        author: prompt.author || "",
        sourceUrl: prompt.sourceUrl || "",
        intendedGenerator: prompt.intendedGenerator || "",
        recommendedModels: prompt.recommendedModels?.join(", ") || "",
        technicalParams: prompt.technicalParams ? JSON.stringify(prompt.technicalParams, null, 2) : "",
        variables: prompt.variables ? JSON.stringify(prompt.variables, null, 2) : "",
      });
    } else if (mode === "create") {
      // Reset form for creating new prompt
      setFormData({
        name: "",
        description: "",
        category: "",
        promptContent: "",
        negativePrompt: "",
        promptType: "",
        promptStyle: "",
        tags: "",
        isPublic: false,
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
    }
  }, [prompt, mode]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: collections, refetch: refetchCollections } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: open,
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic: boolean }) => {
      const response = await apiRequest("POST", "/api/collections", {
        ...data,
        type: "user",
      });
      return await response.json();
    },
    onSuccess: (newCollection: any) => {
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setFormData({ ...formData, collectionId: newCollection.id });
      setShowCreateCollection(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      setNewCollectionIsPublic(false);
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
      await apiRequest("POST", "/api/prompts", payload);
    },
    onSuccess: () => {
      // Invalidate all prompt-related queries to ensure immediate UI updates
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/prompts');
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Success",
        description: "Prompt created successfully!",
      });
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
          return typeof key === 'string' && key.startsWith('/api/prompts');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-prompt">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {mode === "create" ? "Create New Prompt" : "Edit Prompt"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Prompt Name *</Label>
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
                  <SelectItem value="create-new" className="text-blue-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Category
                    </div>
                  </SelectItem>
                  <SelectItem value="Art & Design">Art & Design</SelectItem>
                  <SelectItem value="Photography">Photography</SelectItem>
                  <SelectItem value="Character Design">Character Design</SelectItem>
                  <SelectItem value="Landscape">Landscape</SelectItem>
                  <SelectItem value="Logo & Branding">Logo & Branding</SelectItem>
                  <SelectItem value="Abstract">Abstract</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
                  <SelectItem value="create-new" className="text-blue-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Type
                    </div>
                  </SelectItem>
                  <SelectItem value="text-to-image">Text to Image</SelectItem>
                  <SelectItem value="image-to-image">Image to Image</SelectItem>
                  <SelectItem value="text-generation">Text Generation</SelectItem>
                  <SelectItem value="code-generation">Code Generation</SelectItem>
                  <SelectItem value="creative-writing">Creative Writing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                  <SelectItem value="create-new" className="text-blue-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Style
                    </div>
                  </SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="artistic">Artistic</SelectItem>
                  <SelectItem value="photorealistic">Photorealistic</SelectItem>
                  <SelectItem value="abstract">Abstract</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="promptContent">Prompt Content *</Label>
            <Textarea
              id="promptContent"
              value={formData.promptContent}
              onChange={(e) => setFormData({ ...formData, promptContent: e.target.value })}
              placeholder="Enter your prompt content here..."
              rows={6}
              className="font-mono text-sm"
              required
              data-testid="textarea-content"
            />
            <p className="text-xs text-muted-foreground mt-1">Use descriptive language for best results</p>
          </div>

          <div>
            <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
            <Textarea
              id="negativePrompt"
              value={formData.negativePrompt}
              onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
              placeholder="Things to avoid in the generation..."
              rows={3}
              className="font-mono text-sm"
              data-testid="textarea-negative"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Label htmlFor="collection">Collection</Label>
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
                  <SelectItem value="create-new" className="text-blue-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Collection
                    </div>
                  </SelectItem>
                  {collections?.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="create-new" className="text-blue-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Generator
                    </div>
                  </SelectItem>
                  <SelectItem value="midjourney">Midjourney</SelectItem>
                  <SelectItem value="dalle">DALL-E</SelectItem>
                  <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                  <SelectItem value="leonardo">Leonardo AI</SelectItem>
                  <SelectItem value="firefly">Adobe Firefly</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                  <SelectItem value="create-new" className="text-blue-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Model
                    </div>
                  </SelectItem>
                  <SelectItem value="GPT-4">GPT-4</SelectItem>
                  <SelectItem value="Claude-3">Claude-3</SelectItem>
                  <SelectItem value="SDXL">SDXL</SelectItem>
                  <SelectItem value="Midjourney v6">Midjourney v6</SelectItem>
                  <SelectItem value="DALL-E 3">DALL-E 3</SelectItem>
                  <SelectItem value="Stable Diffusion">Stable Diffusion</SelectItem>
                  <SelectItem value="Leonardo AI">Leonardo AI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Example Images</Label>
            <PromptImageUploader
              currentImages={formData.exampleImages}
              onImagesUpdate={(imageUrls) => setFormData(prevFormData => ({ ...prevFormData, exampleImages: imageUrls }))}
              maxImages={5}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Upload up to 5 example images to showcase your prompt results</p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
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
                  setFormData({ ...formData, category: newCategoryName.trim() });
                  setNewCategoryName("");
                  setShowCreateCategory(false);
                }
              }}
              disabled={!newCategoryName.trim()}
            >
              Create
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
                  setFormData({ ...formData, promptType: newPromptTypeName.trim() });
                  setNewPromptTypeName("");
                  setShowCreatePromptType(false);
                }
              }}
              disabled={!newPromptTypeName.trim()}
            >
              Create
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
                  setFormData({ ...formData, promptStyle: newPromptStyleName.trim() });
                  setNewPromptStyleName("");
                  setShowCreatePromptStyle(false);
                }
              }}
              disabled={!newPromptStyleName.trim()}
            >
              Create
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
                  setFormData({ ...formData, intendedGenerator: newIntendedGeneratorName.trim() });
                  setNewIntendedGeneratorName("");
                  setShowCreateIntendedGenerator(false);
                }
              }}
              disabled={!newIntendedGeneratorName.trim()}
            >
              Create
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
                  setFormData({ ...formData, recommendedModels: newRecommendedModelName.trim() });
                  setNewRecommendedModelName("");
                  setShowCreateRecommendedModel(false);
                }
              }}
              disabled={!newRecommendedModelName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
