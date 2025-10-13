import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Lightbulb, Search, Filter, Star, TrendingUp, Clock, Eye, 
  Users, UserPlus, UserMinus, Hash, Heart, GitBranch, 
  Share2, BookOpen, Folder, ChevronRight
} from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { MobilePageNav } from "@/components/MobilePageNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Prompt, User, Collection } from "@shared/schema";

export default function Community() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const currentUserId = (user as any)?.id;
  const isSuperAdmin = (user as any)?.role === "super_admin";
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [generatorFilter, setGeneratorFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  
  // State for dynamic filter options
  const [filterOptions, setFilterOptions] = useState<{
    categories: string[];
    promptTypes: string[];
    promptStyles: string[];
    intendedGenerators: string[];
    models: string[];
    collections: { id: string; name: string }[];
  }>({
    categories: [],
    promptTypes: [],
    promptStyles: [],
    intendedGenerators: [],
    models: [],
    collections: []
  });
  const [sortBy, setSortBy] = useState("featured");
  const [activeTab, setActiveTab] = useState("prompts");
  const [promptsSubTab, setPromptsSubTab] = useState("featured");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followingCollapsed, setFollowingCollapsed] = useState(false);

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

  // Build query string for prompts
  const buildQuery = () => {
    const params = new URLSearchParams();
    params.append("isPublic", "true");
    if (searchQuery) params.append("search", searchQuery);
    if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
    if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
    if (styleFilter && styleFilter !== "all") params.append("style", styleFilter);
    if (generatorFilter && generatorFilter !== "all") params.append("generator", generatorFilter);
    if (modelFilter && modelFilter !== "all") params.append("model", modelFilter);
    if (collectionFilter && collectionFilter !== "all") params.append("collection", collectionFilter);
    
    // Use promptsSubTab instead of sortBy for filtering
    if (promptsSubTab === "featured") {
      params.append("isFeatured", "true");
    } else if (promptsSubTab === "all") {
      // Show all prompts, no special filter
      params.append("sortBy", "recent");
    } else if (promptsSubTab === "trending") {
      params.append("sortBy", "trending");
    } else if (promptsSubTab === "recent") {
      params.append("sortBy", "recent");
    }
    
    if (sortBy === "hidden") params.append("isHidden", "true");
    params.append("limit", "20");
    return params.toString();
  };

  // Fetch community prompts
  const { data: prompts = [], refetch } = useQuery<Prompt[]>({
    queryKey: [`/api/prompts?${buildQuery()}`],
    enabled: isAuthenticated && activeTab === "prompts",
    retry: false,
  });

  // Refetch prompts when sub-tab changes
  useEffect(() => {
    if (activeTab === "prompts" && isAuthenticated) {
      refetch();
    }
  }, [promptsSubTab, activeTab, isAuthenticated]);
  
  // Fetch public collections
  const { data: publicCollections = [] } = useQuery<(Collection & { promptCount?: number; user?: User })[]>({
    queryKey: [`/api/collections?isPublic=true&search=${collectionSearchQuery}&limit=50`],
    enabled: isAuthenticated && activeTab === "collections",
    retry: false,
  });
  
  // Fetch filter options from API
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/prompts/options')
        .then(res => res.json())
        .then(data => {
          setFilterOptions({
            categories: data.categories || [],
            promptTypes: data.promptTypes || [],
            promptStyles: data.promptStyles || [],
            intendedGenerators: data.intendedGenerators || [],
            models: data.models || [],
            collections: data.collections || []
          });
        })
        .catch(err => console.error('Failed to fetch filter options:', err));
    }
  }, [isAuthenticated]);

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: isAuthenticated && activeTab === "followed",
  });

  // Fetch followed users' prompts
  const { data: followedPrompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/user/following/prompts"],
    enabled: isAuthenticated && activeTab === "followed",
  });

  // Fetch following list
  const { data: followingData } = useQuery<{
    following: User[];
    total: number;
  }>({
    queryKey: [`/api/users/${currentUserId}/following`],
    enabled: isAuthenticated && currentUserId && activeTab === "followed",
  });

  // Activities query removed - Activity tab no longer exists

  // Check follow status for all users
  useEffect(() => {
    if (allUsers.length > 0 && currentUserId) {
      allUsers.forEach(async (u) => {
        if (u.id !== currentUserId) {
          const response = await fetch(`/api/users/${u.id}/follow-status`);
          if (response.ok) {
            const data = await response.json();
            setFollowingMap(prev => ({ ...prev, [u.id]: data.isFollowing }));
          }
        }
      });
    }
  }, [allUsers, currentUserId]);

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await apiRequest(method, `/api/users/${userId}/follow`);
      
      if (!response.ok) {
        const errorData = await response.json();
        const error = Object.assign(
          new Error(errorData.message || 'Failed to update follow status'),
          errorData
        );
        throw error;
      }
      
      return await response.json();
    },
    retry: (failureCount, error: any) => {
      const retryableErrors = ['SERVICE_UNAVAILABLE', 'INTERNAL_ERROR'];
      if ((error?.error && retryableErrors.includes(error.error)) || error?.retryable === true) {
        console.log(`Retrying follow operation (attempt ${failureCount + 1})...`);
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    onSuccess: async (_, { userId, isFollowing }) => {
      setFollowingMap(prev => ({ ...prev, [userId]: !isFollowing }));
      // Refetch all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/following`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/user/following/prompts"] })
      ]);
      // Force refetch of following data immediately
      queryClient.refetchQueries({ queryKey: [`/api/users/${currentUserId}/following`] });
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? "User unfollowed successfully" : "You are now following this user",
      });
    },
    onError: (error: any) => {
      // Handle specific error types
      if (error?.error === 'USER_NOT_FOUND') {
        toast({
          title: "User not found",
          description: "This user may have been deleted",
          variant: "destructive",
        });
        return;
      }
      
      if (error?.error === 'ALREADY_FOLLOWING') {
        // Silently update the state
        console.log("User is already being followed");
        return;
      }
      
      // Generic error
      toast({
        title: "Could not update follow status",
        description: error?.message || "Please try again in a moment",
        variant: "destructive",
      });
    },
  });

  const getSortIcon = () => {
    switch (sortBy) {
      case "featured":
        return <Star className="h-4 w-4" />;
      case "trending":
        return <TrendingUp className="h-4 w-4" />;
      case "recent":
        return <Clock className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
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
    <div className="container mx-auto px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-8 pb-24 lg:pb-8">
      {/* Mobile Navigation */}
      <MobilePageNav />
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prompts" className="text-xs md:text-sm" data-testid="tab-prompts">
            <BookOpen className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Prompts</span>
            <span className="sm:hidden">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-xs md:text-sm" data-testid="tab-collections">
            <Folder className="h-4 w-4 mr-1 md:mr-2" />
            <span>Collections</span>
          </TabsTrigger>
          <TabsTrigger value="followed" className="text-xs md:text-sm" data-testid="tab-followed">
            <Heart className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Following</span>
            <span className="sm:hidden">Following</span>
          </TabsTrigger>
        </TabsList>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          {/* Search Bar with Filter Dropdown */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search community prompts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Auto-apply search on type
                  refetch();
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
                    refetch();
                  }}>
                    <SelectTrigger className="w-full" data-testid="select-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Type Filter */}
                <div className="px-2 py-2">
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={typeFilter} onValueChange={(value) => {
                    setTypeFilter(value);
                    refetch();
                  }}>
                    <SelectTrigger className="w-full" data-testid="select-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {filterOptions.promptTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Style Filter */}
                <div className="px-2 py-2">
                  <label className="text-sm font-medium mb-2 block">Style</label>
                  <Select value={styleFilter} onValueChange={(value) => {
                    setStyleFilter(value);
                    refetch();
                  }}>
                    <SelectTrigger className="w-full" data-testid="select-style">
                      <SelectValue placeholder="All Styles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Styles</SelectItem>
                      {filterOptions.promptStyles.map(style => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Intended Generator Filter */}
                <div className="px-2 py-2">
                  <label className="text-sm font-medium mb-2 block">Intended Generator</label>
                  <Select value={generatorFilter} onValueChange={(value) => {
                    setGeneratorFilter(value);
                    refetch();
                  }}>
                    <SelectTrigger className="w-full" data-testid="select-generator">
                      <SelectValue placeholder="All Generators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Generators</SelectItem>
                      {filterOptions.intendedGenerators.map(gen => (
                        <SelectItem key={gen} value={gen}>{gen}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Recommended Models Filter */}
                <div className="px-2 py-2">
                  <label className="text-sm font-medium mb-2 block">Recommended Model</label>
                  <Select value={modelFilter} onValueChange={(value) => {
                    setModelFilter(value);
                    refetch();
                  }}>
                    <SelectTrigger className="w-full" data-testid="select-model">
                      <SelectValue placeholder="All Models" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      {filterOptions.models.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Collection Filter */}
                <div className="px-2 py-2">
                  <label className="text-sm font-medium mb-2 block">Collection</label>
                  <Select value={collectionFilter} onValueChange={(value) => {
                    setCollectionFilter(value);
                    refetch();
                  }}>
                    <SelectTrigger className="w-full" data-testid="select-collection">
                      <SelectValue placeholder="All Collections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Collections</SelectItem>
                      {filterOptions.collections.map(coll => (
                        <SelectItem key={coll.id} value={coll.id}>{coll.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Sort Filter */}
                <div className="px-2 py-2">
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={(value) => {
                    setSortBy(value);
                    refetch();
                  }}>
                    <SelectTrigger className="w-full" data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      {isSuperAdmin && <SelectItem value="hidden">Hidden</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Apply Filters Button */}
                <div className="px-2 py-2">
                  <Button 
                    onClick={() => refetch()} 
                    className="w-full"
                    size="sm"
                    data-testid="button-apply-filters"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {getSortIcon()}
                      <span>Apply Filters</span>
                    </div>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sub-tabs styled like dashboard */}
          <Tabs value={promptsSubTab} onValueChange={setPromptsSubTab}>
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="featured" className="text-xs px-3" data-testid="filter-featured">
                Featured
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-3" data-testid="filter-all">
                All
              </TabsTrigger>
              <TabsTrigger value="trending" className="text-xs px-3" data-testid="filter-trending">
                Trending
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-xs px-3" data-testid="filter-recent">
                Recent
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Prompts Grid */}
          <div className="space-y-4" data-testid="section-community-prompts">
            {prompts.length > 0 ? (
              prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  showActions={true}
                  isCommunityPage={true}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No community prompts found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || categoryFilter
                      ? "Try adjusting your filters to discover more prompts from the community."
                      : "The community is just getting started. Check back soon for amazing prompts!"}
                  </p>
                  <Link href="/library">
                    <Button data-testid="button-visit-library">
                      Visit Your Library
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-4">
          {/* Search Bar for Collections */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search public collections..."
                value={collectionSearchQuery}
                onChange={(e) => setCollectionSearchQuery(e.target.value)}
                className="pl-10 pr-4"
                data-testid="input-search-collections"
              />
            </div>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="section-community-collections">
            {publicCollections.length > 0 ? (
              publicCollections.map((collection) => (
                <Link key={collection.id} href={`/collection/${collection.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" data-testid={`collection-card-${collection.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Folder className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-foreground line-clamp-1" data-testid={`text-collection-name-${collection.id}`}>
                              {collection.name}
                            </h3>
                            {collection.user && (
                              <p className="text-sm text-muted-foreground">
                                by @{collection.user.username || collection.user.firstName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3" data-testid={`text-collection-desc-${collection.id}`}>
                          {collection.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            <span>{collection.promptCount || 0} prompts</span>
                          </div>
                        </div>
                        {collection.type === "community" && (
                          <Badge variant="secondary">Community</Badge>
                        )}
                        {collection.type === "global" && (
                          <Badge variant="default">Global</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Folder className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No public collections found</h3>
                    <p className="text-muted-foreground mb-6">
                      {collectionSearchQuery
                        ? "Try adjusting your search to discover more collections."
                        : "Be the first to share a collection with the community!"}
                    </p>
                    <Link href="/collections">
                      <Button data-testid="button-visit-collections">
                        <Folder className="h-4 w-4 mr-2" />
                        Create a Collection
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Followed Tab */}
        <TabsContent value="followed" className="space-y-6">
          {/* Search Bar for Users - searches all users */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search all users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-10 pr-4"
                data-testid="input-search-users"
              />
            </div>
          </div>
          
          {/* Search Results - Display above People You Follow */}
          {userSearchQuery && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Search Results</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {allUsers
                  .filter(u => u.id !== currentUserId)
                  .filter(u => {
                    const searchLower = userSearchQuery.toLowerCase();
                    return u.username?.toLowerCase().includes(searchLower) ||
                           u.firstName?.toLowerCase().includes(searchLower) ||
                           u.lastName?.toLowerCase().includes(searchLower);
                  })
                  .map((u) => (
                  <Link key={u.id} href={`/user/${u.username}`}>
                    <a className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50" data-testid={`link-search-result-${u.id}`}>
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {u.firstName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">
                        @{u.username}
                      </span>
                    </a>
                  </Link>
                ))}
              </div>
              {allUsers.filter(u => u.id !== currentUserId && userSearchQuery && (
                u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                u.firstName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                u.lastName?.toLowerCase().includes(userSearchQuery.toLowerCase())
              )).length === 0 && (
                <p className="text-center text-muted-foreground py-4">No users found matching "{userSearchQuery}"</p>
              )}
            </div>
          )}
          
          {/* Following Users - Collapsible */}
          {followingData && followingData.following.length > 0 && (
            <Collapsible open={!followingCollapsed} onOpenChange={(open) => setFollowingCollapsed(!open)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-transparent">
                  <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${!followingCollapsed ? 'rotate-90' : ''}`} />
                  <h3 className="text-lg font-semibold">People You Follow ({followingData.total})</h3>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-8">
                  {followingData.following.map((u) => (
                    <Link key={u.id} href={`/user/${u.username}`}>
                      <a className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50" data-testid={`link-following-${u.id}`}>
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          <AvatarImage src={u.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {u.firstName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate">
                          @{u.username}
                        </span>
                      </a>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Prompts from Followed Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Prompts from People You Follow</h3>
            {followedPrompts.length > 0 ? (
              <div className="space-y-4">
                {followedPrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-10">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">
                    {followingData?.total === 0
                      ? "You're not following anyone yet. Explore the Users tab to find people to follow!"
                      : "No prompts from people you follow yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}