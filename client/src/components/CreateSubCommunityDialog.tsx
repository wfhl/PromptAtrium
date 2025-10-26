import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Users, AlertCircle, Loader2, Check } from "lucide-react";
import type { Community } from "@shared/schema";

const createSubCommunitySchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters"),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be less than 30 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type CreateSubCommunityFormValues = z.infer<typeof createSubCommunitySchema>;

interface CreateSubCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentCommunity: Community;
}

export function CreateSubCommunityDialog({
  open,
  onOpenChange,
  parentCommunity
}: CreateSubCommunityDialogProps) {
  const { toast } = useToast();
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const form = useForm<CreateSubCommunityFormValues>({
    resolver: zodResolver(createSubCommunitySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  // Check if slug is unique
  const checkSlugAvailability = async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    setSlugError(null);
    
    try {
      // Check all communities to ensure slug uniqueness
      const response = await fetch("/api/communities");
      const communities: Community[] = await response.json();
      
      const slugExists = communities.some(c => c.slug === slug);
      setSlugAvailable(!slugExists);
      
      if (slugExists) {
        setSlugError("This slug is already taken");
      }
    } catch (error) {
      console.error("Error checking slug:", error);
      setSlugError("Failed to check slug availability");
      setSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Create sub-community mutation
  const createMutation = useMutation({
    mutationFn: async (values: CreateSubCommunityFormValues) => {
      const response = await apiRequest(
        "POST",
        `/api/communities/${parentCommunity.id}/sub-communities`,
        values
      );
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/communities/${parentCommunity.id}/sub-communities`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/communities"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/user/sub-communities"] 
      });
      
      toast({
        title: "Sub-community created",
        description: `${data.name} has been created successfully`,
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create sub-community",
        description: error.message || "An error occurred while creating the sub-community",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateSubCommunityFormValues) => {
    if (!slugAvailable) {
      form.setError("slug", {
        type: "manual",
        message: "Please use an available slug",
      });
      return;
    }
    createMutation.mutate(values);
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    
    form.setValue("slug", slug);
    if (slug.length >= 3) {
      checkSlugAvailability(slug);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        data-testid="create-sub-community-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Sub-Community
          </DialogTitle>
          <DialogDescription>
            Create a new sub-community under <strong>{parentCommunity.name}</strong>
          </DialogDescription>
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
                      placeholder="e.g., Advanced Users" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Auto-generate slug if slug field is empty or matches previous auto-generated value
                        const currentSlug = form.getValues("slug");
                        if (!currentSlug || currentSlug === field.value.toLowerCase().replace(/\s+/g, '-').substring(0, 30)) {
                          generateSlug(e.target.value);
                        }
                      }}
                      data-testid="input-sub-community-name"
                    />
                  </FormControl>
                  <FormDescription>
                    The display name for your sub-community
                  </FormDescription>
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
                    <div className="relative">
                      <Input 
                        placeholder="e.g., advanced-users" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          checkSlugAvailability(e.target.value);
                        }}
                        className={slugError ? "pr-8" : ""}
                        data-testid="input-sub-community-slug"
                      />
                      {isCheckingSlug && (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      {!isCheckingSlug && slugAvailable === true && (
                        <Check className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                      )}
                      {!isCheckingSlug && slugAvailable === false && (
                        <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                  </FormDescription>
                  {slugError && (
                    <p className="text-sm text-destructive">{slugError}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose of this sub-community..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      data-testid="textarea-sub-community-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Help members understand what this sub-community is about
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(createMutation.error as any).message || "Failed to create sub-community"}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSlugAvailable(null);
                  setSlugError(null);
                  onOpenChange(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || isCheckingSlug || !slugAvailable}
                data-testid="button-create-sub-community"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Create Sub-Community
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}