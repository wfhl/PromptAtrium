import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Save, 
  Trash2, 
  AlertTriangle,
  Globe,
  Lock,
  Image
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Community } from "@shared/schema";

const updateSettingsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean(),
});

type UpdateSettingsForm = z.infer<typeof updateSettingsSchema>;

interface SubCommunitySettingsProps {
  subCommunity: Community;
  onUpdate: () => void;
  onDelete: () => void;
}

export function SubCommunitySettings({ 
  subCommunity, 
  onUpdate, 
  onDelete 
}: SubCommunitySettingsProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UpdateSettingsForm>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: {
      name: subCommunity.name,
      description: subCommunity.description || "",
      imageUrl: subCommunity.imageUrl || "",
      isActive: subCommunity.isActive ?? true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateSettingsForm) => {
      const response = await apiRequest("PUT", `/api/sub-communities/${subCommunity.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      onUpdate();
      toast({
        title: "Settings updated",
        description: "Your sub-community settings have been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Could not update sub-community settings",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      const response = await apiRequest("DELETE", `/api/sub-communities/${subCommunity.id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sub-community deleted",
        description: "The sub-community has been permanently deleted",
      });
      onDelete();
    },
    onError: (error: any) => {
      setIsDeleting(false);
      toast({
        title: "Failed to delete",
        description: error.message || "Could not delete sub-community",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateSettingsForm) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (deleteConfirmText === subCommunity.name) {
      deleteMutation.mutate();
      setShowDeleteDialog(false);
    } else {
      toast({
        title: "Name doesn't match",
        description: "Please type the exact sub-community name to confirm deletion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your sub-community's basic information and appearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Community Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter sub-community name" 
                        {...field} 
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormDescription>
                      This is the display name of your sub-community
                    </FormDescription>
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
                        placeholder="Describe your sub-community..."
                        className="resize-none"
                        rows={4}
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Help members understand what your sub-community is about
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Community Image URL
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        {...field}
                        data-testid="input-image-url"
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: Add an image or logo for your sub-community
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={updateMutation.isPending || !form.formState.isDirty}
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility Settings</CardTitle>
          <CardDescription>
            Control how your sub-community appears to others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    <div className="flex items-center gap-2">
                      {field.value ? (
                        <Globe className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      Sub-Community Status
                    </div>
                  </FormLabel>
                  <FormDescription>
                    {field.value 
                      ? "Your sub-community is active and visible to members"
                      : "Your sub-community is inactive and hidden from members"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-active-status"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Deactivating your sub-community will hide it from all members
              except admins. Members will not be able to access or view content until it's
              reactivated.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </div>
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg space-y-3">
            <div>
              <h4 className="font-medium">Delete Sub-Community</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Once you delete a sub-community, there is no going back. This action will:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 ml-6 list-disc space-y-1">
                <li>Permanently delete the sub-community and all its settings</li>
                <li>Remove all members from the sub-community</li>
                <li>Delete all invites and access links</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              data-testid="button-delete-community"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Sub-Community
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Sub-Community
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete
                the <strong>{subCommunity.name}</strong> sub-community.
              </p>
              <p>
                Please type <span className="font-mono font-bold">{subCommunity.name}</span> to confirm.
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type sub-community name to confirm"
                className="mt-2"
                data-testid="input-delete-confirmation"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmText !== subCommunity.name || isDeleting}
              data-testid="button-confirm-delete"
            >
              {isDeleting ? "Deleting..." : "Delete Sub-Community"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}