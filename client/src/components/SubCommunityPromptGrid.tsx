import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Star,
  Eye,
  Share2,
  Lock,
  Users,
  Globe,
  MoreVertical,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import type { Prompt } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PromptShareDialog } from "./PromptShareDialog";
import { cn } from "@/lib/utils";

interface SubCommunityPromptGridProps {
  prompts: Prompt[];
  viewMode: "grid" | "list";
  subCommunityId: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

interface PromptCardProps {
  prompt: Prompt;
  viewMode: "grid" | "list";
  subCommunityId: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

function PromptCard({
  prompt,
  viewMode,
  subCommunityId,
  isAdmin,
  onRefresh,
}: PromptCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const isOwner = user?.id === prompt.userId;

  // Get visibility icon and color
  const getVisibilityBadge = () => {
    switch (prompt.subCommunityVisibility) {
      case "public":
        return (
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
        );
      case "parent_community":
        return (
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            Parent Community
          </Badge>
        );
      case "private":
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Members Only
          </Badge>
        );
    }
  };

  const removeFromSubCommunityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/sub-communities/${subCommunityId}/prompts/${prompt.id}`
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt removed from sub-community",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/sub-communities/${subCommunityId}/prompts`],
      });
      onRefresh?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove prompt",
        variant: "destructive",
      });
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async (visibility: string) => {
      const response = await apiRequest(
        "POST",
        `/api/prompts/${prompt.id}/sub-community-visibility`,
        { visibility, subCommunityId }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Visibility updated",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/sub-communities/${subCommunityId}/prompts`],
      });
      onRefresh?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    },
  });

  // Get the first example image or use a placeholder
  const previewImage = prompt.exampleImagesUrl?.[0];

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4 p-4">
          {/* Preview Image */}
          <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg overflow-hidden">
            {previewImage ? (
              <img
                src={previewImage}
                alt={prompt.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link href={`/prompt/${prompt.id}`}>
                <h3 className="font-semibold hover:underline truncate">
                  {prompt.name}
                </h3>
              </Link>
              {getVisibilityBadge()}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {prompt.description || "No description"}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">
                    {prompt.author?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">
                  {prompt.author || "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-4 w-4" />
                {prompt.likes || 0}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                {prompt.usageCount || 0}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                data-testid={`button-share-${prompt.id}`}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}

            {(isOwner || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`menu-${prompt.id}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <>
                      <DropdownMenuItem
                        onClick={() => updateVisibilityMutation.mutate("private")}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Members Only
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateVisibilityMutation.mutate("parent_community")
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Parent Community
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVisibilityMutation.mutate("public")}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        Public
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => removeFromSubCommunityMutation.mutate()}
                    className="text-destructive"
                  >
                    Remove from Sub-Community
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Share Dialog */}
        {showShareDialog && (
          <PromptShareDialog
            prompt={prompt}
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            currentSubCommunityId={subCommunityId}
          />
        )}
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardHeader className="p-0">
        {/* Preview Image */}
        <Link href={`/prompt/${prompt.id}`}>
          <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
            {previewImage ? (
              <img
                src={previewImage}
                alt={prompt.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {/* Visibility Badge Overlay */}
            <div className="absolute top-2 right-2">{getVisibilityBadge()}</div>
          </div>
        </Link>
      </CardHeader>

      <CardContent className="p-4">
        <Link href={`/prompt/${prompt.id}`}>
          <h3 className="font-semibold hover:underline line-clamp-1 mb-1">
            {prompt.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {prompt.description || "No description"}
        </p>

        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs">
              {prompt.author?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">
            {prompt.author || "Unknown"}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {prompt.likes || 0}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {prompt.usageCount || 0}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                data-testid={`button-share-${prompt.id}`}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}

            {(isOwner || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`menu-${prompt.id}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <>
                      <DropdownMenuItem
                        onClick={() => updateVisibilityMutation.mutate("private")}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Members Only
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateVisibilityMutation.mutate("parent_community")
                        }
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Parent Community
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVisibilityMutation.mutate("public")}
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        Public
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={() => removeFromSubCommunityMutation.mutate()}
                    className="text-destructive"
                  >
                    Remove from Sub-Community
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>

      {/* Share Dialog */}
      {showShareDialog && (
        <PromptShareDialog
          prompt={prompt}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          currentSubCommunityId={subCommunityId}
        />
      )}
    </Card>
  );
}

export function SubCommunityPromptGrid({
  prompts,
  viewMode,
  subCommunityId,
  isAdmin = false,
  onRefresh,
}: SubCommunityPromptGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No prompts found</h3>
        <p className="text-muted-foreground mt-1">
          No prompts have been shared to this sub-community yet
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
      )}
    >
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          viewMode={viewMode}
          subCommunityId={subCommunityId}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}