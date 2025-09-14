import React from "react";
import { Database } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { AIGenerationMetadata } from "@/types/image";
import ModelParametersDisplay from "./ModelParametersDisplay";
import MidjourneyParametersDisplay from "./MidjourneyParametersDisplay";

interface GenerationParametersDisplayProps {
  metadata: AIGenerationMetadata;
}

/**
 * Component to display all AI generation parameters
 */
export function GenerationParametersDisplay({ metadata }: GenerationParametersDisplayProps) {
  if (!metadata || metadata.source === 'unknown') return null;
  
  // Debug log for metadata structure
  console.log("Generation metadata:", metadata);
  
  return (
    <div className="mt-4">
      <div className="mb-3 pb-2 border-b border-gray-800">
        <h3 className="text-md font-medium flex items-center">
          <Database className="mr-2 h-4 w-4 text-blue-400" />
          Generation Parameters
        </h3>
      </div>
      
      {/* Prompt Section */}
      {metadata.prompt && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Prompt:</h4>
          <div className="bg-gray-800/50 rounded-md p-3 relative max-h-32 overflow-auto">
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              {metadata.prompt}
            </div>
            <div className="absolute top-2 right-2">
              <CopyButton 
                textToCopy={metadata.prompt} 
                size="sm"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Negative Prompt Section */}
      {metadata.negativePrompt && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Negative Prompt:</h4>
          <div className="bg-gray-800/50 rounded-md p-3 relative max-h-28 overflow-auto">
            <div className="text-sm text-gray-300 whitespace-pre-wrap">
              {metadata.negativePrompt}
            </div>
            <div className="absolute top-2 right-2">
              <CopyButton 
                textToCopy={metadata.negativePrompt} 
                size="sm"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Formatted Generation Parameters from server (if available) */}
      {metadata.formattedMetadata?.generationParams && metadata.formattedMetadata.generationParams.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {metadata.formattedMetadata.generationParams.map((param, idx) => (
            <div key={idx} className="bg-gray-800/30 p-2 rounded-md">
              <span className="text-gray-400">{param.title}:</span>
              <span className="ml-2 text-gray-100">{param.value.toString()}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Conditional display based on source */}
      {metadata.source === 'midjourney' ? (
        <MidjourneyParametersDisplay metadata={metadata} />
      ) : (
        <ModelParametersDisplay metadata={metadata} />
      )}
      
      {/* Raw parameters text - show if available for any source */}
      {metadata.fullParametersText && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Full Parameters:</h4>
          <div className="bg-gray-800/50 rounded-md p-3 relative max-h-32 overflow-auto">
            <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
              {metadata.fullParametersText}
            </div>
            <div className="absolute top-2 right-2">
              <CopyButton 
                textToCopy={metadata.fullParametersText} 
                size="sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerationParametersDisplay;