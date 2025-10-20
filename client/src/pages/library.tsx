import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Lightbulb, Plus, Search, Filter, FolderPlus, Folder, Edit, Trash2, Globe, Lock, MoreHorizontal, SortAsc, SortDesc, Activity, BookOpen, Share2, Heart, Star, UserPlus, Users } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { MultiSelectFilters } from "@/components/MultiSelectFilters";
import type { MultiSelectFilters as MultiSelectFiltersType, EnabledFilters } from "@/components/MultiSelectFilters";
import { PromptModal } from "@/components/PromptModal";
import { BulkEditToolbar } from "@/components/BulkEditToolbar";
import { BulkEditModal } from "@/components/BulkEditModal";
import { BulkImportModal } from "@/components/BulkImportModal";
import { CollectionItem } from "@/components/CollectionItem";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { Prompt, User, BulkOperationType, BulkEditPrompt, Collection, Activity as ActivityType } from "@shared/schema";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function Library() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Multi-select filters state
  const [multiSelectFilters, setMultiSelectFilters] = useState<MultiSelectFiltersType>({
    category: [],
    type: [],
    style: [],
    intendedGenerator: [],
    recommendedModel: [],
    collection: [],
  });
  
  // Enabled filters state
  const [enabledFilters, setEnabledFilters] = useState<EnabledFilters>({
    category: false,
    type: false,
    style: false,
    intendedGenerator: false,
    recommendedModel: false,
    collection: false,
  });
  
  const [statusFilter, setStatusFilter] = useState("");
  
  // Parse query parameters to get the tab, fallback to localStorage, then default
  const queryParams = new URLSearchParams(window.location.search);
  const tabFromQuery = queryParams.get('tab');
  const savedTab = localStorage.getItem('library-active-tab');
  const [activeTab, setActiveTab] = useState<string>(tabFromQuery || savedTab || "prompts");
  
  // Fetch user activities  
  const { data: userActivities = [] } = useQuery<any[]>({
    queryKey: ["/api/user/activities"],
    enabled: isAuthenticated && activeTab === "activity",
  });
  
  // Update tab when query parameter changes and handle action parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const action = params.get('action');
    
    if (tab && ['prompts', 'bookmarked', 'collections', 'archive'].includes(tab)) {
      setActiveTab(tab);
    }
    
    // Handle action parameters from the header dropdown
    if (action === 'new-prompt') {
      setPromptModalOpen(true);
      // Clear the action param after handling
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('action');
      const newUrl = window.location.pathname + (newParams.toString() ? '?' + newParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } else if (action === 'new-collection') {
      setActiveTab('collections');
      setCreateCollectionModalOpen(true);
      // Clear the action param after handling
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('action');
      const newUrl = window.location.pathname + (newParams.toString() ? '?' + newParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } else if (action === 'import') {
      setBulkImportModalOpen(true);
      // Clear the action param after handling
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('action');
      const newUrl = window.location.pathname + (newParams.toString() ? '?' + newParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);
  
  // Bulk editing state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);

  // Collections state
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [editCollectionModalOpen, setEditCollectionModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("");
  const [collectionFilterType, setCollectionFilterType] = useState<string>("all");
  const [collectionSortBy, setCollectionSortBy] = useState<string>("date");
  const [collectionSortOrder, setCollectionSortOrder] = useState<"asc" | "desc">("desc");
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [deleteCollectionDialogOpen, setDeleteCollectionDialogOpen] = useState(false);
  const [deleteWithPrompts, setDeleteWithPrompts] = useState(false);
  const [privacyUpdateDialogOpen, setPrivacyUpdateDialogOpen] = useState(false);
  const [updatePromptsPrivacy, setUpdatePromptsPrivacy] = useState(false);
  const [pendingCollectionData, setPendingCollectionData] = useState<CollectionFormData | null>(null);

  // Collection forms
  const createCollectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  const editCollectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  // Build query string
  const buildQuery = () => {
    const params = new URLSearchParams();
    if ((user as any)?.id) params.append("userId", (user as any).id);
    if (searchQuery) params.append("search", searchQuery);
    
    // Handle multi-select filters
    if (multiSelectFilters.category.length > 0) {
      params.append("category", multiSelectFilters.category.join(","));
    }
    if (multiSelectFilters.type.length > 0) {
      params.append("type", multiSelectFilters.type.join(","));
    }
    if (multiSelectFilters.style.length > 0) {
      params.append("style", multiSelectFilters.style.join(","));
    }
    if (multiSelectFilters.intendedGenerator.length > 0) {
      params.append("generator", multiSelectFilters.intendedGenerator.join(","));
    }
    if (multiSelectFilters.recommendedModel.length > 0) {
      params.append("model", multiSelectFilters.recommendedModel.join(","));
    }
    if (multiSelectFilters.collection.length > 0) {
      params.append("collection", multiSelectFilters.collection.join(","));
    }
    
    // Handle status filtering based on active tab
    if (activeTab === "archive") {
      params.append("status", "archived");
    } else {
      // For "prompts" tab, explicitly exclude archived prompts
      if (statusFilter === "published") {
        params.append("status", "published");
      } else if (statusFilter === "draft") {
        params.append("status", "draft");
      } else {
        // Default: show both published and draft, but NOT archived
        params.append("statusNotEqual", "archived");
      }
    }
    
    // Remove limit to show all prompts
    return params.toString();
  };

  // Fetch user's prompts
  const { data: prompts = [], refetch } = useQuery<Prompt[]>({
    queryKey: [`/api/prompts?${buildQuery()}`],
    enabled: isAuthenticated && !!user && (activeTab === "prompts" || activeTab === "archive"),
    retry: false,
  });
  
  // Refetch prompts when filters change
  useEffect(() => {
    if ((activeTab === "prompts" || activeTab === "archive") && isAuthenticated) {
      refetch();
    }
  }, [multiSelectFilters, activeTab, isAuthenticated]);

  // Fetch user's favorite prompts (bookmarked)
  const { data: favoritePrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/user/favorites"],
    enabled: isAuthenticated && activeTab === "bookmarked",
    retry: false,
  });

  // Fetch user's collections
  const { data: collections = [], isLoading: collectionsLoading, refetch: refetchCollections } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: isAuthenticated && !!user && activeTab === "collections",
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Collection mutations
  const createCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      return await apiRequest("POST", "/api/collections", {
        ...data,
        type: "user",
      });
    },
    onSuccess: () => {
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      createCollectionForm.reset();
      setCreateCollectionModalOpen(false);
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async ({ data, updatePrompts }: { data: CollectionFormData; updatePrompts: boolean }) => {
      const url = updatePrompts 
        ? `/api/collections/${selectedCollection?.id}?updatePrompts=true`
        : `/api/collections/${selectedCollection?.id}`;
      return await apiRequest("PUT", url, data);
    },
    onSuccess: () => {
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      if (updatePromptsPrivacy) {
        queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      }
      setEditCollectionModalOpen(false);
      setSelectedCollection(null);
      setPrivacyUpdateDialogOpen(false);
      setPendingCollectionData(null);
      setUpdatePromptsPrivacy(false);
      toast({
        title: "Success",
        description: updatePromptsPrivacy 
          ? "Collection and prompts privacy updated successfully"
          : "Collection updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update collection",
        variant: "destructive",
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, deletePrompts }: { collectionId: string; deletePrompts: boolean }) => {
      const url = deletePrompts 
        ? `/api/collections/${collectionId}?deletePrompts=true`
        : `/api/collections/${collectionId}?deletePrompts=false`;
      return await apiRequest("DELETE", url);
    },
    onSuccess: () => {
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      setDeleteCollectionDialogOpen(false);
      setDeletingCollection(null);
      setDeleteWithPrompts(false);
      toast({
        title: "Success",
        description: deleteWithPrompts 
          ? "Collection and all its prompts deleted successfully"
          : "Collection deleted successfully. Prompts have been preserved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive",
      });
    },
  });

  const handleCreatePrompt = () => {
    // First ensure modal is closed and state is reset
    setPromptModalOpen(false);
    setEditingPrompt(null);
    
    // Then open modal for create mode after a brief delay
    setTimeout(() => {
      setPromptModalOpen(true);
    }, 50);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    // First ensure modal is closed and state is reset
    setPromptModalOpen(false);
    setEditingPrompt(null);
    
    // Then set the new prompt and open modal after a brief delay
    // This ensures React processes the state changes in order
    setTimeout(() => {
      setEditingPrompt(prompt);
      setPromptModalOpen(true);
    }, 50);
  };

  // Bulk editing handlers
  const handleSelectionChange = (promptId: string, selected: boolean) => {
    setSelectedPromptIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(promptId);
      } else {
        newSet.delete(promptId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const currentPrompts = activeTab === "bookmarked" ? favoritePrompts : prompts;
    setSelectedPromptIds(new Set(currentPrompts.map(p => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedPromptIds(new Set());
  };

  const handleToggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedPromptIds(new Set());
  };

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedPromptIds(new Set());
    setIsBulkMode(false);
  }, [activeTab]);

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, updateData }: { operation: BulkOperationType; updateData?: BulkEditPrompt }) => {
      const response = await apiRequest("POST", "/api/prompts/bulk-operations", {
        promptIds: Array.from(selectedPromptIds),
        operation,
        updateData,
      });
      // Check if response has content before parsing
      const text = await response.text();
      if (!text) {
        return { success: 0, total: 0, failed: 0 };
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', text);
        throw new Error('Server returned invalid response');
      }
    },
    onSuccess: (result) => {
      // Invalidate all prompt-related queries to refresh UI immediately across all pages
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || 
                 queryKey?.includes("/api/user") ||
                 queryKey?.includes("/api/collections") ||
                 queryKey?.includes("/api/activities");
        }
      });
      
      // Also specifically invalidate commonly used queries for immediate updates
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      
      // Manually refetch to ensure immediate updates
      refetch();
      refetchCollections();
      
      toast({
        title: "Bulk Operation Complete",
        description: `${result.success} of ${result.total} prompts updated successfully${result.failed > 0 ? `. ${result.failed} failed.` : '.'}`,
        variant: result.failed > 0 ? "destructive" : "default",
      });
      
      setSelectedPromptIds(new Set());
      setBulkEditModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Bulk Operation Failed",
        description: "Failed to perform bulk operation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBulkOperation = (operation: BulkOperationType) => {
    if (operation === "update") {
      setBulkEditModalOpen(true);
    } else if (operation === "export") {
      handleBulkExport();
    } else {
      bulkOperationMutation.mutate({ operation });
    }
  };

  const handleBulkEdit = (updateData: BulkEditPrompt) => {
    bulkOperationMutation.mutate({ operation: "update", updateData });
  };

  const handleBulkExport = () => {
    const currentPrompts = activeTab === "bookmarked" ? favoritePrompts : prompts;
    const selectedPrompts = currentPrompts.filter(p => selectedPromptIds.has(p.id));
    
    const exportData = selectedPrompts.map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      content: prompt.promptContent,
      category: prompt.category,
      tags: prompt.tags,
      promptType: prompt.promptType,
      promptStyle: prompt.promptStyle,
      license: prompt.license,
      created: prompt.createdAt,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `${selectedPrompts.length} prompts exported successfully`,
    });
  };

  // Collection handlers
  const onCreateCollectionSubmit = (data: CollectionFormData) => {
    createCollectionMutation.mutate(data);
  };

  const onEditCollectionSubmit = (data: CollectionFormData) => {
    // Check if privacy setting is changing
    if (selectedCollection && selectedCollection.isPublic !== data.isPublic) {
      // Show dialog to ask about updating prompts
      setPendingCollectionData(data);
      setPrivacyUpdateDialogOpen(true);
    } else {
      // No privacy change, proceed normally
      updateCollectionMutation.mutate({ data, updatePrompts: false });
    }
  };

  const handlePrivacyUpdateConfirm = () => {
    if (pendingCollectionData) {
      updateCollectionMutation.mutate({ 
        data: pendingCollectionData, 
        updatePrompts: updatePromptsPrivacy 
      });
    }
  };

  const openEditCollectionModal = (collection: Collection) => {
    setSelectedCollection(collection);
    editCollectionForm.reset({
      name: collection.name,
      description: collection.description || "",
      isPublic: collection.isPublic || false,
    });
    setEditCollectionModalOpen(true);
  };

  // Filter and sort collections
  const filteredAndSortedCollections = (() => {
    if (!collections) return [];
    
    let filtered = collections;

    // Filter by search term
    if (collectionSearchTerm.trim()) {
      const searchLower = collectionSearchTerm.toLowerCase().trim();
      filtered = filtered.filter((collection: any) =>
        collection.name?.toLowerCase().includes(searchLower) ||
        collection.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by type
    if (collectionFilterType !== "all") {
      filtered = filtered.filter((collection: any) => {
        if (collectionFilterType === "public") return collection.isPublic;
        if (collectionFilterType === "private") return !collection.isPublic;
        return true;
      });
    }

    // Sort collections
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (collectionSortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "date":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case "type":
          aValue = a.isPublic ? "public" : "private";
          bValue = b.isPublic ? "public" : "private";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return collectionSortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return collectionSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  })();

  // Activity helper functions
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case "created_prompt":
        return <BookOpen className="h-4 w-4" />;
      case "shared_prompt":
        return <Share2 className="h-4 w-4" />;
      case "liked_prompt":
        return <Heart className="h-4 w-4" />;
      case "favorited_prompt":
        return <Star className="h-4 w-4" />;
      case "followed_user":
        return <UserPlus className="h-4 w-4" />;
      case "joined_community":
        return <Users className="h-4 w-4" />;
      case "created_collection":
        return <Folder className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityDescription = (activity: any) => {
    const targetEntity = activity.targetEntity;
    
    const getEntityLink = () => {
      if (!targetEntity) return null;
      
      switch (activity.targetType) {
        case "prompt":
          return targetEntity.isPublic ? (
            <span className="font-semibold">{targetEntity.name}</span>
          ) : (
            <span className="font-semibold">{targetEntity.name}</span>
          );
        case "user":
          return (
            <Link href={`/user/${targetEntity.username}`}>
              <span className="font-semibold hover:underline cursor-pointer">
                @{targetEntity.username || `${targetEntity.firstName} ${targetEntity.lastName}`.trim()}
              </span>
            </Link>
          );
        case "collection":
          return (
            <Link href={`/collections?view=${targetEntity.id}`}>
              <span className="font-semibold hover:underline cursor-pointer">{targetEntity.name}</span>
            </Link>
          );
        case "community":
          return <span className="font-semibold">{targetEntity.name}</span>;
        default:
          return null;
      }
    };
    
    switch (activity.actionType) {
      case "created_prompt":
        return (
          <span>
            You created a new prompt {targetEntity && (
              <>"{getEntityLink()}"</>
            )}
          </span>
        );
      case "shared_prompt":
        return (
          <span>
            You shared {targetEntity ? (
              <>the prompt "{getEntityLink()}"</>
            ) : (
              "a prompt"
            )}
          </span>
        );
      case "liked_prompt":
        return (
          <span>
            You liked {targetEntity ? (
              <>the prompt "{getEntityLink()}"</>
            ) : (
              "a prompt"
            )}
          </span>
        );
      case "favorited_prompt":
        return (
          <span>
            You favorited {targetEntity ? (
              <>the prompt "{getEntityLink()}"</>
            ) : (
              "a prompt"
            )}
          </span>
        );
      case "followed_user":
        return (
          <span>
            You started following {targetEntity ? (
              getEntityLink()
            ) : (
              "someone"
            )}
          </span>
        );
      case "joined_community":
        return (
          <span>
            You joined {targetEntity ? (
              <>the community "{getEntityLink()}"</>
            ) : (
              "a community"
            )}
          </span>
        );
      case "created_collection":
        return (
          <span>
            You created a new collection {targetEntity && (
              <>"{getEntityLink()}"</>
            )}
          </span>
        );
      default:
        return <span>You performed an action</span>;
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="h-4 w-4 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <>
      <div className="container mx-auto px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-8 pb-24 lg:pb-8">
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          localStorage.setItem('library-active-tab', value);
        }} className="space-y-3 md:space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="prompts" className="text-xs md:text-sm" data-testid="tab-my-prompts">
              My Prompts
            </TabsTrigger>
            <TabsTrigger value="bookmarked" className="text-xs md:text-sm" data-testid="tab-bookmarked">
              Bookmarks
            </TabsTrigger>
            <TabsTrigger value="collections" className="text-xs md:text-sm" data-testid="tab-collections">
              Collections
            </TabsTrigger>
            <TabsTrigger value="archive" className="text-xs md:text-sm" data-testid="tab-archive">
              Archived
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs md:text-sm" data-testid="tab-my-activity">
              My Activity
            </TabsTrigger>
          </TabsList>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-4">
            {/* Search Bar with Multi-Select Filters */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    refetch();
                  }}
                  className="pl-10 pr-4"
                  data-testid="input-search"
                />
              </div>
              
              {/* Filter Options Button */}
              <MultiSelectFilters
                onFiltersChange={(filters) => {
                  setMultiSelectFilters(filters);
                }}
                onEnabledFiltersChange={setEnabledFilters}
                enabledFilters={enabledFilters}
                selectedFilters={multiSelectFilters}
                sortBy=""
                showButton={true}
                showTabs={false}
              />
            </div>
            
            {/* Multi-Select Filter Tabs - Show below search */}
            <MultiSelectFilters
              onFiltersChange={(filters) => {
                setMultiSelectFilters(filters);
              }}
              onEnabledFiltersChange={setEnabledFilters}
              enabledFilters={enabledFilters}
              selectedFilters={multiSelectFilters}
              sortBy=""
              showButton={false}
              showTabs={true}
            />

            {/* Bulk Edit Toolbar */}
          <BulkEditToolbar
            selectedCount={selectedPromptIds.size}
            totalCount={activeTab === "bookmarked" ? favoritePrompts.length : prompts.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBulkOperation={handleBulkOperation}
            onToggleBulkMode={handleToggleBulkMode}
            isBulkMode={isBulkMode}
            isLoading={bulkOperationMutation.isPending}
          />

            {/* Content Grid */}
            {prompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    showActions={true}
                    onEdit={handleEditPrompt}
                    isSelectable={isBulkMode}
                    isSelected={selectedPromptIds.has(prompt.id)}
                    onSelectionChange={handleSelectionChange}
                    allowInlineEdit={true}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No prompts found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || Object.values(multiSelectFilters).some(f => f.length > 0) || statusFilter
                      ? "Try adjusting your filters to see more results."
                      : "You haven't created any prompts yet. Create your first prompt to get started."}
                  </p>
                  <Button onClick={handleCreatePrompt} data-testid="button-create-first-prompt">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Prompt
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookmarked" className="space-y-4">
            {/* Search Bar for bookmarked */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    refetch();
                  }}
                  className="pl-10 pr-4"
                  data-testid="input-search"
                />
              </div>
            </div>

            {/* Bulk Edit Toolbar */}
            <BulkEditToolbar
              selectedCount={selectedPromptIds.size}
              totalCount={favoritePrompts.length}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkOperation={handleBulkOperation}
              onToggleBulkMode={handleToggleBulkMode}
              isBulkMode={isBulkMode}
              isLoading={bulkOperationMutation.isPending}
            />

            {/* Content Grid */}
            {favoritePrompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoritePrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    isSelectable={isBulkMode}
                    isSelected={selectedPromptIds.has(prompt.id)}
                    onSelectionChange={handleSelectionChange}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No bookmarked prompts yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Click the bookmark icon on any prompt to add it to your bookmarks!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <div>
              {/* Collections Search Bar with Filter Dropdown */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search collections..."
                    value={collectionSearchTerm}
                    onChange={(e) => setCollectionSearchTerm(e.target.value)}
                    className="pl-10 pr-4"
                    data-testid="input-search-collections"
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" data-testid="button-filter-collections">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Type Filter */}
                    <div className="px-2 py-2">
                      <label className="text-sm font-medium mb-2 block">Type</label>
                      <Select value={collectionFilterType} onValueChange={setCollectionFilterType}>
                        <SelectTrigger className="w-full" data-testid="select-collection-type">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sort By */}
                    <div className="px-2 py-2">
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <Select value={collectionSortBy} onValueChange={setCollectionSortBy}>
                        <SelectTrigger className="w-full" data-testid="select-collection-sort">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date Created</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Sort Order */}
                    <div className="px-2 py-2">
                      <label className="text-sm font-medium mb-2 block">Order</label>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setCollectionSortOrder(collectionSortOrder === "asc" ? "desc" : "asc")}
                        data-testid="button-sort-order"
                      >
                        {collectionSortOrder === "asc" ? (
                          <>
                            <SortAsc className="h-4 w-4" />
                            <span>Ascending</span>
                          </>
                        ) : (
                          <>
                            <SortDesc className="h-4 w-4" />
                            <span>Descending</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Collections Header with Actions */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Collections</h2>
                <Dialog open={createCollectionModalOpen} onOpenChange={setCreateCollectionModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2" data-testid="button-create-collection">
                      <FolderPlus className="h-4 w-4" />
                      New Collection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Collection</DialogTitle>
                    </DialogHeader>
                    <Form {...createCollectionForm}>
                      <form onSubmit={createCollectionForm.handleSubmit(onCreateCollectionSubmit)} className="space-y-4">
                        <FormField
                          control={createCollectionForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Collection Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Creative Writing, Business Ideas" {...field} data-testid="input-collection-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createCollectionForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe what this collection contains..."
                                  {...field}
                                  data-testid="textarea-collection-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createCollectionForm.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Make Public</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Allow others to discover and view this collection
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                  data-testid="checkbox-collection-public"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-3">
                          <Button type="button" variant="outline" onClick={() => setCreateCollectionModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createCollectionMutation.isPending}
                            data-testid="button-submit-collection"
                          >
                            {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Collections Grid */}
              {collectionsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading collections...</p>
                </div>
              ) : filteredAndSortedCollections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAndSortedCollections.map((collection: any) => (
                    <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <Link href={`/collection/${collection.id}`} className="flex-1">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold text-sm">{collection.name}</h3>
                            </div>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-collection-menu-${collection.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditCollectionModal(collection)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setDeletingCollection(collection);
                                  setDeleteCollectionDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {collection.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={collection.isPublic ? "default" : "secondary"}>
                              {collection.isPublic ? (
                                <>
                                  <Globe className="h-3 w-3 mr-1" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Private
                                </>
                              )}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {collection.promptCount || 0} prompts
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(collection.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Folder className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {collectionSearchTerm ? "No collections found" : "No collections yet"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {collectionSearchTerm 
                        ? "Try adjusting your search terms" 
                        : "Create your first collection to organize your prompts"
                      }
                    </p>
                    {!collectionSearchTerm && (
                      <Button onClick={() => setCreateCollectionModalOpen(true)} data-testid="button-create-first-collection">
                        <FolderPlus className="h-4 w-4 mr-2" />
                        Create Your First Collection
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archive" className="space-y-4">
            {/* Search Bar with Multi-Select Filters for archive */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search archived prompts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    refetch();
                  }}
                  className="pl-10 pr-4"
                  data-testid="input-search"
                />
              </div>
              
              {/* Filter Options Button */}
              <MultiSelectFilters
                onFiltersChange={(filters) => {
                  setMultiSelectFilters(filters);
                }}
                onEnabledFiltersChange={setEnabledFilters}
                enabledFilters={enabledFilters}
                selectedFilters={multiSelectFilters}
                sortBy=""
                showButton={true}
                showTabs={false}
              />
            </div>
            
            {/* Multi-Select Filter Tabs - Show below search */}
            <MultiSelectFilters
              onFiltersChange={(filters) => {
                setMultiSelectFilters(filters);
              }}
              onEnabledFiltersChange={setEnabledFilters}
              enabledFilters={enabledFilters}
              selectedFilters={multiSelectFilters}
              sortBy=""
              showButton={false}
              showTabs={true}
            />

            {/* Bulk Edit Toolbar */}
            <BulkEditToolbar
              selectedCount={selectedPromptIds.size}
              totalCount={prompts.length}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkOperation={handleBulkOperation}
              onToggleBulkMode={handleToggleBulkMode}
              isBulkMode={isBulkMode}
              isLoading={bulkOperationMutation.isPending}
            />

            {/* Content Grid */}
            {prompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    showActions={true}
                    onEdit={handleEditPrompt}
                    isSelectable={isBulkMode}
                    isSelected={selectedPromptIds.has(prompt.id)}
                    onSelectionChange={handleSelectionChange}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No archived prompts</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || Object.values(multiSelectFilters).some(f => f.length > 0)
                      ? "Try adjusting your filters to see more results."
                      : "You haven't archived any prompts yet. Use the archive button on any prompt to move it here."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {userActivities.length > 0 ? (
                  <div className="space-y-4">
                    {userActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.actionType)}
                            <div className="text-sm">
                              {getActivityDescription(activity)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.createdAt ? formatDate(activity.createdAt) : 'recently'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No activity yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Prompt Modal */}
      <PromptModal
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        prompt={editingPrompt}
        mode={editingPrompt ? "edit" : "create"}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={bulkEditModalOpen}
        onClose={() => setBulkEditModalOpen(false)}
        onSubmit={handleBulkEdit}
        selectedCount={selectedPromptIds.size}
        isLoading={bulkOperationMutation.isPending}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={bulkImportModalOpen}
        onOpenChange={setBulkImportModalOpen}
        collections={collections}
      />

      {/* Edit Collection Modal */}
      <Dialog open={editCollectionModalOpen} onOpenChange={setEditCollectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <Form {...editCollectionForm}>
            <form onSubmit={editCollectionForm.handleSubmit(onEditCollectionSubmit)} className="space-y-4">
              <FormField
                control={editCollectionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-collection-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editCollectionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-edit-collection-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editCollectionForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Make Public</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow others to discover and view this collection
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                        data-testid="checkbox-edit-collection-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditCollectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCollectionMutation.isPending}
                  data-testid="button-submit-edit-collection"
                >
                  {updateCollectionMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Privacy Update Confirmation Dialog */}
      <Dialog open={privacyUpdateDialogOpen} onOpenChange={setPrivacyUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Collection Privacy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are changing the collection "{selectedCollection?.name}" to {pendingCollectionData?.isPublic ? 'public' : 'private'}.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="collection-only"
                  name="privacy-option"
                  checked={!updatePromptsPrivacy}
                  onChange={() => setUpdatePromptsPrivacy(false)}
                />
                <label htmlFor="collection-only" className="text-sm cursor-pointer">
                  <div className="font-medium">Update collection only</div>
                  <div className="text-muted-foreground">
                    Change the collection visibility but keep individual prompt privacy settings as they are
                  </div>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="collection-and-prompts"
                  name="privacy-option"
                  checked={updatePromptsPrivacy}
                  onChange={() => setUpdatePromptsPrivacy(true)}
                />
                <label htmlFor="collection-and-prompts" className="text-sm cursor-pointer">
                  <div className="font-medium">Update collection and all prompts</div>
                  <div className="text-muted-foreground">
                    Make all prompts in this collection {pendingCollectionData?.isPublic ? 'public' : 'private'} as well
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPrivacyUpdateDialogOpen(false);
                  setPendingCollectionData(null);
                  setUpdatePromptsPrivacy(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePrivacyUpdateConfirm}
                disabled={updateCollectionMutation.isPending}
              >
                {updateCollectionMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Confirmation Dialog */}
      <Dialog open={deleteCollectionDialogOpen} onOpenChange={setDeleteCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the collection "{deletingCollection?.name}"?
            </p>
            
            {deletingCollection && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="delete-collection-only"
                    name="delete-option"
                    checked={!deleteWithPrompts}
                    onChange={() => setDeleteWithPrompts(false)}
                  />
                  <label htmlFor="delete-collection-only" className="text-sm cursor-pointer">
                    <div className="font-medium">Delete collection only</div>
                    <div className="text-muted-foreground">
                      Remove the collection but keep all prompts (they will no longer be organized in this collection)
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="delete-collection-and-prompts"
                    name="delete-option"
                    checked={deleteWithPrompts}
                    onChange={() => setDeleteWithPrompts(true)}
                  />
                  <label htmlFor="delete-collection-and-prompts" className="text-sm cursor-pointer">
                    <div className="font-medium text-destructive">Delete collection and all prompts</div>
                    <div className="text-muted-foreground">
                      Permanently delete the collection and all prompts within it
                    </div>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteCollectionDialogOpen(false);
                  setDeletingCollection(null);
                  setDeleteWithPrompts(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingCollection) {
                    deleteCollectionMutation.mutate({
                      collectionId: deletingCollection.id,
                      deletePrompts: deleteWithPrompts,
                    });
                  }
                }}
                disabled={deleteCollectionMutation.isPending}
              >
                {deleteCollectionMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}