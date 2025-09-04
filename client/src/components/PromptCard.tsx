import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, GitBranch, Eye, Edit, Share, Trash2 } from "lucide-react";
import type { Prompt } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface PromptCardProps {
  prompt: Prompt;
  showActions?: boolean;
  onEdit?: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, showActions = false, onEdit }: PromptCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

        <div className="bg-muted rounded-md p-3 text-sm font-mono text-muted-foreground" data-testid={`text-content-${prompt.id}`}>
          {prompt.promptContent}
        </div>
      </CardContent>
    </Card>
  );
}
