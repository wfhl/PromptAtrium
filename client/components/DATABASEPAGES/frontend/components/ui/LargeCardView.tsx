import React, { useState, useMemo, useEffect } from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card, CardContent, CardHeader } from "./Card";
import { Separator } from "./Separator";
import { UnifiedFilters } from "./UnifiedFilters";
import { FavoriteButton } from "./FavoriteButton";

interface LargeCardConfig<T> {
  title: string;
  apiEndpoint: string;
  favoriteItemType: string;
  renderLargeCard: (item: T) => {
    id: number;
    title: string;
    description: string;
    categories?: string[] | null;
    tags?: string[] | null;
    era?: string | null;
    colorClass?: string;
    icon?: React.ReactNode;
    metadata?: { [key: string]: any };
    actions?: React.ReactNode;
    content?: React.ReactNode;
  };
  searchFields?: (keyof T)[];
  categoryField?: keyof T;
  alphabetField?: keyof T;
}

interface LargeCardViewProps<T> {
  config: LargeCardConfig<T>;
}

export default function LargeCardView<T>({ config }: LargeCardViewProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("alphabetical");
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

  // Extract unique categories
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

  // Extract unique tags from items
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

  // Filter and search logic
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
        if (Array.isArray(categoryValue)) {
          if (!categoryValue.includes(selectedCategory)) return false;
        } else if (categoryValue !== selectedCategory) {
          return false;
        }
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
      />

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item: any) => {
          const cardData = config.renderLargeCard(item);
          
          return (
            <Card key={cardData.id} className={cardData.colorClass}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {cardData.icon && (
                      <div className="mt-1 text-gray-400">
                        {cardData.icon}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{cardData.title}</h3>
                      {cardData.era && (
                        <Badge variant="secondary" className="mt-1">
                          {cardData.era}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <FavoriteButton
                    itemId={cardData.id}
                    itemType={config.favoriteItemType}
                    size="sm"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cardData.description}
                </p>
                
                {cardData.categories && cardData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cardData.categories.map((cat, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {cardData.tags && cardData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cardData.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {cardData.metadata && Object.keys(cardData.metadata).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      {Object.entries(cardData.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {cardData.content && (
                  <>
                    <Separator />
                    {cardData.content}
                  </>
                )}
                
                {cardData.actions && (
                  <>
                    <Separator />
                    <div className="flex justify-end">
                      {cardData.actions}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Results count */}
      {sortedItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items found matching your filters
        </div>
      )}
    </div>
  );
}