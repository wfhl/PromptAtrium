import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Heart, Share2, Edit, GitFork, ChevronLeft, LogIn, UserPlus, Download, Link2, Bookmark, Check, ZoomIn, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Prompt, User } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface PromptWithUser extends Prompt {
  user?: Partial<User>;
}

export default function PromptDetail() {
  const params = useParams();
  const promptId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Apply dark theme for unauthenticated users
  useEffect(() => {
    if (!user) {
      document.documentElement.classList.add('dark');
    }
    // Cleanup function to respect user's actual theme preference when they log in
    return () => {
      if (!user) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme !== 'dark') {
          document.documentElement.classList.remove('dark');
        }
      }
    };
  }, [user]);

  // Fetch prompt details
  const { data: prompt, isLoading, error } = useQuery<PromptWithUser>({
    queryKey: [`/api/prompts/${promptId}`],
    enabled: !!promptId,
  });

  // Check if prompt is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && prompt) {
        try {
          const favorites = await queryClient.fetchQuery({
            queryKey: ["/api/user/favorites"],
          });
          setIsFavorited((favorites as any[])?.some(fav => fav.id === prompt.id) || false);
        } catch (error) {
          // Silently fail if user doesn't have permission
        }
      }
    };
    checkFavoriteStatus();
  }, [user, prompt]);

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("Must be logged in to favorite");
      }
      const response = await apiRequest("POST", `/api/prompts/${promptId}/favorite`);
      return await response.json();
    },
    onSuccess: (data) => {
      setIsFavorited(data.favorited);
      toast({
        title: data.favorited ? "Added to favorites" : "Removed from favorites",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
    },
    onError: (error) => {
      if (error.message === "Must be logged in to favorite") {
        toast({
          title: "Sign in required",
          description: "Please sign in to favorite prompts",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update favorite status",
          variant: "destructive",
        });
      }
    },
  });

  // Copy prompt to clipboard
  const handleCopyPrompt = async () => {
    if (prompt?.promptContent) {
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
    }
  };

  // Share prompt
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/prompt/${promptId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: prompt?.name || "Check out this prompt",
          text: prompt?.description || "An AI prompt from our community",
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link copied",
            description: "The share link has been copied to your clipboard",
          });
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "The share link has been copied to your clipboard",
      });
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (prompt && user?.id === prompt.userId) {
      // Navigate to edit page (to be implemented)
      toast({
        title: "Edit feature coming soon",
        description: "This feature is under development",
      });
    }
  };

  // Handle fork
  const handleFork = () => {
    // Navigate to fork page (to be implemented)
    toast({
      title: "Fork feature coming soon",
      description: "This feature is under development",
    });
  };

  // Handle download
  const handleDownload = () => {
    if (!prompt) return;
    
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

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      const shareableLink = `${window.location.origin}/prompt/${promptId}`;
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Prompt not found</h1>
          <p className="text-muted-foreground mb-6">
            The prompt you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/")} variant="outline">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Main content card with matching PromptCard styling */}
        <Card className="border-gray-800 bg-gray-900/30">
          <div className="p-6">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2 text-foreground">{prompt.name}</h1>
                {prompt.description && (
                  <p className="text-muted-foreground mb-4">
                    {prompt.description}
                  </p>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-1">
                {/* Edit - only for owner */}
                {user?.id === prompt.userId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEdit}
                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                    data-testid="button-edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Share */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleShare}
                  className="h-8 w-8 p-0 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                
                {/* Download */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid="button-download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {/* Copy Link */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid="button-link"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                
                {/* Bookmark */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={!user || favoriteMutation.isPending}
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid="button-bookmark"
                >
                  <Bookmark className={`h-4 w-4 transition-all duration-200 ${isFavorited ? 'fill-blue-600' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Example Images Gallery - matching PromptCard styling */}
            {prompt.exampleImagesUrl && prompt.exampleImagesUrl.length > 0 && (
              <div className="mb-4" data-testid="gallery-images">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Example Images ({prompt.exampleImagesUrl.length})</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1 md:gap-2">
                  {prompt.exampleImagesUrl.slice(0, 4).map((imageUrl, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square overflow-hidden rounded-md md:rounded-lg border bg-muted cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
                      onClick={() => setSelectedImage(imageUrl)}
                      data-testid={`image-thumbnail-${index}`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Example ${index + 1} for ${prompt.name}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Add fallback or placeholder
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback absolute inset-0 flex items-center justify-center bg-muted';
                            fallback.innerHTML = '<span class="text-muted-foreground text-xs">Image unavailable</span>';
                            parent.appendChild(fallback);
                          }
                        }}
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

            {/* Prompt content with matching PromptCard styling */}
            <div className="relative text-sm text-gray-200/70 bg-green-900/20 p-2 rounded border border-green-700/30 leading-relaxed hover:border-green-600/40 transition-colors rounded-md p-2 md:p-3 text-xs md:text-sm font-mono group">
              <div className="pr-8 max-h-[10rem] md:max-h-none overflow-y-auto">
                {prompt.promptContent}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-3 right-1 h-6 w-6 p-0 bg-transparent hover:opacity-100 text-green-400 opacity-50 transition-opacity"
                onClick={handleCopyPrompt}
                data-testid="button-copy"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Negative prompt if exists */}
            {prompt.negativePrompt && (
              <div className="mt-3">
                <h3 className="font-semibold mb-2 text-foreground text-sm">Negative Prompt</h3>
                <div className="bg-red-900/20 border border-red-700/30 p-3 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-red-200/70">
                    {prompt.negativePrompt}
                  </pre>
                </div>
              </div>
            )}

            {/* Tags and metadata */}
            <div className="mt-4 space-y-3">
              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2">
                {prompt.category && (
                  <Badge variant="secondary" data-testid="badge-category">
                    {prompt.category}
                  </Badge>
                )}
                {prompt.promptType && (
                  <Badge variant="secondary" data-testid="badge-type">
                    {prompt.promptType}
                  </Badge>
                )}
                {prompt.promptStyle && (
                  <Badge variant="secondary" data-testid="badge-style">
                    {prompt.promptStyle}
                  </Badge>
                )}
                {prompt.intendedGenerator && (
                  <Badge variant="outline" data-testid="badge-generator">
                    {prompt.intendedGenerator}
                  </Badge>
                )}
                {prompt.recommendedModels && prompt.recommendedModels.length > 0 && (
                  <Badge variant="outline" data-testid="badge-model">
                    {prompt.recommendedModels[0]}
                  </Badge>
                )}
                {prompt.isNsfw && (
                  <Badge variant="destructive" data-testid="badge-nsfw">
                    NSFW
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Creator info */}
            <Separator className="my-6" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={prompt.user?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {prompt.user?.firstName?.charAt(0)?.toUpperCase() || prompt.user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium" data-testid="text-username">
                    {prompt.user?.username || prompt.user?.firstName || "Anonymous"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created {prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleFork} 
                variant="outline" 
                data-testid="button-fork"
                disabled={!user}
              >
                <GitFork className="h-4 w-4 mr-2" />
                Fork Prompt
              </Button>
            </div>

            {/* Sign up/Sign in call-to-action for unauthenticated users */}
            {!user && (
              <>
                <Separator className="my-6" />
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Join PromptAtrium</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign up to save, favorite, and create your own AI prompts
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => window.location.href = "/api/login"}
                      className="button-gradient-primary"
                      data-testid="button-sign-up"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign Up / Sign In
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Full size preview of the example image
          </DialogDescription>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}