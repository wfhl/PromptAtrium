import { useState, useEffect, useRef } from 'react';
import { FileJson, Sparkles, Trash2, Layers, Download, Share2, ArrowLeft, Upload, FileText, X, Link2, Image as ImageIcon, Loader2, CheckCircle2, XCircle, FileIcon, Wand2, RefreshCw, Save, CheckSquare, Square, Copy, Check, Crop as CropIcon, BookmarkPlus } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from '@tanstack/react-query';
import type { Collection } from '@shared/schema';

interface PromptImage {
  id: string;
  data: string;
  mimeType: string;
  isGenerated: boolean;
}

interface ExtractedPrompt {
  id: string;
  title: string;
  content: string;
  negativePrompt?: string;
  model?: string;
  images: PromptImage[];
  source: string;
  tags: string[];
  originalSourceImage?: string;
}

interface FileUpload {
  file: File;
  previewUrl?: string;
  base64?: string;
  mimeType: string;
}

interface TaskStatus {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

const exportPromptsToJSON = (prompts: ExtractedPrompt[], filename: string) => {
  const data = {
    exportedAt: new Date().toISOString(),
    prompts: prompts.map(p => ({
      name: p.title,
      prompt: p.content,
      negative_prompt: p.negativePrompt,
      tags: p.tags,
      model: p.model,
      images: p.images.map(img => img.data),
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

function UploadSection({ onProcess, isProcessing }: { onProcess: (files: FileUpload[], text: string) => void; isProcessing: boolean }) {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (incomingFiles: File[]) => {
    const newFiles: FileUpload[] = [];
    for (const file of incomingFiles) {
      if (file && file.type) {
        const base64 = await readFileAsBase64(file);
        newFiles.push({
          file,
          mimeType: file.type,
          base64,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        });
      }
    }
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    if (files.length === 0 && textInput.trim().length === 0) return;
    onProcess(files, textInput);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload Sources
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
            Supports Images, PDFs, Links
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="h-40 border border-dashed border-border hover:border-blue-500 hover:bg-accent/30 transition-all rounded-xl cursor-pointer flex flex-col items-center justify-center group"
              data-testid="dropzone-upload"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept="image/*,application/pdf,.txt"
                data-testid="input-file-upload"
              />
              <div className="p-3 bg-muted rounded-full group-hover:scale-110 transition-transform mb-3">
                <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Drop files or click to browse</p>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {files.map((f, idx) => (
                  <div key={idx} className="relative group aspect-square bg-muted rounded-lg border border-border overflow-hidden">
                    <button 
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-all z-10"
                      data-testid={`button-remove-file-${idx}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {f.previewUrl ? (
                      <img src={f.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="relative flex-1">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste Civitai links, Instagram posts, or prompt text here..."
                className="w-full h-full min-h-[160px] bg-background border border-border hover:border-primary/50 rounded-xl p-4 text-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none resize-none transition-all placeholder:text-muted-foreground"
                data-testid="textarea-text-input"
              />
              <div className="absolute top-4 right-4 pointer-events-none">
                <Link2 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleStart}
            disabled={isProcessing || (files.length === 0 && textInput.trim().length === 0)}
            data-testid="button-extract"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                Extract Prompts
                <Upload className="w-3.5 h-3.5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProcessingQueue({ tasks }: { tasks: TaskStatus[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 animate-in slide-in-from-top-2 fade-in">
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
        <div className="px-4 py-2 border-b border-border flex justify-between items-center">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Queue</h3>
          <span className="text-[10px] text-muted-foreground font-mono">{tasks.filter(t => t.status === 'success' || t.status === 'error').length} / {tasks.length}</span>
        </div>
        <div className="divide-y divide-border max-h-40 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-1.5 rounded-md shrink-0
                  ${task.status === 'processing' ? 'text-blue-400 bg-blue-400/10' : ''}
                  ${task.status === 'success' ? 'text-green-400 bg-green-400/10' : ''}
                  ${task.status === 'error' ? 'text-red-400 bg-red-400/10' : ''}
                  ${task.status === 'pending' ? 'text-muted-foreground bg-muted' : ''}
                `}>
                  {task.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {task.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {task.status === 'error' && <XCircle className="w-3.5 h-3.5" />}
                  {task.status === 'pending' && <FileIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm truncate pr-4" title={task.name}>{task.name}</span>
                  {task.message && (
                    <span className="text-[10px] text-muted-foreground truncate">{task.message}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PromptCard({ 
  prompt, 
  isSelected = false,
  onToggleSelect,
  onUpdate, 
  onDelete, 
  onSave,
  onSaveToDatabase,
  onExport
}: {
  prompt: ExtractedPrompt;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onUpdate: (updated: ExtractedPrompt) => void;
  onDelete: (id: string) => void;
  onSave?: (prompt: ExtractedPrompt) => void;
  onSaveToDatabase?: (prompt: ExtractedPrompt) => Promise<void>;
  onExport: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavedState, setIsSavedState] = useState(false);
  const [isSavedToDb, setIsSavedToDb] = useState(!onSaveToDatabase);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!onSaveToDatabase) {
      setIsSavedToDb(true);
    }
  }, [onSaveToDatabase]);

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await apiRequest("POST", "/api/prompt-miner/generate-image", { prompt: prompt.content });
      const data = await response.json();
      if (data.image) {
        onUpdate({
          ...prompt,
          images: [...prompt.images, data.image]
        });
      }
    } catch (err: any) {
      setError(err?.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteImage = (imgIndex: number) => {
    const newImages = [...prompt.images];
    newImages.splice(imgIndex, 1);
    onUpdate({ ...prompt, images: newImages });
  };

  const handleChange = (field: keyof ExtractedPrompt, value: any) => {
    onUpdate({ ...prompt, [field]: value });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(prompt);
      setIsSavedState(true);
    }
  };

  const handleSaveToDatabase = async () => {
    if (onSaveToDatabase && !isSavedToDb) {
      setIsSavingToDb(true);
      try {
        await onSaveToDatabase(prompt);
        setIsSavedToDb(true);
      } catch (err) {
        setError("Failed to save to library");
      } finally {
        setIsSavingToDb(false);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-card border rounded-xl overflow-hidden flex flex-col md:flex-row transition-all relative group shadow-sm
      ${isSelected ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border hover:border-border/80'}
    `} data-testid={`card-prompt-${prompt.id}`}>
      
      <div 
        onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(); }}
        className="absolute top-0 left-0 z-20 p-3 cursor-pointer"
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all
          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-black/30 text-white/50 backdrop-blur-sm hover:bg-black/50'}
        `}>
          {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div className="w-full md:w-[320px] bg-muted p-3 border-b md:border-b-0 md:border-r border-border flex flex-col gap-3">
        {prompt.images.length > 0 ? (
          <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-background border border-border group/img">
              <img 
                src={prompt.images[0].data} 
                alt={prompt.title} 
                className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => handleDeleteImage(0)}
                  className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm"
                  data-testid="button-delete-image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-[10px] text-white rounded border border-white/10 backdrop-blur-sm">
                {prompt.images[0].isGenerated ? 'AI Generated' : 'Original'}
              </div>
            </div>
            
            {prompt.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {prompt.images.map((img, idx) => (
                  <div key={img.id || idx} className="relative shrink-0 w-10 h-10 rounded overflow-hidden border border-border cursor-pointer hover:border-primary/50">
                    <img 
                      src={img.data} 
                      className="w-full h-full object-cover" 
                      alt="thumb" 
                      onClick={() => {
                        const newImages = [...prompt.images];
                        const [selected] = newImages.splice(idx, 1);
                        newImages.unshift(selected);
                        onUpdate({ ...prompt, images: newImages });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center text-muted-foreground gap-2 bg-background rounded-lg border border-dashed border-border">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <span className="text-xs">No preview</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="text-xs"
            data-testid="button-visualize"
          >
            {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
            Visualize
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            disabled
          >
            <CropIcon className="w-3 h-3 mr-1" />
            Crop
          </Button>
        </div>
        {error && <p className="text-[10px] text-destructive text-center">{error}</p>}
      </div>

      <div className="flex-1 p-4 md:p-5 flex flex-col gap-3 relative">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1"> 
            <input
              type="text"
              value={prompt.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-transparent text-lg font-bold border-none p-0 placeholder-muted-foreground focus:ring-0 focus:outline-none"
              placeholder="Untitled Prompt"
              data-testid="input-prompt-title"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{prompt.model || 'Unknown Model'}</span>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{prompt.source}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onSaveToDatabase && !isSavedToDb && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSaveToDatabase} 
                className="text-green-500 hover:text-green-600" 
                disabled={isSavingToDb}
                title="Save to My Library"
                data-testid="button-save-to-db"
              >
                {isSavingToDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
              </Button>
            )}
            {isSavedToDb && (
              <span className="text-green-500 px-2" title="Saved to Library">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            )}
            {onSave && !isSavedState && (
              <Button variant="ghost" size="icon" onClick={handleSave} className="text-primary" title="Save to Session" data-testid="button-save-prompt">
                <Save className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onExport} data-testid="button-export-prompt">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(prompt.id)} className="hover:text-destructive" data-testid="button-delete-prompt">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <hr className="border-border/50 my-1" />

        <div className="flex-1 space-y-1 group/field">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Positive Prompt</label>
            <button 
              onClick={copyToClipboard}
              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity"
              data-testid="button-copy-prompt"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            value={prompt.content}
            onChange={(e) => handleChange('content', e.target.value)}
            className="w-full h-24 bg-transparent hover:bg-accent/30 focus:bg-accent/50 border border-transparent hover:border-border focus:border-primary/30 rounded-lg p-2 text-sm focus:ring-0 outline-none resize-none font-mono leading-relaxed transition-all"
            placeholder="Enter the prompt text here..."
            data-testid="textarea-prompt-content"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Negative Prompt</label>
          <input
            type="text"
            value={prompt.negativePrompt || ''}
            onChange={(e) => handleChange('negativePrompt', e.target.value)}
            className="w-full bg-transparent hover:bg-accent/30 focus:bg-accent/50 border border-transparent hover:border-border focus:border-destructive/30 rounded-lg p-2 text-sm text-destructive/70 focus:text-destructive placeholder-muted-foreground focus:ring-0 outline-none font-mono transition-all"
            placeholder="None"
            data-testid="input-negative-prompt"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2 items-center">
          {prompt.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full border border-border">
              #{tag}
            </span>
          ))}
          <button className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 border border-dashed border-border rounded-full hover:border-primary/50 transition-colors">
            + Tag
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PromptMinerPage() {
  const { toast } = useToast();
  const [extractedPrompts, setExtractedPrompts] = useState<ExtractedPrompt[]>([]);
  const [libraryPrompts, setLibraryPrompts] = useState<ExtractedPrompt[]>([]);
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'extract' | 'library'>('extract');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [pendingBulkSave, setPendingBulkSave] = useState(false);

  // Fetch user collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setSelectedPromptIds(new Set());
  }, [activeTab]);

  const handleProcess = async (files: FileUpload[], text: string) => {
    setIsProcessing(true);
    setActiveTab('extract');
    
    interface SourceTask {
      taskType: 'file' | 'text';
      data?: string;
      name: string;
      mimeType?: string;
      base64?: string;
    }
    
    const newTasks: SourceTask[] = [];
    files.forEach(f => newTasks.push({ 
      taskType: 'file', 
      name: f.file.name,
      mimeType: f.mimeType,
      base64: f.base64
    }));
    if (text.trim().length > 0) {
      newTasks.push({ taskType: 'text', data: text, name: "Text/URL Input" });
    }

    if (newTasks.length === 0) {
      setIsProcessing(false);
      return;
    }

    const taskIds = newTasks.map(() => crypto.randomUUID());
    const initialTaskStatuses: TaskStatus[] = newTasks.map((task, i) => ({
      id: taskIds[i],
      name: task.name,
      status: 'pending'
    }));
    
    setTasks(prev => [...initialTaskStatuses, ...prev]);

    let completedCount = 0;
    
    newTasks.forEach((task, index) => {
      const taskId = taskIds[index];
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'processing' } : t));

      apiRequest("POST", "/api/prompt-miner/analyze", task)
        .then((res: Response) => res.json())
        .then((data: any) => {
          if (data.prompts && data.prompts.length > 0) {
            setExtractedPrompts(prev => [...data.prompts, ...prev]);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', message: `Found ${data.prompts.length} prompt(s)` } : t));
          } else {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', message: 'No prompts found' } : t));
          }
        })
        .catch((err: any) => {
          const errorMessage = err?.message || err?.error || 'Processing failed';
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', message: errorMessage } : t));
        })
        .finally(() => {
          completedCount++;
          if (completedCount === newTasks.length) {
            setIsProcessing(false);
          }
        });
    });
  };

  const handleUpdatePrompt = (updated: ExtractedPrompt) => {
    if (activeTab === 'extract') {
      setExtractedPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
    } else {
      setLibraryPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
  };

  const handleDeletePrompt = (id: string) => {
    if (activeTab === 'extract') {
      setExtractedPrompts(prev => prev.filter(p => p.id !== id));
    } else {
      setLibraryPrompts(prev => prev.filter(p => p.id !== id));
    }
    setSelectedPromptIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleSaveToLibrary = async (prompt: ExtractedPrompt) => {
    setLibraryPrompts(prev => [prompt, ...prev]);
    setExtractedPrompts(prev => prev.filter(p => p.id !== prompt.id));
    toast({
      title: "Saved to Library",
      description: `"${prompt.title}" has been saved to your session library.`,
    });
  };

  const toggleSelectPrompt = (id: string) => {
    setSelectedPromptIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getVisiblePrompts = () => activeTab === 'extract' ? extractedPrompts : libraryPrompts;

  const handleSelectAll = () => {
    const visible = getVisiblePrompts();
    if (selectedPromptIds.size === visible.length) {
      setSelectedPromptIds(new Set());
    } else {
      setSelectedPromptIds(new Set(visible.map(p => p.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (activeTab === 'extract') {
      setExtractedPrompts(prev => prev.filter(p => !selectedPromptIds.has(p.id)));
    } else {
      setLibraryPrompts(prev => prev.filter(p => !selectedPromptIds.has(p.id)));
    }
    setSelectedPromptIds(new Set());
  };

  const handleExportSelected = () => {
    const selected = getVisiblePrompts().filter(p => selectedPromptIds.has(p.id));
    if (selected.length > 0) {
      exportPromptsToJSON(selected, `prompt-miner-selected-${Date.now()}`);
    }
  };

  const handleSaveSelectedToLibrary = () => {
    const selected = extractedPrompts.filter(p => selectedPromptIds.has(p.id));
    setLibraryPrompts(prev => [...selected, ...prev]);
    setExtractedPrompts(prev => prev.filter(p => !selectedPromptIds.has(p.id)));
    setSelectedPromptIds(new Set());
    setActiveTab('library');
    toast({
      title: "Saved to Library",
      description: `${selected.length} prompt(s) saved to your session library.`,
    });
  };

  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [savedToDbIds, setSavedToDbIds] = useState<Set<string>>(new Set());

  const handleSaveToDatabase = async (prompt: ExtractedPrompt, collectionId?: string): Promise<void> => {
    const promptData: any = {
      name: prompt.title || 'Untitled Prompt',
      description: prompt.content?.substring(0, 500) || '',
      promptContent: prompt.content || '',
      negativePrompt: prompt.negativePrompt || null,
      tags: prompt.tags || [],
      intendedGenerator: prompt.model || null,
      sourceUrl: prompt.source || null,
      isPublic: false,
      status: 'draft' as const,
      notes: `Extracted via PromptMiner from: ${prompt.source || 'unknown source'}`,
    };

    if (collectionId) {
      promptData.collectionId = collectionId;
    }

    try {
      const response = await apiRequest("POST", "/api/prompts", promptData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.message || errorData?.errors?.[0]?.message || 'Failed to save prompt';
        throw new Error(errorMessage);
      }
      
      setSavedToDbIds(prev => new Set([...prev, prompt.id]));
      queryClient.invalidateQueries({ queryKey: ['/api/prompts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      
      toast({
        title: "Saved to Library",
        description: `"${prompt.title}" has been saved to your prompt library.`,
      });
    } catch (err: any) {
      console.error('Save to database error:', err);
      throw err;
    }
  };

  const handleBulkSaveToDatabase = async () => {
    const selected = getVisiblePrompts().filter(p => selectedPromptIds.has(p.id) && !savedToDbIds.has(p.id));
    if (selected.length === 0) {
      toast({
        title: "Nothing to save",
        description: "All selected prompts have already been saved.",
        variant: "destructive"
      });
      return;
    }

    setPendingBulkSave(true);
    setShowCollectionDialog(true);
  };

  const handleProceedBulkSave = async () => {
    const selected = getVisiblePrompts().filter(p => selectedPromptIds.has(p.id) && !savedToDbIds.has(p.id));
    
    setIsBulkSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (const prompt of selected) {
      try {
        await handleSaveToDatabase(prompt, selectedCollectionId || undefined);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to save prompt "${prompt.title}":`, err);
      }
    }

    setIsBulkSaving(false);
    setShowCollectionDialog(false);
    setSelectedPromptIds(new Set());
    setSelectedCollectionId(null);
    setNewCollectionName('');
    setPendingBulkSave(false);
    
    if (failCount === 0) {
      toast({
        title: "All prompts saved",
        description: `${successCount} prompt(s) saved to your library.`,
      });
    } else {
      toast({
        title: "Partial save completed",
        description: `${successCount} saved, ${failCount} failed.`,
        variant: "destructive"
      });
    }
  };

  const handleCreateNewCollection = async () => {
    if (!newCollectionName.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingCollection(true);
    try {
      const response = await apiRequest("POST", "/api/collections", {
        name: newCollectionName,
        isPublic: false,
        type: "user",
      });
      
      const newCollection = await response.json();
      setSelectedCollectionId(newCollection.id);
      setNewCollectionName('');
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      
      toast({
        title: "Collection created",
        description: `"${newCollectionName}" has been created.`,
      });
    } catch (err: any) {
      console.error('Collection creation error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to create collection",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCollection(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/tools">
              <Button variant="ghost" size="icon" className="mr-2" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              PromptMiner
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedPromptIds.size === 0 && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => exportPromptsToJSON(getVisiblePrompts(), `prompt-miner-${activeTab}-all`)}
                className="hidden md:flex items-center gap-2"
                data-testid="button-backup"
              >
                <FileJson className="w-3.5 h-3.5" />
                Backup
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-10">
        <UploadSection 
          onProcess={handleProcess} 
          isProcessing={isProcessing}
        />
        
        <ProcessingQueue tasks={tasks} />

        <div className="mt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('extract')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'extract' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="tab-extract"
              >
                <Layers className="w-4 h-4 inline-block mr-2" />
                Extracted ({extractedPrompts.length})
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'library' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="tab-library"
              >
                <Sparkles className="w-4 h-4 inline-block mr-2" />
                Session Library ({libraryPrompts.length})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getVisiblePrompts().length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                  data-testid="button-select-all"
                >
                  {selectedPromptIds.size === getVisiblePrompts().length && selectedPromptIds.size > 0 ? 'Deselect All' : 'Select All'}
                </Button>
              )}
              {selectedPromptIds.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">{selectedPromptIds.size} selected</span>
                <Button 
                  size="sm" 
                  onClick={handleBulkSaveToDatabase}
                  disabled={isBulkSaving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-bulk-save-db"
                >
                  {isBulkSaving ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save to My Library
                </Button>
                {activeTab === 'extract' && (
                  <Button size="sm" variant="outline" onClick={handleSaveSelectedToLibrary}>
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Save to Session
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleExportSelected}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {getVisiblePrompts().length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">
                  {activeTab === 'extract' 
                    ? 'No prompts extracted yet' 
                    : 'Your session library is empty'}
                </p>
                <p className="text-sm mt-1">
                  {activeTab === 'extract' 
                    ? 'Upload images or paste text to get started' 
                    : 'Save extracted prompts to build your collection'}
                </p>
              </div>
            ) : (
              getVisiblePrompts().map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isSelected={selectedPromptIds.has(prompt.id)}
                  onToggleSelect={() => toggleSelectPrompt(prompt.id)}
                  onUpdate={handleUpdatePrompt}
                  onDelete={handleDeletePrompt}
                  onSave={activeTab === 'extract' ? handleSaveToLibrary : undefined}
                  onSaveToDatabase={!savedToDbIds.has(prompt.id) ? handleSaveToDatabase : undefined}
                  onExport={() => exportPromptsToJSON([prompt], `prompt-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Collection Selector Dialog */}
        <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save to Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select existing collection or create new</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCollectionId(null)}
                    className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                      selectedCollectionId === null
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    No Collection (My Library)
                  </button>
                  {collections.map(collection => (
                    <button
                      key={collection.id}
                      onClick={() => setSelectedCollectionId(collection.id)}
                      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                        selectedCollectionId === collection.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      {collection.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="collection-name" className="text-sm font-medium">Create new collection</Label>
                <div className="flex gap-2">
                  <Input
                    id="collection-name"
                    placeholder="Collection name..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="flex-1"
                    data-testid="input-collection-name"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateNewCollection}
                    disabled={isCreatingCollection}
                    variant="outline"
                    data-testid="button-create-collection-dialog"
                  >
                    {isCreatingCollection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCollectionDialog(false)}
                disabled={isBulkSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedBulkSave}
                disabled={isBulkSaving}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-proceed-bulk-save"
              >
                {isBulkSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />
                )}
                Save {selectedPromptIds.size} Prompt{selectedPromptIds.size !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}