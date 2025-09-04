import { useState } from "react";
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
import type { Prompt, Collection } from "@shared/schema";

interface PromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: Prompt | null;
  mode: "create" | "edit";
}

export function PromptModal({ open, onOpenChange, prompt, mode }: PromptModalProps) {
  const [formData, setFormData] = useState({
    name: prompt?.name || "",
    description: prompt?.description || "",
    category: prompt?.category || "",
    promptContent: prompt?.promptContent || "",
    negativePrompt: prompt?.negativePrompt || "",
    tags: prompt?.tags?.join(", ") || "",
    isPublic: prompt?.isPublic ?? true,
    collectionId: prompt?.collectionId || "none",
    license: prompt?.license || "CC0 (Public Domain)",
    status: prompt?.status || "published",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: collections } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((tag: string) => tag.trim()) : [],
        tagsNormalized: data.tags ? data.tags.split(",").map((tag: string) => tag.trim().toLowerCase()) : [],
        collectionId: data.collectionId === "none" ? null : data.collectionId,
      };
      await apiRequest("POST", "/api/prompts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
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
      };
      await apiRequest("PUT", `/api/prompts/${prompt!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
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
      tags: "",
      isPublic: true,
      collectionId: "none",
      license: "CC0 (Public Domain)",
      status: "published",
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
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
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
              <Select value={formData.collectionId} onValueChange={(value) => setFormData({ ...formData, collectionId: value })}>
                <SelectTrigger data-testid="select-collection">
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
  );
}
