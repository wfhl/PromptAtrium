import React, { useState, useEffect, useMemo } from "react";
import { Button } from "./Button";
import { cn } from "../../utils/cn";
import { MiniCardExpandableCards } from "./MiniCardExpandableCards";
import { UnifiedFilters } from "./UnifiedFilters";
import { FavoriteButton } from "./FavoriteButton";

// Generic data item interface
interface DataItem {
  id: number;
  name?: string;
  [key: string]: any;
}

// Card data structure for the expandable cards component
interface CardData {
  id: number;
  title: string;
  description: string;
  categories?: string[] | null;
  tags?: string[] | null;
  era?: string | null;
  colorClass?: string;
  heartIcon?: React.ReactElement;
  expandedContent: () => React.ReactElement;
}

// Configuration for MiniCard view
export interface MiniCardConfig<T> {
  title: string;
  apiEndpoint: string;
  favoriteItemType: string;
  renderCard: (item: T) => CardData;
  searchFields?: (keyof T)[];
  categoryField?: keyof T;
  alphabetField?: keyof T;
  enableAlphabetFilter?: boolean;
  enableCategoryFilter?: boolean;
  enableSearch?: boolean;
}

interface MiniCardViewProps<T> {
  config: MiniCardConfig<T>;
}

export default function MiniCardView<T extends DataItem>({ config }: MiniCardViewProps<T>) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>("alphabetical");
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 200;

  // Fetch data from the API
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

  // Extract unique categories if category field is specified
  const categories = useMemo(() => {
    if (!config.categoryField) return [];
    const categorySet = new Set<string>();
    items.forEach((item: T) => {
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
    items.forEach((item: T) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => tag && tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [items]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    return items.filter((item: T) => {
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
          sorted.sort((a, b) => {
            const aVal = a[config.alphabetField] || "";
            const bVal = b[config.alphabetField] || "";
            return aVal.toString().localeCompare(bVal.toString());
          });
        }
        break;
      case "newest":
        sorted.sort((a, b) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return bDate - aDate;
        });
        break;
      case "oldest":
        sorted.sort((a, b) => {
          const aDate = new Date(a.created_at || 0).getTime();
          const bDate = new Date(b.created_at || 0).getTime();
          return aDate - bDate;
        });
        break;
    }
    
    return sorted;
  }, [filteredItems, sortBy, config.alphabetField]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedItems.slice(startIndex, endIndex);
  }, [sortedItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

  // Convert items to card data
  const cards = useMemo(() => {
    return paginatedItems.map(item => {
      const cardData = config.renderCard(item);
      
      // Add favorite button to the card
      return {
        ...cardData,
        heartIcon: (
          <FavoriteButton
            itemId={item.id}
            itemType={config.favoriteItemType}
            size="sm"
          />
        )
      };
    });
  }, [paginatedItems, config]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLetter(null);
    setSelectedCategory(null);
    setSelectedTags([]);
    setCurrentPage(1);
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
      {/* Filters and Controls */}
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
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        categoryLabel="Category"
        enableAlphabetFilter={config.enableAlphabetFilter !== false}
        enableCategoryFilter={config.enableCategoryFilter !== false && categories.length > 0}
        enableSearch={config.enableSearch !== false}
      />

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {sortedItems.length === items.length ? (
          <span>Showing {sortedItems.length} items</span>
        ) : (
          <span>Showing {sortedItems.length} of {items.length} items</span>
        )}
      </div>

      {/* Cards Grid */}
      <MiniCardExpandableCards cards={cards} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="flex items-center px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}