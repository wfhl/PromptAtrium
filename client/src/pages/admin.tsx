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
import { Plus, Settings, Users, Shield, Crown, Folder, UserPlus, Search, Copy, Link2, CheckCircle } from "lucide-react";
import type { Community, User, UserRole } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";

const communitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

const memberInviteSchema = z.object({
  maxUses: z.number().min(1, "Max uses must be at least 1").max(100, "Max uses cannot exceed 100").optional(),
  expiresIn: z.enum(["1h", "24h", "7d", "30d", "never"]).default("7d"),
  role: z.enum(["member", "admin"]).default("member"),
});

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["user", "community", "global"]).default("community"),
  isPublic: z.boolean().default(false),
});

type CommunityFormData = z.infer<typeof communitySchema>;
type MemberInviteFormData = z.infer<typeof memberInviteSchema>;
type CollectionFormData = z.infer<typeof collectionSchema>;

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [selectedCommunityForMembers, setSelectedCommunityForMembers] = useState<Community | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberInviteModalOpen, setMemberInviteModalOpen] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [selectedCommunityForCollections, setSelectedCommunityForCollections] = useState<Community | null>(null);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("");

  // Check if user is admin (super admin, community admin, or developer)
  if (!authLoading && (!user || !["super_admin", "community_admin", "developer"].includes((user as any).role))) {
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

  const isSuperAdmin = (user as any)?.role === "super_admin" || (user as any)?.role === "developer";
  const isCommunityAdmin = (user as any)?.role === "community_admin";

  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    },
  });


  const memberInviteForm = useForm<MemberInviteFormData>({
    resolver: zodResolver(memberInviteSchema),
    defaultValues: {
      maxUses: 10,
      expiresIn: "7d",
      role: "member",
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
  const { data: communityCollections = [], isLoading: collectionsLoading, refetch: refetchCollections } = useQuery<any[]>({
    queryKey: ["/api/collections", selectedCommunityForCollections?.id, "community"],
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


  const createMemberInviteMutation = useMutation({
    mutationFn: async (data: MemberInviteFormData) => {
      if (!selectedCommunityForMembers) {
        throw new Error("No community selected");
      }
      
      // Calculate expiry date based on expiresIn
      let expiresAt: Date | null = null;
      if (data.expiresIn !== "never") {
        const now = new Date();
        switch (data.expiresIn) {
          case "1h":
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case "24h":
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "7d":
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }
      
      // Check if this is a sub-community
      const isSubCommunity = selectedCommunityForMembers.parentCommunityId !== null;
      
      if (isSubCommunity) {
        // Use sub-community invite endpoint
        return await apiRequest("POST", `/api/sub-communities/${selectedCommunityForMembers.id}/invites`, {
          maxUses: data.maxUses || 10,
          expiresAt: expiresAt?.toISOString(),
          role: data.role,
        });
      } else {
        // Use regular community invite endpoint
        return await apiRequest("POST", `/api/communities/${selectedCommunityForMembers.id}/invites`, {
          maxUses: data.maxUses || 10,
          expiresAt: expiresAt?.toISOString(),
        });
      }
    },
    onSuccess: (data) => {
      // Generate the invite link
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/invite/${data.code}`;
      setGeneratedInviteLink(inviteLink);
      
      toast({
        title: "Success",
        description: "Invite link created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invite link",
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


  const onMemberInviteSubmit = (data: MemberInviteFormData) => {
    createMemberInviteMutation.mutate(data);
  };

  const copyInviteLink = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
    }
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
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-transparent p-6">
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
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
            <p className="text-muted-foreground mt-2">
              {isSuperAdmin 
                ? "Manage communities, users, and platform settings"
                : "Manage your communities, collections, and members"
              }
            </p>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="communities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Communities
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
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
                    <p className="text-sm text-muted-foreground mb-4">{community.description}</p>
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
                <h2 className="text-2xl font-semibold text-foreground">User Management</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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

              <div className="bg-card rounded-lg border">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
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
                    <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
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
                        <div key={user.id} className="p-4 hover:bg-accent/50">
                          <div className="flex items-center gap-4">
                            <span className="w-8 text-sm text-muted-foreground">{index + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-sm text-muted-foreground">({user.email})</span>
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
                            <div className="w-32 text-sm text-muted-foreground">
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


        {/* Member Management Modal */}
        <Dialog open={memberModalOpen} onOpenChange={setMemberModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg pr-8">
                Manage Members - {selectedCommunityForMembers?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                    data-testid="input-member-search"
                  />
                </div>
                <Button 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setGeneratedInviteLink(null);
                    setInviteCopied(false);
                    memberInviteForm.reset();
                    setMemberInviteModalOpen(true);
                  }}
                  data-testid="button-invite-new-member"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </div>

              <div className="bg-white rounded-lg border max-h-[60vh] sm:max-h-96 overflow-y-auto">
                <div className="p-2 sm:p-4 border-b hidden sm:block">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    <span className="w-6 sm:w-8">#</span>
                    <span className="flex-1">Member</span>
                    <span className="w-20 sm:w-32">Role</span>
                    <span className="w-20 sm:w-32 hidden md:block">Joined</span>
                    <span className="w-16 sm:w-24">Actions</span>
                  </div>
                </div>
                
                {membersLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading members...</p>
                  </div>
                ) : communityMembers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
                        <div key={member.id} className="p-3 sm:p-4 hover:bg-accent/50">
                          {/* Mobile Layout */}
                          <div className="block sm:hidden space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {member.user?.firstName} {member.user?.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {member.user?.email}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                    {member.role || 'member'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Joined {new Date(member.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">{/* Actions will be added here */}</div>
                            </div>
                          </div>
                          
                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-center gap-2 sm:gap-4">
                            <span className="w-6 sm:w-8 text-xs sm:text-sm text-muted-foreground">{index + 1}</span>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-sm">
                                  {member.user?.firstName} {member.user?.lastName}
                                </span>
                                <span className="text-xs sm:text-sm text-muted-foreground">({member.user?.email})</span>
                              </div>
                            </div>
                            <div className="w-20 sm:w-32">
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
                            <div className="w-32 text-sm text-muted-foreground">
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
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

        {/* Member Invite Modal */}
        <Dialog open={memberInviteModalOpen} onOpenChange={setMemberInviteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {generatedInviteLink ? "Invite Link Created" : "Create Invite Link"}
              </DialogTitle>
            </DialogHeader>
            
            {!generatedInviteLink ? (
              <Form {...memberInviteForm}>
                <form onSubmit={memberInviteForm.handleSubmit(onMemberInviteSubmit)} className="space-y-4">
                  <FormField
                    control={memberInviteForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Role</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-invite-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={memberInviteForm.control}
                    name="maxUses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Uses (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="10"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-member-invite-max-uses"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={memberInviteForm.control}
                    name="expiresIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires After</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-invite-expires">
                              <SelectValue placeholder="Select expiry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1h">1 hour</SelectItem>
                              <SelectItem value="24h">24 hours</SelectItem>
                              <SelectItem value="7d">7 days</SelectItem>
                              <SelectItem value="30d">30 days</SelectItem>
                              <SelectItem value="never">Never</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMemberInviteModalOpen(false)}
                      data-testid="button-cancel-member-invite"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMemberInviteMutation.isPending}
                      data-testid="button-create-member-invite"
                    >
                      {createMemberInviteMutation.isPending ? (
                        <>Creating...</>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          Create Link
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="bg-accent/50 rounded-lg p-4">
                  <Label className="text-sm text-muted-foreground">Invite Link</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={generatedInviteLink}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-generated-invite-link"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyInviteLink}
                      data-testid="button-copy-invite-link"
                    >
                      {inviteCopied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Share this link with people you want to invite to {selectedCommunityForMembers?.name}. 
                  {memberInviteForm.getValues("maxUses") && (
                    <> This link can be used {memberInviteForm.getValues("maxUses")} times.</>
                  )}
                  {memberInviteForm.getValues("expiresIn") !== "never" && (
                    <> It will expire in {memberInviteForm.getValues("expiresIn")}.</>
                  )}
                </p>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedInviteLink(null);
                      memberInviteForm.reset();
                    }}
                    data-testid="button-create-another-invite"
                  >
                    Create Another
                  </Button>
                  <Button
                    onClick={() => {
                      setMemberInviteModalOpen(false);
                      setGeneratedInviteLink(null);
                    }}
                    data-testid="button-done-invite"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Collections Management Modal */}
        <Dialog open={collectionsModalOpen} onOpenChange={setCollectionsModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg pr-8">
                Manage Collections - {selectedCommunityForCollections?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search collections..."
                    value={collectionSearchTerm}
                    onChange={(e) => setCollectionSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
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
                                <div className="text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
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
                    <p className="mt-2 text-sm text-muted-foreground">Loading collections...</p>
                  </div>
                ) : communityCollections.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
                        <div key={collection.id} className="p-4 hover:bg-accent/50">
                          <div className="flex items-center gap-4">
                            <span className="w-8 text-sm text-muted-foreground">{index + 1}</span>
                            <div className="flex-1">
                              <div className="font-medium">{collection.name}</div>
                              <div className="text-sm text-muted-foreground">{collection.description}</div>
                            </div>
                            <div className="w-24">
                              <Badge variant={collection.isPublic ? "default" : "secondary"}>
                                {collection.isPublic ? "Public" : "Private"}
                              </Badge>
                            </div>
                            <div className="w-32 text-sm text-muted-foreground">
                              {collection.createdAt && new Date(collection.createdAt).toLocaleDateString()}
                            </div>
                            <div className="w-24">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCollectionMutation.mutate(collection.id)}
                                disabled={deleteCollectionMutation.isPending}
                                data-testid={`button-delete-collection-${collection.id}`}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
    </>
  );
}