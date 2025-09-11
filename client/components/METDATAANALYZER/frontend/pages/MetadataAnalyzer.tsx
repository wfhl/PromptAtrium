import React, { useState } from 'react';
import { DropzoneUpload } from '@/components/metadata/DropzoneUpload';
import { MetadataDisplay } from '@/components/metadata/MetadataDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileSearch, RotateCcw, Download, Share2, Plus, FileImage } from 'lucide-react';
import { ShareToLibraryModal } from '@/components/ui/ShareToLibraryModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AnalysisResult {
  success: boolean;
  filename: string;
  filesize: number;
  [key: string]: any;
}

export function MetadataAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for the Add to Library modal
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/prompt-categories'],
    select: (data: any[]) => {
      if (!data || !Array.isArray(data)) return [];
      return data.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description
      }));
    }
  });

  // Mutation for sharing to library
  const shareToLibraryMutation = useMutation({
    mutationFn: async (shareData: any) => {
      return apiRequest('/api/user-prompts', {
        method: 'POST',
        body: JSON.stringify(shareData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-prompts'] });
      setShareModalOpen(false);
      toast({
        title: "Added to Library",
        description: "Prompt has been added to your library successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to library",
        description: error?.message || "An error occurred while adding the prompt",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysisResult(null);
    setError(null);
    
    // Auto-analyze on file selection
    handleAnalyze(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async (file?: File) => {
    const fileToAnalyze = file || selectedFile;
    if (!fileToAnalyze) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', fileToAnalyze);

      const response = await fetch('/api/standalone-metadata/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysisResult(result);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed metadata for ${result.filename}`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('Metadata analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadJson = () => {
    if (!analysisResult) return;

    const dataStr = JSON.stringify(analysisResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `metadata-${analysisResult.filename || 'analysis'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Downloaded",
      description: "Metadata exported as JSON file",
    });
  };

  const handleShare = async () => {
    if (!analysisResult) return;

    const shareData = {
      filename: analysisResult.filename,
      is_ai_generated: analysisResult.is_ai_generated,
      ai_generator_type: analysisResult.ai_generator_type,
      prompt: analysisResult.prompt,
      model: analysisResult.checkpoint_model_name,
      dimensions: `${analysisResult.width}×${analysisResult.height}`,
      filesize: `${(analysisResult.filesize / 1024 / 1024).toFixed(2)} MB`
    };

    const shareText = `🖼️ Image Analysis Results
📁 ${shareData.filename}
📐 ${shareData.dimensions}
💾 ${shareData.filesize}
${shareData.is_ai_generated ? `🤖 AI Generated: ${shareData.ai_generator_type}` : '📷 Traditional Image'}
${shareData.prompt ? `✨ Prompt: ${shareData.prompt.substring(0, 100)}${shareData.prompt.length > 100 ? '...' : ''}` : ''}
${shareData.model ? `🎯 Model: ${shareData.model}` : ''}

Generated by Elite AI Tools Metadata Analyzer`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Image Metadata Analysis',
          text: shareText,
        });
      } catch (err) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard",
          description: "Metadata summary copied to clipboard",
        });
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard",
          description: "Metadata summary copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Share failed",
          description: "Unable to share or copy metadata",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <FileSearch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Image Metadata <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Analyzer</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload any image to extract comprehensive metadata and AI generation parameters
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileSearch className="h-5 w-5 text-blue-500" />
                  <span>Upload Image</span>
                </CardTitle>
                <CardDescription>
                  Drag and drop an image file or click to browse. Supports all major image formats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DropzoneUpload
                  onFileSelect={handleFileSelect}
                  onClear={handleClear}
                  selectedFile={selectedFile}
                  isAnalyzing={isAnalyzing}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleAnalyze()}
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2"
                  >
                    <RotateCcw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
                  </Button>
                  
                  {analysisResult && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleDownloadJson}
                        className="flex items-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download JSON</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleShare}
                        className="flex items-center space-x-2"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share Results</span>
                      </Button>

                      {analysisResult.prompt && (
                        <Button
                          variant="outline"
                          onClick={() => setShareModalOpen(true)}
                          className="flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add to Library</span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={handleClear}
                        className="flex items-center space-x-2"
                      >
                        <FileImage className="h-4 w-4" />
                        <span>Analyze New Image</span>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-red-600 dark:text-red-400 text-lg">
                    Analysis Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    {error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setError(null)}
                    className="mt-3"
                  >
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {analysisResult ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Metadata Results</span>
                    {analysisResult.is_ai_generated && (
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                        🤖 AI Generated
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Comprehensive metadata analysis for {analysisResult.filename}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MetadataDisplay
                    data={analysisResult}
                    filename={analysisResult.filename}
                    filesize={analysisResult.filesize}
                    onClear={handleClear}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <FileSearch className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Analysis Yet
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Upload an image to see comprehensive metadata analysis including AI generation parameters, EXIF data, and technical details.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              What can this analyzer detect?
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🤖 AI Generation</h4>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Stable Diffusion parameters</li>
                  <li>• ComfyUI workflows</li>
                  <li>• Midjourney settings</li>
                  <li>• DALL-E metadata</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📷 Technical Details</h4>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Image dimensions & format</li>
                  <li>• Color space & depth</li>
                  <li>• Compression settings</li>
                  <li>• File size analysis</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🎯 Camera Data</h4>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• EXIF camera settings</li>
                  <li>• Shooting parameters</li>
                  <li>• GPS location data</li>
                  <li>• Timestamp information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add to Library Modal */}
      <ShareToLibraryModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        promptData={analysisResult?.prompt ? {
          id: 0,
          name: analysisResult.filename.replace(/\.[^/.]+$/, ""), // Remove file extension
          positive_prompt: analysisResult.prompt,
          negative_prompt: analysisResult.negative_prompt || '',
          tags: []
        } : null}
        onShare={(shareData) => {
          shareToLibraryMutation.mutate({
            title: shareData.title,
            positive_prompt: analysisResult.prompt,
            negative_prompt: analysisResult.negative_prompt || '',
            tags: shareData.tags,
            category_id: shareData.category_id,
            source: 'metadata-analyzer'
          });
        }}
        categories={categories}
        isLoading={shareToLibraryMutation.isPending}
        mode="save-to-user"
      />
    </div>
  );
}