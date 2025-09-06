import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, Star, GitBranch, Eye, Edit, Share, Trash2, Image as ImageIcon, ZoomIn, X, Copy, Check, Globe, Folder, Download, Archive, Bookmark, ChevronDown } from "lucide-react";
import type { Prompt } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface PromptCardProps {
  prompt: Prompt;
  showActions?: boolean;
  onEdit?: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, showActions = false, onEdit }: PromptCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Use simple state to force re-renders when cache updates
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Use reactive queries to subscribe to data changes
  const { data: userFavorites = [] } = useQuery({
    queryKey: ["/api/user/favorites"],
    enabled: !!user,
  }) as { data: any[] };
  
  const isFavorited = userFavorites.some((fav: any) => fav.id === prompt.id);
  const isLiked = isFavorited;  // Backend uses same table for likes and favorites
  
  // Get the freshest prompt data from any matching query
  const currentPrompt = useMemo(() => {
    const allQueries = queryClient.getQueriesData({ queryKey: ["/api/prompts"], exact: false });
    
    // Find this prompt in any active query
    for (const [queryKey, data] of allQueries) {
      if (Array.isArray(data)) {
        const foundPrompt = data.find((p: any) => p.id === prompt.id);
        if (foundPrompt) return foundPrompt;
      }
    }
    return prompt; // fallback
  }, [queryClient, prompt, updateTrigger]); // Include updateTrigger to force re-computation

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/like`);
      return await response.json();
    },
    onMutate: async () => {
      // Cancel all prompt queries and favorites queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["/api/prompts"], exact: false });
      await queryClient.cancelQueries({ queryKey: ["/api/user/favorites"], exact: false });
      
      // Get all existing data
      const previousPromptsData = queryClient.getQueriesData({ queryKey: ["/api/prompts"], exact: false });
      const previousFavoritesData = queryClient.getQueriesData({ queryKey: ["/api/user/favorites"], exact: false });
      
      // Optimistically update likes count
      queryClient.setQueriesData({ queryKey: ["/api/prompts"], exact: false }, (old: any) => {
        if (!old) return old;
        return old.map((p: any) => 
          p.id === prompt.id 
            ? { ...p, likes: (p.likes || 0) + (isLiked ? -1 : 1) }
            : p
        );
      });
      
      // Optimistically update favorites cache (since backend uses same table)
      const currentFavorites = queryClient.getQueryData(["/api/user/favorites"]) as any[] || [];
      const isCurrentlyLiked = currentFavorites.some((fav: any) => fav.id === prompt.id);
      
      if (isCurrentlyLiked) {
        // Remove from favorites
        queryClient.setQueryData(["/api/user/favorites"], currentFavorites.filter((fav: any) => fav.id !== prompt.id));
      } else {
        // Add to favorites
        queryClient.setQueryData(["/api/user/favorites"], [...currentFavorites, prompt]);
      }
      
      return { previousPromptsData, previousFavoritesData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
      // Force component re-render
      setUpdateTrigger(prev => prev + 1);
      toast({
        title: "Success",
        description: data.liked ? "Prompt liked!" : "Prompt unliked!",
      });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousPromptsData) {
        context.previousPromptsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousFavoritesData) {
        context.previousFavoritesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
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
    onMutate: async () => {
      // Cancel all prompt queries and favorites queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["/api/prompts"], exact: false });
      await queryClient.cancelQueries({ queryKey: ["/api/user/favorites"], exact: false });
      
      // Get all existing data
      const previousPromptsData = queryClient.getQueriesData({ queryKey: ["/api/prompts"], exact: false });
      const previousFavoritesData = queryClient.getQueriesData({ queryKey: ["/api/user/favorites"], exact: false });
      
      // Optimistically update favorites cache
      const currentFavorites = queryClient.getQueryData(["/api/user/favorites"]) as any[] || [];
      const isCurrentlyFavorited = currentFavorites.some((fav: any) => fav.id === prompt.id);
      
      if (isCurrentlyFavorited) {
        // Remove from favorites
        queryClient.setQueryData(["/api/user/favorites"], currentFavorites.filter((fav: any) => fav.id !== prompt.id));
      } else {
        // Add to favorites
        queryClient.setQueryData(["/api/user/favorites"], [...currentFavorites, prompt]);
      }
      
      return { previousPromptsData, previousFavoritesData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
      // Force component re-render
      setUpdateTrigger(prev => prev + 1);
      toast({
        title: "Success",
        description: data.favorited ? "Prompt bookmarked!" : "Prompt unbookmarked!",
      });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousPromptsData) {
        context.previousPromptsData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousFavoritesData) {
        context.previousFavoritesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
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
        description: "Failed to bookmark prompt",
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
    onMutate: async () => {
      // Cancel all prompt queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["/api/prompts"], exact: false });
      
      // Get all existing prompt queries 
      const previousData = queryClient.getQueriesData({ queryKey: ["/api/prompts"], exact: false });
      
      // Remove prompt from all caches immediately
      queryClient.setQueriesData({ queryKey: ["/api/prompts"], exact: false }, (old: any) => {
        if (!old) return old;
        return old.filter((p: any) => p.id !== prompt.id);
      });
      
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Success",
        description: "Prompt deleted successfully!",
      });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
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

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/archive`);
      return await response.json();
    },
    onMutate: async () => {
      // Cancel all prompt queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["/api/prompts"], exact: false });
      
      // Get all existing prompt queries 
      const previousData = queryClient.getQueriesData({ queryKey: ["/api/prompts"], exact: false });
      
      // Optimistically remove from current view (will be invalidated anyway)
      queryClient.setQueriesData({ queryKey: ["/api/prompts"], exact: false }, (old: any) => {
        if (!old) return old;
        return old.filter((p: any) => p.id !== prompt.id);
      });
      
      return { previousData };
    },
    onSuccess: (data) => {
      // Invalidate all queries to refresh both "My Prompts" and "Archive" tabs
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
      toast({
        title: "Success",
        description: data.archived ? "Prompt archived successfully!" : "Prompt restored from archive!",
      });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
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
        description: "Failed to toggle archive status",
        variant: "destructive",
      });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/visibility`);
      return await response.json();
    },
    onMutate: async () => {
      // Cancel all prompt queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["/api/prompts"], exact: false });
      
      // Get all existing prompt queries 
      const previousData = queryClient.getQueriesData({ queryKey: ["/api/prompts"], exact: false });
      
      // Update all matching prompt queries with optimistic visibility toggle
      queryClient.setQueriesData({ queryKey: ["/api/prompts"], exact: false }, (old: any) => {
        if (!old) return old;
        return old.map((p: any) => 
          p.id === prompt.id 
            ? { ...p, isPublic: !p.isPublic }
            : p
        );
      });
      
      return { previousData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
      // Force component re-render to pick up fresh data
      setUpdateTrigger(prev => prev + 1);
      toast({
        title: "Success",
        description: data.isPublic ? "Prompt shared publicly!" : "Prompt made private!",
      });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
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
        description: "Failed to toggle visibility",
        variant: "destructive",
      });
    },
  });

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptContent);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Prompt content copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy prompt to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareableLink = `${window.location.origin}/prompt/${prompt.id}`;
      await navigator.clipboard.writeText(shareableLink);
      toast({
        title: "Copied!",
        description: "Shareable link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyJSON = async () => {
    try {
      const promptData = {
        name: prompt.name,
        description: prompt.description,
        content: prompt.promptContent,
        category: prompt.category,
        tags: prompt.tags,
      };
      await navigator.clipboard.writeText(JSON.stringify(promptData, null, 2));
      toast({
        title: "Copied!",
        description: "Prompt JSON copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const promptData = {
      name: prompt.name,
      description: prompt.description,
      content: prompt.promptContent,
      category: prompt.category,
      tags: prompt.tags,
      created: prompt.createdAt,
    };
    const blob = new Blob([JSON.stringify(promptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Prompt downloaded successfully",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-prompt-${prompt.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-foreground flex-1 min-w-0" data-testid={`text-prompt-name-${prompt.id}`}>
                {prompt.name}
              </h3>
{showActions ? (
                <Button
                  variant="outline"
                  size="sm"
                  className={`px-2 py-1 text-xs transition-all ${
                    currentPrompt.isPublic 
                      ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 shadow-sm' 
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                  onClick={() => visibilityMutation.mutate()}
                  disabled={visibilityMutation.isPending}
                  data-testid={`button-visibility-toggle-${prompt.id}`}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {currentPrompt.isPublic ? "Public" : "Private"}
                </Button>
              ) : (
                <Badge 
                  variant={currentPrompt.isPublic ? "default" : "secondary"} 
                  className={currentPrompt.isPublic ? "bg-blue-500" : ""}
                  data-testid={`badge-visibility-${prompt.id}`}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {currentPrompt.isPublic ? "Public" : "Private"}
                </Badge>
              )}
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
          <div className="flex items-center space-x-1 ml-4">
            {showActions ? (
              <div className="flex items-center space-x-1" data-testid={`actions-personal-${prompt.id}`}>
                {/* 1. Like Toggle - Heart (outline → filled red) */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                  data-testid={`button-like-${prompt.id}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-600' : ''}`} />
                </Button>

                {/* 2. Edit Button - Green edit icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit?.(prompt)}
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                  data-testid={`button-edit-${prompt.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                {/* 3. Collections - Yellow folder with dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-yellow-600 hover:bg-yellow-50"
                      data-testid={`button-collections-${prompt.id}`}
                    >
                      <Folder className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => toast({ title: "Collections", description: "Collection management coming soon!" })}>
                      Add to Collection
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Collections", description: "Collection management coming soon!" })}>
                      Create New Collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 4. Share Menu - Share icon with dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                      data-testid={`button-share-${prompt.id}`}
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      Share Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyJSON}>
                      Copy JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "Email sharing coming soon!" })}>
                      Email Prompt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "Google Drive integration coming soon!" })}>
                      Save to Google Drive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Coming Soon", description: "System share coming soon!" })}>
                      System Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 5. Download - Download icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                  data-testid={`button-download-${prompt.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>

                {/* 6. Fork - Fork icon (existing) */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => forkMutation.mutate()}
                  disabled={forkMutation.isPending}
                  className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                  data-testid={`button-fork-${prompt.id}`}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>

                {/* 7. Archive - Archive icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => archiveMutation.mutate()}
                  disabled={archiveMutation.isPending}
                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50"
                  data-testid={`button-archive-${prompt.id}`}
                >
                  <Archive className="h-4 w-4" />
                </Button>

                {/* 8. Delete - Trash icon (red) */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                  data-testid={`button-delete-${prompt.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* 9. Bookmark - Bookmark (outline → filled) */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                  data-testid={`button-bookmark-${prompt.id}`}
                >
                  <Bookmark className={`h-4 w-4 ${isFavorited ? 'fill-blue-600' : ''}`} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2" data-testid={`actions-community-${prompt.id}`}>
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
              </div>
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

        <div className="relative bg-muted rounded-md p-3 text-sm font-mono text-muted-foreground group" data-testid={`text-content-${prompt.id}`}>
          <div className="pr-8">
            {prompt.promptContent}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopyPrompt}
            data-testid={`button-copy-prompt-${prompt.id}`}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
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
