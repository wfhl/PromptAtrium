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
  categories: z.array(z.string()).optional(),
  promptTypes: z.array(z.string()).optional(),
  promptStyles: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  collectionIds: z.array(z.string()).optional(),
  license: z.string().optional(),
  intendedGenerators: z.array(z.string()).optional(),
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
  const [newCategory, setNewCategory] = useState("");
  const [newPromptType, setNewPromptType] = useState("");
  const [newPromptStyle, setNewPromptStyle] = useState("");
  const [newIntendedGenerator, setNewIntendedGenerator] = useState("");

  // Get collections for dropdown
  const { data: collections = [] } = useQuery({
    queryKey: ["/api/collections"],
    enabled: isOpen,
  }) as { data: any[] };

  // Get existing options for dropdowns
  const { data: options = { tags: [], models: [], categories: [], promptTypes: [], promptStyles: [], intendedGenerators: [] } } = useQuery({
    queryKey: ["/api/prompts/options"],
    enabled: isOpen,
  }) as { data: { tags: string[]; models: string[]; categories: string[]; promptTypes: string[]; promptStyles: string[]; intendedGenerators: string[] } };

  const form = useForm<ModalBulkEditForm>({
    resolver: zodResolver(modalBulkEditSchema),
    defaultValues: {
      categories: [],
      promptTypes: [],
      promptStyles: [],
      tags: [],
      collectionIds: [],
      intendedGenerators: [],
      recommendedModels: [],
    },
  });

  const watchedTags = form.watch("tags") || [];
  const watchedModels = form.watch("recommendedModels") || [];
  const watchedCategories = form.watch("categories") || [];
  const watchedPromptTypes = form.watch("promptTypes") || [];
  const watchedPromptStyles = form.watch("promptStyles") || [];
  const watchedIntendedGenerators = form.watch("intendedGenerators") || [];
  const watchedCollectionIds = form.watch("collectionIds") || [];

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

  // Helper functions for new array fields
  const addCategory = (category?: string) => {
    const categoryToAdd = category || newCategory.trim();
    if (categoryToAdd && !watchedCategories.includes(categoryToAdd)) {
      form.setValue("categories", [...watchedCategories, categoryToAdd]);
      setNewCategory("");
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    form.setValue("categories", watchedCategories.filter(cat => cat !== categoryToRemove));
  };

  const addPromptType = (type?: string) => {
    const typeToAdd = type || newPromptType.trim();
    if (typeToAdd && !watchedPromptTypes.includes(typeToAdd)) {
      form.setValue("promptTypes", [...watchedPromptTypes, typeToAdd]);
      setNewPromptType("");
    }
  };

  const removePromptType = (typeToRemove: string) => {
    form.setValue("promptTypes", watchedPromptTypes.filter(type => type !== typeToRemove));
  };

  const addPromptStyle = (style?: string) => {
    const styleToAdd = style || newPromptStyle.trim();
    if (styleToAdd && !watchedPromptStyles.includes(styleToAdd)) {
      form.setValue("promptStyles", [...watchedPromptStyles, styleToAdd]);
      setNewPromptStyle("");
    }
  };

  const removePromptStyle = (styleToRemove: string) => {
    form.setValue("promptStyles", watchedPromptStyles.filter(style => style !== styleToRemove));
  };

  const addIntendedGenerator = (generator?: string) => {
    const generatorToAdd = generator || newIntendedGenerator.trim();
    if (generatorToAdd && !watchedIntendedGenerators.includes(generatorToAdd)) {
      form.setValue("intendedGenerators", [...watchedIntendedGenerators, generatorToAdd]);
      setNewIntendedGenerator("");
    }
  };

  const removeIntendedGenerator = (generatorToRemove: string) => {
    form.setValue("intendedGenerators", watchedIntendedGenerators.filter(gen => gen !== generatorToRemove));
  };

  const addCollectionId = (collectionId: string) => {
    if (collectionId && !watchedCollectionIds.includes(collectionId)) {
      form.setValue("collectionIds", [...watchedCollectionIds, collectionId]);
    }
  };

  const removeCollectionId = (collectionIdToRemove: string) => {
    form.setValue("collectionIds", watchedCollectionIds.filter(id => id !== collectionIdToRemove));
  };

  const handleClose = () => {
    form.reset();
    setNewTag("");
    setNewModel("");
    setNewCategory("");
    setNewPromptType("");
    setNewPromptStyle("");
    setNewIntendedGenerator("");
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
              {/* Categories */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {watchedCategories.map((category) => (
                            <Badge key={category} variant="secondary" className="group">
                              {category}
                              <button
                                type="button"
                                onClick={() => removeCategory(category)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                data-testid={`remove-category-${category}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" data-testid="button-add-category">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Category
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search categories..."
                                  value={newCategory}
                                  onValueChange={setNewCategory}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addCategory()}
                                      disabled={!newCategory.trim()}
                                      className="w-full"
                                      data-testid="button-create-category"
                                    >
                                      Create "{newCategory}"
                                    </Button>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {options.categories.map((category) => (
                                      <CommandItem
                                        key={category}
                                        onSelect={() => addCategory(category)}
                                        data-testid={`category-option-${category}`}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", watchedCategories.includes(category) ? "opacity-100" : "opacity-0")} />
                                        {category}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Prompt Types */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="promptTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Types</FormLabel>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {watchedPromptTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="group">
                              {type}
                              <button
                                type="button"
                                onClick={() => removePromptType(type)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                data-testid={`remove-prompt-type-${type}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" data-testid="button-add-prompt-type">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Prompt Type
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search prompt types..."
                                  value={newPromptType}
                                  onValueChange={setNewPromptType}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addPromptType()}
                                      disabled={!newPromptType.trim()}
                                      className="w-full"
                                      data-testid="button-create-prompt-type"
                                    >
                                      Create "{newPromptType}"
                                    </Button>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {options.promptTypes.map((type) => (
                                      <CommandItem
                                        key={type}
                                        onSelect={() => addPromptType(type)}
                                        data-testid={`prompt-type-option-${type}`}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", watchedPromptTypes.includes(type) ? "opacity-100" : "opacity-0")} />
                                        {type}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Prompt Styles */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="promptStyles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Styles</FormLabel>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {watchedPromptStyles.map((style) => (
                            <Badge key={style} variant="secondary" className="group">
                              {style}
                              <button
                                type="button"
                                onClick={() => removePromptStyle(style)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                data-testid={`remove-prompt-style-${style}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" data-testid="button-add-prompt-style">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Prompt Style
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search prompt styles..."
                                  value={newPromptStyle}
                                  onValueChange={setNewPromptStyle}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addPromptStyle()}
                                      disabled={!newPromptStyle.trim()}
                                      className="w-full"
                                      data-testid="button-create-prompt-style"
                                    >
                                      Create "{newPromptStyle}"
                                    </Button>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {options.promptStyles.map((style) => (
                                      <CommandItem
                                        key={style}
                                        onSelect={() => addPromptStyle(style)}
                                        data-testid={`prompt-style-option-${style}`}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", watchedPromptStyles.includes(style) ? "opacity-100" : "opacity-0")} />
                                        {style}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Intended Generators */}
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="intendedGenerators"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intended Generators</FormLabel>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {watchedIntendedGenerators.map((generator) => (
                            <Badge key={generator} variant="secondary" className="group">
                              {generator}
                              <button
                                type="button"
                                onClick={() => removeIntendedGenerator(generator)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                data-testid={`remove-intended-generator-${generator}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" data-testid="button-add-intended-generator">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Intended Generator
                                <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search intended generators..."
                                  value={newIntendedGenerator}
                                  onValueChange={setNewIntendedGenerator}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addIntendedGenerator()}
                                      disabled={!newIntendedGenerator.trim()}
                                      className="w-full"
                                      data-testid="button-create-intended-generator"
                                    >
                                      Create "{newIntendedGenerator}"
                                    </Button>
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {options.intendedGenerators.map((generator) => (
                                      <CommandItem
                                        key={generator}
                                        onSelect={() => addIntendedGenerator(generator)}
                                        data-testid={`intended-generator-option-${generator}`}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", watchedIntendedGenerators.includes(generator) ? "opacity-100" : "opacity-0")} />
                                        {generator}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                name="collectionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collections</FormLabel>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {watchedCollectionIds.map((collectionId) => {
                          const collection = collections.find((c: any) => c.id === collectionId);
                          return (
                            <Badge key={collectionId} variant="secondary" className="group">
                              {collection?.name || collectionId}
                              <button
                                type="button"
                                onClick={() => removeCollectionId(collectionId)}
                                className="ml-1 text-muted-foreground hover:text-foreground"
                                data-testid={`remove-collection-${collectionId}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" data-testid="button-add-collection">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Collection
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search collections..." />
                              <CommandList>
                                <CommandEmpty>No collections found.</CommandEmpty>
                                <CommandGroup>
                                  {collections.map((collection: any) => (
                                    <CommandItem
                                      key={collection.id}
                                      onSelect={() => addCollectionId(collection.id)}
                                      data-testid={`collection-option-${collection.id}`}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", watchedCollectionIds.includes(collection.id) ? "opacity-100" : "opacity-0")} />
                                      {collection.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
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