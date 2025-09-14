import React from "react";
import { Badge } from "@/components/ui/badge";
import { AIGenerationMetadata } from "@/types/image";
import GenerationParametersDisplay from "./GenerationParametersDisplay";

interface ImageMetadataDisplayProps {
  metadata: any; // The image metadata from analysis result
  file?: File | null; // Optional file for additional display
}

/**
 * Component to display image metadata including file information and generation parameters
 */
export function ImageMetadataDisplay({ metadata, file }: ImageMetadataDisplayProps) {
  if (!metadata || !metadata.imageGeneration) return null;
  
  const imageGeneration = metadata.imageGeneration;
  
  // Log the metadata for debugging
  console.log("Image metadata:", metadata);
  
  // Helper function to calculate aspect ratio in simplest form (like 4:5, 16:9)
  const calculateAspectRatio = (width: number, height: number): string => {
    if (!width || !height) return '';
    
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    
    const divisor = gcd(width, height);
    return `${width/divisor}:${height/divisor}`;
  };
  
  return (
    <div className="rounded-md border border-gray-700 bg-gray-950/80 p-4 overflow-y-auto h-full max-h-[600px]">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
        <h3 className="text-md font-medium">File Information</h3>
        {imageGeneration.source !== 'unknown' && (
          <Badge className="ml-2 bg-blue-900/50" variant="secondary">
            {imageGeneration.source?.toUpperCase()}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Dimensions</span>
          <span className="text-gray-200">
            {imageGeneration.width || ''} x {imageGeneration.height || ''}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">File size</span>
          <span className="text-gray-200">{file?.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Format</span>
          <span className="text-gray-200">{file?.type ? file.type.split('/')[1]?.toUpperCase() || '' : imageGeneration.format || ''}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Uploaded</span>
          <span className="text-gray-200">{new Date().toLocaleDateString()}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Aspect Ratio</span>
          <span className="text-gray-200">
            {imageGeneration.width && imageGeneration.height ? 
              `${calculateAspectRatio(imageGeneration.width, imageGeneration.height)}` : ''}
          </span>
        </div>
      </div>

      {/* Technical Details Section */}
      <div className="mt-4">
        <div className="mb-3 pb-2 border-b border-gray-800">
          <h3 className="text-md font-medium">Technical Details</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {imageGeneration.format && (
            <div className="flex justify-between bg-gray-900/40 p-2 rounded-md">
              <span className="text-gray-400">Format Details</span>
              <span className="text-gray-200">{imageGeneration.format}</span>
            </div>
          )}
          
          {imageGeneration.colorSpace && (
            <div className="flex justify-between bg-gray-900/40 p-2 rounded-md">
              <span className="text-gray-400">Color Space</span>
              <span className="text-gray-200">{imageGeneration.colorSpace}</span>
            </div>
          )}
          
          {imageGeneration.colorDepth && (
            <div className="flex justify-between bg-gray-900/40 p-2 rounded-md">
              <span className="text-gray-400">Color Depth</span>
              <span className="text-gray-200">{imageGeneration.colorDepth}</span>
            </div>
          )}
          
          {imageGeneration.dpi && (
            <div className="flex justify-between bg-gray-900/40 p-2 rounded-md">
              <span className="text-gray-400">Resolution</span>
              <span className="text-gray-200">{imageGeneration.dpi} DPI</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Generation Parameters Section */}
      {imageGeneration.source !== 'unknown' && (
        <GenerationParametersDisplay metadata={imageGeneration as AIGenerationMetadata} />
      )}
    </div>
  );
}

export default ImageMetadataDisplay;