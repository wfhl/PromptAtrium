import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { X, Plus, Check, ChevronDown } from "lucide-react";
import { bulkEditPromptSchema, type BulkEditPrompt } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Extend the schema to make all fields optional for partial updates
const modalBulkEditSchema = z.object({
  category: z.string().optional(),
  promptType: z.string().optional(),
  promptStyle: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  collectionId: z.string().nullable().optional(),
  license: z.string().optional(),
  intendedGenerator: z.string().optional(),
  recommendedModels: z.array(z.string()).optional(),
});

type ModalBulkEditForm = z.infer<typeof modalBulkEditSchema>;

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkEditPrompt) => void;
  selectedCount: number;
  isLoading?: boolean;
}

export function BulkEditModal({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  isLoading = false
}: BulkEditModalProps) {
  const [newTag, setNewTag] = useState("");
  const [newModel, setNewModel] = useState("");

  // Get collections for dropdown
  const { data: collections = [] } = useQuery({
    queryKey: ["/api/collections"],
    enabled: isOpen,
  }) as { data: any[] };

  // Get existing tags and models for dropdowns
  const { data: options = { tags: [], models: [] } } = useQuery({
    queryKey: ["/api/prompts/options"],
    enabled: isOpen,
  }) as { data: { tags: string[]; models: string[] } };

  const form = useForm<ModalBulkEditForm>({
    resolver: zodResolver(modalBulkEditSchema),
    defaultValues: {
      tags: [],
      recommendedModels: [],
    },
  });

  const watchedTags = form.watch("tags") || [];
  const watchedModels = form.watch("recommendedModels") || [];

  const handleSubmit = (data: ModalBulkEditForm) => {
    // Filter out undefined/empty values to only send changes
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => {
        if (value === undefined || value === null) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        return true;
      })
    ) as BulkEditPrompt;

    onSubmit(cleanData);
  };

  const addTag = (tag?: string) => {
    const tagToAdd = tag || newTag.trim();
    if (tagToAdd && !watchedTags.includes(tagToAdd)) {
      form.setValue("tags", [...watchedTags, tagToAdd]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue("tags", watchedTags.filter(tag => tag !== tagToRemove));
  };

  const addModel = (model?: string) => {
    const modelToAdd = model || newModel.trim();
    if (modelToAdd && !watchedModels.includes(modelToAdd)) {
      form.setValue("recommendedModels", [...watchedModels, modelToAdd]);
      setNewModel("");
    }
  };

  const removeModel = (modelToRemove: string) => {
    form.setValue("recommendedModels", watchedModels.filter(model => model !== modelToRemove));
  };

  const handleClose = () => {
    form.reset();
    setNewTag("");
    setNewModel("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-bulk-edit">
        <DialogHeader>
          <DialogTitle>
            Edit {selectedCount} Selected Prompt{selectedCount !== 1 ? 's' : ''}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Only fill in the fields you want to change. Empty fields will remain unchanged.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Creative Writing, Marketing"
                        data-testid="input-bulk-category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prompt Type */}
              <FormField
                control={form.control}
                name="promptType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Type</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Instruction, Question, Template"
                        data-testid="input-bulk-prompt-type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prompt Style */}
              <FormField
                control={form.control}
                name="promptStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Style</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Casual, Professional, Technical"
                        data-testid="input-bulk-prompt-style"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Intended Generator */}
              <FormField
                control={form.control}
                name="intendedGenerator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intended Generator</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. ChatGPT, Claude, Gemini"
                        data-testid="input-bulk-intended-generator"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status and Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bulk-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bulk-collection">
                          <SelectValue placeholder="Select collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">No Collection</SelectItem>
                        {collections.map((collection: any) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
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
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make prompts publicly visible
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-bulk-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* License */}
            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. MIT, Creative Commons, All Rights Reserved"
                      data-testid="input-bulk-license"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      data-testid="button-select-tags"
                    >
                      Select from existing tags...
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {options.tags.filter(tag => !watchedTags.includes(tag)).map((tag) => (
                            <CommandItem
                              key={tag}
                              value={tag}
                              onSelect={() => addTag(tag)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedTags.includes(tag) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {tag}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Or add custom tag"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  data-testid="input-new-tag"
                />
                <Button
                  type="button"
                  onClick={() => addTag()}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-tag"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommended Models */}
            <div className="space-y-3">
              <Label>Recommended Models</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      data-testid="button-select-models"
                    >
                      Select from existing models...
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search models..." />
                      <CommandList>
                        <CommandEmpty>No models found.</CommandEmpty>
                        <CommandGroup>
                          {options.models.filter(model => !watchedModels.includes(model)).map((model) => (
                            <CommandItem
                              key={model}
                              value={model}
                              onSelect={() => addModel(model)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedModels.includes(model) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {model}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="Or add custom model"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addModel();
                    }
                  }}
                  data-testid="input-new-model"
                />
                <Button
                  type="button"
                  onClick={() => addModel()}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-model"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedModels.map((model, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {model}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeModel(model)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                data-testid="button-cancel-bulk-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-save-bulk-edit"
              >
                {isLoading ? "Updating..." : `Update ${selectedCount} Prompt${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}