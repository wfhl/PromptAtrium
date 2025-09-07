import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, ChartScatter, FileUp } from "lucide-react";

interface QuickActionsProps {
  onCreatePrompt: () => void;
  onCreateCollection: () => void;
  onStartProject: () => void;
  onImportPrompts: () => void;
}

export function QuickActions({ 
  onCreatePrompt, 
  onCreateCollection, 
  onStartProject, 
  onImportPrompts 
}: QuickActionsProps) {
  return (
    <Card data-testid="card-quick-actions">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-3 pt-2 md:pt-3">
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-2 md:p-3"
          onClick={onCreatePrompt}
          data-testid="button-create-prompt"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-primary/10 rounded-md flex items-center justify-center mr-2 md:mr-3">
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm md:text-base font-medium text-foreground">Create New Prompt</p>
            <p className="text-xs text-muted-foreground hidden md:block">Start with a blank prompt</p>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-2 md:p-3"
          onClick={onCreateCollection}
          data-testid="button-create-collection"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-green-500/10 rounded-md flex items-center justify-center mr-2 md:mr-3">
            <FolderPlus className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
          </div>
          <div className="text-left">
            <p className="text-sm md:text-base font-medium text-foreground">New Collection</p>
            <p className="text-xs text-muted-foreground hidden md:block">Organize related prompts</p>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-2 md:p-3"
          onClick={onStartProject}
          data-testid="button-start-project"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-500/10 rounded-md flex items-center justify-center mr-2 md:mr-3">
            <ChartScatter className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
          </div>
          <div className="text-left">
            <p className="text-sm md:text-base font-medium text-foreground">Start Project</p>
            <p className="text-xs text-muted-foreground hidden md:block">Create a new project</p>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-2 md:p-3"
          onClick={onImportPrompts}
          data-testid="button-import-prompts"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-500/10 rounded-md flex items-center justify-center mr-2 md:mr-3">
            <FileUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-500" />
          </div>
          <div className="text-left">
            <p className="text-sm md:text-base font-medium text-foreground">Import Prompts</p>
            <p className="text-xs text-muted-foreground hidden md:block">Bulk import from file</p>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
