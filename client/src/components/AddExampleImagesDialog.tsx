import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Prompt } from "@shared/schema";

interface AddExampleImagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt;
}

interface ImageUpload {
  id: string;
  url: string;
  file: File;
  uploading?: boolean;
  error?: string;
}

export function AddExampleImagesDialog({ open, onOpenChange, prompt }: AddExampleImagesDialogProps) {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const contributeMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/contribute-images`, {
        imageUrls
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to contribute images");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Images contributed!",
        description: `Your example images have been added to "${prompt.name}"`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/prompts/${prompt.id}`] });
      onOpenChange(false);
      setImages([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to contribute images",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Limit to 5 images per contribution
    if (images.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can contribute up to 5 images at a time",
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
    const newImages: ImageUpload[] = validFiles.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file,
      uploading: false
    }));

    setImages(prev => [...prev, ...newImages]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images.length, toast]);

  const removeImage = (imageId: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image?.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const uploadAndContribute = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to contribute",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const imageItem of images) {
        // Update image status to uploading
        setImages(prev => prev.map(img => 
          img.id === imageItem.id ? { ...img, uploading: true } : img
        ));

        try {
          // Get upload URL from backend
          const uploadResponse = await apiRequest("POST", "/api/objects/upload");
          if (!uploadResponse.ok) {
            throw new Error(`Failed to get upload URL: ${uploadResponse.status} ${uploadResponse.statusText}`);
          }
          const uploadResponseData = await uploadResponse.json();
          const uploadURL = uploadResponseData.uploadURL;

          // Upload image to object storage
          let uploadedImagePath: string;
          
          // Check if this is a development URL or production signed URL
          if (uploadURL.startsWith('/api/dev-upload/') || uploadURL.startsWith('/api/objects/upload-direct/')) {
            // Development: upload directly to the endpoint
            const uploadResult = await fetch(uploadURL, {
              method: 'PUT',
              body: imageItem.file,
              headers: {
                'Content-Type': imageItem.file.type,
              },
              credentials: 'include',
            });

            if (!uploadResult.ok) {
              throw new Error(`Failed to upload image: ${uploadResult.status}`);
            }
            
            const uploadData = await uploadResult.json();
            uploadedImagePath = uploadData.objectPath || uploadData.path;
          } else {
            // Production: use signed URL
            const uploadResult = await fetch(uploadURL, {
              method: 'PUT',
              body: imageItem.file,
              headers: {
                'Content-Type': imageItem.file.type,
              },
            });

            if (!uploadResult.ok) {
              throw new Error(`Failed to upload image: ${uploadResult.status}`);
            }
            
            uploadedImagePath = uploadURL;
          }

          // Set ACL policy for the uploaded image
          const updateResponse = await apiRequest("PUT", "/api/prompt-images", {
            imageUrl: uploadedImagePath,
          });

          if (!updateResponse.ok) {
            console.warn("Failed to set ACL policy for image, continuing anyway");
          }
          const updateData = await updateResponse.json();
          
          uploadedUrls.push(updateData.normalizedPath || uploadedImagePath);

          // Mark image as uploaded
          setImages(prev => prev.map(img => 
            img.id === imageItem.id ? { ...img, uploading: false } : img
          ));
        } catch (error) {
          console.error(`Failed to upload image ${imageItem.id}:`, error);
          setImages(prev => prev.map(img => 
            img.id === imageItem.id 
              ? { ...img, uploading: false, error: error instanceof Error ? error.message : 'Upload failed' }
              : img
          ));
          throw error;
        }
      }

      // Contribute the uploaded images to the prompt
      await contributeMutation.mutateAsync(uploadedUrls);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      // Clean up blob URLs
      images.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
      setImages([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Contribute Example Images</DialogTitle>
          <DialogDescription>
            Add example images to help others understand how "{prompt.name}" works. 
            You can contribute up to 5 images at a time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload area */}
          <Card 
            className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <div className="p-8 text-center">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Click to upload images
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB each
              </p>
            </div>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {/* Image preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <Card className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={image.url}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      {image.error && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <p className="text-xs text-red-500 text-center px-2">{image.error}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                  {!isUploading && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                      data-testid={`button-remove-image-${image.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            data-testid="button-cancel-contribution"
          >
            Cancel
          </Button>
          <Button
            onClick={uploadAndContribute}
            disabled={images.length === 0 || isUploading}
            data-testid="button-contribute-images"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Contribute {images.length > 0 && `(${images.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}