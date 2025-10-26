import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubCommunityCard } from "./SubCommunityCard";
import { Plus, Users, AlertCircle } from "lucide-react";
import type { Community, UserCommunity } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface SubCommunityListProps {
  parentCommunityId: string;
  parentCommunity?: Community;
  onCreateNew?: () => void;
  showCreateButton?: boolean;
  compact?: boolean;
}

export function SubCommunityList({ 
  parentCommunityId, 
  parentCommunity,
  onCreateNew,
  showCreateButton = false,
  compact = false
}: SubCommunityListProps) {
  const { user } = useAuth();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Fetch sub-communities for this parent
  const { data: subCommunities = [], isLoading, error } = useQuery<(Community & { memberCount?: number })[]>({
    queryKey: [`/api/communities/${parentCommunityId}/sub-communities`],
    enabled: !!parentCommunityId,
  });

  // Fetch user's memberships to determine roles
  const { data: userMemberships = [] } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/sub-communities"],
    enabled: !!user,
  });

  // Check if user is admin of parent community
  const { data: parentAdmins = [] } = useQuery<{ userId: string }[]>({
    queryKey: [`/api/communities/${parentCommunityId}/admins`],
    enabled: !!parentCommunityId && !!user,
  });

  const isParentAdmin = parentAdmins.some(admin => admin.userId === (user as any)?.id);

  // Map user roles to sub-communities
  const subCommunitiesWithRoles = subCommunities.map(subComm => {
    const membership = userMemberships.find(m => m.subCommunityId === subComm.id);
    return {
      ...subComm,
      userRole: membership?.role || null,
      parentCommunity
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="sub-community-list-loading">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" data-testid="sub-community-list-error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load sub-communities. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!compact) {
    return (
      <Card data-testid={`sub-community-list-${parentCommunityId}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sub-Communities
              {subCommunities.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({subCommunities.length})
                </span>
              )}
            </CardTitle>
            {showCreateButton && isParentAdmin && onCreateNew && (
              <Button
                size="sm"
                onClick={onCreateNew}
                data-testid={`button-create-sub-community-${parentCommunityId}`}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Sub-Community
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subCommunities.length === 0 ? (
            <div 
              className="text-center py-8 text-muted-foreground"
              data-testid="sub-community-list-empty"
            >
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No sub-communities yet</p>
              {isParentAdmin && (
                <p className="text-xs mt-2">
                  Create the first sub-community to organize your community better
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subCommunitiesWithRoles.map(subCommunity => (
                <SubCommunityCard
                  key={subCommunity.id}
                  subCommunity={subCommunity}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact view for sidebar or smaller spaces
  return (
    <div 
      className="space-y-1"
      data-testid={`sub-community-list-compact-${parentCommunityId}`}
    >
      {showCreateButton && isParentAdmin && onCreateNew && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mb-2"
          onClick={onCreateNew}
          data-testid={`button-create-sub-community-compact-${parentCommunityId}`}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Sub-Community
        </Button>
      )}
      
      {subCommunities.length === 0 ? (
        <p 
          className="text-xs text-muted-foreground text-center py-4"
          data-testid="sub-community-list-empty-compact"
        >
          No sub-communities
        </p>
      ) : (
        subCommunitiesWithRoles.map(subCommunity => (
          <SubCommunityCard
            key={subCommunity.id}
            subCommunity={subCommunity}
            compact={true}
            showActions={!compact}
          />
        ))
      )}
    </div>
  );
}