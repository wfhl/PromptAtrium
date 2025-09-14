import React from "react";
import { Search, X, Filter, SortAsc } from "lucide-react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface UnifiedFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (value: string | null) => void;
  selectedLetter: string | null;
  onLetterChange: (value: string | null) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  categories: string[];
  tags: string[];
  onClearFilters: () => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  searchPlaceholder?: string;
  categoryLabel?: string;
  enableAlphabetFilter?: boolean;
  enableCategoryFilter?: boolean;
  enableSearch?: boolean;
}

export function UnifiedFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLetter,
  onLetterChange,
  selectedTags,
  onTagsChange,
  categories,
  tags,
  onClearFilters,
  sortBy = "alphabetical",
  onSortChange,
  searchPlaceholder = "Search...",
  categoryLabel = "Category",
  enableAlphabetFilter = true,
  enableCategoryFilter = true,
  enableSearch = true,
}: UnifiedFiltersProps) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  
  const hasActiveFilters = 
    searchTerm || 
    selectedCategory || 
    selectedLetter || 
    selectedTags.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex gap-4">
        {enableSearch && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {onSortChange && (
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-40"
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </Select>
        )}
      </div>

      {/* Category Filter */}
      {enableCategoryFilter && categories.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{categoryLabel}:</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Alphabet Filter */}
      {enableAlphabetFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter by:</span>
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedLetter === null ? "default" : "outline"}
              size="sm"
              onClick={() => onLetterChange(null)}
              className="h-7 px-2"
            >
              All
            </Button>
            {alphabet.map((letter) => (
              <Button
                key={letter}
                variant={selectedLetter === letter ? "default" : "outline"}
                size="sm"
                onClick={() => onLetterChange(letter)}
                className="h-7 w-7 p-0"
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tags:</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    onTagsChange(selectedTags.filter((t) => t !== tag));
                  } else {
                    onTagsChange([...selectedTags, tag]);
                  }
                }}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}