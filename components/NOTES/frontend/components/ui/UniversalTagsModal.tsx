import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit3, Trash2, Check, X, Palette, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TagData {
  id?: number | string;
  dbId?: number;
  name: string;
  color: string;
  textColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  source?: 'system' | 'user' | 'prompt-specific';
}

interface UniversalTagsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TagData[];
  onCreateTag: (tag: Omit<TagData, 'id'>) => void;
  onUpdateTag: (id: number | string, tag: Omit<TagData, 'id'>) => void;
  onDeleteTag: (id: number | string) => void;
  onHideTag?: (id: number) => void;
  isLoading?: boolean;
  contextType?: string;
  isAdminMode?: boolean;
}

export function UniversalTagsModal({
  open,
  onOpenChange,
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onHideTag,
  isLoading = false,
  contextType = "tags",
  isAdminMode = true
}: UniversalTagsModalProps) {
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [newTagTextColor, setNewTagTextColor] = useState("#ffffff");
  const [newTagBorderColor, setNewTagBorderColor] = useState("#3b82f6");
  const [newTagBackgroundColor, setNewTagBackgroundColor] = useState("#1e40af20");
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { toast } = useToast();

  // Predefined color palette
  const colorPalette = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
    "#14b8a6", "#f43f5e", "#8b5cf6", "#64748b", "#0ea5e9",
    "#22c55e", "#eab308", "#a855f7", "#06b6d4", "#f59e0b",
    "#ef4444", "#10b981", "#3b82f6", "#f97316"
  ];

  useEffect(() => {
    if (!open) {
      setEditingTag(null);
      setShowCreateForm(false);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setNewTagName("");
    setNewTagColor("#3b82f6");
    setNewTagTextColor("#ffffff");
    setNewTagBorderColor("#3b82f6");
    setNewTagBackgroundColor("#1e40af20");
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast({ title: "Tag name is required", variant: "destructive" });
      return;
    }

    const tagData = {
      name: newTagName.trim(),
      color: newTagColor,
      textColor: newTagTextColor,
      borderColor: newTagBorderColor,
      backgroundColor: newTagBackgroundColor
    };

    onCreateTag(tagData);
    resetForm();
    setShowCreateForm(false);
    toast({ title: "Tag created successfully" });
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;

    // Use database ID for updates - prefer dbId, fallback to id if it's numeric
    const tagId = editingTag.dbId || (typeof editingTag.id === 'number' ? editingTag.id : null);
    if (!tagId) {
      toast({ title: "Cannot update tag - missing ID", variant: "destructive" });
      return;
    }

    const tagData = {
      name: editingTag.name,
      color: editingTag.color,
      textColor: editingTag.textColor || "#ffffff",
      borderColor: editingTag.borderColor || editingTag.color,
      backgroundColor: editingTag.backgroundColor || `${editingTag.color}20`
    };

    onUpdateTag(tagId, tagData);
    setEditingTag(null);
    toast({ title: "Tag updated successfully" });
  };

  const handleDeleteTag = (id: number) => {
    onDeleteTag(id);
    setEditingTag(null);
    toast({ title: "Tag deleted successfully" });
  };

  const renderTagPreview = (tag: TagData, isEditing: boolean = false) => (
    <div
      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm border"
      style={{
        backgroundColor: tag.backgroundColor === "transparent" ? "transparent" : (tag.backgroundColor || `${tag.color}20`),
        color: tag.textColor || "#ffffff",
        borderColor: tag.borderColor || tag.color
      }}
    >
      {tag.name}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <Palette className="h-5 w-5 text-blue-400" />
            Manage Image Tags
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm mt-2">
            Create, edit, and organize your tags with custom colors and styling. Both system and user tags are fully editable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          {/* Existing Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Existing Tags</h3>
              {/* Only show New Tag button in admin mode or for non-shared contexts */}
              {(isAdminMode || contextType !== "shared-tags") && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  size="sm"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                  New Tag
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* System Tags */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    System Tags
                    <span className="text-xs text-gray-500">(AI Generated & Platform Tags)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(tag => tag.source === 'system' || ['AI Generated', 'ComfyUI', 'Stable Diffusion', 'Midjourney', 'A1111', 'DALL-E', 'Leonardo AI'].includes(tag.name)).map((tag) => (
                      <button
                        key={`system-${tag.dbId || tag.id}-${tag.name}`}
                        onClick={() => setEditingTag(tag)}
                        className="rounded-full px-3 py-1 text-xs inline-flex items-center border hover:opacity-80 transition-all cursor-pointer"
                        style={{
                          color: tag.textColor || tag.color || "#3b82f6",
                          borderColor: tag.borderColor || tag.color || "#3b82f6",
                          backgroundColor: tag.backgroundColor || `${tag.color || "#3b82f6"}20`,
                        }}
                      >
                        {tag.name}
                        <Edit className="ml-1 h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Tags */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    User Tags
                    <span className="text-xs text-gray-500">(Custom & Content Tags)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(tag => tag.source !== 'system' && !['AI Generated', 'ComfyUI', 'Stable Diffusion', 'Midjourney', 'A1111', 'DALL-E', 'Leonardo AI'].includes(tag.name)).map((tag) => (
                      <button
                        key={`user-${tag.dbId || tag.id}-${tag.name}`}
                        onClick={() => setEditingTag(tag)}
                        className="rounded-full px-3 py-1 text-xs inline-flex items-center border hover:opacity-80 transition-all cursor-pointer"
                        style={{
                          color: tag.textColor || tag.color || "#10b981",
                          borderColor: tag.borderColor || tag.color || "#10b981",
                          backgroundColor: tag.backgroundColor || `${tag.color || "#10b981"}20`,
                        }}
                      >
                        {tag.name}
                        <Edit className="ml-1 h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                {tags.length === 0 && (
                  <div className="text-center py-8 text-gray-400 w-full">
                    No tags found. Create your first tag to get started.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Create/Edit Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {editingTag ? "Edit Tag" : showCreateForm ? "Create New Tag" : "Tag Editor"}
            </h3>

            {(showCreateForm || editingTag) && (
              <div className="space-y-4 p-4 rounded-lg border border-gray-600 bg-gray-800">
                {/* System Tag Info */}
                {editingTag && editingTag.source === 'system' && (
                  <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-md">
                    <p className="text-blue-200 text-sm">
                      <strong>System Tag:</strong> You can customize the colors for this tag. Name changes are not allowed for system tags.
                    </p>
                  </div>
                )}
                
                {/* User mode restriction for system tags on SharedPrompts */}
                {editingTag && !isAdminMode && contextType === "shared-tags" && typeof editingTag.id === 'number' && (
                  <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-md">
                    <p className="text-blue-200 text-sm">
                      This tag cannot be edited in the shared prompts library.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tagName" className="text-white font-medium">Tag Name *</Label>
                  <Input
                    id="tagName"
                    value={editingTag ? editingTag.name : newTagName}
                    onChange={(e) => {
                      // System tags cannot have name changes, only color changes allowed
                      if (editingTag?.source === 'system') {
                        return; // Prevent name editing for system tags
                      }
                      
                      if (editingTag) {
                        setEditingTag({ ...editingTag, name: e.target.value });
                      } else {
                        setNewTagName(e.target.value);
                      }
                    }}
                    placeholder="Enter tag name..."
                    disabled={editingTag?.source === 'system'}
                    className="w-full bg-gray-800 border-2 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Color Palette - Disabled for system tags */}
                <div className="space-y-2">
                  <Label className="text-white font-medium">Quick Colors</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border-2 border-transparent transition-colors hover:border-primary cursor-pointer"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          
                          if (editingTag) {
                            setEditingTag({ 
                              ...editingTag, 
                              color,
                              textColor: "#ffffff",
                              borderColor: color,
                              backgroundColor: `${color}20`
                            });
                          } else {
                            setNewTagColor(color);
                            setNewTagTextColor("#ffffff");
                            setNewTagBorderColor(color);
                            setNewTagBackgroundColor(`${color}20`);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="borderColor">Border & Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="borderColor"
                        type="color"
                        value={editingTag ? (editingTag.borderColor || editingTag.color) : newTagBorderColor}
                        onChange={(e) => {
                          if (editingTag) {
                            setEditingTag({ 
                              ...editingTag, 
                              borderColor: e.target.value,
                              textColor: e.target.value
                            });
                          } else {
                            setNewTagBorderColor(e.target.value);
                            setNewTagTextColor(e.target.value);
                          }
                        }}
                        className="w-16 h-10"
                      />
                      <span className="text-sm text-muted-foreground">
                        {editingTag ? (editingTag.borderColor || editingTag.color) : newTagBorderColor}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fillColor">Fill Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="fillColor"
                        type="color"
                        value={editingTag ? (editingTag.backgroundColor || `${editingTag.color}20`) : newTagBackgroundColor}
                        onChange={(e) => {
                          if (editingTag) {
                            setEditingTag({ ...editingTag, backgroundColor: e.target.value });
                          } else {
                            setNewTagBackgroundColor(e.target.value);
                          }
                        }}
                        className="w-16 h-10"
                      />
                      <span className="text-sm text-muted-foreground">
                        {editingTag ? (editingTag.backgroundColor || `${editingTag.color}20`) : newTagBackgroundColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-4 rounded-lg border">
                    {renderTagPreview(editingTag || {
                      name: newTagName || "Sample Tag",
                      color: newTagColor,
                      textColor: newTagTextColor,
                      borderColor: newTagBorderColor,
                      backgroundColor: "transparent"
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    {/* Delete User Tags */}
                    {editingTag && editingTag.source !== 'system' && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const tagId = editingTag.dbId || (typeof editingTag.id === 'number' ? editingTag.id : null);
                          if (tagId) {
                            handleDeleteTag(tagId);
                            setEditingTag(null);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Tag
                      </Button>
                    )}
                    
                    {/* Hide Tags */}
                    {editingTag && onHideTag && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const tagId = editingTag.dbId || (typeof editingTag.id === 'number' ? editingTag.id : null);
                          if (tagId) {
                            onHideTag(tagId);
                            setEditingTag(null);
                          }
                        }}
                        disabled={isLoading}
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-900/20"
                      >
                        👁️‍🗨️ Hide Tag
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingTag(null);
                        setShowCreateForm(false);
                        resetForm();
                      }}
                      className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {(editingTag?.source === 'system' && contextType !== 'images') || (!isAdminMode && contextType === "shared-tags" && editingTag && typeof editingTag.id === 'number') ? 'Close' : 'Cancel'}
                    </Button>
                    <Button
                      onClick={editingTag ? handleUpdateTag : handleCreateTag}
                      disabled={isLoading || (editingTag ? !editingTag.name.trim() : !newTagName.trim())}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {editingTag ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!showCreateForm && !editingTag && (
              <div className="text-center py-8 text-gray-400">
                Select a tag to edit or create a new one
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}