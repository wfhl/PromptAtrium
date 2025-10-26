import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { 
  Shield, 
  UserMinus, 
  MoreVertical, 
  Search,
  UserCheck,
  ShieldCheck,
  Calendar,
  Activity
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { UserCommunity, User } from "@shared/schema";

interface MemberTableMobileProps {
  members: (UserCommunity & { user: User })[];
  subCommunityId: string;
  currentUserId: string;
}

export function MemberTableMobile({ members, subCommunityId, currentUserId }: MemberTableMobileProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "demote" | "remove";
    member: UserCommunity & { user: User };
  } | null>(null);

  // Filter members
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const userName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.toLowerCase();
    const email = member.user.email?.toLowerCase() || "";
    const username = member.user.username?.toLowerCase() || "";
    
    return (
      userName.includes(searchLower) ||
      email.includes(searchLower) ||
      username.includes(searchLower)
    );
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "member" | "admin" }) => {
      const response = await apiRequest(
        "PUT",
        `/api/sub-communities/${subCommunityId}/members/${userId}/role`,
        { role }
      );
      return await response.json();
    },
    onSuccess: (_, { userId, role }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sub-communities/${subCommunityId}/members`] });
      const member = members.find(m => m.userId === userId);
      const userName = member?.user.username || "User";
      toast({
        title: "Role updated",
        description: `${userName} is now ${role === "admin" ? "an admin" : "a member"}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
        description: error.message || "Could not update member role",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/sub-communities/${subCommunityId}/members/${userId}`
      );
      return await response.json();
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/sub-communities/${subCommunityId}/members`] });
      const member = members.find(m => m.userId === userId);
      const userName = member?.user.username || "User";
      toast({
        title: "Member removed",
        description: `${userName} has been removed from the sub-community`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message || "Could not remove member",
        variant: "destructive",
      });
    },
  });

  const handleAction = (action: typeof confirmAction) => {
    if (!action) return;

    setConfirmAction(null);

    switch (action.type) {
      case "promote":
        updateRoleMutation.mutate({ userId: action.member.userId, role: "admin" });
        break;
      case "demote":
        updateRoleMutation.mutate({ userId: action.member.userId, role: "member" });
        break;
      case "remove":
        removeMemberMutation.mutate(action.member.userId);
        break;
    }
  };

  const currentUserIsAdmin = members.find(m => m.userId === currentUserId)?.role === "admin";

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-sm"
            data-testid="input-search-members"
          />
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {filteredMembers.length} of {members.length} members
        </div>
      </div>

      {/* Members Cards for Mobile */}
      <div className="space-y-3">
        {filteredMembers.map(member => {
          const isCurrentUser = member.userId === currentUserId;
          const isAdmin = member.role === "admin";
          const userName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.trim() || 
                          member.user.username || 
                          "Anonymous";
          
          // Mock activity status (in real app, this would come from API)
          const lastActive = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
          const isOnline = Math.random() > 0.7;

          return (
            <Card key={member.id} className="p-3" data-testid={`member-card-${member.userId}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-10 w-10">
                    {member.user.profileImageUrl ? (
                      <AvatarImage src={member.user.profileImageUrl} />
                    ) : (
                      <AvatarFallback>
                        {userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm truncate">{userName}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          You
                        </Badge>
                      )}
                    </div>
                    {member.user.username && (
                      <div className="text-xs text-muted-foreground truncate">
                        @{member.user.username}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Role Badge */}
                      {isAdmin ? (
                        <Badge className="flex items-center gap-1 text-[10px]">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                          <UserCheck className="h-2.5 w-2.5" />
                          Member
                        </Badge>
                      )}
                      
                      {/* Joined Date */}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-2.5 w-2.5" />
                        {format(new Date(member.joinedAt || Date.now()), "MMM d, yyyy")}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mt-2">
                      {isOnline ? (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span className="text-[10px] text-muted-foreground">Online</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Activity className="h-2.5 w-2.5" />
                          Active {format(lastActive, "MMM d")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {currentUserIsAdmin && !isCurrentUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        data-testid={`button-actions-${member.userId}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isAdmin ? (
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ type: "demote", member })}
                          className="text-xs"
                        >
                          <Shield className="h-3 w-3 mr-2" />
                          Demote to Member
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setConfirmAction({ type: "promote", member })}
                          className="text-xs"
                        >
                          <Shield className="h-3 w-3 mr-2" />
                          Promote to Admin
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setConfirmAction({ type: "remove", member })}
                        className="text-red-600 dark:text-red-500 text-xs"
                      >
                        <UserMinus className="h-3 w-3 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </Card>
          );
        })}
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No members found
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              {confirmAction?.type === "promote" && "Promote to Admin"}
              {confirmAction?.type === "demote" && "Demote to Member"}
              {confirmAction?.type === "remove" && "Remove Member"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {confirmAction?.type === "promote" && (
                <>
                  Are you sure you want to promote{" "}
                  <span className="font-medium">
                    {confirmAction.member.user.username || "this user"}
                  </span>{" "}
                  to admin? They will have full administrative privileges.
                </>
              )}
              {confirmAction?.type === "demote" && (
                <>
                  Are you sure you want to demote{" "}
                  <span className="font-medium">
                    {confirmAction.member.user.username || "this admin"}
                  </span>{" "}
                  to a regular member? They will lose administrative privileges.
                </>
              )}
              {confirmAction?.type === "remove" && (
                <>
                  Are you sure you want to remove{" "}
                  <span className="font-medium">
                    {confirmAction.member.user.username || "this member"}
                  </span>{" "}
                  from the sub-community? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleAction(confirmAction)} 
              className={confirmAction?.type === "remove" ? "bg-red-600 hover:bg-red-700 w-full sm:w-auto" : "w-full sm:w-auto"}
            >
              {confirmAction?.type === "promote" && "Promote"}
              {confirmAction?.type === "demote" && "Demote"}
              {confirmAction?.type === "remove" && "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}