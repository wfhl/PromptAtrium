import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, TrendingUp, Package, Star, MoreVertical, Plus, Edit, Pause, Play, Trash, CheckCircle, AlertCircle } from "lucide-react";
import { CreateListingModal } from "@/components/CreateListingModal";
import type { MarketplaceListing, SellerProfile } from "@shared/schema";

// Onboarding form validation schema
const onboardingSchema = z.object({
  businessType: z.enum(["individual", "business"]),
  taxId: z.string().optional(),
  vatNumber: z.string().optional(),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  payoutMethod: z.enum(["stripe", "manual"]),
}).refine((data) => {
  // At least one tax field should be provided
  return data.taxId || data.vatNumber || data.businessName || data.businessAddress;
}, {
  message: "At least one tax information field is required",
  path: ["taxId"], // Show error on first tax field
});

export default function SellerDashboard() {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);

  // Fetch seller profile
  const { data: sellerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/marketplace/seller/profile"],
  }) as { data: SellerProfile | undefined; isLoading: boolean };

  // Fetch user's listings
  const { data: myListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/marketplace/my-listings"],
  }) as { data: MarketplaceListing[]; isLoading: boolean };

  // Update listing mutation
  const updateListingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MarketplaceListing> }) => {
      const response = await apiRequest("PUT", `/api/marketplace/listings/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-listings"] });
      toast({ title: "Success", description: "Listing updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update listing",
        variant: "destructive"
      });
    },
  });

  // Delete listing mutation
  const deleteListingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/marketplace/listings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-listings"] });
      toast({ title: "Success", description: "Listing deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete listing",
        variant: "destructive"
      });
    },
  });

  // Onboarding form
  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessType: "individual",
      taxId: "",
      vatNumber: "",
      businessName: "",
      businessAddress: "",
      payoutMethod: "stripe",
    },
  });

  // Seller onboarding mutation
  const onboardingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof onboardingSchema>) => {
      const response = await apiRequest("POST", "/api/marketplace/seller/onboard", {
        businessType: data.businessType,
        taxInfo: {
          taxId: data.taxId || undefined,
          vatNumber: data.vatNumber || undefined,
          businessName: data.businessName || undefined,
          businessAddress: data.businessAddress || undefined,
        },
        payoutMethod: data.payoutMethod,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/seller/profile"] });
      toast({ 
        title: "Success", 
        description: "Seller profile completed successfully! You can now create listings.",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to complete seller onboarding",
        variant: "destructive"
      });
    },
  });

  const handleOnboardingSubmit = async (data: z.infer<typeof onboardingSchema>) => {
    await onboardingMutation.mutateAsync(data);
  };

  const handleToggleStatus = async (listing: MarketplaceListing) => {
    const newStatus = listing.status === "active" ? "paused" : "active";
    await updateListingMutation.mutateAsync({ 
      id: listing.id, 
      data: { status: newStatus } 
    });
  };

  const formatPrice = (cents: number | null | undefined) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatCredits = (credits: number | null | undefined) => {
    if (!credits) return null;
    return `${credits.toLocaleString()} credits`;
  };

  const activeListings = myListings.filter(l => l.status === "active");
  const pausedListings = myListings.filter(l => l.status === "paused");
  const draftListings = myListings.filter(l => l.status === "draft");

  if (profileLoading || listingsLoading) {
    return <div>Loading...</div>;
  }

  // Show onboarding form if profile is not completed
  if (sellerProfile && sellerProfile.onboardingStatus !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Complete Seller Onboarding
            </CardTitle>
            <CardDescription>
              Please complete your seller profile to start creating marketplace listings.
              This information is required for tax compliance and payment processing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleOnboardingSubmit)} className="space-y-6">
                {/* Business Type */}
                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-business-type">
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select whether you're selling as an individual or a business entity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Tax Information</h3>
                  <p className="text-xs text-muted-foreground">
                    Please provide at least one tax identification field
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter tax ID" data-testid="input-tax-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter VAT number" data-testid="input-vat-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter business name" data-testid="input-business-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter business address" data-testid="input-business-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Payout Method */}
                <FormField
                  control={form.control}
                  name="payoutMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payout Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payout-method">
                            <SelectValue placeholder="Select payout method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stripe">Stripe (Automated)</SelectItem>
                          <SelectItem value="manual">Manual (Invoice-based)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how you'd like to receive payments for your sales
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={onboardingMutation.isPending}
                  data-testid="button-complete-onboarding"
                >
                  {onboardingMutation.isPending ? (
                    "Completing Onboarding..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Onboarding
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
        <p className="text-muted-foreground">Manage your marketplace listings and track your sales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sales">
              {sellerProfile?.totalSales || 0}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-revenue-usd">
              {formatPrice(sellerProfile?.totalRevenueCents) || "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Total earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-credits-earned">
              {sellerProfile?.totalCreditsEarned?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">From sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-average-rating">
              {sellerProfile?.averageRating || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">From buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Listings ({myListings.length})</h2>
        <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-listing">
          <Plus className="h-4 w-4 mr-2" />
          Create Listing
        </Button>
      </div>

      {/* Listings Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({activeListings.length})
          </TabsTrigger>
          <TabsTrigger value="paused" data-testid="tab-paused">
            Paused ({pausedListings.length})
          </TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">
            Drafts ({draftListings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeListings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No active listings</p>
              </CardContent>
            </Card>
          ) : (
            activeListings.map((listing) => (
              <Card key={listing.id} data-testid={`card-listing-${listing.id}`}>
                <CardContent className="flex justify-between items-center py-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{listing.description}</p>
                    <div className="flex gap-4 text-sm">
                      {listing.acceptsMoney && listing.priceCents && (
                        <span>💵 {formatPrice(listing.priceCents)}</span>
                      )}
                      {listing.acceptsCredits && listing.creditPrice && (
                        <span>✨ {formatCredits(listing.creditPrice)}</span>
                      )}
                      <span>📊 {listing.salesCount} sales</span>
                      {listing.averageRating && (
                        <span>⭐ {listing.averageRating}</span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-menu-${listing.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setEditingListing(listing)}
                        data-testid={`menu-edit-${listing.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(listing)}
                        data-testid={`menu-pause-${listing.id}`}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteListingMutation.mutate(listing.id)}
                        className="text-destructive"
                        data-testid={`menu-delete-${listing.id}`}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          {pausedListings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No paused listings</p>
              </CardContent>
            </Card>
          ) : (
            pausedListings.map((listing) => (
              <Card key={listing.id} data-testid={`card-listing-${listing.id}`}>
                <CardContent className="flex justify-between items-center py-4">
                  <div className="flex-1 opacity-60">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{listing.description}</p>
                    <div className="flex gap-4 text-sm">
                      {listing.acceptsMoney && listing.priceCents && (
                        <span>💵 {formatPrice(listing.priceCents)}</span>
                      )}
                      {listing.acceptsCredits && listing.creditPrice && (
                        <span>✨ {formatCredits(listing.creditPrice)}</span>
                      )}
                      <Badge variant="secondary">Paused</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-menu-${listing.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(listing)}
                        data-testid={`menu-activate-${listing.id}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setEditingListing(listing)}
                        data-testid={`menu-edit-${listing.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteListingMutation.mutate(listing.id)}
                        className="text-destructive"
                        data-testid={`menu-delete-${listing.id}`}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftListings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No draft listings</p>
              </CardContent>
            </Card>
          ) : (
            draftListings.map((listing) => (
              <Card key={listing.id} data-testid={`card-listing-${listing.id}`}>
                <CardContent className="flex justify-between items-center py-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{listing.description}</p>
                    <div className="flex gap-4 text-sm">
                      {listing.acceptsMoney && listing.priceCents && (
                        <span>💵 {formatPrice(listing.priceCents)}</span>
                      )}
                      {listing.acceptsCredits && listing.creditPrice && (
                        <span>✨ {formatCredits(listing.creditPrice)}</span>
                      )}
                      <Badge variant="outline">Draft</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-menu-${listing.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setEditingListing(listing)}
                        data-testid={`menu-edit-${listing.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit & Publish
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteListingMutation.mutate(listing.id)}
                        className="text-destructive"
                        data-testid={`menu-delete-${listing.id}`}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Listing Modal */}
      <CreateListingModal 
        open={showCreateModal || !!editingListing}
        onClose={() => {
          setShowCreateModal(false);
          setEditingListing(null);
        }}
        editingListing={editingListing}
      />
    </div>
  );
}