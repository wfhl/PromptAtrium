import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, X, FileText, Users, ChevronDown } from "lucide-react";
import { PromptCard } from "@/components/PromptCard";
import { useAuth } from "@/hooks/useAuth";
import type { Prompt } from "@shared/schema";

interface SearchFilters {
  source: "my" | "community";
  category: string;
  collection: string;
  type: string;
  style: string;
  intendedGenerator: string;
  recommendedModel: string;
  showNsfw: boolean;
}

interface SearchWithFiltersProps {
  onSearchChange?: (query: string) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  onResultClick?: (prompt: Prompt) => void;
  placeholder?: string;
}

export function SearchWithFilters({
  onSearchChange,
  onFiltersChange,
  onResultClick,
  placeholder = "Search prompts..."
}: SearchWithFiltersProps) {
  const { user } = useAuth();
  const showNsfwPref = (user as any)?.showNsfw ?? true;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    source: "my",
    category: "all",
    collection: "all",
    type: "all",
    style: "all",
    intendedGenerator: "all",
    recommendedModel: "all",
    showNsfw: false
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["/api/prompts/options"],
    queryFn: async () => {
      const response = await fetch("/api/prompts/options");
      if (!response.ok) throw new Error("Failed to fetch filter options");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build query string for search
  const buildSearchQuery = useCallback(() => {
    const params = new URLSearchParams();
    
    if (debouncedQuery) {
      params.append("search", debouncedQuery);
    }
    
    // Add source filter
    if (filters.source === "my") {
      params.append("userId", user?.id || "");
    } else {
      params.append("isPublic", "true");
    }
    
    // Add other filters
    if (filters.category !== "all") params.append("category", filters.category);
    if (filters.collection !== "all") params.append("collectionId", filters.collection);
    if (filters.type !== "all") params.append("type", filters.type);
    if (filters.style !== "all") params.append("style", filters.style);
    if (filters.intendedGenerator !== "all") params.append("generator", filters.intendedGenerator);
    if (filters.recommendedModel !== "all") params.append("model", filters.recommendedModel);
    if (!filters.showNsfw) params.append("excludeNsfw", "true");
    
    params.append("limit", "10");
    return params.toString();
  }, [debouncedQuery, filters, user?.id]);

  // Fetch search results
  const { data: searchResults = [], isLoading } = useQuery<Prompt[]>({
    queryKey: [`/api/prompts?${buildSearchQuery()}`],
    enabled: debouncedQuery.length > 0 && showResults,
    retry: false,
  });

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowResults(value.length > 0);
    onSearchChange?.(value);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "source") return false;
    if (key === "showNsfw") return value === true;
    return value !== "all";
  }).length;

  // Reset all filters
  const resetFilters = () => {
    const defaultFilters: SearchFilters = {
      source: "my",
      category: "all",
      collection: "all",
      type: "all",
      style: "all",
      intendedGenerator: "all",
      recommendedModel: "all",
      showNsfw: false
    };
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        {/* Search Input with Results Dropdown */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowResults(true)}
              className="pl-10 pr-4"
              data-testid="input-search-with-filters"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                  onSearchChange?.("");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-[500px] overflow-hidden">
              {/* Source Toggle */}
              <div className="p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={filters.source === "my" ? "default" : "outline"}
                    onClick={() => handleFilterChange("source", "my")}
                    className="flex-1"
                    data-testid="button-source-my"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    My Prompts
                  </Button>
                  <Button
                    size="sm"
                    variant={filters.source === "community" ? "default" : "outline"}
                    onClick={() => handleFilterChange("source", "community")}
                    className="flex-1"
                    data-testid="button-source-community"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Community
                  </Button>
                </div>
              </div>

              {/* Results List */}
              <ScrollArea className="max-h-[400px]">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2">
                    {searchResults.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="mb-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                        onClick={() => {
                          onResultClick?.(prompt);
                          setShowResults(false);
                        }}
                      >
                        <PromptCard prompt={prompt} compact={true} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No prompts found matching "{searchQuery}"
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Filter Button */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="relative"
              data-testid="button-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 px-1.5 py-0 h-5 min-w-[20px] text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
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

              {/* Source Filter */}
              <div className="space-y-2">
                <Label>Source</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filters.source === "my" ? "default" : "outline"}
                    onClick={() => handleFilterChange("source", "my")}
                    className="flex-1"
                  >
                    My Prompts
                  </Button>
                  <Button
                    size="sm"
                    variant={filters.source === "community" ? "default" : "outline"}
                    onClick={() => handleFilterChange("source", "community")}
                    className="flex-1"
                  >
                    Community
                  </Button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange("category", value)}
                >
                  <SelectTrigger data-testid="select-filter-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {filterOptions?.categories?.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Collection Filter */}
              <div className="space-y-2">
                <Label>Collection</Label>
                <Select
                  value={filters.collection}
                  onValueChange={(value) => handleFilterChange("collection", value)}
                >
                  <SelectTrigger data-testid="select-filter-collection">
                    <SelectValue placeholder="All Collections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Collections</SelectItem>
                    {filterOptions?.collections?.map((col: any) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange("type", value)}
                >
                  <SelectTrigger data-testid="select-filter-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filterOptions?.promptTypes?.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Style Filter */}
              <div className="space-y-2">
                <Label>Style</Label>
                <Select
                  value={filters.style}
                  onValueChange={(value) => handleFilterChange("style", value)}
                >
                  <SelectTrigger data-testid="select-filter-style">
                    <SelectValue placeholder="All Styles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    {filterOptions?.promptStyles?.map((style: string) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Intended Generator Filter */}
              <div className="space-y-2">
                <Label>Intended Generator</Label>
                <Select
                  value={filters.intendedGenerator}
                  onValueChange={(value) => handleFilterChange("intendedGenerator", value)}
                >
                  <SelectTrigger data-testid="select-filter-generator">
                    <SelectValue placeholder="All Generators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Generators</SelectItem>
                    {filterOptions?.intendedGenerators?.map((gen: string) => (
                      <SelectItem key={gen} value={gen}>
                        {gen}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recommended Model Filter */}
              <div className="space-y-2">
                <Label>Recommended Model</Label>
                <Select
                  value={filters.recommendedModel}
                  onValueChange={(value) => handleFilterChange("recommendedModel", value)}
                >
                  <SelectTrigger data-testid="select-filter-model">
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {filterOptions?.models?.map((model: string) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* NSFW Filter - Only show if user preference allows */}
              {showNsfwPref && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="nsfw-toggle">Show NSFW Content</Label>
                  <Switch
                    id="nsfw-toggle"
                    checked={filters.showNsfw}
                    onCheckedChange={(checked) => handleFilterChange("showNsfw", checked)}
                    data-testid="switch-nsfw"
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}