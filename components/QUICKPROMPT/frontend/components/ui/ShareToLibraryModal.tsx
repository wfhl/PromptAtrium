import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Share2, Eye, Globe, Users, Copy, Download, Mail, ExternalLink, Folder, FolderOpen, ImageIcon, AlertCircle } from "lucide-react";
import { ExampleImagesUpload } from "./ExampleImagesUpload";

// Custom auto-fill icon component
const AutoFillIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" className={className}>
    <path stroke="currentColor" d="M13.5 1.5v1a4 4 0 0 1-4 4H8M10.5 6.5v.742a4 4 0 0 1-3.75 3.992L2.5 11.5"/>
    <path stroke="currentColor" d="M2.5 15v-3.5c0-5.523 4.477-10 10-10H14"/>
    <path fill="currentColor" d="m2.5 1 .424 1.076L4 2.5l-1.076.424L2.5 4l-.424-1.076L1 2.5l1.076-.424L2.5 1ZM11.5 10l.707 1.793L14 12.5l-1.793.707L11.5 15l-.707-1.793L9 12.5l1.793-.707L11.5 10ZM13.5 7l.424 1.076L15 8.5l-1.076.424L13.5 10l-.424-1.076L12 8.5l1.076-.424L13.5 7Z"/>
  </svg>
);
import { SiGoogledrive } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface ShareToLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptData: {
    id: number;
    name: string;
    positive_prompt: string;
    negative_prompt?: string;
    tags?: string[];
    template_name?: string;
    character_preset?: string;
    example_images?: string[];
  } | null;
  onShare: (data: {
    title: string;
    description: string;
    category_id: number;
    tags: string[];
    folder_id?: number;
    example_images?: string[];
  }) => void;
  categories: Array<{ id: number; name: string; description?: string }>;
  folders?: Array<{ id: number; name: string; color?: string }>;
  isLoading?: boolean;
  onNavigateToShared?: () => void;
  mode?: 'save-to-user' | 'send-to-shared';
}

