import { useState, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileUp, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  XCircle,
  Download,
  Loader2,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Papa from "papaparse";
import type { Collection } from "@shared/schema";

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
}

interface ParsedPrompt {
  name: string;
  promptContent: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: "draft" | "published";
  isPublic?: boolean;
  isNsfw?: boolean;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export function BulkImportModal({ open, onOpenChange, collections }: BulkImportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState("file");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedPrompt[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "import" | "results">("upload");
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  
  // Import options
  const [defaultCollection, setDefaultCollection] = useState<string>("");
  const [defaultCategory, setDefaultCategory] = useState<string>("");
  const [defaultIsPublic, setDefaultIsPublic] = useState(false);
  const [txtParseMode, setTxtParseMode] = useState<"lines" | "paragraphs" | "delimiter">("lines");
  const [customDelimiter, setCustomDelimiter] = useState("---");
  
  // Additional default fields
  const [defaultPromptType, setDefaultPromptType] = useState<string>("");
  const [defaultPromptStyle, setDefaultPromptStyle] = useState<string>("");
  const [defaultAuthor, setDefaultAuthor] = useState<string>("");
  const [defaultLicense, setDefaultLicense] = useState<string>("CC0 (Public Domain)");
  const [defaultTags, setDefaultTags] = useState<string>("");
  const [defaultSourceUrl, setDefaultSourceUrl] = useState<string>("");
  const [defaultIntendedGenerator, setDefaultIntendedGenerator] = useState<string>("");
  const [defaultRecommendedModels, setDefaultRecommendedModels] = useState<string>("");
  
  // Custom options for dropdowns
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customPromptTypes, setCustomPromptTypes] = useState<string[]>([]);
  const [customPromptStyles, setCustomPromptStyles] = useState<string[]>([]);
  const [customIntendedGenerators, setCustomIntendedGenerators] = useState<string[]>([]);
  const [customRecommendedModels, setCustomRecommendedModels] = useState<string[]>([]);
  
  // States for creating new options
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCreatePromptType, setShowCreatePromptType] = useState(false);
  const [newPromptTypeName, setNewPromptTypeName] = useState("");
  const [showCreatePromptStyle, setShowCreatePromptStyle] = useState(false);
  const [newPromptStyleName, setNewPromptStyleName] = useState("");
  const [showCreateIntendedGenerator, setShowCreateIntendedGenerator] = useState(false);
  const [newIntendedGeneratorName, setNewIntendedGeneratorName] = useState("");
  const [showCreateRecommendedModel, setShowCreateRecommendedModel] = useState(false);
  const [newRecommendedModelName, setNewRecommendedModelName] = useState("");
  
  // Google Docs/Sheets
  const [googleUrl, setGoogleUrl] = useState("");
  const [isImportingGoogle, setIsImportingGoogle] = useState(false);
  const [googleType, setGoogleType] = useState<"auto" | "docs" | "sheets">("auto");
  
