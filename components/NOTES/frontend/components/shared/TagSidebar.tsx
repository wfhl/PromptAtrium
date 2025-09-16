// EXACT Media Gallery tag sidebar implementation - shared component
import { 
  Tag, 
  Plus, 
  Cog,
  Edit
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

interface TagItem {
  id: string | number;
  name: string;
  count?: number;
  color?: string;
  textColor?: string;
  borderColor?: string;
  backgroundColor?: string;
}

interface TagSidebarProps {
  tags: TagItem[];
  activeTag: string | number | null;
  onTagClick: (tagId: string | number) => void;
  onCreateTag: () => void;
  onEditTag: (tag: TagItem) => void;
  onManageTags?: () => void;
}

export default function TagSidebar({
  tags,
  activeTag,
  onTagClick,
  onCreateTag,
  onEditTag,
  onManageTags
}: TagSidebarProps) {

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm uppercase text-gray-500">Tags</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={onCreateTag}
        >
          <Tag className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="relative group">
            <button
              className={`rounded-full px-3 py-1 text-xs inline-flex items-center border ${
                activeTag === tag.id
                  ? "ring-2 ring-blue-400 dark:ring-blue-600"
                  : ""
              }`}
              style={{
                color: tag.textColor || tag.color || "#6b46c1", // Purple default
                borderColor: tag.borderColor || tag.color || "#6b46c1", // Purple default
                backgroundColor: tag.backgroundColor || "transparent",
              }}
              onClick={() => onTagClick(tag.id)}
            >
              {tag.name}
            </button>
            
            {/* Edit icon outside the tag bubble, only visible on hover - EXACT Media Gallery styling */}
            <button
              className="absolute -right-2 -top-2 bg-white dark:bg-gray-800 rounded-full p-0.5 border border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onEditTag(tag);
              }}
            >
              <Edit className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        
        {tags.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            No tags yet
          </div>
        )}
      </div>
    </div>
  );
}