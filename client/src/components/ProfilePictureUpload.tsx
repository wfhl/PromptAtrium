import { useState, useRef, useEffect } from "react";
import Croppie from "croppie";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const croppieRef = useRef<HTMLDivElement>(null);
  const croppieInstance = useRef<Croppie | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Simplified Croppie initialization
  useEffect(() => {
    if (!isModalOpen || !selectedFile || !croppieRef.current) {
      return;
    }

    // Clean up existing instance
    if (croppieInstance.current) {
      croppieInstance.current.destroy();
      croppieInstance.current = null;
    }

    console.log('Starting Croppie initialization...');

    // Simple timeout to allow modal to fully render
    const timer = setTimeout(() => {
      if (!croppieRef.current || !isModalOpen) {
        console.log('Container or modal not available');
        return;
      }

      console.log('Container element:', croppieRef.current);
      console.log('Container dimensions:', {
        width: croppieRef.current.offsetWidth,
        height: croppieRef.current.offsetHeight,
        visible: croppieRef.current.offsetParent !== null
      });

      try {
        // Initialize Croppie with basic settings
        console.log('Creating Croppie instance...');
        croppieInstance.current = new Croppie(croppieRef.current, {
          viewport: { width: 200, height: 200, type: 'circle' },
          boundary: { width: 350, height: 350 },
          showZoomer: true,
          enableOrientation: true
        });

        console.log('Croppie created, reading file...');

        // Read and bind the file
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && croppieInstance.current) {
            console.log('File read, binding to Croppie...');
            croppieInstance.current.bind({
              url: e.target.result as string
            }).then(() => {
              console.log('✅ Croppie bound successfully!');
            }).catch((error) => {
              console.error('❌ Croppie bind error:', error);
            });
          }
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
        };
        reader.readAsDataURL(selectedFile);

      } catch (error) {
        console.error('❌ Croppie initialization error:', error);
      }
    }, 300); // Increased delay for modal animation

    return () => {
      clearTimeout(timer);
    };
  }, [isModalOpen, selectedFile]);

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
      setIsModalOpen(true);
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

      // Upload cropped image to object storage
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

      // Update profile with new image URL
      const updateResponse = await apiRequest("PUT", "/api/profile-picture", {
        profileImageUrl: uploadURL,
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

      // Close modal and reset state
      setIsModalOpen(false);
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
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

      {/* Cropping Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="sm:max-w-[450px]" 
          data-testid="modal-crop-profile-picture"
          onOpenAutoFocus={(e) => {
            // Prevent auto-focus to allow Croppie to initialize properly
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Crop Profile Picture
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adjust the crop area to frame your profile picture. The image will be resized to 200x200 pixels.
            </p>
            
            {/* Croppie container - simplified setup */}
            <div className="flex justify-center">
              <div 
                ref={croppieRef} 
                className="w-[350px] h-[350px] border border-gray-300 bg-gray-50"
                data-testid="croppie-container"
                style={{ 
                  minWidth: '350px', 
                  minHeight: '350px',
                  position: 'relative'
                }}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}