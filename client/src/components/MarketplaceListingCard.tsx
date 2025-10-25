import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Eye, DollarSign, Coins, ShoppingCart, Star, TrendingUp, User } from "lucide-react";

interface MarketplaceListingCardProps {
  listing: {
    id: string;
    title: string;
    description?: string;
    priceCents?: number;
    creditPrice?: number;
    acceptsMoney: boolean;
    acceptsCredits: boolean;
    previewPercentage: number;
    tags?: string[];
    category?: string;
    salesCount: number;
    averageRating?: string;
    promptPreview?: string;
    prompt: {
      id: string;
      name: string;
      description?: string;
      imageUrl?: string;
      tags?: string[];
    };
    seller: {
      id: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  };
}

export function MarketplaceListingCard({ listing }: MarketplaceListingCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [promptPreview, setPromptPreview] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Format price display
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatCredits = (credits: number) => {
    return credits.toLocaleString();
  };

  // Get seller display name
  const sellerName = listing.seller.username || 
    (listing.seller.firstName && listing.seller.lastName 
      ? `${listing.seller.firstName} ${listing.seller.lastName}` 
      : 'Anonymous Seller');

  // Handle preview
  const handlePreview = async () => {
    setLoadingPreview(true);
    setPreviewOpen(true);
    
    try {
      const response = await fetch(`/api/marketplace/listings/${listing.id}`);
      if (response.ok) {
        const data = await response.json();
        setPromptPreview(data.promptPreview || "Preview not available");
      } else {
        setPromptPreview("Failed to load preview");
      }
    } catch (error) {
      setPromptPreview("Error loading preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        {/* Image Section */}
        {listing.prompt.imageUrl && (
          <div className="aspect-video relative overflow-hidden bg-muted">
            <img 
              src={listing.prompt.imageUrl} 
              alt={listing.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
            {listing.salesCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {listing.salesCount} sold
              </Badge>
            )}
          </div>
        )}

        <CardContent className="flex-1 p-4">
          {/* Title and Category */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg line-clamp-2 mb-1">
              {listing.title}
            </h3>
            {listing.category && (
              <Badge variant="outline" className="text-xs">
                {listing.category}
              </Badge>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {listing.description}
            </p>
          )}

          {/* Seller Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={listing.seller.profileImageUrl} />
              <AvatarFallback>
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <Link href={`/user/${listing.seller.username || listing.seller.id}`}>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {sellerName}
              </span>
            </Link>
          </div>

          {/* Price Section */}
          <div className="space-y-2">
            {listing.acceptsMoney && listing.priceCents && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold text-lg">{formatPrice(listing.priceCents)}</span>
              </div>
            )}
            {listing.acceptsCredits && listing.creditPrice && (
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-600" />
                <span className="font-bold text-lg">{formatCredits(listing.creditPrice)} credits</span>
              </div>
            )}
          </div>

          {/* Rating */}
          {listing.averageRating && parseFloat(listing.averageRating) > 0 && (
            <div className="flex items-center gap-1 mt-3">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">{parseFloat(listing.averageRating).toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">
                ({listing.salesCount} reviews)
              </span>
            </div>
          )}

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {listing.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {listing.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{listing.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={handlePreview}
            data-testid={`button-preview-${listing.id}`}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Link href={`/marketplace/listing/${listing.id}`} className="flex-1">
            <Button 
              size="sm"
              className="w-full"
              data-testid={`button-view-details-${listing.id}`}
            >
              View Details
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prompt Preview</DialogTitle>
            <DialogDescription>
              This is a {listing.previewPercentage}% preview of the full prompt
            </DialogDescription>
          </DialogHeader>
          
          <Separator />
          
          <div className="space-y-4 py-4">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {promptPreview}
                    {promptPreview && promptPreview.length > 50 && "..."}
                  </pre>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <ShoppingCart className="inline h-4 w-4 mr-1" />
                    Purchase this listing to see the full prompt content
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                    Close
                  </Button>
                  <Link href={`/marketplace/listing/${listing.id}`}>
                    <Button>
                      View Full Details
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}