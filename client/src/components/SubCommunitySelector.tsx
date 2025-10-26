import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Globe, ChevronRight } from "lucide-react";
import type { Community, UserCommunity } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

interface SubCommunitySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showAllOption?: boolean;
  className?: string;
}

interface CommunityHierarchy {
  community: Community;
  subCommunities: (Community & { userRole?: "member" | "admin" | null })[];
}

export function SubCommunitySelector({
  value,
  onValueChange,
  placeholder = "Select a sub-community",
  showAllOption = true,
  className = ""
}: SubCommunitySelectorProps) {
  const { user } = useAuth();
  const [selectedValue, setSelectedValue] = useState(value || "all");

  // Fetch all communities
  const { data: communities = [], isLoading: loadingCommunities } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Fetch user's sub-community memberships
  const { data: userMemberships = [], isLoading: loadingMemberships } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/sub-communities"],
    enabled: !!user,
  });

  // Organize communities into hierarchy
  const hierarchy: CommunityHierarchy[] = communities
    .filter(c => !c.parentCommunityId) // Only parent communities
    .map(parentComm => {
      const subComms = communities
        .filter(c => c.parentCommunityId === parentComm.id)
        .map(subComm => {
          const membership = userMemberships.find(m => m.subCommunityId === subComm.id);
          return {
            ...subComm,
            userRole: membership?.role || null
          };
        })
        .filter(sc => sc.userRole !== null); // Only show sub-communities user is member of
      
      return {
        community: parentComm,
        subCommunities: subComms
      };
    })
    .filter(h => h.subCommunities.length > 0); // Only show parents with accessible sub-communities

  useEffect(() => {
    setSelectedValue(value || "all");
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange(newValue);
  };

  const isLoading = loadingCommunities || loadingMemberships;

  if (isLoading) {
    return (
      <Skeleton 
        className="h-10 w-full"
        data-testid="sub-community-selector-loading"
      />
    );
  }

  const getSubCommunityLabel = (subComm: Community & { userRole?: "member" | "admin" | null }) => {
    const parent = communities.find(c => c.id === subComm.parentCommunityId);
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span>{subComm.name}</span>
          {parent && (
            <span className="text-xs text-muted-foreground">
              ({parent.name})
            </span>
          )}
        </div>
        {subComm.userRole === "admin" && (
          <Badge variant="secondary" className="ml-2 text-xs">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Select
      value={selectedValue}
      onValueChange={handleValueChange}
      data-testid="sub-community-selector"
    >
      <SelectTrigger 
        className={className}
        data-testid="sub-community-selector-trigger"
      >
        <SelectValue placeholder={placeholder}>
          {selectedValue === "all" ? (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              All Communities
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {communities.find(c => c.id === selectedValue)?.name || "Select community"}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent data-testid="sub-community-selector-content">
        {showAllOption && (
          <SelectItem 
            value="all"
            data-testid="select-item-all"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              All Communities
            </div>
          </SelectItem>
        )}
        
        {hierarchy.length === 0 ? (
          <div 
            className="py-6 text-center text-sm text-muted-foreground"
            data-testid="sub-community-selector-empty"
          >
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>You're not a member of any sub-communities yet</p>
          </div>
        ) : (
          hierarchy.map(({ community, subCommunities }) => (
            <SelectGroup key={community.id}>
              <SelectLabel className="flex items-center gap-2 font-semibold">
                <ChevronRight className="h-4 w-4" />
                {community.name}
              </SelectLabel>
              {subCommunities.map(subComm => (
                <SelectItem 
                  key={subComm.id}
                  value={subComm.id}
                  className="pl-8"
                  data-testid={`select-item-${subComm.id}`}
                >
                  {getSubCommunityLabel(subComm)}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );
}