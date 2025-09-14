import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

// Comprehensive color palette for folder selection
const FOLDER_COLORS = [
  // Primary Colors
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  
  // Cool Colors
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  
  // Warm Colors
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Coral', value: '#ff6b6b' },
  { name: 'Peach', value: '#ffab91' },
  { name: 'Gold', value: '#ffd700' },
  
  // Neutrals
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Zinc', value: '#71717a' },
  { name: 'Stone', value: '#78716c' }
];

interface UniversalFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (data: { name: string; icon: string; color: string }) => void;
  editingFolder?: { id: number | string; name: string; color?: string; icon?: string } | null;
  isLoading?: boolean;
  contextType: 'folders' | 'albums' | 'collections';
}

export function UniversalFolderModal({
  open,
  onOpenChange,
  onCreateFolder,
  editingFolder = null,
  isLoading = false,
  contextType = 'folders'
}: UniversalFolderModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[2].value); // Default to purple
  const [customColor, setCustomColor] = useState("#8b5cf6");
  const [useCustomColor, setUseCustomColor] = useState(false);

  // Initialize form with editing folder data when modal opens
  React.useEffect(() => {
    if (open && editingFolder) {
      // Safely handle name with fallback
      setName(editingFolder.name || '');
      const folderColor = editingFolder.color || FOLDER_COLORS[2].value;
      setSelectedColor(folderColor);
      setCustomColor(folderColor);
      
      // Check if the color is in our predefined palette
      const isPresetColor = FOLDER_COLORS.some(color => color.value === folderColor);
      setUseCustomColor(!isPresetColor);
    } else if (open && !editingFolder) {
      // Reset form for new folder creation
      setName('');
      setSelectedColor(FOLDER_COLORS[2].value);
      setCustomColor("#8b5cf6");
      setUseCustomColor(false);
    }
  }, [open, editingFolder]);

  // Context-sensitive content
  const getTitle = () => {
    const isEditing = editingFolder !== null;
    switch (contextType) {
      case 'albums': return isEditing ? 'Edit Album' : 'Create New Album';
      case 'collections': return isEditing ? 'Edit Collection' : 'Create New Collection';
      default: return isEditing ? 'Edit Folder' : 'Create New Folder';
    }
  };

  const getDescription = () => {
    const isEditing = editingFolder !== null;
    switch (contextType) {
      case 'albums': return isEditing ? 'Update your album name and color.' : 'Organize your media by creating a new album with a custom name and color.';
      case 'collections': return isEditing ? 'Update your collection name and color.' : 'Organize your shared content by creating a new collection with a custom name and color.';
      default: return isEditing ? 'Update your folder name and color.' : 'Organize your prompts by creating a new folder with a custom name and color.';
    }
  };

  const getButtonText = () => {
    const isEditing = editingFolder !== null;
    switch (contextType) {
      case 'albums': return isEditing ? 'Update Album' : 'Create Album';
      case 'collections': return isEditing ? 'Update Collection' : 'Create Collection';
      default: return isEditing ? 'Update Folder' : 'Create Folder';
    }
  };

  const getPlaceholder = () => {
    switch (contextType) {
      case 'albums': return 'Enter album name';
      case 'collections': return 'Enter collection name';
      default: return 'Enter folder name';
    }
  };

  const getPreviewText = () => {
    const safeName = name || '';
    return safeName.trim() || (contextType === 'albums' ? 'New Album' : contextType === 'collections' ? 'New Collection' : 'New Folder');
  };



  const handleCreate = () => {
    const safeName = name || '';
    if (!safeName.trim()) return;

    onCreateFolder({
      name: safeName.trim(),
      icon: "folder",
      color: useCustomColor ? customColor : selectedColor
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
    setName("");
    setSelectedColor(FOLDER_COLORS[2].value);
    setCustomColor("#8b5cf6");
    setUseCustomColor(false);
  };

  const currentColor = useCustomColor ? customColor : selectedColor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-400" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm mt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-white font-medium">
              {contextType === 'albums' ? 'Album Name' : contextType === 'collections' ? 'Collection Name' : 'Folder Name'} *
            </Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full bg-gray-800 border-2 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <Label className="text-white font-medium flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-600" 
                style={{ backgroundColor: currentColor }}
              />
              {contextType === 'albums' ? 'Album Color' : contextType === 'collections' ? 'Collection Color' : 'Folder Color'}
            </Label>
            
            {/* Color Grid */}
            <div className="grid grid-cols-8 gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color.value);
                    setUseCustomColor(false);
                  }}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all hover:scale-105",
                    !useCustomColor && selectedColor === color.value
                      ? "border-white scale-105 shadow-lg"
                      : "border-gray-600 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {!useCustomColor && selectedColor === color.value && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Section */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="customColor"
                  checked={useCustomColor}
                  onChange={(e) => {
                    setUseCustomColor(e.target.checked);
                    if (e.target.checked) {
                      setSelectedColor(customColor);
                    }
                  }}
                  className="rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                />
                <Label htmlFor="customColor" className="text-gray-300 text-sm">
                  Use custom color
                </Label>
              </div>
              
              {useCustomColor && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setSelectedColor(e.target.value);
                    }}
                    className="w-10 h-10 rounded-lg border-2 border-gray-600 bg-transparent cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.match(/^#[0-9a-fA-F]{0,6}$/)) {
                        setCustomColor(value);
                        if (value.length === 7) {
                          setSelectedColor(value);
                        }
                      }
                    }}
                    placeholder="#8b5cf6"
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Preview</Label>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Folder 
                  className="h-6 w-6" 
                  style={{ color: currentColor }}
                />
                <span className="font-medium text-white">{getPreviewText()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isLoading}
            className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {getButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}