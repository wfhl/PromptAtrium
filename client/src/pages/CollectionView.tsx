import { useState, useEffect } from "react";
import { redirectToLogin } from "@/utils/auth-redirect";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Globe, 
  Lock, 
  Edit,
  Trash2,
  Plus,
  BookOpen,
  Calendar,
  User
} from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { BulkEditToolbar } from "@/components/BulkEditToolbar";
import { BulkEditModal } from "@/components/BulkEditModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Prompt, Collection, BulkOperationType, BulkEditPrompt } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function CollectionView() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const collectionId = params.id;
  const [, navigate] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editCollectionModalOpen, setEditCollectionModalOpen] = useState(false);
  
  // Bulk editing state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to view collections.",
        variant: "destructive",
      });
      setTimeout(() => {
        redirectToLogin();
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch collection details
  const { data: collection, isLoading: collectionLoading } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
    enabled: !!collectionId && isAuthenticated,
  });

  // Fetch prompts in collection
  const { data: prompts = [], refetch: refetchPrompts } = useQuery<Prompt[]>({
    queryKey: [`/api/collections/${collectionId}/prompts`],
    enabled: !!collectionId && isAuthenticated,
  });

  // Filter prompts based on search and category
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = !searchQuery || 
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.promptContent.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || prompt.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Collection edit form
  const editCollectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: collection?.name || "",
      description: collection?.description || "",
      isPublic: collection?.isPublic || false,
    },
  });

  // Reset form when collection data loads
  useEffect(() => {
    if (collection) {
      editCollectionForm.reset({
        name: collection.name,
        description: collection.description || "",
        isPublic: collection.isPublic || false,
      });
    }
  }, [collection]);

  // Update collection mutation
  const updateCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      const response = await apiRequest("PUT", `/api/collections/${collectionId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Collection updated successfully",
      });
      setEditCollectionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/collections/${collectionId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update collection",
        variant: "destructive",
      });
    },
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/collections/${collectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
      navigate("/library?tab=collections");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive",
      });
    },
  });

  // Bulk operation mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, promptIds, data }: { 
      operation: BulkOperationType; 
      promptIds: string[];
      data?: BulkEditPrompt;
    }) => {
      const response = await apiRequest("POST", "/api/prompts/bulk-operations", {
        operation,
        promptIds,
        updateData: data,
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
    onSuccess: (result, variables) => {
      const { operation } = variables;
      let message = "";
      
      switch (operation) {
        case "delete":
          message = "Prompts deleted successfully";
          break;
        case "archive":
          message = "Prompts archived successfully";
          break;
        case "unarchive":
          message = "Prompts unarchived successfully";
          break;
        case "publish":
          message = "Prompts published successfully";
          break;
        case "draft":
          message = "Prompts unpublished successfully";
          break;
        case "update":
          message = "Prompts updated successfully";
          break;
        case "makePublic":
          message = "Prompts made public successfully";
          break;
        case "makePrivate":
          message = "Prompts made private successfully";
          break;
      }
      
      toast({
        title: "Bulk Operation Complete",
        description: `${result.success} of ${result.total} ${message.toLowerCase()}${result.failed > 0 ? `. ${result.failed} failed.` : '.'}`,
        variant: result.failed > 0 ? "destructive" : "default",
      });
      
      setSelectedPromptIds(new Set());
      setIsBulkMode(false);
      refetchPrompts();
      
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
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform bulk operation",
        variant: "destructive",
      });
    },
  });

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

  const handleCreatePrompt = () => {
    // First ensure modal is closed and state is reset
    setPromptModalOpen(false);
    setEditingPrompt(null);
    
    // Then open modal for create mode after a brief delay
    setTimeout(() => {
      setPromptModalOpen(true);
    }, 50);
  };

  const handleToggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedPromptIds(new Set());
  };

  const handleSelectionChange = (promptId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedPromptIds);
    if (isSelected) {
      newSelection.add(promptId);
    } else {
      newSelection.delete(promptId);
    }
    setSelectedPromptIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedPromptIds.size === filteredPrompts.length) {
      setSelectedPromptIds(new Set());
    } else {
      setSelectedPromptIds(new Set(filteredPrompts.map(p => p.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedPromptIds(new Set());
  };

  const handleBulkOperation = (operation: BulkOperationType) => {
    if (selectedPromptIds.size === 0) return;
    
    if (operation === "update") {
      setBulkEditModalOpen(true);
    } else {
      bulkOperationMutation.mutate({
        operation,
        promptIds: Array.from(selectedPromptIds),
      });
    }
  };

  const handleBulkEdit = (data: BulkEditPrompt) => {
    bulkOperationMutation.mutate({
      operation: "update",
      promptIds: Array.from(selectedPromptIds),
      data,
    });
    setBulkEditModalOpen(false);
  };

  const handleDeleteCollection = () => {
    if (confirm("Are you sure you want to delete this collection? This action cannot be undone.")) {
      deleteCollectionMutation.mutate();
    }
  };

  const onEditCollectionSubmit = (data: CollectionFormData) => {
    updateCollectionMutation.mutate(data);
  };

  if (authLoading || collectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Collection Not Found</h2>
        <p className="text-muted-foreground mb-6">The collection you're looking for doesn't exist or you don't have access to it.</p>
        <Link href="/library?tab=collections">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = collection.userId === (user as any)?.id;

  return (
    <>
      <div className="container mx-auto px-4 py-2 max-w-8xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex gap-1 mb-4">
            <Link href="/library?tab=collections">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                My Collections
              </Button>
            </Link>
            <Link href="/community?tab=collections">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Community Collections
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold" data-testid="text-collection-name">
                  {collection.name}
                </h1>
                {collection.isPublic ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>
              
              {collection.description && (
                <p className="text-muted-foreground mb-4" data-testid="text-collection-description">
                  {collection.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{filteredPrompts.length} prompts</span>
                </div>
                {collection.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button 
                  size="icon"
                  onClick={handleCreatePrompt}
                  data-testid="button-add-prompt"
                >
                  <Plus className="h-6 w-6" />
                
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" data-testid="button-collection-menu">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditCollectionModalOpen(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Collection
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={handleDeleteCollection}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search prompts in this collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("Art & Design")}>
                Art & Design
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("Photography")}>
                Photography
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("Character Design")}>
                Character Design
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("Landscape")}>
                Landscape
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("Logo & Branding")}>
                Logo & Branding
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("Abstract")}>
                Abstract
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategoryFilter("Other")}>
                Other
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bulk Edit Toolbar */}
        {isOwner && (
          <BulkEditToolbar
            selectedCount={selectedPromptIds.size}
            totalCount={filteredPrompts.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBulkOperation={handleBulkOperation}
            onToggleBulkMode={handleToggleBulkMode}
            isBulkMode={isBulkMode}
            isLoading={bulkOperationMutation.isPending}
          />
        )}

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.length > 0 ? (
            filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                showActions={false}
                onEdit={handleEditPrompt}
                isSelectable={isBulkMode && isOwner}
                isSelected={selectedPromptIds.has(prompt.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || categoryFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "This collection doesn't have any prompts yet."}
                </p>
                {isOwner && (
                  <Button onClick={handleCreatePrompt}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Prompt
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Prompt Modal */}
      <PromptModal
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        prompt={editingPrompt}
        mode={editingPrompt ? "edit" : "create"}
        defaultCollectionId={collectionId}
      />

      {/* Bulk Edit Modal */}
      {isOwner && (
        <BulkEditModal
          isOpen={bulkEditModalOpen}
          onClose={() => setBulkEditModalOpen(false)}
          onSubmit={handleBulkEdit}
          selectedCount={selectedPromptIds.size}
          isLoading={bulkOperationMutation.isPending}
        />
      )}

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
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Collection name" />
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
                      <Textarea {...field} placeholder="Describe your collection..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editCollectionForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Make collection public</FormLabel>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditCollectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCollectionMutation.isPending}>
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