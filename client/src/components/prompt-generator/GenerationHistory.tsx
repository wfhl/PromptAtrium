import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Copy,
  RefreshCcw,
  Download,
  FileText,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ElitePromptOptions } from "@/lib/prompt-generator/types";

export interface GenerationHistoryItem {
  id: string;
  timestamp: string;
  templateName: string;
  templateId?: string;
  prompt: string;
  negativePrompt?: string;
  options: ElitePromptOptions;
  formats?: {
    original?: string;
    formatted?: string;
    pipeline?: string;
    longform?: string;
    midjourney?: string;
    dalle?: string;
    stableDiffusion?: string;
  };
  characterCount: number;
  qualityScore?: number;
  tags?: string[];
}

interface GenerationHistoryProps {
  history: GenerationHistoryItem[];
  onRestoreItem?: (item: GenerationHistoryItem) => void;
  onDeleteItem?: (id: string) => void;
  onClearHistory?: () => void;
  onExportHistory?: () => void;
  className?: string;
  maxItems?: number;
  showSearch?: boolean;
  showFilters?: boolean;
}

export function GenerationHistory({
  history,
  onRestoreItem,
  onDeleteItem,
  onClearHistory,
  onExportHistory,
  className,
  maxItems = 50,
  showSearch = true,
  showFilters = true,
}: GenerationHistoryProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "quality" | "length">("recent");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Get unique templates from history
  const availableTemplates = useMemo(() => {
    const templates = new Set(history.map(item => item.templateName));
    return Array.from(templates);
  }, [history]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply template filter
    if (selectedTemplate !== "all") {
      filtered = filtered.filter(item => item.templateName === selectedTemplate);
    }

    // Apply sorting
    switch (sortBy) {
      case "quality":
        filtered.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        break;
      case "length":
        filtered.sort((a, b) => b.characterCount - a.characterCount);
        break;
      case "recent":
      default:
        filtered.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }

    // Limit items
    return filtered.slice(0, maxItems);
  }, [history, searchQuery, selectedTemplate, sortBy, maxItems]);

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast({
        title: "Copied to clipboard",
        description: "Prompt copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete && onDeleteItem) {
      onDeleteItem(itemToDelete);
      toast({
        title: "Item deleted",
        description: "Generation removed from history",
      });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleClearHistory = () => {
    setClearDialogOpen(true);
  };

  const confirmClear = () => {
    if (onClearHistory) {
      onClearHistory();
      toast({
        title: "History cleared",
        description: "All generation history has been removed",
      });
    }
    setClearDialogOpen(false);
  };

  const handleExport = () => {
    if (onExportHistory) {
      onExportHistory();
      toast({
        title: "History exported",
        description: "Your generation history has been downloaded",
      });
    }
  };

  const getQualityBadge = (score?: number) => {
    if (!score) return null;
    
    const variant = score >= 80 ? "default" : 
                    score >= 60 ? "secondary" : 
                    "outline";
    
    return (
      <Badge variant={variant} className="text-xs">
        {score}%
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return format(date, "MMM d, h:mm a");
  };

  if (history.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Generation History</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your generated prompts will appear here. Start generating to build your history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Generation History</CardTitle>
            <CardDescription>
              {filteredHistory.length} of {history.length} generations
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportHistory && (
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export History
                </DropdownMenuItem>
              )}
              {onClearHistory && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleClearHistory}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear History
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="space-y-2">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex gap-2">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    {availableTemplates.map(template => (
                      <SelectItem key={template} value={template}>
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* History Items */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.templateName}
                    </Badge>
                    {getQualityBadge(item.qualityScore)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onRestoreItem && (
                        <DropdownMenuItem onClick={() => onRestoreItem(item)}>
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Restore Settings
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleCopyPrompt(item.prompt)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Prompt
                      </DropdownMenuItem>
                      {onDeleteItem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Prompt Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {item.prompt}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {item.characterCount} chars
                    </span>
                    {item.formats && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {Object.keys(item.formats).length} formats
                      </span>
                    )}
                  </div>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1">
                      {item.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{item.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Generation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this generation from your history? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear History Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all generation history? This will permanently delete {history.length} items and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-destructive text-destructive-foreground">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}