import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, Loader2, Lock, Globe } from "lucide-react";
import type { Collection, Prompt } from "@shared/schema";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt;
}

const newCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

type NewCollectionFormData = z.infer<typeof newCollectionSchema>;

export function AddToCollectionDialog({
  open,
  onOpenChange,
  prompt,
}: AddToCollectionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const form = useForm<NewCollectionFormData>({
    resolver: zodResolver(newCollectionSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  // Fetch user's collections
  const { data: collections = [], isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: open && !!user,
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setShowCreateNew(false);
      setSelectedCollectionId(null);
      form.reset();
    } else if (prompt.collectionId) {
      setSelectedCollectionId(prompt.collectionId);
    }
  }, [open, prompt.collectionId, form]);

  // Create new collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (data: NewCollectionFormData) => {
      return await apiRequest("POST", "/api/collections", {
        ...data,
        type: "user",
      });
    },
    onSuccess: async (newCollection) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      
      // Now add the prompt to the new collection
      const data = await newCollection.json();
      await updatePromptMutation.mutateAsync(data.id);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  // Update prompt's collection mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (collectionId: string | null) => {
      return await apiRequest("PATCH", `/api/prompts/${prompt.id}`, {
        collectionId: collectionId === "none" ? null : collectionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/prompts/${prompt.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      
      toast({
        title: "Success",
        description: selectedCollectionId === "none" 
          ? "Prompt removed from collection"
          : showCreateNew 
            ? "Collection created and prompt added successfully"
            : "Prompt added to collection successfully",
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update prompt",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: NewCollectionFormData) => {
    await createCollectionMutation.mutateAsync(data);
  };

  const handleAddToCollection = () => {
    if (!selectedCollectionId) {
      toast({
        title: "Error",
        description: "Please select a collection",
        variant: "destructive",
      });
      return;
    }
    
    updatePromptMutation.mutate(selectedCollectionId);
  };

  const isLoading = createCollectionMutation.isPending || updatePromptMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {showCreateNew ? "Create New Collection" : "Add to Collection"}
          </DialogTitle>
          <DialogDescription>
            {showCreateNew 
              ? "Create a new collection and add this prompt to it"
              : `Select a collection for "${prompt.name}"`}
          </DialogDescription>
        </DialogHeader>

        {!showCreateNew ? (
          <div className="space-y-4">
            {collectionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have any collections yet
                </p>
                <Button
                  onClick={() => setShowCreateNew(true)}
                  variant="outline"
                  className="w-full"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Your First Collection
                </Button>
              </div>
            ) : (
              <>
                <RadioGroup
                  value={selectedCollectionId || ""}
                  onValueChange={setSelectedCollectionId}
                >
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {/* Option to remove from collection */}
                    {prompt.collectionId && (
                      <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent">
                        <RadioGroupItem value="none" id="collection-none" />
                        <Label
                          htmlFor="collection-none"
                          className="flex-1 cursor-pointer space-y-1"
                        >
                          <div className="text-sm font-medium">No Collection</div>
                          <div className="text-xs text-muted-foreground">
                            Remove from current collection
                          </div>
                        </Label>
                      </div>
                    )}
                    
                    {collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent"
                      >
                        <RadioGroupItem value={collection.id} id={`collection-${collection.id}`} />
                        <Label
                          htmlFor={`collection-${collection.id}`}
                          className="flex-1 cursor-pointer space-y-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{collection.name}</span>
                            {collection.isPublic ? (
                              <Globe className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          {collection.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {collection.description}
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowCreateNew(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create New Collection
                  </Button>
                  <Button
                    onClick={handleAddToCollection}
                    disabled={!selectedCollectionId || isLoading}
                    className="flex-1"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {prompt.collectionId ? "Move to Collection" : "Add to Collection"}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Nature Photography, Character Designs"
                        {...field}
                        data-testid="input-collection-name"
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this collection is for..."
                        className="resize-none h-20"
                        {...field}
                        data-testid="textarea-collection-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Collection</FormLabel>
                      <FormDescription>
                        Make this collection visible to other users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-collection-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateNew(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create & Add Prompt
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}