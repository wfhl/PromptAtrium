import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, ChartScatter, FileUp, RatioIcon, FileSearch } from "lucide-react";
import { Link } from "wouter";

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
    <div data-testid="card-quick-actions">
      <h3 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-1 md:flex md:flex-col md:space-y-1">
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

        <Link href="/tools/aspect-ratio-calculator">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
            data-testid="button-aspect-ratio-calculator"
          >
            <div className="w-8 h-8 md:w-7 md:h-7 bg-orange-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2">
              <RatioIcon className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs md:text-base font-medium text-foreground">Aspect Ratio</p>
              <p className="text-xs text-muted-foreground hidden md:block">Calculate dimensions</p>
            </div>
          </Button>
        </Link>

        <Link href="/tools/metadata-analyzer">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
            data-testid="button-metadata-analyzer"
          >
            <div className="w-8 h-8 md:w-7 md:h-7 bg-cyan-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2">
              <FileSearch className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs md:text-base font-medium text-foreground">Metadata</p>
              <p className="text-xs text-muted-foreground hidden md:block">Analyze image metadata</p>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
}
