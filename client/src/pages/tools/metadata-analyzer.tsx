import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileSearch, Upload, Download, RotateCcw, FileImage } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageMetadata {
  basic: {
    fileName: string;
    fileSize: string;
    fileType: string;
    dimensions: string;
    aspectRatio: string;
    lastModified: string;
  };
  exif?: Record<string, any>;
  raw?: Record<string, any>;
}

export default function MetadataAnalyzerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      analyzeImage(file);
    }
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    
    try {
      // Create an image element to get dimensions
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Calculate aspect ratio
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(img.width, img.height);
      const aspectRatio = `${img.width / divisor}:${img.height / divisor}`;

      // Basic metadata
      const basicMetadata = {
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        dimensions: `${img.width} × ${img.height}`,
        aspectRatio: aspectRatio,
        lastModified: new Date(file.lastModified).toLocaleString()
      };

      setMetadata({
        basic: basicMetadata,
        exif: {},
        raw: {
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
      });

      URL.revokeObjectURL(url);
      
      toast({
        title: "Analysis complete",
        description: "Image metadata extracted successfully"
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze image metadata",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadMetadata = () => {
    if (!metadata) return;
    
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `metadata-${selectedFile?.name?.replace(/\.[^/.]+$/, "")}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileSearch className="h-6 w-6" />
              Image Metadata Analyzer
            </CardTitle>
            <CardDescription>
              Upload images to extract comprehensive metadata and image information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Area */}
            {!selectedFile ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                <FileImage className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Drop your image here</h3>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <>
                {/* Image Preview and Metadata */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image Preview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Image Preview</h3>
                    <div className="border rounded-lg overflow-hidden bg-muted/10">
                      {imagePreview && (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-auto max-h-96 object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Metadata Display */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Metadata</h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={downloadMetadata}
                          disabled={!metadata}
                          data-testid="button-download-metadata"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleReset}
                          data-testid="button-reset"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </div>

                    {isAnalyzing ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Analyzing image...</p>
                      </div>
                    ) : metadata ? (
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                          <TabsTrigger value="raw">Raw Data</TabsTrigger>
                        </TabsList>
                        <TabsContent value="basic" className="space-y-2">
                          <div className="rounded-lg border p-4 space-y-2">
                            {Object.entries(metadata.basic).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-sm font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-sm text-muted-foreground">{value}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="raw" className="space-y-2">
                          <div className="rounded-lg border p-4">
                            <pre className="text-xs overflow-auto max-h-96">
                              {JSON.stringify(metadata.raw, null, 2)}
                            </pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}