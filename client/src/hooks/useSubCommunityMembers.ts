import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserCommunity, User } from "@shared/schema";

export interface MemberWithUser extends UserCommunity {
  user: User;
}

export interface UseSubCommunityMembersOptions {
  subCommunityId: string;
  pageSize?: number;
  initialRole?: "all" | "admin" | "member";
  initialSortBy?: "name" | "role" | "joinedAt";
  initialSortOrder?: "asc" | "desc";
}

export interface UseSubCommunityMembersReturn {
  members: MemberWithUser[];
  isLoading: boolean;
  error: Error | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalMembers: number;
  setCurrentPage: (page: number) => void;
  
  // Filtering
  roleFilter: "all" | "admin" | "member";
  setRoleFilter: (role: "all" | "admin" | "member") => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  // Sorting
  sortBy: "name" | "role" | "joinedAt";
  sortOrder: "asc" | "desc";
  setSortBy: (field: "name" | "role" | "joinedAt") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  toggleSort: (field: "name" | "role" | "joinedAt") => void;
  
  // Actions
  updateMemberRole: (userId: string, role: "admin" | "member") => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  bulkRemoveMembers: (userIds: string[]) => Promise<void>;
  bulkUpdateRoles: (userIds: string[], role: "admin" | "member") => Promise<void>;
  
  // Computed values
  filteredMembers: MemberWithUser[];
  displayedMembers: MemberWithUser[];
}

export function useSubCommunityMembers({
  subCommunityId,
  pageSize = 20,
  initialRole = "all",
  initialSortBy = "joinedAt",
  initialSortOrder = "desc",
}: UseSubCommunityMembersOptions): UseSubCommunityMembersReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">(initialRole);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "role" | "joinedAt">(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  // Fetch members data
  const {
    data: membersData,
    isLoading,
    error,
  } = useQuery<{ members: MemberWithUser[]; total: number }>({
    queryKey: [`/api/sub-communities/${subCommunityId}/members`],
    enabled: !!subCommunityId,
  });

  const members = membersData?.members || [];
  const totalMembers = membersData?.total || 0;

  // Filter members based on role and search term
  const filteredMembers = useMemo(() => {
    let filtered = [...members];

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((member) => {
        const fullName = `${member.user.firstName || ""} ${member.user.lastName || ""}`.toLowerCase();
        const username = member.user.username?.toLowerCase() || "";
        const email = member.user.email?.toLowerCase() || "";

        return (
          fullName.includes(searchLower) ||
          username.includes(searchLower) ||
          email.includes(searchLower)
        );
      });
    }

    // Sort members
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name": {
          const nameA = `${a.user.firstName || ""} ${a.user.lastName || ""}`.toLowerCase();
          const nameB = `${b.user.firstName || ""} ${b.user.lastName || ""}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case "role":
          comparison = (a.role || "member").localeCompare(b.role || "member");
          break;
        case "joinedAt": {
          const dateA = new Date(a.joinedAt || 0).getTime();
          const dateB = new Date(b.joinedAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [members, roleFilter, searchTerm, sortBy, sortOrder]);

  // Paginate members
  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const displayedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, currentPage, pageSize]);

  // Toggle sort order
  const toggleSort = useCallback(
    (field: "name" | "role" | "joinedAt") => {
      if (sortBy === field) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(field);
        setSortOrder("asc");
      }
    },
    [sortBy, sortOrder]
  );

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "member" }) => {
      const response = await apiRequest(
        "PUT",
        `/api/sub-communities/${subCommunityId}/members/${userId}/role`,
        { role }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/sub-communities/${subCommunityId}/members`],
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/sub-communities/${subCommunityId}/members/${userId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/sub-communities/${subCommunityId}/members`],
      });
    },
  });

  // Bulk remove members mutation
  const bulkRemoveMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const promises = userIds.map((userId) =>
        apiRequest("DELETE", `/api/sub-communities/${subCommunityId}/members/${userId}`)
      );
      const responses = await Promise.all(promises);
      return await Promise.all(responses.map((r) => r.json()));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/sub-communities/${subCommunityId}/members`],
      });
    },
  });

  // Bulk update roles mutation
  const bulkUpdateRolesMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: "admin" | "member" }) => {
      const promises = userIds.map((userId) =>
        apiRequest("PUT", `/api/sub-communities/${subCommunityId}/members/${userId}/role`, {
          role,
        })
      );
      const responses = await Promise.all(promises);
      return await Promise.all(responses.map((r) => r.json()));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/sub-communities/${subCommunityId}/members`],
      });
    },
  });

  // Action wrappers
  const updateMemberRole = async (userId: string, role: "admin" | "member") => {
    await updateRoleMutation.mutateAsync({ userId, role });
  };

  const removeMember = async (userId: string) => {
    await removeMemberMutation.mutateAsync(userId);
  };

  const bulkRemoveMembers = async (userIds: string[]) => {
    await bulkRemoveMutation.mutateAsync(userIds);
  };

  const bulkUpdateRoles = async (userIds: string[], role: "admin" | "member") => {
    await bulkUpdateRolesMutation.mutateAsync({ userIds, role });
  };

  return {
    members,
    isLoading,
    error: error as Error | null,
    
    // Pagination
    currentPage,
    totalPages,
    totalMembers,
    setCurrentPage,
    
    // Filtering
    roleFilter,
    setRoleFilter,
    searchTerm,
    setSearchTerm,
    
    // Sorting
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    toggleSort,
    
    // Actions
    updateMemberRole,
    removeMember,
    bulkRemoveMembers,
    bulkUpdateRoles,
    
    // Computed values
    filteredMembers,
    displayedMembers,
  };
}