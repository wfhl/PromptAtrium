import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { PromptHistoryContent } from "./PromptHistoryContent";

interface PromptHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadPrompt?: (prompt: string, metadata?: any) => void;
}

export function PromptHistory({ open, onOpenChange, onLoadPrompt }: PromptHistoryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden p-0">
        <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <span className="text-base sm:text-lg">Prompt Generation History</span>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <PromptHistoryContent 
            onLoadPrompt={onLoadPrompt}
            onClose={() => onOpenChange(false)}
            embedded={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}