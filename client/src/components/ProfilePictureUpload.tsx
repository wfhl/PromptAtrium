import { useState, useRef, useEffect } from "react";
import { redirectToLogin } from "@/utils/auth-redirect";
import Croppie from "croppie";
import "croppie/croppie.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate?: (imageUrl: string) => void;
  className?: string;
}

export function ProfilePictureUpload({ 
  currentImageUrl, 
  onImageUpdate, 
  className = ""
}: ProfilePictureUploadProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const croppieRef = useRef<HTMLDivElement>(null);
  const croppieInstance = useRef<Croppie | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize Croppie when cropper is shown (no modal timing issues)
  useEffect(() => {
    if (showCropper && selectedFile && croppieRef.current) {
      console.log('Initializing Croppie...');
      
      // Clean up existing instance
      if (croppieInstance.current) {
        croppieInstance.current.destroy();
        croppieInstance.current = null;
      }
      
      // Simple timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        if (!croppieRef.current || !selectedFile) return;

        try {
          // Initialize Croppie
          croppieInstance.current = new Croppie(croppieRef.current, {
            enableExif: true,
            viewport: {
              width: 200,
              height: 200,
              type: 'circle'
            },
            boundary: {
              width: 300,
              height: 300
            }
          });
          console.log('✅ Croppie initialized');

          // Bind image immediately
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result && croppieInstance.current) {
              croppieInstance.current.bind({
                url: e.target.result as string
              }).then(() => {
                console.log('✅ Image bound to Croppie!');
              }).catch((error) => {
                console.error('❌ Bind error:', error);
                toast({
                  title: "Error",
                  description: "Failed to load image for cropping",
                  variant: "destructive",
                });
              });
            }
          };
          reader.readAsDataURL(selectedFile);
        } catch (error) {
          console.error('❌ Croppie initialization error:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // Clean up when cropper is hidden
    if (!showCropper && croppieInstance.current) {
      croppieInstance.current.destroy();
      croppieInstance.current = null;
    }
  }, [showCropper, selectedFile, toast]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (croppieInstance.current) {
        croppieInstance.current.destroy();
        croppieInstance.current = null;
      }
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setShowCropper(true);
    }
  };

  const handleCropAndUpload = async () => {
    if (!croppieInstance.current) {
      toast({
        title: "Error",
        description: "No image selected for cropping",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Get cropped image as blob
      const croppedBlob = await new Promise<Blob>((resolve) => {
        croppieInstance.current!.result({
          type: 'blob',
          size: { width: 200, height: 200 },
          format: 'jpeg',
          quality: 0.9
        }).then((blob) => {
          resolve(blob as Blob);
        });
      });

      // Get upload URL from backend
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const { uploadURL } = await uploadResponse.json();

      let uploadedPath: string;

      // Check if this is a development fallback URL or a signed URL
      if (uploadURL.startsWith('/api/objects/upload-direct/') || uploadURL.startsWith('/api/dev-upload/')) {
        // Development fallback: upload directly to the endpoint
        const uploadResult = await fetch(uploadURL, {
          method: 'PUT',
          body: croppedBlob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
          credentials: 'include', // Include cookies for authentication
        });

        if (!uploadResult.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResult.json();
        uploadedPath = uploadData.objectPath || uploadData.path;
      } else {
        // Production: use signed URL
        const uploadResult = await fetch(uploadURL, {
          method: 'PUT',
          body: croppedBlob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });

        if (!uploadResult.ok) {
          throw new Error('Failed to upload image');
        }

        uploadedPath = uploadURL;
      }

      // Update profile with new image URL
      const updateResponse = await apiRequest("PUT", "/api/profile-picture", {
        profileImageUrl: uploadedPath,
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile picture');
      }

      const { objectPath } = await updateResponse.json();

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });

      // Call the callback with the new image path
      onImageUpdate?.(objectPath);

      // Hide cropper and reset state
      setShowCropper(false);
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Your session has expired. Redirecting to login...",
          variant: "destructive",
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          redirectToLogin();
        }, 1500);
      } else {
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload profile picture",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        data-testid="input-profile-picture-file"
      />

      {/* Upload Button/Avatar */}
      <div className={`relative ${className}`}>
        <div 
          className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/50 hover:border-primary/50 cursor-pointer flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors group"
          onClick={triggerFileSelect}
          data-testid="button-upload-profile-picture"
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground group-hover:text-primary">Upload</span>
            </div>
          )}
          
          {/* Overlay for existing image */}
          {currentImageUrl && (
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Inline Cropper (when image selected) */}
      {showCropper && selectedFile && (
        <div className="mt-6 space-y-4" data-testid="inline-crop-container">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Crop Profile Picture
          </h3>
          
          <p className="text-sm text-muted-foreground">
            Adjust the crop area to frame your profile picture. The image will be resized to 200x200 pixels.
          </p>
          
          {/* Croppie container */}
          <div className="flex justify-center">
            <div 
              ref={croppieRef} 
              className="w-[300px] h-[300px]"
              data-testid="croppie-container"
              style={{ 
                minWidth: '300px', 
                minHeight: '300px'
              }}
            />
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
              data-testid="button-cancel-crop"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCropAndUpload}
              disabled={isUploading}
              data-testid="button-save-crop"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Picture
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}