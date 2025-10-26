import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Shield, 
  Calendar,
  Search,
  Grid3x3,
  List,
  UserCircle,
  Activity,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { useSubCommunityMembers } from "@/hooks/useSubCommunityMembers";
import { Link } from "wouter";
import type { MemberWithUser } from "@/hooks/useSubCommunityMembers";

interface PublicMemberListProps {
  subCommunityId: string;
  subCommunityName?: string;
}

export function PublicMemberList({ subCommunityId, subCommunityName }: PublicMemberListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const {
    members,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalMembers,
    setCurrentPage,
    roleFilter,
    setRoleFilter,
    searchTerm,
    setSearchTerm,
    displayedMembers,
    filteredMembers,
  } = useSubCommunityMembers({
    subCommunityId,
    pageSize: viewMode === "grid" ? 12 : 20,
    initialRole: "all",
    initialSortBy: "joinedAt",
    initialSortOrder: "desc",
  });

  const MemberCard = ({ member }: { member: MemberWithUser }) => {
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
    const joinDate = member.joinedAt ? format(new Date(member.joinedAt), "MMM d, yyyy") : "Unknown";

    if (viewMode === "grid") {
      return (
        <Card className="hover:shadow-lg transition-shadow" data-testid={`member-card-${member.userId}`}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-20 w-20">
                {member.user.profileImageUrl ? (
                  <AvatarImage src={member.user.profileImageUrl} alt={userName} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg">
                    {userInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg" data-testid={`text-member-name-${member.userId}`}>
                  {userName}
                </h3>
                {member.user.username && (
                  <p className="text-sm text-muted-foreground">@{member.user.username}</p>
                )}
                
                <div className="flex items-center justify-center gap-2">
                  {isAdmin ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline">Member</Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {joinDate}
                </div>
              </div>
              
              {member.user.username && (
                <Link href={`/user/${member.user.username}`}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    data-testid={`button-view-profile-${member.userId}`}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // List view
    return (
      <div 
        className="flex items-center justify-between p-4 hover:bg-accent rounded-lg transition-colors"
        data-testid={`member-list-item-${member.userId}`}
      >
        <div className="flex items-center space-x-4">
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
              <h3 className="font-medium" data-testid={`text-member-name-${member.userId}`}>
                {userName}
              </h3>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            {member.user.username && (
              <p className="text-sm text-muted-foreground">@{member.user.username}</p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Joined {joinDate}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {member.user.username && (
            <Link href={`/user/${member.user.username}`}>
              <Button 
                variant="ghost" 
                size="sm"
                data-testid={`button-view-profile-${member.userId}`}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => {
    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Failed to load members. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="public-member-list">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Members {subCommunityName && `of ${subCommunityName}`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalMembers} total members • {filteredMembers.length} shown
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-members"
              />
            </div>
            
            <Tabs value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="filter-all">
                  All
                </TabsTrigger>
                <TabsTrigger value="admin" data-testid="filter-admins">
                  Admins
                </TabsTrigger>
                <TabsTrigger value="member" data-testid="filter-members">
                  Members
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Members Display */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : displayedMembers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm || roleFilter !== "all" 
                ? "No members found matching your filters."
                : "No members yet. Be the first to join!"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedMembers.map((member) => (
            <MemberCard key={member.userId} member={member} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-2">
            <div className="space-y-1">
              {displayedMembers.map((member) => (
                <MemberCard key={member.userId} member={member} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  data-testid="button-prev-page"
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && <PaginationEllipsis />}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  data-testid="button-next-page"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}