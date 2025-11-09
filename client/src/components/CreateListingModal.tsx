import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { Prompt, MarketplaceListing, Category, SellerProfile } from "@shared/schema";

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  editingListing?: MarketplaceListing | null;
}

const listingSchema = z.object({
  promptId: z.string().min(1, "Please select a prompt"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  acceptsMoney: z.boolean(),
  acceptsCredits: z.boolean(),
  priceCents: z.number().nullable(),
  creditPrice: z.number().nullable(),
  previewPercentage: z.number().min(10).max(50),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["draft", "active", "paused"]),
}).refine((data) => {
  if (!data.acceptsMoney && !data.acceptsCredits) {
    return false;
  }
  if (data.acceptsMoney && (!data.priceCents || data.priceCents < 100)) {
    return false;
  }
  if (data.acceptsCredits && (!data.creditPrice || data.creditPrice < 100)) {
    return false;
  }
  return true;
}, {
  message: "Please set valid pricing (minimum $1.00 or 100 credits)",
});

type ListingFormData = z.infer<typeof listingSchema>;

export function CreateListingModal({ open, onClose, editingListing }: CreateListingModalProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [tagInput, setTagInput] = useState("");
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle loading timeout
  useEffect(() => {
    if (open && !editingListing) {
      // Set a 5 second timeout for loading
      timeoutRef.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
    } else {
      // Clear timeout when modal closes or when not loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoadingTimeout(false);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, editingListing]);

  // Fetch seller profile to check onboarding status
  const { data: sellerProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ["/api/marketplace/seller/profile"],
    enabled: open,
    retry: false, // Don't retry on failure, show onboarding prompt instead
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  }) as { data: SellerProfile | undefined; isLoading: boolean; error: any };

  // Fetch user's prompts
  const { data: userPrompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ["/api/prompts", { userId: "me" }],
    enabled: open && !editingListing && !!sellerProfile && sellerProfile?.onboardingStatus === 'completed',
  }) as { data: Prompt[]; isLoading: boolean };

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: open && !!sellerProfile && sellerProfile?.onboardingStatus === 'completed',
  }) as { data: Category[]; isLoading: boolean };

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      promptId: editingListing?.promptId || "",
      title: editingListing?.title || "",
      description: editingListing?.description || "",
      acceptsMoney: editingListing?.acceptsMoney ?? true,
      acceptsCredits: editingListing?.acceptsCredits ?? true,
      priceCents: editingListing?.priceCents || 500,
      creditPrice: editingListing?.creditPrice || 500,
      previewPercentage: editingListing?.previewPercentage || 20,
      category: editingListing?.category || "",
      tags: editingListing?.tags || [],
      status: (editingListing?.status === "sold_out" ? "paused" : editingListing?.status) || "active" as "draft" | "active" | "paused",
    },
  });

  // Reset form when editing listing changes
  useEffect(() => {
    if (editingListing) {
      form.reset({
        promptId: editingListing.promptId,
        title: editingListing.title,
        description: editingListing.description || "",
        acceptsMoney: editingListing.acceptsMoney,
        acceptsCredits: editingListing.acceptsCredits,
        priceCents: editingListing.priceCents,
        creditPrice: editingListing.creditPrice,
        previewPercentage: editingListing.previewPercentage,
        category: editingListing.category || "",
        tags: editingListing.tags || [],
        status: (editingListing.status === "sold_out" ? "paused" : editingListing.status) as "draft" | "active" | "paused",
      });
    }
  }, [editingListing, form]);

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const response = await apiRequest("POST", "/api/marketplace/listings", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
      toast({ title: "Success", description: "Listing created successfully" });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create listing",
        variant: "destructive"
      });
    },
  });

  // Update listing mutation
  const updateListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const response = await apiRequest("PUT", `/api/marketplace/listings/${editingListing?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
      toast({ title: "Success", description: "Listing updated successfully" });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update listing",
        variant: "destructive"
      });
    },
  });

  const onSubmit = async (data: ListingFormData) => {
    if (editingListing) {
      await updateListingMutation.mutateAsync(data);
    } else {
      await createListingMutation.mutateAsync(data);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.watch("tags").includes(tagInput.trim())) {
      form.setValue("tags", [...form.watch("tags"), tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    form.setValue("tags", form.watch("tags").filter(t => t !== tag));
  };

  const formatPriceDisplay = (cents: number | null) => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const isSubmitting = createListingMutation.isPending || updateListingMutation.isPending;

  // Check if seller profile is not completed and not editing
  // This includes: profile doesn't exist, error fetching profile, or profile exists but onboarding incomplete
  const isOnboardingIncomplete = !editingListing && (
    profileError || 
    loadingTimeout ||
    (!profileLoading && (!sellerProfile || sellerProfile?.onboardingStatus !== 'completed'))
  );

  // Show loading only if not timed out
  const showLoading = profileLoading && !loadingTimeout && !editingListing;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingListing ? "Edit Listing" : "Create Marketplace Listing"}
          </DialogTitle>
          <DialogDescription>
            {showLoading
              ? "Loading seller profile..."
              : isOnboardingIncomplete 
                ? "You need to complete seller onboarding before creating listings"
                : "List your prompt for sale in the marketplace with flexible pricing options"}
          </DialogDescription>
        </DialogHeader>

        {/* Show loading state */}
        {showLoading ? (
          <div className="flex flex-col justify-center items-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading seller profile...</p>
          </div>
        ) : /* Show alert if onboarding is incomplete or timeout */
        (isOnboardingIncomplete || loadingTimeout) ? (
          <>
            <Alert className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/20 dark:border-yellow-500/30">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertTitle>Complete Seller Profile Required</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Before you can create marketplace listings, you need to complete your seller profile. This includes:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Business type (Individual or Business)</li>
                  <li>Tax information for compliance</li>
                  <li>Stripe Connect account for payment processing</li>
                </ul>
                <p className="mt-2">Click below to complete your seller onboarding.</p>
              </AlertDescription>
            </Alert>
            
            <DialogFooter className="flex justify-center">
              <Button onClick={() => {
                onClose();
                navigate("/seller-dashboard");
              }} data-testid="button-go-to-onboarding">
                Go to Seller Dashboard
              </Button>
              <Button variant="outline" onClick={onClose} data-testid="button-cancel">
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Prompt Selection (only for new listings) */}
            {!editingListing && (
              <FormField
                control={form.control}
                name="promptId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Prompt</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-prompt">
                          <SelectValue placeholder="Choose a prompt to list" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {promptsLoading ? (
                          <div className="p-2 text-center">Loading prompts...</div>
                        ) : userPrompts.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            No prompts available to list
                          </div>
                        ) : (
                          userPrompts.map((prompt) => (
                            <SelectItem key={prompt.id} value={prompt.id}>
                              {prompt.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Listing Title</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Eye-catching title for your listing" 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormDescription>
                    This will be shown in the marketplace
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe what makes your prompt valuable..."
                      className="min-h-[100px]"
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Pricing Options</h3>
              
              {/* Accept Money */}
              <FormField
                control={form.control}
                name="acceptsMoney"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Accept USD Payments</FormLabel>
                      <FormDescription>Allow purchases with money</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-accept-money"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("acceptsMoney") && (
                <FormField
                  control={form.control}
                  name="priceCents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>USD Price</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number"
                            min="100"
                            step="50"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-price-cents"
                          />
                          <span className="text-muted-foreground">cents</span>
                          <span className="font-medium">
                            = {formatPriceDisplay(field.value)}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>Minimum $1.00 (100 cents)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Accept Credits */}
              <FormField
                control={form.control}
                name="acceptsCredits"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Accept Credits</FormLabel>
                      <FormDescription>Allow purchases with credits</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-accept-credits"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("acceptsCredits") && (
                <FormField
                  control={form.control}
                  name="creditPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Price</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number"
                            min="100"
                            step="50"
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-credit-price"
                          />
                          <span className="text-muted-foreground">credits</span>
                        </div>
                      </FormControl>
                      <FormDescription>Minimum 100 credits</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Preview Percentage */}
            <FormField
              control={form.control}
              name="previewPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview Percentage: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      min={10}
                      max={50}
                      step={5}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value)}
                      className="w-full"
                      data-testid="slider-preview"
                    />
                  </FormControl>
                  <FormDescription>
                    How much of the prompt buyers can see before purchasing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                          placeholder="Add a tag..."
                          data-testid="input-tag"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddTag}
                          data-testid="button-add-tag"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer">
                            {tag}
                            <X 
                              className="ml-1 h-3 w-3" 
                              onClick={() => handleRemoveTag(tag)}
                              data-testid={`button-remove-tag-${tag}`}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Save as Draft</SelectItem>
                      <SelectItem value="active">Publish Immediately</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can change this later
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingListing ? "Update Listing" : "Create Listing"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}