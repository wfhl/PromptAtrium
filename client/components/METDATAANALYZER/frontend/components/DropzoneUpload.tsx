import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DropzoneUploadProps {
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  selectedFile?: File | null;
  isAnalyzing?: boolean;
}

export function DropzoneUpload({ 
  onFileSelect, 
  onClear, 
  selectedFile, 
  isAnalyzing = false 
}: DropzoneUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    setDragActive(false);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff']
    },
    multiple: false,
    disabled: isAnalyzing,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {selectedFile ? (
        // Selected file display
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <FileImage className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
            </div>
            {onClear && !isAnalyzing && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Image preview */}
          <div className="mt-4 flex justify-center">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="max-h-48 max-w-full rounded-lg shadow-sm border"
              onLoad={(e) => {
                // Clean up object URL after image loads
                setTimeout(() => URL.revokeObjectURL((e.target as HTMLImageElement).src), 100);
              }}
            />
          </div>

          {isAnalyzing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Analyzing metadata...
              </div>
            </div>
          )}
        </div>
      ) : (
        // Dropzone
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive || dragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              p-4 rounded-full 
              ${isDragActive || dragActive 
                ? 'bg-blue-100 dark:bg-blue-800' 
                : 'bg-gray-100 dark:bg-gray-700'
              }
            `}>
              <Upload className={`
                h-8 w-8 
                ${isDragActive || dragActive 
                  ? 'text-blue-500' 
                  : 'text-gray-500 dark:text-gray-400'
                }
              `} />
            </div>
            
            <div>
              <p className={`
                text-lg font-medium
                ${isDragActive || dragActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-900 dark:text-gray-100'
                }
              `}>
                {isDragActive ? 'Drop your image here' : 'Drag & drop an image here'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                or click to browse files
              </p>
            </div>
            
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Supports: PNG, JPG, JPEG, GIF, WebP, BMP, TIFF
            </div>
          </div>
        </div>
      )}
    </div>
  );
}