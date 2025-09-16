import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  X, 
  FileText, 
  Code, 
  CheckSquare, 
  BookOpen, 
  Eye,
  Plus,
  Trash2,
  Circle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { UniversalFolderModal } from '@/components/ui/UniversalFolderModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: number;
  title: string;
  content: string;
  type: 'text' | 'markdown' | 'code' | 'todo' | 'html';
  tags?: string[];
  folderId?: number;
  isPinned?: boolean;
  lastModified: string;
}

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onCancel: () => void;
  onClose: () => void;
  availableTags: string[];
  folders: Array<{ id: number; name: string; color?: string }>;
}

export default function NoteEditor({ 
  note, 
  onSave, 
  onCancel, 
  onClose, 
  availableTags, 
  folders 
}: NoteEditorProps) {
  const [editedNote, setEditedNote] = useState<Note | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [pendingTodoText, setPendingTodoText] = useState('');
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Initialize edited note when note prop changes
  useEffect(() => {
    if (note) {
      setEditedNote({ ...note });
      setHasChanges(false);
    }
  }, [note]);

  // Track changes
  useEffect(() => {
    if (note && editedNote) {
      const changed = 
        note.title !== editedNote.title ||
        note.content !== editedNote.content ||
        note.type !== editedNote.type ||
        JSON.stringify(note.tags) !== JSON.stringify(editedNote.tags) ||
        note.folderId !== editedNote.folderId ||
        note.isPinned !== editedNote.isPinned;
      setHasChanges(changed);
    }
  }, [note, editedNote]);

  if (!note || !editedNote) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a note to edit</p>
        </div>
      </div>
    );
  }

  // Add pending todo item to content
  const addPendingTodo = () => {
    if (pendingTodoText.trim() && editedNote) {
      const newItem = `○ ${pendingTodoText.trim()}`;
      const currentContent = editedNote.content?.trim() || '';
      const updatedContent = currentContent ? `${newItem}\n${currentContent}` : newItem;
      setEditedNote({ ...editedNote, content: updatedContent });
      setPendingTodoText('');
    }
  };

  // Render interactive todo content in edit mode
  const renderTodoEditContent = () => {
    const content = editedNote?.content || '';
    const lines = content.split('\n');
    
    // Separate checked and unchecked items
    const uncheckedItems: Array<{line: string, index: number}> = [];
    const checkedItemsList: Array<{line: string, index: number}> = [];
    
    lines.forEach((line, index) => {
      if (line.trim() === '') return;
      const isChecked = line.trim().startsWith('●') || line.trim().startsWith('✓');
      
      if (isChecked) {
        checkedItemsList.push({ line, index });
      } else {
        uncheckedItems.push({ line, index });
      }
    });

    const updateTodoLine = (lineIndex: number, newText: string) => {
      const updatedLines = [...lines];
      const currentLine = updatedLines[lineIndex] || '';
      const isChecked = currentLine.trim().startsWith('●') || currentLine.trim().startsWith('✓');
      const prefix = isChecked ? '● ' : '○ ';
      updatedLines[lineIndex] = newText.trim() ? `${prefix}${newText.trim()}` : '';
      const newContent = updatedLines.filter(line => line.trim() !== '').join('\n');
      setEditedNote({ ...editedNote, content: newContent });
    };

    const toggleTodoInEdit = (lineIndex: number) => {
      const updatedLines = [...lines];
      const currentLine = updatedLines[lineIndex] || '';
      const text = currentLine.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim();
      
      if (currentLine.trim().startsWith('●') || currentLine.trim().startsWith('✓')) {
        updatedLines[lineIndex] = `○ ${text}`;
      } else {
        updatedLines[lineIndex] = `● ${text}`;
      }
      
      const newContent = updatedLines.filter(line => line.trim() !== '').join('\n');
      setEditedNote({ ...editedNote, content: newContent });
    };
    
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 min-h-[300px] bg-background">
        <div className="space-y-2">
          {/* Add new todo item input at top */}
          <div className="flex items-start gap-2 pb-2 border-b border-gray-300 dark:border-gray-600">
            <Circle className="w-4 h-4 mt-0.5 text-gray-500" />
            <input
              type="text"
              placeholder="Add new todo item..."
              value={pendingTodoText}
              onChange={(e) => setPendingTodoText(e.target.value)}
              className="bg-transparent text-foreground text-sm flex-1 outline-none border-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  addPendingTodo();
                }
              }}
            />
          </div>
          
          {/* Unchecked items */}
          {uncheckedItems.map(({ line, index }) => (
            <div key={index} className="flex items-start gap-2">
              <button
                onClick={() => toggleTodoInEdit(index)}
                className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0 flex items-center justify-center hover:text-blue-500 transition-colors"
              >
                <Circle className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
                onChange={(e) => updateTodoLine(index, e.target.value)}
                className="bg-transparent text-foreground text-sm flex-1 outline-none border-none"
                placeholder="Todo item text..."
              />
              <button
                onClick={() => {
                  const lines = (editedNote?.content || '').split('\n');
                  lines.splice(index, 1);
                  const newContent = lines.filter(line => line.trim() !== '').join('\n');
                  setEditedNote({ ...editedNote, content: newContent });
                }}
                className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Divider if there are both checked and unchecked items */}
          {uncheckedItems.length > 0 && checkedItemsList.length > 0 && (
            <div className="border-t border-gray-300 dark:border-gray-600 my-3"></div>
          )}
          
          {/* Checked items */}
          {checkedItemsList.map(({ line, index }) => (
            <div key={index} className="flex items-start gap-2 opacity-60">
              <button
                onClick={() => toggleTodoInEdit(index)}
                className="w-5 h-5 mt-0.5 text-green-500 flex-shrink-0 flex items-center justify-center hover:text-green-400 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={line.replace(/^[\s]*[✓\[\]x●○]\s*/, '').trim()}
                onChange={(e) => updateTodoLine(index, e.target.value)}
                className="bg-transparent text-muted-foreground text-sm flex-1 outline-none border-none line-through"
                placeholder="Todo item text..."
              />
              <button
                onClick={() => {
                  const lines = (editedNote?.content || '').split('\n');
                  lines.splice(index, 1);
                  const newContent = lines.filter(line => line.trim() !== '').join('\n');
                  setEditedNote({ ...editedNote, content: newContent });
                }}
                className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleSave = () => {
    if (editedNote) {
      // FRONTEND DEBUG: Log what we're about to send
      console.log('\n=== FRONTEND NOTE SAVE DEBUG ===');
      console.log('Original editedNote object:', editedNote);
      
      const noteToSave = {
        ...editedNote,
        lastModified: new Date().toISOString()
      };
      
      // Strip null values before sending to API
      const cleanedNote = {};
      Object.entries(noteToSave).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          cleanedNote[key] = value;
        }
      });
      
      console.log('Cleaned note (nulls removed):', cleanedNote);
      console.log('=== FRONTEND DEBUG END ===\n');
      
      onSave(cleanedNote);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setEditedNote({ ...note });
        setHasChanges(false);
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && editedNote && !editedNote.tags?.includes(newTag.trim())) {
      setEditedNote({
        ...editedNote,
        tags: [...(editedNote.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editedNote) {
      setEditedNote({
        ...editedNote,
        tags: editedNote.tags?.filter(tag => tag !== tagToRemove) || []
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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Editor Header */}
      <div className="border-b dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Note</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Save/Cancel buttons */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => {
              if (pendingTodoText.trim() && editedNote?.type === 'todo') {
                addPendingTodo();
              } else {
                handleSave();
              }
            }}
            disabled={!hasChanges && !(pendingTodoText.trim() && editedNote?.type === 'todo')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {(pendingTodoText.trim() && editedNote?.type === 'todo') ? "Add Todo" : "Save"}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {hasChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              • Unsaved changes
            </span>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            value={editedNote.title}
            onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
            placeholder="Enter note title..."
          />
        </div>

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {getTypeIcon(editedNote.type)}
                <span className="ml-2 capitalize">{editedNote.type}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => setEditedNote({ ...editedNote, type: 'text' })}>
                <FileText className="mr-2 h-4 w-4" />
                Plain Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditedNote({ ...editedNote, type: 'markdown' })}>
                <Eye className="mr-2 h-4 w-4" />
                Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditedNote({ ...editedNote, type: 'code' })}>
                <Code className="mr-2 h-4 w-4" />
                Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditedNote({ ...editedNote, type: 'todo' })}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Todo List
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditedNote({ ...editedNote, type: 'html' })}>
                <BookOpen className="mr-2 h-4 w-4" />
                HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Folder selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Folder</label>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start">
                  <span>
                    {editedNote.folderId 
                      ? folders.find(f => f.id === editedNote.folderId)?.name || 'Select folder...'
                      : 'No folder'
                    }
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem onClick={() => setEditedNote({ ...editedNote, folderId: undefined })}>
                  No folder
                </DropdownMenuItem>
                {folders.map(folder => (
                  <DropdownMenuItem 
                    key={folder.id}
                    onClick={() => setEditedNote({ ...editedNote, folderId: folder.id })}
                  >
                    {folder.color && (
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: folder.color }}
                      />
                    )}
                    {folder.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setCreateFolderModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCreateFolderModalOpen(true)}
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="space-y-2">
            {/* Existing tags */}
            <div className="flex flex-wrap gap-2">
              {editedNote.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            {/* Add new tag */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Content</label>
          {editedNote.type === 'todo' ? (
            renderTodoEditContent()
          ) : (
            <Textarea
              value={editedNote.content || ""}
              onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
              placeholder="Enter your content here..."
              className="min-h-[300px] resize-none"
            />
          )}
        </div>

        {/* Pin toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pinned"
            checked={editedNote.isPinned || false}
            onChange={(e) => setEditedNote({ ...editedNote, isPinned: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="pinned" className="text-sm">Pin this note</label>
        </div>
      </div>

      {/* Universal Folder Modal */}
      <UniversalFolderModal
        open={createFolderModalOpen}
        onOpenChange={setCreateFolderModalOpen}
        onCreateFolder={(data) => {
          createFolderMutation.mutate(data);
        }}
        isLoading={createFolderMutation.isPending}
        contextType="folders"
      />
    </div>
  );
}