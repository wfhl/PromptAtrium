import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { MarketplaceListingCard } from "@/components/MarketplaceListingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ShoppingCart,
  DollarSign,
  Coins,
  Star,
  Eye,
  Lock,
  TrendingUp,
  Package,
  User,
  Calendar,
  Shield,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ListingDetail() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const listingId = params.id;
  
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"money" | "credits" | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Fetch listing details
  const { data: listing, isLoading: listingLoading } = useQuery({
    queryKey: [`/api/marketplace/listings/${listingId}`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings/${listingId}`);
      if (!response.ok) throw new Error("Failed to fetch listing");
      return response.json();
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch similar listings
  const { data: similarListings = [], isLoading: similarLoading } = useQuery({
    queryKey: [`/api/marketplace/listings/${listingId}/similar`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings/${listingId}/similar`);
      if (!response.ok) throw new Error("Failed to fetch similar listings");
      return response.json();
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });

  // Placeholder purchase mutation (will be implemented in payment flow)
  const purchaseMutation = useMutation({
    mutationFn: async (paymentMethod: "money" | "credits") => {
      // This will be implemented in the payment flow task
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: false, message: "Purchase flow not yet implemented" });
        }, 1000);
      });
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "Purchase Successful!",
          description: "You now have access to the full prompt",
        });
        setPurchaseDialogOpen(false);
      } else {
        toast({
          title: "Purchase Coming Soon",
          description: data.message || "The purchase flow will be implemented soon",
          variant: "default",
        });
      }
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase",
        variant: "destructive",
      });
    },
  });

  // Handle prompt copy (for preview)
  const handleCopyPreview = () => {
    if (listing?.promptPreview) {
      navigator.clipboard.writeText(listing.promptPreview);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
      toast({
        title: "Preview Copied",
        description: "The preview has been copied to your clipboard",
      });
    }
  };

  // Handle purchase dialog
  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase this listing",
        variant: "destructive",
      });
      return;
    }
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedPaymentMethod) {
      purchaseMutation.mutate(selectedPaymentMethod);
    }
  };

  // Format price display
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
  };

  // Loading state
  if (listingLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Listing Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The listing you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/marketplace">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const sellerName = listing.seller?.username ||
    (listing.seller?.firstName && listing.seller?.lastName
      ? `${listing.seller.firstName} ${listing.seller.lastName}`
      : 'Anonymous Seller');

  const isOwnListing = user && listing.sellerId === (user as any).id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/marketplace">
        <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Listing Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
                  <div className="flex flex-wrap gap-2 items-center">
                    {listing.category && (
                      <Badge variant="outline">{listing.category}</Badge>
                    )}
                    {listing.salesCount > 0 && (
                      <Badge variant="secondary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {listing.salesCount} sold
                      </Badge>
                    )}
                    {listing.averageRating && parseFloat(listing.averageRating) > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm">{parseFloat(listing.averageRating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {isOwnListing && (
                  <Badge variant="default">Your Listing</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prompt Image */}
              {listing.prompt?.imageUrl && (
                <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                  <img
                    src={listing.prompt.imageUrl}
                    alt={listing.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              {/* Description */}
              {listing.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Prompt Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Prompt Preview</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      {listing.previewPercentage}% preview
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPreview}
                      data-testid="button-copy-preview"
                    >
                      {copiedPrompt ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="pt-6">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {listing.promptPreview || "Loading preview..."}
                      {listing.promptPreview && listing.promptPreview.length > 50 && (
                        <span className="text-muted-foreground">...</span>
                      )}
                    </pre>
                  </CardContent>
                  <CardFooter className="bg-amber-50 dark:bg-amber-950 border-t border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-600" />
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Purchase to unlock the full prompt
                      </p>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Preview Progress Indicator */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Preview Coverage</span>
                  <span className="font-medium">{listing.previewPercentage}%</span>
                </div>
                <Progress value={listing.previewPercentage} className="h-2" />
              </div>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Listed {new Date(listing.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Buyer Protection
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Similar Listings */}
          {similarListings.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Similar Listings</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {similarListings.map((similar: any) => (
                  <MarketplaceListingCard key={similar.id} listing={similar} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Purchase Card */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prices */}
              <div className="space-y-3">
                {listing.acceptsMoney && listing.priceCents && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium">USD Price</span>
                    </div>
                    <span className="text-xl font-bold">{formatPrice(listing.priceCents)}</span>
                  </div>
                )}
                {listing.acceptsCredits && listing.creditPrice && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Credit Price</span>
                    </div>
                    <span className="text-xl font-bold">{formatCredits(listing.creditPrice)}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="font-medium">{listing.salesCount || 0}</span>
                </div>
                {listing.averageRating && parseFloat(listing.averageRating) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{parseFloat(listing.averageRating).toFixed(1)}/5.0</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePurchase}
                disabled={isOwnListing || purchaseMutation.isPending}
                data-testid="button-buy-now"
              >
                {isOwnListing ? (
                  <>This is your listing</>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Buy Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Seller Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/user/${listing.seller?.username || listing.seller?.id}`}>
                <div className="flex items-center gap-3 hover:bg-accent rounded-lg p-2 -m-2 transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={listing.seller?.profileImageUrl} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{sellerName}</p>
                    {listing.sellerProfile?.totalSales > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {listing.sellerProfile.totalSales} total sales
                      </p>
                    )}
                  </div>
                </div>
              </Link>
              
              {listing.seller?.bio && (
                <p className="text-sm text-muted-foreground">
                  {listing.seller.bio}
                </p>
              )}

              {listing.sellerProfile && (
                <div className="space-y-2 pt-2 border-t">
                  {listing.sellerProfile.averageRating && parseFloat(listing.sellerProfile.averageRating) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Seller Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span>{parseFloat(listing.sellerProfile.averageRating).toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  {listing.sellerProfile.onboardingStatus === 'completed' && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Verified Seller</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              All purchases are protected by our buyer guarantee. You'll receive the full prompt immediately after purchase.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method for "{listing.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {listing.acceptsMoney && listing.priceCents && (
              <label
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPaymentMethod === "money" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="money"
                    checked={selectedPaymentMethod === "money"}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as "money")}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-medium">Pay with Card</p>
                    <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
                  </div>
                </div>
                <span className="text-lg font-bold">{formatPrice(listing.priceCents)}</span>
              </label>
            )}

            {listing.acceptsCredits && listing.creditPrice && (
              <label
                className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedPaymentMethod === "credits" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="credits"
                    checked={selectedPaymentMethod === "credits"}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value as "credits")}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-medium">Pay with Credits</p>
                    <p className="text-sm text-muted-foreground">Use your account credits</p>
                  </div>
                </div>
                <span className="text-lg font-bold">{formatCredits(listing.creditPrice)} credits</span>
              </label>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmPurchase}
              disabled={!selectedPaymentMethod || purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}