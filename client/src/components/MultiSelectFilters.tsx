import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, X } from "lucide-react";

export interface MultiSelectFilters {
  category: string[];
  type: string[];
  style: string[];
  intendedGenerator: string[];
  recommendedModel: string[];
  collection: string[];
}

interface EnabledFilters {
  category: boolean;
  type: boolean;
  style: boolean;
  intendedGenerator: boolean;
  recommendedModel: boolean;
  collection: boolean;
}

interface MultiSelectFiltersProps {
  onFiltersChange: (filters: MultiSelectFilters) => void;
  onEnabledFiltersChange?: (enabledFilters: EnabledFilters) => void;
  sortBy: string;
}

export function MultiSelectFilters({ 
  onFiltersChange,
  onEnabledFiltersChange,
  sortBy
}: MultiSelectFiltersProps) {
  // State for which filter categories are enabled
  const [enabledFilters, setEnabledFilters] = useState<EnabledFilters>({
    category: false,
    type: false,
    style: false,
    intendedGenerator: false,
    recommendedModel: false,
    collection: false,
  });

  // State for selected values in each filter
  const [selectedFilters, setSelectedFilters] = useState<MultiSelectFilters>({
    category: [],
    type: [],
    style: [],
    intendedGenerator: [],
    recommendedModel: [],
    collection: [],
  });

  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  // Fetch filter options
  const { data: filterOptions } = useQuery<{
    categories: string[];
    promptTypes: string[];
    promptStyles: string[];
    intendedGenerators: string[];
    models: string[];
    collections: { id: string; name: string }[];
  }>({
    queryKey: ["/api/prompts/options"],
    staleTime: 5 * 60 * 1000,
  });

  // Handle enabling/disabling filter categories
  const handleEnableFilter = (filterType: keyof EnabledFilters, enabled: boolean) => {
    const newEnabledFilters = { ...enabledFilters, [filterType]: enabled };
    setEnabledFilters(newEnabledFilters);
    
    // Clear selections for disabled filters
    if (!enabled) {
      const newSelectedFilters = { ...selectedFilters, [filterType]: [] };
      setSelectedFilters(newSelectedFilters);
      onFiltersChange(newSelectedFilters);
    }
    
    onEnabledFiltersChange?.(newEnabledFilters);
  };

  // Handle toggling filter values
  const handleToggleFilterValue = (filterType: keyof MultiSelectFilters, value: string) => {
    const currentValues = selectedFilters[filterType];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    const newFilters = { ...selectedFilters, [filterType]: newValues };
    setSelectedFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(selectedFilters).reduce((total, values) => total + values.length, 0);
  }, [selectedFilters]);

  // Reset all filters
  const resetFilters = () => {
    const emptyFilters: MultiSelectFilters = {
      category: [],
      type: [],
      style: [],
      intendedGenerator: [],
      recommendedModel: [],
      collection: [],
    };
    setSelectedFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    
    const disabledFilters: EnabledFilters = {
      category: false,
      type: false,
      style: false,
      intendedGenerator: false,
      recommendedModel: false,
      collection: false,
    };
    setEnabledFilters(disabledFilters);
    onEnabledFiltersChange?.(disabledFilters);
  };

  return (
    <>
      {/* Filter Options Button */}
      <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="relative h-10 gap-2"
            data-testid="button-filter-options"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter Options</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 px-1.5 py-0 h-5 min-w-[20px] text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filter Options</h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 px-2"
                  data-testid="button-reset-filters"
                >
                  Reset all
                </Button>
              )}
            </div>

            <Separator />

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {/* Category Filter Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-category"
                    checked={enabledFilters.category}
                    onCheckedChange={(checked) => handleEnableFilter("category", checked as boolean)}
                    data-testid="checkbox-filter-category"
                  />
                  <Label 
                    htmlFor="filter-category" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Category
                    {selectedFilters.category.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedFilters.category.length}
                      </Badge>
                    )}
                  </Label>
                </div>

                {/* Type Filter Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-type"
                    checked={enabledFilters.type}
                    onCheckedChange={(checked) => handleEnableFilter("type", checked as boolean)}
                    data-testid="checkbox-filter-type"
                  />
                  <Label 
                    htmlFor="filter-type" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Type
                    {selectedFilters.type.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedFilters.type.length}
                      </Badge>
                    )}
                  </Label>
                </div>

                {/* Style Filter Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-style"
                    checked={enabledFilters.style}
                    onCheckedChange={(checked) => handleEnableFilter("style", checked as boolean)}
                    data-testid="checkbox-filter-style"
                  />
                  <Label 
                    htmlFor="filter-style" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Style
                    {selectedFilters.style.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedFilters.style.length}
                      </Badge>
                    )}
                  </Label>
                </div>

                {/* Intended Generator Filter Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-generator"
                    checked={enabledFilters.intendedGenerator}
                    onCheckedChange={(checked) => handleEnableFilter("intendedGenerator", checked as boolean)}
                    data-testid="checkbox-filter-generator"
                  />
                  <Label 
                    htmlFor="filter-generator" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Intended Generator
                    {selectedFilters.intendedGenerator.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedFilters.intendedGenerator.length}
                      </Badge>
                    )}
                  </Label>
                </div>

                {/* Recommended Model Filter Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-model"
                    checked={enabledFilters.recommendedModel}
                    onCheckedChange={(checked) => handleEnableFilter("recommendedModel", checked as boolean)}
                    data-testid="checkbox-filter-model"
                  />
                  <Label 
                    htmlFor="filter-model" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Recommended Model
                    {selectedFilters.recommendedModel.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedFilters.recommendedModel.length}
                      </Badge>
                    )}
                  </Label>
                </div>

                {/* Collection Filter Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filter-collection"
                    checked={enabledFilters.collection}
                    onCheckedChange={(checked) => handleEnableFilter("collection", checked as boolean)}
                    data-testid="checkbox-filter-collection"
                  />
                  <Label 
                    htmlFor="filter-collection" 
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Collection
                    {selectedFilters.collection.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedFilters.collection.length}
                      </Badge>
                    )}
                  </Label>
                </div>
              </div>
            </ScrollArea>

            <div className="text-xs text-muted-foreground">
              Enable filters to show options as tabs below
            </div>

            <Button 
              className="w-full"
              onClick={() => setFilterPopoverOpen(false)}
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Filter Tabs - Show when filters are enabled */}
      <div className="space-y-3">
        {/* Category Tabs */}
        {enabledFilters.category && filterOptions?.categories && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {filterOptions.categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedFilters.category.includes(category) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFilterValue("category", category)}
                    className="flex-shrink-0"
                    data-testid={`button-category-${category}`}
                  >
                    {category}
                    {selectedFilters.category.includes(category) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Type Tabs */}
        {enabledFilters.type && filterOptions?.promptTypes && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {filterOptions.promptTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedFilters.type.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFilterValue("type", type)}
                    className="flex-shrink-0"
                    data-testid={`button-type-${type}`}
                  >
                    {type}
                    {selectedFilters.type.includes(type) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Style Tabs */}
        {enabledFilters.style && filterOptions?.promptStyles && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Style</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {filterOptions.promptStyles.map((style) => (
                  <Button
                    key={style}
                    variant={selectedFilters.style.includes(style) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFilterValue("style", style)}
                    className="flex-shrink-0"
                    data-testid={`button-style-${style}`}
                  >
                    {style}
                    {selectedFilters.style.includes(style) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Intended Generator Tabs */}
        {enabledFilters.intendedGenerator && filterOptions?.intendedGenerators && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Intended Generator</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {filterOptions.intendedGenerators.map((generator) => (
                  <Button
                    key={generator}
                    variant={selectedFilters.intendedGenerator.includes(generator) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFilterValue("intendedGenerator", generator)}
                    className="flex-shrink-0"
                    data-testid={`button-generator-${generator}`}
                  >
                    {generator}
                    {selectedFilters.intendedGenerator.includes(generator) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Recommended Model Tabs */}
        {enabledFilters.recommendedModel && filterOptions?.models && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Recommended Model</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {filterOptions.models.map((model) => (
                  <Button
                    key={model}
                    variant={selectedFilters.recommendedModel.includes(model) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFilterValue("recommendedModel", model)}
                    className="flex-shrink-0"
                    data-testid={`button-model-${model}`}
                  >
                    {model}
                    {selectedFilters.recommendedModel.includes(model) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Collection Tabs */}
        {enabledFilters.collection && filterOptions?.collections && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Collection</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {filterOptions.collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant={selectedFilters.collection.includes(collection.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleFilterValue("collection", collection.id)}
                    className="flex-shrink-0"
                    data-testid={`button-collection-${collection.id}`}
                  >
                    {collection.name}
                    {selectedFilters.collection.includes(collection.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </>
  );
}