export function ShareToLibraryModal({
  open,
  onOpenChange,
  promptData,
  onShare,
  categories,
  folders = [],
  isLoading = false,
  onNavigateToShared,
  mode = 'save-to-user'
}: ShareToLibraryModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  // Removed visibility - always save as private to user library
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [exampleImages, setExampleImages] = useState<string[]>([]);

  // Auto-fill metadata using AI
  const autoFillMetadata = async () => {
    if (!promptData) return;
    
    setIsAutoFilling(true);
    try {
      const response = await fetch('/api/generate-prompt-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptData.positive_prompt,
          characterPreset: promptData.character_preset || "",
          templateName: promptData.template_name || "custom"
        })
      });
      
      if (response.ok) {
        const { title: suggestedTitle, description: suggestedDescription, tags: suggestedTags, category: suggestedCategory } = await response.json();
        
        // Only fill empty fields or default "Quick Prompt" title
        if ((!title.trim() || title.trim() === "Quick Prompt") && suggestedTitle) {
          setTitle(suggestedTitle);
        }
        if (!description.trim() && suggestedDescription) {
          setDescription(suggestedDescription);
        }
        
        // Auto-select category if not selected and we have a suggestion
        if (!categoryId && suggestedCategory) {
          // Try to find category by name (case insensitive)
          const matchingCategory = categories.find(cat => 
            cat.name.toLowerCase().includes(suggestedCategory.toLowerCase()) ||
            suggestedCategory.toLowerCase().includes(cat.name.toLowerCase())
          );
          if (matchingCategory) {
            setCategoryId(matchingCategory.id);
          } else if (categories.length > 0) {
            // Fallback to first category if no match found
            setCategoryId(categories[0].id);
          }
        }
        
        // Merge AI-generated tags with existing ones
        if (suggestedTags && Array.isArray(suggestedTags)) {
          const newTags = suggestedTags.filter((tag: string) => !tags.includes(tag));
          if (newTags.length > 0) {
            setTags(prev => [...prev, ...newTags]);
          }
        }
        
        setHasAutoFilled(true);
        toast({
          title: "Auto-filled with AI",
          description: "Generated name, description, tags, and category automatically"
        });
      } else {
        toast({
          title: "Auto-fill failed",
          description: "Could not generate metadata. Please fill manually.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast({
        title: "Auto-fill failed",
        description: "Could not generate metadata. Please fill manually.",
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Initialize form when modal opens
  useEffect(() => {
    if (open && promptData) {
      // Only reset fields if modal is first opening (not auto-filled)
      if (!hasAutoFilled) {
        setTitle(promptData.name || "");
        setDescription(""); // No description field in promptData interface
      }
      setCategoryId(null);
      
      // Initialize example images from promptData
      setExampleImages(promptData.example_images || []);
      
      // Include existing tags plus template and character preset tags
      const initialTags = [...(promptData.tags || [])];
      if (promptData.template_name && promptData.template_name !== "custom") {
        initialTags.push(promptData.template_name);
      }
      if (promptData.character_preset) {
        initialTags.push(promptData.character_preset);
      }
      setTags(Array.from(new Set(initialTags)));
    }
  }, [open, promptData]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    // Check for required fields - category is no longer required
    const missingFields = [];
    if (!title.trim()) missingFields.push("title");

    if (missingFields.length > 0) {
      // Show dialog asking if user wants AI to auto-fill
      const shouldAutoFill = confirm(
        `Missing required fields: ${missingFields.join(", ")}.\n\nWould you like AI to auto-fill these fields for you?`
      );
      
      if (shouldAutoFill) {
        await autoFillMetadata();
        
        // Auto-select first category if none selected
        if (!categoryId && categories.length > 0) {
          setCategoryId(categories[0].id);
        }
        
        // Check again after auto-fill
        if (!title.trim()) {
          toast({
            title: "Auto-fill incomplete",
            description: "Please manually enter a title",
            variant: "destructive"
          });
          return;
        }
      } else {
        toast({
          title: "Missing required fields",
          description: `Please fill in: ${missingFields.join(", ")}`,
          variant: "destructive"
        });
        return;
      }
    }

    // Ensure we have a valid category ID for send-to-shared mode
    // Use fallback mechanism to handle timing issues when categories are loading
    let finalCategoryId;
    if (categoryId) {
      finalCategoryId = categoryId;
    } else if (categories.length > 0) {
      finalCategoryId = categories[0].id;
    } else {
      // Fallback to General category (ID: 1) if categories haven't loaded yet
      finalCategoryId = 1;
    }

    onShare({
      title: title.trim(),
      description: description.trim(),
      category_id: finalCategoryId,
      tags,
      folder_id: folderId || undefined,
      example_images: exampleImages
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setTitle("");
    setDescription("");
    setCategoryId(null);
    setFolderId(null);
    setTags([]);
    setNewTag("");
    setHasAutoFilled(false);
    setExampleImages([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const downloadAsJSON = () => {
    if (!promptData) return;
    
    const data = {
      title,
      description,
      positive_prompt: promptData.positive_prompt,
      negative_prompt: promptData.negative_prompt,
      tags,
      created_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'prompt'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendEmail = () => {
    if (!promptData) return;
    
    const subject = encodeURIComponent(`Shared Prompt: ${title}`);
    const body = encodeURIComponent(`
I wanted to share this AI prompt with you:

Title: ${title}
Description: ${description}

Positive Prompt:
${promptData.positive_prompt}

${promptData.negative_prompt ? `Negative Prompt:\n${promptData.negative_prompt}\n\n` : ''}

Tags: ${tags.join(', ')}
    `);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const saveToGoogleDrive = () => {
    // This would integrate with Google Drive API
    toast({
      title: "Google Drive integration",
      description: "This feature would save the prompt to your Google Drive",
    });
  };

  if (!promptData) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'send-to-shared' ? (
              <>
                <Globe className="h-5 w-5 text-red-400" />
                Send to Shared Library
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5" />
                Save to User Library
              </>
            )}
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
          <DialogDescription>
            {mode === 'send-to-shared' 
              ? "Share your prompt with the community by adding it to the shared library."
              : "Save your prompt to your personal library for future use and organization."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Give your prompt a descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this prompt creates and how to use it effectively"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId?.toString() || undefined} onValueChange={(value) => setCategoryId(value ? parseInt(value) : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder Selection - Only show for send-to-shared mode */}
          {mode === 'send-to-shared' && folders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="folder">Folder (Optional)</Label>
              <Select value={folderId?.toString() || undefined} onValueChange={(value) => setFolderId(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-gray-400" />
                      <span>No Folder</span>
                    </div>
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Folder 
                          className="h-4 w-4" 
                          style={{ color: folder.color || '#8b5cf6' }}
                        />
                        <span>{folder.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {/* Example Images Section - Only show for send-to-shared mode */}
          {mode === 'send-to-shared' && promptData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="h-4 w-4 text-purple-400" />
                <Label>Example Images (Recommended)</Label>
              </div>
              
              {/* Disclaimer encouraging example images */}
              <div className="flex items-start gap-2 p-3 bg-purple-900/20 border border-purple-700/30 rounded-md text-sm">
                <AlertCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-purple-200">
                  <strong>Highly Recommended:</strong> Adding example images shows the community what your prompt can create and significantly increases engagement and usage. Upload 1-3 example images that demonstrate the best results from this prompt.
                </div>
              </div>

              <ExampleImagesUpload
                promptId={promptData.id}
                currentImages={exampleImages}
                onImagesUpdated={setExampleImages}
                maxImages={3}
                className="mt-2"
              />
            </div>
          )}

          {/* Prompt Preview */}
          <div className="space-y-2">
            <Label>Prompt Preview</Label>
            <div className="space-y-2">
              <div className="relative">
                <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-md text-sm">
                  <div className="text-green-300 font-medium mb-1">Positive:</div>
                  <div className="text-green-100 max-h-20 overflow-y-auto break-words">
                    {promptData.positive_prompt}
                  </div>
                </div>
                <Button
                  onClick={() => copyToClipboard(promptData.positive_prompt)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              {promptData.negative_prompt && (
                <div className="relative">
                  <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-md text-sm">
                    <div className="text-red-300 font-medium mb-1">Negative:</div>
                    <div className="text-red-100 max-h-20 overflow-y-auto break-words">
                      {promptData.negative_prompt}
                    </div>
                  </div>
                  <Button
                    onClick={() => promptData.negative_prompt && copyToClipboard(promptData.negative_prompt)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 flex-shrink-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 pt-6 border-t border-border/50">
          {/* First Row - Action Buttons */}
          <div className="flex justify-center gap-2 w-full flex-wrap">
            <Button 
              onClick={saveToGoogleDrive} 
              variant="outline" 
              size="sm"
              className="flex-1 min-w-[100px] px-3 py-2 h-9 rounded-lg font-medium text-xs border border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-200"
            >
              <SiGoogledrive className="h-3 w-3 mr-1 text-blue-400" />
              Google Drive
            </Button>
            <Button 
              onClick={downloadAsJSON} 
              variant="outline" 
              size="sm"
              className="flex-1 min-w-[100px] px-3 py-2 h-9 rounded-lg font-medium text-xs border border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-200"
            >
              <Download className="h-3 w-3 mr-1 text-green-400" />
              Download JSON
            </Button>
            <Button 
              onClick={sendEmail} 
              variant="outline" 
              size="sm"
              className="flex-1 min-w-[100px] px-3 py-2 h-9 rounded-lg font-medium text-xs border border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-200"
            >
              <Mail className="h-3 w-3 mr-1 text-purple-400" />
              Send Email
            </Button>
          </div>
          
          {/* Second Row - Main Actions */}
          <div className="flex justify-between w-full gap-3">
            <Button 
              onClick={handleClose} 
              variant="outline" 
              className="px-6 py-2 h-10 font-medium text-sm min-w-[80px] rounded-lg border border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                await handleSubmit();
                // After successful save, navigate to appropriate library
                if (onNavigateToShared) {
                  toast({
                    title: mode === 'send-to-shared' ? "Prompt shared successfully!" : "Prompt saved successfully!",
                    description: mode === 'send-to-shared' 
                      ? "Navigate to shared library to view it" 
                      : "This prompt is now available in your personal library",
                    action: (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          onNavigateToShared();
                          handleClose();
                        }}
                        className="ml-2"
                      >
                        {mode === 'send-to-shared' ? "View in Shared Library" : "View in Prompt Library"}
                      </Button>
                    )
                  });
                }
              }} 
              disabled={isLoading} 
              className={`px-6 py-2 h-10 font-medium text-sm min-w-[140px] rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 ${
                mode === 'send-to-shared' 
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {isLoading 
                ? "Saving..." 
                : mode === 'send-to-shared' 
                  ? "Save to Shared Library" 
                  : "Save to User Library"
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}