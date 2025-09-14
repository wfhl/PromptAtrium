import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, ChartScatter, FileUp, RatioIcon, FileSearch, Sparkles, BookOpen, Lock } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  const handleComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon",
      description: `${feature} will be available soon!`,
    });
  };

  return (
    <div data-testid="card-quick-actions">
      <h3 className="text-base md:text-xl font-semibold mb-2 md:mb-3">Quick Actions</h3>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:gap-2 lg:flex lg:flex-col lg:space-y-1">
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
          onClick={onCreatePrompt}
          data-testid="button-create-prompt"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-primary/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0">
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
          <div className="w-8 h-8 md:w-7 md:h-7 bg-green-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0">
            <FolderPlus className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Collection</p>
            <p className="text-xs text-muted-foreground hidden md:block">Organize related prompts</p>
          </div>
        </Button>

        {/* Coming Soon: Project */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 opacity-60 cursor-not-allowed relative"
          onClick={() => handleComingSoon("Project")}
          data-testid="button-start-project"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-blue-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 relative">
            <ChartScatter className="h-4 w-4 text-blue-500" />
            <Lock className="h-2.5 w-2.5 text-blue-500 absolute -top-1 -right-1 bg-background rounded-full" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Project</p>
            <p className="text-xs text-muted-foreground hidden md:block">Coming soon</p>
          </div>
        </Button>

        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
          onClick={onImportPrompts}
          data-testid="button-import-prompts"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-purple-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0">
            <FileUp className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Import</p>
            <p className="text-xs text-muted-foreground hidden md:block">Bulk import from file</p>
          </div>
        </Button>

        <Link href="/tools/aspect-ratio-calculator" className="contents">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
            data-testid="button-aspect-ratio-calculator"
          >
            <div className="w-8 h-8 md:w-7 md:h-7 bg-orange-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0">
              <RatioIcon className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs md:text-base font-medium text-foreground">Aspect Ratio</p>
              <p className="text-xs text-muted-foreground hidden md:block">Calculate dimensions</p>
            </div>
          </Button>
        </Link>

        <Link href="/tools/metadata-analyzer" className="contents">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2"
            data-testid="button-metadata-analyzer"
          >
            <div className="w-8 h-8 md:w-7 md:h-7 bg-cyan-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0">
              <FileSearch className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs md:text-base font-medium text-foreground">Metadata</p>
              <p className="text-xs text-muted-foreground hidden md:block">Analyze image metadata</p>
            </div>
          </Button>
        </Link>

        {/* Coming Soon: Prompt Generator */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 opacity-60 cursor-not-allowed relative"
          onClick={() => handleComingSoon("Prompt Generator")}
          data-testid="button-prompt-generator"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-indigo-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 relative">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <Lock className="h-2.5 w-2.5 text-indigo-500 absolute -top-1 -right-1 bg-background rounded-full" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Generator</p>
            <p className="text-xs text-muted-foreground hidden md:block">Coming soon</p>
          </div>
        </Button>

        {/* Coming Soon: Wordsmith Codex */}
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 opacity-60 cursor-not-allowed relative"
          onClick={() => handleComingSoon("Wordsmith Codex")}
          data-testid="button-wordsmith-codex"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-rose-500/10 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 relative">
            <BookOpen className="h-4 w-4 text-rose-500" />
            <Lock className="h-2.5 w-2.5 text-rose-500 absolute -top-1 -right-1 bg-background rounded-full" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Wordsmith</p>
            <p className="text-xs text-muted-foreground hidden md:block">Coming soon</p>
          </div>
        </Button>
      </div>
    </div>
  );
}