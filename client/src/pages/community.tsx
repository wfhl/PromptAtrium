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
import { 
  Lightbulb, Search, Filter, Star, TrendingUp, Clock, Eye, 
  Users, Activity, UserPlus, UserMinus, Hash, Heart, GitBranch, 
  Share2, BookOpen, Folder
} from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Prompt, User, Activity as ActivityType } from "@shared/schema";

export default function Community() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const currentUserId = (user as any)?.id;
  const isSuperAdmin = (user as any)?.role === "super_admin";
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [activeTab, setActiveTab] = useState("prompts");
  const [promptsSubTab, setPromptsSubTab] = useState("featured");
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

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
    
    // Use promptsSubTab instead of sortBy for filtering
    if (promptsSubTab === "featured") {
      params.append("isFeatured", "true");
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

  // Fetch all users
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: isAuthenticated && activeTab === "users",
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

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery<(ActivityType & { user: User })[]>({
    queryKey: ["/api/activities/recent"],
    enabled: isAuthenticated && activeTab === "activity",
  });

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
      if (isFollowing) {
        return await apiRequest("DELETE", `/api/users/${userId}/follow`);
      } else {
        return await apiRequest("POST", `/api/users/${userId}/follow`);
      }
    },
    onSuccess: (_, { userId, isFollowing }) => {
      setFollowingMap(prev => ({ ...prev, [userId]: !isFollowing }));
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/following`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/following/prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? "User unfollowed successfully" : "You are now following this user",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
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

  const getActivityDescription = (activity: ActivityType & { user: User }) => {
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
    <div className="container mx-auto px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-8">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prompts" className="text-xs md:text-sm" data-testid="tab-prompts">
            <BookOpen className="h-4 w-4 mr-2" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs md:text-sm" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="followed" className="text-xs md:text-sm" data-testid="tab-followed">
            <UserPlus className="h-4 w-4 mr-2" />
            Followed
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs md:text-sm" data-testid="tab-activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
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

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Search Bar for Users */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users by username..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-10 pr-4"
                data-testid="input-search-users"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers
              .filter(u => u.id !== currentUserId)
              .filter(u => {
                if (!userSearchQuery) return true;
                const searchLower = userSearchQuery.toLowerCase();
                return u.username?.toLowerCase().includes(searchLower) ||
                       u.firstName?.toLowerCase().includes(searchLower) ||
                       u.lastName?.toLowerCase().includes(searchLower);
              })
              .map((u) => (
              <Card key={u.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {u.firstName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/user/${u.username}`}>
                          <a className="font-semibold hover:underline" data-testid={`link-user-${u.id}`}>
                            {u.firstName} {u.lastName}
                          </a>
                        </Link>
                        <p className="text-sm text-gray-500">@{u.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={followingMap[u.id] ? "outline" : "default"}
                      onClick={() => followMutation.mutate({ userId: u.id, isFollowing: followingMap[u.id] })}
                      disabled={followMutation.isPending}
                      data-testid={`button-follow-${u.id}`}
                    >
                      {followingMap[u.id] ? (
                        <>
                          <UserMinus className="h-3 w-3 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                  {u.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{u.bio}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Joined {u.createdAt ? formatDate(u.createdAt) : 'recently'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Followed Tab */}
        <TabsContent value="followed" className="space-y-6">
          {/* Following Users */}
          {followingData && followingData.following.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">People You Follow ({followingData.total})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {followingData.following.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {u.firstName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Link href={`/user/${u.username}`}>
                            <a className="font-semibold hover:underline" data-testid={`link-following-${u.id}`}>
                              {u.firstName} {u.lastName}
                            </a>
                          </Link>
                          <p className="text-sm text-gray-500">@{u.username}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {activity.user?.firstName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.actionType)}
                          <p className="text-sm">
                            {getActivityDescription(activity)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.createdAt ? formatDate(activity.createdAt) : 'recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No recent activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}