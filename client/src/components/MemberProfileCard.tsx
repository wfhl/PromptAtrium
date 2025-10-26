import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  UserMinus,
  Calendar,
  Activity,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Mail,
  Globe,
  Twitter,
  Github,
  Linkedin,
  Instagram,
  Clock,
  Award,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { User, UserCommunity } from "@shared/schema";

interface MemberProfileCardProps {
  member: UserCommunity & { user: User };
  subCommunityId: string;
  currentUserIsAdmin?: boolean;
  currentUserId?: string;
  compact?: boolean;
  onClose?: () => void;
  className?: string;
}

export function MemberProfileCard({ 
  member, 
  subCommunityId,
  currentUserIsAdmin = false,
  currentUserId,
  compact = false,
  onClose,
  className
}: MemberProfileCardProps) {
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState<"promote" | "demote" | "remove" | null>(null);
  
  const userName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim() || 
                  member.user.username || 
                  "Anonymous";
  const userInitials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  const isAdmin = member.role === "admin";
  const isCurrentUser = member.userId === currentUserId;
  const joinDate = member.joinedAt ? new Date(member.joinedAt) : null;
  
  // Mock activity data (in real app, this would come from API)
  const lastActive = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
  const isOnline = Math.random() > 0.7;
  const contributions = Math.floor(Math.random() * 100);

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ role }: { role: "member" | "admin" }) => {
      const response = await apiRequest(
        "PUT",
        `/api/sub-communities/${subCommunityId}/members/${member.userId}/role`,
        { role }
      );
      return await response.json();
    },
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sub-communities/${subCommunityId}/members`] });
      toast({
        title: "Role updated",
        description: `${userName} is now ${role === "admin" ? "an admin" : "a member"}`,
      });
      setShowConfirmDialog(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.message || "Could not update member role",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/sub-communities/${subCommunityId}/members/${member.userId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sub-communities/${subCommunityId}/members`] });
      toast({
        title: "Member removed",
        description: `${userName} has been removed from the sub-community`,
      });
      setShowConfirmDialog(null);
      onClose?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message || "Could not remove member",
        variant: "destructive",
      });
    },
  });

  const handleAction = (action: "promote" | "demote" | "remove") => {
    switch (action) {
      case "promote":
        updateRoleMutation.mutate({ role: "admin" });
        break;
      case "demote":
        updateRoleMutation.mutate({ role: "member" });
        break;
      case "remove":
        removeMemberMutation.mutate();
        break;
    }
  };

  // Social links
  const socialLinks = [
    { icon: Twitter, handle: member.user.twitterHandle, prefix: "https://twitter.com/" },
    { icon: Github, handle: member.user.githubHandle, prefix: "https://github.com/" },
    { icon: Linkedin, handle: member.user.linkedinHandle, prefix: "https://linkedin.com/in/" },
    { icon: Instagram, handle: member.user.instagramHandle, prefix: "https://instagram.com/" },
  ].filter(link => link.handle);

  if (compact) {
    // Hover card version for compact display
    return (
      <>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button 
              variant="ghost" 
              className="p-1 h-auto"
              data-testid={`member-profile-trigger-${member.userId}`}
            >
              <Avatar className="h-8 w-8">
                {member.user.profileImageUrl ? (
                  <AvatarImage src={member.user.profileImageUrl} alt={userName} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" align="start">
            <MemberProfileContent 
              member={member}
              userName={userName}
              userInitials={userInitials}
              isAdmin={isAdmin}
              isCurrentUser={isCurrentUser}
              joinDate={joinDate}
              isOnline={isOnline}
              lastActive={lastActive}
              contributions={contributions}
              socialLinks={socialLinks}
              currentUserIsAdmin={currentUserIsAdmin}
              onActionClick={setShowConfirmDialog}
            />
          </HoverCardContent>
        </HoverCard>

        {/* Confirmation Dialogs */}
        <ConfirmationDialogs
          showConfirmDialog={showConfirmDialog}
          setShowConfirmDialog={setShowConfirmDialog}
          userName={userName}
          isAdmin={isAdmin}
          handleAction={handleAction}
          isPending={updateRoleMutation.isPending || removeMemberMutation.isPending}
        />
      </>
    );
  }

  // Full card version
  return (
    <>
      <Card className={className} data-testid={`member-profile-card-${member.userId}`}>
        <CardHeader>
          <CardTitle>Member Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberProfileContent 
            member={member}
            userName={userName}
            userInitials={userInitials}
            isAdmin={isAdmin}
            isCurrentUser={isCurrentUser}
            joinDate={joinDate}
            isOnline={isOnline}
            lastActive={lastActive}
            contributions={contributions}
            socialLinks={socialLinks}
            currentUserIsAdmin={currentUserIsAdmin}
            onActionClick={setShowConfirmDialog}
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <ConfirmationDialogs
        showConfirmDialog={showConfirmDialog}
        setShowConfirmDialog={setShowConfirmDialog}
        userName={userName}
        isAdmin={isAdmin}
        handleAction={handleAction}
        isPending={updateRoleMutation.isPending || removeMemberMutation.isPending}
      />
    </>
  );
}

// Separate component for the profile content (reused in both card and hover card)
function MemberProfileContent({
  member,
  userName,
  userInitials,
  isAdmin,
  isCurrentUser,
  joinDate,
  isOnline,
  lastActive,
  contributions,
  socialLinks,
  currentUserIsAdmin,
  onActionClick,
}: {
  member: UserCommunity & { user: User };
  userName: string;
  userInitials: string;
  isAdmin: boolean;
  isCurrentUser: boolean;
  joinDate: Date | null;
  isOnline: boolean;
  lastActive: Date;
  contributions: number;
  socialLinks: Array<{ icon: any; handle: string | null; prefix: string }>;
  currentUserIsAdmin: boolean;
  onActionClick: (action: "promote" | "demote" | "remove") => void;
}) {
  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            {member.user.profileImageUrl ? (
              <AvatarImage src={member.user.profileImageUrl} alt={userName} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {userInitials}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold" data-testid={`text-member-name-${member.userId}`}>
                {userName}
              </h4>
              {isOnline && (
                <div className="h-2 w-2 bg-green-500 rounded-full" title="Online" />
              )}
            </div>
            {member.user.username && (
              <p className="text-sm text-muted-foreground">@{member.user.username}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {isAdmin ? (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">Member</Badge>
              )}
              {isCurrentUser && (
                <Badge variant="default" className="text-xs">You</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {member.user.bio && (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground">{member.user.bio}</p>
        </>
      )}

      {/* Member Stats */}
      <Separator />
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Joined</p>
            <p className="font-medium">
              {joinDate ? format(joinDate, "MMM d, yyyy") : "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Last Active</p>
            <p className="font-medium">{formatDistanceToNow(lastActive, { addSuffix: true })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Contributions</p>
            <p className="font-medium">{contributions}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Member Since</p>
            <p className="font-medium">
              {joinDate ? formatDistanceToNow(joinDate, { addSuffix: false }) : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            {socialLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={`${link.prefix}${link.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`link-social-${index}`}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </>
      )}

      {/* Actions */}
      <Separator />
      <div className="flex items-center gap-2">
        {member.user.username && (
          <Link href={`/user/${member.user.username}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-profile-${member.userId}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </Link>
        )}
        
        {currentUserIsAdmin && !isCurrentUser && (
          <div className="flex gap-2">
            {isAdmin ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onActionClick("demote")}
                data-testid={`button-demote-${member.userId}`}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Demote
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onActionClick("promote")}
                data-testid={`button-promote-${member.userId}`}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Promote
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onActionClick("remove")}
              data-testid={`button-remove-${member.userId}`}
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Confirmation dialogs component
function ConfirmationDialogs({
  showConfirmDialog,
  setShowConfirmDialog,
  userName,
  isAdmin,
  handleAction,
  isPending,
}: {
  showConfirmDialog: "promote" | "demote" | "remove" | null;
  setShowConfirmDialog: (value: "promote" | "demote" | "remove" | null) => void;
  userName: string;
  isAdmin: boolean;
  handleAction: (action: "promote" | "demote" | "remove") => void;
  isPending: boolean;
}) {
  return (
    <>
      {/* Promote Dialog */}
      <AlertDialog open={showConfirmDialog === "promote"} onOpenChange={(open) => !open && setShowConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will give {userName} administrative privileges in this sub-community. They will be able to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Manage other members</li>
                <li>Create and manage invites</li>
                <li>Modify sub-community settings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleAction("promote")}
              disabled={isPending}
              data-testid="button-confirm-promote"
            >
              {isPending ? "Promoting..." : "Promote to Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote Dialog */}
      <AlertDialog open={showConfirmDialog === "demote"} onOpenChange={(open) => !open && setShowConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Privileges?</AlertDialogTitle>
            <AlertDialogDescription>
              {userName} will lose all administrative privileges in this sub-community and become a regular member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleAction("demote")}
              disabled={isPending}
              data-testid="button-confirm-demote"
            >
              {isPending ? "Demoting..." : "Remove Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Dialog */}
      <AlertDialog open={showConfirmDialog === "remove"} onOpenChange={(open) => !open && setShowConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              {userName} will be removed from this sub-community. They can rejoin later if they receive a new invite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleAction("remove")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              data-testid="button-confirm-remove"
            >
              {isPending ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}