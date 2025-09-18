import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PromptAIExtractorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtracted: (data: any) => void;
}

export function PromptAIExtractor({ open, onOpenChange, onExtracted }: PromptAIExtractorProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractionMode, setExtractionMode] = useState<'content' | 'content_and_name' | 'all_fields'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleAnalyze = async () => {
    if (!image) {
      toast({
        title: "No image selected",
        description: "Please select an image to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Extract base64 data from data URL
      const base64Data = image.split(',')[1];
      
      const response = await apiRequest("POST", "/api/ai/extract-prompt-from-image", {
        imageBase64: base64Data,
        extractionMode
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Pass the extracted data to parent component
      onExtracted(result);
      
      toast({
        title: "Success",
        description: "Prompt extracted successfully!"
      });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset state
      setImage(null);
      setImageFile(null);
      setExtractionMode('content');
    } catch (error: any) {
      console.error('Extraction failed:', error);
      
      // Check if it's a quota error and provide helpful message
      const errorMessage = error?.message || error?.error || String(error);
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        toast({
          title: "AI API Quota Error",
          description: "You've exceeded your Gemini API quota. Please wait a moment and try again, or check your API limits.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Extraction failed",
          description: errorMessage || "Failed to extract prompt from image",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="modal-ai-extractor">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Extract Prompt from Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-purple-400 bg-purple-400/10' : 'border-muted-foreground/25'}
              ${image ? 'pb-4' : 'cursor-pointer hover:border-purple-400/50'}
            `}
            onClick={() => !image && fileInputRef.current?.click()}
          >
            {image ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img 
                    src={image} 
                    alt="Selected" 
                    className="max-h-64 rounded-lg shadow-lg"
                    data-testid="image-preview"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    data-testid="button-clear-image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {imageFile?.name}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-purple-400/20 p-4">
                  <Upload className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Drop an image here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a screenshot containing a prompt (max 10MB)
                  </p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              data-testid="input-file"
            />
          </div>

          {/* Extraction Options */}
          {image && (
            <Card className="p-4">
              <Label className="mb-3 block text-sm font-medium">
                What would you like to extract?
              </Label>
              <RadioGroup 
                value={extractionMode} 
                onValueChange={(value) => setExtractionMode(value as any)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="content" id="content" />
                  <Label htmlFor="content" className="cursor-pointer flex-1">
                    <div className="font-medium">Prompt content only</div>
                    <div className="text-xs text-muted-foreground">Extract just the prompt text</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="content_and_name" id="content_and_name" />
                  <Label htmlFor="content_and_name" className="cursor-pointer flex-1">
                    <div className="font-medium">Prompt content + Name</div>
                    <div className="text-xs text-muted-foreground">Extract prompt and generate a descriptive name</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_fields" id="all_fields" />
                  <Label htmlFor="all_fields" className="cursor-pointer flex-1">
                    <div className="font-medium">All possible fields</div>
                    <div className="text-xs text-muted-foreground">Extract and infer category, tags, style, and more</div>
                  </Label>
                </div>
              </RadioGroup>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={!image || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              data-testid="button-analyze"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Image
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}