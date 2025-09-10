import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Star, GitBranch, Eye, Edit, Share, Trash2, Image as ImageIcon, ZoomIn, X, Copy, Check, Globe, Folder, Download, Archive, Bookmark, ChevronDown, Plus, Minus } from "lucide-react";
import type { Prompt } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

interface PromptCardProps {
  prompt: Prompt;
  showActions?: boolean;
  onEdit?: (prompt: Prompt) => void;
  // Multi-select functionality
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (promptId: string, selected: boolean) => void;
  // Inline editing functionality
  allowInlineEdit?: boolean;
  // Community page flag
  isCommunityPage?: boolean;
  // Profile page flag
  isProfilePage?: boolean;
}

export function PromptCard({ 
  prompt, 
  showActions = false, 
  onEdit,
  isSelectable = false,
  isSelected = false,
  onSelectionChange,
  allowInlineEdit = false,
  isCommunityPage = false,
  isProfilePage = false
}: PromptCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const typedUser = user as any;
  const isSuperAdmin = (user as any)?.role === "super_admin";
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Inline editing state
  const [editingField, setEditingField] = useState<'name' | 'description' | 'notes' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>('');
  
  // Collapse/expand state
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteRelatedData, setDeleteRelatedData] = useState<{
    likesCount: number;
    favoritesCount: number;
    ratingsCount: number;
  } | null>(null);
  
  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Separate queries for likes and favorites
  const { data: userFavorites = [] } = useQuery({
    queryKey: ["/api/user/favorites"],
    enabled: !!user,
  }) as { data: any[] };
  
  const { data: userLikes = [] } = useQuery({
    queryKey: ["/api/user/likes"],
    enabled: !!user,
  }) as { data: any[] };
  
  const isFavorited = userFavorites.some((fav: any) => fav.id === prompt.id);
  const isLiked = userLikes.some((like: any) => like.id === prompt.id);

  // Featured mutation for super admins
  const featuredMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/featured`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts");
        }
      });
      toast({
        title: "Success",
        description: data.featured ? "Prompt featured!" : "Prompt unfeatured!",
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
        description: "Failed to toggle featured status",
        variant: "destructive",
      });
    },
  });

  // Hidden mutation for super admins
  const hiddenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/hidden`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts");
        }
      });
      toast({
        title: "Success",
        description: data.hidden ? "Prompt hidden from community!" : "Prompt restored to community!",
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
        description: "Failed to toggle hidden status",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/like`);
      return await response.json();
    },
    onMutate: async () => {
      // Cancel all prompt queries and likes queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["/api/prompts"], exact: false });
      await queryClient.cancelQueries({ queryKey: ["/api/user/likes"], exact: false });
      
      // Get all existing data
      const previousPromptsData = queryClient.getQueriesData({ queryKey: ["/api/prompts"], exact: false });
      const previousLikesData = queryClient.getQueriesData({ queryKey: ["/api/user/likes"], exact: false });
      
      // Optimistically update likes count on prompts
      queryClient.setQueriesData({ queryKey: ["/api/prompts"], exact: false }, (old: any) => {
        if (!old) return old;
        return old.map((p: any) => 
          p.id === prompt.id 
            ? { ...p, likes: (p.likes || 0) + (isLiked ? -1 : 1) }
            : p
        );
      });
      
      // Optimistically update likes cache
      const currentLikes = queryClient.getQueryData(["/api/user/likes"]) as any[] || [];
      const isCurrentlyLiked = currentLikes.some((like: any) => like.id === prompt.id);
      
      if (isCurrentlyLiked) {
        // Remove from likes
        queryClient.setQueryData(["/api/user/likes"], currentLikes.filter((like: any) => like.id !== prompt.id));
      } else {
        // Add to likes
        queryClient.setQueryData(["/api/user/likes"], [...currentLikes, prompt]);
      }
      
      return { previousPromptsData, previousLikesData };
    },
    onSuccess: (data) => {
      // Invalidate ALL prompt queries and likes - Dashboard, Library, any page  
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || queryKey?.includes("/api/user/likes");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
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
      if (context?.previousLikesData) {
        context.previousLikesData.forEach(([queryKey, data]: [any, any]) => {
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
      // Invalidate ALL prompt queries - Dashboard, Library, any page
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || queryKey?.includes("/api/user/favorites");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
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
        context.previousFavoritesData.forEach(([queryKey, data]: [any, any]) => {
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
      // Invalidate all prompt-related queries to ensure immediate UI updates
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/prompts');
        }
      });
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

  // Inline edit mutation
  const inlineEditMutation = useMutation({
    mutationFn: async (updates: { name?: string; description?: string; notes?: string }) => {
      const response = await apiRequest("PUT", `/api/prompts/${prompt.id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/prompts');
        }
      });
      toast({
        title: "Success",
        description: "Prompt updated successfully!",
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
        description: "Failed to update prompt",
        variant: "destructive",
      });
    },
  });

  // Function to handle delete button click
  const handleDeleteClick = async () => {
    // Check for related data first
    try {
      const response = await apiRequest("GET", `/api/prompts/${prompt.id}/related-data`);
      const data = await response.json();
      setDeleteRelatedData(data);
    } catch (error) {
      // If we can't get related data, just set defaults
      setDeleteRelatedData({ likesCount: 0, favoritesCount: 0, ratingsCount: 0 });
    }
    setShowDeleteDialog(true);
  };

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
      // Close the dialog
      setShowDeleteDialog(false);
      
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
      // Invalidate ALL prompt queries - Dashboard, Library, any page
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || queryKey?.includes("/api/user/favorites");
        }
      });
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
      // Invalidate ALL prompt queries - Dashboard, Library, any page
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || queryKey?.includes("/api/user/favorites");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
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

  // Inline editing functions
  const startEdit = (field: 'name' | 'description' | 'notes') => {
    if (!allowInlineEdit || !typedUser || typedUser.id !== prompt.userId) return;
    
    const currentValue = field === 'name' ? prompt.name : 
                        field === 'description' ? prompt.description : 
                        prompt.notes || '';
    
    setEditingField(field);
    setEditValue(currentValue || '');
    setOriginalValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
    setOriginalValue('');
  };

  const saveEdit = () => {
    if (!editingField || editValue.trim() === originalValue.trim()) {
      cancelEdit();
      return;
    }

    const updates = {
      [editingField]: editValue.trim()
    };

    inlineEditMutation.mutate(updates, {
      onSuccess: () => {
        cancelEdit();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const canEdit = allowInlineEdit && typedUser && typedUser.id === prompt.userId;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt.promptContent);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Prompt content copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error: any) {
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
    } catch (error: any) {
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
    <Card className={`relative hover:shadow-md transition-all duration-200 ${
      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
    } ${isSelectable ? 'cursor-pointer' : ''}`} 
    data-testid={`card-prompt-${prompt.id}`}
    onClick={isSelectable ? (e) => {
      // Don't trigger selection if clicking on interactive elements
      if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
      onSelectionChange?.(prompt.id, !isSelected);
    } : undefined}
    >
      {/* Collapse/Expand Toggle Button */}
      <Button
        size="sm"
        variant="ghost"
        className="absolute bottom-2 right-2 h-6 w-6 p-0 z-10 opacity-60 hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation(); // Prevent card selection when clicking toggle
          toggleCollapsed();
        }}
        data-testid={`button-toggle-collapse-${prompt.id}`}
      >
        {isCollapsed ? (
          <Plus className="h-3 w-3" />
        ) : (
          <Minus className="h-3 w-3" />
        )}
      </Button>
      
      <CardContent className="p-2 sm:p-3 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              {isSelectable && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelectionChange?.(prompt.id, checked as boolean)}
                  data-testid={`checkbox-select-${prompt.id}`}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              {editingField === 'name' ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={saveEdit}
                  className="font-semibold text-foreground flex-1 min-w-0"
                  autoFocus
                  data-testid={`input-prompt-name-${prompt.id}`}
                />
              ) : (
                <h3 
                  className={`font-semibold text-foreground flex-1 min-w-0 ${
                    canEdit ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -mx-1' : ''
                  }`}
                  data-testid={`text-prompt-name-${prompt.id}`}
                  onDoubleClick={() => startEdit('name')}
                  title={canEdit ? 'Double-click to edit' : ''}
                >
                  {prompt.name}
                </h3>
              )}
{showActions && !isCommunityPage ? (
                <Button
                  variant="outline"
                  size="sm"
                  className={`px-2 py-1 text-xs transition-all ${
                    prompt.isPublic 
                      ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 shadow-sm' 
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                  onClick={() => visibilityMutation.mutate()}
                  disabled={visibilityMutation.isPending}
                  data-testid={`button-visibility-toggle-${prompt.id}`}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {prompt.isPublic ? "Public" : "Private"}
                </Button>
              ) : (
                // Hide "Public" badge on community page and profile page
                !showActions && !isCommunityPage && !isProfilePage && (
                  <Badge 
                    variant={prompt.isPublic ? "default" : "secondary"} 
                    className={prompt.isPublic ? "bg-blue-500" : ""}
                    data-testid={`badge-visibility-${prompt.id}`}
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    {prompt.isPublic ? "Public" : "Private"}
                  </Badge>
                )
              )}
              {prompt.isFeatured && (
                <Badge className="bg-yellow-100 text-yellow-800" data-testid={`badge-featured-${prompt.id}`}>
                  Featured
                </Badge>
              )}
            </div>
          </div>
        </div>


        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className="h-auto px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 transition-all duration-200 transform hover:scale-105 active:scale-95 rounded-full"
              data-testid={`button-like-counter-${prompt.id}`}
              title={isLiked ? "Unlike this prompt" : "Like this prompt"}
            >
              <Heart 
                className={`h-4 w-4 transition-all duration-200 ${isLiked ? 'fill-red-600' : 'hover:fill-red-200'}`} 
              />
              <span className={`text-sm font-medium transition-colors duration-200 ${isLiked ? 'text-red-600' : 'text-muted-foreground'}`}>
                {prompt.likes || 0}
              </span>
            </Button>
          </div>
          <div className="flex items-center space-x-1 ml-4">
            {showActions ? (
              <div className="flex items-center space-x-1" data-testid={`actions-personal-${prompt.id}`}>
                {/* Edit Button - Green edit icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit?.(prompt)}
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
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
                      className="h-8 w-8 p-0 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
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
                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
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
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
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
                  className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid={`button-fork-${prompt.id}`}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>

                {/* 7. Archive/Featured - Archive icon for regular users, Star for super admin */}
                {isSuperAdmin && isCommunityPage ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => featuredMutation.mutate()}
                    disabled={featuredMutation.isPending}
                    className="h-8 w-8 p-0 text-yellow-600 hover:bg-yellow-50"
                    data-testid={`button-featured-${prompt.id}`}
                  >
                    <Star className={`h-4 w-4 transition-all duration-200 ${prompt.isFeatured ? 'fill-yellow-600' : ''}`} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => archiveMutation.mutate()}
                    disabled={archiveMutation.isPending}
                    className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                    data-testid={`button-archive-${prompt.id}`}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}

                {/* 8. Delete/Hidden - Trash icon for regular users, Eye for super admin */}
                {isSuperAdmin && isCommunityPage ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => hiddenMutation.mutate()}
                    disabled={hiddenMutation.isPending}
                    className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                    data-testid={`button-hidden-${prompt.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeleteClick}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                    data-testid={`button-delete-${prompt.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                {/* 9. Bookmark - Bookmark (outline → filled) */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid={`button-bookmark-${prompt.id}`}
                >
                  <Bookmark className={`h-4 w-4 transition-all duration-200 ${isFavorited ? 'fill-blue-600' : ''}`} />
                </Button>
              </div>
            ) : (
              /* Community page action buttons - enabled for all users */
              <div className="flex items-center space-x-1" data-testid={`actions-community-${prompt.id}`}>
                {/* Share */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
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
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Download */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid={`button-download-${prompt.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {/* Fork */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => forkMutation.mutate()}
                  disabled={forkMutation.isPending}
                  className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid={`button-fork-${prompt.id}`}
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
                
                {/* Bookmark */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid={`button-bookmark-${prompt.id}`}
                >
                  <Bookmark className={`h-4 w-4 transition-all duration-200 ${isFavorited ? 'fill-blue-600' : ''}`} />
                </Button>
                
                {/* Super admin only buttons */}
                {isSuperAdmin && (
                  <>
                    {/* Featured Toggle */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => featuredMutation.mutate()}
                      disabled={featuredMutation.isPending}
                      className="h-8 w-8 p-0 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                      data-testid={`button-featured-${prompt.id}`}
                    >
                      <Star className={`h-4 w-4 transition-all duration-200 ${prompt.isFeatured ? 'fill-yellow-600' : ''}`} />
                    </Button>
                    
                    {/* Hidden Toggle */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => hiddenMutation.mutate()}
                      disabled={hiddenMutation.isPending}
                      className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                      data-testid={`button-hidden-${prompt.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Full-width Description Section */}
        <AnimatePresence>
          {!isCollapsed && (prompt.description || editingField === 'description') && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mb-4 overflow-hidden"
            >
            {editingField === 'description' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                className="w-full text-sm text-muted-foreground min-h-[60px]"
                autoFocus
                data-testid={`textarea-description-${prompt.id}`}
              />
            ) : (
              <p 
                className={`w-full text-sm text-muted-foreground ${
                  canEdit ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 -mx-2 -my-1' : ''
                }`}
                data-testid={`text-description-${prompt.id}`}
                onDoubleClick={() => startEdit('description')}
                title={canEdit ? 'Double-click to edit' : ''}
              >
                {prompt.description}
              </p>
            )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Gallery */}
        {prompt.exampleImagesUrl && prompt.exampleImagesUrl?.length > 0 && (
          <div className="mb-4" data-testid={`gallery-images-${prompt.id}`}>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Example Images ({prompt.exampleImagesUrl?.length || 0})</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1 md:gap-2">
              {prompt.exampleImagesUrl?.slice(0, 4).map((imageUrl: any, index: any) => (
                <div 
                  key={index} 
                  className="relative aspect-square overflow-hidden rounded-md md:rounded-lg border bg-muted cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
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
                  {index === 3 && (prompt.exampleImagesUrl?.length || 0) > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        +{(prompt.exampleImagesUrl?.length || 0) - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative bg-muted rounded-md p-2 md:p-3 text-xs md:text-sm font-mono text-muted-foreground group" data-testid={`text-content-${prompt.id}`}>
          <div className="pr-8 max-h-[10rem] md:max-h-none overflow-y-auto">
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

        {/* Additional Prompt Information */}
        <div className="mt-2 md:mt-4 space-y-2 md:space-y-3" data-testid={`additional-info-${prompt.id}`}>
          {/* Row 1: User, Types, Styles, Categories, Tags */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 text-xs" data-testid={`info-row-1-${prompt.id}`}>
            {/* User who created/shared */}
            <div>
              {!isCollapsed && <span className="font-medium text-muted-foreground">Creator:</span>}
              <div className={!isCollapsed ? "mt-1 flex items-center gap-2" : "flex items-center gap-2"}>
                {(prompt as any).user?.username ? (
                  <Link href={`/user/${(prompt as any).user.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid={`link-creator-${prompt.id}`}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={(prompt as any).user?.profileImageUrl} 
                        alt={`${(prompt as any).user?.firstName || 'User'} ${(prompt as any).user?.lastName || ''}`}
                      />
                      <AvatarFallback className="text-xs">
                        {(prompt as any).user?.firstName && (prompt as any).user?.lastName 
                          ? `${(prompt as any).user.firstName.charAt(0)}${(prompt as any).user.lastName.charAt(0)}`
                          : (prompt as any).user?.email 
                          ? (prompt as any).user.email.charAt(0).toUpperCase()
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground">
                      {(prompt as any).user?.firstName || (prompt as any).user?.username || 'User'}
                    </span>
                  </Link>
                ) : (
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={(prompt as any).user?.profileImageUrl} 
                      alt={`${(prompt as any).user?.firstName || 'User'} ${(prompt as any).user?.lastName || ''}`}
                    />
                    <AvatarFallback className="text-xs">
                      {(prompt as any).user?.firstName && (prompt as any).user?.lastName 
                        ? `${(prompt as any).user.firstName.charAt(0)}${(prompt as any).user.lastName.charAt(0)}`
                        : (prompt as any).user?.email 
                        ? (prompt as any).user.email.charAt(0).toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            {/* Prompt Types */}
            {((!isCollapsed) || (prompt.promptTypes && prompt.promptTypes.length > 0) || prompt.promptType) && (
              <div>
                {!isCollapsed && <span className="font-medium text-muted-foreground">Types:</span>}
                <div className={!isCollapsed ? "flex flex-wrap gap-1 mt-1" : "flex flex-wrap gap-1"}>
                  {prompt.promptTypes && prompt.promptTypes.length > 0 ? (
                    prompt.promptTypes.map((type, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))
                  ) : prompt.promptType ? (
                    <Badge variant="secondary" className="text-xs">
                      {prompt.promptType}
                    </Badge>
                  ) : (
                    !isCollapsed && <span className="text-muted-foreground text-xs">None</span>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Styles */}
            {((!isCollapsed) || (prompt.promptStyles && prompt.promptStyles.length > 0) || prompt.promptStyle) && (
              <div>
                {!isCollapsed && <span className="font-medium text-muted-foreground">Styles:</span>}
                <div className={!isCollapsed ? "flex flex-wrap gap-1 mt-1" : "flex flex-wrap gap-1"}>
                  {prompt.promptStyles && prompt.promptStyles.length > 0 ? (
                    prompt.promptStyles.map((style, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {style}
                      </Badge>
                    ))
                  ) : prompt.promptStyle ? (
                    <Badge variant="secondary" className="text-xs">
                      {prompt.promptStyle}
                    </Badge>
                  ) : (
                    !isCollapsed && <span className="text-muted-foreground text-xs">None</span>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Categories */}
            {((!isCollapsed) || (prompt.categories && prompt.categories.length > 0) || prompt.category) && (
              <div>
                {!isCollapsed && <span className="font-medium text-muted-foreground">Categories:</span>}
                <div className={!isCollapsed ? "flex flex-wrap gap-1 mt-1" : "flex flex-wrap gap-1"}>
                  {prompt.categories && prompt.categories.length > 0 ? (
                    prompt.categories.map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))
                  ) : prompt.category ? (
                    <Badge variant="outline" className="text-xs">
                      {prompt.category}
                    </Badge>
                  ) : (
                    !isCollapsed && <span className="text-muted-foreground text-xs">None</span>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {((!isCollapsed) || (prompt.tags && prompt.tags.length > 0)) && (
              <div>
                {!isCollapsed && <span className="font-medium text-muted-foreground">Tags:</span>}
                <div className={!isCollapsed ? "flex flex-wrap gap-1 mt-1" : "flex flex-wrap gap-1"}>
                  {prompt.tags && prompt.tags.length > 0 ? (
                    prompt.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    !isCollapsed && <span className="text-muted-foreground text-xs">None</span>
                  )}
                  {prompt.tags && prompt.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{prompt.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Intended Generator, Recommended Models, Technical Parameters, Variables */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 text-xs overflow-hidden" 
                data-testid={`info-row-2-${prompt.id}`}
              >
            {/* Intended Generator */}
            <div>
              <span className="font-medium text-muted-foreground">Intended Generator:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {prompt.intendedGenerators && prompt.intendedGenerators.length > 0 ? (
                  prompt.intendedGenerators.map((generator, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {generator}
                    </Badge>
                  ))
                ) : prompt.intendedGenerator ? (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {prompt.intendedGenerator}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">Any</span>
                )}
              </div>
            </div>

            {/* Recommended Models */}
            <div>
              <span className="font-medium text-muted-foreground">Recommended Models:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {prompt.recommendedModels && prompt.recommendedModels.length > 0 ? (
                  prompt.recommendedModels.slice(0, 2).map((model, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {model}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">Any</span>
                )}
                {prompt.recommendedModels && prompt.recommendedModels.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{prompt.recommendedModels.length - 2}
                  </Badge>
                )}
              </div>
            </div>

            {/* Technical Parameters */}
            <div>
              <span className="font-medium text-muted-foreground">Technical Parameters:</span>
              <div className="mt-1">
                {prompt.technicalParams && Object.keys(prompt.technicalParams as object).length > 0 ? (
                  <div className="text-xs bg-gray-50 p-2 rounded border font-mono max-h-16 overflow-y-auto">
                    {Object.entries(prompt.technicalParams as object).map(([key, value]) => (
                      <div key={key} className="truncate">
                        <span className="text-gray-600">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">None specified</span>
                )}
              </div>
            </div>

            {/* Variables */}
            <div>
              <span className="font-medium text-muted-foreground">Variables:</span>
              <div className="mt-1">
                {prompt.variables && Object.keys(prompt.variables as object).length > 0 ? (
                  <div className="text-xs bg-purple-50 p-2 rounded border font-mono max-h-16 overflow-y-auto">
                    {Object.entries(prompt.variables as object).map(([key, value]) => (
                      <div key={key} className="truncate">
                        <span className="text-purple-600">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">None specified</span>
                )}
              </div>
            </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 3: Notes, Author, and License */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut", delay: 0.2 }}
                className="grid grid-cols-3 gap-2 md:gap-3 text-xs overflow-hidden" 
                data-testid={`info-row-3-${prompt.id}`}
              >
            {/* Notes */}
            <div>
              <span className="font-medium text-muted-foreground">Notes:</span>
              <div className="mt-1">
                {editingField === 'notes' ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveEdit}
                    className="text-xs min-h-[60px]"
                    placeholder="Add notes..."
                    autoFocus
                    data-testid={`textarea-notes-${prompt.id}`}
                  />
                ) : prompt.notes ? (
                  <div 
                    className={`text-xs bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 max-h-20 overflow-y-auto leading-relaxed ${
                      canEdit ? 'cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/40 hover:border-yellow-300 dark:hover:border-yellow-700' : ''
                    }`}
                    onDoubleClick={() => startEdit('notes')}
                    title={canEdit ? 'Double-click to edit' : ''}
                    data-testid={`text-notes-${prompt.id}`}
                  >
                    {prompt.notes}
                  </div>
                ) : canEdit ? (
                  <span 
                    className="text-muted-foreground text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -mx-1"
                    onDoubleClick={() => startEdit('notes')}
                    title="Double-click to add notes"
                    data-testid={`text-no-notes-${prompt.id}`}
                  >
                    No notes (double-click to add)
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">No notes</span>
                )}
              </div>
            </div>

            {/* Author */}
            <div>
              <span className="font-medium text-muted-foreground">Author:</span>
              <div className="mt-1">
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                  {prompt.author || 'Not specified'}
                </Badge>
              </div>
            </div>

            {/* License */}
            <div>
              <span className="font-medium text-muted-foreground">License:</span>
              <div className="mt-1">
                {prompt.license ? (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    {prompt.license}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">Not specified</span>
                )}
              </div>
            </div>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent data-testid={`modal-delete-confirm-${prompt.id}`}>
            <DialogHeader>
              <DialogTitle>Delete Prompt</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{prompt.name}"?
                {prompt.isPublic && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                    <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">⚠️ This is a public prompt</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Other users may be using or have bookmarked this prompt. Consider making it private instead of deleting it.</p>
                  </div>
                )}
                {deleteRelatedData && (deleteRelatedData.likesCount > 0 || deleteRelatedData.favoritesCount > 0 || deleteRelatedData.ratingsCount > 0) && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                    <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">This prompt has related data that will also be deleted:</p>
                    <ul className="text-sm space-y-1 text-amber-700 dark:text-amber-300">
                      {deleteRelatedData.likesCount > 0 && (
                        <li>• {deleteRelatedData.likesCount} like{deleteRelatedData.likesCount !== 1 ? 's' : ''}</li>
                      )}
                      {deleteRelatedData.favoritesCount > 0 && (
                        <li>• {deleteRelatedData.favoritesCount} bookmark{deleteRelatedData.favoritesCount !== 1 ? 's' : ''}</li>
                      )}
                      {deleteRelatedData.ratingsCount > 0 && (
                        <li>• {deleteRelatedData.ratingsCount} rating{deleteRelatedData.ratingsCount !== 1 ? 's' : ''}</li>
                      )}
                    </ul>
                  </div>
                )}
                <p className="mt-3 text-sm text-muted-foreground">This action cannot be undone.</p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                data-testid={`button-cancel-delete-${prompt.id}`}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid={`button-confirm-delete-${prompt.id}`}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
