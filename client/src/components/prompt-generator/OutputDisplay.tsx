import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Copy, 
  Save, 
  Hash, 
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  FileText,
  Wand2,
  Palette,
  Image,
  Camera,
  Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { GeneratedPrompt } from "@/lib/prompt-generator/types";

interface OutputDisplayProps {
  generatedPrompt: GeneratedPrompt | null;
  onSaveToLibrary?: (format: string, content: string) => void;
  className?: string;
  isGenerating?: boolean;
  error?: string | null;
}

interface FormatSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: string;
  description?: string;
  color?: string;
}

export function OutputDisplay({
  generatedPrompt,
  onSaveToLibrary,
  className,
  isGenerating = false,
  error = null
}: OutputDisplayProps) {
  const { toast } = useToast();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [savingFormat, setSavingFormat] = useState<string | null>(null);

  // Calculate quality score based on prompt content
  const qualityScore = useMemo(() => {
    if (!generatedPrompt?.original) return 0;
    const prompt = generatedPrompt.original;
    
    let score = 50; // Base score
    
    // More descriptive terms increase score
    const descriptiveWords = prompt.match(/\b\w{7,}\b/g) || [];
    score += Math.min(descriptiveWords.length * 2, 20);
    
    // Presence of style elements
    if (prompt.includes("style") || prompt.includes("aesthetic")) score += 10;
    
    // Technical parameters
    if (prompt.includes("quality") || prompt.includes("detailed")) score += 10;
    
    // Length factor (optimal range: 50-200 words)
    const wordCount = prompt.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 200) score += 10;
    
    return Math.min(Math.max(score, 0), 100);
  }, [generatedPrompt]);

  // Prepare format sections
  const formatSections: FormatSection[] = useMemo(() => {
    if (!generatedPrompt) return [];
    
    const sections: FormatSection[] = [];
    
    // Always add original
    if (generatedPrompt.original) {
      sections.push({
        id: "original",
        label: "Original",
        icon: <FileText className="h-4 w-4" />,
        content: generatedPrompt.original,
        description: "Raw generated prompt without formatting",
        color: "blue"
      });
    }
    
    // Add formatted versions if available
    if (generatedPrompt.formatted) {
      sections.push({
        id: "formatted",
        label: "Formatted",
        icon: <Wand2 className="h-4 w-4" />,
        content: generatedPrompt.formatted,
        description: "Clean, formatted version with proper structure",
        color: "purple"
      });
    }
    
    if (generatedPrompt.pipeline) {
      sections.push({
        id: "pipeline",
        label: "Pipeline",
        icon: <Layers className="h-4 w-4" />,
        content: generatedPrompt.pipeline,
        description: "Optimized for AI pipeline processing",
        color: "green"
      });
    }
    
    if (generatedPrompt.longform) {
      sections.push({
        id: "longform",
        label: "Longform",
        icon: <FileText className="h-4 w-4" />,
        content: generatedPrompt.longform,
        description: "Extended narrative format with rich details",
        color: "orange"
      });
    }
    
    if (generatedPrompt.midjourney) {
      sections.push({
        id: "midjourney",
        label: "MidJourney",
        icon: <Palette className="h-4 w-4" />,
        content: generatedPrompt.midjourney,
        description: "Optimized for MidJourney with parameters",
        color: "indigo"
      });
    }
    
    if (generatedPrompt.dalle) {
      sections.push({
        id: "dalle",
        label: "DALL-E",
        icon: <Image className="h-4 w-4" />,
        content: generatedPrompt.dalle,
        description: "Formatted for DALL-E 3 generation",
        color: "pink"
      });
    }
    
    if (generatedPrompt.stableDiffusion) {
      sections.push({
        id: "stable-diffusion",
        label: "Stable Diffusion",
        icon: <Camera className="h-4 w-4" />,
        content: generatedPrompt.stableDiffusion,
        description: "Structured for Stable Diffusion models",
        color: "cyan"
      });
    }
    
    // Add negative prompt as separate section if available
    if (generatedPrompt.negativePrompt) {
      sections.push({
        id: "negative",
        label: "Negative",
        icon: <AlertCircle className="h-4 w-4" />,
        content: generatedPrompt.negativePrompt,
        description: "Terms to avoid in generation",
        color: "red"
      });
    }
    
    return sections;
  }, [generatedPrompt]);

  const handleCopy = async (format: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFormat(format);
      toast({
        title: "Copied to clipboard",
        description: `${format} prompt copied successfully`,
      });
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (format: string, content: string) => {
    if (!onSaveToLibrary) return;
    
    setSavingFormat(format);
    try {
      await onSaveToLibrary(format, content);
      toast({
        title: "Saved to library",
        description: `${format} prompt saved successfully`,
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: "Failed to save to library",
        variant: "destructive",
      });
    } finally {
      setSavingFormat(null);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  // Show placeholder when no prompt
  if (!generatedPrompt && !isGenerating && !error) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Prompt Generated</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Configure your options and click Generate to create a prompt.
            Your generated prompts will appear here in multiple formats.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isGenerating) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Generating prompt...</p>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show generated prompt
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Generated Prompt</CardTitle>
          <div className="flex items-center gap-4">
            {/* Character count */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Hash className="h-3 w-3" />
              <span>{generatedPrompt?.original?.length || 0} chars</span>
            </div>
            
            {/* Quality score */}
            <div className="flex items-center gap-1">
              <Badge 
                variant="outline" 
                className={cn("text-xs", getQualityColor(qualityScore))}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {getQualityLabel(qualityScore)} ({qualityScore}%)
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue={formatSections[0]?.id || "original"} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(formatSections.length, 4)}, 1fr)` }}>
            {formatSections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="text-xs"
              >
                <span className="flex items-center gap-1">
                  {section.icon}
                  <span className="hidden sm:inline">{section.label}</span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {formatSections.map((section) => (
            <TabsContent key={section.id} value={section.id} className="mt-4">
              <div className="space-y-3">
                {/* Format description */}
                {section.description && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{section.description}</span>
                  </div>
                )}
                
                {/* Prompt content */}
                <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {section.content}
                  </pre>
                </ScrollArea>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(section.label, section.content)}
                    className="flex-1"
                  >
                    {copiedFormat === section.label ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy {section.label}
                      </>
                    )}
                  </Button>
                  
                  {onSaveToLibrary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave(section.label, section.content)}
                      disabled={savingFormat === section.label}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savingFormat === section.label ? "Saving..." : "Save to Library"}
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}