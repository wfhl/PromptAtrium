import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import type { MarketplaceOrder } from "@shared/schema";

const disputeFormSchema = z.object({
  reason: z.enum(["item_not_as_described", "quality_issue", "not_received", "other"]),
  description: z.string().min(20, "Please provide at least 20 characters describing the issue"),
});

type DisputeFormData = z.infer<typeof disputeFormSchema>;

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: MarketplaceOrder & { listingTitle?: string };
  onSuccess?: () => void;
}

export function DisputeModal({ isOpen, onClose, order, onSuccess }: DisputeModalProps) {
  const { toast } = useToast();
  
  const form = useForm<DisputeFormData>({
    resolver: zodResolver(disputeFormSchema),
    defaultValues: {
      reason: "item_not_as_described",
      description: "",
    },
  });
  
  const createDisputeMutation = useMutation({
    mutationFn: (data: DisputeFormData) => 
      apiRequest("/api/marketplace/disputes", "POST", {
        orderId: order.id,
        reason: data.reason,
        description: data.description,
      }),
    onSuccess: () => {
      toast({
        title: "Dispute Created",
        description: "Your dispute has been submitted. The seller will be notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/orders/buyer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/disputes"] });
      form.reset();
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create dispute",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (data: DisputeFormData) => {
    createDisputeMutation.mutate(data);
  };
  
  const reasonLabels = {
    item_not_as_described: "Item Not As Described",
    quality_issue: "Quality Issue",
    not_received: "Not Received",
    other: "Other",
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Open Dispute</DialogTitle>
          <DialogDescription>
            Report an issue with order #{order.orderNumber}
            {order.listingTitle && (
              <span className="block mt-1 font-medium">
                {order.listingTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm">
            Please try to resolve the issue directly with the seller first. 
            Disputes should be used as a last resort when communication fails.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Dispute</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-dispute-reason">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reasonLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {...field}
                      rows={5}
                      placeholder="Please describe the issue in detail. Include what happened, what you expected, and any attempts to resolve it with the seller."
                      className="resize-none"
                      data-testid="textarea-dispute-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Provide specific details about the problem (minimum 20 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createDisputeMutation.isPending}
                data-testid="button-cancel-dispute"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDisputeMutation.isPending}
                data-testid="button-submit-dispute"
              >
                {createDisputeMutation.isPending ? "Creating..." : "Create Dispute"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}