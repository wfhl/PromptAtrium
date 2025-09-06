import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PromptImage {
  id: string;
  url: string;
  file?: File;
  uploading?: boolean;
}

interface PromptImageUploaderProps {
  currentImages?: string[];
  onImagesUpdate?: (imageUrls: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function PromptImageUploader({ 
  currentImages = [], 
  onImagesUpdate, 
  maxImages = 5,
  className = ""
}: PromptImageUploaderProps) {
  const [images, setImages] = useState<PromptImage[]>(() => 
    currentImages.map((url, index) => ({
      id: `existing-${index}`,
      url
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync with currentImages prop changes (important for edit mode)
  useEffect(() => {
    setImages(currentImages.map((url, index) => ({
      id: `existing-${index}`,
      url
    })));
  }, [currentImages]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    const totalImages = images.length + files.length;
    if (totalImages > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images per prompt`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Add new images to state with temporary URLs
    const newImages: PromptImage[] = validFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
      uploading: true
    }));

    setImages(prev => [...prev, ...newImages]);

    // Upload each file
    uploadFiles(newImages);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images.length, maxImages, toast]);

  const uploadFiles = async (newImages: PromptImage[]) => {
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const imageItem of newImages) {
        if (!imageItem.file) continue;

        try {
          // Get upload URL from backend
          const uploadResponse = await apiRequest("POST", "/api/objects/upload");
          const { uploadURL } = await uploadResponse.json();

          // Upload image to object storage
          const uploadResult = await fetch(uploadURL, {
            method: 'PUT',
            body: imageItem.file,
            headers: {
              'Content-Type': imageItem.file.type,
            },
          });

          if (!uploadResult.ok) {
            throw new Error('Failed to upload image');
          }

          // Set ACL policy for the uploaded image
          const updateResponse = await apiRequest("PUT", "/api/prompt-images", {
            imageUrl: uploadURL,
          });

          const { objectPath } = await updateResponse.json();
          uploadedUrls.push(objectPath);

          // Update the image in state with the final URL
          setImages(prev => prev.map(img => 
            img.id === imageItem.id 
              ? { ...img, url: objectPath, uploading: false, file: undefined }
              : img
          ));

        } catch (error) {
          console.error('Error uploading image:', error);
          
          // Remove failed upload from state
          setImages(prev => prev.filter(img => img.id !== imageItem.id));
          
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to upload image",
            variant: "destructive",
          });
        }
      }

      // Update parent component with all current image URLs
      setImages(currentImages => {
        const existingUrls = currentImages.filter(img => !img.uploading && (!img.file || img.url.startsWith('http'))).map(img => img.url);
        const allUrls = Array.from(new Set([...existingUrls, ...uploadedUrls]));
        onImagesUpdate?.(allUrls);
        return currentImages;
      });

    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Update parent with remaining image URLs
      const urls = updated
        .filter(img => !img.uploading && (!img.file || img.url.startsWith('http')))
        .map(img => img.url);
      onImagesUpdate?.(urls);
      return updated;
    });
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="input-prompt-image-files"
      />

      {/* Upload button */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="w-full border-dashed"
          data-testid="button-upload-prompt-images"
        >
          <Upload className="h-4 w-4 mr-2" />
          {images.length === 0 ? "Upload Example Images" : `Add More Images (${images.length}/${maxImages})`}
        </Button>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image) => (
            <Card key={image.id} className="relative overflow-hidden" data-testid={`card-image-${image.id}`}>
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt="Prompt example"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Loading overlay */}
                  {image.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {!image.uploading && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => handleRemoveImage(image.id)}
                      data-testid={`button-remove-image-${image.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload status */}
      {isUploading && (
        <div className="text-sm text-muted-foreground text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Uploading images...
          </div>
        </div>
      )}

      {/* Image count indicator */}
      {images.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {images.length} of {maxImages} images
        </div>
      )}
    </div>
  );
}