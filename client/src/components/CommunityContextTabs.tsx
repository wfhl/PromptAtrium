import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Community, UserCommunity } from "@shared/schema";

interface CommunityContextTabsProps {
  selectedCommunityId: string | null;
  onCommunityChange: (communityId: string | null) => void;
  variant?: "default" | "mobile";
}

export function CommunityContextTabs({ 
  selectedCommunityId, 
  onCommunityChange,
  variant = "default" 
}: CommunityContextTabsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(selectedCommunityId || "global");

  // Fetch user's communities
  const { data: userCommunities = [] } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/communities"],
    enabled: !!user,
  });

  // Fetch all communities to get the details
  const { data: allCommunities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
    enabled: !!user && userCommunities.length > 0,
  });

  // Filter to get user's private communities with full details
  // Include communities where user is a member (accepted status or no status field for backward compatibility)
  const privateCommunities = allCommunities.filter(c => 
    c.slug !== 'global' && 
    c.slug !== 'general' &&
    userCommunities.some(uc => 
      uc.communityId === c.id && 
      (uc.status === 'accepted' || uc.status === null || uc.status === undefined || !('status' in uc))
    )
  );

  // Update active tab when selectedCommunityId changes
  useEffect(() => {
    setActiveTab(selectedCommunityId || "global");
  }, [selectedCommunityId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onCommunityChange(value === "global" ? null : value);
  };

  // Always render tabs, but only show them if there are communities to switch between
  // Show tabs if user has private communities OR if they are currently viewing a community
  const shouldShowTabs = privateCommunities.length > 0;
  
  if (!shouldShowTabs) {
    return null; // For now, don't show tabs if only global community exists
    // TODO: Consider always showing tabs for consistency
  }

  // Mobile variant for dropdown
  if (variant === "mobile") {
    return (
      <div className="p-2 space-y-1">
        <button
          onClick={() => handleTabChange("global")}
          className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
            activeTab === "global" 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-accent/50"
          }`}
          data-testid="button-community-global"
        >
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Globe className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">Global Community</div>
            <div className="text-xs text-muted-foreground">Public content from everyone</div>
          </div>
          {activeTab === "global" && (
            <div className="w-2 h-2 bg-primary rounded-full" />
          )}
        </button>

        {privateCommunities.map((community) => {
          const membership = userCommunities.find(uc => uc.communityId === community.id);
          const isAdmin = membership?.role === 'admin';
          
          return (
            <button
              key={community.id}
              onClick={() => handleTabChange(community.id)}
              className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                activeTab === community.id 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-accent/50"
              }`}
              data-testid={`button-community-${community.id}`}
            >
              <div className="p-1.5 bg-muted rounded-md">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm flex items-center gap-1">
                  {community.name}
                  {isAdmin && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Private community</div>
              </div>
              {activeTab === community.id && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default desktop variant
  return (
    <div className="mb-4 bg-muted/30 p-2 rounded-lg">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full flex">
          <TabsTrigger 
            value="global" 
            className="flex-1 flex items-center gap-2"
            data-testid="tab-community-global"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Global</span>
            <span className="sm:hidden">Global</span>
          </TabsTrigger>
          
          {privateCommunities.map((community) => {
            const membership = userCommunities.find(uc => uc.communityId === community.id);
            const isAdmin = membership?.role === 'admin';
            
            return (
              <TabsTrigger 
                key={community.id}
                value={community.id} 
                className="flex-1 flex items-center gap-2"
                data-testid={`tab-community-${community.id}`}
              >
                <Lock className="h-4 w-4" />
                <span className="hidden md:inline">{community.name}</span>
                <span className="md:hidden truncate max-w-[80px]">{community.name}</span>
                {isAdmin && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-1">
                    Admin
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}