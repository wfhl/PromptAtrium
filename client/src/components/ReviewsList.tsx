import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Star, ThumbsUp, CheckCircle, User, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  orderId: string;
  listingId: string;
  reviewerId: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  sellerResponse?: string;
  sellerRespondedAt?: string;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface ReviewsListProps {
  listingId: string;
  showSortOptions?: boolean;
  limit?: number;
}

export function ReviewsList({ listingId, showSortOptions = true, limit = 20 }: ReviewsListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [offset, setOffset] = useState(0);

  // Fetch reviews
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: [`/api/marketplace/listings/${listingId}/reviews`, { sortBy, limit, offset }],
    queryFn: async () => {
      const response = await fetch(
        `/api/marketplace/listings/${listingId}/reviews?sortBy=${sortBy}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!listingId,
  });

  // Mark review as helpful mutation
  const markHelpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiRequest("PUT", `/api/marketplace/reviews/${reviewId}/helpful`, {});
      return response.json();
    },
    onSuccess: (_, reviewId) => {
      toast({
        title: "Thanks for your feedback!",
        description: "Your feedback helps other buyers.",
      });
      
      // Optimistically update the helpful count
      queryClient.setQueryData(
        [`/api/marketplace/listings/${listingId}/reviews`, { sortBy, limit, offset }],
        (oldData: Review[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(review => 
            review.id === reviewId 
              ? { ...review, helpfulCount: review.helpfulCount + 1 }
              : review
          );
        }
      );
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark review as helpful",
        variant: "destructive",
      });
    },
  });

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-500 text-yellow-500"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  // Get reviewer display name
  const getReviewerName = (reviewer: Review['reviewer']) => {
    if (reviewer.username) return reviewer.username;
    if (reviewer.firstName || reviewer.lastName) {
      return `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim();
    }
    return "Anonymous";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load reviews</p>
        </CardContent>
      </Card>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      {showSortOptions && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort-reviews">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
              <SelectItem value="helpful">Most Helpful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reviews */}
      {reviews.map((review: Review) => (
        <Card key={review.id} data-testid={`review-card-${review.id}`}>
          <CardContent className="p-4 space-y-3">
            {/* Reviewer Info and Rating */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.reviewer.profileImageUrl} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getReviewerName(review.reviewer)}</span>
                    {review.verifiedPurchase && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Review Title */}
            {review.title && (
              <h4 className="font-semibold">{review.title}</h4>
            )}

            {/* Review Comment */}
            <p className="text-sm leading-relaxed">{review.comment}</p>

            {/* Seller Response */}
            {review.sellerResponse && (
              <div className="rounded-lg bg-muted p-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">Seller Response</span>
                  {review.sellerRespondedAt && (
                    <span className="text-xs text-muted-foreground">
                      • {formatDistanceToNow(new Date(review.sellerRespondedAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="text-sm">{review.sellerResponse}</p>
              </div>
            )}

            {/* Helpful Button */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markHelpfulMutation.mutate(review.id)}
                disabled={!user || markHelpfulMutation.isPending}
                className="gap-1"
                data-testid={`button-helpful-${review.id}`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Helpful</span>
                {review.helpfulCount > 0 && (
                  <span className="ml-1">({review.helpfulCount})</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load More Button */}
      {reviews.length >= limit && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setOffset(offset + limit)}
            data-testid="button-load-more-reviews"
          >
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  );
}