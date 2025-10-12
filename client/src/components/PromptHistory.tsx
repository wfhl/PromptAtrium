import { useState } from "react";
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
  FileText, Image, MessageSquare, Loader2
} from "lucide-react";
import { format } from "date-fns";

interface PromptHistoryEntry {
  id: string;
  userId: string;
  promptText: string;
  templateUsed?: string;
  settings?: any;
  metadata?: any;
  isSaved: boolean;
  createdAt: string;
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

  // Fetch prompt history
  const { data: history = [], isLoading, refetch } = useQuery<PromptHistoryEntry[]>({
    queryKey: ['/api/prompt-history'],
    enabled: open,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/prompt-history/${id}`, 'DELETE');
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
      return apiRequest('/api/prompt-history', 'DELETE');
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
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Prompt Generation History
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
                data-testid="button-clear-history"
              >
                Clear All
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
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
          <ScrollArea className="h-[500px] pr-4">
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
                    className="cursor-pointer hover:bg-gray-800/50 transition-colors"
                    onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getTemplateIcon(entry.templateUsed)}
                            <Badge variant="secondary" className="text-xs">
                              {entry.templateUsed || "No Template"}
                            </Badge>
                            {entry.metadata?.hasImage && (
                              <Badge variant="outline" className="text-xs">
                                <Image className="h-3 w-3 mr-1" />
                                Image
                              </Badge>
                            )}
                            {entry.metadata?.socialMediaTone && (
                              <Badge variant="outline" className="text-xs">
                                {entry.metadata.socialMediaTone}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm line-clamp-2">
                            {entry.promptText}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}</span>
                            {entry.metadata?.subject && (
                              <span>Subject: {entry.metadata.subject}</span>
                            )}
                            {entry.metadata?.character && (
                              <span>Character: {entry.metadata.character}</span>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className={`h-4 w-4 transition-transform ${
                          selectedEntry?.id === entry.id ? 'rotate-90' : ''
                        }`} />
                      </div>

                      {/* Expanded view */}
                      {selectedEntry?.id === entry.id && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <div className="space-y-3">
                            <div className="bg-gray-900/50 rounded p-3">
                              <p className="text-sm whitespace-pre-wrap">{entry.promptText}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(entry.promptText);
                                }}
                                data-testid={`button-copy-${entry.id}`}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              
                              {onLoadPrompt && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLoad(entry);
                                  }}
                                  data-testid={`button-load-${entry.id}`}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Load in Generator
                                </Button>
                              )}
                              
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
      </DialogContent>
    </Dialog>
  );
}