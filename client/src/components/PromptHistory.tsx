import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, Copy, Trash2, Search, X, ChevronRight,
  FileText, Image, MessageSquare, Loader2, Database, HardDrive, Save
} from "lucide-react";
import { format } from "date-fns";
import { 
  getLocalPromptHistory, 
  clearLocalPromptHistory, 
  deleteLocalPrompt,
  transformLocalToDBFormat,
  convertHistoryToLibrary
} from "@/utils/promptHistoryStorage";

interface PromptHistoryEntry {
  id: string;
  userId: string;
  promptText: string;
  templateUsed?: string;
  settings?: any;
  metadata?: any;
  isSaved: boolean;
  createdAt: string;
  isLocal?: boolean; // Flag to identify local storage entries
}

interface PromptHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadPrompt?: (prompt: string, metadata?: any) => void;
}

export function PromptHistory({ open, onOpenChange, onLoadPrompt }: PromptHistoryProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<PromptHistoryEntry | null>(null);
  const [localHistory, setLocalHistory] = useState<PromptHistoryEntry[]>([]);

  // Fetch prompt history from database
  const { data: dbHistory = [], isLoading, refetch, error } = useQuery<PromptHistoryEntry[]>({
    queryKey: ['/api/prompt-history'],
    enabled: open,
    retry: false, // Don't retry if user is not authenticated
  });

  // Handle authentication errors
  useEffect(() => {
    if (error && (error as any)?.message?.includes('401')) {
      console.log('User not authenticated, showing local history only');
    }
  }, [error]);

  // Load local storage history when dialog opens
  useEffect(() => {
    if (open) {
      const local = getLocalPromptHistory();
      const transformed = local.map(transformLocalToDBFormat);
      setLocalHistory(transformed);
    }
  }, [open]);

  // Merge database and local history
  const history = useMemo(() => {
    // Remove duplicates based on promptText and timestamp proximity
    const dbHistoryArray = Array.isArray(dbHistory) ? dbHistory : [];
    const combined = [...localHistory, ...dbHistoryArray];
    const unique = new Map();

    combined.forEach(entry => {
      // Create a key based on the first 50 chars of prompt and rough timestamp (to minute)
      const promptKey = entry.promptText.substring(0, 50);
      const timeKey = new Date(entry.createdAt).toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
      const key = `${promptKey}_${timeKey}`;

      // Prefer database entry over local if duplicate
      if (!unique.has(key) || !entry.isLocal) {
        unique.set(key, entry);
      }
    });

    return Array.from(unique.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [dbHistory, localHistory]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if this is a local entry
      if (id.startsWith('local_')) {
        deleteLocalPrompt(id);
        setLocalHistory(prev => prev.filter(e => e.id !== id));
        return Promise.resolve();
      } else {
        // Delete from database
        return apiRequest('DELETE', `/api/prompt-history/${id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prompt-history'] });
      toast({
        title: "Entry deleted",
        description: "Prompt history entry has been removed"
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete",
        description: "Could not remove the history entry",
        variant: "destructive"
      });
    }
  });

  // Clear all history mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      // Clear local storage
      clearLocalPromptHistory();
      setLocalHistory([]);

      // Try to clear database history if authenticated
      try {
        await apiRequest('DELETE', '/api/prompt-history');
      } catch (error: any) {
        // Ignore 401 errors - user just isn't logged in
        if (!error?.message?.includes('401')) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prompt-history'] });
      toast({
        title: "History cleared",
        description: "All prompt history has been removed"
      });
    },
    onError: () => {
      toast({
        title: "Failed to clear",
        description: "Could not clear prompt history",
        variant: "destructive"
      });
    }
  });

  // Save to library mutation
  const saveToLibraryMutation = useMutation({
    mutationFn: async (entry: PromptHistoryEntry) => {
      const libraryData = convertHistoryToLibrary(entry, entry.userId || 'anonymous');
      await apiRequest("POST", "/api/prompts", libraryData);

      // Update the history entry to mark as saved if it's in the database
      if (!entry.isLocal) {
        await apiRequest("PATCH", `/api/prompt-history/${entry.id}`, { isSaved: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      refetch();
      toast({
        title: "Saved to Library",
        description: "Prompt has been added to your library"
      });
    },
    onError: (error: any) => {
      if (error?.message?.includes("401")) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save prompts to library",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save prompt to library",
          variant: "destructive"
        });
      }
    }
  });

  // Filter history based on search
  const filteredHistory = history.filter(entry => 
    entry.promptText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.templateUsed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.metadata?.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard"
    });
  };

  const handleLoad = (entry: PromptHistoryEntry) => {
    if (onLoadPrompt) {
      onLoadPrompt(entry.promptText, entry.metadata);
      onOpenChange(false);
      toast({
        title: "Prompt loaded",
        description: "The prompt has been loaded into the generator"
      });
    }
  };

  const getTemplateIcon = (template?: string) => {
    if (template?.toLowerCase().includes('social')) return <MessageSquare className="h-3 w-3" />;
    if (template?.toLowerCase().includes('image')) return <Image className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden p-4 sm:p-6">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 flex-shrink-0" />
              <span className="text-base sm:text-lg">Prompt Generation History</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex flex-col h-full">
          {/* Search bar */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-history"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* History list */}
          <ScrollArea className="h-[60vh] sm:h-[500px] pr-2 sm:pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No matching prompts found" : "No prompt history yet"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((entry) => (
                  <Card 
                    key={entry.id} 
                    className="cursor-pointer hover:bg-gray-800/50 transition-colors overflow-hidden"
                    onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            {getTemplateIcon(entry.templateUsed)}
                            <Badge variant="secondary" className="text-xs">
                              {entry.templateUsed || "No Template"}
                            </Badge>
                            {entry.metadata?.hasImage && (
                              <Badge variant="outline" className="text-xs">
                                <Image className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Image</span>
                              </Badge>
                            )}
                            {entry.metadata?.socialMediaTone && (
                              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                {entry.metadata.socialMediaTone}
                              </Badge>
                            )}
                            {entry.isLocal ? (
                              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                                <HardDrive className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Local</span>
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-500 border-green-500/50">
                                <Database className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Saved</span>
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm line-clamp-2 break-words">
                            {entry.metadata.subject}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                            <span className="whitespace-nowrap">{format(new Date(entry.createdAt), 'MMM d, h:mm a')}</span>
                            {entry.metadata?.subject && (
                              <span className="truncate">Style: {entry.templateUsed}</span>
                            )}
                            {entry.metadata?.character && (
                              <span className="truncate sm:hidden">Char: {
                                // Handle legacy custom- IDs
                                entry.metadata.character.startsWith('custom-') && /custom-\d+$/.test(entry.metadata.character)
                                  ? 'Custom Character'
                                  : entry.metadata.character
                              }</span>
                            )}
                            {entry.metadata?.character && (
                              <span className="hidden sm:inline truncate">Character: {
                                // Handle legacy custom- IDs  
                                entry.metadata.character.startsWith('custom-') && /custom-\d+$/.test(entry.metadata.character)
                                  ? 'Custom Character'
                                  : entry.metadata.character
                              }</span>
                            )}
                          </div>
                        </div>

                        <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${
                          selectedEntry?.id === entry.id ? 'rotate-90' : ''
                        }`} />
                      </div>

                      {/* Expanded view */}
                      {selectedEntry?.id === entry.id && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <div className="space-y-4">
                            <div 
                              className="relative bg-green-900/20 border border-green-700/30 hover:border-green-600/40 transition-colors rounded-md p-2 sm:p-3 group"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="pr-8 max-h-48 overflow-y-auto">
                                <p className="text-xs sm:text-sm text-gray-200/70 font-mono leading-relaxed whitespace-pre-wrap break-words select-text cursor-text">{entry.promptText}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-1 h-6 w-6 p-0 bg-transparent hover:opacity-100 text-green-400 opacity-50 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(entry.promptText);
                                }}
                                data-testid={`button-copy-text-${entry.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              {/* Save to Library Button - Only if not saved */}
                              {!entry.isSaved && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveToLibraryMutation.mutate(entry);
                                  }}
                                  disabled={saveToLibraryMutation.isPending}
                                  className="w-full h-6"
                                  data-testid={`button-save-library-${entry.id}`}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  <span>{saveToLibraryMutation.isPending ? "Saving..." : "Save"}</span>
                                </Button>
                              )}

                              {/* Load Button - If onLoadPrompt is available */}
                              {onLoadPrompt && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLoad(entry);
                                  }}
                                  className={`w-full h-6 ${!entry.isSaved ? '' : entry.isSaved ? 'col-start-1' : ''}`}
                                  data-testid={`button-load-${entry.id}`}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Load
                                </Button>
                              )}

                              {/* Delete Button - Always shown */}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Delete this history entry?")) {
                                    deleteMutation.mutate(entry.id);
                                    setSelectedEntry(null);
                                  }
                                }}
                                className="w-full h-6"
                                data-testid={`button-delete-${entry.id}`}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        {history.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to clear all history?")) {
                clearMutation.mutate();
              }
            }}
            className="w-full sm:w-auto"
            data-testid="button-clear-history"
          >
            Clear All
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}