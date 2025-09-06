import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Plus, Search, Filter } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { BulkEditToolbar } from "@/components/BulkEditToolbar";
import { BulkEditModal } from "@/components/BulkEditModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Prompt, User, BulkOperationType, BulkEditPrompt } from "@shared/schema";

export default function Library() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"prompts" | "favorites" | "archive">("prompts");
  
  // Bulk editing state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);

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

  // Fetch user's favorite prompts
  const { data: favoritePrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/user/favorites"],
    enabled: isAuthenticated && activeTab === "favorites",
    retry: false,
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
    const currentPrompts = activeTab === "favorites" ? favoritePrompts : prompts;
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
    const currentPrompts = activeTab === "favorites" ? favoritePrompts : prompts;
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
            My Prompt Library
          </h1>
          <p className="text-muted-foreground">Manage and organize all your AI prompts</p>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6">
            <Button
              variant={activeTab === "prompts" ? "default" : "ghost"}
              onClick={() => setActiveTab("prompts")}
              data-testid="tab-my-prompts"
            >
              My Prompts
            </Button>
            <Button
              variant={activeTab === "favorites" ? "default" : "ghost"}
              onClick={() => setActiveTab("favorites")}
              data-testid="tab-favorites"
            >
              My Favorites
            </Button>
            <Button
              variant={activeTab === "archive" ? "default" : "ghost"}
              onClick={() => setActiveTab("archive")}
              data-testid="tab-archive"
            >
              Archive
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-category">
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
              
{activeTab !== "archive" && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <Button onClick={() => refetch()} data-testid="button-apply-filters">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Edit Toolbar */}
        <BulkEditToolbar
          selectedCount={selectedPromptIds.size}
          totalCount={activeTab === "favorites" ? favoritePrompts.length : prompts.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkOperation={handleBulkOperation}
          onToggleBulkMode={handleToggleBulkMode}
          isBulkMode={isBulkMode}
          isLoading={bulkOperationMutation.isPending}
        />

        {/* Content Grid */}
        <div className="space-y-4" data-testid={`section-${activeTab}`}>
          {activeTab === "prompts" ? (
            prompts.length > 0 ? (
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
            )
          ) : activeTab === "favorites" ? (
            favoritePrompts.length > 0 ? (
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">No favorite prompts yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Click the star icon on any prompt to add it to your favorites!
                  </p>
                </CardContent>
              </Card>
            )
          ) : activeTab === "archive" ? (
            prompts.length > 0 ? (
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
            )
          ) : null}
        </div>
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
    </>
  );
}