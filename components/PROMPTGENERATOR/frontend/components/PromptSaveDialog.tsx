import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Save, Check, ExternalLink, Plus, X, Heart } from "lucide-react";

// Custom auto-fill icon component
const AutoFillIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" className={className}>
    <path stroke="currentColor" d="M13.5 1.5v1a4 4 0 0 1-4 4H8M10.5 6.5v.742a4 4 0 0 1-3.75 3.992L2.5 11.5"/>
    <path stroke="currentColor" d="M2.5 15v-3.5c0-5.523 4.477-10 10-10H14"/>
    <path fill="currentColor" d="m2.5 1 .424 1.076L4 2.5l-1.076.424L2.5 4l-.424-1.076L1 2.5l1.076-.424L2.5 1ZM11.5 10l.707 1.793L14 12.5l-1.793.707L11.5 15l-.707-1.793L9 12.5l1.793-.707L11.5 10ZM13.5 7l.424 1.076L15 8.5l-1.076.424L13.5 10l-.424-1.076L12 8.5l1.076-.424L13.5 7Z"/>
  </svg>
);
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ExampleImagesUpload } from "@/components/ui/ExampleImagesUpload";
import type { SavedPrompt, PromptFolder, PromptTag } from "@shared/schema";

interface PromptSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  templateName?: string;
  templateType?: string;
  characterPreset?: string;
  negativePrompt?: string;
  // Edit mode props
  existingPrompt?: SavedPrompt | null;
  mode?: 'create' | 'edit';
}

