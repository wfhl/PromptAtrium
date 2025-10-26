import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title: z.string().optional(),
  comment: z.string().min(20, "Review must be at least 20 characters"),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  orderId: string;
  listingId: string;
  listingTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReviewForm({ 
  orderId, 
  listingId, 
  listingTitle,
  open,
  onOpenChange,
  onSuccess
}: ReviewFormProps) {
  const { toast } = useToast();
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      title: "",
      comment: "",
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/marketplace/reviews", {
        orderId,
        listingId,
        ...data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Review Submitted!",
        description: data.message || "Your review has been posted successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/listings/${listingId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/purchases"] });
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/reviews/can-review/${listingId}`] });
      
      onOpenChange(false);
      onSuccess?.();
      form.reset();
    },
    onError: (error: any) => {
      const message = error.message || "Failed to submit review";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate(data);
  };

  const selectedRating = form.watch("rating");
  const displayRating = hoveredRating || selectedRating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with "{listingTitle}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Rating Field */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="focus:outline-none"
                          data-testid={`button-star-${star}`}
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              star <= displayRating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground self-center">
                        {displayRating > 0 && (
                          <>
                            {displayRating === 1 && "Poor"}
                            {displayRating === 2 && "Fair"}
                            {displayRating === 3 && "Good"}
                            {displayRating === 4 && "Very Good"}
                            {displayRating === 5 && "Excellent"}
                          </>
                        )}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summarize your experience"
                      {...field}
                      data-testid="input-review-title"
                    />
                  </FormControl>
                  <FormDescription>
                    Give your review a short title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment Field */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your detailed experience with this prompt..."
                      className="min-h-[120px] resize-none"
                      {...field}
                      data-testid="textarea-review-comment"
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 20 characters. Help others by sharing what worked well and what could be improved.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info about credits */}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-muted-foreground">
                🎉 You'll earn <span className="font-semibold text-foreground">10 credits</span> for submitting this review!
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitReviewMutation.isPending}
                data-testid="button-cancel-review"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitReviewMutation.isPending}
                data-testid="button-submit-review"
              >
                {submitReviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}