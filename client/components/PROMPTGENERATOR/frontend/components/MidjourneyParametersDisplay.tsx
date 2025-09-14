import React from "react";
import { AIGenerationMetadata } from "@/types/image";

interface MidjourneyParametersDisplayProps {
  metadata: AIGenerationMetadata;
}

/**
 * Component to display Midjourney-specific parameters
 */
export function MidjourneyParametersDisplay({ metadata }: MidjourneyParametersDisplayProps) {
  // Debug log to see what we're working with
  console.log("Midjourney display params:", metadata);
  
  // Check if rawParameters exists
  const hasRawParams = metadata.rawParameters && Object.keys(metadata.rawParameters).length > 0;
  
  // Group Midjourney specific parameters
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {/* Standard MJ Parameters */}
      {metadata.version && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Version:</span>
          <span className="ml-2 text-gray-100">{metadata.version}</span>
        </div>
      )}
      
      {metadata.model && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Model:</span>
          <span className="ml-2 text-gray-100">{metadata.model}</span>
        </div>
      )}
      
      {/* Fallback if rawParameters doesn't exist or is empty */}
      {!hasRawParams && metadata.source === 'midjourney' && (
        <div className="bg-gray-800/30 p-2 rounded-md col-span-2">
          <span className="text-gray-400">Midjourney Image</span>
          <span className="ml-2 text-gray-100">Parameters not extracted</span>
        </div>
      )}
      
      {/* MJ V6 Parameters - Check if they exist first */}
      {hasRawParams && metadata.rawParameters?.style && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Style:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.style}</span>
        </div>
      )}
      
      {hasRawParams && metadata.rawParameters?.stylize && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Stylize:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.stylize}</span>
        </div>
      )}
      
      {hasRawParams && metadata.rawParameters?.chaos && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Chaos:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.chaos}</span>
        </div>
      )}
      
      {hasRawParams && metadata.rawParameters?.weird && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Weird:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.weird}</span>
        </div>
      )}
      
      {/* Quality parameters */}
      {hasRawParams && metadata.rawParameters?.quality && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Quality:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.quality}</span>
        </div>
      )}
      
      {hasRawParams && metadata.rawParameters?.hd && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">HD:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.hd}</span>
        </div>
      )}
      
      {/* Seed information */}
      {metadata.seed && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Seed:</span>
          <span className="ml-2 text-gray-100">{metadata.seed}</span>
        </div>
      )}
      
      {/* Aspect ratio and dimensions */}
      {hasRawParams && metadata.rawParameters?.ar && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Aspect Ratio:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.ar}</span>
        </div>
      )}
      
      {/* Other parameters */}
      {hasRawParams && metadata.rawParameters?.niji && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Niji:</span>
          <span className="ml-2 text-gray-100">Yes</span>
        </div>
      )}
      
      {hasRawParams && metadata.rawParameters?.tile && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Tile:</span>
          <span className="ml-2 text-gray-100">Yes</span>
        </div>
      )}
      
      {hasRawParams && metadata.rawParameters?.stop && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Stop:</span>
          <span className="ml-2 text-gray-100">{metadata.rawParameters.stop}</span>
        </div>
      )}
      
      {/* Job ID if present */}
      {hasRawParams && metadata.rawParameters?.jobId && (
        <div className="bg-gray-800/30 p-2 rounded-md col-span-2">
          <span className="text-gray-400">Job ID:</span>
          <span className="ml-2 text-gray-100 font-mono text-xs">{metadata.rawParameters.jobId}</span>
        </div>
      )}
      
      {/* Display any other raw parameters that might be useful */}
      {hasRawParams && (
        Object.entries(metadata.rawParameters)
          .filter(([key]) => !['style', 'stylize', 'chaos', 'weird', 'quality', 'hd', 'ar', 'niji', 'tile', 'stop', 'jobId'].includes(key))
          .map(([key, value]) => (
            <div key={key} className="bg-gray-800/30 p-2 rounded-md">
              <span className="text-gray-400">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
              <span className="ml-2 text-gray-100">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
            </div>
          ))
      )}
    </div>
  );
}

export default MidjourneyParametersDisplay;