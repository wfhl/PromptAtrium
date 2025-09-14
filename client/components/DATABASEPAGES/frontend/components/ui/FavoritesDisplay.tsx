import React, { useState, useEffect } from "react";
import { Heart, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card } from "./Card";

interface FavoritesDisplayProps {
  favoriteItemType: string;
  renderFavoriteItem: (item: any) => {
    id: number;
    title: string;
    description?: string;
    categories?: string[] | null;
    actions?: React.ReactNode;
  };
  onItemClick?: (item: any) => void;
}

export function FavoritesDisplay({ 
  favoriteItemType, 
  renderFavoriteItem, 
  onItemClick 
}: FavoritesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch favorites for this item type
  useEffect(() => {
    fetchFavorites();
  }, [favoriteItemType]);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/favorites/type/${favoriteItemType}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
    setIsLoading(false);
  };

  const removeFavorite = async (itemId: number) => {
    try {
      const response = await fetch('/api/favorites/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType: favoriteItemType }),
      });

      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== itemId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 p-3">
          <Heart className="h-4 w-4 text-red-400 fill-current" />
          <span className="text-sm font-medium">Loading favorites...</span>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return null; // Don't show section if no favorites
  }

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        className="w-full justify-between p-3 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-400 fill-current" />
          <span className="text-sm font-medium">
            Favorites
          </span>
          <Badge variant="secondary" className="ml-2">
            {favorites.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-2 space-y-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {favorites.map(favorite => {
            const item = renderFavoriteItem(favorite);
            
            return (
              <Card
                key={item.id}
                className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => onItemClick?.(favorite)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.categories && item.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.categories.slice(0, 3).map((cat, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {item.categories.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {item.actions}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(item.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}