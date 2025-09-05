import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Heart, Star, GitBranch, Eye, Edit, Share, Trash2, Image as ImageIcon, ZoomIn, X } from "lucide-react";
import type { Prompt } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";

interface PromptCardProps {
  prompt: Prompt;
  showActions?: boolean;
  onEdit?: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, showActions = false, onEdit }: PromptCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/prompts/${prompt.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Success",
        description: "Prompt liked!",
      });
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
        description: "Failed to like prompt",
        variant: "destructive",
      });
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/favorite`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      toast({
        title: "Success",
        description: "Prompt added to favorites!",
      });
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
        description: "Failed to favorite prompt",
        variant: "destructive",
      });
    },
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/prompts/${prompt.id}/fork`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Success",
        description: "Prompt forked successfully!",
      });
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
        description: "Failed to fork prompt",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/prompts/${prompt.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Success",
        description: "Prompt deleted successfully!",
      });
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
        description: "Failed to delete prompt",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-prompt-${prompt.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-foreground" data-testid={`text-prompt-name-${prompt.id}`}>
                {prompt.name}
              </h3>
              <Badge variant={prompt.isPublic ? "default" : "secondary"} data-testid={`badge-visibility-${prompt.id}`}>
                {prompt.isPublic ? "Public" : "Private"}
              </Badge>
              {prompt.category && (
                <Badge variant="outline" data-testid={`badge-category-${prompt.id}`}>
                  {prompt.category}
                </Badge>
              )}
              {prompt.isFeatured && (
                <Badge className="bg-yellow-100 text-yellow-800" data-testid={`badge-featured-${prompt.id}`}>
                  Featured
                </Badge>
              )}
            </div>
            {prompt.description && (
              <p className="text-sm text-muted-foreground mb-3" data-testid={`text-description-${prompt.id}`}>
                {prompt.description}
              </p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span data-testid={`text-likes-${prompt.id}`}>
                <Heart className="h-4 w-4 text-red-500 inline mr-1" />
                {prompt.likes}
              </span>
              <span data-testid={`text-rating-${prompt.id}`}>
                <Star className="h-4 w-4 text-yellow-500 inline mr-1" />
                {prompt.qualityScore}
              </span>
              <span data-testid={`text-usage-${prompt.id}`}>
                <Eye className="h-4 w-4 inline mr-1" />
                {prompt.usageCount}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {showActions ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit?.(prompt)}
                  data-testid={`button-edit-${prompt.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid={`button-share-${prompt.id}`}
                >
                  <Share className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive"
                  data-testid={`button-delete-${prompt.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {/* Show favorite button even for owned prompts */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className="text-yellow-600 hover:bg-yellow-50 border-yellow-200"
                  data-testid={`button-favorite-${prompt.id}`}
                >
                  <Star className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className="text-red-600 hover:bg-red-50"
                  data-testid={`button-like-${prompt.id}`}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Like
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className="text-yellow-600 hover:bg-yellow-50"
                  data-testid={`button-favorite-${prompt.id}`}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Favorite
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => forkMutation.mutate()}
                  disabled={forkMutation.isPending}
                  className="text-primary hover:bg-primary/10"
                  data-testid={`button-fork-${prompt.id}`}
                >
                  <GitBranch className="h-4 w-4 mr-1" />
                  Fork
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        {prompt.exampleImagesUrl && prompt.exampleImagesUrl.length > 0 && (
          <div className="mb-4" data-testid={`gallery-images-${prompt.id}`}>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Example Images ({prompt.exampleImagesUrl.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {prompt.exampleImagesUrl.slice(0, 4).map((imageUrl, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square overflow-hidden rounded-lg border bg-muted cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => setSelectedImage(imageUrl)}
                  data-testid={`image-thumbnail-${prompt.id}-${index}`}
                >
                  <img
                    src={imageUrl}
                    alt={`Example ${index + 1} for ${prompt.name}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Show count badge for additional images */}
                  {index === 3 && prompt.exampleImagesUrl.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        +{prompt.exampleImagesUrl.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted rounded-md p-3 text-sm font-mono text-muted-foreground" data-testid={`text-content-${prompt.id}`}>
          {prompt.promptContent}
        </div>

        {/* Image Viewer Modal */}
        <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0" data-testid={`modal-image-viewer-${prompt.id}`}>
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Full size example"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => setSelectedImage(null)}
                  data-testid={`button-close-image-${prompt.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
