import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "./Button";
import { useToast } from "../../utils/useToast";

interface FavoriteButtonProps {
  itemId: number;
  itemType: string;
  initialIsFavorited?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({ 
  itemId, 
  itemType, 
  initialIsFavorited = false,
  size = "md",
  className = "",
  onToggle
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Check current favorite status from server on mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [itemId, itemType]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites/check/${itemType}/${itemId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorite);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    // Optimistic update - update UI immediately
    const newFavoriteState = !isFavorited;
    setIsFavorited(newFavoriteState);
    setIsLoading(true);
    
    try {
      const requestBody = { itemId, itemType };
      
      // Make the actual API call based on current state
      const endpoint = isFavorited ? '/api/favorites/remove' : '/api/favorites/add';
      const method = isFavorited ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle favorite status');
      }
      
      // Call the onToggle callback if provided
      if (onToggle) {
        onToggle(newFavoriteState);
      }
      
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorited(!newFavoriteState);
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`${sizeClasses[size]} ${className}`}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={`${iconSizes[size]} ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'} transition-colors`}
      />
    </Button>
  );
}