import { useState, useEffect } from "react";

interface CollectionPreviewImagesProps {
  collectionId: string;
  maxImages?: number;
}

export function CollectionPreviewImages({ collectionId, maxImages = 4 }: CollectionPreviewImagesProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreviewImages = async () => {
      try {
        // Fetch prompts from this collection
        const response = await fetch(`/api/prompts?collectionId=${collectionId}&limit=10&isPublic=true`);
        if (!response.ok) {
          console.error('Failed to fetch prompts for collection:', collectionId);
          setLoading(false);
          return;
        }

        const prompts = await response.json();
        
        // Extract all images from prompts
        const allImages: string[] = [];
        for (const prompt of prompts) {
          if (prompt.exampleImagesUrl && Array.isArray(prompt.exampleImagesUrl)) {
            allImages.push(...prompt.exampleImagesUrl);
          }
          if (allImages.length >= maxImages) break;
        }

        // Take only the first maxImages
        setPreviewImages(allImages.slice(0, maxImages));
      } catch (error) {
        console.error('Error fetching preview images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewImages();
  }, [collectionId, maxImages]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-1 mb-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square rounded bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (previewImages.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-1 mb-3">
      {previewImages.slice(0, 4).map((imageUrl, index) => (
        <div key={index} className="aspect-square rounded overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={`Preview ${index + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ))}
      {/* Fill empty slots with placeholders */}
      {previewImages.length < 4 && [...Array(4 - previewImages.length)].map((_, i) => (
        <div key={`placeholder-${i}`} className="aspect-square rounded bg-muted/50" />
      ))}
    </div>
  );
}