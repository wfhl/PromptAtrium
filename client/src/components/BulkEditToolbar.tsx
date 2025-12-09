import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckSquare, 
  X, 
  Edit3, 
  Trash2, 
  Archive, 
  ArchiveRestore,
  Download, 
  Eye, 
  EyeOff, 
  Heart, 
  HeartOff, 
  Bookmark, 
  BookmarkMinus,
  FileEdit,
  MoreHorizontal,
  FolderPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BulkOperationType } from "@shared/schema";

interface BulkEditToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkOperation: (operation: BulkOperationType) => void;
  onToggleBulkMode: () => void;
  isBulkMode: boolean;
  isLoading?: boolean;
  onAddToCollection?: () => void;
}

export function BulkEditToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkOperation,
  onToggleBulkMode,
  isBulkMode,
  isLoading = false,
  onAddToCollection
}: BulkEditToolbarProps) {
  const hasSelection = selectedCount > 0;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  if (!isBulkMode) {
    return (
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">Prompts</h2>
          <Badge variant="secondary">{totalCount}</Badge>
        </div>
        <Button
          onClick={onToggleBulkMode}
          variant="outline"
          size="sm"
          data-testid="button-enable-bulk-edit"
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Bulk Edit
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Toolbar */}
      <div className="hidden md:flex items-center justify-between p-4 border-b bg-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary">
              {selectedCount} selected
            </Badge>
            {totalCount > 0 && (
              <span className="text-sm text-muted-foreground">
                of {totalCount} prompts
              </span>
            )}
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-2">
            <Button
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              variant="ghost"
              size="sm"
              data-testid="button-select-all"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {isAllSelected ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasSelection && (
            <>
              {/* Quick Actions */}
              <Button
                onClick={() => onBulkOperation("export")}
                variant="outline"
                size="sm"
                disabled={isLoading}
                data-testid="button-bulk-export"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button
                onClick={() => onBulkOperation("like")}
                variant="outline"
                size="sm"
                disabled={isLoading}
                data-testid="button-bulk-like"
              >
                <Heart className="h-4 w-4 mr-2" />
                Like
              </Button>

              <Button
                onClick={() => onBulkOperation("favorite")}
                variant="outline"
                size="sm"
                disabled={isLoading}
                data-testid="button-bulk-favorite"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Favorite
              </Button>

              <Button
                onClick={() => onBulkOperation("update")}
                variant="outline"
                size="sm"
                disabled={isLoading}
                data-testid="button-bulk-edit"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Properties
              </Button>

              {onAddToCollection && (
                <Button
                  onClick={onAddToCollection}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  data-testid="button-bulk-add-to-collection"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add to Collection
                </Button>
              )}

              {/* More Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    data-testid="button-bulk-more"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onBulkOperation("makePublic")}>
                    <Eye className="h-4 w-4 mr-2" />
                    Make Public
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkOperation("makePrivate")}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Make Private
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onBulkOperation("publish")}>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Publish
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkOperation("draft")}>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Mark as Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkOperation("archive")}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkOperation("unarchive")}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Unarchive
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onBulkOperation("unlike")}>
                    <HeartOff className="h-4 w-4 mr-2" />
                    Remove Likes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkOperation("unfavorite")}>
                    <BookmarkMinus className="h-4 w-4 mr-2" />
                    Remove Favorites
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onBulkOperation("delete")}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          <Button
            onClick={onToggleBulkMode}
            variant="ghost"
            size="sm"
            data-testid="button-cancel-bulk-edit"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Mobile Floating Action Bar */}
      {isBulkMode && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-40 rounded-xl border border-primary/30 bg-primary/90 backdrop-blur-md shadow-lg shadow-primary/25 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            {/* Selection Count */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-white/20 text-white font-semibold text-sm">
                {selectedCount}
              </div>
              <span className="text-white/80 text-xs font-medium hidden min-[400px]:inline">
                selected
              </span>
            </div>
            
            {/* Action Buttons */}
            {hasSelection && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => onBulkOperation("export")}
                  disabled={isLoading}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
                  title="Export"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onBulkOperation("like")}
                  disabled={isLoading}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
                  title="Like"
                >
                  <Heart className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onBulkOperation("favorite")}
                  disabled={isLoading}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
                  title="Favorite"
                >
                  <Bookmark className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onBulkOperation("update")}
                  disabled={isLoading}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
                  title="Edit"
                >
                  <Edit3 className="h-4 w-4" />
                </button>

                {onAddToCollection && (
                  <button
                    onClick={onAddToCollection}
                    disabled={isLoading}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
                    title="Add to Collection"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isLoading}
                      className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50"
                      title="More actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Visibility</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onBulkOperation("makePublic")}>
                      <Eye className="h-4 w-4 mr-2" />
                      Make Public
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkOperation("makePrivate")}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Make Private
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onBulkOperation("publish")}>
                      <FileEdit className="h-4 w-4 mr-2" />
                      Publish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onBulkOperation("archive")}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onBulkOperation("delete")} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onToggleBulkMode}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors flex-shrink-0"
              title="Close bulk edit"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}