import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Users, Shield, Crown, Folder, Mail, UserPlus, Search } from "lucide-react";
import type { Community, User, UserRole, CommunityInvite } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

const communitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

const inviteSchema = z.object({
  communityId: z.string().min(1, "Community is required"),
  maxUses: z.number().min(1, "Max uses must be at least 1").max(100, "Max uses cannot exceed 100"),
  expiresAt: z.string().optional(),
});

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["user", "community", "global"]).default("community"),
  isPublic: z.boolean().default(false),
});

type CommunityFormData = z.infer<typeof communitySchema>;
type InviteFormData = z.infer<typeof inviteSchema>;
type CollectionFormData = z.infer<typeof collectionSchema>;

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedCommunityForMembers, setSelectedCommunityForMembers] = useState<Community | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [selectedCommunityForCollections, setSelectedCommunityForCollections] = useState<Community | null>(null);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("");

  // Check if user is admin (super admin or community admin)
  if (!authLoading && (!user || !["super_admin", "community_admin"].includes((user as any).role))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access this page. Admin access required.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSuperAdmin = (user as any)?.role === "super_admin";
  const isCommunityAdmin = (user as any)?.role === "community_admin";

  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    },
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      communityId: "",
      maxUses: 1,
      expiresAt: "",
    },
  });

  const collectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "community",
      isPublic: false,
    },
  });

  // Fetch communities (all for super admin, managed ones for community admin)
  const { data: communities = [], isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: isSuperAdmin ? ["/api/communities"] : ["/api/communities/managed"],
    enabled: !!user,
  });

  // Fetch invites and stats (for Super Admin)
  const { data: invites = [], isLoading: invitesLoading } = useQuery<CommunityInvite[]>({
    queryKey: ["/api/invites"],
    enabled: isSuperAdmin && !!user,
  });

  const { data: inviteStats } = useQuery<{
    active: number;
    used: number;
    expired: number;
  }>({
    queryKey: ["/api/invites/stats"],
    enabled: isSuperAdmin && !!user,
  });

  // Fetch users (for user management)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: isSuperAdmin && !!user,
  });

  // Fetch community members (when member modal is open)
  const { data: communityMembers = [], isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ["/api/communities", selectedCommunityForMembers?.id, "members"],
    enabled: !!selectedCommunityForMembers && !!user,
  });

  // Fetch community collections (when collections modal is open)
  const { data: communityCollections = [], isLoading: collectionsLoading, refetch: refetchCollections } = useQuery({
    queryKey: ["/api/collections"],
    queryFn: () => apiRequest("GET", `/api/collections?communityId=${selectedCommunityForCollections?.id}&type=community`),
    enabled: !!selectedCommunityForCollections && !!user,
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      return apiRequest("PUT", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: async (data: CommunityFormData) => {
      return await apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      setCommunityModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Community created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create community",
        variant: "destructive",
      });
    },
  });

  // Update community mutation
  const updateCommunityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CommunityFormData> }) => {
      return await apiRequest("PUT", `/api/communities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      setCommunityModalOpen(false);
      setSelectedCommunity(null);
      form.reset();
      toast({
        title: "Success",
        description: "Community updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update community",
        variant: "destructive",
      });
    },
  });

  // Delete community mutation
  const deleteCommunityMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/communities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({
        title: "Success",
        description: "Community deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete community",
        variant: "destructive",
      });
    },
  });

  // Invite mutations
  const createInviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const payload = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      };
      return await apiRequest("POST", `/api/communities/${data.communityId}/invites`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/stats"] });
      setInviteModalOpen(false);
      inviteForm.reset();
      toast({
        title: "Success",
        description: "Invite created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create invite",
        variant: "destructive",
      });
    },
  });

  const deactivateInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      return await apiRequest("POST", `/api/invites/${inviteId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invites/stats"] });
      toast({
        title: "Success", 
        description: "Invite deactivated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate invite",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommunityFormData) => {
    if (selectedCommunity) {
      updateCommunityMutation.mutate({ id: selectedCommunity.id, data });
    } else {
      createCommunityMutation.mutate(data);
    }
  };

  const onInviteSubmit = (data: InviteFormData) => {
    createInviteMutation.mutate(data);
  };

  const openEditModal = (community: Community) => {
    setSelectedCommunity(community);
    form.reset({
      name: community.name,
      description: community.description || "",
      slug: community.slug,
    });
    setCommunityModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedCommunity(null);
    form.reset();
    setCommunityModalOpen(true);
  };

  const openInviteModal = () => {
    inviteForm.reset();
    setInviteModalOpen(true);
  };

  const openMemberModal = (community: Community) => {
    setSelectedCommunityForMembers(community);
    setMemberSearchTerm("");
    setMemberModalOpen(true);
  };

  const openCollectionsModal = (community: Community) => {
    setSelectedCommunityForCollections(community);
    setCollectionSearchTerm("");
    setCollectionsModalOpen(true);
  };

  // Member management mutations
  const removeMemberMutation = useMutation({
    mutationFn: async ({ userId, communityId }: { userId: string; communityId: string }) => {
      return await apiRequest("DELETE", `/api/communities/${communityId}/members/${userId}`);
    },
    onSuccess: () => {
      refetchMembers();
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, communityId, role }: { userId: string; communityId: string; role: string }) => {
      return await apiRequest("PUT", `/api/communities/${communityId}/members/${userId}/role`, { role });
    },
    onSuccess: () => {
      refetchMembers();
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member role",
        variant: "destructive",
      });
    },
  });

  // Collection mutations
  const createCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      return await apiRequest("POST", "/api/collections", {
        ...data,
        communityId: selectedCommunityForCollections?.id,
      });
    },
    onSuccess: () => {
      refetchCollections();
      collectionForm.reset();
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      return await apiRequest("DELETE", `/api/collections/${collectionId}`);
    },
    onSuccess: () => {
      refetchCollections();
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive",
      });
    },
  });

  const onCollectionSubmit = (data: CollectionFormData) => {
    createCollectionMutation.mutate(data);
  };

  if (authLoading || communitiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Folder className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">PromptAtrium</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-dashboard">
                Dashboard
              </a>
              <a href="/library" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-library">
                My Library
              </a>
              <a href="/community" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-community">
                Community
              </a>
              <a href="/projects" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-projects">
                Projects
              </a>
              {(user?.role === "super_admin" || user?.role === "community_admin") && (
                <span className="text-yellow-600 font-medium border-b-2 border-yellow-600 pb-4 -mb-4 flex items-center gap-1" data-testid="nav-admin">
                  <Crown className="h-4 w-4" />
                  Admin
                </span>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-muted-foreground">Welcome back,</span>
              <span className="font-medium text-foreground">
                {user?.firstName || user?.email}
              </span>
            </div>
            <a href="/api/logout" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Logout
            </a>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              {isSuperAdmin ? (
                <>
                  <Crown className="h-8 w-8 text-yellow-500" />
                  Super Admin Dashboard
                </>
              ) : (
                <>
                  <Users className="h-8 w-8 text-blue-500" />
                  Community Admin Dashboard
                </>
              )}
            </h1>
            <p className="text-gray-600 mt-2">
              {isSuperAdmin 
                ? "Manage communities, users, and platform settings"
                : "Manage your communities, collections, and members"
              }
            </p>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="communities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Communities
            </TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="invites" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Invites
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                {isSuperAdmin ? "All Communities" : "My Communities"}
              </h2>
              {isSuperAdmin && (
                <Button onClick={openCreateModal} data-testid="button-create-community">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Community
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community: Community) => (
                <Card key={community.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                        <CardDescription className="mt-1">@{community.slug}</CardDescription>
                      </div>
                      <Badge variant={community.isActive ? "default" : "secondary"}>
                        {community.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{community.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMemberModal(community)}
                        data-testid={`button-manage-members-${community.id}`}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Members
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCollectionsModal(community)}
                        data-testid={`button-manage-collections-${community.id}`}
                      >
                        <Folder className="h-4 w-4 mr-1" />
                        Collections
                      </Button>
                      {isSuperAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(community)}
                            data-testid={`button-edit-community-${community.id}`}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCommunityMutation.mutate(community.id)}
                            disabled={deleteCommunityMutation.isPending}
                            data-testid={`button-delete-community-${community.id}`}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab - Super Admin Only */}
          {isSuperAdmin && (
            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">User Management</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-user-search"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                    <span className="w-8">#</span>
                    <span className="flex-1">User</span>
                    <span className="w-32">Role</span>
                    <span className="w-32">Joined</span>
                    <span className="w-32">Actions</span>
                  </div>
                </div>
                
                {usersLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {users
                      ?.filter((user: User) =>
                        !userSearchTerm ||
                        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                        user.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map((user: User, index: number) => (
                        <div key={user.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <span className="w-8 text-sm text-gray-500">{index + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-sm text-gray-500">({user.email})</span>
                              </div>
                            </div>
                            <div className="w-32">
                              <Select
                                value={(user as any).role || "user"}
                                onValueChange={(role: UserRole) => {
                                  updateUserRoleMutation.mutate({ userId: user.id, role });
                                }}
                              >
                                <SelectTrigger className="w-full" data-testid={`select-user-role-${user.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="community_admin">Community Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 text-sm text-gray-600">
                              {user.createdAt && new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <div className="w-32">
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-manage-user-${user.id}`}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Manage
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Invites Tab - Super Admin Only */}
          {isSuperAdmin && (
            <TabsContent value="invites" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Invite Management</h2>
                <Button onClick={openInviteModal} data-testid="button-create-invite">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invite
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Active Invites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{inviteStats?.active || 0}</div>
                    <p className="text-sm text-gray-600">Currently active</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Used Invites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{inviteStats?.used || 0}</div>
                    <p className="text-sm text-gray-600">Successfully redeemed</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Expired Invites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{inviteStats?.expired || 0}</div>
                    <p className="text-sm text-gray-600">No longer valid</p>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                    <span className="flex-1">Code</span>
                    <span className="w-32">Community</span>
                    <span className="w-24">Uses</span>
                    <span className="w-24">Status</span>
                    <span className="w-32">Created</span>
                    <span className="w-24">Actions</span>
                  </div>
                </div>
                
                {invites.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No invites found</p>
                    <p className="text-sm">Create your first community invite to get started</p>
                  </div>
                ) : (
                  invites.map((invite) => {
                    const community = communities.find(c => c.id === invite.communityId);
                    const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
                    const isExhausted = invite.currentUses >= invite.maxUses;
                    const isActive = invite.isActive && !isExpired && !isExhausted;
                    
                    return (
                      <div key={invite.id} className="p-4 border-b last:border-b-0 flex items-center gap-4 text-sm">
                        <span className="flex-1 font-mono text-blue-600">{invite.code}</span>
                        <span className="w-32">{community?.name || 'Unknown'}</span>
                        <span className="w-24">{invite.currentUses}/{invite.maxUses}</span>
                        <span className="w-24">
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Active" : isExpired ? "Expired" : isExhausted ? "Used Up" : "Inactive"}
                          </Badge>
                        </span>
                        <span className="w-32 text-gray-600">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </span>
                        <span className="w-24">
                          {isActive && (
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => deactivateInviteMutation.mutate(invite.id)}
                              disabled={deactivateInviteMutation.isPending}
                              data-testid={`button-deactivate-${invite.id}`}
                            >
                              Deactivate
                            </Button>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Community Modal */}
        <Dialog open={communityModalOpen} onOpenChange={setCommunityModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedCommunity ? "Edit Community" : "Create Community"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Community Name"
                          {...field}
                          data-testid="input-community-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="community-slug"
                          {...field}
                          data-testid="input-community-slug"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Community description..."
                          {...field}
                          data-testid="input-community-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCommunityModalOpen(false)}
                    data-testid="button-cancel-community"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCommunityMutation.isPending || updateCommunityMutation.isPending}
                    data-testid="button-submit-community"
                  >
                    {selectedCommunity ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Invite Modal */}
        <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Community Invite</DialogTitle>
            </DialogHeader>
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                <FormField
                  control={inviteForm.control}
                  name="communityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Community</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-invite-community">
                            <SelectValue placeholder="Select a community" />
                          </SelectTrigger>
                          <SelectContent>
                            {communities.map((community) => (
                              <SelectItem key={community.id} value={community.id}>
                                {community.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="maxUses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Uses</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="1"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-invite-max-uses"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          data-testid="input-invite-expires-at"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteModalOpen(false)}
                    data-testid="button-cancel-invite"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInviteMutation.isPending}
                    data-testid="button-submit-invite"
                  >
                    Create Invite
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Member Management Modal */}
        <Dialog open={memberModalOpen} onOpenChange={setMemberModalOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Manage Members - {selectedCommunityForMembers?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-member-search"
                  />
                </div>
                <Button 
                  size="sm"
                  data-testid="button-invite-new-member"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>

              <div className="bg-white rounded-lg border max-h-96 overflow-y-auto">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                    <span className="w-8">#</span>
                    <span className="flex-1">Member</span>
                    <span className="w-32">Role</span>
                    <span className="w-32">Joined</span>
                    <span className="w-24">Actions</span>
                  </div>
                </div>
                
                {membersLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading members...</p>
                  </div>
                ) : communityMembers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No members found</p>
                    <p className="text-sm">Invite your first community member to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {communityMembers
                      ?.filter((member: any) =>
                        !memberSearchTerm ||
                        member.user?.email?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        member.user?.firstName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        member.user?.lastName?.toLowerCase().includes(memberSearchTerm.toLowerCase())
                      )
                      .map((member: any, index: number) => (
                        <div key={member.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <span className="w-8 text-sm text-gray-500">{index + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {member.user?.firstName} {member.user?.lastName}
                                </span>
                                <span className="text-sm text-gray-500">({member.user?.email})</span>
                              </div>
                            </div>
                            <div className="w-32">
                              <Select
                                value={member.role || "member"}
                                onValueChange={(role: string) => {
                                  if (selectedCommunityForMembers && member.userId) {
                                    updateMemberRoleMutation.mutate({ 
                                      userId: member.userId, 
                                      communityId: selectedCommunityForMembers.id, 
                                      role 
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-full" data-testid={`select-member-role-${member.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 text-sm text-gray-600">
                              {member.joinedAt && new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                            <div className="w-24">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (selectedCommunityForMembers && member.userId) {
                                    removeMemberMutation.mutate({ 
                                      userId: member.userId, 
                                      communityId: selectedCommunityForMembers.id 
                                    });
                                  }
                                }}
                                disabled={removeMemberMutation.isPending}
                                data-testid={`button-remove-member-${member.id}`}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Collections Management Modal */}
        <Dialog open={collectionsModalOpen} onOpenChange={setCollectionsModalOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Manage Collections - {selectedCommunityForCollections?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search collections..."
                    value={collectionSearchTerm}
                    onChange={(e) => setCollectionSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-collection-search"
                  />
                </div>
              </div>

              {/* Create Collection Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create New Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...collectionForm}>
                    <form onSubmit={collectionForm.handleSubmit(onCollectionSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={collectionForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Collection Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Writing Prompts" {...field} data-testid="input-collection-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={collectionForm.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Public Collection</FormLabel>
                                <div className="text-sm text-gray-600">
                                  Allow all community members to view
                                </div>
                              </div>
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                  data-testid="checkbox-collection-public"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={collectionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what this collection contains..."
                                {...field}
                                data-testid="textarea-collection-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={createCollectionMutation.isPending}
                        data-testid="button-create-collection"
                      >
                        {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Collections List */}
              <div className="bg-white rounded-lg border max-h-96 overflow-y-auto">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                    <span className="w-8">#</span>
                    <span className="flex-1">Collection</span>
                    <span className="w-24">Visibility</span>
                    <span className="w-32">Created</span>
                    <span className="w-24">Actions</span>
                  </div>
                </div>
                
                {collectionsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading collections...</p>
                  </div>
                ) : communityCollections.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Folder className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No collections found</p>
                    <p className="text-sm">Create your first community collection to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {communityCollections
                      ?.filter((collection: any) =>
                        !collectionSearchTerm ||
                        collection.name?.toLowerCase().includes(collectionSearchTerm.toLowerCase()) ||
                        collection.description?.toLowerCase().includes(collectionSearchTerm.toLowerCase())
                      )
                      .map((collection: any, index: number) => (
                        <div key={collection.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <span className="w-8 text-sm text-gray-500">{index + 1}</span>
                            <div className="flex-1">
                              <div className="font-medium">{collection.name}</div>
                              <div className="text-sm text-gray-600">{collection.description}</div>
                            </div>
                            <div className="w-24">
                              <Badge variant={collection.isPublic ? "default" : "secondary"}>
                                {collection.isPublic ? "Public" : "Private"}
                              </Badge>
                            </div>
                            <div className="w-32 text-sm text-gray-600">
                              {collection.createdAt && new Date(collection.createdAt).toLocaleDateString()}
                            </div>
                            <div className="w-24">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCollectionMutation.mutate(collection.id)}
                                disabled={deleteCollectionMutation.isPending}
                                data-testid={`button-delete-collection-${collection.id}`}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}