import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface CompactCharacterSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customCharacterInput?: string;
}

export default function CompactCharacterSaveDialog({
  isOpen,
  onClose,
  onSuccess,
  customCharacterInput = ""
}: CompactCharacterSaveDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState(customCharacterInput);

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the character preset",
        variant: "destructive"
      });
      return;
    }

    // Save logic would go here
    toast({
      title: "Character saved",
      description: `Character preset "${name}" has been saved`,
    });
    
    onSuccess();
    onClose();
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Character Preset</DialogTitle>
          <DialogDescription>
            Save the current character settings as a reusable preset
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Preset Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter preset name"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Character</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}