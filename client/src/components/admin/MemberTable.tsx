import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowUpDown,
  UserCheck,
  ShieldCheck,
  Calendar,
  Activity
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { UserCommunity, User } from "@shared/schema";

interface MemberTableProps {
  members: (UserCommunity & { user: User })[];
  subCommunityId: string;
  currentUserId: string;
}

type SortField = "name" | "role" | "joinedAt";
type SortOrder = "asc" | "desc";

export function MemberTable({ members, subCommunityId, currentUserId }: MemberTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("joinedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "demote" | "remove";
    member: UserCommunity & { user: User };
  } | null>(null);

  // Filter and sort members
  const filteredMembers = members
    .filter(member => {
      const searchLower = searchTerm.toLowerCase();
      const userName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.toLowerCase();
      const email = member.user.email?.toLowerCase() || "";
      const username = member.user.username?.toLowerCase() || "";
      
      return (
        userName.includes(searchLower) ||
        email.includes(searchLower) ||
        username.includes(searchLower)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          const nameA = `${a.user.firstName || ""} ${a.user.lastName || ""}`.toLowerCase();
          const nameB = `${b.user.firstName || ""} ${b.user.lastName || ""}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case "role":
          comparison = (a.role || "member").localeCompare(b.role || "member");
          break;
        case "joinedAt":
          const dateA = new Date(a.joinedAt || 0).getTime();
          const dateB = new Date(b.joinedAt || 0).getTime();
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

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
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-members"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredMembers.length} of {members.length} members
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort("name")}
                  data-testid="button-sort-name"
                >
                  Member
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort("role")}
                  data-testid="button-sort-role"
                >
                  Role
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleSort("joinedAt")}
                  data-testid="button-sort-joined"
                >
                  Joined
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              {currentUserIsAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
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
                <TableRow key={member.id} data-testid={`member-row-${member.userId}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {member.user.profileImageUrl ? (
                          <AvatarImage src={member.user.profileImageUrl} />
                        ) : (
                          <AvatarFallback>
                            {userName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {userName}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        {member.user.username && (
                          <div className="text-sm text-muted-foreground">
                            @{member.user.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Badge className="flex items-center gap-1 w-fit">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <UserCheck className="h-3 w-3" />
                        Member
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(member.joinedAt || Date.now()), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isOnline ? (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm text-muted-foreground">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        {format(lastActive, "MMM d")}
                      </div>
                    )}
                  </TableCell>
                  {currentUserIsAdmin && (
                    <TableCell>
                      {!isCurrentUser ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-member-actions-${member.userId}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isAdmin ? (
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({ type: "demote", member })}
                                data-testid={`button-demote-${member.userId}`}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Remove Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({ type: "promote", member })}
                                data-testid={`button-promote-${member.userId}`}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setConfirmAction({ type: "remove", member })}
                              data-testid={`button-remove-${member.userId}`}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "promote" && "Promote to Admin"}
              {confirmAction?.type === "demote" && "Remove Admin Role"}
              {confirmAction?.type === "remove" && "Remove Member"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "promote" && (
                <>
                  Are you sure you want to make{" "}
                  <span className="font-medium">
                    {confirmAction.member.user.username || "this user"}
                  </span>{" "}
                  an admin? They will be able to manage members, invites, and settings.
                </>
              )}
              {confirmAction?.type === "demote" && (
                <>
                  Are you sure you want to remove admin privileges from{" "}
                  <span className="font-medium">
                    {confirmAction.member.user.username || "this user"}
                  </span>
                  ? They will become a regular member.
                </>
              )}
              {confirmAction?.type === "remove" && (
                <>
                  Are you sure you want to remove{" "}
                  <span className="font-medium">
                    {confirmAction.member.user.username || "this user"}
                  </span>{" "}
                  from the sub-community? They will need a new invite to rejoin.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction(confirmAction)}
              className={confirmAction?.type === "remove" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmAction?.type === "promote" && "Promote"}
              {confirmAction?.type === "demote" && "Remove Admin"}
              {confirmAction?.type === "remove" && "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}