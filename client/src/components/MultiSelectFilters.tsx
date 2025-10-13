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

export interface EnabledFilters {
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
  enabledFilters?: EnabledFilters;
  selectedFilters?: MultiSelectFilters;
  sortBy: string;
  showButton?: boolean;
  showTabs?: boolean;
}

export function MultiSelectFilters({ 
  onFiltersChange,
  onEnabledFiltersChange,
  enabledFilters: enabledFiltersProp,
  selectedFilters: selectedFiltersProp,
  sortBy,
  showButton = true,
  showTabs = true
}: MultiSelectFiltersProps) {
  // State for which filter categories are enabled (use props if provided)
  const [localEnabledFilters, setLocalEnabledFilters] = useState<EnabledFilters>({
    category: false,
    type: false,
    style: false,
    intendedGenerator: false,
    recommendedModel: false,
    collection: false,
  });

  // State for selected values in each filter (use props if provided)
  const [localSelectedFilters, setLocalSelectedFilters] = useState<MultiSelectFilters>({
    category: [],
    type: [],
    style: [],
    intendedGenerator: [],
    recommendedModel: [],
    collection: [],
  });

  // Use props if provided, otherwise use local state
  const enabledFilters = enabledFiltersProp || localEnabledFilters;
  const selectedFilters = selectedFiltersProp || localSelectedFilters;
  const setEnabledFilters = (filters: EnabledFilters) => {
    if (enabledFiltersProp) {
      onEnabledFiltersChange?.(filters);
    } else {
      setLocalEnabledFilters(filters);
      onEnabledFiltersChange?.(filters);
    }
  };
  const setSelectedFilters = (filters: MultiSelectFilters) => {
    if (selectedFiltersProp) {
      onFiltersChange(filters);
    } else {
      setLocalSelectedFilters(filters);
      onFiltersChange(filters);
    }
  };

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
      {/* Filter Options Button - Only show when showButton is true */}
      {showButton && (
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
      )}

      {/* Filter Tabs - Show when showTabs is true and filters are enabled */}
      {showTabs && (
        <div className="space-y-3">
        {/* Category Tabs */}
        {enabledFilters.category && filterOptions?.categories && filterOptions.categories.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Category</Label>
            <div className="inline-flex w-auto">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                {filterOptions.categories.map((category) => (
                  <button
                    key={category}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      selectedFilters.category.includes(category) 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFilterValue("category", category);
                    }}
                    data-testid={`tab-category-${category}`}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Type Tabs */}
        {enabledFilters.type && filterOptions?.promptTypes && filterOptions.promptTypes.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Type</Label>
            <div className="inline-flex w-auto">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                {filterOptions.promptTypes.map((type) => (
                  <button
                    key={type}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      selectedFilters.type.includes(type) 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFilterValue("type", type);
                    }}
                    data-testid={`tab-type-${type}`}
                    type="button"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Style Tabs */}
        {enabledFilters.style && filterOptions?.promptStyles && filterOptions.promptStyles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Style</Label>
            <div className="inline-flex w-auto">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                {filterOptions.promptStyles.map((style) => (
                  <button
                    key={style}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      selectedFilters.style.includes(style) 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFilterValue("style", style);
                    }}
                    data-testid={`tab-style-${style}`}
                    type="button"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Intended Generator Tabs */}
        {enabledFilters.intendedGenerator && filterOptions?.intendedGenerators && filterOptions.intendedGenerators.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Intended Generator</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                {filterOptions.intendedGenerators.map((generator) => (
                  <button
                    key={generator}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      selectedFilters.intendedGenerator.includes(generator) 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFilterValue("intendedGenerator", generator);
                    }}
                    data-testid={`tab-generator-${generator}`}
                    type="button"
                  >
                    {generator}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Recommended Model Tabs */}
        {enabledFilters.recommendedModel && filterOptions?.models && filterOptions.models.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Recommended Model</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                {filterOptions.models.map((model) => (
                  <button
                    key={model}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      selectedFilters.recommendedModel.includes(model) 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFilterValue("recommendedModel", model);
                    }}
                    data-testid={`tab-model-${model}`}
                    type="button"
                  >
                    {model}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Collection Tabs */}
        {enabledFilters.collection && filterOptions?.collections && filterOptions.collections.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Collection</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
                {filterOptions.collections.map((collection) => (
                  <button
                    key={collection.id}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      selectedFilters.collection.includes(collection.id) 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFilterValue("collection", collection.id);
                    }}
                    data-testid={`tab-collection-${collection.id}`}
                    type="button"
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
      )}
    </>
  );
}