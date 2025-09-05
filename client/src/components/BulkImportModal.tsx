import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Download
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
  
  // Google Docs
  const [googleDocsUrl, setGoogleDocsUrl] = useState("");
  
  const resetModal = () => {
    setFile(null);
    setFileContent("");
    setParsedData([]);
    setStep("upload");
    setImportProgress(0);
    setImportResults(null);
    setGoogleDocsUrl("");
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
          isPublic: row.isPublic === "true" || row.public === "true"
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

  const bulkImportMutation = useMutation({
    mutationFn: async (prompts: ParsedPrompt[]): Promise<ImportResult> => {
      const response = await apiRequest("POST", "/api/prompts/bulk-import", {
        prompts: prompts.map(p => ({
          ...p,
          collectionId: defaultCollection && defaultCollection !== "none" ? defaultCollection : null,
          category: p.category || (defaultCategory && defaultCategory !== "none" ? defaultCategory : ""),
          isPublic: p.isPublic ?? defaultIsPublic
        }))
      });
      return await response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResults(result);
      setStep("results");
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
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
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    bulkImportMutation.mutate(parsedData);
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
          <span>Google Docs</span>
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
        <div>
          <Label>Google Docs URL</Label>
          <div className="flex space-x-2">
            <Input
              value={googleDocsUrl}
              onChange={(e) => setGoogleDocsUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/..."
            />
            <Button variant="outline" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Google Docs integration coming soon!
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Default Collection</Label>
          <Select value={defaultCollection} onValueChange={setDefaultCollection}>
            <SelectTrigger>
              <SelectValue placeholder="No collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No collection</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Default Category</Label>
          <Select value={defaultCategory} onValueChange={setDefaultCategory}>
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              <SelectItem value="Art & Design">Art & Design</SelectItem>
              <SelectItem value="Photography">Photography</SelectItem>
              <SelectItem value="Character Design">Character Design</SelectItem>
              <SelectItem value="Landscape">Landscape</SelectItem>
              <SelectItem value="Logo & Branding">Logo & Branding</SelectItem>
              <SelectItem value="Abstract">Abstract</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto border rounded-lg">
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

      <Button onClick={() => onOpenChange(false)} className="w-full">
        Done
      </Button>
    </div>
  );

  return (
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
  );
}