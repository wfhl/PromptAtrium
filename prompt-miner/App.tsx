import React, { useState, useEffect } from 'react';
import { FileJson, Sparkles, Trash2, Database, UploadCloud, Layers, XCircle, CheckSquare, Square, Download, Share2 } from 'lucide-react';
import UploadSection from './components/UploadSection';
import PromptCard from './components/PromptCard';
import ProcessingQueue from './components/ProcessingQueue';
import { analyzeSource, SourceTask } from './services/geminiService';
import { 
  loadPromptsFromStorage, 
  savePromptToStorage, 
  deletePromptFromStorage, 
  clearStorage,
  checkSharedContent
} from './services/storageService';
import { ExtractedPrompt, FileUpload, TaskStatus, PromptAtriumExport } from './types';

const App: React.FC = () => {
  // State for persistent library
  const [libraryPrompts, setLibraryPrompts] = useState<ExtractedPrompt[]>([]);
  // State for current session extractions (not yet saved)
  const [extractedPrompts, setExtractedPrompts] = useState<ExtractedPrompt[]>([]);
  // Task Queue Status
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  
  // Selection State
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  
  const [activeTab, setActiveTab] = useState<'extract' | 'library'>('extract');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);

  // Incoming Shared Data
  const [sharedText, setSharedText] = useState('');
  const [sharedFiles, setSharedFiles] = useState<File[]>([]);

  // Load library from IndexedDB on startup
  useEffect(() => {
    const init = async () => {
      try {
        const savedPrompts = await loadPromptsFromStorage();
        setLibraryPrompts(savedPrompts.reverse()); 
        
        if (savedPrompts.length > 0) {
          setActiveTab('library');
        }

        // Check if app was opened via Share Target (URL Param ?shared=true)
        const params = new URLSearchParams(window.location.search);
        if (params.get('shared') === 'true') {
           const content = await checkSharedContent();
           if (content) {
             if (content.text) setSharedText(content.text);
             if (content.file) setSharedFiles([content.file]);
             setActiveTab('extract'); 
             window.history.replaceState({}, '', '/');
           }
        }
      } catch (err) {
        console.error("Failed to load library:", err);
      } finally {
        setIsLibraryLoading(false);
      }
    };
    init();
  }, []);

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedPromptIds(new Set());
  }, [activeTab]);

  const handleProcess = async (files: FileUpload[], text: string) => {
    setIsProcessing(true);
    setActiveTab('extract');
    
    // Create Tasks
    const newTasks: SourceTask[] = [];
    files.forEach(f => newTasks.push({ type: 'file', data: f, name: f.file.name }));
    if (text.trim().length > 0) {
      newTasks.push({ type: 'text', data: text, name: "Text/URL Input" });
    }

    if (newTasks.length === 0) {
        setIsProcessing(false);
        return;
    }

    // Initialize UI Queue
    const taskIds = newTasks.map(() => crypto.randomUUID());
    const initialTaskStatuses: TaskStatus[] = newTasks.map((task, i) => ({
      id: taskIds[i],
      name: task.name,
      status: 'pending'
    }));
    
    setTasks(prev => [...initialTaskStatuses, ...prev]); 

    // Process Concurrently
    let completedCount = 0;
    
    newTasks.forEach((task, index) => {
      const taskId = taskIds[index];
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'processing' } : t));

      analyzeSource(task)
        .then(prompts => {
          if (prompts.length > 0) {
            setExtractedPrompts(prev => [...prompts, ...prev]);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', message: `Found ${prompts.length} prompt(s)` } : t));
          } else {
             setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', message: 'No prompts found' } : t));
          }
        })
        .catch(error => {
          let reason = "Unknown error";
          if (error.message) reason = error.message;
          if (error.toString().includes("400")) reason = "Bad Request/File too large";
          if (error.toString().includes("503")) reason = "AI Service Unavailable";
          
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', message: reason } : t));
        })
        .finally(() => {
          completedCount++;
          if (completedCount === newTasks.length) {
            setIsProcessing(false);
          }
        });
    });
  };

  // --- Helpers ---
  
  const getVisiblePrompts = () => activeTab === 'library' ? libraryPrompts : extractedPrompts;

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedPromptIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPromptIds(newSet);
  };

  const toggleSelectAll = () => {
    const visible = getVisiblePrompts();
    if (selectedPromptIds.size === visible.length && visible.length > 0) {
      setSelectedPromptIds(new Set());
    } else {
      setSelectedPromptIds(new Set(visible.map(p => p.id)));
    }
  };

  const exportPromptsToJSON = (prompts: ExtractedPrompt[], filenamePrefix: string) => {
    if (prompts.length === 0) return;

    const exportData: PromptAtriumExport = {
      prompts: prompts.map(p => ({
        name: p.title,
        prompt: p.content,
        negative_prompt: p.negativePrompt,
        images: p.images.map(img => img.data),
        tags: p.tags,
        notes: `Model: ${p.model || 'Unknown'} | Source: ${p.source}`
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Action Handlers ---

  const handleUpdateExtracted = (updated: ExtractedPrompt) => {
    setExtractedPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleUpdateLibrary = async (updated: ExtractedPrompt) => {
    setLibraryPrompts(prev => prev.map(p => p.id === updated.id ? updated : p));
    await savePromptToStorage(updated);
  };

  const handleDeleteSingle = async (id: string) => {
    if (activeTab === 'library') {
      if(!window.confirm("Delete this prompt?")) return;
      await deletePromptFromStorage(id);
      setLibraryPrompts(prev => prev.filter(p => p.id !== id));
    } else {
      setExtractedPrompts(prev => prev.filter(p => p.id !== id));
    }
    if (selectedPromptIds.has(id)) {
      const newSet = new Set(selectedPromptIds);
      newSet.delete(id);
      setSelectedPromptIds(newSet);
    }
  };

  const handleSaveToLibrary = async (prompt: ExtractedPrompt) => {
    try {
      await savePromptToStorage(prompt);
      setLibraryPrompts(prev => [prompt, ...prev]);
      setExtractedPrompts(prev => prev.filter(p => p.id !== prompt.id));
      if (selectedPromptIds.has(prompt.id)) {
         const newSet = new Set(selectedPromptIds);
         newSet.delete(prompt.id);
         setSelectedPromptIds(newSet);
      }
    } catch (err) {
      console.error("Failed to save prompt:", err);
      alert("Failed to save prompt to library.");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedPromptIds.size} prompts?`)) return;

    if (activeTab === 'library') {
      for (const id of selectedPromptIds) {
        await deletePromptFromStorage(id);
      }
      setLibraryPrompts(prev => prev.filter(p => !selectedPromptIds.has(p.id)));
    } else {
      setExtractedPrompts(prev => prev.filter(p => !selectedPromptIds.has(p.id)));
    }
    setSelectedPromptIds(new Set());
  };

  const handleBulkExport = () => {
    const visible = getVisiblePrompts();
    const toExport = visible.filter(p => selectedPromptIds.has(p.id));
    exportPromptsToJSON(toExport, `prompt-miner-${activeTab}-selected`);
  };

  const handleExportSingle = (prompt: ExtractedPrompt) => {
    exportPromptsToJSON([prompt], `prompt-${prompt.title.replace(/\s+/g, '-').toLowerCase()}`);
  };

  const handleClearLibrary = async () => {
    if (window.confirm("Are you sure you want to delete ALL prompts? This cannot be undone.")) {
      await clearStorage();
      setLibraryPrompts([]);
    }
  };

  const handleSaveSelectedToLibrary = async () => {
    const selected = extractedPrompts.filter(p => selectedPromptIds.has(p.id));
    for (const prompt of selected) {
      await savePromptToStorage(prompt);
    }
    setLibraryPrompts(prev => [...selected, ...prev]);
    setExtractedPrompts(prev => prev.filter(p => !selectedPromptIds.has(p.id)));
    setSelectedPromptIds(new Set());
    setActiveTab('library');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pb-32 relative overflow-x-hidden">
      
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">
              PromptMiner
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {selectedPromptIds.size === 0 && (
               <button 
                  onClick={() => exportPromptsToJSON(getVisiblePrompts(), `prompt-miner-${activeTab}-all`)}
                  className="hidden md:flex px-3 py-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md text-xs font-medium items-center gap-2 transition-all"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Backup
                </button>
             )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-10">
        
        <UploadSection 
          onProcess={handleProcess} 
          isProcessing={isProcessing} 
          initialText={sharedText}
          initialFiles={sharedFiles}
        />
        
        <ProcessingQueue tasks={tasks} />

        {/* Navigation & Controls */}
        <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-2">
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800/50">
            <button
              onClick={() => setActiveTab('extract')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all
                ${activeTab === 'extract' 
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
              `}
            >
              <UploadCloud className="w-4 h-4" />
              New Results
              {extractedPrompts.length > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {extractedPrompts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all
                ${activeTab === 'library' 
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
              `}
            >
              <Layers className="w-4 h-4" />
              Library
              {libraryPrompts.length > 0 && (
                <span className="ml-1 bg-zinc-700 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {libraryPrompts.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
             {getVisiblePrompts().length > 0 && (
               <button 
                onClick={toggleSelectAll}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-zinc-900 transition-colors"
              >
                {selectedPromptIds.size === getVisiblePrompts().length && selectedPromptIds.size > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                Select All
              </button>
             )}

             {activeTab === 'library' && libraryPrompts.length > 0 && (
               <button 
                onClick={handleClearLibrary}
                className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-zinc-900 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
             )}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-8 min-h-[400px]">
          
          {/* EXTRACT TAB */}
          {activeTab === 'extract' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {extractedPrompts.length > 0 ? (
                extractedPrompts.map(prompt => (
                  <PromptCard 
                    key={prompt.id} 
                    prompt={prompt} 
                    isSelected={selectedPromptIds.has(prompt.id)}
                    onToggleSelect={() => toggleSelection(prompt.id)}
                    onUpdate={handleUpdateExtracted}
                    onDelete={handleDeleteSingle}
                    onSave={handleSaveToLibrary}
                    onExport={() => handleExportSingle(prompt)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                  <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800 shadow-inner">
                    <UploadCloud className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h3 className="text-zinc-300 font-medium mb-1">No extraction results</h3>
                  <p className="text-zinc-500 text-sm max-w-xs text-center mb-8">
                    Upload screenshots or paste links to start.
                  </p>
                  
                  <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                     <Share2 className="w-4 h-4 text-blue-500" />
                     <div className="text-left">
                       <p className="text-xs text-zinc-400">
                         <span className="text-zinc-300 font-medium">Pro Tip:</span> Share directly from Instagram or Photos.
                       </p>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isLibraryLoading ? (
                 <div className="flex justify-center items-center py-20 text-zinc-500 gap-2">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></div>
                    <span className="text-sm">Loading library...</span>
                </div>
              ) : libraryPrompts.length > 0 ? (
                libraryPrompts.map(prompt => (
                  <PromptCard 
                    key={prompt.id} 
                    prompt={prompt} 
                    isSelected={selectedPromptIds.has(prompt.id)}
                    onToggleSelect={() => toggleSelection(prompt.id)}
                    onUpdate={handleUpdateLibrary}
                    onDelete={handleDeleteSingle}
                    onExport={() => handleExportSingle(prompt)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                  <Database className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-zinc-400 font-medium">Library is empty</p>
                </div>
              )}
            </div>
          )}
          
        </div>

      </main>

      {/* Floating Action Bar */}
      {selectedPromptIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 shadow-2xl shadow-black/50 rounded-full px-6 py-2.5 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4 fade-in">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2 border-r border-zinc-700 pr-4">
             <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
             {selectedPromptIds.size}
          </span>
          
          <button 
            onClick={handleBulkExport}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            title="Export Selected"
          >
            <Download className="w-4 h-4" />
          </button>

          {activeTab === 'extract' && (
            <button 
              onClick={handleSaveSelectedToLibrary}
              className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors"
              title="Save Selected"
            >
              <Database className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={handleBulkDelete}
            className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
            title="Delete Selected"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button 
             onClick={() => setSelectedPromptIds(new Set())}
             className="ml-2 text-zinc-600 hover:text-zinc-400"
          >
             <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      <footer className="py-8 mt-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-600 text-xs">
          <p>PromptMiner AI © {new Date().getFullYear()}</p>
        </div>
      </footer>

    </div>
  );
};

export default App;