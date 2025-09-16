import React, { useState, useEffect } from 'react';
import DataPage, { DataPageConfig } from '../components/DataPage';
import { ExternalLink, Copy, Settings, Zap, Image, Database, Cpu, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FavoriteButton } from '../components/ui/FavoriteButton';
import { useToast } from '../utils/useToast';

interface CheckpointModel {
  id: number;
  name: string;
  type: string;
  sampler: string;
  scheduler?: string;
  steps: string;
  cfg_scale: string;
  recommended_vae: string;
  negative_prompts: string;
  prompting_suggestions: string;
  civitai_url: string;
  resources?: string;
  created_at: string;
  updated_at: string;
}

export default function CheckpointModels() {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard`,
    });
  };

  const config: DataPageConfig<CheckpointModel> = {
    title: "Model Checkpoints",
    apiEndpoint: "/api/checkpoint-models",
    favoriteItemType: "checkpoint_models",
    defaultViewMode: "minicard",
    enabledViewModes: ["spreadsheet", "minicard", "largecards", "listview"],

    // Spreadsheet configuration
    spreadsheetConfig: {
      title: "Model Checkpoints",
      apiEndpoint: "/api/checkpoint-models",
      headers: ["name", "type", "sampler", "steps", "cfg_scale", "recommended_vae", "negative_prompts", "prompting_suggestions"],
      defaultItem: {
        name: "",
        type: "",
        sampler: "",
        scheduler: "",
        steps: "",
        cfg_scale: "",
        recommended_vae: "",
        negative_prompts: "",
        prompting_suggestions: "",
        civitai_url: "",
        resources: ""
      },
      favoriteItemType: "checkpoint_models",
      renderCell: (item, field, isEditMode, onChange) => {
        if (!isEditMode) {
          return (
            <div className="p-0.5">
              {item[field as keyof CheckpointModel]?.toString() || ""}
            </div>
          );
        }

        return (
          <input
            type="text"
            value={item[field as keyof CheckpointModel]?.toString() || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-background border-none p-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        );
      },
      validateItem: (item) => {
        if (!item.name) {
          return "Name is required";
        }
        return null;
      }
    },

    // MiniCard configuration
    miniCardConfig: {
      title: "Model Checkpoints",
      apiEndpoint: "/api/checkpoint-models",
      favoriteItemType: "checkpoint_models",
      searchFields: ["name", "type", "sampler", "prompting_suggestions"],
      categoryField: "type",
      alphabetField: "name",
      renderCard: (model) => {
        const getModelCategory = (type: string) => {
          if (type?.includes('SDXL')) return 'SDXL';
          if (type?.includes('SD 1.5')) return 'SD 1.5';
          if (type?.includes('Merge')) return 'Merge';
          if (type?.includes('Finetune')) return 'Finetune';
          return 'Other';
        };

        const category = getModelCategory(model.type);

        return {
          id: model.id,
          title: model.name || "Untitled Model",
          description: model.prompting_suggestions || "No prompting suggestions available",
          categories: [category],
          tags: [model.sampler, `${model.steps} steps`, `CFG ${model.cfg_scale}`].filter(Boolean),
          era: model.type || null,
          colorClass: category === 'SDXL' ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" :
                     category === 'SD 1.5' ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20" :
                     "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
          expandedContent: () => (
            <div className="space-y-4">
              {/* Technical Specifications */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Technical Specifications
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Sampler</span>
                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {model.sampler}
                    </Badge>
                  </div>

                  {model.scheduler && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-400">Scheduler</span>
                      <Badge variant="outline" className="text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                        {model.scheduler}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Steps</span>
                    <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      {model.steps}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">CFG Scale</span>
                    <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {model.cfg_scale}
                    </Badge>
                  </div>
                </div>

                {model.recommended_vae && (
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Recommended VAE</span>
                    <p className="text-gray-300 text-sm">{model.recommended_vae}</p>
                  </div>
                )}
              </div>

              {/* Negative Prompts */}
              {model.negative_prompts && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Negative Prompts
                  </h4>
                  <div className="relative">
                    <p className="text-gray-400 text-sm bg-gray-800/50 rounded p-2 pr-10">
                      {model.negative_prompts}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(model.negative_prompts, "Negative prompts")}
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Prompting Suggestions */}
              {model.prompting_suggestions && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Prompting Suggestions
                  </h4>
                  <p className="text-gray-400 text-sm bg-gray-800/50 rounded p-2">
                    {model.prompting_suggestions}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-800">
                {model.civitai_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(model.civitai_url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Civitai
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(model.name, "Model name")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Name
                </Button>
              </div>
            </div>
          )
        };
      }
    },

    // LargeCard configuration
    largeCardConfig: {
      title: "Model Checkpoints",
      apiEndpoint: "/api/checkpoint-models",
      favoriteItemType: "checkpoint_models",
      searchFields: ["name", "type", "sampler", "steps", "cfg_scale", "recommended_vae", "negative_prompts", "prompting_suggestions"],
      categoryField: "type",
      alphabetField: "name",
      renderLargeCard: (model) => ({
        id: model.id,
        title: model.name || "Untitled Model",
        description: model.prompting_suggestions || "No description available",
        categories: model.type ? [model.type] : null,
        tags: [model.sampler, `${model.steps} steps`, `CFG ${model.cfg_scale}`].filter(Boolean),
        era: model.recommended_vae || null,
        colorClass: "bg-gradient-to-br from-purple-500/20 to-blue-500/20",
        icon: <Cpu className="h-5 w-5" />,
        metadata: {
          "Type": model.type || "Unknown",
          "Sampler": model.sampler || "Not specified",
          "Steps": model.steps ? `${model.steps}` : "Not specified",
          "CFG Scale": model.cfg_scale ? `${model.cfg_scale}` : "Not specified",
          "Recommended VAE": model.recommended_vae || "None specified"
        },
        actions: (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        ),
        content: (
          <div className="space-y-3">
            {model.negative_prompts && (
              <div>
                <span className="text-xs text-gray-400">Negative Prompts:</span>
                <p className="text-xs text-gray-300 bg-gray-800/50 rounded p-2 mt-1">
                  {model.negative_prompts.length > 100 ? 
                    `${model.negative_prompts.substring(0, 100)}...` : 
                    model.negative_prompts
                  }
                </p>
              </div>
            )}
          </div>
        )
      })
    },

    // ListView configuration
    listViewConfig: {
      title: "Model Checkpoints",
      apiEndpoint: "/api/checkpoint-models",
      favoriteItemType: "checkpoint_models",
      searchFields: ["name", "type", "sampler", "steps", "cfg_scale", "recommended_vae", "negative_prompts", "prompting_suggestions"],
      categoryField: "type",
      alphabetField: "name",
      renderListItem: (model) => ({
        id: model.id,
        title: model.name || "Untitled Model",
        description: model.prompting_suggestions || "No description available",
        categories: model.type ? [model.type] : null,
        tags: [model.sampler, `${model.steps} steps`, `CFG ${model.cfg_scale}`].filter(Boolean),
        era: model.recommended_vae || null,
        metadata: {
          "Type": model.type || "Unknown",
          "Sampler": model.sampler || "Not specified",
          "Steps": model.steps ? `${model.steps}` : "Not specified",
          "CFG Scale": model.cfg_scale ? `${model.cfg_scale}` : "Not specified",
          "VAE": model.recommended_vae || "None specified",
          "Negative Prompts": model.negative_prompts || "None specified",
          "Prompting Tips": model.prompting_suggestions || "None provided"
        },
        actions: (
          <div className="flex gap-2">
            <FavoriteButton
              itemId={model.id}
              itemType="checkpoint_models"
              size="sm"
            />
            {model.civitai_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(model.civitai_url, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Civitai
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(model.name, "Model name")}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        )
      })
    }
  };

  return (
    <div className="min-h-screen p-4">
      <DataPage config={config} />
    </div>
  );
}