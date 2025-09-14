import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CopyButton from "@/components/CopyButton";
import { cn } from "@/lib/utils";
import { useAdminMode } from "@/context/AdminModeContext";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { ClearButton } from "@/components/ui/ClearButton";
import CompactCharacterSaveDialog from "@/components/ui/CompactCharacterSaveDialog";
import AspectRatioCalculator from "@/components/prompt-builder/components/AspectRatioCalculator";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ShareToLibraryModal } from "@/components/ui/ShareToLibraryModal";
import { BorderBeam } from "@/components/ui/border-beam";
import AnimatedCard from "@/components/ui/dynamic-border-animations-card";

// Icons import
import {
  Heart,
  HeartOff,
  Trash2,
  Plus,
  ChevronDown,
  Sparkles,
  ShieldX,
  Zap,
  PenTool,
  Dice6 as Dices,
  FileText,
  Code,
  BrainCircuit,
  MessageSquare,
  BookOpen,
  Puzzle,
  Settings,
  RotateCcw,
  Download,
  Upload,
  Star,
  Edit,
  Info,
  Palette,
  MoreHorizontal,
  LayoutGrid,
  Copy as CopyIcon,
  Bookmark,
  User,
  MapPin,
  Shirt,
  Layers,
  Eye as EyeIcon,
  RefreshCw,
  Save,
  Camera,
  Film,
  Brush,
  Crown,
  UserCircle,
  Share
} from "lucide-react";

// Import data and generator
import elitePromptGenerator, { ElitePromptOptions, GeneratedPrompt, SavedPreset, CharacterPreset } from "./ElitePromptGenerator";
// Import detailed options components
import { NestedDetailedOptionsSection, CategoryOption } from "./components/NestedDetailedOptionsDropdown";
import { DETAILED_OPTIONS_CATEGORIES } from "@/data/detailedOptionsData";
// Import our new TemplateProcessor component
import { TemplateProcessor } from "@/components/prompt-builder/TemplateProcessor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Import database hooks
import { 
  useCharacterPresets, 
  useGlobalPresets, 
  useCreateCharacterPreset, 
  useCreateGlobalPreset,
  useDeleteCharacterPreset,
  useDeleteGlobalPreset,
  useToggleCharacterPresetFavorite,
  useToggleGlobalPresetFavorite,
  useSetCharacterPresetDefault,
  useSetGlobalPresetDefault,
  transformCharacterDataToDatabase,
  transformGlobalDataToDatabase
} from "@/hooks/use-presets";

