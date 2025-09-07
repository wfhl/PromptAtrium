import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { PromptCard } from "@/components/PromptCard";
import type { User, Prompt } from "@shared/schema";
import {
  Users,
  Calendar,
  Hash,
  Heart,
  BookOpen,
  GitFork,
  UserPlus,
  UserMinus,
  BarChart3,
  MoreVertical,
  Link2,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Instagram,
  Palette,
  AtSign,
  Video,
  MessageCircle,
  DollarSign
} from "lucide-react";

export default function UserProfile() {
  const { username } = useParams();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeSection, setActiveSection] = useState<"prompts" | "followers" | "following">("prompts");

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<User>({
    queryKey: [`/api/profile/${username}`],
    enabled: !!username,
  });

  // Fetch user's public prompts
  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: [`/api/prompts`],
    queryFn: async () => {
      const response = await fetch(`/api/prompts?userId=${profile?.id}&isPublic=true`);
      if (!response.ok) throw new Error("Failed to fetch prompts");
      return response.json();
    },
    enabled: !!profile?.id,
  });

  // Fetch user stats with follow counts
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalPrompts: number;
    totalLikes: number;
    collections: number;
    forksCreated: number;
    followers: number;
    following: number;
  }>({
    queryKey: [`/api/users/${profile?.id}/stats`],
    enabled: !!profile?.id,
  });

  // Fetch followers
  const { data: followersData } = useQuery<{
    followers: User[];
    total: number;
  }>({
    queryKey: [`/api/users/${profile?.id}/followers`],
    enabled: !!profile?.id,
  });

  // Fetch following
  const { data: followingData } = useQuery<{
    following: User[];
    total: number;
  }>({
    queryKey: [`/api/users/${profile?.id}/following`],
    enabled: !!profile?.id,
  });

  // Check if current user follows this user
  const { data: followStatus } = useQuery<{
    isFollowing: boolean;
  }>({
    queryKey: [`/api/users/${profile?.id}/follow-status`],
    enabled: !!profile?.id,
  });

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus]);

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return await apiRequest(`/api/users/${profile?.id}/follow`, "DELETE");
      } else {
        return await apiRequest(`/api/users/${profile?.id}/follow`, "POST");
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile?.id}/followers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile?.id}/following`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile?.id}/stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile?.id}/follow-status`] });
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You are no longer following ${profile?.firstName || username}`
          : `You are now following ${profile?.firstName || username}`,
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-10">
            <h2 className="text-2xl font-semibold mb-2">User not found</h2>
            <p className="text-gray-500">The user @{username} does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Profile Header with Stats */}
      <Card className="mb-4 md:mb-6">
        <CardContent className="p-4 md:p-6 relative">
          {/* Mobile Dropdowns - Top Right */}
          <div className="absolute top-4 right-4 md:hidden flex flex-col gap-2">
            {/* Stats Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-stats-dropdown">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Stats</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex justify-between cursor-pointer"
                  onClick={() => setActiveSection("prompts")}
                >
                  <span className="text-sm">Prompts</span>
                  <span className="font-bold" data-testid={`text-prompts-count-mobile-${profile.id}`}>
                    {stats?.totalPrompts || 0}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between">
                  <span className="text-sm">Likes</span>
                  <span className="font-bold" data-testid={`text-likes-count-mobile-${profile.id}`}>
                    {stats?.totalLikes || 0}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between">
                  <span className="text-sm">Collections</span>
                  <span className="font-bold" data-testid={`text-collections-count-mobile-${profile.id}`}>
                    {stats?.collections || 0}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between">
                  <span className="text-sm">Forks</span>
                  <span className="font-bold" data-testid={`text-forks-count-mobile-${profile.id}`}>
                    {stats?.forksCreated || 0}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex justify-between cursor-pointer"
                  onClick={() => setActiveSection("followers")}
                >
                  <span className="text-sm">Followers</span>
                  <span className="font-bold" data-testid={`text-followers-count-mobile-${profile.id}`}>
                    {stats?.followers || 0}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex justify-between cursor-pointer"
                  onClick={() => setActiveSection("following")}
                >
                  <span className="text-sm">Following</span>
                  <span className="font-bold" data-testid={`text-following-count-mobile-${profile.id}`}>
                    {stats?.following || 0}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Social Links Dropdown - Always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-socials-dropdown">
                  <Link2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Links & Socials</DropdownMenuLabel>
                <DropdownMenuSeparator />
                  {profile.website && (
                    <DropdownMenuItem asChild>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.twitterHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://twitter.com/${profile.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        <span>@{profile.twitterHandle}</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.githubHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://github.com/${profile.githubHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        <span>@{profile.githubHandle}</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.linkedinHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://linkedin.com/in/${profile.linkedinHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.instagramHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        <span>@{profile.instagramHandle}</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.deviantartHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://deviantart.com/${profile.deviantartHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span>DeviantArt</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.blueskyHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://bsky.app/profile/${profile.blueskyHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <AtSign className="h-4 w-4" />
                        <span>@{profile.blueskyHandle}</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.tiktokHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://tiktok.com/@${profile.tiktokHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>@{profile.tiktokHandle}</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.redditHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://reddit.com/u/${profile.redditHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>u/{profile.redditHandle}</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {profile.patreonHandle && (
                    <DropdownMenuItem asChild>
                      <a href={`https://patreon.com/${profile.patreonHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Patreon</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  {!profile.website && !profile.twitterHandle && !profile.githubHandle && 
                   !profile.linkedinHandle && !profile.instagramHandle && !profile.deviantartHandle && 
                   !profile.blueskyHandle && !profile.tiktokHandle && !profile.redditHandle && 
                   !profile.patreonHandle && (
                    <DropdownMenuItem disabled className="text-gray-500">
                      No social links added
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            {/* Left side: Avatar and Profile Info */}
            <div className="flex items-start gap-4 md:gap-6">
              {/* Avatar - Clickable to go back to prompts */}
              <Avatar 
                className="h-16 w-16 md:h-24 md:w-24 cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => setActiveSection("prompts")}
                data-testid="avatar-profile-picture"
              >
                <AvatarImage src={profile.profileImageUrl || undefined} alt={profile.firstName || undefined} />
                <AvatarFallback className="text-lg md:text-2xl">
                  {profile.firstName?.[0]?.toUpperCase() || username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 pr-12 md:pr-0">
                <div className="mb-2">
                  <h1 className="text-xl md:text-3xl font-bold">
                    @{profile.username}
                  </h1>
                  {(profile.firstName || profile.lastName) && (
                    <p className="text-sm md:text-base text-gray-500">
                      {profile.firstName} {profile.lastName}
                    </p>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <Badge variant="secondary">{profile.location}</Badge>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(profile.createdAt)}
                  </span>
                  {!isOwnProfile && currentUser && (
                    <Button
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      variant={isFollowing ? "outline" : "default"}
                      className="gap-2"
                      data-testid={`button-follow-${profile.id}`}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Stats Grid - Hidden on mobile */}
            <div className="hidden md:grid md:grid-cols-2 gap-2 md:gap-3 md:min-w-[200px]">
              <div className="text-center p-2">
                <div className="text-lg md:text-2xl font-bold" data-testid={`text-prompts-count-${profile.id}`}>
                  {stats?.totalPrompts || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">Prompts</div>
              </div>
              <div className="text-center p-2">
                <div className="text-lg md:text-2xl font-bold" data-testid={`text-likes-count-${profile.id}`}>
                  {stats?.totalLikes || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">Likes</div>
              </div>
              <div className="text-center p-2">
                <div className="text-lg md:text-2xl font-bold" data-testid={`text-collections-count-${profile.id}`}>
                  {stats?.collections || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">Collections</div>
              </div>
              <div className="text-center p-2">
                <div className="text-lg md:text-2xl font-bold" data-testid={`text-forks-count-${profile.id}`}>
                  {stats?.forksCreated || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">Forks</div>
              </div>
              <div className="text-center p-2">
                <div className="text-lg md:text-2xl font-bold" data-testid={`text-followers-count-${profile.id}`}>
                  {stats?.followers || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">Followers</div>
              </div>
              <div className="text-center p-2">
                <div className="text-lg md:text-2xl font-bold" data-testid={`text-following-count-${profile.id}`}>
                  {stats?.following || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Content Sections */}
      <div className="space-y-4">
        {/* Section Title */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold capitalize">
            {activeSection === "prompts" && `Prompts (${prompts.length})`}
            {activeSection === "followers" && `Followers (${followersData?.total || 0})`}
            {activeSection === "following" && `Following (${followingData?.total || 0})`}
          </h2>
        </div>

        {/* Prompts Section */}
        {activeSection === "prompts" && (
          <>
            {promptsLoading ? (
              <div className="text-center py-10 text-gray-500">Loading prompts...</div>
            ) : prompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prompts.map((prompt: Prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} isProfilePage={true} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No public prompts yet</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Followers Section */}
        {activeSection === "followers" && (
          <>
            {followersData?.followers && followersData.followers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followersData.followers.map((follower: User) => (
                  <Card key={follower.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={follower.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {follower.firstName?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <a
                            href={`/user/${follower.username}`}
                            className="font-semibold hover:underline"
                            data-testid={`link-follower-${follower.id}`}
                          >
                            {follower.firstName} {follower.lastName}
                          </a>
                          <p className="text-sm text-gray-500">@{follower.username}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-10">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No followers yet</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Following Section */}
        {activeSection === "following" && (
          <>
            {followingData?.following && followingData.following.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followingData.following.map((following: User) => (
                <Card key={following.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={following.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {following.firstName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <a
                          href={`/user/${following.username}`}
                          className="font-semibold hover:underline"
                          data-testid={`link-following-${following.id}`}
                        >
                          {following.firstName} {following.lastName}
                        </a>
                        <p className="text-sm text-gray-500">@{following.username}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-10">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Not following anyone yet</p>
              </CardContent>
            </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}