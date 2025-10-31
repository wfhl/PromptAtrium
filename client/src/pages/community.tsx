import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
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
  Share2, BookOpen, Folder, ChevronRight, Building, Lock,
  Globe, Mail
} from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { MultiSelectFilters } from "@/components/MultiSelectFilters";
import type { MultiSelectFilters as MultiSelectFiltersType, EnabledFilters } from "@/components/MultiSelectFilters";
import { CommunityContextTabs } from "@/components/CommunityContextTabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Prompt, User, Collection, Community, UserCommunity } from "@shared/schema";
import { ShineBorder } from "@/components/ui/shine-border";

export default function Community() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const currentUserId = (user as any)?.id;
  const isSuperAdmin = (user as any)?.role === "super_admin";
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

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
  
  // Parse URL parameters reactively from wouter's location
  const urlParams = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
  const tabFromUrl = urlParams.get('tab');
  const subTabFromUrl = urlParams.get('sub');
  const communityIdFromUrl = urlParams.get('communityId');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(communityIdFromUrl);
  const savedTab = localStorage.getItem('community-active-tab');
  const initialTab = tabFromUrl || savedTab || 'prompts';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Read promptsSubTab from URL parameter, then localStorage, with fallback to 'featured'
  const savedPromptsSubTab = localStorage.getItem('community-prompts-sub-tab');
  const initialSubTab = subTabFromUrl || savedPromptsSubTab || "featured";
  const [promptsSubTab, setPromptsSubTab] = useState(initialSubTab);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followingCollapsed, setFollowingCollapsed] = useState(true);

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

  // React to URL changes and update tabs
  useEffect(() => {
    console.log('URL changed, location:', location);
    const params = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
    const tab = params.get('tab');
    const sub = params.get('sub');
    const communityId = params.get('communityId');
    console.log('Parsed URL params - tab:', tab, 'sub:', sub, 'communityId:', communityId);
    
    if (tab && ['prompts', 'collections', 'followed'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (sub && ['featured', 'all', 'trending', 'recent'].includes(sub)) {
      setPromptsSubTab(sub);
    }
    
    if (communityId !== selectedCommunityId) {
      console.log('Setting selectedCommunityId from URL:', communityId);
      setSelectedCommunityId(communityId);
    }
  }, [location, selectedCommunityId]);

  // Save promptsSubTab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('community-prompts-sub-tab', promptsSubTab);
  }, [promptsSubTab]);

  // Build query string for prompts
  const buildQuery = (offset = 0) => {
    const params = new URLSearchParams();
    params.append("isPublic", "true");
    if (searchQuery) params.append("search", searchQuery);
    
    // Add community filter
    if (selectedCommunityId) {
      params.append("communityId", selectedCommunityId);
    }

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
    params.append("offset", offset.toString());
    return params.toString();
  };

  // Fetch community prompts with infinite scroll
  const {
    data: promptsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["prompts", promptsSubTab, searchQuery, multiSelectFilters, selectedCommunityId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/prompts?${buildQuery(pageParam)}`);
      if (!response.ok) throw new Error("Failed to fetch prompts");
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than the limit, there are no more pages
      if (lastPage.length < 20) return undefined;
      // Otherwise, return the offset for the next page
      return allPages.length * 20;
    },
    initialPageParam: 0,
    enabled: isAuthenticated && activeTab === "prompts",
    retry: false,
  });

  // Flatten all pages into a single array of prompts
  const prompts = promptsData?.pages.flat() || [];

  // Refetch prompts when sub-tab or filters change
  useEffect(() => {
    if (activeTab === "prompts" && isAuthenticated) {
      refetch();
    }
  }, [promptsSubTab, activeTab, isAuthenticated, multiSelectFilters, refetch]);

  // Intersection observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fetch public collections
  const collectionQueryParams = new URLSearchParams();
  collectionQueryParams.append("isPublic", "true");
  if (collectionSearchQuery) collectionQueryParams.append("search", collectionSearchQuery);
  if (selectedCommunityId) collectionQueryParams.append("communityId", selectedCommunityId);
  collectionQueryParams.append("limit", "50");
  
  const { data: publicCollections = [] } = useQuery<(Collection & { promptCount?: number; exampleImages?: string[]; user?: User })[]>({
    queryKey: [`/api/collections?${collectionQueryParams.toString()}`],
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

  // Fetch user's communities
  const { data: userCommunities = [] } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/communities"],
    enabled: isAuthenticated,
  });
  
  // Fetch user's pending invitations
  const { data: pendingInvitations = [] } = useQuery<any[]>({
    queryKey: ["/api/user/invitations"],
    enabled: isAuthenticated,
  });

  // Fetch all communities to get the details
  const { data: allCommunities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
    enabled: isAuthenticated && userCommunities.length > 0,
  });

  // Filter to get user's communities with full details
  const myCommunities = allCommunities.filter(c => 
    userCommunities.some(uc => uc.communityId === c.id && (uc.status === 'accepted' || !uc.status))
  );

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

  // Accept/reject invitation mutation
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ communityId, accept }: { communityId: string; accept: boolean }) => {
      const response = await apiRequest("POST", `/api/communities/${communityId}/invitations/respond`, { accept });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to respond to invitation');
      }
      
      return await response.json();
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/invitations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      
      toast({
        title: accept ? "Invitation Accepted" : "Invitation Rejected",
        description: accept ? "You have joined the community" : "You have declined the invitation",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to invitation",
        variant: "destructive",
      });
    },
  });

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
      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <Card className="mb-4 border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-yellow-500" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id} className="bg-yellow-50 dark:bg-yellow-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{invitation.community?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invitation.inviter?.username || 'Unknown'} as {invitation.role}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => respondToInvitationMutation.mutate({ 
                            communityId: invitation.communityId, 
                            accept: true 
                          })}
                          disabled={respondToInvitationMutation.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => respondToInvitationMutation.mutate({ 
                            communityId: invitation.communityId, 
                            accept: false 
                          })}
                          disabled={respondToInvitationMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* My Communities Section */}
      {myCommunities.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5" />
              My Communities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Global Community (always show first if user has access) */}
              {myCommunities.some(c => c.parentCommunityId === null) && (
                <Link href="/community">
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">Global Community</p>
                          <p className="text-xs text-muted-foreground">Public Content</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
              
              {/* Private Communities */}
              {myCommunities
                .filter(c => c.parentCommunityId !== null)
                .map((community) => {
                  const membership = userCommunities.find(uc => uc.communityId === community.id);
                  const isAdmin = membership?.role === 'admin';
                  
                  return (
                    <Link key={community.id} href={`/community/${community.id}`}>
                      <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-muted rounded-lg">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{community.name}</p>
                              <div className="flex items-center gap-1">
                                <p className="text-xs text-muted-foreground">Private</p>
                                {isAdmin && (
                                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Context Tabs */}
      <CommunityContextTabs 
        selectedCommunityId={selectedCommunityId}
        onCommunityChange={(communityId) => {
          console.log('Community page onCommunityChange called with:', communityId);
          console.log('Current location:', location);
          setSelectedCommunityId(communityId);
          // Update URL with the new communityId
          const params = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
          if (communityId) {
            params.set('communityId', communityId);
          } else {
            params.delete('communityId');
          }
          // Preserve other params
          if (activeTab) params.set('tab', activeTab);
          if (activeTab === 'prompts' && promptsSubTab) params.set('sub', promptsSubTab);
          const newUrl = `/community${params.toString() ? '?' + params.toString() : ''}`;
          console.log('Setting new location to:', newUrl);
          setLocation(newUrl);
        }}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        localStorage.setItem('community-active-tab', value);
        // Update URL with the new tab
        const params = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
        params.set('tab', value);
        // Keep sub parameter if on prompts tab
        if (value === 'prompts' && promptsSubTab) {
          params.set('sub', promptsSubTab);
        } else {
          params.delete('sub');
        }
        // Preserve communityId if set
        if (selectedCommunityId) {
          params.set('communityId', selectedCommunityId);
        }
        setLocation(`/community?${params.toString()}`);
      }} className="space-y-1 md:space-y-2">
        <TabsList className="grid grid-cols-3">
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
          {/* Search Bar */}
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

            {/* Filter Options Button */}
            <MultiSelectFilters
              onFiltersChange={(filters) => {
                setMultiSelectFilters(filters);
                refetch();
              }}
              onEnabledFiltersChange={setEnabledFilters}
              enabledFilters={enabledFilters}
              selectedFilters={multiSelectFilters}
              sortBy={sortBy}
              showButton={true}
              showTabs={false}
            />
          </div>

          {/* Sub-tabs styled like dashboard */}
          <Tabs value={promptsSubTab} onValueChange={(value) => {
            setPromptsSubTab(value);
            // Update URL with new sub-tab
            const params = new URLSearchParams(location.includes('?') ? location.split('?')[1] : '');
            params.set('tab', 'prompts');
            params.set('sub', value);
            // Preserve communityId if set
            if (selectedCommunityId) {
              params.set('communityId', selectedCommunityId);
            }
            setLocation(`/community?${params.toString()}`);
          }} className="mb-2">
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

          {/* Multi-Select Filter Tabs - Show below main tabs */}
          <MultiSelectFilters
            onFiltersChange={(filters) => {
              setMultiSelectFilters(filters);
              refetch();
            }}
            onEnabledFiltersChange={setEnabledFilters}
            enabledFilters={enabledFilters}
            selectedFilters={multiSelectFilters}
            sortBy={sortBy}
            showButton={false}
            showTabs={true}
          />

          {/* Prompts Grid - Masonry Layout */}
          <div className="space-y-4" data-testid="section-community-prompts">
            {prompts.length > 0 ? (
              <>
                <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                  {prompts.map((prompt) => (
                    <div key={prompt.id} className="break-inside-avoid mb-4">
                      <PromptCard
                        prompt={prompt}
                        showActions={true}
                        isCommunityPage={true}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Observer target for infinite scroll */}
                <div ref={observerTarget} className="h-4" />
                
                {/* Loading indicator */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-8">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mx-auto mb-2 animate-pulse">
                        <Lightbulb className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Loading more prompts...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No community prompts found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || Object.values(multiSelectFilters).some(filters => filters.length > 0)
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

          {/* Collections Grid - Masonry Layout */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2" data-testid="section-community-collections">
            {publicCollections.length > 0 ? (
              publicCollections.map((collection) => (
                <Link key={collection.id} href={`/collection/${collection.id}`}>
                  <ShineBorder
                    className="w-full break-inside-avoid mb-2"
                    color={["#8B7FC8", "#C880A1", "#D4A878"]}
                    borderRadius={8}
                    borderWidth={0.5}
                    duration={15}
                  >
                    <Card className="border-0 hover:shadow-lg transition-shadow cursor-pointer" data-testid={`collection-card-${collection.id}`}>
                    <CardContent className="p-3">
                      {/* Display example images if available */}
                      {collection.exampleImages && collection.exampleImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-0.5 mb-2">
                          {collection.exampleImages.slice(0, 4).map((imageUrl, index) => (
                            <div key={index} className="aspect-square rounded overflow-hidden bg-muted">
                              <img
                                src={imageUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  // Hide broken images
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ))}
                          {/* Fill empty slots with placeholders */}
                          {collection.exampleImages.length < 4 && [...Array(4 - collection.exampleImages.length)].map((_, i) => (
                            <div key={`placeholder-${i}`} className="aspect-square rounded bg-muted/50" />
                          ))}
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center flex-shrink-0">
                            <Folder className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground line-clamp-1" data-testid={`text-collection-name-${collection.id}`}>
                              {collection.name}
                            </h3>
                            {collection.user && (
                              <p className="text-xs text-muted-foreground truncate">
                                by @{collection.user.username || collection.user.firstName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {collection.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2" data-testid={`text-collection-desc-${collection.id}`}>
                          {collection.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <BookOpen className="h-3 w-3" />
                          <span>{collection.promptCount || 0}</span>
                        </div>
                        {collection.type === "community" && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Community</Badge>
                        )}
                        {collection.type === "global" && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">Global</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </ShineBorder>
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
                    isCommunityPage={true}
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