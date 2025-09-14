import React, { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { UnifiedFilters } from "./UnifiedFilters";
import { FavoriteButton } from "./FavoriteButton";

interface ListViewConfig<T> {
  title: string;
  apiEndpoint: string;
  favoriteItemType: string;
  searchPlaceholder?: string;
  categoryLabel?: string;
  renderListItem: (item: T) => {
    id: number;
    title: string;
    description: string;
    categories?: string[] | null;
    tags?: string[] | null;
    era?: string | null;
    metadata?: { [key: string]: any };
    actions?: React.ReactNode;
  };
  searchFields?: (keyof T)[];
  categoryField?: keyof T;
  alphabetField?: keyof T;
}

interface ListViewProps<T> {
  config: ListViewConfig<T>;
}

export default function ListView<T>({ config }: ListViewProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("alphabetical");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [config.apiEndpoint]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(config.apiEndpoint);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };

  // Extract filtering data structures
  const categories = useMemo(() => {
    if (!config.categoryField) return [];
    const categorySet = new Set<string>();
    items.forEach((item: any) => {
      const categories = item[config.categoryField!];
      if (Array.isArray(categories)) {
        categories.forEach(cat => cat && categorySet.add(cat));
      } else if (typeof categories === 'string' && categories) {
        categorySet.add(categories);
      }
    });
    return Array.from(categorySet).sort();
  }, [items, config.categoryField]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item: any) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => tag && tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLetter(null);
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  // Apply filters
  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      // Search filter
      if (searchTerm && config.searchFields) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = config.searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && config.categoryField) {
        const categoryValue = item[config.categoryField];
        if (categoryValue !== selectedCategory) return false;
      }

      // Alphabet filter
      if (selectedLetter && config.alphabetField) {
        const value = item[config.alphabetField];
        if (!value || !value.toString().toUpperCase().startsWith(selectedLetter)) {
          return false;
        }
      }

      // Tag filter
      if (selectedTags.length > 0) {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        const hasAllTags = selectedTags.every(tag => item.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [items, searchTerm, selectedCategory, selectedLetter, selectedTags, config]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    
    switch (sortBy) {
      case "alphabetical":
        if (config.alphabetField) {
          sorted.sort((a: any, b: any) => {
            const aVal = a[config.alphabetField!] || "";
            const bVal = b[config.alphabetField!] || "";
            return aVal.toString().localeCompare(bVal.toString());
          });
        }
        break;
      case "newest":
        sorted.sort((a: any, b: any) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return bDate - aDate;
        });
        break;
      case "oldest":
        sorted.sort((a: any, b: any) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return aDate - bDate;
        });
        break;
    }
    
    return sorted;
  }, [filteredItems, sortBy, config.alphabetField]);

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <UnifiedFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedLetter={selectedLetter}
        onLetterChange={setSelectedLetter}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        categories={categories}
        tags={allTags}
        onClearFilters={clearFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchPlaceholder={config.searchPlaceholder}
        categoryLabel={config.categoryLabel}
      />

      {/* List Items */}
      <div className="space-y-2">
        {sortedItems.map((item: any) => {
          const listItem = config.renderListItem(item);
          const isExpanded = expandedItems.has(listItem.id);

          return (
            <div
              key={listItem.id}
              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(listItem.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <h3 className="font-semibold text-lg">{listItem.title}</h3>
                    {listItem.era && (
                      <Badge variant="secondary" className="ml-2">
                        {listItem.era}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 ml-7">
                    {listItem.description}
                  </p>

                  {listItem.categories && listItem.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-7">
                      {listItem.categories.map((cat, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {listItem.tags && listItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-7">
                      {listItem.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {isExpanded && listItem.metadata && (
                    <div className="mt-4 ml-7 space-y-1">
                      {Object.entries(listItem.metadata).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-sm">
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            {key}:
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <FavoriteButton
                    itemId={listItem.id}
                    itemType={config.favoriteItemType}
                    size="sm"
                  />
                  {listItem.actions}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {sortedItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items found matching your filters
        </div>
      )}
    </div>
  );
}