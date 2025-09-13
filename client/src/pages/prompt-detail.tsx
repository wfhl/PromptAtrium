import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Heart, Share2, Edit, GitFork, ChevronLeft, LogIn, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Prompt, User } from "@shared/schema";

interface PromptWithUser extends Prompt {
  user?: Partial<User>;
}

export default function PromptDetail() {
  const params = useParams();
  const promptId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLiked, setIsLiked] = useState(false);

  // Fetch prompt details
  const { data: prompt, isLoading, error } = useQuery<PromptWithUser>({
    queryKey: [`/api/prompts/${promptId}`],
    enabled: !!promptId,
  });

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
      setIsLiked(data.favorited);
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
  const handleCopy = () => {
    if (prompt?.promptContent) {
      navigator.clipboard.writeText(prompt.promptContent);
      toast({
        title: "Copied to clipboard",
        description: "The prompt has been copied to your clipboard",
      });
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{prompt.name}</CardTitle>
                {prompt.description && (
                  <CardDescription className="text-base">
                    {prompt.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={!user}
                  data-testid="button-favorite"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-current text-red-500" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {user?.id === prompt.userId && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleEdit}
                    data-testid="button-edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tags and metadata */}
            <div className="flex flex-wrap gap-2 mt-4">
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
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Prompt content with matching PromptCard styling */}
            <div>
              <h3 className="font-semibold mb-2 text-foreground">Prompt</h3>
              <div className="relative">
                <pre className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm text-gray-200">
                  {prompt.promptContent}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                  data-testid="button-copy"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            {/* Example images if available */}
            {prompt.exampleImagesUrl && prompt.exampleImagesUrl.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-4">Example Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prompt.exampleImagesUrl.map((url, index) => (
                      <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                        <img
                          src={url}
                          alt={`Example ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          data-testid={`img-example-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Creator info */}
            <Separator />
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
                <Separator />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}