import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient, prefetchCommonData, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Heart, Folder, GitBranch, Plus, ChevronDown, ChevronUp, BookOpen, Share2, Star, UserPlus, Users, Activity } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { QuickActions } from "@/components/QuickActions";
import { BulkImportModal } from "@/components/BulkImportModal";
import { StatsCard } from "@/components/StatsCard";
import { CollectionItem } from "@/components/CollectionItem";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Prompt, Collection, User } from "@shared/schema";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface DashboardProps {
  onCreatePrompt?: () => void;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  const [communityTab, setCommunityTab] = useState("featured");

  // Initialize collapsible state from localStorage for the specific user
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);

  // Load collapsed state from localStorage once user is available
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`statsCollapsed_${user.id}`);
      if (stored !== null) {
        setIsStatsCollapsed(stored === 'true');
      }
    }
  }, [user?.id]);

  // Update localStorage when the collapsed state changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`statsCollapsed_${user.id}`, isStatsCollapsed.toString());
    }
  }, [isStatsCollapsed, user?.id]);

  // Prefetch common data for faster navigation
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      prefetchCommonData(user.id);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch user stats
  const { data: userStats } = useQuery<{
    totalPrompts: number;
    totalLikes: number;
    collections: number;
    forksCreated: number;
  }>({
    queryKey: ["/api/user/stats"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Fetch user's recent prompts (exclude archived)
  const { data: userPrompts = [] } = useQuery<Prompt[]>({
    queryKey: [`/api/prompts?userId=${user?.id || ''}&limit=3&statusNotEqual=archived`],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
  });

  // Fetch community featured prompts
  const { data: communityPrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts?isPublic=true&isFeatured=true&limit=3"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch user collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Fetch user's favorite prompts
  const { data: favoritePrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/user/favorites"],
    enabled: isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: false,
  });

  // Fetch recent activities with user data
  interface ActivityType {
    id: string;
    actionType: string;
    userId: string;
    details?: any;
    createdAt: string;
    user?: User;
  }

  const { data: recentActivities = [] } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities/recent"],
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

  // Collection form
  const createCollectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  // Collection creation mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      return await apiRequest("POST", "/api/collections", {
        ...data,
        type: "user",
      });
    },
    onSuccess: () => {
      // Invalidate and refetch collections to show new collection immediately
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
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

  const handleCreateCollection = () => {
    setCreateCollectionModalOpen(true);
  };

  const onCreateCollectionSubmit = (data: CollectionFormData) => {
    createCollectionMutation.mutate(data);
  };

  const handleStartProject = () => {
    toast({
      title: "Coming Soon",
      description: "Project creation will be available soon!",
    });
  };

  const handleImportPrompts = () => {
    setBulkImportModalOpen(true);
  };

  // Helper functions for activity display
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

  const getActivityDescription = (activity: ActivityType) => {
    const userName = activity.user?.username || "Someone";
    switch (activity.actionType) {
      case "created_prompt":
        return `@${userName} created a new prompt`;
      case "shared_prompt":
        return `@${userName} shared a prompt`;
      case "liked_prompt":
        return `@${userName} liked a prompt`;
      case "favorited_prompt":
        return `@${userName} favorited a prompt`;
      case "followed_user":
        return `@${userName} started following someone`;
      case "joined_community":
        return `@${userName} joined the community`;
      case "created_collection":
        return `@${userName} created a new collection`;
      default:
        return `@${userName} performed an action`;
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="container mx-auto px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-8">
        {/* Dashboard Header */}
        <div className="mb-2 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 md:mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2" data-testid="text-welcome">
                Welcome back, {user?.firstName || (user?.email ? user.email.split("@")[0] : "") || "User"}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">Manage your AI prompts and discover community favorites</p>
            </div>

            <div className="mt-2 md:mt-0 flex items-center space-x-2 md:space-x-4">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards - Collapsible, Hidden on mobile */}
          <Collapsible
            open={!isStatsCollapsed}
            onOpenChange={(open) => setIsStatsCollapsed(!open)}
            className="hidden md:block mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Statistics</h2>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-toggle-stats">
                  {isStatsCollapsed ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show Stats
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Stats
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="grid grid-cols-4 gap-4">
                <Link href="/library" className="hover:scale-105 transition-transform cursor-pointer">
                  <StatsCard
                    title="Your Prompts"
                    value={userStats?.totalPrompts || 0}
                    icon={FileText}
                    iconColor="bg-primary/10 text-primary"
                    testId="stat-prompts"
                  />
                </Link>
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Quick Actions for Mobile - Show at top on mobile */}
        <div className="block md:hidden mb-3">
          <QuickActions
            onCreatePrompt={handleCreatePrompt}
            onCreateCollection={handleCreateCollection}
            onStartProject={handleStartProject}
            onImportPrompts={handleImportPrompts}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-8">
          <div className="lg:col-span-2">
            {/* Recent Prompts */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-foreground">Recent Prompts</h2>
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

            {/* Bookmarked Prompts */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-[#005eff]">Bookmarked Prompts</h2>
                <Link href="/library?section=favorites">
                  <Button variant="link" className="text-primary hover:underline p-0" data-testid="link-view-all-favorites">
                    View all
                  </Button>
                </Link>
              </div>

              <div className="space-y-4" data-testid="section-favorite-prompts">
                {favoritePrompts.length > 0 ? (
                  favoritePrompts.slice(0, 3).map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground mb-4">You haven't bookmarked any prompts yet.</p>
                      <p className="text-sm text-muted-foreground">Click the star icon on any prompt to add it to your favorites!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Community Highlights */}
            <div>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-[#a328c9]">Community Highlights</h2>
                <Tabs value={communityTab} onValueChange={setCommunityTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="featured" className="text-xs" data-testid="filter-featured">
                      Featured
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="text-xs" data-testid="filter-trending">
                      Trending
                    </TabsTrigger>
                    <TabsTrigger value="recent" className="text-xs" data-testid="filter-recent">
                      Recent
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
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
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            {/* Quick Actions - Hidden on mobile (shown at top) */}
            <div className="hidden md:block">
              <QuickActions
                onCreatePrompt={handleCreatePrompt}
                onCreateCollection={handleCreateCollection}
                onStartProject={handleStartProject}
                onImportPrompts={handleImportPrompts}
              />
            </div>

            {/* Collections */}
            <Card data-testid="card-collections">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Collections</CardTitle>
                  <Link href="/library?tab=collections">
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
                <div className="flex items-center justify-between">
                  <CardTitle>Community Activity</CardTitle>
                  <Link href="/community?tab=activity">
                    <Button variant="link" className="text-primary hover:underline p-0" data-testid="link-view-all-activity">
                      View all
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivities.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={activity.user?.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {activity.user?.firstName?.[0]?.toUpperCase() || activity.user?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.actionType)}
                            <p className="text-sm">
                              {getActivityDescription(activity)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.createdAt ? formatDate(activity.createdAt) : 'recently'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No recent activity yet</p>
                  </div>
                )}
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
      {/* Bulk Import Modal */}
      <BulkImportModal
        open={bulkImportModalOpen}
        onOpenChange={setBulkImportModalOpen}
        collections={collections}
      />
      
      {/* Create Collection Modal */}
      <Dialog open={createCollectionModalOpen} onOpenChange={setCreateCollectionModalOpen}>
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
                      <p className="text-sm text-muted-foreground">
                        Allow others to view and use this collection
                      </p>
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
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateCollectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCollectionMutation.isPending}>
                  {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}