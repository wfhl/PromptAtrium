import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Plus, Search, FileText, Heart, Folder, GitBranch, ChevronDown } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { QuickActions } from "@/components/QuickActions";
import { StatsCard } from "@/components/StatsCard";
import { CollectionItem } from "@/components/CollectionItem";
import { ActivityItem } from "@/components/ActivityItem";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Prompt, Collection } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch user's recent prompts
  const { data: userPrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts", { userId: user?.id, limit: 3 }],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Fetch community featured prompts
  const { data: communityPrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts", { isPublic: true, isFeatured: true, limit: 3 }],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch user collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: isAuthenticated,
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

  const handleCreateCollection = () => {
    toast({
      title: "Coming Soon",
      description: "Collection creation will be available soon!",
    });
  };

  const handleStartProject = () => {
    toast({
      title: "Coming Soon",
      description: "Project creation will be available soon!",
    });
  };

  const handleImportPrompts = () => {
    toast({
      title: "Coming Soon",
      description: "Prompt import will be available soon!",
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PromptAtrium</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-primary font-medium border-b-2 border-primary pb-4 -mb-4" data-testid="nav-dashboard">
                Dashboard
              </Link>
              <Link href="/library" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-library">
                My Library
              </Link>
              <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-community">
                Community
              </Link>
              <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-projects">
                Projects
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              className="hidden md:flex items-center space-x-2"
              onClick={handleCreatePrompt}
              data-testid="button-new-prompt"
            >
              <Plus className="h-4 w-4" />
              <span>New Prompt</span>
            </Button>
            
            <div className="relative">
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium" data-testid="text-username">
                  {user?.firstName || user?.email?.split("@")[0] || "User"}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-welcome">
                Welcome back, {user?.firstName || user?.email?.split("@")[0] || "User"}
              </h1>
              <p className="text-muted-foreground">Manage your AI prompts and discover community favorites</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Your Prompts"
              value={userStats?.totalPrompts || 0}
              icon={FileText}
              iconColor="bg-primary/10 text-primary"
              testId="stat-prompts"
            />
            <StatsCard
              title="Total Likes"
              value={userStats?.totalLikes || 0}
              icon={Heart}
              iconColor="bg-red-500/10 text-red-500"
              testId="stat-likes"
            />
            <StatsCard
              title="Collections"
              value={userStats?.collections || 0}
              icon={Folder}
              iconColor="bg-green-500/10 text-green-500"
              testId="stat-collections"
            />
            <StatsCard
              title="Forks Created"
              value={userStats?.forksCreated || 0}
              icon={GitBranch}
              iconColor="bg-blue-500/10 text-blue-500"
              testId="stat-forks"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Recent Prompts */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Recent Prompts</h2>
                <Link href="/library">
                  <Button variant="link" className="text-primary hover:underline p-0" data-testid="link-view-all-prompts">
                    View all
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4" data-testid="section-recent-prompts">
                {userPrompts.length > 0 ? (
                  userPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      showActions={true}
                      onEdit={handleEditPrompt}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground mb-4">You haven't created any prompts yet.</p>
                      <Button onClick={handleCreatePrompt} data-testid="button-create-first-prompt">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Prompt
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Community Highlights */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Community Highlights</h2>
                <div className="flex items-center space-x-2">
                  <Button size="sm" className="bg-primary text-primary-foreground" data-testid="filter-featured">
                    Featured
                  </Button>
                  <Button size="sm" variant="ghost" data-testid="filter-trending">
                    Trending
                  </Button>
                  <Button size="sm" variant="ghost" data-testid="filter-recent">
                    Recent
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4" data-testid="section-community-highlights">
                {communityPrompts.length > 0 ? (
                  communityPrompts.map((prompt) => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No featured prompts available.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <QuickActions
              onCreatePrompt={handleCreatePrompt}
              onCreateCollection={handleCreateCollection}
              onStartProject={handleStartProject}
              onImportPrompts={handleImportPrompts}
            />
            
            {/* Collections */}
            <Card data-testid="card-collections">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Collections</CardTitle>
                  <Link href="/collections">
                    <Button variant="link" className="text-primary hover:underline p-0" data-testid="link-view-all-collections">
                      View all
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {collections.length > 0 ? (
                  collections.slice(0, 3).map((collection) => (
                    <CollectionItem key={collection.id} collection={collection} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No collections yet. Create one to organize your prompts.
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Community Activity */}
            <Card data-testid="card-activity">
              <CardHeader>
                <CardTitle>Community Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ActivityItem
                  type="fork"
                  user="@mike_creates"
                  promptName="Anime Character Design"
                  timestamp="2 hours ago"
                  testId="activity-1"
                />
                <ActivityItem
                  type="like"
                  user="@designpro"
                  promptName="Logo Design Prompt"
                  timestamp="4 hours ago"
                  testId="activity-2"
                />
                <ActivityItem
                  type="create"
                  user="@artisan_ai"
                  promptName="Minimalist Architecture"
                  timestamp="6 hours ago"
                  testId="activity-3"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Prompt Modal */}
      <PromptModal
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        prompt={editingPrompt}
        mode={editingPrompt ? "edit" : "create"}
      />
    </div>
  );
}
