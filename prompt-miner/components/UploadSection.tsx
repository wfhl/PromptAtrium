import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, Globe, Image as ImageIcon, Link2 } from 'lucide-react';
import { FileUpload } from '../types';

interface UploadSectionProps {
  onProcess: (files: FileUpload[], text: string) => void;
  isProcessing: boolean;
  initialText?: string;
  initialFiles?: File[];
}

const UploadSection: React.FC<UploadSectionProps> = ({ onProcess, isProcessing, initialText = '', initialFiles = [] }) => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to load initial props
  useEffect(() => {
    if (initialText) setTextInput(initialText);
    if (initialFiles && initialFiles.length > 0) {
       processFiles(initialFiles);
    }
  }, [initialText, initialFiles]);

  const processFiles = async (incomingFiles: File[]) => {
    const newFiles: FileUpload[] = [];
    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
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
      const fileList = Array.from(e.target.files) as File[];
      await processFiles(fileList);
    }
    // Reset input
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
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload Sources
          </h2>
          <span className="text-xs text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
            Supports Images, PDFs, Links
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
           
           {/* Left: Files */}
           <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-40 border border-dashed border-zinc-700 hover:border-blue-500 hover:bg-zinc-800/30 transition-all rounded-xl cursor-pointer flex flex-col items-center justify-center group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  multiple 
                  accept="image/*,application/pdf,.txt"
                />
                <div className="p-3 bg-zinc-800/50 rounded-full group-hover:scale-110 transition-transform mb-3">
                  <ImageIcon className="w-6 h-6 text-zinc-400 group-hover:text-blue-400" />
                </div>
                <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200">Drop files or click to browse</p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="relative group aspect-square bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                      <button 
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-all z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      
                      {f.previewUrl ? (
                        <img src={f.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
           </div>

           {/* Right: Text/URL */}
           <div className="flex flex-col">
              <div className="relative flex-1">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste Civitai links, Instagram posts, or prompt text here..."
                  className="w-full h-full min-h-[160px] bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-sm text-zinc-300 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none resize-none transition-all placeholder:text-zinc-600"
                />
                <div className="absolute top-4 right-4 pointer-events-none">
                  <Link2 className="w-4 h-4 text-zinc-700" />
                </div>
              </div>
           </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleStart}
            disabled={isProcessing || (files.length === 0 && textInput.trim().length === 0)}
            className={`
              px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg
              ${isProcessing || (files.length === 0 && textInput.trim().length === 0)
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                : 'bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-105 shadow-blue-500/10'}
            `}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">Processing...</span>
            ) : (
              <>
                Extract Prompts
                <Upload className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;