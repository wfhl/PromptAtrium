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
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-base md:text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-1 md:flex md:flex-col md:space-y-1 pt-1 md:pt-2">
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
          onClick={onCreatePrompt}
          data-testid="button-create-prompt"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-primary/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Prompt</p>
            <p className="text-xs text-muted-foreground hidden md:block">Start with a blank prompt</p>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
          onClick={onCreateCollection}
          data-testid="button-create-collection"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-green-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2">
            <FolderPlus className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Collection</p>
            <p className="text-xs text-muted-foreground hidden md:block">Organize related prompts</p>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
          onClick={onStartProject}
          data-testid="button-start-project"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-blue-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2">
            <ChartScatter className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Project</p>
            <p className="text-xs text-muted-foreground hidden md:block">Create a new project</p>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
          onClick={onImportPrompts}
          data-testid="button-import-prompts"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-purple-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2">
            <FileUp className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Import</p>
            <p className="text-xs text-muted-foreground hidden md:block">Bulk import from file</p>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
