import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Globe, Lock, Users } from "lucide-react";
import type { Community } from "@shared/schema";

interface CommunityVisibilitySelectorProps {
  isPublic: boolean;
  selectedCommunityIds: string[];
  onVisibilityChange: (isPublic: boolean, communityIds: string[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function CommunityVisibilitySelector({
  isPublic,
  selectedCommunityIds,
  onVisibilityChange,
  disabled = false,
  showLabel = true,
}: CommunityVisibilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedCommunityIds);

  // Fetch user's communities
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Filter to only show private communities (non-global ones)
  const privateCommunities = communities.filter(
    (c) => c.slug !== "global" && c.slug !== "general" && c.slug !== "/"
  );

  useEffect(() => {
    setTempSelectedIds(selectedCommunityIds);
  }, [selectedCommunityIds]);

  const handlePublicToggle = (checked: boolean) => {
    if (checked) {
      // When switching to public, include global community by default
      onVisibilityChange(true, []);
    } else {
      // When switching to private, clear all communities
      onVisibilityChange(false, []);
    }
  };

  const handleCommunityToggle = (communityId: string, checked: boolean) => {
    const newIds = checked
      ? [...tempSelectedIds, communityId]
      : tempSelectedIds.filter((id) => id !== communityId);
    setTempSelectedIds(newIds);
  };

  const handleApplyCommunities = () => {
    onVisibilityChange(isPublic, tempSelectedIds);
    setIsOpen(false);
  };

  const getVisibilityLabel = () => {
    if (!isPublic) {
      return (
        <span className="flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4" />
          Private
        </span>
      );
    }

    if (tempSelectedIds.length === 0) {
      return (
        <span className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4" />
          Public (Global only)
        </span>
      );
    }

    return (
      <span className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4" />
        Public + {tempSelectedIds.length} {tempSelectedIds.length === 1 ? "community" : "communities"}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {showLabel && <Label>Visibility</Label>}
      
      <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
        <div className="flex items-center gap-3">
          <Switch
            checked={isPublic}
            onCheckedChange={handlePublicToggle}
            disabled={disabled}
            aria-label="Toggle public/private visibility"
            data-testid="switch-visibility"
          />
          {getVisibilityLabel()}
        </div>

        {isPublic && privateCommunities.length > 0 && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isLoading}
                className="ml-4"
                data-testid="button-select-communities"
              >
                Share with communities
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Share with communities</span>
                <Badge variant="secondary">
                  {tempSelectedIds.length} selected
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2 border-b">
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                  <Checkbox
                    id="global"
                    checked={true}
                    disabled
                    data-testid="checkbox-global"
                  />
                  <label
                    htmlFor="global"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Global Community
                    <Badge variant="secondary" className="ml-auto">
                      Always included
                    </Badge>
                  </label>
                </div>
              </div>

              <ScrollArea className="h-64">
                <div className="p-2">
                  {privateCommunities.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      You are not a member of any private communities
                    </div>
                  ) : (
                    privateCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="flex items-center space-x-2 w-full p-2 rounded hover:bg-accent"
                      >
                        <Checkbox
                          id={community.id}
                          checked={tempSelectedIds.includes(community.id)}
                          onCheckedChange={(checked) =>
                            handleCommunityToggle(community.id, checked as boolean)
                          }
                          data-testid={`checkbox-community-${community.id}`}
                        />
                        <label
                          htmlFor={community.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                        >
                          {community.name}
                          <p className="text-xs text-muted-foreground mt-1">
                            @{community.slug}
                          </p>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <DropdownMenuSeparator />
              <div className="p-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempSelectedIds(selectedCommunityIds);
                    setIsOpen(false);
                  }}
                  className="flex-1"
                  data-testid="button-cancel-communities"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyCommunities}
                  className="flex-1"
                  data-testid="button-apply-communities"
                >
                  Apply
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isPublic && (
        <p className="text-xs text-muted-foreground">
          When public, your content will be visible to everyone in the global community.
          You can additionally share with specific private communities you're a member of.
        </p>
      )}
      
      {!isPublic && (
        <p className="text-xs text-muted-foreground">
          When private, your content will only be visible to you.
        </p>
      )}
    </div>
  );
}