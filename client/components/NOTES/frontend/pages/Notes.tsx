import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Helmet } from 'react-helmet';
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
  ChevronDown,
  X,
  Grid3X3,
  Grid,
  Plus,
  Circle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Import our new shared components - EXACT Media Gallery components
import FolderSidebar from "@/components/shared/FolderSidebar";
import TagSidebar from "@/components/shared/TagSidebar";
import NoteEditor from "@/components/shared/NoteEditor";
import { UniversalFolderModal } from "@/components/ui/UniversalFolderModal";
import { UniversalTagsModal } from "@/components/ui/UniversalTagsModal";
import { useLocation } from "wouter";
import { getMobilePageConfig } from "@/utils/pageConfig";

// Types
interface Note {
  id: number;
  title: string;
  content: string;
  type: 'text' | 'markdown' | 'code' | 'todo' | 'html';
  tags?: string[];
  folder?: string;
  color?: string | null;
  isPinned?: boolean;
  lastModified: string;
  backgroundImage?: string;
}

interface Folder {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  count?: number;
  isDefault?: boolean;
}

interface Tag {
  id: number;
  name: string;
  color?: string;
  textColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  count?: number;
}

import MainLayout from "@/layouts/MainLayout";

export default function Notes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Get page configuration
  const pageConfig = getMobilePageConfig(location);
  const words = pageConfig.label.split(' ');
  const lastWord = words[words.length - 1];
  const firstWords = words.slice(0, -1).join(' ');
  
  // State
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry"); // Default to masonry
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // Auto-collapse left panel on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setLeftPanelCollapsed(true);
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Register service worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered:', registration);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null); // For right panel editor
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, Record<number, boolean>>>({});
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);

  // Queries with comprehensive error handling and null safety
  const { data: notesData, isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ["/api/notes"],
    retry: false,
    staleTime: 0
  });

  const { data: foldersData, error: foldersError } = useQuery({
    queryKey: ["/api/note-folders"],
    retry: false,
    staleTime: 0
  });

  const { data: tagsData, error: tagsError } = useQuery({
    queryKey: ["/api/note-tags"],
    retry: false,
    staleTime: 0
  });

  // Safely handle potentially null/undefined data with proper fallbacks
  // Handle both direct array response and wrapped response structures
  const notes = Array.isArray(notesData) ? notesData : 
                (notesData && typeof notesData === 'object' && 'data' in notesData && Array.isArray(notesData.data)) ? notesData.data : 
                [];
  const folders = Array.isArray(foldersData) ? foldersData : [];
  const tags = Array.isArray(tagsData) ? tagsData : [];

  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: (noteData: { title: string; content?: string; type?: string; folder?: string }) => {
      return apiRequest<Note>("/api/notes", "POST", {
        ...noteData,
        user_id: "dev-user" // Add required user_id field
      });
    },
    onSuccess: (newNote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      // Only set selected note if we have a valid response
      if (newNote && newNote.id) {
        setSelectedNote(newNote); // Open the newly created note for editing
      }
      toast({
        title: "Note Created",
        description: "Your new note has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Note creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: (noteData: Partial<Note> & { id: number }) => {
      return apiRequest<Note>(`/api/notes/${noteData.id}`, "PUT", noteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
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
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => {
      return apiRequest(`/api/notes/${noteId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      if (selectedNote) {
        setSelectedNote(null); // Close editor if deleted note was selected
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

  const createTagMutation = useMutation({
    mutationFn: (tagData: { name: string; color: string }) => {
      return apiRequest("/api/note-tags", "POST", tagData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/note-tags"] });
      toast({
        title: "Tag Created",
        description: "New tag has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: (tagData: { id: number; tagData: { name?: string; color?: string; textColor?: string; borderColor?: string; backgroundColor?: string } }) => {
      return apiRequest(`/api/note-tags/${tagData.id}`, "PUT", tagData.tagData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/note-tags"] });
      toast({
        title: "Tag Updated",
        description: "Tag has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => {
      return apiRequest(`/api/note-tags/${tagId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/note-tags"] });
      toast({
        title: "Tag Deleted",
        description: "Tag has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; icon?: string; color?: string }) => 
      apiRequest("/api/note-folders", "POST", { 
        name: data.name, 
        icon: data.icon || "folder", 
        color: data.color || "#6366f1" 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/note-folders"] });
      setCreateFolderModalOpen(false);
      toast({ title: "Folder created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create folder", variant: "destructive" });
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: number) => 
      apiRequest(`/api/note-folders/${folderId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/note-folders"] });
      toast({ title: "Folder deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete folder", variant: "destructive" });
    }
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

  // Filter notes with comprehensive null safety
  const filteredNotes = notes.filter((note: Note) => {
    // Safety check: ensure note exists and has required properties
    if (!note || !note.title || !note.lastModified) {
      return false;
    }

    // Folder filter
    if (selectedFolder !== "all") {
      if (note.folder?.toString() !== selectedFolder) {
        return false;
      }
    }

    // Tag filter with proper null safety
    if (selectedTags.length > 0) {
      const noteTags = Array.isArray(note.tags) ? note.tags : [];
      if (!selectedTags.every(tag => noteTags.includes(tag))) {
        return false;
      }
    }

    // Search filter with null safety
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = note.title ? note.title.toLowerCase() : "";
      const content = note.content ? note.content.toLowerCase() : "";
      const noteTags = Array.isArray(note.tags) ? note.tags : [];
      
      return (
        title.includes(query) ||
        content.includes(query) ||
        noteTags.some(tag => tag && tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Sort notes with null safety
  const sortedNotes = Array.isArray(filteredNotes) ? [...filteredNotes].sort((a, b) => {
    // Safety checks
    if (!a || !b) return 0;
    
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Safe date parsing
    const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
    const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
    
    return dateB - dateA;
  }) : [];

  // Separate pinned and unpinned notes
  const pinnedNotes = sortedNotes.filter(note => note.isPinned);
  const unpinnedNotes = sortedNotes.filter(note => !note.isPinned);

  // Handlers
  const handleCreateNew = () => {
    const now = new Date().toISOString();
    const newNoteData = {
      title: "Untitled Note",
      content: "",
      type: "text" as const,
      folder: selectedFolder === "all" ? "Unsorted" : selectedFolder
    };
    
    createNoteMutation.mutate(newNoteData);
  };

  const handleSelectContainer = (id: string) => {
    setSelectedFolder(id);
  };

  const handleToggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleEditTag = (tag: any) => {
    setTagsModalOpen(true);
  };

  const handleEditContainer = (folder?: any) => {
    if (folder) {
      setEditingFolder(folder);
    } else {
      setEditingFolder(null);
    }
    setCreateFolderModalOpen(true);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
  };

  const handleNoteSave = (note: Note) => {
    if (note.id) {
      updateNoteMutation.mutate(note);
    } else {
      // This is a new note, create it
      createNoteMutation.mutate({
        title: note.title,
        content: note.content,
        type: note.type,
        folder: note.folder
      });
    }
  };

  const handleNoteCancel = () => {
    // Reset to original note if needed
  };

  const handleNoteClose = () => {
    setSelectedNote(null);
  };

  const togglePin = (noteId: number) => {
    const note = notes.find((n: Note) => n.id === noteId);
    if (note) {
      updateNoteMutation.mutate({
        id: noteId,
        isPinned: !note.isPinned
      });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTagColor = (tagName: string) => {
    const tag = tags.find((t: Tag) => t.name === tagName);
    return tag?.color || 'blue';
  };

  // Helper function to get card color styling based on note color
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

  // Helper function to get color dot styling
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

  // Render note card with mobile styling
  const renderNoteCard = (note: Note) => (
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
          {getTypeIcon(note.type)}
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
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white">
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="text-xs md:text-sm text-gray-300 mb-2 leading-relaxed pl-6">
        {note.type === 'todo' ? (
          <div className="line-clamp-4 md:line-clamp-3">
            {renderTodoContent(note.content, note.id)}
          </div>
        ) : (
          <div className="whitespace-pre-wrap line-clamp-4 md:line-clamp-3">
            {note.content}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs pl-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{formatDate(note.lastModified)}</span>
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

  if (notesLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Loading your notes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>Elite Notes</title>
        <link rel="manifest" href="/notes-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Notes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="Elite Notes" />
        <link rel="icon" type="image/png" sizes="192x192" href="/elite-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/elite-icon-512.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Helmet>
      
      {/* Page Header */}
      <div className="flex items-center justify-between p-4 pt-0 border-transparent ml-48">
        <div className="flex items-center gap-3">
          {/* Page Icon */}
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ color: pageConfig.color }}
          >
            {pageConfig.icon}
          </div>
          {/* Page Title with Gradient */}
          <h1 className="text-2xl font-bold">
            {firstWords && (
              <span className="text-white mr-1">{firstWords}</span>
            )}
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(45deg, ${pageConfig.color}, ${pageConfig.color}dd)`
              }}
            >
              {lastWord}
            </span>
          </h1>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>
      {/* Main Content - Collapsible left panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Collapsible */}
        <div className={`${leftPanelCollapsed ? 'w-0' : 'w-64'} transition-all duration-300 border-r dark:border-gray-700 flex flex-col flex-shrink-0 overflow-hidden`}>
          <div className="border-b dark:border-gray-700 p-4 flex justify-between items-center pt-[4px] pb-[4px]">
            <h2 className="text-lg font-bold">Folders & Tags</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Folders - Using shared component with EXACT Media Gallery logic */}
            <FolderSidebar
              title="Folders"
              folders={folders.map((folder: any) => ({
                id: folder.id,
                name: folder.name,
                color: folder.color,
                count: notes.filter((note: Note) => note.folder === folder.id).length
              }))}
              activeFolder={selectedFolder}
              activeTag={selectedTags.length > 0 ? selectedTags[0] : null}
              onFolderClick={handleSelectContainer}
              onClearFilters={() => {
                setSelectedFolder("all");
                setSelectedTags([]);
              }}
              onCreateFolder={handleEditContainer}
              onDeleteFolder={(folderId) => deleteFolderMutation.mutate(Number(folderId))}
              
              stats={{ totalCount: notes.length }}
              resourceName="Notes"
            />
            
            {/* Tags - Using shared component with EXACT Media Gallery logic */}
            <TagSidebar
              tags={tags.map((tag: any) => ({
                id: tag.id,
                name: tag.name,
                color: tag.color,
                textColor: tag.textColor,
                borderColor: tag.borderColor,
                backgroundColor: tag.backgroundColor,
                count: notes.filter((note: Note) => note.tags?.includes(tag.name)).length
              }))}
              activeTag={selectedTags.length > 0 ? tags.find((t: Tag) => selectedTags.includes(t.name))?.id || null : null}
              onTagClick={(tagId) => {
                const tag = tags.find((t: Tag) => t.id === tagId);
                if (tag) {
                  handleToggleTag(tag.name);
                }
              }}
              onCreateTag={() => setTagsModalOpen(true)}
              onEditTag={(tag) => setTagsModalOpen(true)}
              onManageTags={() => setTagsModalOpen(true)}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-w-0">
          {/* Notes Grid */}
          <div className="flex-1 min-w-0">
            {/* View buttons aligned left in middle section header */}
            <div className="border-b dark:border-gray-700 p-3 flex items-center gap-2">
              {leftPanelCollapsed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelCollapsed(false)}
                  className="h-8 w-8 p-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={handleCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
              <Button 
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "masonry" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("masonry")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            
            </div>
            
            <div className="h-full overflow-y-auto">
              {/* Main Notes Content */}
              <div className="p-2 sm:p-4">
                {sortedNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No notes found</h3>
            <p className="text-sm text-center mb-4">
              {searchQuery || selectedTags.length > 0 || selectedFolder !== "all"
                ? "Try adjusting your filters or search terms."
                : "Create your first note to get started."}
            </p>
            <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create your first note
            </Button>
          </div>
        ) : (
          <>
            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Pinned</h3>
                <div className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3"
                    : "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-4"
                )}>
                  {pinnedNotes.map((note) => renderNoteCard(note))}
                </div>
              </div>
            )}

            {/* Unpinned Notes Section */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">Notes</h3>
                )}
                <div className={cn(
                  viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3"
                    : "columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 md:gap-4"
                )}>
                  {unpinnedNotes.map((note) => renderNoteCard(note))}
                </div>
              </div>
            )}
          </>
        )}
              </div>
            </div>
          </div>

          {/* Right Panel - Note Editor */}
          {selectedNote && (
            <div className="w-80 sm:w-96 md:w-[400px] lg:w-[450px] xl:w-[500px] border-l dark:border-gray-700 flex-shrink-0 min-w-0">
              <NoteEditor
                note={selectedNote}
                onSave={handleNoteSave}
                onCancel={handleNoteCancel}
                onClose={handleNoteClose}
                availableTags={tags.map((tag: Tag) => tag.name)}
                folders={folders}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Universal Folder Modal */}
      <UniversalFolderModal
        open={createFolderModalOpen}
        onOpenChange={(open) => {
          setCreateFolderModalOpen(open);
          if (!open) setEditingFolder(null);
        }}
        onCreateFolder={(data) => {
          createFolderMutation.mutate(data);
        }}
        editingFolder={editingFolder}
        isLoading={createFolderMutation.isPending}
        contextType="folders"
      />
      
      {/* Universal Tags Modal */}
      <UniversalTagsModal
        open={tagsModalOpen}
        onOpenChange={setTagsModalOpen}
        tags={(() => {
          // Get all unique tag names from notes
          const noteTags = new Set<string>();
          notes.forEach((note: Note) => {
            if (Array.isArray(note.tags)) {
              note.tags.forEach((tag: string) => noteTags.add(tag));
            }
          });

          // Create unified tag list
          const systemTags = tags.map((tag: Tag) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color || "#3b82f6",
            textColor: tag.color || "#3b82f6",
            borderColor: tag.color || "#3b82f6",
            backgroundColor: `${tag.color || "#3b82f6"}20`,
            source: 'system' as const
          }));

          // Add note-specific tags not in system
          const systemTagNames = new Set(systemTags.map(tag => tag.name));
          const uniqueNoteTags = Array.from(noteTags)
            .filter(tagName => !systemTagNames.has(tagName))
            .map(tagName => ({
              id: `note-${tagName}`,
              name: tagName,
              color: '#6b7280',
              textColor: '#ffffff',
              borderColor: '#9ca3af',
              backgroundColor: '#374151',
              source: 'prompt-specific' as const
            }));

          return [...systemTags, ...uniqueNoteTags];
        })()}
        onCreateTag={(tagData) => {
          createTagMutation.mutate(tagData);
        }}
        onUpdateTag={(id, tagData) => {
          if (typeof id === 'number') {
            updateTagMutation.mutate({ id, tagData });
          }
        }}
        onDeleteTag={(id) => {
          if (typeof id === 'number') {
            deleteTagMutation.mutate(id);
          }
        }}
        isLoading={createTagMutation.isPending || updateTagMutation.isPending || deleteTagMutation.isPending}
        contextType="note-tags"
      />
    </div>
  );
}