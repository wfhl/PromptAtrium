import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Plus, FolderPlus, FileUp, FileSearch, Sparkles, BookOpen, RatioIcon, ChartScatter, Lock, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PromptModal } from "@/components/PromptModal";
import { BulkImportModal } from "@/components/BulkImportModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Prompt, Collection } from "@shared/schema";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function Tools() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState(false);
  
  const createCollectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      return apiRequest("/api/collections", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
      setCreateCollectionModalOpen(false);
      createCollectionForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
    },
  });

  const handleComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon",
      description: `${feature} will be available soon!`,
    });
  };

  const toolsData = [
    {
      id: "add-prompt",
      title: "Add Prompt",
      description: "Create a new prompt",
      icon: Plus,
      color: "text-primary",
      onClick: () => setPromptModalOpen(true),
    },
    {
      id: "generate-prompt",
      title: "Generate Prompt",
      description: "AI prompt generator",
      icon: Sparkles,
      color: "text-purple-500",
      link: "/tools/quick-prompter",
    },
    {
      id: "import-prompts",
      title: "Import Prompts",
      description: "Bulk import from file",
      icon: FileUp,
      color: "text-yellow-500",
      onClick: () => setBulkImportModalOpen(true),
    },
    {
      id: "metadata-extract",
      title: "Metadata Extract",
      description: "Analyze image metadata",
      icon: FileSearch,
      color: "text-cyan-500",
      link: "/tools/metadata-analyzer",
    },
    {
      id: "prompt-collections",
      title: "Prompt Collections",
      description: "Organize prompts",
      icon: FolderPlus,
      color: "text-green-500",
      link: "/collections",
    },
    {
      id: "aspect-ratio",
      title: "Aspect Ratio Calculator",
      description: "Calculate aspect ratios",
      icon: RatioIcon,
      color: "text-orange-500",
      link: "/tools/aspect-ratio-calculator",
    },
    {
      id: "wordsmith-codex",
      title: "Wordsmith Codex",
      description: "Browse and Assemble Keyword Terms",
      icon: BookOpen,
      color: "text-red-500",
      link: "/codex",
    },
    {
      id: "prompting-guides",
      title: "Prompting Guides",
      description: "Learn prompting techniques",
      icon: BookOpen,
      color: "text-blue-500",
      link: "/prompting-guides",
    },
  ];

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Wrench className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold">Tools & Resources</h1>
          </div>
          <p className="text-muted-foreground">
            Access all your AI prompting tools and utilities in one place
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {toolsData.map((tool) => {
            const IconComponent = tool.icon;
            const content = (
              <Card 
                className="hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
                data-testid={`card-tool-${tool.id}`}
              >
                <CardContent className="p-3 md:p-6">
                  <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-background rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                      <IconComponent className={`h-6 w-6 md:h-8 md:w-8 ${tool.color} transition-all group-hover:brightness-150`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs md:text-base">{tool.title}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            if (tool.link) {
              return (
                <Link key={tool.id} href={tool.link}>
                  {content}
                </Link>
              );
            } else {
              return (
                <div key={tool.id} onClick={tool.onClick}>
                  {content}
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Prompt Modal */}
      {promptModalOpen && (
        <PromptModal
          open={promptModalOpen}
          onOpenChange={(open) => {
            setPromptModalOpen(open);
            if (!open) setEditingPrompt(null);
          }}
          prompt={editingPrompt}
          mode={editingPrompt ? "edit" : "create"}
        />
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={bulkImportModalOpen}
        onOpenChange={setBulkImportModalOpen}
        collections={[]}
      />

      {/* Create Collection Modal */}
      <Dialog open={createCollectionModalOpen} onOpenChange={setCreateCollectionModalOpen}>
        <DialogContent data-testid="dialog-create-collection">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <Form {...createCollectionForm}>
            <form onSubmit={createCollectionForm.handleSubmit((data) => createCollectionMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createCollectionForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="My Collection"
                        data-testid="input-collection-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createCollectionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your collection..."
                        data-testid="textarea-collection-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createCollectionForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Make Public</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow others to view and use this collection
                      </p>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                        data-testid="checkbox-collection-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateCollectionModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCollectionMutation.isPending}>
                  {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </>
  );
}