import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { Lightbulb, Plus, Search, Filter, FolderPlus, Folder, Edit, Trash2, Globe, Lock, MoreHorizontal, SortAsc, SortDesc } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { BulkEditToolbar } from "@/components/BulkEditToolbar";
import { BulkEditModal } from "@/components/BulkEditModal";
import { CollectionItem } from "@/components/CollectionItem";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { Prompt, User, BulkOperationType, BulkEditPrompt, Collection } from "@shared/schema";

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
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"prompts" | "bookmarked" | "collections" | "archive">("prompts");
  
  // Bulk editing state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);

  // Collections state
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [editCollectionModalOpen, setEditCollectionModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("");
  const [collectionFilterType, setCollectionFilterType] = useState<"all" | "public" | "private">("all");
  const [collectionSortBy, setCollectionSortBy] = useState<"name" | "date" | "type">("date");
  const [collectionSortOrder, setCollectionSortOrder] = useState<"asc" | "desc">("desc");

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
    if (user?.id) params.append("userId", user.id);
    if (searchQuery) params.append("search", searchQuery);
    if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
    
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
    mutationFn: async (data: CollectionFormData) => {
      return await apiRequest("PUT", `/api/collections/${selectedCollection?.id}`, data);
    },
    onSuccess: () => {
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setEditCollectionModalOpen(false);
      setSelectedCollection(null);
      toast({
        title: "Success",
        description: "Collection updated successfully",
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
    mutationFn: async (collectionId: string) => {
      return await apiRequest("DELETE", `/api/collections/${collectionId}`);
    },
    onSuccess: () => {
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Collection deleted successfully",
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
    setEditingPrompt(null);
    setPromptModalOpen(true);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setPromptModalOpen(true);
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
      return response.json();
    },
    onSuccess: (result) => {
      // Invalidate all prompt queries to refresh data
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey?.includes("/api/prompts") || queryKey?.includes("/api/user");
        }
      });
      
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
    updateCollectionMutation.mutate(data);
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
      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prompts" data-testid="tab-my-prompts">
              My Prompts
            </TabsTrigger>
            <TabsTrigger value="bookmarked" data-testid="tab-bookmarked">
              Bookmarked
            </TabsTrigger>
            <TabsTrigger value="collections" data-testid="tab-collections">
              Collections
            </TabsTrigger>
            <TabsTrigger value="archive" data-testid="tab-archive">
              Archive
            </TabsTrigger>
          </TabsList>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-4">
            {/* Search Bar with Filter Dropdown */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setTimeout(() => refetch(), 500);
                  }}
                  className="pl-10 pr-4"
                  data-testid="input-search"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-filter">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Category Filter */}
                  <div className="px-2 py-2">
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={categoryFilter} onValueChange={(value) => {
                      setCategoryFilter(value);
                      setTimeout(() => refetch(), 100);
                    }}>
                      <SelectTrigger className="w-full" data-testid="select-category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
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
                  
                  {/* Status Filter */}
                  <div className="px-2 py-2">
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={(value) => {
                      setStatusFilter(value);
                      setTimeout(() => refetch(), 100);
                    }}>
                      <SelectTrigger className="w-full" data-testid="select-status">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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
              prompts.map((prompt) => (
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
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No prompts found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || categoryFilter || statusFilter
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
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setTimeout(() => refetch(), 500);
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
              favoritePrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isSelectable={isBulkMode}
                  isSelected={selectedPromptIds.has(prompt.id)}
                  onSelectionChange={handleSelectionChange}
                />
              ))
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

              {/* Collections Filter and Search */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search collections..."
                        value={collectionSearchTerm}
                        onChange={(e) => setCollectionSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-collections"
                      />
                    </div>
                    
                    <Select value={collectionFilterType} onValueChange={setCollectionFilterType}>
                      <SelectTrigger data-testid="select-collection-type">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={collectionSortBy} onValueChange={setCollectionSortBy}>
                      <SelectTrigger data-testid="select-collection-sort">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setCollectionSortOrder(collectionSortOrder === "asc" ? "desc" : "asc")}
                      data-testid="button-sort-order"
                    >
                      {collectionSortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      {collectionSortOrder === "asc" ? "Ascending" : "Descending"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Collections Grid */}
              {collectionsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading collections...</p>
                </div>
              ) : filteredAndSortedCollections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedCollections.map((collection: any) => (
                    <Card key={collection.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{collection.name}</h3>
                          </div>
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
                                onClick={() => deleteCollectionMutation.mutate(collection.id)}
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
            {/* Search Bar for archive */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setTimeout(() => refetch(), 500);
                  }}
                  className="pl-10 pr-4"
                  data-testid="input-search"
                />
              </div>
            </div>

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
              prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  showActions={true}
                  onEdit={handleEditPrompt}
                  isSelectable={isBulkMode}
                  isSelected={selectedPromptIds.has(prompt.id)}
                  onSelectionChange={handleSelectionChange}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No archived prompts</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || categoryFilter
                      ? "Try adjusting your filters to see more results."
                      : "You haven't archived any prompts yet. Use the archive button on any prompt to move it here."}
                  </p>
                </CardContent>
              </Card>
            )}
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
    </>
  );
}