// API function to fetch prompt components by category
async function fetchPromptComponentsByCategory(category: string) {
  try {
    const response = await fetch(`/api/system-data/prompt-components/category/${category}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${category} options`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${category} components:`, error);
    return [];
  }
}

// This will be replaced with dynamic data from the API
// Keeping as fallback in case API fails
import {
  FEMALE_BODY_TYPES,
  MALE_BODY_TYPES,
  ROLES,
  HAIRSTYLES,
  HAIR_COLORS,
  EYE_COLORS,
  MAKEUP_OPTIONS,
  SKIN_TONES,
  FEMALE_CLOTHING,
  MALE_CLOTHING,
  PLACE,
  LIGHTING,
  COMPOSITION,
  BACKGROUND
} from "@/data/fluxPromptData";

// Helper function to convert array of strings to dropdown options
function convertToOptions(items: string[]): { value: string, label: string }[] {
  // Add "None" and "Custom Entry" options at the beginning, then convert items
  const options = [
    { value: '', label: 'None' },
    { value: '__custom__', label: 'Custom Entry' }
  ];
  return options.concat(items.map(item => ({ value: item, label: item })));
}

// Custom dropdown component
function Dropdown({ 
  label, 
  options, 
  value, 
  onChange,
  placeholder = "Select option",
  isMultiSelect = false
}: { 
  label?: string, 
  options: { value: string, label: string }[], 
  value: string, 
  onChange: (value: string) => void,
  placeholder?: string,
  isMultiSelect?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const selectedOption = options.find(option => option.value === value);
  
  // Check if current value is a custom value (not in options and not empty)
  const isValueCustom = value && !selectedOption && value !== '__custom__';
  
  // Display logic: if no value or value is empty, show placeholder; otherwise show selected option or custom value
  const displayText = (!value || value === "") 
    ? placeholder 
    : isValueCustom 
      ? `Custom: ${value}`
      : (selectedOption?.label || placeholder);

  return (
    <div className="relative w-full">
      {label && <div className="text-sm text-gray-400 mb-1">{label}</div>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between glass-input rounded-md px-3 py-2.5 text-sm text-white hover:bg-purple-600/20 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-700"
        >
          <span className="truncate pr-6">{displayText}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
        {/* Clear button positioned absolutely to avoid nesting */}
        {value && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2 z-10">
            <ClearButton
              onClick={() => {
                onChange(''); // Clear the selection
              }}
              className="opacity-70 hover:opacity-100 bg-gray-900"
              size="sm"
              title={`Clear ${label || 'selection'}`}
            />
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 bg-gradient-to-br from-purple-900/30 to-blue-900/10 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto scrollbar-hide">
          <div className="py-1">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  if (option.value === '__custom__') {
                    setIsCustomMode(true);
                    setCustomValue('');
                    setIsOpen(false);
                  } else {
                    setIsCustomMode(false);
                    onChange(option.value);
                    if (!isMultiSelect) setIsOpen(false);
                  }
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-black",
                  (option.value === value || (option.value === '__custom__' && isValueCustom)) ? "bg-purple-700 text-white" : "text-gray-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Custom input field */}
      {isCustomMode && (
        <div className="mt-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onChange(customValue.trim());
                setIsCustomMode(false);
                setCustomValue('');
              } else if (e.key === 'Escape') {
                setIsCustomMode(false);
                setCustomValue('');
              }
            }}
            onBlur={() => {
              if (customValue.trim()) {
                onChange(customValue.trim());
              }
              setIsCustomMode(false);
              setCustomValue('');
            }}
            placeholder={`Enter custom ${label?.toLowerCase() || 'value'}...`}
            className="w-full bg-gray-900 bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-700"
            autoFocus
          />
          <div className="text-xs text-gray-500 mt-1">
            Press Enter to save, Escape to cancel
          </div>
        </div>
      )}
    </div>
  );
}

// SmartDropdown component that renders either Dropdown or MultiSelectDropdown based on mode
function SmartDropdown({
  isMultiSelectMode,
  label,
  options,
  value,
  onChange,
  placeholder = "Select option"
}: {
  isMultiSelectMode: boolean,
  label?: string,
  options: { value: string, label: string }[],
  value: string | string[],
  onChange: (value: string | string[]) => void,
  placeholder?: string
}) {
  // For multi-select mode, handle values as arrays
  if (isMultiSelectMode) {
    // Convert single string value to array if needed
    const values = Array.isArray(value) ? value : value ? [value] : [];
    
    // Handle changes from multi-select
    const handleMultiSelectChange = (newValues: string[]) => {
      onChange(newValues);
    };
    
    return (
      <MultiSelectDropdown
        label={label}
        options={options}
        values={values}
        onChange={handleMultiSelectChange}
        placeholder={placeholder}
      />
    );
  }
  
  // For regular mode, handle values as strings
  const handleSingleSelectChange = (newValue: string) => {
    onChange(newValue);
  };
  
  return (
    <Dropdown
      label={label}
      options={options}
      value={Array.isArray(value) ? (value[0] || '') : value}
      onChange={handleSingleSelectChange}
      placeholder={placeholder}
    />
  );
}

// Multi-select dropdown component
function MultiSelectDropdown({ 
  label, 
  options, 
  values = [], 
  onChange,
  placeholder = "Select options"
}: { 
  label?: string, 
  options: { value: string, label: string }[], 
  values: string[], 
  onChange: (values: string[]) => void,
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Create a lookup set for faster checking if a value is selected
  const selectedValues = new Set(values);
  
  // Handle selection of an option
  const handleSelect = (value: string) => {
    const newValues = [...values];
    
    if (selectedValues.has(value)) {
      // Remove the value if already selected
      const index = newValues.indexOf(value);
      if (index > -1) newValues.splice(index, 1);
    } else {
      // Add the value if not already selected
      newValues.push(value);
    }
    
    onChange(newValues);
  };
  
  // Handle removing a tag/pill
  const handleRemoveTag = (valueToRemove: string) => {
    onChange(values.filter(v => v !== valueToRemove));
  };
  
  // Get display labels for selected values
  const selectedLabels = values.map(value => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  });
  
  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.dropdown-container')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full dropdown-container">
      {label && <div className="text-sm text-gray-400 mb-1">{label}</div>}
      
      {/* Selected options display as pills */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {values.map((value) => {
            const option = options.find(opt => opt.value === value);
            return (
              <div key={value} className="flex items-center bg-purple-900/50 text-white text-xs px-2 py-1 rounded-full">
                {option?.label || value}
                <button 
                  type="button" 
                  className="ml-1 text-white/70 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(value);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-900 bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-gray-700 rounded-md px-3 py-2 text-sm text-white hover:from-purple-600/20 hover:to-blue-600/20 focus:outline-none focus:ring-1 focus:ring-purple-700"
      >
        <span className="truncate">
          {values.length > 0 ? `${values.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>
      
      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 bg-gradient-to-br from-purple-900/30 to-blue-900/10 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto scrollbar-hide">
          <div className="py-1">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-black flex items-center justify-between",
                  selectedValues.has(option.value) ? "bg-purple-700/25 text-white" : "text-gray-300"
                )}
              >
                <span>{option.label}</span>
                {selectedValues.has(option.value) && <div className="text-purple-400">✓</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewPromptGeneratorUI() {
  // Interface states
  const [activeTab, setActiveTab] = useState<"character" | "scene" | "style" | "additional">("character");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Preset tracking states
  const [currentGlobalPreset, setCurrentGlobalPreset] = useState<number | null>(null);
  const [currentCharacterPreset, setCurrentCharacterPreset] = useState<number | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [livePrompt, setLivePrompt] = useState<string>("");
  const [sparklePopoverOpen, setSparklePopoverOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [currentSaveResult, setCurrentSaveResult] = useState<any>(null);
  const [jsonPromptData, setJsonPromptData] = useState<{[key: string]: string[]} | null>(null);
  
  // Unified top nav tab state - single selection across all groups
  const [selectedTopButton, setSelectedTopButton] = useState<string>("standard");
  
  // Query client for invalidation
  const queryClient = useQueryClient();
  
  // Collapsible section states
  const [isGenerationControlsOpen, setIsGenerationControlsOpen] = useState<boolean>(false);
  const [isModelInformationOpen, setIsModelInformationOpen] = useState<boolean>(false);
  const [isPromptSettingsOpen, setIsPromptSettingsOpen] = useState<boolean>(true);
  
  // Character save dialog state
  const [characterSaveDialogOpen, setCharacterSaveDialogOpen] = useState(false);
  const [currentCharacterDescription, setCurrentCharacterDescription] = useState("");
  
  // Preset collapsible states
  const [isGlobalPresetsOpen, setIsGlobalPresetsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('globalPresetsOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isCharacterPresetsOpen, setIsCharacterPresetsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('characterPresetsOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isRuleTemplatesRegularOpen, setIsRuleTemplatesRegularOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('ruleTemplatesRegularOpen');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [isAllTemplatesOpen, setIsAllTemplatesOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('allTemplatesOpen');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Presets states
  const [presetFilter, setPresetFilter] = useState<"all" | "favorites">("all");
  const [characterPresetFilter, setCharacterPresetFilter] = useState<"all" | "favorites">("all");
  
  // Rule templates drag and drop state
  const [templateOrder, setTemplateOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('templateOrder');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoritesOrder, setFavoritesOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoritesOrder');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default' as 'default' | 'destructive',
    confirmText: 'Confirm'
  });

  // Template processor state
  const [selectedTemplates, setSelectedTemplates] = useState<any[]>([]);
  
  // Template favorites state
  const [templateFavorites, setTemplateFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('templateFavorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Fetch Rule Templates from database
  const { data: ruleTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/system-data/prompt-templates'],
    queryFn: async () => {
      const response = await fetch('/api/system-data/prompt-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Fetch prompt categories for ShareToLibraryModal
  const { data: promptCategories = [] } = useQuery({
    queryKey: ['/prompt-library/categories'],
    queryFn: async () => {
      const response = await fetch('/prompt-library/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  // Save to library mutation
  const saveToUserLibraryMutation = useMutation({
    mutationFn: (promptData: any) => apiRequest('/api/saved-prompts', 'POST', promptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-prompts'] });
      setShareModalOpen(false);
      toast({
        title: "Prompt saved",
        description: "Added to your personal library",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Could not save prompt to library",
        variant: "destructive",
      });
    }
  });

  // Save collapsible states to localStorage
  useEffect(() => {
    localStorage.setItem('globalPresetsOpen', isGlobalPresetsOpen.toString());
  }, [isGlobalPresetsOpen]);

  useEffect(() => {
    localStorage.setItem('characterPresetsOpen', isCharacterPresetsOpen.toString());
  }, [isCharacterPresetsOpen]);

  useEffect(() => {
    localStorage.setItem('ruleTemplatesRegularOpen', isRuleTemplatesRegularOpen.toString());
  }, [isRuleTemplatesRegularOpen]);

  useEffect(() => {
    localStorage.setItem('allTemplatesOpen', isAllTemplatesOpen.toString());
  }, [isAllTemplatesOpen]);

  useEffect(() => {
    localStorage.setItem('templateOrder', JSON.stringify(templateOrder));
  }, [templateOrder]);

  useEffect(() => {
    localStorage.setItem('favoritesOrder', JSON.stringify(favoritesOrder));
  }, [favoritesOrder]);

  useEffect(() => {
    localStorage.setItem('templateFavorites', JSON.stringify(Array.from(templateFavorites)));
  }, [templateFavorites]);

  // Track if we've initialized to prevent overwriting localStorage
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize template orders when rule templates are loaded (only once)
  useEffect(() => {
    if (ruleTemplates.length > 0 && !hasInitialized) {
      // Load saved orders from localStorage
      const savedTemplateOrder = localStorage.getItem('templateOrder');
      const savedFavoritesOrder = localStorage.getItem('favoritesOrder');
      const savedTemplateFavorites = localStorage.getItem('templateFavorites');
      
      // Only set state if we haven't already loaded from localStorage in component initialization
      if (templateOrder.length === 0) {
        if (savedTemplateOrder) {
          const parsedOrder = JSON.parse(savedTemplateOrder);
          setTemplateOrder(parsedOrder);
        } else {
          // Initialize with all template IDs if no saved order
          const allTemplateIds = ruleTemplates.map((t: any) => t.id.toString());
          setTemplateOrder(allTemplateIds);
        }
      }
      
      // Only set favorites if not already set
      if (favoritesOrder.length === 0 && savedFavoritesOrder) {
        const parsedFavoritesOrder = JSON.parse(savedFavoritesOrder);
        setFavoritesOrder(parsedFavoritesOrder);
      }
      
      // Only set favorites set if not already set
      if (templateFavorites.size === 0 && savedTemplateFavorites) {
        const parsedFavorites = new Set(JSON.parse(savedTemplateFavorites));
        setTemplateFavorites(parsedFavorites);
      }
      
      setHasInitialized(true);
    }
  }, [ruleTemplates.length, hasInitialized, templateOrder.length, favoritesOrder.length, templateFavorites.size]);





  // Drag and drop handlers
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const templateId = draggableId;

    // Moving within favorites
    if (source.droppableId === 'favorites' && destination.droppableId === 'favorites') {
      const newFavoritesOrder = Array.from(favoritesOrder);
      newFavoritesOrder.splice(source.index, 1);
      newFavoritesOrder.splice(destination.index, 0, templateId);
      setFavoritesOrder(newFavoritesOrder);
    }
    // Moving within regular templates
    else if (source.droppableId === 'regular' && destination.droppableId === 'regular') {
      const currentRegularTemplates = getOrderedTemplates().regularTemplates;
      const newTemplateOrder = currentRegularTemplates.map(t => t.id.toString());
      newTemplateOrder.splice(source.index, 1);
      newTemplateOrder.splice(destination.index, 0, templateId);
      setTemplateOrder(newTemplateOrder);
    }
    // Moving from regular to favorites
    else if (source.droppableId === 'regular' && destination.droppableId === 'favorites') {
      // Add to favorites set
      const newTemplateFavorites = new Set(templateFavorites);
      newTemplateFavorites.add(templateId);
      setTemplateFavorites(newTemplateFavorites);
      
      // Remove from regular template order
      const newTemplateOrder = templateOrder.filter(id => id !== templateId);
      setTemplateOrder(newTemplateOrder);
      
      // Add to favorites order at the destination index
      const newFavoritesOrder = Array.from(favoritesOrder);
      newFavoritesOrder.splice(destination.index, 0, templateId);
      setFavoritesOrder(newFavoritesOrder);
    }
    // Moving from favorites to regular
    else if (source.droppableId === 'favorites' && destination.droppableId === 'regular') {
      // Remove from favorites set
      const newTemplateFavorites = new Set(templateFavorites);
      newTemplateFavorites.delete(templateId);
      setTemplateFavorites(newTemplateFavorites);
      
      // Remove from favorites order
      const newFavoritesOrder = favoritesOrder.filter(id => id !== templateId);
      setFavoritesOrder(newFavoritesOrder);
      
      // Add to regular templates order at the destination index
      const currentRegularTemplates = getOrderedTemplates().regularTemplates;
      const newTemplateOrder = currentRegularTemplates.map(t => t.id.toString());
      newTemplateOrder.splice(destination.index, 0, templateId);
      setTemplateOrder(newTemplateOrder);
    }
  };

  // Toggle favorite status
  const toggleTemplateFavorite = (templateId: string) => {
    const newTemplateFavorites = new Set(templateFavorites);
    if (templateFavorites.has(templateId)) {
      // Remove from favorites
      newTemplateFavorites.delete(templateId);
      const newFavoritesOrder = favoritesOrder.filter(id => id !== templateId);
      setFavoritesOrder(newFavoritesOrder);
    } else {
      // Add to favorites
      newTemplateFavorites.add(templateId);
      const newFavoritesOrder = [...favoritesOrder, templateId];
      setFavoritesOrder(newFavoritesOrder);
    }
    setTemplateFavorites(newTemplateFavorites);
  };

  // Get ordered templates by category
  const getOrderedTemplates = () => {
    // Create maps for quick lookup
    const templateMap = new Map(ruleTemplates.map((t: any) => [t.id.toString(), t]));
    
    // Get favorites in order (only include existing templates)
    const favoriteTemplates = favoritesOrder
      .map(id => templateMap.get(id))
      .filter((template): template is any => template !== undefined);
    
    // Get all template IDs that are favorites
    const favoriteIds = new Set(favoritesOrder);
    
    // Get regular templates (not in favorites) in their specified order
    const regularTemplates: any[] = [];
    const processedIds = new Set<string>();
    
    // First, add templates from templateOrder that aren't favorites
    templateOrder.forEach(id => {
      if (!favoriteIds.has(id) && templateMap.has(id) && !processedIds.has(id)) {
        const template = templateMap.get(id);
        if (template) {
          regularTemplates.push(template);
          processedIds.add(id);
        }
      }
    });
    
    // Then add any remaining templates that aren't in templateOrder or favorites
    ruleTemplates.forEach((template: any) => {
      const id = template.id.toString();
      if (!favoriteIds.has(id) && !processedIds.has(id)) {
        regularTemplates.push(template);
        processedIds.add(id);
      }
    });
    
    return { favoriteTemplates, regularTemplates };
  };
  
  // Database hooks for presets
  const { data: dbCharacterPresets = [], isLoading: isLoadingCharacter, refetch: refetchCharacterPresets } = useCharacterPresets();
  const { data: dbGlobalPresets = [], isLoading: isLoadingGlobal, refetch: refetchGlobalPresets } = useGlobalPresets();
  const createCharacterPresetMutation = useCreateCharacterPreset();
  const createGlobalPresetMutation = useCreateGlobalPreset();
  const deleteCharacterPresetMutation = useDeleteCharacterPreset();
  const deleteGlobalPresetMutation = useDeleteGlobalPreset();
  const toggleCharacterFavoriteMutation = useToggleCharacterPresetFavorite();
  const toggleGlobalFavoriteMutation = useToggleGlobalPresetFavorite();
  const setCharacterDefaultMutation = useSetCharacterPresetDefault();
  const setGlobalDefaultMutation = useSetGlobalPresetDefault();
  
  // Transform and filter presets for display
  const filteredGlobalPresets = dbGlobalPresets
    .filter(preset => 
      presetFilter === "all" || (presetFilter === "favorites" && preset.is_favorite)
    )
    .sort((a, b) => {
      // Sort favorited presets to the top, then alphabetically within each group
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      // Within the same favorite status, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  
  const filteredCharacterPresets = dbCharacterPresets
    .filter(preset => 
      characterPresetFilter === "all" || (characterPresetFilter === "favorites" && preset.is_favorite)
    )
    .sort((a, b) => {
      // Sort favorited presets to the top, then alphabetically within each group
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      // Within the same favorite status, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  
  // Detailed options state - for nested detailed options in Additional tab
  const [detailedOptionValues, setDetailedOptionValues] = useState<Record<string, Record<string, string>>>({});
  
  // Checkpoint model states
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<any>(null);
  const [checkpointOptions, setCheckpointOptions] = useState<{value: string, label: string}[]>([]);
  const [isLoadingCheckpoints, setIsLoadingCheckpoints] = useState(false);

  // Character tab options from database
  const [rolesOptions, setRolesOptions] = useState<{value: string, label: string}[]>([]);
  const [hairstylesOptions, setHairstylesOptions] = useState<{value: string, label: string}[]>([]);
  const [hairColorOptions, setHairColorOptions] = useState<{value: string, label: string}[]>([]);
  const [eyeColorOptions, setEyeColorOptions] = useState<{value: string, label: string}[]>([]);
  const [makeupOptions, setMakeupOptions] = useState<{value: string, label: string}[]>([]);
  const [skinToneOptions, setSkinToneOptions] = useState<{value: string, label: string}[]>([]);
  const [clothingOptions, setClothingOptions] = useState<{value: string, label: string}[]>([]);
  const [poseOptions, setPoseOptions] = useState<{value: string, label: string}[]>([]);
  const [expressionOptions, setExpressionOptions] = useState<{value: string, label: string}[]>([]);
  const [characterTypeOptions, setCharacterTypeOptions] = useState<{value: string, label: string}[]>([]);
  const [lightingOptions, setLightingOptions] = useState<{value: string, label: string}[]>([]);
  const [environmentOptions, setEnvironmentOptions] = useState<{value: string, label: string}[]>([]);
  const [perspectiveOptions, setPerspectiveOptions] = useState<{value: string, label: string}[]>([]);
  const [qualityOptions, setQualityOptions] = useState<{value: string, label: string}[]>([]);
  const [cameraOptions, setCameraOptions] = useState<{value: string, label: string}[]>([]);
  const [aspectRatioOptions, setAspectRatioOptions] = useState<{value: string, label: string}[]>([]);
  
  // Prompt component options for dynamic loading
  const [artFormOptions, setArtFormOptions] = useState<{value: string, label: string}[]>([]);
  const [photoTypeOptions, setPhotoTypeOptions] = useState<{value: string, label: string}[]>([]);
  const [photographyStyleOptions, setPhotographyStyleOptions] = useState<{value: string, label: string}[]>([]);
  const [photographerOptions, setPhotographerOptions] = useState<{value: string, label: string}[]>([]);
  const [deviceOptions, setDeviceOptions] = useState<{value: string, label: string}[]>([]);
  const [artStyleOptions, setArtStyleOptions] = useState<{value: string, label: string}[]>([]);
  const [artistOptions, setArtistOptions] = useState<{value: string, label: string}[]>([]);
  const [digitalArtformOptions, setDigitalArtformOptions] = useState<{value: string, label: string}[]>([]);
  
  // Detailed options categories for Additional tab
  const [architectureOptions, setArchitectureOptions] = useState<{value: string, label: string}[]>([]);
  const [artOptions, setArtOptions] = useState<{value: string, label: string}[]>([]);
  const [brandsOptions, setBrandsOptions] = useState<{value: string, label: string}[]>([]);
  const [cinematicOptions, setCinematicOptions] = useState<{value: string, label: string}[]>([]);
  const [fashionOptions, setFashionOptions] = useState<{value: string, label: string}[]>([]);
  const [feelingsOptions, setFeelingsOptions] = useState<{value: string, label: string}[]>([]);
  const [foodsOptions, setFoodsOptions] = useState<{value: string, label: string}[]>([]);
  const [geographyOptions, setGeographyOptions] = useState<{value: string, label: string}[]>([]);
  const [humanOptions, setHumanOptions] = useState<{value: string, label: string}[]>([]);
  const [interactionOptions, setInteractionOptions] = useState<{value: string, label: string}[]>([]);
  const [keywordsOptions, setKeywordsOptions] = useState<{value: string, label: string}[]>([]);
  const [objectsOptions, setObjectsOptions] = useState<{value: string, label: string}[]>([]);
  const [peopleOptions, setPeopleOptions] = useState<{value: string, label: string}[]>([]);
  const [plotsOptions, setPlotsOptions] = useState<{value: string, label: string}[]>([]);
  const [sceneOptions, setSceneOptions] = useState<{value: string, label: string}[]>([]);
  const [scienceOptions, setScienceOptions] = useState<{value: string, label: string}[]>([]);
  const [stuffOptions, setStuffOptions] = useState<{value: string, label: string}[]>([]);
  const [timeOptions, setTimeOptions] = useState<{value: string, label: string}[]>([]);
  const [typographyOptions, setTypographyOptions] = useState<{value: string, label: string}[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<{value: string, label: string}[]>([]);
  const [videogameOptions, setVideogameOptions] = useState<{value: string, label: string}[]>([]);
  const [backgroundOptions, setBackgroundOptions] = useState<{value: string, label: string}[]>([]);
  const [moodOptions, setMoodOptions] = useState<{value: string, label: string}[]>([]);
  
  // Create dynamic categories from database-loaded options
  const createDynamicCategories = (): CategoryOption[] => {
    return [
      {
        name: "architecture",
        label: "Architecture Options",
        subCategories: [
          {
            name: "architecture",
            label: "Architecture",
            options: architectureOptions
          }
        ]
      },
      {
        name: "art",
        label: "Art Options", 
        subCategories: [
          {
            name: "artists",
            label: "Artists",
            options: artOptions
          }
        ]
      },
      {
        name: "cinematic",
        label: "Cinematic Options",
        subCategories: [
          {
            name: "cinematic",
            label: "Cinematic",
            options: cinematicOptions
          }
        ]
      },
      {
        name: "fashion",
        label: "Fashion Options",
        subCategories: [
          {
            name: "fashion",
            label: "Fashion",
            options: fashionOptions
          }
        ]
      },
      {
        name: "feelings",
        label: "Feelings Options",
        subCategories: [
          {
            name: "feelings",
            label: "Feelings",
            options: feelingsOptions
          }
        ]
      }
    ];
  };
  
  // Loading states for API calls
  const [isLoadingOptions, setIsLoadingOptions] = useState<Record<string, boolean>>({});
  
  // Admin mode context
  const { isAdminMode } = useAdminMode();
  
  // Helper function to show confirmation modal
  const showConfirmation = (title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'default', confirmText: string = 'Confirm') => {
    setConfirmationModal({
      isOpen: true,
      title,
      description,
      onConfirm,
      variant,
      confirmText,
    });
  };
  
  // Function to load prompt components by category
  const loadPromptComponentsByCategory = async (category: string, setter: React.Dispatch<React.SetStateAction<{value: string, label: string}[]>>) => {
    try {
      setIsLoadingOptions(prev => ({ ...prev, [category]: true }));
      const data = await fetchPromptComponentsByCategory(category);
      
      if (data && data.length > 0) {
        // Format the data for dropdown options
        // Database has 'value' field, use it for both value and label
        const dbOptions = data.map((item: any) => ({
          value: item.value,
          label: item.value
        }));
        
        // Add None and Custom Entry options at the beginning
        const optionsWithExtras = [
          { value: '', label: 'None' },
          { value: '__custom__', label: 'Custom Entry' },
          ...dbOptions
        ];
        
        setter(optionsWithExtras);
      } else {
        // Even if no data, provide None and Custom Entry options
        setter([
          { value: '', label: 'None' },
          { value: '__custom__', label: 'Custom Entry' }
        ]);
      }
    } catch (error) {
      console.error(`Error loading ${category} options:`, error);
      // Provide None and Custom Entry options even on error
      setter([
        { value: '', label: 'None' },
        { value: '__custom__', label: 'Custom Entry' }
      ]);
    } finally {
      setIsLoadingOptions(prev => ({ ...prev, [category]: false }));
    }
  };

  // Function to load checkpoint models from database
  const loadCheckpointModels = async () => {
    try {
      setIsLoadingCheckpoints(true);
      const response = await fetch('/api/checkpoint-models');
      if (response.ok) {
        const models = await response.json();
        setCheckpoints(models);
        
        // Group models by type and format for dropdown options
        const groupedModels = models.reduce((acc: any, model: any) => {
          const type = model.type || 'Other';
          if (!acc[type]) acc[type] = [];
          acc[type].push({
            value: model.id.toString(),
            label: model.name
          });
          return acc;
        }, {});

        // Create flat options array with separators
        const options: any[] = [];
        Object.keys(groupedModels).sort().forEach(type => {
          // Add type separator
          options.push({
            value: `separator-${type}`,
            label: `--- ${type} ---`,
            isSeperator: true
          });
          // Add models for this type
          options.push(...groupedModels[type]);
        });
        
        setCheckpointOptions(options);
        
        // Set first model as default if none selected
        if (models.length > 0 && !selectedCheckpoint) {
          setSelectedCheckpoint(models[0]);
        }
      }
    } catch (error) {
      console.error('Error loading checkpoint models:', error);
    } finally {
      setIsLoadingCheckpoints(false);
    }
  };

  // Load JSON prompt data
  useEffect(() => {
    const loadJsonPromptData = async () => {
      try {
        const response = await fetch('/data/jsonprompthelper.json');
        if (response.ok) {
          const data = await response.json();
          setJsonPromptData(data);
        }
      } catch (error) {
        console.error('Error loading JSON prompt data:', error);
      }
    };
    
    loadJsonPromptData();
  }, []);

  // Handle JSON prompt selection from dropdown
  const handleJsonPromptSelection = (category: string) => {
    if (!jsonPromptData || !jsonPromptData[category]) return;
    
    const prompts = jsonPromptData[category];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setValue('subject', randomPrompt);
    setSparklePopoverOpen(false);
    
    toast({
      title: "Subject filled",
      description: `Random prompt from "${category.replace(/_/g, ' ')}" category`,
    });
  };

  // Load prompt components and checkpoint models on component mount
  useEffect(() => {
    // Load checkpoint models first
    loadCheckpointModels();
    
    // Load Character tab options from database - NOW PROPERLY CONNECTED!
    loadPromptComponentsByCategory('roles', setRolesOptions);
    loadPromptComponentsByCategory('hairstyle', setHairstylesOptions);
    loadPromptComponentsByCategory('hair_color', setHairColorOptions);
    loadPromptComponentsByCategory('eye_color', setEyeColorOptions);
    loadPromptComponentsByCategory('makeup', setMakeupOptions);
    loadPromptComponentsByCategory('skin_tone', setSkinToneOptions);
    loadPromptComponentsByCategory('clothing', setClothingOptions);
    loadPromptComponentsByCategory('pose', setPoseOptions);
    loadPromptComponentsByCategory('expression', setExpressionOptions);
    loadPromptComponentsByCategory('lighting', setLightingOptions);
    loadPromptComponentsByCategory('environment', setEnvironmentOptions);
    loadPromptComponentsByCategory('perspective', setPerspectiveOptions);
    loadPromptComponentsByCategory('quality', setQualityOptions);
    loadPromptComponentsByCategory('camera', setCameraOptions);
    loadPromptComponentsByCategory('aspect_ratio', setAspectRatioOptions);
    
    // Load Style tab options using exact database categories
    loadPromptComponentsByCategory('artform', setArtFormOptions);
    loadPromptComponentsByCategory('photography_options', setPhotoTypeOptions);
    loadPromptComponentsByCategory('style_options', setPhotographyStyleOptions);
    loadPromptComponentsByCategory('photographer_options', setPhotographerOptions);
    loadPromptComponentsByCategory('device_options', setDeviceOptions);
    loadPromptComponentsByCategory('artist_style', setArtStyleOptions);
    loadPromptComponentsByCategory('artist', setArtistOptions);
    loadPromptComponentsByCategory('digital_artform', setDigitalArtformOptions);
    
    // Load Additional tab detailed options using exact database categories
    loadPromptComponentsByCategory('architecture_options', setArchitectureOptions);
    loadPromptComponentsByCategory('artist_options', setArtOptions);
    loadPromptComponentsByCategory('brands_options', setBrandsOptions);
    loadPromptComponentsByCategory('cinematic_options', setCinematicOptions);
    loadPromptComponentsByCategory('fashion_options', setFashionOptions);
    loadPromptComponentsByCategory('emotions_options', setFeelingsOptions);
    loadPromptComponentsByCategory('1word_food', setFoodsOptions);
    loadPromptComponentsByCategory('geography_options', setGeographyOptions);
    loadPromptComponentsByCategory('human_options', setHumanOptions);
    loadPromptComponentsByCategory('action', setInteractionOptions);
    loadPromptComponentsByCategory('additional_detail', setKeywordsOptions);
    loadPromptComponentsByCategory('objects_options', setObjectsOptions);
    loadPromptComponentsByCategory('people_options', setPeopleOptions);
    loadPromptComponentsByCategory('scene_options', setSceneOptions);
    loadPromptComponentsByCategory('science_options', setScienceOptions);
    loadPromptComponentsByCategory('accessories', setStuffOptions);
    loadPromptComponentsByCategory('time_options', setTimeOptions);
    loadPromptComponentsByCategory('typography_options', setTypographyOptions);
    loadPromptComponentsByCategory('air_vehicles', setVehicleOptions);
    loadPromptComponentsByCategory('videogame_options', setVideogameOptions);
    loadPromptComponentsByCategory('character_type', setCharacterTypeOptions);
    loadPromptComponentsByCategory('background', setBackgroundOptions);
    loadPromptComponentsByCategory('mood', setMoodOptions);
  }, []);
  
  // Setup form with our default values
  const { watch, setValue, reset, getValues } = useForm({
    defaultValues: {
      // Core fields that are expected by ElitePromptOptions
      custom: '',
      subject: '',
      gender: '',
      globalOption: 'Disabled',
      loraDescription: '',
      bodyTypes: '',
      defaultTags: '',
      roles: '',
      hairstyles: '',
      hairColor: '',
      eyeColor: '',
      makeup: '',
      skinTone: '',
      clothing: '',
      place: '',
      lighting: '',
      composition: '',
      background: '',
      expression: '',
      // Style tab fields
      artform: '',
      photoType: '',
      photographyStyles: '',
      photographer: '',
      device: '',
      artStyle: '',
      artist: '',
      digitalArtform: '',
      // Additional tab fields
      currentDetailedOptionsTab: 'architecture',
      architectureOptions: '',
      artOptions: '',
      brandsOptions: '',
      cinematicOptions: '',
      fashionOptions: '',
      feelingsOptions: '',
      foodsOptions: '',
      geographyOptions: '',
      humanOptions: '',
      interactionOptions: '',
      keywordsOptions: '',
      objectsOptions: '',
      peopleOptions: '',
      plotsOptions: '',
      sceneOptions: '',
      scienceOptions: '',
      stuffOptions: '',
      timeOptions: '',
      typographyOptions: '',
      vehicleOptions: '',
      videogameOptions: '',
      pose: '',
      accessories: '',
      additionalElements: '',
      aesthetic: '',
      characterType: '',
      additionalDetails: '',
      mood: '',
      aspectRatio: '',
      seed: '',
      negativePrompt: 'Meiná, bad anatomy, bad hands, extra fingers, missing fingers, extra hands, extra legs, missing legs, mutated hands, (poorly drawn face), extra arms, missing arms, poorly drawn hands, blurry, out of frame, signature, watermark, username, pixelated'
    }
  });
  
  // Get current form values for easier access
  const gender = watch('gender');
  
  // Watch for form changes to track modifications
  const watchedValues = watch();
  
  // Track modifications when form values change (only when not loading a preset)
  useEffect(() => {
    if (!isLoadingPreset && (currentGlobalPreset !== null || currentCharacterPreset !== null)) {
      setIsModified(true);
    }
  }, [watchedValues, isLoadingPreset, currentGlobalPreset, currentCharacterPreset]);
  
  // Handler for top format tabs changes
  const handleFormatTabChange = (value: string) => {
    setSelectedTopButton(value);
  };
  
  // Helper function to format multi-select values as comma-separated strings
  const formatMultiSelectValue = (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // Make sure we return an empty string for null/undefined
    return value?.toString() || '';
  };

  // Function to generate a live preview based on current form values
  // Modal functions for preset creation
  const openGlobalPresetModal = () => {
    // Get all current form values
    const currentValues = getValues();
    
    // Create preset data from current form state
    const presetData = {
      custom: currentValues.custom || '',
      subject: currentValues.subject || currentValues.characterType || '',
      gender: currentValues.gender || '',
      globalOption: currentValues.globalOption || 'Disabled',
      artform: currentValues.artform || '',
      photoType: currentValues.photoType || '',
      bodyTypes: currentValues.bodyTypes || '',
      defaultTags: currentValues.defaultTags || '',
      roles: currentValues.roles || '',
      hairstyles: currentValues.hairstyles || '',
      hairColor: currentValues.hairColor || '',
      eyeColor: currentValues.eyeColor || '',
      makeup: currentValues.makeup || '',
      skinTone: currentValues.skinTone || '',
      clothing: currentValues.clothing || '',
      expression: currentValues.expression || '',
      loraDescription: currentValues.loraDescription || '',
      place: currentValues.place || '',
      lighting: currentValues.lighting || '',
      composition: currentValues.composition || '',
      pose: currentValues.pose || '',
      background: currentValues.background || '',
      additionalDetails: currentValues.additionalDetails || '',
      photographyStyles: currentValues.photographyStyles || '',
      device: currentValues.device || '',
      photographer: currentValues.photographer || '',
      artist: currentValues.artist || '',
      digitalArtform: currentValues.digitalArtform || '',
      architectureOptions: currentValues.architectureOptions || '',
      artOptions: currentValues.artOptions || '',
      brandsOptions: currentValues.brandsOptions || '',
      cinematicOptions: currentValues.cinematicOptions || '',
      fashionOptions: currentValues.fashionOptions || '',
      feelingsOptions: currentValues.feelingsOptions || '',
      foodsOptions: currentValues.foodsOptions || '',
      geographyOptions: currentValues.geographyOptions || '',
      humanOptions: currentValues.humanOptions || '',
      interactionOptions: currentValues.interactionOptions || '',
      keywordsOptions: currentValues.keywordsOptions || '',
      objectsOptions: currentValues.objectsOptions || '',
      peopleOptions: currentValues.peopleOptions || '',
      plotsOptions: currentValues.plotsOptions || '',
      sceneOptions: currentValues.sceneOptions || '',
      scienceOptions: currentValues.scienceOptions || '',
      stuffOptions: currentValues.stuffOptions || '',
      timeOptions: currentValues.timeOptions || '',
      typographyOptions: currentValues.typographyOptions || '',
      vehicleOptions: currentValues.vehicleOptions || '',
      videogameOptions: currentValues.videogameOptions || '',
      seed: currentValues.seed || undefined
    };
    
    // Prompt user for preset name
    const presetName = prompt('Enter a name for this global preset:');
    if (presetName && presetName.trim()) {
      createGlobalPresetMutation.mutate({
        name: presetName.trim(),
        description: `Global preset created from current settings`,
        preset_data: presetData,
        user_id: 'dev-user'
      });
    }
  };

  // Reset Functions
  const resetAllFields = () => {
    reset();
    toast({
      title: "All Settings Reset",
      description: "All form fields have been cleared",
      duration: 2000,
    });
  };

  const resetCharacterFields = () => {
    setValue('gender', '');
    setValue('bodyTypes', '');
    setValue('characterType', '');
    setValue('defaultTags', '');
    setValue('roles', '');
    setValue('hairstyles', '');
    setValue('hairColor', '');
    setValue('eyeColor', '');
    setValue('makeup', '');
    setValue('skinTone', '');
    setValue('clothing', '');
    setValue('expression', '');
    setValue('accessories', '');
    setValue('pose', '');
    setValue('loraDescription', '');
    toast({
      title: "Character Settings Reset",
      description: "All character fields have been cleared",
      duration: 2000,
    });
  };

  const openCharacterPresetModal = () => {
    // Get current character-related form values
    const currentValues = getValues();
    
    // Create a description string from current character settings
    const characterParts = [
      currentValues.gender,
      currentValues.bodyTypes,
      currentValues.roles,
      currentValues.hairstyles,
      currentValues.hairColor,
      currentValues.eyeColor,
      currentValues.clothing,
      currentValues.expression,
      currentValues.loraDescription
    ].filter(part => part && part.trim()).join(', ');
    
    setCurrentCharacterDescription(characterParts || "Custom character from prompt generator");
    setCharacterSaveDialogOpen(true);
  };

  const loadCharacterPreset = (preset: CharacterPreset) => {
    // Set loading state to prevent modification tracking
    setIsLoadingPreset(true);
    
    // Load character preset data into form from database columns
    setValue('gender', preset.gender || '');
    setValue('bodyTypes', preset.bodyType || '');
    setValue('defaultTags', preset.defaultTag || '');
    setValue('roles', preset.role || '');
    setValue('hairstyles', preset.hairstyle || '');
    setValue('hairColor', preset.hairColor || '');
    setValue('eyeColor', preset.eyeColor || '');
    setValue('makeup', preset.makeup || '');
    setValue('skinTone', preset.skinTone || '');
    setValue('clothing', preset.clothing || '');
    setValue('additionalDetails', preset.additionalDetails || '');
    setValue('loraDescription', preset.loraDescription || '');
    
    // Load additional properties if they exist 
    setValue('expression', (preset as any).expression || '');
    setValue('accessories', (preset as any).accessories || '');
    setValue('pose', (preset as any).pose || '');
    
    // If there's character_data JSON, prioritize that data (it's more complete)
    if ((preset as any).character_data) {
      const charData = (preset as any).character_data;
      setValue('characterType', charData.characterType || '');
      setValue('expression', charData.expression || '');
      setValue('accessories', charData.accessories || '');
      setValue('pose', charData.pose || '');
    }
    
    // Track currently loaded preset and reset modification state
    setCurrentCharacterPreset(Number(preset.id));
    setCurrentGlobalPreset(null); // Clear global preset when loading character
    setIsModified(false);
    
    // Clear loading state after all values are set
    setTimeout(() => {
      setIsLoadingPreset(false);
    }, 50);
    
    toast({
      title: "Character Preset Loaded",
      description: `Loaded preset: ${preset.name}`,
      duration: 2000,
    });
  };

  const generateLivePreview = () => {
    try {
      // Get all current values from the form
      const formValues = getValues();
      
      // Create a processed version of form values that handles multi-select arrays
      const processedValues: Record<string, any> = {};
      
      // Process all form values to handle multi-select mode
      Object.entries(formValues).forEach(([key, value]) => {
        if (isMultiSelectMode && Array.isArray(value)) {
          // For multi-select values, convert arrays to comma-separated strings
          processedValues[key] = formatMultiSelectValue(value);
        } else {
          // For regular values, use as-is but ensure they're strings
          processedValues[key] = value !== null && value !== undefined ? value : '';
        }
      });
      
      // Simple gender handling - no forced defaults, use standard processing
      // Gender will be processed through standard form loop like Additional Details
      

      
      // CRITICAL FIX: Multi-select Body Type handling
      // Make sure bodyTypes is properly formatted as a comma-separated string
      if (isMultiSelectMode && Array.isArray(formValues.bodyTypes)) {
        processedValues.bodyTypes = formValues.bodyTypes.join(', ');
      }
      
      // Get the detailed option values from state and process them
      // This ensures changes in the Additional tab are reflected in the preview
      Object.entries(detailedOptionValues).forEach(([categoryName, subCategoryValues]) => {
        // Convert the subcategory values to a string for the prompt generator
        const valueString = Object.entries(subCategoryValues)
          .filter(([_, val]) => val && val !== "" && val !== "none")
          .map(([_, val]) => val)
          .join(', ');
        
        // Only add if there's actually content
        if (valueString) {
          processedValues[`${categoryName}Options`] = valueString;
        }
      });
      
      // Create options object for generator
      const options: ElitePromptOptions = {
        // Gender handling - ensure it's always passed correctly
        gender: (processedValues.gender === 'female' || processedValues.gender === 'male') 
          ? processedValues.gender as 'female' | 'male'
          : 'female', // Default to female if not valid
        
        // Essential character attributes - CRITICAL FIX: Ensure loraDescription is included
        custom: processedValues.custom || '',
        subject: processedValues.subject || '',
        // Don't pass template to ElitePromptGenerator - it's for Enhanced Rule Templates only
        loraDescription: processedValues.loraDescription || '',  // CRITICAL: Ensure this is always included
        characterType: processedValues.characterType || '',  // CRITICAL: Add missing characterType
        globalOption: processedValues.globalOption || 'Disabled',
        
        // Character details - CRITICAL FIX: Ensure bodyTypes is included as comma-separated
        bodyTypes: processedValues.bodyTypes || '',
        defaultTags: processedValues.defaultTags || '',
        roles: processedValues.roles || '',
        hairstyles: processedValues.hairstyles || '',
        hairColor: processedValues.hairColor || '',
        eyeColor: processedValues.eyeColor || '',
        makeup: processedValues.makeup || '',
        skinTone: processedValues.skinTone || '',
        clothing: processedValues.clothing || '',
        expression: processedValues.expression || '',
        // Remove jewelry for now as it's not in the interface
        accessories: processedValues.accessories || '',
        
        // Scene details
        place: processedValues.place || '',
        lighting: processedValues.lighting || '',
        composition: processedValues.composition || '',
        pose: processedValues.pose || '',
        background: processedValues.background || '',
        mood: processedValues.mood || '',
        additionalDetails: processedValues.additionalDetails || '',
        
        // Style attributes
        artform: processedValues.artform || '',
        photoType: processedValues.photoType || '',
        photographyStyles: processedValues.photographyStyles || '',
        device: processedValues.device || '',
        photographer: processedValues.photographer || '',
        artist: processedValues.artist || '',
        digitalArtform: processedValues.digitalArtform || '',
        
        // Numerical and optional parameters
        seed: processedValues.seed ? parseInt(processedValues.seed.toString()) : undefined,
        
        // Additional detailed options - ensure all are included
        architectureOptions: processedValues.architectureOptions || '',
        artOptions: processedValues.artOptions || '',
        brandsOptions: processedValues.brandsOptions || '',
        cinematicOptions: processedValues.cinematicOptions || '',
        fashionOptions: processedValues.fashionOptions || '',
        feelingsOptions: processedValues.feelingsOptions || '',
        foodsOptions: processedValues.foodsOptions || '',
        geographyOptions: processedValues.geographyOptions || '',
        humanOptions: processedValues.humanOptions || '',
        interactionOptions: processedValues.interactionOptions || '',
        keywordsOptions: processedValues.keywordsOptions || '',
        objectsOptions: processedValues.objectsOptions || '',
        peopleOptions: processedValues.peopleOptions || '',
        plotsOptions: processedValues.plotsOptions || '',
        sceneOptions: processedValues.sceneOptions || '',
        scienceOptions: processedValues.scienceOptions || '',
        stuffOptions: processedValues.stuffOptions || '',
        timeOptions: processedValues.timeOptions || '',
        typographyOptions: processedValues.typographyOptions || '',
        vehicleOptions: processedValues.vehicleOptions || '',
        videogameOptions: processedValues.videogameOptions || '',
      };
      
      // Generate the prompt using the ElitePromptGenerator
      const result = elitePromptGenerator.generatePrompt(options);
      
      // Update the live preview state - use original field which contains the raw prompt
      setLivePrompt(result.original || "");
    } catch (error) {
      console.error("Error generating live preview:", error);
      setLivePrompt("Error generating preview");
    }
  };
  
  // Set up a subscription to form changes for live preview
  useEffect(() => {
    // Create a subscription that updates the live preview whenever ANY form field changes
    const subscription = watch(() => {
      generateLivePreview();
    });
    
    // Generate an initial preview on component mount
    generateLivePreview();
    
    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [isMultiSelectMode]); // Re-run when multiselect mode changes
  
  // Generate prompt function
  const generatePrompt = async () => {
    setIsGenerating(true);
    
    try {
      // Get all form values
      const formValues = watch();
      
      // Process form values to handle multi-select values
      const processedValues: Record<string, any> = {};
      
      // Process all form values to handle multi-select mode
      Object.entries(formValues).forEach(([key, value]) => {
        if (isMultiSelectMode && Array.isArray(value)) {
          // For multi-select mode, convert arrays to comma-separated strings
          processedValues[key] = formatMultiSelectValue(value);
        } else {
          // For regular values, use as-is
          processedValues[key] = value;
        }
      });
      
      // Create options object for generator with all the processed form values
      const result = await elitePromptGenerator.generatePrompt(processedValues);
      setGeneratedPrompt(result);
      
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast({
        title: "Error generating prompt",
        description: "There was an error generating your prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Switch between our main tab panels
  const switchTab = (tab: "character" | "scene" | "style" | "additional") => {
    setActiveTab(tab);
  };
  
  // Load a saved preset 
  const loadPreset = (preset: SavedPreset) => {
    console.log("Loading preset:", preset);
    console.log("Preset keys:", Object.keys(preset));
    
    // Set loading state to prevent modification tracking
    setIsLoadingPreset(true);
    
    // Extract data from data JSON field  
    const presetData = (preset as any).data || {};
    console.log("Preset data:", presetData);
    
    // Load all preset data into form from the JSON structure
    setValue('custom', presetData.custom || '');
    setValue('subject', presetData.subject || '');
    setValue('gender', presetData.gender || '');
    setValue('globalOption', presetData.globalOption || 'Disabled');
    setValue('artform', presetData.artform || '');
    setValue('photoType', presetData.photoType || '');
    setValue('bodyTypes', presetData.bodyTypes || '');
    setValue('defaultTags', presetData.defaultTags || '');
    setValue('roles', presetData.roles || '');
    setValue('hairstyles', presetData.hairstyles || '');
    setValue('hairColor', presetData.hairColor || '');
    setValue('eyeColor', presetData.eyeColor || '');
    setValue('makeup', presetData.makeup || '');
    setValue('skinTone', presetData.skinTone || '');
    setValue('clothing', presetData.clothing || '');
    setValue('expression', presetData.expression || '');
    setValue('loraDescription', presetData.loraDescription || '');
    setValue('place', presetData.place || '');
    setValue('lighting', presetData.lighting || '');
    setValue('composition', presetData.composition || '');
    setValue('pose', presetData.pose || '');
    setValue('background', presetData.background || '');
    setValue('additionalDetails', presetData.additionalDetails || '');
    setValue('negativePrompt', presetData.negativePrompt || '');
    
    // Track currently loaded preset and reset modification state
    setCurrentGlobalPreset(Number(preset.id));
    setCurrentCharacterPreset(null); // Clear character preset when loading global
    setIsModified(false);
    
    // Clear loading state after all values are set
    setTimeout(() => {
      setIsLoadingPreset(false);
    }, 50);
    
    toast({
      title: "Global Preset Loaded",
      description: `Loaded preset: ${preset.name}`,
      duration: 2000,
    });
  };
  
  // UI rendering
  return (
    <>
    <div className="w-full max-w-[1600px] mx-auto space-y-4">

      
      {/* Top Section - Subject and Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-2">
            <label className="section-label">Subject 🎨</label>
            {jsonPromptData && (
              <Popover open={sparklePopoverOpen} onOpenChange={setSparklePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-800/50 transition-all duration-300"
                  >
                    <Sparkles className="h-4 w-4 text-pink-400" style={{
                      filter: 'drop-shadow(0 0 1px #8b5cf6)'
                    }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 bg-gray-900 border-gray-700" align="start">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 font-medium mb-2 px-2">
                      Select Category of Random Prompt
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {Object.keys(jsonPromptData).map((category) => (
                        <Button
                          key={category}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left text-white hover:bg-gray-800 h-auto py-2 px-2"
                          onClick={() => handleJsonPromptSelection(category)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="text-xs text-gray-400">
                              {jsonPromptData[category]?.length || 0} prompts
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          <Textarea
            value={watch('subject') || ""}
            onChange={(e) => setValue('subject', e.target.value)}
            placeholder="Enter subject or main focus"
            className="w-full glass-input rounded-lg p-3 focus:outline-none focus:ring-0"
            rows={3}
          />
        </div>
        
        <div className="glass-card">
          <label className="section-label block mb-2">Additional Details</label>
          <Textarea
            value={watch('additionalDetails') || ""}
            onChange={(e) => setValue('additionalDetails', e.target.value)}
            placeholder="Enter additional details for the character or scene"
            className="w-full glass-input rounded-lg p-3 focus:outline-none focus:ring-0"
            rows={3}
          />
        </div>
      </div>
      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column - Presets (3 columns) */}
        <div className="xl:col-span-3 space-y-4">
            {/* Global Presets */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="heading-accent text-white">Global Presets</h3>
                  <p className="text-xs text-gray-400">All Parameter Settings</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGlobalPresetsOpen(!isGlobalPresetsOpen)}
                  className="h-6 w-6 p-0 hover:bg-purple-600/20 transition-colors"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", !isGlobalPresetsOpen && "-rotate-90")} />
                </Button>
              </div>
              
              <div className={cn("transition-all", isGlobalPresetsOpen ? "" : "h-0 overflow-hidden")}>
                <div className={cn("transition-opacity", isGlobalPresetsOpen ? "opacity-100" : "opacity-0")}>
                  <div className="mb-4">
                  <div className="flex items-center gap-1 w-full">
                    <ShimmerButton 
                      onClick={() => openGlobalPresetModal()}
                      className="flex-1 h-7 p-0 btn-purple-grad text-white"
                      shimmerColor="#3b82f6"
                      borderRadius="4px"
                      title="New Global Preset"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </ShimmerButton>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      id="import-global-presets"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const importedPresets = JSON.parse(event.target?.result as string);
                              console.log('Imported global presets:', importedPresets);
                            } catch (error) {
                              console.error('Error importing presets:', error);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <ShimmerButton 
                      onClick={() => document.getElementById('import-global-presets')?.click()}
                      className="flex-1 h-7 p-0 bg-purple-600 border-purple-500/20 text-white"
                      shimmerColor="#8b5cf6"
                      borderRadius="4px"
                      title="Import Global Presets"
                    >
                      <Upload className="h-4 w-4 text-white" />
                    </ShimmerButton>
                    <ShimmerButton 
                      onClick={() => {
                        const dataStr = JSON.stringify(filteredGlobalPresets, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'global-presets.json';
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 h-7 p-0 bg-green-600 border-green-500/20 text-white"
                      shimmerColor="#10b981"
                      borderRadius="4px"
                      title="Export"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </ShimmerButton>
                    <ShimmerButton 
                      onClick={() => {
                        reset();
                        setValue('subject', '');
                        setValue('artStyle', '');
                        setValue('composition', '');
                        setValue('lighting', '');
                        setValue('background', '');
                        setValue('artform', '');
                        setValue('photoType', '');
                        setValue('device', '');
                        setValue('photographer', '');
                        setValue('artist', '');
                        setValue('digitalArtform', '');
                        setValue('place', '');
                        setValue('additionalDetails', '');
                        
                        // Clear both global AND character preset highlighting when reset
                        setCurrentGlobalPreset(null);
                        setCurrentCharacterPreset(null);
                        setIsModified(false);
                      }}
                      className="flex-1 h-7 p-0 bg-red-600 border-red-500/20 text-white"
                      shimmerColor="#ef4444"
                      borderRadius="4px"
                      title="Reset"
                    >
                      <RotateCcw className="h-4 w-4 text-white" />
                    </ShimmerButton>
                  </div>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-minimal">
                  {filteredGlobalPresets.length > 0 ? (
                    <>
                      {/* Favorites Section */}
                      {filteredGlobalPresets.filter(preset => preset.is_favorite).map((preset) => (
                        <div 
                          key={preset.id}
                          className={cn(
                            "preset-item group flex items-center py-1 px-2 rounded-md hover:bg-gray-800 cursor-pointer",
                            preset.id === currentGlobalPreset ? "bg-purple-900/30 border border-purple-600/30" : ""
                          )}
                          onClick={() => loadPreset(preset)}
                        >
                          <div className="flex items-center min-w-0 w-full">
                            <FavoriteButton
                              itemId={preset.id}
                              itemType="global-preset"
                              initialIsFavorited={preset.is_favorite}
                              size="sm"
                              className="mr-1.5 shrink-0"
                              onToggle={() => refetchGlobalPresets()}
                            />
                            <span className={cn(
                              "text-sm preset-name-truncate", 
                              preset.id === currentGlobalPreset ? "text-purple-400 font-medium" : ""
                            )} title={preset.name}>
                              {preset.id === currentGlobalPreset && isModified ? "* " : ""}{preset.name}
                            </span>
                          </div>
                          <div className="preset-hover-buttons flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Functional star button implemented
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Star"
                            >
                              <Star className="h-3 w-3 text-gray-500 hover:text-yellow-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const dataStr = JSON.stringify([preset], null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `global-preset-${preset.name}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Download"
                            >
                              <Download className="h-3 w-3 text-green-500 hover:text-green-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showConfirmation(
                                  'Delete Global Preset',
                                  `Are you sure you want to delete "${preset.name}"? This action cannot be undone.`,
                                  async () => {
                                    try {
                                      deleteGlobalPresetMutation.mutate(preset.id);
                                    } catch (error) {
                                      console.error("Error deleting preset:", error);
                                    }
                                  },
                                  'destructive',
                                  'Delete'
                                )
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-red-500 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Subtle divider if there are favorites */}
                      {filteredGlobalPresets.some(preset => preset.is_favorite) && 
                       filteredGlobalPresets.some(preset => !preset.is_favorite) && (
                        <div className="border-t border-gray-700/50 my-1"></div>
                      )}
                      
                      {/* Non-favorites Section */}
                      {filteredGlobalPresets.filter(preset => !preset.is_favorite).map((preset) => (
                        <div 
                          key={preset.id}
                          className={cn(
                            "preset-item group flex items-center py-1 px-2 rounded-md hover:bg-gray-800 cursor-pointer",
                            preset.id === currentGlobalPreset ? "bg-purple-900/30 border border-purple-600/30" : ""
                          )}
                          onClick={() => loadPreset(preset)}
                        >
                          <div className="flex items-center min-w-0 w-full">
                            <FavoriteButton
                              itemId={preset.id}
                              itemType="global-preset"
                              initialIsFavorited={preset.is_favorite}
                              size="sm"
                              className="mr-1.5 shrink-0"
                              onToggle={() => refetchGlobalPresets()}
                            />
                            <span className={cn(
                              "text-sm preset-name-truncate", 
                              preset.id === currentGlobalPreset ? "text-purple-400 font-medium" : ""
                            )} title={preset.name}>
                              {preset.id === currentGlobalPreset && isModified ? "* " : ""}{preset.name}
                            </span>
                          </div>
                          <div className="preset-hover-buttons flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Functional star button implemented
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Star"
                            >
                              <Star className="h-3 w-3 text-gray-500 hover:text-yellow-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showConfirmation(
                                  'Overwrite Global Preset',
                                  `Are you sure you want to overwrite "${preset.name}" with current settings?`,
                                  async () => {
                                    try {
                                      const currentValues = getValues();
                                      const updatedPreset = { ...preset, ...currentValues, updated_at: new Date().toISOString() };
                                      const response = await fetch(`/api/global-presets/${preset.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(updatedPreset)
                                      });
                                      if (response.ok) refetchGlobalPresets();
                                    } catch (error) {
                                      console.error("Error overwriting preset:", error);
                                    }
                                  },
                                  'default',
                                  'Overwrite'
                                )
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Overwrite"
                            >
                              <Save className="h-3 w-3 text-blue-500 hover:text-purple-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const dataStr = JSON.stringify([preset], null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `global-preset-${preset.name}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Download"
                            >
                              <Download className="h-3 w-3 text-green-500 hover:text-green-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showConfirmation(
                                  'Delete Global Preset',
                                  `Are you sure you want to delete "${preset.name}"? This action cannot be undone.`,
                                  async () => {
                                    try {
                                      deleteGlobalPresetMutation.mutate(preset.id);
                                    } catch (error) {
                                      console.error("Error deleting preset:", error);
                                    }
                                  },
                                  'destructive',
                                  'Delete'
                                )
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-red-500 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">No presets saved</div>
                  )}
                </div>
                </div>
              </div>
            </div>
            
            {/* Character Presets */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="heading-accent text-white">Character Presets</h3>
                  <p className="text-xs text-gray-400">Character Only Settings</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCharacterPresetsOpen(!isCharacterPresetsOpen)}
                  className="h-6 w-6 p-0 hover:bg-purple-600/20 transition-colors"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", !isCharacterPresetsOpen && "-rotate-90")} />
                </Button>
              </div>
              
              <div className={cn("transition-all", isCharacterPresetsOpen ? "" : "h-0 overflow-hidden")}>
                <div className={cn("transition-opacity", isCharacterPresetsOpen ? "opacity-100" : "opacity-0")}>
                <div className="mb-4">
                  <div className="flex items-center gap-1 w-full">
                    <ShimmerButton 
                      onClick={() => openCharacterPresetModal()}
                      className="flex-1 h-7 p-0 btn-purple-grad"
                      shimmerColor="#3b82f6"
                      borderRadius="4px"
                      title="New"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </ShimmerButton>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      id="import-character-presets"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const importedPresets = JSON.parse(event.target?.result as string);
                              console.log('Imported character presets:', importedPresets);
                            } catch (error) {
                              console.error('Error importing character presets:', error);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <ShimmerButton 
                      onClick={() => document.getElementById('import-character-presets')?.click()}
                      className="flex-1 h-7 p-0 bg-purple-600 border-purple-500/20"
                      shimmerColor="#8b5cf6"
                      borderRadius="4px"
                      title="Import"
                    >
                      <Upload className="h-4 w-4 text-white" />
                    </ShimmerButton>
                    <ShimmerButton 
                      onClick={() => {
                        const dataStr = JSON.stringify(filteredCharacterPresets, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'character-presets.json';
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 h-7 p-0 bg-green-600 border-green-500/20 text-white"
                      shimmerColor="#10b981"
                      borderRadius="4px"
                      title="Export"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </ShimmerButton>
                    <ShimmerButton 
                      onClick={() => {
                        setValue('gender', '');
                        setValue('characterType', '');
                        setValue('bodyTypes', '');
                        setValue('roles', '');
                        setValue('hairstyles', '');
                        setValue('hairColor', '');
                        setValue('eyeColor', '');
                        setValue('skinTone', '');
                        setValue('expression', '');
                        setValue('pose', '');
                        setValue('clothing', '');
                        setValue('accessories', '');
                        setValue('makeup', '');
                        setValue('loraDescription', '');
                        
                        // Clear character preset highlighting, but if global preset is loaded, mark it as modified
                        setCurrentCharacterPreset(null);
                        if (currentGlobalPreset !== null) {
                          setIsModified(true);
                        } else {
                          setIsModified(false);
                        }
                      }}
                      className="flex-1 h-7 p-0 bg-red-600 border-red-500/20 text-white"
                      shimmerColor="#ef4444"
                      borderRadius="4px"
                      title="Reset"
                    >
                      <RotateCcw className="h-4 w-4 text-white" />
                    </ShimmerButton>
                  </div>
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-minimal">
                  {filteredCharacterPresets.length > 0 ? (
                    <>
                      {/* Favorites Section */}
                      {filteredCharacterPresets.filter(preset => preset.is_favorite).map((preset) => (
                        <div 
                          key={preset.id} 
                          className={cn(
                            "preset-item group flex items-center py-1 px-2 rounded-md hover:bg-gray-800 cursor-pointer",
                            preset.id === currentCharacterPreset ? "bg-purple-900/30 border border-purple-600/30" : ""
                          )}
                          onClick={() => loadCharacterPreset(preset)}
                        >
                          <div className="flex items-center min-w-0 w-full">
                            <FavoriteButton
                              itemId={preset.id}
                              itemType="character-preset"
                              initialIsFavorited={preset.is_favorite}
                              size="sm"
                              className="mr-1.5 shrink-0"
                              onToggle={() => refetchCharacterPresets()}
                            />
                            <span className={cn(
                              "text-sm preset-name-truncate", 
                              preset.id === currentCharacterPreset ? "text-purple-400 font-medium" : ""
                            )} title={preset.name}>
                              {preset.id === currentCharacterPreset && isModified ? "* " : ""}{preset.name}
                            </span>
                          </div>
                          <div className="preset-hover-buttons flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Functional star button implemented
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Star"
                            >
                              <Star className="h-3 w-3 text-gray-500 hover:text-yellow-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showConfirmation(
                                  'Overwrite Character Preset',
                                  `Are you sure you want to overwrite "${preset.name}" with current character settings?`,
                                  async () => {
                                    try {
                                      const currentValues = getValues();
                                      const characterFields = {
                                        custom: currentValues.custom,
                                        subject: currentValues.subject,
                                        loraDescription: currentValues.loraDescription,
                                        gender: currentValues.gender,
                                        characterType: currentValues.characterType,
                                        bodyTypes: currentValues.bodyTypes,
                                        roles: currentValues.roles,
                                        hairstyles: currentValues.hairstyles,
                                        hairColor: currentValues.hairColor,
                                        eyeColor: currentValues.eyeColor,
                                        makeup: currentValues.makeup,
                                        skinTone: currentValues.skinTone,
                                        clothing: currentValues.clothing,
                                        additionalDetails: currentValues.additionalDetails,
                                        updated_at: new Date().toISOString()
                                      };
                                      const response = await fetch(`/api/character-presets/${preset.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(characterFields)
                                      });
                                      if (response.ok) refetchCharacterPresets();
                                    } catch (error) {
                                      console.error("Error overwriting character preset:", error);
                                    }
                                  },
                                  'default',
                                  'Overwrite'
                                )
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Update"
                            >
                              <Save className="h-3 w-3 text-blue-500 hover:text-purple-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const dataStr = JSON.stringify([preset], null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `character-preset-${preset.name}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Download"
                            >
                              <Download className="h-3 w-3 text-green-500 hover:text-green-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showConfirmation(
                                  'Delete Character Preset',
                                  `Are you sure you want to delete "${preset.name}"? This action cannot be undone.`,
                                  async () => {
                                    try {
                                      deleteCharacterPresetMutation.mutate(preset.id);
                                    } catch (error) {
                                      console.error("Error deleting character preset:", error);
                                    }
                                  },
                                  'destructive',
                                  'Delete'
                                )
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-red-500 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Subtle divider if there are favorites */}
                      {filteredCharacterPresets.some(preset => preset.is_favorite) && 
                       filteredCharacterPresets.some(preset => !preset.is_favorite) && (
                        <div className="border-t border-gray-700/50 my-1"></div>
                      )}
                      
                      {/* Non-favorites Section */}
                      {filteredCharacterPresets.filter(preset => !preset.is_favorite).map((preset) => (
                        <div 
                          key={preset.id} 
                          className={cn(
                            "preset-item group flex items-center py-1 px-2 rounded-md hover:bg-gray-800 cursor-pointer",
                            preset.id === currentCharacterPreset ? "bg-purple-900/30 border border-purple-600/30" : ""
                          )}
                          onClick={() => loadCharacterPreset(preset)}
                        >
                          <div className="flex items-center min-w-0 w-full">
                            <FavoriteButton
                              itemId={preset.id}
                              itemType="character-preset"
                              initialIsFavorited={preset.is_favorite}
                              size="sm"
                              className="mr-1.5 shrink-0"
                              onToggle={() => refetchCharacterPresets()}
                            />
                            <span className={cn(
                              "text-sm preset-name-truncate", 
                              preset.id === currentCharacterPreset ? "text-purple-400 font-medium" : ""
                            )} title={preset.name}>
                              {preset.id === currentCharacterPreset && isModified ? "* " : ""}{preset.name}
                            </span>
                          </div>
                          <div className="preset-hover-buttons flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Functional star button implemented
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Star"
                            >
                              <Star className="h-3 w-3 text-gray-500 hover:text-yellow-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showConfirmation(
                                  'Overwrite Character Preset',
                                  `Are you sure you want to overwrite "${preset.name}" with current character settings?`,
                                  async () => {
                                    try {
                                      const currentValues = getValues();
                                      const characterFields = {
                                        custom: currentValues.custom,
                                        subject: currentValues.subject,
                                        loraDescription: currentValues.loraDescription,
                                        gender: currentValues.gender,
                                        characterType: currentValues.characterType,
                                        bodyTypes: currentValues.bodyTypes,
                                        roles: currentValues.roles,
                                        hairstyles: currentValues.hairstyles,
                                        hairColor: currentValues.hairColor,
                                        eyeColor: currentValues.eyeColor,
                                        skinTone: currentValues.skinTone,
                                        expression: currentValues.expression,
                                        pose: currentValues.pose,
                                        clothing: currentValues.clothing,
                                        accessories: currentValues.accessories,
                                        makeup: currentValues.makeup
                                      };
                                      const updatedPreset = { ...preset, ...characterFields };
                                      const response = await fetch(`/api/character-presets/${preset.id}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(updatedPreset)
                                      });
                                      if (response.ok) refetchCharacterPresets();
                                    } catch (error) {
                                      console.error("Error overwriting character preset:", error);
                                    }
                                  },
                                  'default',
                                  'Overwrite'
                                )
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Overwrite"
                            >
                              <Save className="h-3 w-3 text-blue-500 hover:text-purple-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const dataStr = JSON.stringify([preset], null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `character-preset-${preset.name}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Download"
                            >
                              <Download className="h-3 w-3 text-green-500 hover:text-green-400" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                showConfirmation(
                                  'Delete Character Preset',
                                  `Are you sure you want to delete "${preset.name}"? This action cannot be undone.`,
                                  async () => {
                                    try {
                                      deleteCharacterPresetMutation.mutate(preset.id);
                                    } catch (error) {
                                      console.error("Error deleting character preset:", error);
                                    }
                                  },
                                  'destructive',
                                  'Delete'
                                )
                              }}
                              className="p-1 hover:bg-gray-700 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-red-500 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">No characters saved</div>
                  )}
                </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Prompt Settings */}
          <div className="glass-card mb-6">
            <div 
              className="flex justify-between items-center mb-2"
            >
              <div className="flex items-center gap-3">
                <h3 
                  className="heading-accent text-white cursor-pointer"
                  onClick={() => setIsPromptSettingsOpen(!isPromptSettingsOpen)}
                >
                  Prompt Settings
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                    className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                      isMultiSelectMode 
                        ? 'btn-purple-grad text-white' 
                        : 'glass-input text-gray-400 hover:bg-purple-600/20 hover:text-white'
                    }`}
                    title={isMultiSelectMode ? 'Switch to single selection mode' : 'Switch to multi-selection mode'}
                  >
                    {isMultiSelectMode ? 'Multi-Select Mode' : 'Toggle Mode'}
                  </button>
                </div>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform cursor-pointer ${isPromptSettingsOpen ? '' : 'transform rotate-180'}`}
                onClick={() => setIsPromptSettingsOpen(!isPromptSettingsOpen)}
              />
            </div>
            <p className="text-xs text-gray-400 mb-4">Configure prompt settings and character details</p>
            
            {isPromptSettingsOpen && (
              <>
                <div className="overflow-x-auto no-scrollbar border-b border-gray-800 mb-6">
                  <div className="flex space-x-2 min-w-max">
                    <button
                      onClick={() => switchTab("character")}
                      className={cn(
                        "py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
                        activeTab === "character"
                          ? "border-purple-500 text-purple-500"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-700"
                      )}
                    >
                      <User className="h-4 w-4" />
                      Character
                    </button>
                    <button
                      onClick={() => switchTab("scene")}
                      className={cn(
                        "py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
                        activeTab === "scene"
                          ? "border-purple-500 text-purple-500"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-700"
                      )}
                    >
                      <MapPin className="h-4 w-4" />
                      Scene
                    </button>
                    <button
                      onClick={() => switchTab("style")}
                      className={cn(
                        "py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
                        activeTab === "style"
                          ? "border-purple-500 text-purple-500"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-700"
                      )}
                    >
                      <Palette className="h-4 w-4" />
                      Style
                    </button>
                    <button
                      onClick={() => switchTab("additional")}
                      className={cn(
                        "py-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
                        activeTab === "additional"
                          ? "border-purple-500 text-purple-500"
                          : "border-transparent text-gray-400 hover:text-white hover:border-gray-700"
                      )}
                    >
                      <Layers className="h-4 w-4" />
                      Additional
                    </button>
                  </div>
                </div>
                
                {/* Character Settings Tab Content */}
                {activeTab === 'character' && (
                  <div className="space-y-6">
                    {/* Character Basics Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Character Basics
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-800/50 transition-all duration-300"
                          onClick={() => {
                            if (filteredCharacterPresets.length > 0) {
                              const randomPreset = filteredCharacterPresets[Math.floor(Math.random() * filteredCharacterPresets.length)];
                              loadCharacterPreset(randomPreset);
                              toast({
                                title: "Random Character Loaded",
                                description: `Loaded character preset: "${randomPreset.name}"`,
                                duration: 3000,
                              });
                            } else {
                              toast({
                                title: "No Character Presets",
                                description: "No character presets available for random selection",
                                variant: "destructive",
                                duration: 3000,
                              });
                            }
                          }}
                        >
                          <Dices className="h-4 w-4 text-pink-400" style={{
                            filter: 'drop-shadow(0 0 1px #8b5cf6)'
                          }} />
                        </Button>
                      </div>
                      
                      {/* LoRA-T (Manual Description) field */}
                      <div className="space-y-2 mb-4">
                        <label className="text-sm text-gray-400">LoRA-T (Manual Description)</label>
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-purple-500/10 to-purple-900/00 z-20" />
                        <Textarea
                          value={watch('loraDescription') || ""}
                          onChange={(e) => setValue('loraDescription', e.target.value)}
                          placeholder="Enter manual description for LoRA/trigger words if needed"
                          className="bg-black/70 border border-transparent z-20 relative focus:outline-none focus:ring-0"
                          rows={1}
                        />
                       
                         </div>
                        <p className="text-xs text-gray-500">
                          Add special triggers for character model LoRAs, or further customize your character
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Gender</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={convertToOptions(['Female', 'Male'])}
                            value={gender}
                            onChange={(value) => setValue('gender', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select gender"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Character Type</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={characterTypeOptions}
                            value={watch('characterType') || ""}
                            onChange={(value) => setValue('characterType', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select character type"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Role / Profession</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={rolesOptions}
                            value={watch('roles') || ""}
                            onChange={(value) => setValue('roles', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select role"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Body Type</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={convertToOptions(gender === 'female' ? FEMALE_BODY_TYPES : MALE_BODY_TYPES)}
                            value={watch('bodyTypes') || ""}
                            onChange={(value) => setValue('bodyTypes', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select body type"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Character Appearance Section - ORGANIZED IN YOUR SPECIFIED ORDER */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Character Appearance
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* 11. Hair Style - Position 11 in your order */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Hair Style</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={hairstylesOptions}
                            value={watch('hairstyles') || ""}
                            onChange={(value) => setValue('hairstyles', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select hair style"
                          />
                        </div>
                        
                        {/* 12. Hair Color - Position 12 in your order */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Hair Color</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={hairColorOptions}
                            value={watch('hairColor') || ""}
                            onChange={(value) => setValue('hairColor', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select hair color"
                          />
                        </div>
                        
                        {/* 13. Eye Color - Position 13 in your order */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Eye Color</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={eyeColorOptions}
                            value={watch('eyeColor') || ""}
                            onChange={(value) => setValue('eyeColor', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select eye color"
                          />
                        </div>
                        
                        {/* 14. Makeup - ALWAYS VISIBLE NOW (Position 14 in your order) */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Makeup</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={makeupOptions}
                            value={watch('makeup') || ""}
                            onChange={(value) => setValue('makeup', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select makeup style"
                          />
                        </div>
                        
                        {/* 15. Skin Tone - Position 15 in your order */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Skin Tone</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={skinToneOptions}
                            value={watch('skinTone') || ""}
                            onChange={(value) => setValue('skinTone', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select skin tone"
                          />
                        </div>
                        
                        {/* 16. Clothing - Position 16 in your order */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Clothing</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={clothingOptions}
                            value={watch('clothing') || ""}
                            onChange={(value) => setValue('clothing', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select clothing"
                          />
                        </div>
                        
                        {/* 17. Accessories - Position 17 in your order */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Accessories</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={stuffOptions}
                            value={watch('accessories') || ""}
                            onChange={(value) => setValue('accessories', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select accessories"
                          />
                        </div>
                        
                        {/* Additional fields that were in other sections */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Expression</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={expressionOptions}
                            value={watch('expression') || ""}
                            onChange={(value) => setValue('expression', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select expression"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Pose</label>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            options={poseOptions}
                            value={watch('pose') || ""}
                            onChange={(value) => setValue('pose', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select pose"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scene Settings Tab Content */}
                {activeTab === 'scene' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Location</label>
                        <SmartDropdown
                          isMultiSelectMode={isMultiSelectMode}
                          options={environmentOptions}
                          value={watch('place') || ""}
                          onChange={(value) => setValue('place', Array.isArray(value) ? value.join(', ') : value)}
                          placeholder="Select location"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Lighting</label>
                        <SmartDropdown
                          isMultiSelectMode={isMultiSelectMode}
                          options={lightingOptions}
                          value={watch('lighting') || ""}
                          onChange={(value) => setValue('lighting', Array.isArray(value) ? value.join(', ') : value)}
                          placeholder="Select lighting"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Background</label>
                        <SmartDropdown
                          isMultiSelectMode={isMultiSelectMode}
                          options={backgroundOptions}
                          value={watch('background') || ""}
                          onChange={(value) => setValue('background', Array.isArray(value) ? value.join(', ') : value)}
                          placeholder="Select background"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Composition</label>
                        <SmartDropdown
                          isMultiSelectMode={isMultiSelectMode}
                          options={perspectiveOptions}
                          value={watch('composition') || ""}
                          onChange={(value) => setValue('composition', Array.isArray(value) ? value.join(', ') : value)}
                          placeholder="Select composition"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Mood</label>
                        <SmartDropdown
                          isMultiSelectMode={isMultiSelectMode}
                          options={moodOptions}
                          value={watch('mood') || ""}
                          onChange={(value) => setValue('mood', Array.isArray(value) ? value.join(', ') : value)}
                          placeholder="Select mood"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Style Settings Tab Content - Placeholder */}
                {activeTab === 'style' && (
                  <div className="space-y-6">
                    {/* Art Form Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        Art Form
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <SmartDropdown
                            isMultiSelectMode={isMultiSelectMode}
                            label="Art Form"
                            options={artFormOptions}
                            value={watch('artform') || ""}
                            onChange={(value) => setValue('artform', Array.isArray(value) ? value.join(', ') : value)}
                            placeholder="Select art form"
                          />
                        </div>
                        
                        {watch('artform') === 'photography' && (
                          <div>
                            <SmartDropdown
                              isMultiSelectMode={isMultiSelectMode}
                              label="Photography Type"
                              options={photoTypeOptions}
                              value={watch('photoType') || ""}
                              onChange={(value) => setValue('photoType', Array.isArray(value) ? value.join(', ') : value)}
                              placeholder="Select photography type"
                            />
                          </div>
                        )}
                      </div>
                      
                      {watch('artform') === 'photography' && (
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <SmartDropdown
                                isMultiSelectMode={isMultiSelectMode}
                                label="Photography Style"
                                options={photographyStyleOptions}
                                value={watch('photographyStyles') || ""}
                                onChange={(value) => setValue('photographyStyles', Array.isArray(value) ? value.join(', ') : value)}
                                placeholder="Select photography style"
                              />
                            </div>
                            
                            <div>
                              <SmartDropdown
                                isMultiSelectMode={isMultiSelectMode}
                                label="Photographer"
                                options={photographerOptions}
                                value={watch('photographer') || ""}
                                onChange={(value) => setValue('photographer', Array.isArray(value) ? value.join(', ') : value)}
                                placeholder="Select photographer"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <SmartDropdown
                                isMultiSelectMode={isMultiSelectMode}
                                label="Camera/Device"
                                options={deviceOptions}
                                value={watch('device') || ""}
                                onChange={(value) => setValue('device', Array.isArray(value) ? value.join(', ') : value)}
                                placeholder="Select camera/device"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(watch('artform') === 'digital_art' || watch('artform') === 'painting') && (
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <SmartDropdown
                                isMultiSelectMode={isMultiSelectMode}
                                label="Art Style"
                                options={artStyleOptions}
                                value={watch('artStyle') || ""}
                                onChange={(value) => setValue('artStyle', Array.isArray(value) ? value.join(', ') : value)}
                                placeholder="Select art style"
                              />
                            </div>
                            
                            <div>
                              <SmartDropdown
                                isMultiSelectMode={isMultiSelectMode}
                                label="Artist"
                                options={artistOptions}
                                value={watch('artist') || ""}
                                onChange={(value) => setValue('artist', Array.isArray(value) ? value.join(', ') : value)}
                                placeholder="Select artist"
                              />
                            </div>
                          </div>
                          
                          {watch('artform') === 'digital_art' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <SmartDropdown
                                  isMultiSelectMode={isMultiSelectMode}
                                  label="Digital Art Form"
                                  options={digitalArtformOptions}
                                  value={watch('digitalArtform') || ""}
                                  onChange={(value) => setValue('digitalArtform', value)}
                                  placeholder="Select digital art form"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Additional Settings Tab Content */}
                {activeTab === 'additional' && (
                  <div className="space-y-6">
                    {/* Detailed Options Categories */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Detailed Options
                      </h3>
                      
                      <div className="text-sm text-gray-400 mb-4">
                        Select specific options from each subcategory to enhance your prompt
                      </div>
                      
                      {/* Detailed Options Categories Selection - buttons that wrap */}
                      <div className="flex flex-wrap gap-2 pb-3">
                        {createDynamicCategories().map((category) => (
                          <button
                            key={category.name}
                            onClick={() => {
                              const accordionElement = document.getElementById(`accordion-${category.name}`);
                              if (accordionElement) {
                                accordionElement.scrollIntoView({ behavior: 'smooth' });
                                // Programmatically click the accordion trigger
                                const triggerElement = accordionElement.querySelector('[data-state]');
                                if (triggerElement) {
                                  (triggerElement as HTMLElement).click();
                                }
                              }
                            }}
                            className="px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 
                              bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            {category.name === 'architecture' ? <MapPin className="h-4 w-4 text-white" /> :
                             category.name === 'art' ? <Palette className="h-4 w-4 text-white" /> :
                             category.name === 'cinematic' ? <Sparkles className="h-4 w-4 text-white" /> :
                             category.name === 'fashion' ? <Shirt className="h-4 w-4 text-white" /> :
                             category.name === 'feelings' ? <Heart className="h-4 w-4 text-white" /> :
                             <Layers className="h-4 w-4 text-white" />}
                            {category.label}
                          </button>
                        ))}
                      </div>
                      
                      {/* Nested Detailed Options Section */}
                      <NestedDetailedOptionsSection
                        categories={createDynamicCategories()}
                        values={detailedOptionValues}
                        isMultiSelectMode={isMultiSelectMode}
                        onChangeValue={(categoryName, subCategoryName, value) => {
                          // Update the nested state
                          setDetailedOptionValues(prev => ({
                            ...prev,
                            [categoryName]: {
                              ...prev[categoryName],
                              [subCategoryName]: value
                            }
                          }));
                          
                          // Also update the form value for the category
                          // This keeps backward compatibility with the existing form structure
                          const updatedValues = {
                            ...detailedOptionValues[categoryName],
                            [subCategoryName]: value
                          };
                          
                          // Convert nested values to string and update form
                          // Use only the values for the prompt (not including subcategory names)
                          const valueString = Object.entries(updatedValues)
                            .filter(([_, val]) => val && val !== "" && val !== "none")
                            .map(([_, val]) => val)
                            .join(", ");
                          
                          // Use the field name pattern used in the current form
                          const fieldName = `${categoryName}Options` as any;
                          setValue(fieldName, valueString);
                          
                          // Force update the live preview by triggering the regenerate function
                          setTimeout(() => {
                            try {
                              generateLivePreview();
                            } catch (err) {
                              console.error("Error regenerating live preview:", err);
                            }
                          }, 50);
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Right column - Generation Controls and Generated Prompt */}
        <div className="lg:col-span-7">
          <div className="mb-6">
            <PanelGroup direction="horizontal" className="gap-4">
              {/* Aspect Ratio & Seed Panel */}
              <Panel defaultSize={80} minSize={20}>
                <div className="rounded-lg border border-transparent p-4 pt-[0px] pb-[0px] h-full pl-[8px] pr-[8px] bg-[#11182700]">
              <div 
                className="flex items-center justify-between p-2 mb-2 bg-purple-900/50 rounded-lg border border-gray-800 cursor-pointer"
                onClick={() => setIsGenerationControlsOpen(!isGenerationControlsOpen)}
              >
                <div>
                  <h3 className="text-base font-semibold">Aspect Ratio & Seed</h3>
                  <p className="text-xs text-gray-400">Configure how prompts are generated</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-800"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${!isGenerationControlsOpen && "-rotate-90"}`} />
                </Button>
              </div>
              
              <div className={cn("bg-purple-900/10 rounded-lg border border-gray-800 overflow-hidden transition-all", isGenerationControlsOpen ? "p-4" : "h-0 p-0 border-transparent")}>
                <div className={cn("transition-opacity", isGenerationControlsOpen ? "opacity-100" : "opacity-0")}>
                <div className="space-y-4">
                  {/* Generation Mode - Full Width */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">Generation Mode</h3>
                    <div className="relative z-[100]">
                      <Dropdown
                        options={[
                          { value: 'Disabled', label: 'Manual Selection' },
                          { value: 'Random', label: 'Full Random' },
                          { value: 'No Figure Rand', label: 'Random (Preserve Character)' }
                        ]}
                        value={watch('globalOption')}
                        onChange={(value) => setValue('globalOption', value)}
                        placeholder="Select generation mode"
                      />
                    </div>
                  </div>
                  
                  {/* Seed Options - Full Width */}
                  <div>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-semibold text-gray-300">Seed</h3>
                        <span className="text-xs text-gray-400">{watch('seed') !== '' ? "Locked" : "Random"}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            const isSeedLocked = watch('seed') !== '';
                            if (!isSeedLocked) {
                              // If we're locking, make sure there's a seed value
                              const newSeed = Math.floor(Math.random() * 10000000);
                              setValue('seed', newSeed.toString());
                            } else {
                              // If unlocking, clear the seed
                              setValue('seed', '');
                            }
                          }}
                          className="bg-transparent border-0 text-gray-200 text-sm flex items-center p-0.5 cursor-pointer hover:text-white"
                        >
                          {watch('seed') !== '' ? '🔒' : '🔓'}
                        </button>
                      </div>
                      
                      <div className="flex w-full max-w-full overflow-hidden">
                        <input 
                          type="number" 
                          className="flex-1 min-w-0 px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-white" 
                          value={watch('seed') || ""}
                          onChange={(e) => {
                            const value = e.target.valueAsNumber;
                            if (!isNaN(value)) {
                              setValue('seed', value.toString());
                            } else {
                              setValue('seed', '');
                            }
                          }}
                          placeholder="Auto-generated"
                          disabled={watch('seed') === ''}
                        />
                        <button 
                          className="flex-shrink-0 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-l-0 border-gray-700 rounded-r-md"
                          onClick={(e) => {
                            e.preventDefault();
                            // Generate a random seed between 1 and 10000000
                            const randomSeed = Math.floor(Math.random() * 10000000) + 1;
                            setValue('seed', randomSeed.toString());
                          }}
                        >
                          <Dices className="h-4 w-4 text-purple-400" />
                        </button>
                      </div>

                    </div>
                  </div>
                  
                  {/* Aspect Ratio Calculator */}
                  <div className="mt-4">
                    <AspectRatioCalculator
                      initialWidth={1024}
                      initialHeight={1024}
                      initialRatio="1:1"
                      onChange={(data) => {
                        // You can use the aspect ratio data here if needed
                        console.log('Aspect ratio changed:', data);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
                </div>
              </div>
              </Panel>

              {/* Resizable Handle */}
              <PanelResizeHandle className="w-1 bg-pink-500/20 hover:bg-purple-500 rounded-full transition-colors duration-200 cursor-col-resize" />

              {/* Model Checkpoint Panel */}
              <Panel defaultSize={80} minSize={20}>
                <div className="rounded-lg border border-transparent p-4 pt-[0px] pb-[0px] h-full pl-[8px] pr-[8px] bg-[#11182700]">
              <div 
                className="flex items-center justify-between p-2 mb-2 bg-purple-900/50 rounded-lg border border-gray-800 cursor-pointer "
                onClick={() => setIsModelInformationOpen(!isModelInformationOpen)}
              >
                <div>
                  <h3 className="text-base font-semibold">Model Checkpoint</h3>
                  <p className="text-xs text-gray-400">Checkpoint Specific Settings</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-800"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${!isModelInformationOpen && "-rotate-90"}`} />
                </Button>
              </div>
              
              <div className={cn("bg-purple-900/10 rounded-lg border border-gray-800 overflow-hidden transition-all", isModelInformationOpen ? "p-4" : "h-0 p-0 border-transparent")}>
                <div className={cn("transition-opacity", isModelInformationOpen ? "opacity-100" : "opacity-0")}>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-300">Model / Checkpoint</h3>
                    </div>
                    <Dropdown
                      options={checkpointOptions}
                      value={selectedCheckpoint?.id?.toString() || ''}
                      onChange={async (value) => {
                        try {
                          // Fetch detailed model information
                          const response = await fetch(`/api/checkpoint-models/${value}`);
                          if (response.ok) {
                            const detailedModel = await response.json();
                            setSelectedCheckpoint(detailedModel);
                            
                            // Update negative prompt if the checkpoint has one
                            if (detailedModel.negative_prompts && detailedModel.negative_prompts.trim() !== '') {
                              setValue('negativePrompt', detailedModel.negative_prompts);
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching model details:', error);
                        }
                      }}
                      placeholder={isLoadingCheckpoints ? "Loading models..." : "Select model"}
                    />
                  </div>
                
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400">CFG Scale</label>
                      <div className="text-sm mt-1">{selectedCheckpoint?.cfg_scale || "7.0"}</div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400">Sampling Steps</label>
                      <div className="text-sm mt-1">{selectedCheckpoint?.steps || "25-30"}</div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400">Sampler</label>
                      <div className="text-sm mt-1">{selectedCheckpoint?.sampler || "DPM++ 2M"}</div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400">Scheduler</label>
                      <div className="text-sm mt-1">{selectedCheckpoint?.scheduler || "Karras"}</div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400">VAE</label>
                      <div className="text-sm mt-1">{selectedCheckpoint?.recommended_vae || "Auto"}</div>
                    </div>
                    
                    {selectedCheckpoint?.civitai_url && (
                      <div>
                        <label className="block text-xs text-gray-400">Model URL</label>
                        <a 
                          href={selectedCheckpoint.civitai_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-purple-400 hover:text-purple-300 underline mt-1 inline-block"
                        >
                          View on Civitai
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {selectedCheckpoint?.prompting_suggestions && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-400">Prompting Tips</label>
                      <div className="text-xs text-gray-300 mt-1 p-2 bg-gray-800/30 rounded border-l-2 border-purple-500">
                        {selectedCheckpoint.prompting_suggestions}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-300 flex items-center">
                        <ShieldX className="h-4 w-4 mr-2 text-orange-400" />
                        Recommended Negative Prompt
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-400 hover:text-white"
                        onClick={() => {
                          const negativePromptValue = watch('negativePrompt') || "";
                          if (negativePromptValue) {
                            navigator.clipboard.writeText(negativePromptValue);
                            toast({
                              title: "Copied!",
                              description: "Negative prompt copied to clipboard",
                              duration: 2000,
                            });
                          }
                        }}
                      >
                        <CopyIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Copy</span>
                      </Button>
                    </div>
                    <Textarea
                      value={watch('negativePrompt') || ""}
                      onChange={(e) => setValue('negativePrompt', e.target.value)}
                      placeholder="Enter elements to exclude from the generated image"
                      className="bg-gray-800/50 border-gray-700 mt-1 resize-y overflow-hidden"
                      rows={4}
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    />
                  </div>
                </div>
                </div>
              </div>
                </div>
              </Panel>
            </PanelGroup>
          </div>
          
          {/* Live Prompt Preview - Admin only */}
          {isAdminMode && (
            <div className="bg-gray-900 bg-gradient-to-br from-purple-900/30 to-blue-900/10 border border-purple-700/50 rounded-md p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium text-white flex items-center">
                  <EyeIcon className="h-4 w-4 mr-2 text-purple-400" />
                  Live Prompt Preview
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-purple-400 hover:text-white"
                    onClick={() => {
                      if (livePrompt) {
                        navigator.clipboard.writeText(livePrompt);
                        toast({
                          title: "Copied!",
                          description: "Prompt copied to clipboard",
                          duration: 2000,
                        });
                      }
                    }}
                  >
                    <CopyIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs">Copy</span>
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-950 bg-gradient-to-br from-purple-950/50 to-gray-950 rounded border border-purple-800/50 p-3 max-h-[150px] overflow-y-auto">
                <p className="text-sm text-purple-300 font-mono whitespace-pre-wrap">
                  {livePrompt || "Your prompt will appear here as you configure settings..."}
                </p>
              </div>
            </div>
          )}

          
          {/* Generate Button and Generated Prompt Section */}
          <div className="space-y-6">
            {/* Generated Prompt Output Section */}
            <div className="glass-card p-6 bg-gray-900 bg-gradient-to-br from-purple-900/20 to-blue-900/10 border border-purple-700/40 rounded-lg">
              <div className="space-y-4">
                {/* Generated Prompt Display */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-medium block">Generated Prompt</label>
                    {generatedPrompt && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPrompt.prompt);
                          toast({
                            title: "Copied!",
                            description: "Prompt copied to clipboard",
                            duration: 2000,
                          });
                        }}
                        className="text-purple-400 hover:text-white transition-colors"
                        data-testid="button-copy-prompt"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Textarea
                    value={generatedPrompt?.prompt || ""}
                    readOnly
                    className="w-full glass-input bg-gray-800 bg-gradient-to-br from-purple-900/20 to-gray-800 rounded-lg p-3 min-h-[120px] resize-none border border-purple-800/30 text-purple-300 font-mono"
                    placeholder="Your generated prompt will appear here..."
                    data-testid="output-generated-prompt"
                  />
                </div>

                {/* Negative Prompt Display */}
                {generatedPrompt?.negativePrompt && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-purple-400 text-sm font-medium block">Negative Prompt</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPrompt.negativePrompt || "");
                          toast({
                            title: "Copied!",
                            description: "Negative prompt copied to clipboard",
                            duration: 2000,
                          });
                        }}
                        className="text-purple-400 hover:text-white transition-colors"
                        data-testid="button-copy-negative"
                      >
                        <CopyIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <Textarea
                      value={generatedPrompt.negativePrompt || ""}
                      readOnly
                      className="w-full glass-input bg-gray-800 bg-gradient-to-br from-purple-900/20 to-gray-800 rounded-lg p-3 min-h-[80px] resize-none border border-purple-800/30 text-purple-400 text-sm font-mono"
                      placeholder="Negative prompt will appear here..."
                      data-testid="output-negative-prompt"
                    />
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  className="w-full btn-purple-grad bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                  onClick={generatePrompt}
                  disabled={isGenerating}
                  data-testid="button-generate-prompt"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Enhanced Rule Template Processor */}
            <div className="mt-8 space-y-4">
              <AnimatedCard>
              <div className="bg-gray-900 bg-gradient-to-br from-purple-900/20 to-blue-900/10 border border-purple-700/40 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Enhanced Rule Templates</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-800/50 transition-all duration-300"
                    onClick={() => {
                      if (ruleTemplates.length > 0) {
                        const randomTemplate = ruleTemplates[Math.floor(Math.random() * ruleTemplates.length)];
                        setSelectedTemplates([randomTemplate]);
                        toast({
                          title: "Random Template Selected",
                          description: `Selected template: "${randomTemplate.name}"`,
                          duration: 3000,
                        });
                      } else {
                        toast({
                          title: "No Templates Available",
                          description: "No rule templates available for random selection",
                          variant: "destructive",
                          duration: 3000,
                        });
                      }
                    }}
                  >
                    <Dices className="h-4 w-4 text-pink-400" style={{
                      filter: 'drop-shadow(0 0 1px #8b5cf6)'
                    }} />
                  </Button>
                  <div className="text-xs text-purple-400 bg-purple-900/30 border border-purple-700/30 px-2 py-1 rounded">
                    AI-Powered Enhancement
                  </div>
                </div>

                {/* Template Selection Interface */}
                <div className="mb-6 space-y-3">
                  <div className="text-sm text-slate-300 mb-2">
                    Select templates to enhance your prompt with AI-powered processing:
                  </div>
                  
                  {isLoadingTemplates ? (
                    <div className="text-center py-4">
                      <div className="text-slate-400">Loading templates...</div>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <div className="space-y-4">
                        {/* Favorites Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm font-medium text-slate-300">Favorites</span>
                            <span className="text-xs text-slate-500">({getOrderedTemplates().favoriteTemplates.length})</span>
                          </div>
                          <Droppable droppableId="favorites">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                  "min-h-[60px] p-3 rounded-lg border-2 border-dashed transition-colors",
                                  snapshot.isDraggingOver 
                                    ? "border-yellow-400 bg-yellow-400/10" 
                                    : "border-slate-700 bg-slate-900/30"
                                )}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {getOrderedTemplates().favoriteTemplates.map((template: any, index: number) => (
                                    <Draggable key={`favorite-${template.id}`} draggableId={template.id.toString()} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={cn(
                                            "transition-all cursor-grab",
                                            snapshot.isDragging && "rotate-2 scale-105 cursor-grabbing"
                                          )}
                                        >
                                          <TooltipProvider delayDuration={500}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="w-full relative">
                                                  {/* Drag Handle */}
                                                  <div
                                                    {...provided.dragHandleProps}
                                                    className="absolute left-0 top-0 bottom-0 w-4 bg-pink-700/40 hover:bg-slate-600 cursor-grab flex items-center justify-center rounded-l-md z-10"
                                                  >
                                                    <MoreHorizontal className="h-3 w-3 text-slate-400 rotate-90" />
                                                  </div>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={cn(
                                                          "h-auto p-2 pl-6 text-left justify-start text-xs overflow-hidden w-full relative group",
                                                          selectedTemplates.some(t => t.id === template.id) 
                                                            ? "bg-purple-600/20 border-purple-500/10 text-purple-300 hover:bg-purple-600/30" 
                                                            : "hover:bg-slate-800/50"
                                                        )}
                                                        onClick={() => {
setSelectedTemplates(prev => {
                                                        const exists = prev.find(t => t.id === template.id);
                                                        if (exists) {
                                                          return prev.filter(t => t.id !== template.id);
                                                        } else {
                                                          return [...prev, template];
                                                        }
                                                      });
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2 w-full overflow-hidden">
                                                      <Star className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                                                      <span className="font-medium text-xs truncate">{template.name}</span>
                                                    </div>
                                                  </Button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleTemplateFavorite(template.id.toString());
                                                    }}
                                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded cursor-pointer z-10"
                                                  >
                                                    <HeartOff className="h-3 w-3 text-slate-400" />
                                                  </button>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-xs z-50">
                                                <p>{template.template || template.description || `${template.template_type} enhancement`}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                </div>
                                {provided.placeholder}
                                {getOrderedTemplates().favoriteTemplates.length === 0 && (
                                  <div className="text-center text-slate-500 text-sm py-4">
                                    Drag templates here to mark as favorites
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-700/50"></div>

                        {/* Regular Templates Section */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-300">All Templates</span>
                              <span className="text-xs text-slate-500">({getOrderedTemplates().regularTemplates.length})</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsAllTemplatesOpen(!isAllTemplatesOpen)}
                              className="h-6 w-6 p-0 hover:bg-slate-800"
                            >
                              <ChevronDown className={cn("h-4 w-4 transition-transform", !isAllTemplatesOpen && "-rotate-90")} />
                            </Button>
                          </div>
                          {isAllTemplatesOpen && (
                            <Droppable droppableId="regular">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={cn(
                                    "min-h-[120px] p-3 rounded-lg border-2 border-dashed transition-colors",
                                    snapshot.isDraggingOver 
                                      ? "border-slate-400 bg-slate-400/10" 
                                      : "border-slate-700 bg-slate-900/30"
                                  )}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {getOrderedTemplates().regularTemplates.map((template: any, index: number) => (
                                      <Draggable key={`regular-${template.id}`} draggableId={template.id.toString()} index={index}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={cn(
                                              "transition-all cursor-grab",
                                              snapshot.isDragging && "rotate-2 scale-105 cursor-grabbing"
                                            )}
                                          >
                                            <TooltipProvider delayDuration={500}>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <div className="w-full relative">
                                                    {/* Drag Handle */}
                                                    <div
                                                      {...provided.dragHandleProps}
                                                      className="absolute left-0 top-0 bottom-0 w-4 bg-pink-700/30 hover:bg-slate-600/00 cursor-grab flex items-center justify-center rounded-l-md z-10"
                                                    >
                                                      <MoreHorizontal className="h-3 w-3 text-slate-400 rotate-90" />
                                                    </div>
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      className={cn(
                                                        "h-auto p-2 pl-6 text-left justify-start text-xs overflow-hidden w-full relative group",
                                                        selectedTemplates.some(t => t.id === template.id) 
                                                          ? "bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30" 
                                                          : "hover:bg-slate-800"
                                                      )}
                                                      onClick={() => {
                                                        setSelectedTemplates(prev => {
                                                          const exists = prev.find(t => t.id === template.id);
                                                          if (exists) {
                                                            return prev.filter(t => t.id !== template.id);
                                                          } else {
                                                            return [...prev, template];
                                                          }
                                                        });
                                                      }}
                                                    >
                                                      <div className="flex items-center gap-2 w-full overflow-hidden">
                                                        <FileText className={cn(
                                                          "h-3 w-3 flex-shrink-0",
                                                          selectedTemplates.some(t => t.id === template.id) 
                                                            ? "text-purple-400" 
                                                            : "text-slate-400"
                                                        )} />
                                                        <span className={cn(
                                                          "font-medium text-xs truncate",
                                                          selectedTemplates.some(t => t.id === template.id) 
                                                            ? "text-purple-200 font-semibold" 
                                                            : "text-slate-200"
                                                        )}>{template.name}</span>
                                                      </div>
                                                    </Button>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTemplateFavorite(template.id.toString());
                                                      }}
                                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-800 rounded cursor-pointer z-10"
                                                    >
                                                      <Heart className="h-3 w-3 text-slate-400" />
                                                    </button>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs z-50">
                                                  <p>{template.template || template.description || `${template.template_type} enhancement`}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          )}
                        </div>
                      </div>
                      
                      {selectedTemplates.length > 0 && (
                        <div className="text-xs text-green-400 flex items-center gap-1 mt-3">
                          <Sparkles className="h-3 w-3" />
                          {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selected for enhancement
                        </div>
                      )}
                    </DragDropContext>
                  )}
                </div>
                
                <TemplateProcessor
                  selectedTemplates={selectedTemplates}
                  userPrompt={livePrompt}
                  className="space-y-4"
                  onResultsGenerated={(results) => {
                    toast({
                      title: "Templates Processed!",
                      description: `Generated ${results.length} enhanced prompts`,
                      duration: 3000,
                    });
                  }}
                  onRecall={(result) => {
                    // Recall the result back to the live prompt
                    setLivePrompt(result.prompt);
                    toast({
                      title: "Prompt Recalled",
                      description: "Enhanced prompt loaded into editor",
                      duration: 2000,
                    });
                  }}
                  onSendToGenerator={(result) => {
                    // Send to the main generator
                    setGeneratedPrompt({
                      prompt: result.prompt,
                      negativePrompt: result.negativePrompt || "",
                      timestamp: new Date().toISOString(),
                      settings: {}
                    });
                    toast({
                      title: "Sent to Generator",
                      description: "Enhanced prompt ready for use",
                      duration: 2000,
                    });
                  }}
                  onSaveToLibrary={(result) => {
                    // Set current result and open ShareToLibraryModal
                    setCurrentSaveResult(result);
                    setShareModalOpen(true);
                  }}
                  onShare={(result) => {
                    navigator.clipboard.writeText(result.prompt);
                    toast({
                      title: "Copied to Clipboard",
                      description: "Enhanced prompt ready to share",
                      duration: 2000,
                    });
                  }}
                />
              </div>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        description={confirmationModal.description}
        variant={confirmationModal.variant}
        confirmText={confirmationModal.confirmText}
        showDontShowAgain={true}
        onDontShowAgainChange={(dontShow) => {
          if (dontShow) {
            localStorage.setItem(`hide-confirmation-${confirmationModal.title.toLowerCase().replace(/\s+/g, '-')}`, 'true');
          }
        }}
      />

      {/* Compact Character Save Dialog */}
      <CompactCharacterSaveDialog
        isOpen={characterSaveDialogOpen}
        onClose={() => setCharacterSaveDialogOpen(false)}
        onSuccess={() => {
          // Refresh character presets
          refetchCharacterPresets();
        }}
        customCharacterInput={currentCharacterDescription}
      />

      {/* ShareToLibraryModal */}
      {currentSaveResult && (
        <ShareToLibraryModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          promptData={{
            id: 0, // Temporary ID for new prompt
            name: `Enhanced Prompt: ${currentSaveResult.prompt.slice(0, 30)}${currentSaveResult.prompt.length > 30 ? '...' : ''}`,
            positive_prompt: currentSaveResult.prompt,
            negative_prompt: currentSaveResult.negativePrompt || '',
            tags: [],
            template_name: currentSaveResult.templateName || 'Enhanced Template',
            character_preset: null
          }}
          onShare={(shareData) => {
            saveToUserLibraryMutation.mutate({
              name: shareData.title,
              positive_prompt: currentSaveResult.prompt,
              negative_prompt: currentSaveResult.negativePrompt || '',
              description: shareData.description,
              tags: shareData.tags,
              category_id: shareData.category_id,
              user_id: "1"
            });
          }}
          categories={promptCategories}
          isLoading={saveToUserLibraryMutation.isPending}
          onNavigateToShared={() => {
            // Navigate to user's prompt library  
            window.location.href = '/prompts';
          }}
        />
      )}
    </>
  );
}