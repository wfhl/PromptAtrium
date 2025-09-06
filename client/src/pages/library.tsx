import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Plus, Search, Filter } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Prompt, User } from "@shared/schema";

export default function Library() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"prompts" | "favorites" | "archive">("prompts");

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
    } else if (statusFilter === "published") {
      params.append("status", "published");
    } else if (statusFilter === "draft") {
      params.append("status", "draft");
    }
    
    params.append("limit", "20");
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
    </>
  );
}