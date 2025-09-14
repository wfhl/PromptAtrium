import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ComponentChip } from "./ComponentChip";
import { ComponentItem } from "./CategoryAccordion";
import {
  Search,
  X,
  Filter,
  SortAsc,
  SortDesc,
  Sparkles,
  TrendingUp,
  Clock,
  Hash,
  Command,
} from "lucide-react";

interface ComponentSearchProps {
  categories: Array<{
    id: string;
    name: string;
    components: ComponentItem[];
  }>;
  selectedComponents: Set<string>;
  onToggleComponent: (componentId: string) => void;
  onBulkSelect?: (componentIds: string[]) => void;
  onBulkDeselect?: (componentIds: string[]) => void;
  className?: string;
}

type SortOption = "alphabetical" | "popularity" | "recent" | "category";
type FilterOption = "all" | "selected" | "unselected" | "popular" | "new";

export function ComponentSearch({
  categories,
  selectedComponents,
  onToggleComponent,
  onBulkSelect,
  onBulkDeselect,
  className,
}: ComponentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("alphabetical");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);

  // Flatten all components with category info
  const allComponents = useMemo(() => {
    const components: Array<ComponentItem & { categoryId: string; categoryName: string }> = [];
    categories.forEach((category) => {
      category.components.forEach((comp) => {
        components.push({
          ...comp,
          categoryId: category.id,
          categoryName: category.name,
        });
      });
    });
    return components;
  }, [categories]);

  // Filter components
  const filteredComponents = useMemo(() => {
    let filtered = allComponents;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((comp) => comp.categoryId === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (comp) =>
          comp.value.toLowerCase().includes(query) ||
          comp.description?.toLowerCase().includes(query) ||
          comp.categoryName.toLowerCase().includes(query) ||
          comp.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Selection filter
    switch (filterOption) {
      case "selected":
        filtered = filtered.filter((comp) => selectedComponents.has(comp.id));
        break;
      case "unselected":
        filtered = filtered.filter((comp) => !selectedComponents.has(comp.id));
        break;
      case "popular":
        filtered = filtered.filter((comp) => (comp.usageCount || 0) > 10);
        break;
      case "new":
        // Filter for recently added (you'd need a createdAt field for this)
        break;
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "alphabetical":
          return a.value.localeCompare(b.value);
        case "popularity":
          return (b.usageCount || 0) - (a.usageCount || 0);
        case "category":
          return a.categoryName.localeCompare(b.categoryName);
        case "recent":
          // You'd need a lastUsedAt or createdAt field for this
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allComponents, searchQuery, selectedCategory, filterOption, selectedComponents, sortOption]);

  // Quick filter presets
  const quickFilters = [
    { label: "Most Popular", icon: <TrendingUp className="h-3 w-3" />, action: () => { setSortOption("popularity"); setFilterOption("popular"); } },
    { label: "Selected", icon: <Sparkles className="h-3 w-3" />, action: () => setFilterOption("selected") },
    { label: "Recent", icon: <Clock className="h-3 w-3" />, action: () => setSortOption("recent") },
  ];

  // Keyboard shortcut for opening search
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen(true);
    }
  }, []);

  // Add keyboard listener
  useState(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleSelectAll = () => {
    const unselectedIds = filteredComponents
      .filter((comp) => !selectedComponents.has(comp.id))
      .map((comp) => comp.id);
    
    if (onBulkSelect) {
      onBulkSelect(unselectedIds);
    } else {
      unselectedIds.forEach((id) => onToggleComponent(id));
    }
  };

  const handleDeselectAll = () => {
    const selectedIds = filteredComponents
      .filter((comp) => selectedComponents.has(comp.id))
      .map((comp) => comp.id);
    
    if (onBulkDeselect) {
      onBulkDeselect(selectedIds);
    } else {
      selectedIds.forEach((id) => onToggleComponent(id));
    }
  };

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={cn("justify-start gap-2", className)}
        data-testid="open-search"
      >
        <Search className="h-4 w-4" />
        <span>Search components...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Component Search</DialogTitle>
            <DialogDescription>
              Search and filter through all available components
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 border-b">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search components, categories, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                autoFocus
                data-testid="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  data-testid="clear-search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]" data-testid="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.components.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-[150px]" data-testid="sort-options">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-3 w-3" />
                      Alphabetical
                    </div>
                  </SelectItem>
                  <SelectItem value="popularity">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Popularity
                    </div>
                  </SelectItem>
                  <SelectItem value="category">
                    <div className="flex items-center gap-2">
                      <Hash className="h-3 w-3" />
                      Category
                    </div>
                  </SelectItem>
                  <SelectItem value="recent">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Recent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Options */}
              <Select value={filterOption} onValueChange={(v) => setFilterOption(v as FilterOption)}>
                <SelectTrigger className="w-[140px]" data-testid="filter-options">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="unselected">Unselected</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>

              {/* Quick Filters */}
              <div className="flex gap-1 ml-auto">
                {quickFilters.map((filter) => (
                  <Button
                    key={filter.label}
                    variant="ghost"
                    size="sm"
                    onClick={filter.action}
                    className="h-8"
                    data-testid={`quick-filter-${filter.label}`}
                  >
                    {filter.icon}
                    <span className="ml-1 text-xs">{filter.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <ScrollArea className="h-[400px] px-6">
            <div className="py-4">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Found {filteredComponents.length} components
                  {searchQuery && ` for "${searchQuery}"`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={filteredComponents.every((c) => selectedComponents.has(c.id))}
                    data-testid="select-all-results"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={!filteredComponents.some((c) => selectedComponents.has(c.id))}
                    data-testid="deselect-all-results"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Component Grid */}
              {filteredComponents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No components found matching your criteria
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group by category if sorting by category */}
                  {sortOption === "category" ? (
                    <>
                      {Array.from(new Set(filteredComponents.map((c) => c.categoryName))).map(
                        (categoryName) => (
                          <div key={categoryName}>
                            <h3 className="text-sm font-medium mb-2 text-muted-foreground">
                              {categoryName}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {filteredComponents
                                .filter((c) => c.categoryName === categoryName)
                                .map((component) => (
                                  <ComponentChip
                                    key={component.id}
                                    id={component.id}
                                    value={component.value}
                                    description={component.description}
                                    selected={selectedComponents.has(component.id)}
                                    onToggle={onToggleComponent}
                                    usageCount={component.usageCount}
                                  />
                                ))}
                            </div>
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredComponents.map((component) => (
                        <div key={component.id} className="relative group">
                          <ComponentChip
                            id={component.id}
                            value={component.value}
                            description={component.description}
                            selected={selectedComponents.has(component.id)}
                            onToggle={onToggleComponent}
                            usageCount={component.usageCount}
                          />
                          <Badge
                            variant="outline"
                            className="absolute -top-2 -right-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {component.categoryName}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-muted/50 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {selectedComponents.size} components selected
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}