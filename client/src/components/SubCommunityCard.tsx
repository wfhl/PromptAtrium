import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Shield, ArrowRight, LogOut, Settings, ChevronRight } from "lucide-react";
import type { Community, UserCommunity } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useState } from "react";

interface SubCommunityCardProps {
  subCommunity: Community & { 
    memberCount?: number;
    parentCommunity?: Community;
    userRole?: "member" | "admin" | null;
  };
  compact?: boolean;
  showActions?: boolean;
  onManage?: () => void;
}

export function SubCommunityCard({ 
  subCommunity, 
  compact = false,
  showActions = true,
  onManage
}: SubCommunityCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Check if user is a member of this sub-community
  const { data: userMemberships = [] } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/sub-communities"],
    enabled: !!user,
  });

  const membership = userMemberships.find(m => m.subCommunityId === subCommunity.id);
  const isMember = !!membership;
  const isAdmin = membership?.role === "admin" || subCommunity.userRole === "admin";

  // Join sub-community mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      setIsJoining(true);
      const response = await apiRequest("POST", `/api/sub-communities/${subCommunity.id}/join`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/sub-communities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sub-communities/${subCommunity.id}/members`] });
      toast({
        title: "Joined successfully",
        description: `You are now a member of ${subCommunity.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join",
        description: error.message || "Could not join the sub-community",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsJoining(false);
    }
  });

  // Leave sub-community mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      setIsLeaving(true);
      const response = await apiRequest("POST", `/api/sub-communities/${subCommunity.id}/leave`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/sub-communities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sub-communities/${subCommunity.id}/members`] });
      toast({
        title: "Left successfully",
        description: `You have left ${subCommunity.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to leave",
        description: error.message || "Could not leave the sub-community",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLeaving(false);
    }
  });

  const handleJoinLeave = () => {
    if (isMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  if (compact) {
    return (
      <div 
        className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors"
        data-testid={`sub-community-card-${subCommunity.id}`}
      >
        <Link href={`/sub-community/${subCommunity.id}`}>
          <div className="flex items-center space-x-3 cursor-pointer">
            <Avatar className="h-8 w-8">
              {subCommunity.imageUrl ? (
                <AvatarImage src={subCommunity.imageUrl} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600">
                  {subCommunity.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm" data-testid={`text-sub-community-name-${subCommunity.id}`}>
                  {subCommunity.name}
                </p>
                {isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
                {isMember && !isAdmin && (
                  <Badge variant="outline" className="text-xs">
                    Member
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {subCommunity.memberCount || 0} members
              </p>
            </div>
          </div>
        </Link>
        {showActions && (
          <div className="flex items-center gap-2">
            {isAdmin && onManage && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onManage}
                data-testid={`button-manage-${subCommunity.id}`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card 
      className="hover:shadow-lg transition-shadow"
      data-testid={`sub-community-card-${subCommunity.id}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              {subCommunity.imageUrl ? (
                <AvatarImage src={subCommunity.imageUrl} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600">
                  {subCommunity.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 
                className="font-semibold text-lg"
                data-testid={`text-sub-community-name-${subCommunity.id}`}
              >
                {subCommunity.name}
              </h3>
              {subCommunity.parentCommunity && (
                <p className="text-xs text-muted-foreground">
                  Part of {subCommunity.parentCommunity.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
            {isMember && !isAdmin && (
              <Badge variant="outline">Member</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subCommunity.description && (
          <p 
            className="text-sm text-muted-foreground"
            data-testid={`text-sub-community-description-${subCommunity.id}`}
          >
            {subCommunity.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span data-testid={`text-member-count-${subCommunity.id}`}>
              {subCommunity.memberCount || 0} members
            </span>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-2">
              {isAdmin && onManage && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onManage}
                  data-testid={`button-manage-${subCommunity.id}`}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              )}
              <Button
                variant={isMember ? "outline" : "default"}
                size="sm"
                onClick={handleJoinLeave}
                disabled={isJoining || isLeaving}
                data-testid={`button-join-leave-${subCommunity.id}`}
              >
                {isMember ? (
                  <>
                    <LogOut className="h-4 w-4 mr-1" />
                    {isLeaving ? "Leaving..." : "Leave"}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-1" />
                    {isJoining ? "Joining..." : "Join"}
                  </>
                )}
              </Button>
              <Link href={`/sub-community/${subCommunity.id}`}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid={`button-view-details-${subCommunity.id}`}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}