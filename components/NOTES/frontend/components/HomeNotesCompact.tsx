import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { 
  Pin, 
  Trash2, 
  Edit3,
  Archive,
  Share2,
  Copy,
  Palette,
  Eye,
  FileText,
  Code,
  CheckSquare,
  BookOpen,
  Circle,
  CheckCircle2,
  Save,
  X,
  Pencil
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function HomeNotesCompact() {
  // Create a custom interface that doesn't extend Note to avoid type conflicts
  interface NoteWithDate {
    id: number;
    title: string;
    content?: string;
    type?: string;
    folder?: string;
    tags?: string[];
    color?: string | null;
    isPinned?: boolean;
    isArchived?: boolean;
    lastModified?: string;
    createdAt?: string;
    parentId?: number;
  }

  // Using useMemo instead of useState to prevent infinite loops
  const [checkedItems, setCheckedItems] = useState<Record<number, Record<number, boolean>>>({});
  const [editingNote, setEditingNote] = useState<NoteWithDate | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: (noteData: any) => {
      return apiRequest(`/api/notes/${noteData.id}`, "PUT", noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setEditingNote(null);
      toast({
        title: "Note Updated",
        description: "Your note has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => {
      return apiRequest(`/api/notes/${noteId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      if (editingNote) {
        setEditingNote(null);
      }
      toast({
        title: "Note Deleted",
        description: "The note has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle checkbox for todo items and sync with content
  const toggleTodoItem = (noteId: number, lineIndex: number) => {
    // Update in-memory state for immediate UI response
    setCheckedItems(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        [lineIndex]: !prev[noteId]?.[lineIndex]
      }
    }));

    // Also update the note content to persist the change
    const note = pinnedNotes.find(n => n.id === noteId);
    if (note) {
      const lines = note.content?.split('\n') || [];
      const line = lines[lineIndex];
      if (line) {
        const isCurrentlyChecked = checkedItems[noteId]?.[lineIndex];
        const isPreChecked = line.trim().startsWith('✓') || line.trim().startsWith('[x]') || line.trim().startsWith('●');
        const willBeChecked = !isCurrentlyChecked && !isPreChecked;
        
        const cleanLine = line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim();
        
        if (willBeChecked) {
          lines[lineIndex] = `● ${cleanLine}`;
        } else {
          lines[lineIndex] = `○ ${cleanLine}`;
        }
        
        // Update the note content
        updateNoteMutation.mutate({
          id: noteId,
          title: note.title,
          content: lines.join('\n')
        });
      }
    }
  };

  // Render todo content with interactive checkboxes - matches Notes page exactly
  const renderTodoContent = (content: string, noteId: number) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Separate checked and unchecked items
    const uncheckedItems: Array<{line: string, index: number}> = [];
    const checkedItemsList: Array<{line: string, index: number}> = [];
    
    lines.forEach((line, index) => {
      const isPreChecked = line.trim().startsWith('✓') || line.trim().startsWith('[x]') || line.trim().startsWith('●');
      const isUserChecked = checkedItems[noteId]?.[index];
      const isChecked = isPreChecked || isUserChecked;
      
      if (isChecked) {
        checkedItemsList.push({ line, index });
      } else {
        uncheckedItems.push({ line, index });
      }
    });
    
    return (
      <div className="space-y-1">
        {/* Unchecked items */}
        {uncheckedItems.map(({ line, index }) => (
          <div key={index} className="flex items-start gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTodoItem(noteId, index);
              }}
              className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0 flex items-center justify-center hover:text-blue-400 transition-colors"
            >
              <Circle className="w-3 h-3" />
            </button>
            <span className="text-gray-300 text-sm flex-1">
              {line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
            </span>
          </div>
        ))}
        {/* Divider if there are both checked and unchecked items */}
        {uncheckedItems.length > 0 && checkedItemsList.length > 0 && (
          <div className="border-t border-gray-700 my-2"></div>
        )}
        {/* Checked items */}
        {checkedItemsList.map(({ line, index }) => (
          <div key={index} className="flex items-start gap-2 opacity-60">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTodoItem(noteId, index);
              }}
              className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0 flex items-center justify-center hover:text-green-400 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" />
            </button>
            <span className="text-gray-400 text-sm flex-1 line-through">
              {line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Get all notes
  const { data: notesResponse, isLoading } = useQuery({
    queryKey: ["/api/notes"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Extract notes array from API response with proper typing
  const notes = Array.isArray(notesResponse) 
    ? notesResponse 
    : (notesResponse as any)?.data || [];

  // Compute pinned notes using useMemo to prevent infinite re-renders
  const pinnedNotes = useMemo(() => {
    if (!notes || !Array.isArray(notes)) {
      return [];
    }
    
    // Get pinned notes - these are the only notes we'll display on the dashboard
    const pinned = notes.filter((note: any) => note.isPinned);
    // Sort by last modified date
    return [...pinned].sort((a, b) => {
      const dateA = new Date(a.lastModified || "");
      const dateB = new Date(b.lastModified || "");
      return dateB.getTime() - dateA.getTime();
    });
  }, [notes]);

  // Format date - matches Notes page exactly
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to get card color styling based on note color - matches Notes page exactly
  const getCardColor = (color: string | null) => {
    if (!color) return "bg-gray-900/40 border-gray-700";
    
    switch (color) {
      case 'red': return "bg-red-900/20 border-red-700/40";
      case 'blue': return "bg-blue-900/20 border-blue-700/40";
      case 'green': return "bg-green-900/20 border-green-700/40";
      case 'yellow': return "bg-yellow-900/20 border-yellow-700/40";
      case 'purple': return "bg-purple-900/20 border-purple-700/40";
      case 'pink': return "bg-pink-900/20 border-pink-700/40";
      case 'orange': return "bg-orange-900/20 border-orange-700/40";
      case 'teal': return "bg-teal-900/20 border-teal-700/40";
      default: return "bg-gray-900/40 border-gray-700";
    }
  };

  // Helper function to get color dot styling - matches Notes page exactly
  const getColorDot = (color: string | null) => {
    if (!color) return "bg-gray-500";
    
    switch (color) {
      case 'red': return "bg-red-500";
      case 'blue': return "bg-blue-500";
      case 'green': return "bg-green-500";
      case 'yellow': return "bg-yellow-500";
      case 'purple': return "bg-purple-500";
      case 'pink': return "bg-pink-500";
      case 'orange': return "bg-orange-500";
      case 'teal': return "bg-teal-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'markdown': return <Eye className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'todo': return <CheckSquare className="h-4 w-4" />;
      case 'html': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Toggle pin functionality
  const togglePin = (noteId: number) => {
    const note = pinnedNotes.find(n => n.id === noteId);
    if (note) {
      updateNoteMutation.mutate({
        id: noteId,
        isPinned: !note.isPinned
      });
    }
  };

  // Handle note click for inline editing
  const handleNoteClick = (note: NoteWithDate) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || "");
  };

  // Save edited note
  const saveEdit = () => {
    if (editingNote) {
      updateNoteMutation.mutate({
        id: editingNote.id,
        title: editTitle,
        content: editContent,
      });
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingNote(null);
    setEditTitle("");
    setEditContent("");
  };

  // Render note card - matches Notes page exactly with inline editing
  const renderNoteCard = (note: NoteWithDate) => {
    // If this note is being edited inline, show edit form
    if (editingNote && editingNote.id === note.id) {
      return (
        <div 
          key={note.id} 
          className={`relative border-l-4 border-gray-700 rounded-lg p-3 md:p-4 break-inside-avoid mb-3 md:mb-4 ${getCardColor(note.color)}`}
        >
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-white bg-gray-800/50 border-gray-600"
              placeholder="Note title..."
            />
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="text-white bg-gray-800/50 border-gray-600 min-h-[100px]"
              placeholder="Note content..."
            />
            <div className="flex items-center gap-2">
              <Button onClick={saveEdit} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={cancelEdit} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Normal note card display - matches Notes page exactly
    return (
      <div 
        key={note.id} 
        className={`relative border-l-4 border-gray-700 rounded-lg p-3 md:p-4 cursor-pointer hover:bg-gray-800/70 transition-colors break-inside-avoid mb-3 md:mb-4 group ${getCardColor(note.color)}`}
        onClick={() => handleNoteClick(note)}
        onMouseEnter={() => setHoveredNote(note.id)}
        onMouseLeave={() => setHoveredNote(null)}
      >
        {/* Pin icon in top left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePin(note.id);
          }}
          className={`absolute top-2 left-2 z-10 w-6 h-6 flex items-center justify-center rounded transition-colors ${
            note.isPinned 
              ? 'text-yellow-400 hover:text-yellow-300' 
              : 'text-gray-500 hover:text-gray-400'
          }`}
        >
          <Pin className="h-3 w-3" />
        </button>

        <div className="flex items-start justify-between mb-2 pl-6">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getColorDot(note.color)}`}></div>
            {getTypeIcon(note.type || 'text')}
            <h3 className="font-medium text-white truncate text-ellipsis overflow-hidden text-sm md:text-base" title={note.title}>
              {note.title}
            </h3>
          </div>
          
          {/* Hover toolbar */}
          <div className={cn(
            "flex items-center gap-1 flex-shrink-0 transition-all duration-200",
            hoveredNote === note.id ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          )} onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(note.id);
              }}
              className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white"
            >
              <Pin className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white">
              <Palette className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white">
              <Share2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white">
              <Archive className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                deleteNoteMutation.mutate(note.id);
              }}
              className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-red-800 text-gray-300 hover:text-white"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                handleNoteClick(note);
              }}
              className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs md:text-sm text-gray-300 mb-2 leading-relaxed pl-6">
          {note.type === 'todo' ? (
            <div className="line-clamp-4 md:line-clamp-3">
              {renderTodoContent(note.content || "", note.id)}
            </div>
          ) : (
            <div className="whitespace-pre-wrap line-clamp-4 md:line-clamp-3">
              {note.content}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs pl-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">{formatDate(note.lastModified || "")}</span>
            {note.tags && note.tags.length > 0 && (
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                {note.tags.slice(0, 2).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block px-1.5 py-0.5 bg-gray-700/50 text-xs text-gray-400 rounded truncate"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="text-xs text-gray-500 flex-shrink-0">+{note.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
          
          <span className="text-xs text-gray-500 capitalize flex-shrink-0">
            {note.type}
          </span>
        </div>
      </div>
    );
  };

  // Display empty state when no pinned notes exist
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <FileText className="h-8 w-8 text-gray-600 mb-2" />
      <h3 className="font-medium mb-1 text-gray-300">No pinned notes</h3>
      <p className="text-gray-500 text-sm mb-3">
        Pin some notes to see them on your dashboard
      </p>
      <Link href="/notes">
        <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
          <Pencil className="mr-2 h-4 w-4" />
          Go to Notes
        </Button>
      </Link>
    </div>
  );

  return (
    <Card className="h-full bg-gradient from-yellow-600/00 to-black-600/00 border border-transparent">
      <CardHeader className="flex flex-col space-y-1.5 p-6 pt-[0px] pb-[0px]">
        <div className="flex items-center justify-between pt-[6px] pb-[6px]">
          <CardTitle className="text-xl font-bold">
            <span className="text-white">Pinned</span> Notes
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-2 rounded-md animate-pulse">
                <div className="w-1 h-10 bg-gray-700 mr-3 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {pinnedNotes.length > 0 ? (
              <div className="space-y-0">
                {pinnedNotes.map((note) => renderNoteCard(note))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        )}
      </CardContent>

    </Card>
  );
}