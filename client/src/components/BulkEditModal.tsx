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
  const [newCollection, setNewCollection] = useState("");

  // Get collections for dropdown
  const { data: collections = [] } = useQuery({
    queryKey: ["/api/collections"],
    enabled: isOpen,
  }) as { data: any[] };

  // Get categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isOpen,
  }) as { data: Array<{ id: string; name: string; description?: string }> };

  // Get prompt types from database
  const { data: promptTypes = [] } = useQuery({
    queryKey: ["/api/prompt-types"],
    enabled: isOpen,
  }) as { data: Array<{ id: string; name: string; description?: string }> };

  // Get prompt styles from database
  const { data: promptStyles = [] } = useQuery({
    queryKey: ["/api/prompt-styles"],
    enabled: isOpen,
  }) as { data: Array<{ id: string; name: string; description?: string }> };

  // Get intended generators from database
  const { data: intendedGenerators = [] } = useQuery({
    queryKey: ["/api/intended-generators"],
    enabled: isOpen,
  }) as { data: Array<{ id: string; name: string; description?: string }> };

  // Get recommended models from database
  const { data: recommendedModels = [] } = useQuery({
    queryKey: ["/api/recommended-models"],
    enabled: isOpen,
  }) as { data: Array<{ id: string; name: string; description?: string }> };

  // Get existing options for dropdowns (for tags and other non-db fields)
  const { data: options = { tags: [] } } = useQuery({
    queryKey: ["/api/prompts/options"],
    enabled: isOpen,
  }) as { data: { tags: string[] } };

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

  const addCollection = (collectionName?: string) => {
    const nameToAdd = collectionName || newCollection.trim();
    if (nameToAdd && !watchedCollectionIds.includes(nameToAdd)) {
      // For new collections, we'll use the name as ID temporarily
      // The backend can handle creating the collection if it doesn't exist
      form.setValue("collectionIds", [...watchedCollectionIds, nameToAdd]);
      setNewCollection("");
    }
  };

  const removeCollection = (collectionToRemove: string) => {
    form.setValue("collectionIds", watchedCollectionIds.filter(id => id !== collectionToRemove));
  };

  const handleClose = () => {
    form.reset();
    setNewTag("");
    setNewModel("");
    setNewCategory("");
    setNewPromptType("");
    setNewPromptStyle("");
    setNewIntendedGenerator("");
    setNewCollection("");
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
            
            {/* Status and Visibility at top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Categories */}
            <div className="space-y-3">
              <Label>Categories</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      data-testid="button-select-categories"
                    >
                      Select from existing categories...
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandList>
                        <CommandEmpty>No categories found.</CommandEmpty>
                        <CommandGroup>
                          {categories.filter(category => !watchedCategories.includes(category.name)).map((category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => addCategory(category.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedCategories.includes(category.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Or add custom category"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  data-testid="input-new-category"
                />
                <Button
                  type="button"
                  onClick={() => addCategory()}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-category"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedCategories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Prompt Types */}
            <div className="space-y-3">
              <Label>Prompt Types</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      data-testid="button-select-prompt-types"
                    >
                      Select from existing prompt types...
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search prompt types..." />
                      <CommandList>
                        <CommandEmpty>No prompt types found.</CommandEmpty>
                        <CommandGroup>
                          {promptTypes.filter(type => !watchedPromptTypes.includes(type.name)).map((type) => (
                            <CommandItem
                              key={type.id}
                              value={type.name}
                              onSelect={() => addPromptType(type.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedPromptTypes.includes(type.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {type.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newPromptType}
                  onChange={(e) => setNewPromptType(e.target.value)}
                  placeholder="Or add custom prompt type"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPromptType();
                    }
                  }}
                  data-testid="input-new-prompt-type"
                />
                <Button
                  type="button"
                  onClick={() => addPromptType()}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-prompt-type"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedPromptTypes.map((type, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {type}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removePromptType(type)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Prompt Styles */}
            <div className="space-y-3">
              <Label>Prompt Styles</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      data-testid="button-select-prompt-styles"
                    >
                      Select from existing prompt styles...
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search prompt styles..." />
                      <CommandList>
                        <CommandEmpty>No prompt styles found.</CommandEmpty>
                        <CommandGroup>
                          {promptStyles.filter(style => !watchedPromptStyles.includes(style.name)).map((style) => (
                            <CommandItem
                              key={style.id}
                              value={style.name}
                              onSelect={() => addPromptStyle(style.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedPromptStyles.includes(style.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {style.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newPromptStyle}
                  onChange={(e) => setNewPromptStyle(e.target.value)}
                  placeholder="Or add custom prompt style"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPromptStyle();
                    }
                  }}
                  data-testid="input-new-prompt-style"
                />
                <Button
                  type="button"
                  onClick={() => addPromptStyle()}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-prompt-style"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedPromptStyles.map((style, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {style}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removePromptStyle(style)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Intended Generators */}
            <div className="space-y-3">
              <Label>Intended Generators</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      data-testid="button-select-intended-generators"
                    >
                      Select from existing generators...
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search intended generators..." />
                      <CommandList>
                        <CommandEmpty>No intended generators found.</CommandEmpty>
                        <CommandGroup>
                          {intendedGenerators.filter(generator => !watchedIntendedGenerators.includes(generator.name)).map((generator) => (
                            <CommandItem
                              key={generator.id}
                              value={generator.name}
                              onSelect={() => addIntendedGenerator(generator.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedIntendedGenerators.includes(generator.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {generator.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newIntendedGenerator}
                  onChange={(e) => setNewIntendedGenerator(e.target.value)}
                  placeholder="Or add custom generator"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIntendedGenerator();
                    }
                  }}
                  data-testid="input-new-intended-generator"
                />
                <Button
                  type="button"
                  onClick={() => addIntendedGenerator()}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-intended-generator"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedIntendedGenerators.map((generator, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {generator}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeIntendedGenerator(generator)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Collections */}
            <div className="space-y-3">
              <Label>Collections</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="flex-1 justify-between"
                      data-testid="button-select-collections"
                    >
                      Select from existing collections...
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search collections..." />
                      <CommandList>
                        <CommandEmpty>No collections found.</CommandEmpty>
                        <CommandGroup>
                          {collections.filter((collection: any) => !watchedCollectionIds.includes(collection.id)).map((collection: any) => (
                            <CommandItem
                              key={collection.id}
                              value={collection.name}
                              onSelect={() => addCollectionId(collection.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedCollectionIds.includes(collection.id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {collection.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  value={newCollection}
                  onChange={(e) => setNewCollection(e.target.value)}
                  placeholder="Or add custom collection"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCollection();
                    }
                  }}
                  data-testid="input-new-collection"
                />
                <Button
                  type="button"
                  onClick={() => addCollection()}
                  variant="outline"
                  size="sm"
                  data-testid="button-add-collection"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedCollectionIds.map((collectionId, index) => {
                  const collection = collections.find((c: any) => c.id === collectionId);
                  return (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {collection?.name || collectionId}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeCollectionId(collectionId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            </div>


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
                          {recommendedModels.filter(model => !watchedModels.includes(model.name)).map((model) => (
                            <CommandItem
                              key={model.id}
                              value={model.name}
                              onSelect={() => addModel(model.name)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  watchedModels.includes(model.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {model.name}
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

            {/* License at bottom */}
            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-bulk-license">
                        <SelectValue placeholder="Select license" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CC0 (Public Domain)">CC0 (Public Domain)</SelectItem>
                      <SelectItem value="CC BY (Attribution)">CC BY (Attribution)</SelectItem>
                      <SelectItem value="CC BY-SA (Share Alike)">CC BY-SA (Share Alike)</SelectItem>
                      <SelectItem value="All Rights Reserved">All Rights Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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