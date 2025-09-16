// EXACT Media Gallery folder sidebar implementation - shared component
import { 
  Folder, 
  Plus, 
  Upload,
  FileImage,
  Star,
  Archive,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderItem {
  id: string | number;
  name: string;
  imageCount?: number;
  count?: number;
  color?: string;
}

interface FolderSidebarProps {
  title: string; // "Albums" or "Folders"  
  folders: FolderItem[];
  activeFolder: string | null;
  activeTag: string | null;
  onFolderClick: (folderId: string) => void;
  onClearFilters: () => void;
  onCreateFolder: (folder?: any) => void;
  onDeleteFolder?: (folderId: string | number) => void;
  onUpload?: () => void;
  stats: { totalImages?: number; totalCount?: number };
  resourceName: string; // "Images" or "Notes"
}

export default function FolderSidebar({
  title,
  folders,
  activeFolder,
  activeTag,
  onFolderClick,
  onClearFilters,
  onCreateFolder,
  onDeleteFolder,
  onUpload,
  stats,
  resourceName
}: FolderSidebarProps) {

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm uppercase text-gray-500">{title}</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={onCreateFolder}
        >
          <Folder className="h-4 w-4" />
        </Button>
      </div>
      
      <ul className="space-y-1">
        {/* Default albums are always displayed at specific positions - EXACT Media Gallery logic */}
        {['All Images', 'All Notes', 'Favorites'].map((defaultName) => {
          // Handle "All Images" vs "All Notes" based on resource type
          const displayName = resourceName === "Images" ? "All Images" : "All Notes";
          if (defaultName !== displayName && defaultName !== 'Favorites') return null;
          
          const folder = folders.find(a => a.name === defaultName);
          if (defaultName !== displayName && !folder) return null;
          
          return (
            <li key={defaultName}>
              <div 
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex group items-center ${
                  (defaultName === displayName && activeFolder === null && activeTag === null) || activeFolder === folder?.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <button 
                  className="flex items-center min-w-0"
                  onClick={() => defaultName === displayName ? onClearFilters() : onFolderClick(folder!.id.toString())}
                >
                  <div className="flex items-center min-w-0">
                    {defaultName === displayName ? (
                      <FileImage className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                    ) : defaultName === 'Favorites' ? (
                      <Star className="w-4 h-4 mr-2 text-amber-500 flex-shrink-0" />
                    ) : null}
                    <span className="truncate">{defaultName}</span>
                  </div>
                </button>
                
                {/* Count positioned outside button container - Phase 3: Standardized positioning */}
                <span className="ml-2 text-xs text-gray-500">
                  {defaultName === displayName ? (stats.totalImages || stats.totalCount || 0) : (folder?.imageCount || folder?.count || 0)}
                </span>
              </div>
            </li>
          );
        })}

        {/* User-created albums/folders - EXACT Media Gallery logic */}
        {folders
          .filter(folder => !['All Images', 'All Notes', 'Favorites', 'Archived'].includes(folder.name))
          .map((folder) => (
            <li key={folder.id}>
              <div 
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex group items-center relative ${
                  activeFolder === folder.id.toString()
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <button 
                  className="flex items-center min-w-0"
                  onClick={() => onFolderClick(folder.id.toString())}
                >
                  <Folder 
                    className="w-4 h-4 mr-2 flex-shrink-0" 
                    style={{ color: folder.color || '#9ca3af' }}
                  />
                  <span className="truncate">{folder.name}</span>
                </button>
                
                {/* Count positioned outside button to prevent overlap with action icons */}
                <span className="ml-2 text-xs text-gray-500">
                  {folder.imageCount || folder.count || 0}
                </span>
                
                {/* Hover edit/delete icons matching Notes page design */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!['All Images', 'All Notes', 'Favorites', 'Archived'].includes(folder.name) && (
                    <button
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateFolder(folder);
                      }}
                      title="Edit folder"
                    >
                      <Edit className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                    </button>
                  )}
                  {!['All Images', 'All Notes', 'Favorites', 'Archived'].includes(folder.name) && onDeleteFolder && (
                    <button
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete folder "${folder.name}"? This action cannot be undone.`)) {
                          onDeleteFolder(folder.id);
                        }
                      }}
                      title="Delete folder"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500 hover:text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}

        {/* Archived - always at the bottom - EXACT Media Gallery logic */}
        {(() => {
          const archivedFolder = folders.find(a => a.name === 'Archived');
          if (!archivedFolder) return null;
          
          return (
            <li key={archivedFolder.id}>
              <div 
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex group items-center ${
                  activeFolder === archivedFolder.id.toString()
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <button 
                  className="flex-1 flex items-center"
                  onClick={() => onFolderClick(archivedFolder.id.toString())}
                >
                  <div className="flex items-center">
                    <Archive className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Archived</span>
                  </div>
                  
                  <span className="ml-2 text-xs text-gray-500">
                    {archivedFolder.imageCount || archivedFolder.count || 0}
                  </span>
                </button>
              </div>
            </li>
          );
        })()}
        
        {folders.length === 0 && (
          <li className="text-sm text-gray-500 italic px-3 py-2">
            No {title.toLowerCase()} yet
          </li>
        )}
      </ul>
    </div>
  );
}