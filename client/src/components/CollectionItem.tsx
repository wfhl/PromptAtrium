import { ChevronRight, Folder } from "lucide-react";
import type { Collection } from "@shared/schema";

interface CollectionItemProps {
  collection: Collection & { promptCount?: number };
}

export function CollectionItem({ collection }: CollectionItemProps) {
  const gradientClasses = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-teal-600",
    "bg-gradient-to-br from-red-500 to-pink-600",
    "bg-gradient-to-br from-yellow-500 to-orange-600",
    "bg-gradient-to-br from-purple-500 to-indigo-600",
  ];
  
  const gradientClass = gradientClasses[Math.abs(collection.id.charCodeAt(0)) % gradientClasses.length];

  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors cursor-pointer"
      data-testid={`collection-item-${collection.id}`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 ${gradientClass} rounded-md flex items-center justify-center`}>
          <Folder className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm" data-testid={`text-collection-name-${collection.id}`}>
            {collection.name}
          </p>
          <p className="text-xs text-muted-foreground" data-testid={`text-collection-count-${collection.id}`}>
            {collection.promptCount || 0} prompts
          </p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
