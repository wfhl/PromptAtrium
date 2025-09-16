import React from "react";
import { AIGenerationMetadata } from "@/types/image";

interface ModelParametersDisplayProps {
  metadata: AIGenerationMetadata;
}

/**
 * Component to display model parameters for AI-generated images
 */
export function ModelParametersDisplay({ metadata }: ModelParametersDisplayProps) {
  // Log parameters for debugging
  console.log("Model parameters display:", metadata);
  
  // For Stable Diffusion and ComfyUI
  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {metadata.steps !== undefined && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Steps:</span>
          <span className="ml-2 text-gray-100">{metadata.steps}</span>
        </div>
      )}
      
      {metadata.sampler && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Sampler:</span>
          <span className="ml-2 text-gray-100">{metadata.sampler}</span>
        </div>
      )}
      
      {metadata.cfgScale !== undefined && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">CFG Scale:</span>
          <span className="ml-2 text-gray-100">{metadata.cfgScale}</span>
        </div>
      )}
      
      {metadata.seed !== undefined && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Seed:</span>
          <span className="ml-2 text-gray-100">{metadata.seed}</span>
        </div>
      )}
      
      {metadata.model && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Model:</span>
          <span className="ml-2 text-gray-100">{metadata.model}</span>
        </div>
      )}
      
      {metadata.checkpoint && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Checkpoint:</span>
          <span className="ml-2 text-gray-100">{metadata.checkpoint}</span>
        </div>
      )}
      
      {metadata.sdxlCheckpoint && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">SDXL Checkpoint:</span>
          <span className="ml-2 text-gray-100">{metadata.sdxlCheckpoint}</span>
        </div>
      )}
      
      {metadata.scheduler && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Scheduler:</span>
          <span className="ml-2 text-gray-100">{metadata.scheduler}</span>
        </div>
      )}
      
      {metadata.vae && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">VAE:</span>
          <span className="ml-2 text-gray-100">{metadata.vae}</span>
        </div>
      )}
      
      {/* UNet model */}
      {metadata.unet && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">UNet:</span>
          <span className="ml-2 text-gray-100">{metadata.unet}</span>
        </div>
      )}
      
      {/* Detailer model */}
      {metadata.detailerModel && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Detailer Model:</span>
          <span className="ml-2 text-gray-100">{metadata.detailerModel}</span>
        </div>
      )}
      
      {/* Upres model */}
      {metadata.upresModel && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Upres Model:</span>
          <span className="ml-2 text-gray-100">{metadata.upresModel}</span>
        </div>
      )}
      
      {/* Upres checkpoint */}
      {metadata.upresCheckpoint && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Upres Checkpoint:</span>
          <span className="ml-2 text-gray-100">{metadata.upresCheckpoint}</span>
        </div>
      )}
      
      {metadata.clipSkip !== undefined && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Clip Skip:</span>
          <span className="ml-2 text-gray-100">{metadata.clipSkip}</span>
        </div>
      )}
      
      {metadata.denoiseStrength !== undefined && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Denoise Strength:</span>
          <span className="ml-2 text-gray-100">{metadata.denoiseStrength}</span>
        </div>
      )}
      
      {/* Hires fix parameters */}
      {metadata.hiresUpscale && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Hires Upscale:</span>
          <span className="ml-2 text-gray-100">{metadata.hiresUpscale}x</span>
        </div>
      )}
      
      {metadata.hiresSteps !== undefined && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Hires Steps:</span>
          <span className="ml-2 text-gray-100">{metadata.hiresSteps}</span>
        </div>
      )}
      
      {metadata.hiresUpscaler && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Hires Upscaler:</span>
          <span className="ml-2 text-gray-100">{metadata.hiresUpscaler}</span>
        </div>
      )}
      
      {metadata.hiresCfgScale !== undefined && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Hires CFG Scale:</span>
          <span className="ml-2 text-gray-100">{metadata.hiresCfgScale}</span>
        </div>
      )}
      
      {/* ControlNet */}
      {metadata.controlNetModel && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">ControlNet Model:</span>
          <span className="ml-2 text-gray-100">{metadata.controlNetModel}</span>
        </div>
      )}
      
      {/* Schedule parameters */}
      {metadata.scheduleType && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Schedule Type:</span>
          <span className="ml-2 text-gray-100">{metadata.scheduleType}</span>
        </div>
      )}
      
      {metadata.version && (
        <div className="bg-gray-800/30 p-2 rounded-md">
          <span className="text-gray-400">Version:</span>
          <span className="ml-2 text-gray-100">{metadata.version}</span>
        </div>
      )}
    </div>
  );
}

export default ModelParametersDisplay;