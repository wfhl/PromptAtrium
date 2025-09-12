import { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

interface SelectedKeyword {
  id: string;
  term: string;
  category: string;
  subcategory?: string;
  description?: string;
  synonyms?: string[];
  tags?: string[];
}

interface ToolsContextType {
  // Keywords for transfer between tools
  selectedKeywords: SelectedKeyword[];
  addKeyword: (keyword: SelectedKeyword) => void;
  removeKeyword: (keywordId: string) => void;
  clearKeywords: () => void;
  setKeywords: (keywords: SelectedKeyword[]) => void;
  
  // Selection mode for keyword dictionary
  isSelectionMode: boolean;
  setSelectionMode: (mode: boolean) => void;
  
  // Transfer state
  hasKeywordsToTransfer: boolean;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export function ToolsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [selectedKeywords, setSelectedKeywords] = useState<SelectedKeyword[]>([]);
  const [isSelectionMode, setSelectionMode] = useState(false);

  const addKeyword = (keyword: SelectedKeyword) => {
    setSelectedKeywords(prev => {
      const exists = prev.find(k => k.id === keyword.id);
      if (exists) {
        toast({
          title: "Already selected",
          description: `"${keyword.term}" is already in your selection`,
        });
        return prev;
      }
      toast({
        title: "Keyword added",
        description: `"${keyword.term}" added to selection`,
      });
      return [...prev, keyword];
    });
  };

  const removeKeyword = (keywordId: string) => {
    setSelectedKeywords(prev => {
      const keyword = prev.find(k => k.id === keywordId);
      if (keyword) {
        toast({
          title: "Keyword removed",
          description: `"${keyword.term}" removed from selection`,
        });
      }
      return prev.filter(k => k.id !== keywordId);
    });
  };

  const clearKeywords = () => {
    setSelectedKeywords([]);
    setSelectionMode(false);
  };

  const setKeywords = (keywords: SelectedKeyword[]) => {
    setSelectedKeywords(keywords);
  };

  const value: ToolsContextType = {
    selectedKeywords,
    addKeyword,
    removeKeyword,
    clearKeywords,
    setKeywords,
    isSelectionMode,
    setSelectionMode,
    hasKeywordsToTransfer: selectedKeywords.length > 0,
  };

  return (
    <ToolsContext.Provider value={value}>
      {children}
    </ToolsContext.Provider>
  );
}

export function useToolsContext() {
  const context = useContext(ToolsContext);
  if (context === undefined) {
    throw new Error("useToolsContext must be used within a ToolsProvider");
  }
  return context;
}