import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import { ExpandableCardDemo } from "@/components/ui/expandable-card";
import { ArrowLeft, Search, Plus, Pin, Trash2, Edit3, Archive, Share2, MoreVertical, FileText, Code, CheckSquare, BookOpen, Calendar, Tag, Filter, CheckCircle2, Circle, X } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MobileFloatingDock from "@/components/mobile/MobileFloatingDock";
import MobileHeader from "@/components/mobile/MobileHeader";

interface Note {
  id: number;
  title: string;
  content: string;
  type: 'text' | 'markdown' | 'code' | 'todo' | 'html';
  folder?: string;
  tags?: string[];
  color?: string;
  is_pinned?: boolean;
  isPinned?: boolean;
  is_archived?: boolean;
  parent_id?: number;
  position?: number;
  created_at: string;
  lastModified: string;
  last_modified?: string;
  user_id: string;
}

export default function MobileNotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState<'text' | 'markdown' | 'code' | 'todo' | 'html'>('text');
  const [checkedItems, setCheckedItems] = useState<{[noteId: number]: {[lineIndex: number]: boolean}}>({});
  const [isNewTodoInputFocused, setIsNewTodoInputFocused] = useState(false);
  const [pendingTodoText, setPendingTodoText] = useState("");
  const [newNoteColor, setNewNoteColor] = useState('gray');
  const [newNoteTags, setNewNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notesResponse, isLoading } = useQuery({
    queryKey: ['/api/notes'],
  });

  // Extract notes from API response - handle both direct array and wrapped response
  const notes: Note[] = (() => {
    if (Array.isArray(notesResponse)) return notesResponse;
    if (notesResponse && typeof notesResponse === 'object') {
      const response = notesResponse as { data?: Note[]; success?: boolean };
      if (response.data && Array.isArray(response.data)) return response.data;
    }
    return [];
  })();

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { title: string; content: string; type: string; folder?: string; user_id?: string }) => {
      return await apiRequest('/api/notes', 'POST', {
        ...noteData,
        folder: noteData.folder || 'Unsorted',
        user_id: noteData.user_id || 'dev-user'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setIsCreateDialogOpen(false);
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteType('text');
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...noteData }: { id: number; title: string; content: string; type?: string; color?: string; tags?: string[]; is_pinned?: boolean; isPinned?: boolean }) => {
      return await apiRequest(`/api/notes/${id}`, 'PUT', noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setEditingNote(null);
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete note');
      // Delete returns 204 with no content, so don't try to parse JSON
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  // Helper functions for note styling
  const getCardColor = (color?: string) => {
    switch (color) {
      case 'red': return 'border-l-red-500 bg-red-500/5';
      case 'orange': return 'border-l-orange-500 bg-orange-500/5';
      case 'yellow': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'green': return 'border-l-green-500 bg-green-500/5';
      case 'blue': return 'border-l-blue-500 bg-blue-500/5';
      case 'purple': return 'border-l-purple-500 bg-purple-500/5';
      case 'pink': return 'border-l-pink-500 bg-pink-500/5';
      default: return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  const getColorDot = (color?: string) => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'pink': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'markdown': return <BookOpen className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'todo': return <CheckSquare className="h-4 w-4" />;
      case 'html': return <FileText className="h-4 w-4" />;
      default: return '📄';
    }
  };

  // Format date for display with better error handling
  const formatDate = (note: Note) => {
    // Try different date field names
    const dateString = note.lastModified || note.last_modified;
    
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.round(diffMs / 1000);
      const diffMins = Math.round(diffSecs / 60);
      const diffHours = Math.round(diffMins / 60);
      const diffDays = Math.round(diffHours / 24);
      
      // Today
      if (diffDays === 0) {
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        return `${diffHours}h ago`;
      }
      
      // Yesterday
      if (diffDays === 1) return 'Yesterday';
      
      // Within a week
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // Format as date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

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
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const lines = note.content.split('\n');
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

  // Toggle todo item status in edit mode and update content
  const toggleEditTodoItem = (noteId: number, lineIndex: number) => {
    const lines = newNoteContent.split('\n');
    const line = lines[lineIndex];
    
    if (!line) return;
    
    const isChecked = line.trim().startsWith('✓') || line.trim().startsWith('[x]') || line.trim().startsWith('●');
    const cleanLine = line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim();
    
    if (isChecked) {
      // Convert to unchecked
      lines[lineIndex] = `○ ${cleanLine}`;
    } else {
      // Convert to checked
      lines[lineIndex] = `● ${cleanLine}`;
    }
    
    const updatedContent = lines.join('\n');
    setNewNoteContent(updatedContent);
    
    // Also update the in-memory checkbox state to keep view mode in sync
    setCheckedItems(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        [lineIndex]: !isChecked
      }
    }));
  };

  // Render todo content in edit mode with interactive checkboxes
  const renderEditTodoContent = (content: string, noteId: number) => {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Separate checked and unchecked items using the same logic as view mode
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
      <div className="space-y-2">
        {/* Add new todo item input at top */}
        <div className="flex items-start gap-2 pb-2 border-b border-gray-700">
          <Circle className="w-4 h-4 mt-0.5 text-gray-500" />
          <input
            type="text"
            placeholder="Add new todo item..."
            value={pendingTodoText}
            onChange={(e) => setPendingTodoText(e.target.value)}
            onFocus={() => setIsNewTodoInputFocused(true)}
            onBlur={() => setIsNewTodoInputFocused(false)}
            className="bg-transparent text-gray-300 text-sm flex-1 outline-none border-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                const newItem = `○ ${e.currentTarget.value.trim()}`;
                const currentContent = newNoteContent.trim();
                const updatedContent = currentContent ? `${newItem}\n${currentContent}` : newItem;
                setNewNoteContent(updatedContent);
                setPendingTodoText('');
                setIsNewTodoInputFocused(false);
              }
            }}
          />
        </div>
        
        {/* Unchecked items */}
        {uncheckedItems.map(({ line, index }) => (
          <div key={index} className="flex items-start gap-2">
            <button
              onClick={() => toggleEditTodoItem(noteId, index)}
              className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0 flex items-center justify-center hover:text-blue-400 transition-colors"
            >
              <Circle className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
              onChange={(e) => {
                const lines = newNoteContent.split('\n');
                lines[index] = `○ ${e.target.value}`;
                setNewNoteContent(lines.join('\n'));
              }}
              className="bg-transparent text-gray-300 text-sm flex-1 outline-none border-none"
              placeholder="Todo item text..."
            />
            <button
              onClick={() => {
                const lines = newNoteContent.split('\n');
                lines.splice(index, 1);
                setNewNoteContent(lines.join('\n'));
              }}
              className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        {/* Divider if there are both checked and unchecked items */}
        {uncheckedItems.length > 0 && checkedItemsList.length > 0 && (
          <div className="border-t border-gray-700 my-3"></div>
        )}
        
        {/* Checked items */}
        {checkedItemsList.map(({ line, index }) => (
          <div key={index} className="flex items-start gap-2 opacity-60">
            <button
              onClick={() => toggleEditTodoItem(noteId, index)}
              className="w-5 h-5 mt-0.5 text-green-500 flex-shrink-0 flex items-center justify-center hover:text-green-400 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
              onChange={(e) => {
                const lines = newNoteContent.split('\n');
                lines[index] = `● ${e.target.value}`;
                setNewNoteContent(lines.join('\n'));
              }}
              className="bg-transparent text-gray-400 text-sm flex-1 outline-none border-none line-through"
              placeholder="Todo item text..."
            />
            <button
              onClick={() => {
                const lines = newNoteContent.split('\n');
                lines.splice(index, 1);
                setNewNoteContent(lines.join('\n'));
              }}
              className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Render todo content with interactive checkboxes
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
      <div className="space-y-2">
        {/* Unchecked items */}
        {uncheckedItems.map(({ line, index }) => (
          <div key={index} className="flex items-start gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTodoItem(noteId, index);
              }}
              className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0 flex items-center justify-center hover:text-blue-400 transition-colors"
            >
              <Circle className="w-4 h-4" />
            </button>
            <span className="text-gray-300 text-sm flex-1">
              {line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
            </span>
          </div>
        ))}
        
        {/* Divider if there are both checked and unchecked items */}
        {uncheckedItems.length > 0 && checkedItemsList.length > 0 && (
          <div className="border-t border-gray-700 my-3"></div>
        )}
        
        {/* Checked items */}
        {checkedItemsList.map(({ line, index }) => (
          <div key={index} className="flex items-start gap-2 opacity-60">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTodoItem(noteId, index);
              }}
              className="w-5 h-5 mt-0.5 text-green-500 flex-shrink-0 flex items-center justify-center hover:text-green-400 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <span className="text-gray-400 text-sm flex-1 line-through">
              {line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Get all unique tags
  const allTags = Array.from(new Set(
    Array.isArray(notes) ? notes.flatMap(note => note.tags || []) : []
  )).sort();

  // Filter and search notes
  const filteredNotes = Array.isArray(notes) ? notes.filter((note: Note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "all" || 
                         (activeFilter === "pinned" && note.is_pinned) ||
                         (activeFilter === "recent" && note.last_modified && new Date(note.last_modified) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesFilter && matchesTag;
  }) : [];

  // Start editing a note
  const startEditing = (note: Note) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content || "");
    setNewNoteType(note.type || 'text');
    setNewNoteColor(note.color || 'gray');
    setNewNoteTags(note.tags || []);
    setTagInput('');
  };

  // Add pending todo item to content (like pressing Enter)
  const addPendingTodo = () => {
    if (pendingTodoText.trim()) {
      const newItem = `○ ${pendingTodoText.trim()}`;
      const currentContent = newNoteContent.trim();
      const updatedContent = currentContent ? `${newItem}\n${currentContent}` : newItem;
      setNewNoteContent(updatedContent);
      setPendingTodoText('');
      // Don't set focus to false here so button stays as "Add Todo" for next item
    }
  };

  // Save edited note
  const saveNote = () => {
    if (editingNote && newNoteTitle.trim()) {
      updateNoteMutation.mutate({
        id: editingNote.id,
        title: newNoteTitle,
        content: newNoteContent,
        type: newNoteType,
        color: newNoteColor,
        tags: newNoteTags
      });
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteType('text');
    setNewNoteColor('gray');
    setNewNoteTags([]);
    setTagInput('');
    setPendingTodoText('');
  };

  // Create new note
  const createNote = () => {
    if (newNoteTitle.trim()) {
      createNoteMutation.mutate({
        title: newNoteTitle,
        content: newNoteContent,
        type: newNoteType,
        folder: 'Unsorted',
        user_id: 'dev-user'
      });
    }
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !newNoteTags.includes(tagInput.trim())) {
      setNewNoteTags([...newNoteTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setNewNoteTags(newNoteTags.filter(tag => tag !== tagToRemove));
  };

  const sortedNotes = [...filteredNotes].sort((a: Note, b: Note) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    
    // Handle invalid dates gracefully
    const dateA = new Date(a.lastModified || a.last_modified || '');
    const dateB = new Date(b.lastModified || b.last_modified || '');
    
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <>
      <Helmet>
        <link rel="manifest" href="/notes-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Notes" />
        <meta name="theme-color" content="#F59E0B" />
      </Helmet>
      <div className="min-h-screen bg-gray-950 text-white">
      <MobileHeader pageName="Notes" />

      {/* Floating Dock */}
      <MobileFloatingDock />

      {/* Main Content */}
      <div className="p-4 space-y-4 pb-24">
        {/* Search and Filter Bar - Enhanced */}
        <div className="flex items-center gap-2">
          {/* Search Bar - Longer */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 px-3"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-gray-800 border-gray-700">
              {["all", "pinned", "recent"].map((filter) => (
                <DropdownMenuItem
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`cursor-pointer ${
                    activeFilter === filter
                      ? "bg-yellow-600/20 text-yellow-400"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tag Filter Dropdown */}
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`border-gray-600 hover:bg-gray-700 px-3 ${
                    selectedTag ? 'text-yellow-400 border-yellow-600' : 'text-gray-300'
                  }`}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-gray-800 border-gray-700 max-h-60 overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => setSelectedTag(null)}
                  className={`cursor-pointer ${
                    !selectedTag
                      ? "bg-yellow-600/20 text-yellow-400"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  All Tags
                </DropdownMenuItem>
                {allTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`cursor-pointer ${
                      selectedTag === tag
                        ? "bg-yellow-600/20 text-yellow-400"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Notes Grid */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading notes...</div>
          ) : sortedNotes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchTerm || activeFilter !== "all" ? "No notes match your filters" : "No notes yet. Create your first note!"}
            </div>
          ) : (
            sortedNotes.map((note: Note) => (
              <div 
                key={note.id} 
                className={`relative border-l-4 border-gray-700 rounded-lg p-2 sm:p-4 cursor-pointer hover:bg-gray-800/70 transition-colors ${getCardColor(note.color)}`}
                onClick={() => startEditing(note)}
              >
                {/* Pin icon in top left */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const isPinned = note.is_pinned || note.isPinned;
                    updateNoteMutation.mutate({
                      id: note.id,
                      title: note.title,
                      content: note.content,
                      isPinned: !isPinned
                    });
                  }}
                  className={`absolute top-2 left-2 z-10 w-6 h-6 flex items-center justify-center rounded transition-colors ${
                    note.is_pinned || note.isPinned 
                      ? 'text-yellow-400 hover:text-yellow-300' 
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {note.is_pinned || note.isPinned ? (
                    <Pin className="h-3 w-3 fill-current" />
                  ) : (
                    <Pin className="h-3 w-3" />
                  )}
                </button>

                <div className="flex items-start justify-between mb-2 pl-6">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getColorDot(note.color)}`}></div>
                    {getTypeIcon(note.type)}
                    <h3 className="font-medium text-sm text-white truncate text-ellipsis overflow-hidden" title={note.title}>
                      {note.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(note)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400"
                      title="Edit note"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                      disabled={deleteNoteMutation.isPending}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-gray-300 text-xs mb-3 overflow-hidden pl-6">
                  {note.type === 'todo' ? renderTodoContent(note.content, note.id) : (
                    <p className="line-clamp-10 text-ellipsis">{note.content}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between pl-6">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(note)}
                    </span>
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
            ))
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (open) {
          // Clear form when opening create dialog
          setNewNoteTitle("");
          setNewNoteContent("");
          setNewNoteType('text');
        }
      }}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-10 right-4 h-14 w-14 rounded-full bg-yellow-600 hover:bg-yellow-700 shadow-lg z-50"
            size="sm"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700 text-white w-[95vw] max-w-md mx-auto p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Add New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="note-title">Note Title</Label>
              <Input
                id="note-title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Enter note title..."
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Enter your note content..."
                className="bg-gray-800 border-gray-600 text-white min-h-32"
              />
            </div>
            
            {/* Note Customization Options */}
            <div className="space-y-3 border-t border-gray-700 pt-3">
              {/* Note Type */}
              <div>
                <Label className="text-gray-300 text-sm">Note Type</Label>
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  {[
                    { type: 'text', icon: FileText, label: 'Text' },
                    { type: 'todo', icon: CheckSquare, label: 'Todo' },
                    { type: 'markdown', icon: BookOpen, label: 'Markdown' },
                    { type: 'code', icon: Code, label: 'Code' }
                  ].map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant={newNoteType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewNoteType(type as any)}
                      className={`${newNoteType === type ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Note Color */}
              <div>
                <Label className="text-gray-300 text-sm">Color</Label>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewNoteColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newNoteColor === color ? 'border-white' : 'border-gray-600'
                      } ${
                        color === 'gray' ? 'bg-gray-500' :
                        color === 'red' ? 'bg-red-500' :
                        color === 'orange' ? 'bg-orange-500' :
                        color === 'yellow' ? 'bg-yellow-500' :
                        color === 'green' ? 'bg-green-500' :
                        color === 'blue' ? 'bg-blue-500' :
                        color === 'purple' ? 'bg-purple-500' :
                        'bg-pink-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label className="text-gray-300 text-sm">Tags</Label>
                <div className="space-y-1.5 mt-1.5">
                  {/* Existing tags */}
                  {newNoteTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newNoteTags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-1 bg-gray-700 rounded-md px-2 py-1">
                          <span className="text-xs text-gray-200">{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add new tag */}
                  <div className="flex gap-1.5">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="bg-gray-800 border-gray-600 text-white flex-1"
                    />
                    <Button
                      onClick={addTag}
                      disabled={!tagInput.trim()}
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetCreateForm();
                }}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={createNote}
                disabled={!newNoteTitle || createNoteMutation.isPending}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                {createNoteMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white w-full h-screen max-w-none m-0 rounded-none p-0 overflow-hidden [&>button]:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <DialogHeader className="flex-1">
                <DialogTitle className="text-lg font-semibold text-white truncate">
                  {editingNote?.title || "Edit Note"}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-scroll pb-20" 
              style={{ 
                WebkitOverflowScrolling: 'touch',
                maxHeight: 'calc(100vh - 140px)',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="edit-note-title" className="text-gray-300">Note Title</Label>
                  <Input
                    id="edit-note-title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>


                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="edit-note-content" className="text-gray-300">Content</Label>
                    {editingNote?.type === 'todo' && (
                      <div className="text-xs text-gray-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Circle className="w-3 h-3" />
                          Unchecked
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Checked
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {editingNote?.type === 'todo' ? (
                    <div className="bg-gray-800 border border-gray-600 rounded-md p-3 min-h-[300px]">
                      {/* Render interactive todo items in edit mode */}
                      {renderEditTodoContent(newNoteContent, editingNote.id)}
                    </div>
                  ) : (
                    <Textarea
                      id="edit-note-content"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Enter your note content..."
                      className="bg-gray-800 border-gray-600 text-white mt-1 min-h-[300px] resize-none"
                    />
                  )}
                  
                  {editingNote?.type === 'todo' && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-800/30 rounded">
                      <div className="font-medium mb-1">Todo Format Guide:</div>
                      <div>• Click checkboxes to toggle between completed/pending</div>
                      <div>• Lines starting with ○ or blank = unchecked</div>
                      <div>• Lines starting with ● or ✓ = checked</div>
                      <div>• Each line becomes a clickable checkbox in view mode</div>
                    </div>
                  )}
                </div>

                {/* Note Customization Options */}
                <div className="space-y-4 border-t border-gray-700 pt-4">
                  {/* Note Type */}
                  <div>
                    <Label className="text-gray-300">Note Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        { type: 'text', icon: FileText, label: 'Text' },
                        { type: 'todo', icon: CheckSquare, label: 'Todo' },
                        { type: 'markdown', icon: BookOpen, label: 'Markdown' },
                        { type: 'code', icon: Code, label: 'Code' }
                      ].map(({ type, icon: Icon, label }) => (
                        <Button
                          key={type}
                          variant={newNoteType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewNoteType(type as any)}
                          className={`${newNoteType === type ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Note Color */}
                  <div>
                    <Label className="text-gray-300">Color</Label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewNoteColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newNoteColor === color ? 'border-white' : 'border-gray-600'
                          } ${
                            color === 'gray' ? 'bg-gray-500' :
                            color === 'red' ? 'bg-red-500' :
                            color === 'orange' ? 'bg-orange-500' :
                            color === 'yellow' ? 'bg-yellow-500' :
                            color === 'green' ? 'bg-green-500' :
                            color === 'blue' ? 'bg-blue-500' :
                            color === 'purple' ? 'bg-purple-500' :
                            'bg-pink-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label className="text-gray-300">Tags</Label>
                    <div className="space-y-2 mt-1">
                      {/* Existing tags */}
                      {newNoteTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newNoteTags.map((tag, index) => (
                            <div key={index} className="flex items-center gap-1 bg-gray-700 rounded-md px-2 py-1">
                              <span className="text-xs text-gray-200">{tag}</span>
                              <button
                                onClick={() => removeTag(tag)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add new tag */}
                      <div className="flex gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add tag..."
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          className="bg-gray-800 border-gray-600 text-white flex-1"
                        />
                        <Button
                          onClick={addTag}
                          disabled={!tagInput.trim()}
                          size="sm"
                          className="bg-gray-700 hover:bg-gray-600"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note metadata */}
                {editingNote && (
                  <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-800/50 rounded-lg">
                    <div>Type: <span className="text-gray-400 capitalize">{editingNote.type}</span></div>
                    <div>Last modified: <span className="text-gray-400">{formatDate(editingNote)}</span></div>
                    {editingNote.tags && editingNote.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>Tags:</span>
                        {editingNote.tags.map((tag, index) => (
                          <span key={index} className="px-1.5 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900 z-50">
              <div className="flex space-x-2">
                <Button
                  onClick={() => setEditingNote(null)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (pendingTodoText.trim() && editingNote?.type === 'todo') {
                      addPendingTodo();
                    } else {
                      saveNote();
                    }
                  }}
                  disabled={!newNoteTitle || updateNoteMutation.isPending}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                >
                  {updateNoteMutation.isPending ? "Saving..." : 
                   (pendingTodoText.trim() && editingNote?.type === 'todo') ? "Add Todo" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}