export default function PromptSaveDialog({ 
  isOpen, 
  onClose, 
  prompt, 
  templateName = "Generated",
  templateType = "standard",
  characterPreset,
  negativePrompt,
  existingPrompt = null,
  mode = 'create'
}: PromptSaveDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedPromptId, setSavedPromptId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [positivePrompt, setPositivePrompt] = useState(prompt);
  const [negativePromptValue, setNegativePromptValue] = useState(negativePrompt || "");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<"private" | "public" | "unlisted">("private");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [exampleImages, setExampleImages] = useState<string[]>([]);

  // Fetch folders and tags
  const { data: folders = [] } = useQuery({
    queryKey: ["/api/prompt-folders"],
    enabled: isOpen,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["/api/prompt-tags"],
    enabled: isOpen,
  });

  // Initialize form data when existingPrompt changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && existingPrompt) {
        setTitle(existingPrompt.name || "");
        setDescription(existingPrompt.description || "");
        // Handle both field names: positive_prompt (saved_prompts table) and promptContent (prompts table)
        const promptText = existingPrompt.positive_prompt || (existingPrompt as any).promptContent || "";
        setPositivePrompt(promptText);
        // Handle both field names: negative_prompt and negativePrompt
        const negativeText = existingPrompt.negative_prompt || (existingPrompt as any).negativePrompt || "";
        setNegativePromptValue(negativeText);
        // Handle both field names for folder/collection
        const folderId = existingPrompt.folder_id || (existingPrompt as any).collectionId || null;
        setSelectedFolder(folderId);
        // Handle visibility - use isPublic field if visibility is not present
        const visibilityValue = existingPrompt.visibility || 
          ((existingPrompt as any).isPublic === true ? "public" : 
           (existingPrompt as any).isPublic === false ? "private" : "private");
        setVisibility(visibilityValue as "private" | "public" | "unlisted");
        // Handle favorite field
        const isFav = existingPrompt.is_favorite || (existingPrompt as any).isFavorite || false;
        setIsFavorite(isFav);
        // Handle tags array
        const tagsList = existingPrompt.tags || (existingPrompt as any).tagsNormalized || [];
        setSelectedTags(tagsList);
        // Handle example images
        const images = existingPrompt.example_images || (existingPrompt as any).exampleImagesUrl || [];
        setExampleImages(images);
        // Handle ID - could be numeric or string
        const promptId = typeof existingPrompt.id === 'string' ? existingPrompt.id : existingPrompt.id;
        setSavedPromptId(promptId);
      } else {
        // Create mode - reset to defaults
        setTitle("");
        setDescription("");
        setPositivePrompt(prompt);
        setNegativePromptValue(negativePrompt || "");
        setSelectedFolder(null);
        setVisibility("private");
        setIsFavorite(false);
        setSelectedTags([]);
        setExampleImages([]);
        setSavedPromptId(null);
      }
      setIsSaved(false);
    }
  }, [isOpen, mode, existingPrompt, prompt, negativePrompt]);

  const autoFillMetadata = async () => {
    if (!positivePrompt) return;
    
    setIsAutoFilling(true);
    try {
      const response = await apiRequest("/api/enhance-prompt", "POST", {
        prompt: positivePrompt,
        task: "generate_metadata",
        llmProvider: "openai",
        llmModel: "gpt-4"
      });

      if (response.title) {
        setTitle(response.title);
      }
      if (response.description) {
        setDescription(response.description);
      }

      toast({
        title: "AI Enhancement Complete",
        description: "Title and description have been generated automatically",
      });
    } catch (error) {
      console.error("Error auto-filling metadata:", error);
      toast({
        title: "Enhancement Failed",
        description: "Could not generate title and description automatically",
        variant: "destructive",
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const savePrompt = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for your prompt",
        variant: "destructive",
      });
      return;
    }

    if (!positivePrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please provide prompt content",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Prepare tags array - include selected tags and automatically include template and character preset for new prompts
      const tags = [...selectedTags];
      if (mode === 'create') {
        if (templateName && templateName !== "Generated" && !tags.includes(templateName)) {
          tags.push(templateName);
        }
        if (characterPreset && !tags.includes(characterPreset)) {
          tags.push(characterPreset);
        }
      }

      const promptData = {
        name: title.trim(),
        positive_prompt: positivePrompt.trim(),
        negative_prompt: negativePromptValue.trim() || "",
        description: description.trim() || null,
        tags: tags,
        folder_id: selectedFolder,
        is_favorite: isFavorite,
        visibility: visibility,
        template_used: templateName,
        example_images: exampleImages,
        metadata: {
          templateName,
          templateType,
          characterPreset,
          negativePrompt: negativePromptValue
        }
      };

      let response;
      if (mode === 'edit' && existingPrompt) {
        response = await apiRequest(`/api/prompts/user/${existingPrompt.id}`, "PUT", promptData);
      } else {
        // Create mode - don't send base64 images in the initial save
        const createData = {
          ...promptData,
          example_images: [] // Don't include base64 images in initial save
        };
        response = await apiRequest("/api/prompts/user", "POST", createData);
        
        // Upload images after prompt is created
        if (response?.id && exampleImages.length > 0) {
          for (const base64Image of exampleImages) {
            try {
              // Convert base64 to blob
              const base64Data = base64Image.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/jpeg' });
              
              // Create FormData and upload
              const formData = new FormData();
              formData.append('image', blob, 'image.jpg');
              
              await fetch(`/api/prompts/${response.id}/images/upload`, {
                method: 'POST',
                body: formData
              });
            } catch (uploadError) {
              console.error('Error uploading image:', uploadError);
            }
          }
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-tags"] });
      
      // Store the saved prompt ID for navigation
      if (response?.id) {
        setSavedPromptId(response.id);
      } else if (existingPrompt) {
        setSavedPromptId(existingPrompt.id);
      }
      
      setIsSaved(true);
      
      toast({
        title: mode === 'edit' ? "Prompt Updated Successfully" : "Prompt Saved Successfully",
        description: mode === 'edit' ? "Your prompt has been updated" : "Your prompt has been added to the library",
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: mode === 'edit' ? "Update Failed" : "Save Failed",
        description: mode === 'edit' ? "Could not update prompt" : "Could not save prompt to library",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsSaved(false);
    setSavedPromptId(null);
    setTitle("");
    setDescription("");
    setPositivePrompt("");
    setNegativePromptValue("");
    setSelectedFolder(null);
    setVisibility("private");
    setIsFavorite(false);
    setSelectedTags([]);
    setExampleImages([]);
    onClose();
  };

  const addTag = (tagName: string) => {
    if (tagName && !selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const removeTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  if (isSaved) {
    // Show which tags were automatically applied
    const autoTags = [];
    if (templateName && templateName !== "Generated") {
      autoTags.push(templateName);
    }
    if (characterPreset) {
      autoTags.push(characterPreset);
    }

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-800 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Prompt Saved Successfully!
              </h3>
              
              {autoTags.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-300 text-sm mb-2">Auto-tagged with:</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {autoTags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-green-600/20 border border-green-500/30 text-green-300 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleClose} variant="outline" className="border-gray-600 text-gray-300">
                Close
              </Button>
              <Button 
                onClick={() => {
                  handleClose();
                  if (savedPromptId) {
                    setLocation(`/user-prompts?highlight=${savedPromptId}`);
                  } else {
                    setLocation('/user-prompts');
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Library
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-gray-900 border-gray-800 p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-white flex items-center gap-2 text-lg">
            <Save className="h-4 w-4 text-primary" />
            {mode === 'edit' ? 'Edit Prompt' : 'Save to Prompt Library'}
            <Button
              onClick={autoFillMetadata}
              disabled={isAutoFilling}
              variant="ghost"
              size="sm"
              className="h-7 px-2 ml-2 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 flex items-center gap-1.5"
            >
              {isAutoFilling ? (
                <AutoFillIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AutoFillIcon className="h-3.5 w-3.5" />
              )}
              <span className="text-xs">auto-fill</span>
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Title Input */}
          <div className="space-y-1.5">
            <Label htmlFor="prompt-title" className="text-gray-300 text-xs font-medium">
              Name *
            </Label>
            <Input
              id="prompt-title"
              placeholder={mode === 'create' ? "Enter prompt name (leave empty for auto-naming)" : "Enter prompt name"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-8 text-sm"
            />
            {mode === 'create' && !title && (
              <p className="text-xs text-gray-500">
                💡 Leave empty for AI to generate a name and tags automatically
              </p>
            )}
          </div>

          {/* Positive Prompt */}
          <div className="space-y-1.5">
            <Label htmlFor="positive-prompt" className="text-gray-300 text-xs font-medium">
              Positive Prompt *
            </Label>
            <Textarea
              id="positive-prompt"
              placeholder="Enter positive prompt"
              value={positivePrompt}
              onChange={(e) => setPositivePrompt(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[80px] resize-y text-sm"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1.5">
            <Label htmlFor="negative-prompt" className="text-gray-300 text-xs font-medium">
              Negative Prompt
            </Label>
            <Textarea
              id="negative-prompt"
              placeholder="Enter negative prompt (optional)"
              value={negativePromptValue}
              onChange={(e) => setNegativePromptValue(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[60px] resize-y text-sm"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <Label htmlFor="prompt-description" className="text-gray-300 text-xs font-medium">
              Description
            </Label>
            <Textarea
              id="prompt-description"
              placeholder="Describe what this prompt creates and how to use it effectively"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[60px] resize-y text-sm"
            />
          </div>

          {/* Folder and Visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs font-medium">Folder</Label>
              <Select
                value={selectedFolder?.toString() || "none"}
                onValueChange={(value) => setSelectedFolder(value === "none" ? null : parseInt(value))}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-8 text-sm">
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Folder</SelectItem>
                  {(folders as PromptFolder[]).map((folder: PromptFolder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs font-medium">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value: "private" | "public" | "unlisted") => setVisibility(value)}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-8 text-sm">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs font-medium">Tags</Label>
            
            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-red-100"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add new tag */}
            <div className="flex gap-2">
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) addTag(value);
                }}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-8 text-sm flex-1">
                  <SelectValue placeholder="Add existing tag..." />
                </SelectTrigger>
                <SelectContent>
                  {(tags as PromptTag[]).filter((tag: PromptTag) => !selectedTags.includes(tag.name)).map((tag: PromptTag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  const tagName = window.prompt("Enter new tag name:");
                  if (tagName) addTag(tagName);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Favorite checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_favorite" className="text-gray-300 text-xs flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Mark as favorite
            </Label>
          </div>

          {/* Example Images Upload - Now available for both create and edit */}
          <div className="border-t border-gray-700 pt-3">
            {mode === 'edit' && existingPrompt ? (
              <ExampleImagesUpload
                promptId={existingPrompt.id}
                currentImages={exampleImages}
                onImagesUpdated={setExampleImages}
                maxImages={3}
              />
            ) : (
              <ExampleImagesUpload
                promptId={0} // Temporary ID for create mode
                currentImages={exampleImages}
                onImagesUpdated={setExampleImages}
                maxImages={3}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 border-gray-600 text-gray-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={savePrompt}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 text-sm shadow-lg"
          >
            {isSaving ? (
              <>
                <Save className="h-4 w-4 mr-1.5 animate-pulse" />
                {mode === 'edit' ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                {mode === 'edit' ? 'Update Prompt' : 'Save to User Library'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}