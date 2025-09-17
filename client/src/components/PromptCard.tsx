import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Star, GitBranch, Eye, Edit, Share2, Trash2, Image as ImageIcon, ZoomIn, X, Copy, Check, Globe, Folder, Download, Archive, Bookmark, ChevronDown, Plus, Minus, ImagePlus, Link2 } from "lucide-react";
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
import { saveToGoogleDrive, isGoogleDriveConnected } from "@/utils/googleDrive";
import { PromptImageCarousel } from "./PromptImageCarousel";

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
  // Compact mode for search results
  compact?: boolean;
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
  isProfilePage = false,
  compact = false
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
  
  // Archive confirmation dialog state
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  
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

  // Function to handle archive button click
  const handleArchiveClick = () => {
    if (prompt.status === 'archived') {
      // Unarchiving doesn't need confirmation
      archiveMutation.mutate();
    } else {
      // Show confirmation dialog for archiving
      setShowArchiveDialog(true);
    }
  };

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
      // Close the dialog
      setShowArchiveDialog(false);
      
      // Invalidate ALL prompt queries - Dashboard, Library, any page
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || queryKey?.includes("/api/user/favorites");
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"], exact: false });
      
      let description = data.archived ? "Prompt archived successfully!" : "Prompt restored from archive!";
      if (data.archived && data.madePrivate) {
        description += " It has been made private.";
      }
      if (data.archived && data.removedBookmarks) {
        description += " All bookmarks have been removed.";
      }
      
      toast({
        title: "Success",
        description,
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
      // Cancel prompt-specific queries to prevent race conditions
      await queryClient.cancelQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || 
                 queryKey?.includes("/prompts");
        }
      });
      
      // Get all existing prompt queries including collection-specific ones
      const previousData = queryClient.getQueriesData({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || 
                 queryKey?.includes("/prompts");
        }
      });
      
      // Update all matching prompt queries with optimistic visibility toggle
      queryClient.setQueriesData({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || 
                 queryKey?.includes("/prompts");
        }
      }, (old: any) => {
        if (!old) return old;
        
        // Handle array format
        if (Array.isArray(old)) {
          return old.map((p: any) => 
            p.id === prompt.id 
              ? { ...p, isPublic: !p.isPublic }
              : p
          );
        }
        
        // Handle object with items property
        if (old.items && Array.isArray(old.items)) {
          return {
            ...old,
            items: old.items.map((p: any) => 
              p.id === prompt.id 
                ? { ...p, isPublic: !p.isPublic }
                : p
            )
          };
        }
        
        return old;
      });
      
      return { previousData };
    },
    onSuccess: (data) => {
      // Invalidate prompt-specific queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || 
                 queryKey?.includes("/prompts") ||
                 queryKey?.includes("/api/user/favorites");
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
    if (!allowInlineEdit || !typedUser || String(typedUser.id) !== String(prompt.userId)) return;
    
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

  const canEdit = allowInlineEdit && typedUser && String(typedUser.id) === String(prompt.userId);

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
  
  const handleEmailPrompt = () => {
    const promptData = {
      name: prompt.name,
      description: prompt.description,
      content: prompt.promptContent,
      category: prompt.category,
      tags: prompt.tags,
    };
    
    const subject = encodeURIComponent(`Check out this prompt: ${prompt.name}`);
    const body = encodeURIComponent(
      `I found this interesting prompt and wanted to share it with you:\n\n` +
      `Name: ${prompt.name}\n` +
      `Category: ${prompt.category}\n` +
      `Description: ${prompt.description || 'N/A'}\n\n` +
      `Prompt Content:\n${prompt.promptContent}\n\n` +
      `Tags: ${prompt.tags?.join(', ') || 'None'}\n\n` +
      `View it here: ${window.location.origin}/prompt/${prompt.id}`
    );
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    toast({
      title: "Opening email client",
      description: "Your email client should open with the prompt details",
    });
  };
  
  const handleSaveToGoogleDrive = async () => {
    try {
      // Create prompt data for Google Drive
      const promptData = {
        name: prompt.name,
        description: prompt.description,
        promptContent: prompt.promptContent,
        negativePrompt: prompt.negativePrompt,
        category: prompt.category,
        tags: prompt.tags,
        status: prompt.status,
        isPublic: prompt.isPublic,
        intendedGenerator: prompt.intendedGenerator,
        technicalParams: prompt.technicalParams,
      };
      
      const dataStr = JSON.stringify(promptData, null, 2);
      const fileName = `prompt_${prompt.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      
      toast({
        title: "Saving to Google Drive...",
        description: "Please wait while we save your prompt",
      });
      
      const result = await saveToGoogleDrive(fileName, dataStr, 'application/json');
      
      toast({
        title: "Saved to Google Drive!",
        description: "Your prompt has been saved to the PromptAtrium folder in your Google Drive",
      });
      
      // Optionally open the file in a new tab
      if (result.webViewLink) {
        window.open(result.webViewLink, '_blank');
      }
    } catch (error: any) {
      console.error('Error saving to Google Drive:', error);
      
      if (error.message === 'Authentication cancelled') {
        toast({
          title: "Google Drive connection cancelled",
          description: "You cancelled the Google Drive connection",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to save to Google Drive",
          description: error.message || "An error occurred while saving to Google Drive",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleSystemShare = async () => {
    const promptUrl = `${window.location.origin}/prompt/${prompt.id}`;
    const shareData = {
      title: prompt.name,
      text: `Check out this AI prompt: ${prompt.description || prompt.name}`,
      url: promptUrl,
    };
    
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "The prompt has been shared",
        });
      } else {
        // Fallback to copying the link
        await navigator.clipboard.writeText(promptUrl);
        toast({
          title: "Link copied",
          description: "Share link copied to clipboard (Web Share API not available)",
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "Could not share the prompt",
          variant: "destructive",
        });
      }
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

  // Compact mode rendering for search results
  if (compact) {
    return (
      <Card className="border-gray-800 bg-gray-900/30 hover:bg-gray-900/50 transition-colors p-2 sm:p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{prompt.name}</h4>
            {prompt.description && (
              <p className="text-xs text-muted-foreground truncate mt-1">{prompt.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {prompt.category && (
                <Badge variant="secondary" className="text-xs py-0 px-1">
                  {prompt.category}
                </Badge>
              )}
              {prompt.promptType && (
                <Badge variant="outline" className="text-xs py-0 px-1">
                  {prompt.promptType}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {prompt.likes || 0}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`border-gray-800 bg-gray-900/30 hover:bg-gray-900/50 transition-colors cursor-pointer break-inside-avoid w-full max-w-full ${
      isSelected ? "border-primary bg-muted/30" : ""
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
        className="absolute bottom-4 right-2 h-6 w-6 p-0 z-10 opacity-60 hover:opacity-100 transition-opacity"
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
      
      <CardContent className="p-2 sm:p-3 md:p-3">
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
                      ? 'font-bold bg-gradient-to-br from-yellow-600/60 via-orange-700/60 to-orange-500/60 text-white' 
                      : 'font-bold bg-gradient-to-br from-indigo-600/60 via-purple-700/60 to-purple-500/60 text-white'
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
                {/* Only show Edit and Collections buttons if user is owner or admin */}
                {typedUser?.id && (String(typedUser.id) === String(prompt.userId) || isSuperAdmin) && (
                  <>
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
                  </>
                )}

                {/* 4. Share Menu - Share icon with dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                      data-testid={`button-share-${prompt.id}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleCopyLink}>
                      Share Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyJSON}>
                      Copy JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEmailPrompt}>
                      Email Prompt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSaveToGoogleDrive}>
                      Save to Google Drive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSystemShare}>
                      System Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 5. Download - Download icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
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

                {/* Add Example Images - Available for all users on public prompts */}
                {prompt.isPublic && typedUser?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast({ title: "Add Example Images", description: "Example image upload coming soon!" })}
                    className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                    data-testid={`button-add-images-${prompt.id}`}
                    title="Add example images to this prompt"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                )}

                {/* 7. Archive/Featured - Archive for owner/admin, Star for super admin on community page */}
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
                  // Only show Archive button for owner or admin
                  typedUser?.id && (String(typedUser.id) === String(prompt.userId) || isSuperAdmin) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleArchiveClick}
                      disabled={archiveMutation.isPending}
                      className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                      data-testid={`button-archive-${prompt.id}`}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )
                )}

                {/* 8. Delete/Hidden - Trash for owner/admin, Eye for super admin on community */}
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
                  // Only show Delete button for owner or admin
                  typedUser?.id && (String(typedUser.id) === String(prompt.userId) || isSuperAdmin) && (
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
                  )
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
              /* Community page action buttons - Show different actions based on ownership */
              <div className="flex items-center space-x-1" data-testid={`actions-community-${prompt.id}`}>
                {/* Show Edit and Collections for prompt owners and admins on Community page */}
                {isCommunityPage && typedUser?.id && (String(typedUser.id) === String(prompt.userId) || isSuperAdmin) && (
                  <>
                    {/* Edit Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit?.(prompt)}
                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                      data-testid={`button-edit-${prompt.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Collections */}
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
                  </>
                )}
                
                {/* Show Add Example Images for all users on public prompts on Community page */}
                {isCommunityPage && prompt.isPublic && typedUser?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast({ title: "Add Example Images", description: "Example image upload coming soon!" })}
                    className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                    data-testid={`button-add-images-${prompt.id}`}
                    title="Add example images to this prompt"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Common actions for all users */}
                {/* Share */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                      data-testid={`button-share-${prompt.id}`}
                    >
                      <Share2 className="h-4 w-4" />
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
                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid={`button-download-${prompt.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                {/* Copy Link */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200 hover:scale-110 active:scale-95"
                  data-testid={`button-link-${prompt.id}`}
                >
                  <Link2 className="h-4 w-4" />
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

        {/* Image Gallery - Using Carousel Component */}
        {prompt.exampleImagesUrl && prompt.exampleImagesUrl?.length > 0 && (
          <div data-testid={`gallery-images-${prompt.id}`}>
            <PromptImageCarousel
              images={prompt.exampleImagesUrl}
              promptName={prompt.name}
              onImageClick={(imageUrl) => setSelectedImage(imageUrl)}
            />
          </div>
        )}

        <div className="relative text-sm text-gray-200/70 bg-green-900/20 p-2 rounded border border-green-700/30 leading-relaxed hover:border-green-600/40 transition-colors rounded-md p-2 md:p-3 text-xs md:text-sm font-mono group" data-testid={`text-content-${prompt.id}`}>
          <div className="pr-8 max-h-[10rem] md:max-h-none overflow-y-auto">
            {prompt.promptContent}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-3 right-1 h-6 w-6 p-0 bg-transparent hover:opacity-100 text-green-400 opacity-50 transition-opacity"
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
                        alt={`@${(prompt as any).user?.username || 'User'}`}
                      />
                      <AvatarFallback className="text-xs">
                        {(prompt as any).user?.username 
                          ? (prompt as any).user.username.charAt(0).toUpperCase()
                          : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <span className="text-xs text-muted-foreground hover:text-foreground">
                        @{(prompt as any).user?.username || 'User'}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={(prompt as any).user?.profileImageUrl} 
                      alt="User"
                    />
                    <AvatarFallback className="text-xs">
                      {(prompt as any).user?.username 
                        ? (prompt as any).user.username.charAt(0).toUpperCase()
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
          <DialogContent className="max-w-4xl max-h-[90vh] p-4" data-testid={`modal-image-viewer-${prompt.id}`}>
            {selectedImage && (
              <img
                src={selectedImage.startsWith('http') ? selectedImage : `/api/objects/serve/${encodeURIComponent(selectedImage)}`}
                alt="Full size example"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
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

        {/* Archive Confirmation Dialog */}
        <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <DialogContent data-testid={`modal-archive-confirm-${prompt.id}`}>
            <DialogHeader>
              <DialogTitle>Archive Prompt</DialogTitle>
              <DialogDescription asChild>
                <div>
                  <p className="mb-3">Are you sure you want to archive "{prompt.name}"?</p>
                  
                  {prompt.isPublic && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                      <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">⚠️ This is a public prompt</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">It will be made private when archived.</p>
                    </div>
                  )}
                  
                  {isFavorited && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md">
                      <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">📌 This prompt is bookmarked</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">All bookmarks will be removed when archived.</p>
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Archived prompts will only be visible in the "Archived" section of your library and won't appear in:
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-4">
                      <li>• My Prompts</li>
                      <li>• Dashboard</li>
                      <li>• Community Prompts</li>
                      <li>• Bookmarked Prompts</li>
                    </ul>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowArchiveDialog(false)}
                data-testid={`button-cancel-archive-${prompt.id}`}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                data-testid={`button-confirm-archive-${prompt.id}`}
              >
                {archiveMutation.isPending ? "Archiving..." : "Archive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
