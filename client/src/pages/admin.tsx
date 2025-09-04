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
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Users, Shield, Crown, Folder } from "lucide-react";
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

type CommunityFormData = z.infer<typeof communitySchema>;

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [communityModalOpen, setCommunityModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Check if user is admin (super admin or community admin)
  if (!authLoading && (!user || !["super_admin", "community_admin"].includes(user.role))) {
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

  const isSuperAdmin = user?.role === "super_admin";
  const isCommunityAdmin = user?.role === "community_admin";

  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
    },
  });

  // Fetch communities (all for super admin, managed ones for community admin)
  const { data: communities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: isSuperAdmin ? ["/api/communities"] : ["/api/communities/managed"],
    queryFn: async () => {
      const endpoint = isSuperAdmin ? "/api/communities" : "/api/communities/managed";
      return await apiRequest(endpoint);
    },
  });

  // Fetch users (for user management)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // Note: This endpoint would need to be created for user management
      return [];
    },
    enabled: false, // Disable for now since endpoint doesn't exist yet
  });

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: async (data: CommunityFormData) => {
      return await apiRequest("/api/communities", {
        method: "POST",
        body: JSON.stringify(data),
      });
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
      return await apiRequest(`/api/communities/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
      return await apiRequest(`/api/communities/${id}`, {
        method: "DELETE",
      });
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

  const onSubmit = (data: CommunityFormData) => {
    if (selectedCommunity) {
      updateCommunityMutation.mutate({ id: selectedCommunity.id, data });
    } else {
      createCommunityMutation.mutate(data);
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
    <div className="min-h-screen bg-gray-50 p-6">
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

        {/* Communities Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
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
                  <div className="flex items-center gap-2">
                    {isSuperAdmin ? (
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
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-manage-members-${community.id}`}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Members
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-manage-collections-${community.id}`}
                        >
                          <Folder className="h-4 w-4 mr-1" />
                          Collections
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  );
}