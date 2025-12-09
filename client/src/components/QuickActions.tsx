import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, ChartScatter, FileUp, RatioIcon, FileSearch, Sparkles, BookOpen, Lock, Wand2 } from "lucide-react";
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
      <div className="grid grid-cols-4 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-2 lg:gap-2 lg:space-y-0">
        
          
          
          
          <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
          onClick={onCreatePrompt}
          data-testid="button-create-prompt"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-blue-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
            <Plus className="h-4 w-4 text-primary transition-all group-hover:brightness-150" />
          </div>
          <div className="text-center  md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Add Prompt</p>
            <p className="text-xs text-muted-foreground hidden md:block">Add a prompt</p>
          </div>
        </Button>


          
  
          
          {/* Quick Prompt Generator */}
          <Link href="/tools/quick-prompter" className="contents">
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
              data-testid="button-prompt-generator"
            >
              <div className="w-8 h-8 md:w-7 md:h-7 bg-purple-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
                <Sparkles className="h-4 w-4 text-purple-500 transition-all group-hover:brightness-150" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs md:text-base font-medium text-foreground">Generate Prompt</p>
                <p className="text-xs text-muted-foreground hidden md:block">AI prompt generator</p>
              </div>
            </Button>
          </Link>
     
          
          
          <Button
          variant="ghost"
          className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
          onClick={onImportPrompts}
          data-testid="button-import-prompts"
        >
          <div className="w-8 h-8 md:w-7 md:h-7 bg-yellow-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
            <FileUp className="h-4 w-4 text-yellow-500 transition-all group-hover:brightness-150" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs md:text-base font-medium text-foreground">Import Prompts</p>
            <p className="text-xs text-muted-foreground hidden md:block">Bulk import from file</p>
          </div>
        </Button>

        <Link href="/tools/metadata-analyzer" className="contents">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
            data-testid="button-metadata-analyzer"
          >
            <div className="w-8 h-8 md:w-7 md:h-7 bg-cyan-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
              <FileSearch className="h-4 w-4 text-cyan-500 transition-all group-hover:brightness-150" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs md:text-base font-medium text-foreground">Metadata Extract</p>
              <p className="text-xs text-muted-foreground hidden md:block">Analyze image metadata</p>
            </div>
          </Button>
        </Link>
       
          {/* Collections */}
          <Link href="/collections" className="contents">
                <Button
              variant="ghost"
              className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
              onClick={onCreateCollection}
              data-testid="button-create-collection"
            >
              <div className="w-8 h-8 md:w-7 md:h-7 bg-green-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
                <FolderPlus className="h-4 w-4 text-green-500 transition-all group-hover:brightness-150" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs md:text-base font-medium text-foreground">Prompt Collections</p>
                <p className="text-xs text-muted-foreground hidden md:block">Organize prompts</p>
              </div>
            </Button>


            
            
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
              data-testid="button-aspect-ratio-calculator"
            >
              <div className="w-8 h-8 md:w-7 md:h-7 bg-orange-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
                <RatioIcon className="h-4 w-4 text-orange-500 transition-all group-hover:brightness-150" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs md:text-base font-medium text-foreground">AR Calculator</p>
                <p className="text-xs text-muted-foreground hidden md:block">Calculate Aspect Ratios</p>
              </div>
            </Button>
          </Link>
      

        {/* Wordsmith Codex */}
        <Link to="/codex" className="contents">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
            data-testid="button-wordsmith-codex"
          >
            <div className="w-8 h-8 md:w-7 md:h-7 bg-rose-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
              <BookOpen className="h-4 w-4 text-rose-500 transition-all group-hover:brightness-150" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs md:text-base font-medium text-foreground">Wordsmith Codex</p>
              <p className="text-xs text-muted-foreground hidden md:block">Browse Wildcards</p>
            </div>
          </Button>
        </Link>
          {/* PromptMiner */}
          <Link href="/tools/prompt-miner" className="contents">
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center p-1 h-auto md:flex-row md:justify-start md:w-full md:p-2 hover:bg-transparent group"
              data-testid="button-prompt-miner"
            >
              <div className="w-8 h-8 md:w-7 md:h-7 bg-indigo-500/0 rounded-md flex items-center justify-center mb-1 md:mb-0 md:mr-2 flex-shrink-0 transition-transform group-hover:scale-150">
                <Wand2 className="h-4 w-4 text-indigo-500 transition-all group-hover:brightness-150" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs md:text-base font-medium text-foreground">PromptMiner</p>
                <p className="text-xs text-muted-foreground hidden md:block">Extract from images</p>
              </div>
            </Button>
          </Link>
      </div>
    </div>
  );
}