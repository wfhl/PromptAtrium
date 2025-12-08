import React, { useState } from 'react';
import { Trash2, Wand2, RefreshCw, Image as ImageIcon, Save, CheckSquare, Square, Download, Crop, Plus, Copy, Check } from 'lucide-react';
import { ExtractedPrompt } from '../types';
import { generateSampleImage } from '../services/geminiService';
import ImageCropper from './ImageCropper';

interface PromptCardProps {
  prompt: ExtractedPrompt;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onUpdate: (updated: ExtractedPrompt) => void;
  onDelete: (id: string) => void;
  onSave?: (prompt: ExtractedPrompt) => void;
  onExport: () => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ 
  prompt, 
  isSelected = false,
  onToggleSelect,
  onUpdate, 
  onDelete, 
  onSave,
  onExport
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSavedState, setIsSavedState] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Cropper State
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSource, setCropperSource] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const newImage = await generateSampleImage(prompt.content);
      onUpdate({
        ...prompt,
        images: [...prompt.images, newImage]
      });
    } catch (err) {
      setError("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenCropper = (source?: string) => {
    setCropperSource(source || null);
    setShowCropper(true);
  };

  const handleCropComplete = (base64: string) => {
    const newImage = {
      id: crypto.randomUUID(),
      data: base64,
      mimeType: 'image/png', // Canvas exports as png
      isGenerated: false
    };
    onUpdate({
      ...prompt,
      images: [...prompt.images, newImage]
    });
    setShowCropper(false);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className={`
        bg-zinc-900 border rounded-xl overflow-hidden flex flex-col md:flex-row transition-all relative group shadow-sm
        ${isSelected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-zinc-800 hover:border-zinc-700'}
      `}>
        
        {/* Selection Checkbox Area (Overlay) */}
        <div 
          onClick={(e) => {
             e.stopPropagation();
             onToggleSelect && onToggleSelect();
          }}
          className="absolute top-0 left-0 z-20 p-3 cursor-pointer group/check"
        >
          <div className={`
            w-5 h-5 rounded flex items-center justify-center transition-all
            ${isSelected ? 'bg-blue-600 text-white' : 'bg-black/30 text-white/50 backdrop-blur-sm hover:bg-black/50'}
          `}>
             {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Visuals Section (Left) */}
        <div className="w-full md:w-[320px] bg-zinc-950 p-3 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col gap-3">
          {prompt.images.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 group/img">
                <img 
                  src={prompt.images[0].data} 
                  alt={prompt.title} 
                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                />
                
                {/* Image Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <button 
                     onClick={() => handleDeleteImage(0)}
                     className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm"
                     title="Delete Image"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>

                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-[10px] text-zinc-300 rounded border border-white/10 backdrop-blur-sm">
                  {prompt.images[0].isGenerated ? 'AI Generated' : 'Original'}
                </div>
              </div>
              
              {/* Thumbnails */}
              {prompt.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {prompt.images.map((img, idx) => (
                    <div key={img.id || idx} className="relative shrink-0 w-10 h-10 rounded overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-600">
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
            <div className="aspect-square flex flex-col items-center justify-center text-zinc-600 gap-2 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
              <ImageIcon className="w-8 h-8 opacity-40" />
              <span className="text-xs">No preview</span>
            </div>
          )}

          {/* Image Toolbar */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-[10px] text-blue-400 font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Visualize
            </button>
            
            <button
              onClick={() => handleOpenCropper(prompt.originalSourceImage)}
              className="py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-[10px] text-zinc-400 hover:text-zinc-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Crop className="w-3 h-3" />
              Crop Source
            </button>
          </div>
          {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}
        </div>

        {/* Editor Section (Right) */}
        <div className="flex-1 p-4 md:p-5 flex flex-col gap-3 relative bg-gradient-to-br from-transparent to-zinc-900/50">
          
          {/* Header Row */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1"> 
              <input
                type="text"
                value={prompt.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full bg-transparent text-lg font-bold text-zinc-100 border-none p-0 placeholder-zinc-700 focus:ring-0 focus:outline-none"
                placeholder="Untitled Prompt"
              />
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{prompt.model || 'Unknown Model'}</span>
                 <span className="text-[10px] text-zinc-600">•</span>
                 <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">{prompt.source}</span>
              </div>
            </div>
            
            {/* Action Icons */}
            <div className="flex items-center gap-1">
              {onSave && !isSavedState && (
                 <button 
                 onClick={handleSave}
                 className="p-1.5 text-blue-400 hover:bg-blue-900/20 rounded-md transition-colors"
                 title="Save to Library"
               >
                 <Save className="w-4 h-4" />
               </button>
              )}
              
              <button 
                 onClick={onExport}
                 className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
                 title="Export JSON"
              >
                <Download className="w-4 h-4" />
              </button>

              <button 
                onClick={() => onDelete(prompt.id)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-900/10 rounded-md transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <hr className="border-zinc-800/50 my-1" />

          {/* Prompt Content */}
          <div className="flex-1 space-y-1 group/field">
            <div className="flex items-center justify-between">
               <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Positive Prompt</label>
               <button 
                 onClick={copyToClipboard}
                 className="text-[10px] text-zinc-600 hover:text-blue-400 flex items-center gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity"
               >
                 {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                 {copied ? 'Copied' : 'Copy'}
               </button>
            </div>
            <textarea
              value={prompt.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full h-24 bg-transparent hover:bg-zinc-900/50 focus:bg-zinc-950 border border-transparent hover:border-zinc-800 focus:border-blue-900/30 rounded-lg p-2 text-sm text-zinc-300 focus:ring-0 outline-none resize-none font-mono leading-relaxed transition-all"
              placeholder="Enter the prompt text here..."
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Negative Prompt</label>
            <input
              type="text"
              value={prompt.negativePrompt || ''}
              onChange={(e) => handleChange('negativePrompt', e.target.value)}
              className="w-full bg-transparent hover:bg-zinc-900/50 focus:bg-zinc-950 border border-transparent hover:border-zinc-800 focus:border-red-900/30 rounded-lg p-2 text-sm text-red-200/70 focus:text-red-200 placeholder-zinc-700 focus:ring-0 outline-none font-mono transition-all"
              placeholder="None"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2 items-center">
            {prompt.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded-full border border-zinc-700">
                #{tag}
              </span>
            ))}
            <button className="text-[10px] text-zinc-600 hover:text-zinc-400 px-2 py-0.5 border border-dashed border-zinc-700 rounded-full hover:border-zinc-500 transition-colors">
              + Tag
            </button>
          </div>
        </div>
      </div>

      {showCropper && (
        <ImageCropper 
          initialImage={cropperSource}
          onClose={() => setShowCropper(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};

export default PromptCard;