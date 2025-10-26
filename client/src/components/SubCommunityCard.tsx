import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Shield, ArrowRight, LogOut, Settings, ChevronRight, Eye } from "lucide-react";
import type { Community, UserCommunity, User } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { useState } from "react";
import { PublicMemberList } from "@/components/PublicMemberList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showMembersDialog, setShowMembersDialog] = useState(false);

  // Check if user is a member of this sub-community
  const { data: userMemberships = [] } = useQuery<UserCommunity[]>({
    queryKey: ["/api/user/sub-communities"],
    enabled: !!user,
  });

  const membership = userMemberships.find(m => m.subCommunityId === subCommunity.id);
  const isMember = !!membership;
  const isAdmin = membership?.role === "admin" || subCommunity.userRole === "admin";

  // Fetch first few members for avatar preview
  const { data: membersData } = useQuery<{ 
    members: (UserCommunity & { user: User })[];
    total: number;
  }>({
    queryKey: [`/api/sub-communities/${subCommunity.id}/members`],
    enabled: !!subCommunity.id,
  });

  const previewMembers = membersData?.members?.slice(0, 5) || [];

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

  return (
    <>
      {/* Main Card Component */}
      {compact ? (
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
              {isAdmin && (
                <Link href={`/sub-community/${subCommunity.id}/admin`}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`button-admin-${subCommunity.id}`}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      ) : (
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
            
            {/* Member Avatars Preview */}
            {previewMembers.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {previewMembers.map((member, index) => {
                      const userName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim() || 
                                      member.user.username || 
                                      "Anonymous";
                      const userInitials = userName
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      
                      return (
                        <Avatar 
                          key={member.userId} 
                          className="h-8 w-8 border-2 border-background"
                          data-testid={`avatar-preview-${member.userId}`}
                        >
                          {member.user.profileImageUrl ? (
                            <AvatarImage src={member.user.profileImageUrl} alt={userName} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                              {userInitials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      );
                    })}
                    {(membersData?.total || 0) > 5 && (
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="bg-muted text-xs">
                          +{(membersData?.total || 0) - 5}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowMembersDialog(true)}
                    data-testid={`button-view-members-${subCommunity.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Members
                  </Button>
                </div>
              </div>
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
                  {isAdmin && (
                    <Link href={`/sub-community/${subCommunity.id}/admin`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-admin-${subCommunity.id}`}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Admin Dashboard
                      </Button>
                    </Link>
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
      )}

      {/* Members List Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{subCommunity.name} Members</DialogTitle>
          </DialogHeader>
          <PublicMemberList 
            subCommunityId={subCommunity.id} 
            subCommunityName={subCommunity.name}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}