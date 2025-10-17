
import { PromptHistory } from "@/components/PromptHistory";
import { useState } from "react";

export default function PromptHistoryPage() {
  const [open, setOpen] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Prompt History</h1>
        <p className="text-muted-foreground">
          View and manage your previously generated prompts
        </p>
      </div>
      
      <PromptHistory
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