  // Fetch existing collections
  const { data: fetchedCollections, refetch: refetchCollections } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    enabled: open,
  });
  
  // Fetch categories from database
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: open,
  }) as { data: Array<{ id: string; name: string; description?: string }> };
  
  // Fetch prompt types from database
  const { data: promptTypes = [] } = useQuery({
    queryKey: ["/api/prompt-types"],
    enabled: open,
  }) as { data: Array<{ id: string; name: string; description?: string }> };
  
  // Fetch prompt styles from database
  const { data: promptStyles = [] } = useQuery({
    queryKey: ["/api/prompt-styles"],
    enabled: open,
  }) as { data: Array<{ id: string; name: string; description?: string }> };
  
  // Fetch intended generators from database
  const { data: intendedGenerators = [] } = useQuery({
    queryKey: ["/api/intended-generators"],
    enabled: open,
  }) as { data: Array<{ id: string; name: string; description?: string }> };
  
  // Fetch recommended models from database
  const { data: recommendedModels = [] } = useQuery({
    queryKey: ["/api/recommended-models"],
    enabled: open,
  }) as { data: Array<{ id: string; name: string; description?: string }> };
  
  // Merge provided collections with fetched ones to avoid duplicates
  const allCollections = [...collections, ...(fetchedCollections || [])].filter(
    (collection, index, self) => 
      index === self.findIndex((c) => c.id === collection.id)
  );
  
  // Mutation for creating new collection
  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/collections", {
        ...data,
        type: "user",
        isPublic: false,
      });
      return await response.json();
    },
    onSuccess: (newCollection: Collection) => {
      setDefaultCollection(newCollection.id);
      setShowCreateCollection(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
      refetchCollections();
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({
        title: "Success",
        description: "Collection created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating new category
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/categories", { name });
      return await response.json();
    },
    onSuccess: (newCategory: any) => {
      setDefaultCategory(newCategory.name);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowCreateCategory(false);
      setNewCategoryName("");
      toast({
        title: "Success",
        description: "Category created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating new prompt type
  const createPromptTypeMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/prompt-types", { name });
      return await response.json();
    },
    onSuccess: (newPromptType: any) => {
      setDefaultPromptType(newPromptType.name);
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-types"] });
      setShowCreatePromptType(false);
      setNewPromptTypeName("");
      toast({
        title: "Success",
        description: "Prompt type created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prompt type",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating new prompt style
  const createPromptStyleMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/prompt-styles", { name });
      return await response.json();
    },
    onSuccess: (newPromptStyle: any) => {
      setDefaultPromptStyle(newPromptStyle.name);
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-styles"] });
      setShowCreatePromptStyle(false);
      setNewPromptStyleName("");
      toast({
        title: "Success",
        description: "Prompt style created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create prompt style",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating new intended generator
  const createIntendedGeneratorMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/intended-generators", { name });
      return await response.json();
    },
    onSuccess: (newGenerator: any) => {
      setDefaultIntendedGenerator(newGenerator.name);
      queryClient.invalidateQueries({ queryKey: ["/api/intended-generators"] });
      setShowCreateIntendedGenerator(false);
      setNewIntendedGeneratorName("");
      toast({
        title: "Success",
        description: "Intended generator created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create intended generator",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating new recommended model
  const createRecommendedModelMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/recommended-models", { name });
      return await response.json();
    },
    onSuccess: (newModel: any) => {
      setCustomRecommendedModels(prev => [...prev, newModel.name]);
      setDefaultRecommendedModels(newModel.name);
      queryClient.invalidateQueries({ queryKey: ["/api/recommended-models"] });
      setShowCreateRecommendedModel(false);
      setNewRecommendedModelName("");
      toast({
        title: "Success",
        description: "Recommended model created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create recommended model",
        variant: "destructive",
      });
    },
  });
  
  const resetModal = () => {
    setFile(null);
    setFileContent("");
    setParsedData([]);
    setStep("upload");
    setImportProgress(0);
    setImportResults(null);
    setGoogleUrl("");
    setIsImportingGoogle(false);
    setGoogleType("auto");
    setActiveTab("file");
    
    // Reset all default fields
    setDefaultCollection("");
    setDefaultCategory("");
    setDefaultIsPublic(false);
    setDefaultPromptType("");
    setDefaultPromptStyle("");
    setDefaultAuthor("");
    setDefaultLicense("CC0 (Public Domain)");
    setDefaultTags("");
    setDefaultSourceUrl("");
    setDefaultIntendedGenerator("");
    setDefaultRecommendedModels("");
    
    // Reset custom options
    setCustomCategories([]);
    setCustomPromptTypes([]);
    setCustomPromptStyles([]);
    setCustomIntendedGenerators([]);
    setCustomRecommendedModels([]);
    
    // Reset create dialogs
    setShowCreateCollection(false);
    setNewCollectionName("");
    setNewCollectionDescription("");
    setShowCreateCategory(false);
    setNewCategoryName("");
    setShowCreatePromptType(false);
    setNewPromptTypeName("");
    setShowCreatePromptStyle(false);
    setNewPromptStyleName("");
    setShowCreateIntendedGenerator(false);
    setNewIntendedGeneratorName("");
    setShowCreateRecommendedModel(false);
    setNewRecommendedModelName("");
  };

  const handleFileUpload = useCallback((uploadedFile: File) => {
    setFile(uploadedFile);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      parseFileContent(content, uploadedFile.name);
    };
    
    reader.readAsText(uploadedFile);
  }, []);

  const parseFileContent = (content: string, filename: string) => {
    try {
      const extension = filename.split('.').pop()?.toLowerCase();
      let parsed: ParsedPrompt[] = [];

      if (extension === 'csv') {
        const result = Papa.parse(content, { header: true });
        parsed = result.data.map((row: any, index: number) => ({
          name: row.name || row.title || `Prompt ${index + 1}`,
          promptContent: row.prompt || row.content || row.description || "",
          description: row.description || "",
          category: row.category || "",
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          status: (row.status === "published" ? "published" : "draft") as "draft" | "published",
          isPublic: row.isPublic === "true" || row.public === "true",
          isNsfw: row.isNsfw === "true" || row.nsfw === "true"
        }));
      } else if (extension === 'json') {
        const jsonData = JSON.parse(content);
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        parsed = dataArray.map((item: any, index: number) => ({
          name: item.name || item.title || `Prompt ${index + 1}`,
          promptContent: item.prompt || item.content || item.promptContent || item.positive_prompt || item.negative_prompt || "",
          description: item.description || "",
          category: item.category || "",
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',').map((t: string) => t.trim()) : []),
          status: (item.status === "published" ? "published" : "draft") as "draft" | "published",
          isPublic: item.isPublic || item.public || false
        }));
      } else if (extension === 'txt') {
        parsed = parseTxtContent(content);
      }

      setParsedData(parsed.filter(p => p.promptContent.trim() !== ""));
      setStep("preview");
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse the uploaded file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const parseTxtContent = (content: string): ParsedPrompt[] => {
    let chunks: string[] = [];
    
    if (txtParseMode === "lines") {
      chunks = content.split('\n').filter(line => line.trim() !== "");
    } else if (txtParseMode === "paragraphs") {
      chunks = content.split('\n\n').filter(para => para.trim() !== "");
    } else if (txtParseMode === "delimiter") {
      chunks = content.split(customDelimiter).filter(chunk => chunk.trim() !== "");
    }

    return chunks.map((chunk, index) => {
      const lines = chunk.trim().split('\n');
      const firstLine = lines[0].trim();
      const restContent = lines.slice(1).join('\n').trim();
      
      return {
        name: firstLine.length > 50 ? `${firstLine.substring(0, 50)}...` : firstLine || `Prompt ${index + 1}`,
        promptContent: restContent || firstLine,
        description: "",
        category: defaultCategory,
        tags: [],
        status: "draft" as const,
        isPublic: defaultIsPublic
      };
    });
  };

  const parseGoogleDocsContent = (content: string): ParsedPrompt[] => {
    // First, try to detect if the content has markdown headers (# Title)
    const markdownHeaderPattern = /^#\s+/m;
    const hasMarkdownHeaders = markdownHeaderPattern.test(content);
    
    // Check for numbered prompts (1., 2., etc.)
    const numberedPattern = /^\d+\.\s+/m;
    const hasNumberedPrompts = numberedPattern.test(content);
    
    let prompts: ParsedPrompt[] = [];
    
    if (hasMarkdownHeaders) {
      // Split by markdown headers (# at the beginning of a line)
      // This regex matches lines that start with one or more # followed by space
      const chunks = content.split(/\n(?=#+\s+)/).filter(chunk => chunk.trim() !== "");
      
      prompts = chunks.map((chunk, index) => {
        // Remove the # prefix from the first line to get the title
        const lines = chunk.split('\n');
        const firstLine = lines[0].replace(/^#+\s+/, '').trim();
        const restContent = lines.slice(1).join('\n').trim();
        
        // Use the header as the name, truncate if too long
        let name = firstLine;
        if (name.length > 50) {
          name = `${name.substring(0, 50)}...`;
        }
        
        return {
          name: name || `Prompt ${index + 1}`,
          promptContent: restContent || firstLine,
          description: "",
          category: defaultCategory,
          tags: [],
          status: "draft" as const,
          isPublic: defaultIsPublic
        };
      });
    } else if (hasNumberedPrompts) {
      // Split by numbered list items (1., 2., 3., etc.)
      const chunks = content.split(/\n(?=\d+\.\s+)/).filter(chunk => chunk.trim() !== "");
      
      prompts = chunks.map((chunk, index) => {
        // Remove the number prefix from the first line
        const cleanedChunk = chunk.replace(/^\d+\.\s+/, '').trim();
        const lines = cleanedChunk.split('\n');
        const firstLine = lines[0].trim();
        const restContent = lines.slice(1).join('\n').trim();
        
        // Extract name from quotes if present, otherwise use first line
        let name = firstLine;
        const quotedMatch = firstLine.match(/[""]([^""]+)[""]/);
        if (quotedMatch) {
          name = quotedMatch[1];
        } else if (firstLine.length > 50) {
          name = `${firstLine.substring(0, 50)}...`;
        }
        
        return {
          name: name || `Prompt ${index + 1}`,
          promptContent: restContent || firstLine,
          description: "",
          category: defaultCategory,
          tags: [],
          status: "draft" as const,
          isPublic: defaultIsPublic
        };
      });
    } else {
      // Fall back to splitting by double line breaks (paragraphs)
      const chunks = content.split('\n\n').filter(chunk => chunk.trim() !== "");
      
      prompts = chunks.map((chunk, index) => {
        const lines = chunk.trim().split('\n');
        const firstLine = lines[0].trim();
        const restContent = lines.slice(1).join('\n').trim();
        
        return {
          name: firstLine.length > 50 ? `${firstLine.substring(0, 50)}...` : firstLine || `Prompt ${index + 1}`,
          promptContent: restContent || firstLine,
          description: "",
          category: defaultCategory,
          tags: [],
          status: "draft" as const,
          isPublic: defaultIsPublic
        };
      });
    }
    
    return prompts.filter(p => p.promptContent.trim() !== "");
  };

  const bulkImportMutation = useMutation({
    mutationFn: async (prompts: ParsedPrompt[]): Promise<ImportResult> => {
      // Start progress at 10%
      setImportProgress(10);
      
      const response = await apiRequest("POST", "/api/prompts/bulk-import", {
        prompts: prompts.map(p => ({
          ...p,
          collectionId: defaultCollection && defaultCollection !== "none" ? defaultCollection : null,
          category: p.category || (defaultCategory && defaultCategory !== "none" ? defaultCategory : ""),
          isPublic: p.isPublic ?? defaultIsPublic,
          promptType: defaultPromptType && defaultPromptType !== "none" ? defaultPromptType : "",
          promptStyle: defaultPromptStyle && defaultPromptStyle !== "none" ? defaultPromptStyle : "",
          author: defaultAuthor || "",
          license: defaultLicense || "CC0 (Public Domain)",
          sourceUrl: defaultSourceUrl || "",
          intendedGenerator: defaultIntendedGenerator && defaultIntendedGenerator !== "none" ? defaultIntendedGenerator : "",
          tags: [
            ...(p.tags || []),
            ...(defaultTags ? defaultTags.split(",").map(t => t.trim()).filter(t => t) : [])
          ],
          recommendedModels: defaultRecommendedModels ? defaultRecommendedModels.split(",").map(m => m.trim()).filter(m => m) : []
        }))
      });
      
      // Progress to 90% when request completes
      setImportProgress(90);
      
      const result = await response.json();
      
      // Complete progress
      setImportProgress(100);
      
      return result;
    },
    onSuccess: (result: ImportResult) => {
      setImportResults(result);
      setStep("results");
      
      // Invalidate all prompt-related queries to refresh UI immediately
      // Using a predicate to match all variations of the prompt queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return typeof queryKey === 'string' && (
            queryKey.startsWith("/api/prompts") ||  // Changed from includes to startsWith
            queryKey.startsWith("/api/user") ||
            queryKey.startsWith("/api/collections") ||
            queryKey.startsWith("/api/activities")
          );
        }
      });
      
      // Also invalidate base queries without parameters
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      
      // Force refetch all queries to ensure UI updates
      queryClient.refetchQueries({
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return typeof queryKey === 'string' && queryKey.startsWith("/api/prompts");
        }
      });
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.success} of ${result.total} prompts.`,
      });
    },
    onError: (error) => {
      setStep("upload");
      setImportProgress(0);
      setImportResults(null);
      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    setStep("import");
    setImportProgress(0);
    bulkImportMutation.mutate(parsedData);
  };

  const handleGoogleImport = async () => {
    if (!googleUrl) return;
    
    setIsImportingGoogle(true);
    try {
      const response = await apiRequest("POST", "/api/prompts/google-import", {
        url: googleUrl,
        type: googleType
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to import from Google");
      }
      
      // Parse the content based on the type
      if (data.type === "csv") {
        const result = Papa.parse(data.content, { header: true });
        const parsed = result.data.map((row: any, index: number) => ({
          name: row.name || row.title || `Prompt ${index + 1}`,
          promptContent: row.prompt || row.content || row.description || "",
          description: row.description || "",
          category: row.category || "",
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          status: (row.status === "published" ? "published" : "draft") as "draft" | "published",
          isPublic: row.isPublic === "true" || row.public === "true",
          isNsfw: row.isNsfw === "true" || row.nsfw === "true"
        }));
        setParsedData(parsed.filter(p => p.promptContent.trim() !== ""));
      } else {
        // Parse as text (Google Docs)
        const parsed = parseGoogleDocsContent(data.content);
        setParsedData(parsed);
      }
      
      setStep("preview");
      toast({
        title: "Import Successful",
        description: `Successfully fetched content from Google ${data.type === "csv" ? "Sheets" : "Docs"}`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import from Google. Make sure the document is publicly accessible.",
        variant: "destructive",
      });
    } finally {
      setIsImportingGoogle(false);
    }
  };

  const renderUploadStep = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="file" className="flex items-center space-x-2">
          <FileUp className="h-4 w-4" />
          <span>File Upload</span>
        </TabsTrigger>
        <TabsTrigger value="csv" className="flex items-center space-x-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span>CSV</span>
        </TabsTrigger>
        <TabsTrigger value="json" className="flex items-center space-x-2">
          <FileCode className="h-4 w-4" />
          <span>JSON</span>
        </TabsTrigger>
        <TabsTrigger value="google" className="flex items-center space-x-2">
          <ExternalLink className="h-4 w-4" />
          <span>Google Import</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file" className="space-y-4">
        <div 
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) handleFileUpload(droppedFile);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload File</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Supports CSV, JSON, TXT files
          </p>
          <input
            id="file-input"
            type="file"
            accept=".csv,.json,.txt"
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileUpload(selectedFile);
            }}
          />
        </div>

        {file && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">{file.name}</span>
              <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
            </div>
          </div>
        )}

        {file?.name.endsWith('.txt') && (
          <Card>
            <CardHeader>
              <CardTitle>Text File Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Parse Mode</Label>
                <Select value={txtParseMode} onValueChange={(value: any) => setTxtParseMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lines">Each Line = One Prompt</SelectItem>
                    <SelectItem value="paragraphs">Each Paragraph = One Prompt</SelectItem>
                    <SelectItem value="delimiter">Custom Delimiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {txtParseMode === "delimiter" && (
                <div>
                  <Label>Custom Delimiter</Label>
                  <Input
                    value={customDelimiter}
                    onChange={(e) => setCustomDelimiter(e.target.value)}
                    placeholder="---"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="csv" className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">CSV Format Guidelines</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Your CSV should include these columns (case-sensitive):
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><code>name</code> or <code>title</code> - Prompt name (required)</li>
            <li><code>prompt</code> or <code>content</code> - Main prompt text (required)</li>
            <li><code>description</code> - Optional description</li>
            <li><code>category</code> - Optional category</li>
            <li><code>tags</code> - Comma-separated tags</li>
            <li><code>status</code> - "draft" or "published"</li>
            <li><code>public</code> - "true" or "false"</li>
          </ul>
        </div>
      </TabsContent>

      <TabsContent value="json" className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">JSON Format Example</h3>
          <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`[
  {
    "name": "Creative Writing Prompt",
    "content": "Write a story about...",
    "description": "A creative prompt for writers",
    "category": "Writing",
    "tags": ["creative", "story", "fiction"],
    "status": "published",
    "public": true
  }
]`}
          </pre>
        </div>
      </TabsContent>

      <TabsContent value="google" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label>Document Type</Label>
            <Select value={googleType} onValueChange={(value: "auto" | "docs" | "sheets") => setGoogleType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="docs">Google Docs</SelectItem>
                <SelectItem value="sheets">Google Sheets</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Google Document URL</Label>
            <div className="flex space-x-2">
              <Input
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/... or spreadsheets/d/..."
                disabled={isImportingGoogle}
              />
              <Button 
                variant="outline" 
                onClick={handleGoogleImport}
                disabled={!googleUrl || isImportingGoogle}
              >
                {isImportingGoogle ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm mt-2 text-[#d94cac]">
              Make sure your Google Doc or Sheet is publicly accessible (Anyone with link can view)
            </p>
          </div>

          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>Google Docs:</strong> Supports multiple formats:
                <ul className="ml-4 mt-1 text-xs">
                  <li>• Markdown headers (# Title) - Each header starts a new prompt</li>
                  <li>• Numbered lists (1., 2., 3.) - Each number starts a new prompt</li>
                  <li>• Paragraphs - Each double line break creates a new prompt</li>
                </ul>
              </div>
              <div>
                <strong>Google Sheets:</strong> Expects columns: name, prompt/content, description, category, tags
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Preview Import Data</h3>
        <Badge variant="secondary">{parsedData.length} prompts found</Badge>
      </div>

      {/* Organization Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Organization</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Default Collection</Label>
            <Select value={defaultCollection} onValueChange={(value) => {
              if (value === "create-new") {
                setShowCreateCollection(true);
              } else {
                setDefaultCollection(value);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="No collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No collection</SelectItem>
                <SelectItem value="create-new" className="text-blue-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Collection
                  </div>
                </SelectItem>
                {allCollections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Default Category</Label>
            <Select value={defaultCategory} onValueChange={(value) => {
              if (value === "create-new") {
                setShowCreateCategory(true);
              } else {
                setDefaultCategory(value);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                <SelectItem value="create-new" className="text-blue-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Category
                  </div>
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Metadata Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Metadata</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Prompt Type</Label>
            <Select value={defaultPromptType} onValueChange={(value) => {
              if (value === "create-new") {
                setShowCreatePromptType(true);
              } else {
                setDefaultPromptType(value);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="No type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No type</SelectItem>
                <SelectItem value="create-new" className="text-blue-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Type
                  </div>
                </SelectItem>
                {promptTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prompt Style</Label>
            <Select value={defaultPromptStyle} onValueChange={(value) => {
              if (value === "create-new") {
                setShowCreatePromptStyle(true);
              } else {
                setDefaultPromptStyle(value);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="No style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No style</SelectItem>
                <SelectItem value="create-new" className="text-blue-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Style
                  </div>
                </SelectItem>
                {promptStyles.map((style) => (
                  <SelectItem key={style.id} value={style.name}>{style.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Author</Label>
            <Input
              value={defaultAuthor}
              onChange={(e) => setDefaultAuthor(e.target.value)}
              placeholder="Author name..."
            />
          </div>

          <div>
            <Label>License</Label>
            <Select value={defaultLicense} onValueChange={setDefaultLicense}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CC0 (Public Domain)">CC0 (Public Domain)</SelectItem>
                <SelectItem value="CC BY (Attribution)">CC BY (Attribution)</SelectItem>
                <SelectItem value="CC BY-SA (Share Alike)">CC BY-SA (Share Alike)</SelectItem>
                <SelectItem value="All Rights Reserved">All Rights Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Source URL</Label>
            <Input
              value={defaultSourceUrl}
              onChange={(e) => setDefaultSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={defaultTags}
              onChange={(e) => setDefaultTags(e.target.value)}
              placeholder="tag1, tag2, tag3..."
            />
          </div>
        </div>
      </div>

      {/* Technical Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Technical Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Intended Generator</Label>
            <Select value={defaultIntendedGenerator} onValueChange={(value) => {
              if (value === "create-new") {
                setShowCreateIntendedGenerator(true);
              } else {
                setDefaultIntendedGenerator(value);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="No generator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No generator</SelectItem>
                <SelectItem value="create-new" className="text-blue-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Generator
                  </div>
                </SelectItem>
                {intendedGenerators.map((gen) => (
                  <SelectItem key={gen.id} value={gen.name}>{gen.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Recommended Models (comma-separated)</Label>
            <Input
              value={defaultRecommendedModels}
              onChange={(e) => setDefaultRecommendedModels(e.target.value)}
              placeholder="model1, model2..."
            />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="max-h-64 overflow-y-auto border rounded-lg">
        <div className="space-y-2 p-4">
          {parsedData.slice(0, 5).map((prompt, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <div className="font-medium text-sm">{prompt.name}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {prompt.promptContent}
              </div>
              {prompt.category && (
                <Badge variant="outline" className="mt-2">
                  {prompt.category}
                </Badge>
              )}
            </div>
          ))}
          {parsedData.length > 5 && (
            <div className="text-sm text-muted-foreground text-center p-2">
              ... and {parsedData.length - 5} more prompts
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setStep("upload")}>
          Back
        </Button>
        <Button onClick={handleImport} disabled={parsedData.length === 0}>
          Import {parsedData.length} Prompts
        </Button>
      </div>
    </div>
  );

  const renderImportStep = () => (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <Upload className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <h3 className="text-lg font-medium">Importing Prompts...</h3>
      <p className="text-muted-foreground">
        Please wait while we process your {parsedData.length} prompts
      </p>
      <Progress value={importProgress} className="w-full" />
      <p className="text-sm text-muted-foreground">
        {importProgress}% complete
      </p>
    </div>
  );

  const renderResultsStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-medium">Import Complete!</h3>
      </div>

      {importResults && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{importResults.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {importResults?.errors && importResults.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Import Errors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {importResults.errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                  <div className="font-medium">Row {error.row}:</div>
                  <div className="text-red-600 dark:text-red-400">{error.error}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => {
        onOpenChange(false);
        // Trigger one more refresh when closing after successful import
        if (importResults && importResults.success > 0) {
          queryClient.refetchQueries({
            predicate: (query) => {
              const queryKey = query.queryKey[0] as string;
              return typeof queryKey === 'string' && queryKey.startsWith("/api/prompts");
            }
          });
        }
      }} className="w-full">
        Done
      </Button>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) resetModal();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Prompts</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {step === "upload" && renderUploadStep()}
            {step === "preview" && renderPreviewStep()}
            {step === "import" && renderImportStep()}
            {step === "results" && renderResultsStep()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Collection Dialog */}
      <Dialog open={showCreateCollection} onOpenChange={setShowCreateCollection}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newCollectionName">Collection Name *</Label>
              <Input
                id="newCollectionName"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name..."
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="newCollectionDescription">Description (Optional)</Label>
              <Textarea
                id="newCollectionDescription"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Enter collection description..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowCreateCollection(false);
                setNewCollectionName("");
                setNewCollectionDescription("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newCollectionName.trim()) {
                    createCollectionMutation.mutate({
                      name: newCollectionName.trim(),
                      description: newCollectionDescription.trim() || undefined,
                    });
                  }
                }}
                disabled={!newCollectionName.trim() || createCollectionMutation.isPending}
              >
                {createCollectionMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newCategory">Category Name</Label>
              <Input
                id="newCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateCategory(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newCategoryName.trim()) {
                    createCategoryMutation.mutate(newCategoryName.trim());
                  }
                }}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Prompt Type Dialog */}
      <Dialog open={showCreatePromptType} onOpenChange={setShowCreatePromptType}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Prompt Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPromptType">Prompt Type Name</Label>
              <Input
                id="newPromptType"
                value={newPromptTypeName}
                onChange={(e) => setNewPromptTypeName(e.target.value)}
                placeholder="Enter prompt type name..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePromptType(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newPromptTypeName.trim()) {
                    createPromptTypeMutation.mutate(newPromptTypeName.trim());
                  }
                }}
                disabled={!newPromptTypeName.trim() || createPromptTypeMutation.isPending}
              >
                {createPromptTypeMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Prompt Style Dialog */}
      <Dialog open={showCreatePromptStyle} onOpenChange={setShowCreatePromptStyle}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Prompt Style</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPromptStyle">Prompt Style Name</Label>
              <Input
                id="newPromptStyle"
                value={newPromptStyleName}
                onChange={(e) => setNewPromptStyleName(e.target.value)}
                placeholder="Enter prompt style name..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePromptStyle(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newPromptStyleName.trim()) {
                    createPromptStyleMutation.mutate(newPromptStyleName.trim());
                  }
                }}
                disabled={!newPromptStyleName.trim() || createPromptStyleMutation.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Intended Generator Dialog */}
      <Dialog open={showCreateIntendedGenerator} onOpenChange={setShowCreateIntendedGenerator}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Intended Generator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newIntendedGenerator">Generator Name</Label>
              <Input
                id="newIntendedGenerator"
                value={newIntendedGeneratorName}
                onChange={(e) => setNewIntendedGeneratorName(e.target.value)}
                placeholder="Enter generator name..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateIntendedGenerator(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newIntendedGeneratorName.trim()) {
                    const newGenerator = newIntendedGeneratorName.trim();
                    setCustomIntendedGenerators(prev => [...prev, newGenerator]);
                    setDefaultIntendedGenerator(newGenerator);
                    setNewIntendedGeneratorName("");
                    setShowCreateIntendedGenerator(false);
                  }
                }}
                disabled={!newIntendedGeneratorName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Recommended Model Dialog */}
      <Dialog open={showCreateRecommendedModel} onOpenChange={setShowCreateRecommendedModel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Recommended Model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newRecommendedModel">Model Name</Label>
              <Input
                id="newRecommendedModel"
                value={newRecommendedModelName}
                onChange={(e) => setNewRecommendedModelName(e.target.value)}
                placeholder="Enter model name..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateRecommendedModel(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newRecommendedModelName.trim()) {
                    const newModel = newRecommendedModelName.trim();
                    const currentModels = defaultRecommendedModels ? defaultRecommendedModels.split(",").map(m => m.trim()) : [];
                    const updatedModels = [...currentModels, newModel].join(", ");
                    setDefaultRecommendedModels(updatedModels);
                    setNewRecommendedModelName("");
                    setShowCreateRecommendedModel(false);
                  }
                }}
                disabled={!newRecommendedModelName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}